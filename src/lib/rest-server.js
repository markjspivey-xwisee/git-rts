/**
 * REST Server Module
 * 
 * Provides a RESTful API server for Git-RTS
 * - Implements HATEOAS principles
 * - Provides content negotiation
 * - Integrates with Hydra vocabulary
 * - Connects to Git operations
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises;
const apiManager = require('./api-manager');
const entityManager = require('./entity-manager');
const peerManager = require('./peer-manager');

// Default paths
const DEFAULT_GAME_REPO_DIR = process.env.GAME_REPO_DIR || path.join(process.cwd(), 'game-repo');

/**
 * Create a REST API server
 * 
 * @param {Object} options - Server options
 * @returns {Object} - Express app and server
 */
function createServer(options = {}) {
  const app = express();
  const port = options.port || process.env.PORT || 3000;
  
  // Middleware
  app.use(cors());
  app.use(express.json());
  
  // Content negotiation middleware
  app.use((req, res, next) => {
    // Set default content type to JSON-LD
    req.preferredFormat = 'application/ld+json';
    
    // Check Accept header
    const accept = req.headers.accept;
    if (accept) {
      if (accept.includes('text/turtle')) {
        req.preferredFormat = 'text/turtle';
      } else if (accept.includes('application/n-triples')) {
        req.preferredFormat = 'application/n-triples';
      }
    }
    
    // Add response formatter
    res.format = (data) => {
      switch (req.preferredFormat) {
        case 'text/turtle':
          res.set('Content-Type', 'text/turtle');
          if (data.toTurtle) {
            res.send(data.toTurtle());
          } else {
            // Convert JSON-LD to Turtle (simplified)
            let turtle = '@prefix game: <http://example.org/game#>.\n';
            turtle += '@prefix hydra: <http://www.w3.org/ns/hydra/core#>.\n\n';
            
            // Add basic triples
            if (data['@id']) {
              turtle += `<${data['@id']}> a ${data['@type']};\n`;
              
              // Add properties
              for (const [key, value] of Object.entries(data)) {
                if (!key.startsWith('@') && key !== '_links') {
                  if (typeof value === 'string') {
                    turtle += `  game:${key} "${value}";\n`;
                  } else if (typeof value === 'number') {
                    turtle += `  game:${key} ${value};\n`;
                  }
                }
              }
              
              // Remove trailing semicolon and add period
              turtle = turtle.slice(0, -2) + '.\n';
            }
            
            res.send(turtle);
          }
          break;
        
        case 'application/n-triples':
          res.set('Content-Type', 'application/n-triples');
          // Simplified conversion to N-Triples
          let triples = '';
          if (data['@id']) {
            const subject = `<${data['@id']}>`;
            triples += `${subject} <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <${data['@type']}>.\n`;
            
            // Add properties
            for (const [key, value] of Object.entries(data)) {
              if (!key.startsWith('@') && key !== '_links') {
                if (typeof value === 'string') {
                  triples += `${subject} <http://example.org/game#${key}> "${value}".\n`;
                } else if (typeof value === 'number') {
                  triples += `${subject} <http://example.org/game#${key}> "${value}"^^<http://www.w3.org/2001/XMLSchema#integer>.\n`;
                }
              }
            }
          }
          
          res.send(triples);
          break;
        
        default:
          // Default to JSON-LD
          res.set('Content-Type', 'application/ld+json');
          res.json(data);
      }
    };
    
    next();
  });
  
  // Error handling middleware
  app.use((err, req, res, next) => {
    console.error(err.stack);
    
    const error = apiManager.createHydraError(
      'Internal Server Error',
      err.message,
      500
    );
    
    res.status(500).format(error);
  });
  
  // API Documentation
  app.get('/api-doc', async (req, res) => {
    try {
      const apiDoc = await apiManager.getApiDocumentation();
      res.format(apiDoc);
    } catch (error) {
      next(error);
    }
  });
  
  // API Entry Point
  app.get('/', async (req, res) => {
    try {
      const entryPoint = await apiManager.getEntryPoint();
      res.format(entryPoint);
    } catch (error) {
      next(error);
    }
  });
  
  // World
  app.get('/world', async (req, res) => {
    try {
      const world = await apiManager.getWorld(DEFAULT_GAME_REPO_DIR);
      res.format(world);
    } catch (error) {
      next(error);
    }
  });
  
  // Players
  app.get('/players', async (req, res) => {
    try {
      const players = await apiManager.getPlayers(DEFAULT_GAME_REPO_DIR);
      res.format(players);
    } catch (error) {
      next(error);
    }
  });
  
  app.get('/players/:playerId', async (req, res) => {
    try {
      const player = await apiManager.getPlayer(req.params.playerId, DEFAULT_GAME_REPO_DIR);
      res.format(player);
    } catch (error) {
      next(error);
    }
  });
  
  // Units
  app.get('/units', async (req, res) => {
    try {
      const units = await apiManager.getUnits(DEFAULT_GAME_REPO_DIR);
      res.format(units);
    } catch (error) {
      next(error);
    }
  });
  
  app.get('/units/:unitId', async (req, res) => {
    try {
      const unit = await apiManager.getUnit(req.params.unitId, DEFAULT_GAME_REPO_DIR);
      res.format(unit);
    } catch (error) {
      next(error);
    }
  });
  
  app.post('/players/:playerId/create-unit', async (req, res) => {
    try {
      const unit = await apiManager.createUnit(req.params.playerId, req.body, DEFAULT_GAME_REPO_DIR);
      res.status(201).format(unit);
    } catch (error) {
      next(error);
    }
  });
  
  app.post('/units/:unitId/move', async (req, res) => {
    try {
      const unit = await apiManager.moveUnit(req.params.unitId, req.body, DEFAULT_GAME_REPO_DIR);
      res.format(unit);
    } catch (error) {
      next(error);
    }
  });
  
  app.post('/units/:unitId/apply-decorator', async (req, res) => {
    try {
      const unit = await apiManager.applyDecorator(req.params.unitId, req.body, DEFAULT_GAME_REPO_DIR);
      res.format(unit);
    } catch (error) {
      next(error);
    }
  });
  
  // Peers
  app.get('/peers', async (req, res) => {
    try {
      const peers = await apiManager.getPeers();
      res.format(peers);
    } catch (error) {
      next(error);
    }
  });
  
  app.post('/peers', async (req, res) => {
    try {
      const peer = await apiManager.addPeer(req.body);
      res.status(201).format(peer);
    } catch (error) {
      next(error);
    }
  });
  
  app.post('/peers/sync-all', async (req, res) => {
    try {
      const results = await apiManager.syncWithPeers(DEFAULT_GAME_REPO_DIR);
      res.format(results);
    } catch (error) {
      next(error);
    }
  });
  
  app.post('/peers/:peerName/sync', async (req, res) => {
    try {
      const result = await peerManager.syncWithPeer(req.params.peerName, DEFAULT_GAME_REPO_DIR);
      
      const response = {
        "@context": {
          "game": "http://example.org/game#",
          "hydra": "http://www.w3.org/ns/hydra/core#"
        },
        "@type": "game:SyncResult",
        "success": result.success,
        "message": result.message || result.error,
        "peer": {
          "name": result.peer.name,
          "url": result.peer.url,
          "status": result.peer.status,
          "lastSync": result.peer.lastSync
        },
        "_links": {
          "self": { "href": `/peers/${req.params.peerName}/sync` },
          "peer": { "href": `/peers/${req.params.peerName}` },
          "allPeers": { "href": "/peers" }
        }
      };
      
      res.format(response);
    } catch (error) {
      next(error);
    }
  });
  
  // Serve static files from the game repository
  app.use('/repo', express.static(DEFAULT_GAME_REPO_DIR));
  
  // Start the server
  const server = app.listen(port, () => {
    console.log(`Git-RTS REST API server running on port ${port}`);
  });
  
  return { app, server };
}

module.exports = {
  createServer
};