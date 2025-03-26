/**
 * API Manager Module
 * 
 * Manages the RESTful Hypermedia API for Git-RTS
 * - Implements HATEOAS principles
 * - Provides content negotiation
 * - Integrates with Hydra vocabulary
 * - Connects to Git operations
 */

const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const entityManager = require('./entity-manager');
const peerManager = require('./peer-manager');

// Default paths
const DEFAULT_GAME_REPO_DIR = process.env.GAME_REPO_DIR || path.join(process.cwd(), 'game-repo');
const DEFAULT_API_DOC_FILE = path.join(DEFAULT_GAME_REPO_DIR, 'api-doc.jsonld');

/**
 * API Context for JSON-LD responses
 */
const API_CONTEXT = {
  "game": "http://example.org/game#",
  "hydra": "http://www.w3.org/ns/hydra/core#",
  "xsd": "http://www.w3.org/2001/XMLSchema#",
  "rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
  "rdfs": "http://www.w3.org/2000/01/rdf-schema#",
  "owl": "http://www.w3.org/2002/07/owl#"
};

/**
 * Generate hypermedia links for a resource
 * 
 * @param {string} resourceType - Type of resource
 * @param {string} resourceId - ID of the resource
 * @param {Array} actions - Available actions for this resource
 * @returns {Object} - Object containing hypermedia links
 */
function generateLinks(resourceType, resourceId, actions = []) {
  const links = {
    self: { href: `/${resourceType}s/${resourceId}` }
  };
  
  // Add links for each action
  for (const action of actions) {
    links[action.name] = {
      href: `/${resourceType}s/${resourceId}/${action.name}`,
      method: action.method || 'POST'
    };
    
    // Add expected parameters if provided
    if (action.expects) {
      links[action.name].expects = action.expects;
    }
  }
  
  return links;
}

/**
 * Create a Hydra Collection
 * 
 * @param {string} collectionType - Type of collection
 * @param {Array} members - Members of the collection
 * @param {number} totalItems - Total number of items in the collection
 * @param {number} pageSize - Number of items per page
 * @param {number} pageIndex - Current page index
 * @returns {Object} - Hydra Collection object
 */
function createHydraCollection(collectionType, members, totalItems, pageSize = 10, pageIndex = 0) {
  const collection = {
    "@context": API_CONTEXT,
    "@type": ["hydra:Collection", `game:${collectionType}Collection`],
    "hydra:totalItems": totalItems,
    "hydra:member": members,
    "_links": {
      self: { href: `/${collectionType}s?page=${pageIndex}&pageSize=${pageSize}` }
    }
  };
  
  // Add pagination links
  if (pageIndex > 0) {
    collection._links.previous = { href: `/${collectionType}s?page=${pageIndex - 1}&pageSize=${pageSize}` };
  }
  
  if ((pageIndex + 1) * pageSize < totalItems) {
    collection._links.next = { href: `/${collectionType}s?page=${pageIndex + 1}&pageSize=${pageSize}` };
  }
  
  return collection;
}

/**
 * Create a Hydra Error
 * 
 * @param {string} title - Error title
 * @param {string} detail - Error detail
 * @param {number} status - HTTP status code
 * @returns {Object} - Hydra Error object
 */
function createHydraError(title, detail, status) {
  return {
    "@context": API_CONTEXT,
    "@type": "hydra:Error",
    "hydra:title": title,
    "hydra:detail": detail,
    "hydra:statusCode": status
  };
}

/**
 * Get API documentation
 * 
 * @param {string} apiDocFile - Path to the API documentation file
 * @returns {Promise<Object>} - API documentation object
 */
async function getApiDocumentation(apiDocFile = DEFAULT_API_DOC_FILE) {
  try {
    const data = await fs.readFile(apiDocFile, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    throw new Error(`Failed to load API documentation: ${error.message}`);
  }
}

/**
 * Get API entry point
 * 
 * @returns {Promise<Object>} - API entry point object
 */
async function getEntryPoint() {
  const entryPoint = {
    "@context": API_CONTEXT,
    "@id": "/",
    "@type": "hydra:EntryPoint",
    "_links": {
      self: { href: "/" },
      world: { href: "/world" },
      players: { href: "/players" },
      units: { href: "/units" },
      buildings: { href: "/buildings" },
      resourceNodes: { href: "/resource-nodes" },
      technologies: { href: "/technologies" },
      alliances: { href: "/alliances" },
      documentation: { href: "/api-doc" }
    }
  };
  
  return entryPoint;
}

/**
 * Get world information
 * 
 * @param {string} gameRepoDir - Path to the game repository
 * @returns {Promise<Object>} - World object
 */
async function getWorld(gameRepoDir = DEFAULT_GAME_REPO_DIR) {
  try {
    // Read the world.ttl file
    const worldFilePath = path.join(gameRepoDir, 'world.ttl');
    const worldData = await fs.readFile(worldFilePath, 'utf8');
    
    // Extract world properties
    const nameMatch = worldData.match(/game:name "([^"]+)"/);
    const sizeMatch = worldData.match(/game:size (\d+)/);
    
    const world = {
      "@context": API_CONTEXT,
      "@id": "/world",
      "@type": "game:World",
      "name": nameMatch ? nameMatch[1] : "Default World",
      "size": sizeMatch ? parseInt(sizeMatch[1]) : 100,
      "_links": {
        self: { href: "/world" },
        players: { href: "/players" },
        units: { href: "/units" },
        buildings: { href: "/buildings" },
        resourceNodes: { href: "/resource-nodes" }
      }
    };
    
    return world;
  } catch (error) {
    throw new Error(`Failed to get world information: ${error.message}`);
  }
}

/**
 * Get player information
 * 
 * @param {string} playerId - ID of the player
 * @param {string} gameRepoDir - Path to the game repository
 * @returns {Promise<Object>} - Player object
 */
async function getPlayer(playerId, gameRepoDir = DEFAULT_GAME_REPO_DIR) {
  try {
    // Read the player_resources.ttl file
    const playerFilePath = path.join(gameRepoDir, `${playerId}_resources.ttl`);
    const playerData = await fs.readFile(playerFilePath, 'utf8');
    
    // Extract player properties
    const goldMatch = playerData.match(/game:gold (\d+)/);
    const woodMatch = playerData.match(/game:wood (\d+)/);
    const stoneMatch = playerData.match(/game:stone (\d+)/);
    const foodMatch = playerData.match(/game:food (\d+)/);
    
    const player = {
      "@context": API_CONTEXT,
      "@id": `/players/${playerId}`,
      "@type": "game:Player",
      "id": playerId,
      "gold": goldMatch ? parseInt(goldMatch[1]) : 0,
      "wood": woodMatch ? parseInt(woodMatch[1]) : 0,
      "stone": stoneMatch ? parseInt(stoneMatch[1]) : 0,
      "food": foodMatch ? parseInt(foodMatch[1]) : 0,
      "_links": {
        self: { href: `/players/${playerId}` },
        units: { href: `/players/${playerId}/units` },
        buildings: { href: `/players/${playerId}/buildings` },
        technologies: { href: `/players/${playerId}/technologies` },
        alliances: { href: `/players/${playerId}/alliances` },
        createUnit: {
          href: `/players/${playerId}/create-unit`,
          method: "POST",
          expects: {
            unitType: "string",
            x: "number",
            y: "number"
          }
        },
        createBuilding: {
          href: `/players/${playerId}/create-building`,
          method: "POST",
          expects: {
            buildingType: "string",
            x: "number",
            y: "number"
          }
        },
        research: {
          href: `/players/${playerId}/research`,
          method: "POST",
          expects: {
            technologyId: "string"
          }
        }
      }
    };
    
    return player;
  } catch (error) {
    throw new Error(`Failed to get player information: ${error.message}`);
  }
}

/**
 * Get all players
 * 
 * @param {string} gameRepoDir - Path to the game repository
 * @returns {Promise<Object>} - Players collection
 */
async function getPlayers(gameRepoDir = DEFAULT_GAME_REPO_DIR) {
  try {
    // Get all player resource files
    const files = await fs.readdir(gameRepoDir);
    const playerFiles = files.filter(file => file.match(/^.*_resources\.ttl$/));
    
    const players = [];
    for (const file of playerFiles) {
      const playerId = file.replace('_resources.ttl', '');
      const player = await getPlayer(playerId, gameRepoDir);
      players.push({
        "@id": player["@id"],
        "@type": player["@type"],
        "id": player.id,
        "_links": {
          self: { href: `/players/${playerId}` }
        }
      });
    }
    
    return createHydraCollection('player', players, players.length);
  } catch (error) {
    throw new Error(`Failed to get players: ${error.message}`);
  }
}

/**
 * Get unit information
 * 
 * @param {string} unitId - ID of the unit
 * @param {string} gameRepoDir - Path to the game repository
 * @returns {Promise<Object>} - Unit object
 */
async function getUnit(unitId, gameRepoDir = DEFAULT_GAME_REPO_DIR) {
  try {
    const unit = await entityManager.loadEntity(unitId, gameRepoDir);
    
    // Convert to JSON-LD with hypermedia controls
    const unitJsonLd = unit.toJsonLd();
    
    // Add additional links based on capabilities
    const capabilities = unit.getCapabilities();
    for (const capability of capabilities) {
      unitJsonLd._links[capability] = {
        href: `/units/${unitId}/${capability}`,
        method: "POST"
      };
    }
    
    return unitJsonLd;
  } catch (error) {
    throw new Error(`Failed to get unit information: ${error.message}`);
  }
}

/**
 * Get all units
 * 
 * @param {string} gameRepoDir - Path to the game repository
 * @returns {Promise<Object>} - Units collection
 */
async function getUnits(gameRepoDir = DEFAULT_GAME_REPO_DIR) {
  try {
    // Get all player unit files
    const files = await fs.readdir(gameRepoDir);
    const unitFiles = files.filter(file => file.match(/^.*_units\.ttl$/));
    
    let units = [];
    for (const file of unitFiles) {
      const fileContent = await fs.readFile(path.join(gameRepoDir, file), 'utf8');
      
      // Extract unit IDs
      const unitIdRegex = /game:(unit_[a-zA-Z0-9_]+) a game:Unit/g;
      let match;
      while ((match = unitIdRegex.exec(fileContent)) !== null) {
        const unitId = match[1];
        try {
          const unit = await getUnit(unitId, gameRepoDir);
          units.push({
            "@id": unit["@id"],
            "@type": unit["@type"],
            "id": unitId,
            "unitType": unit.unitType,
            "x": unit.x,
            "y": unit.y,
            "owner": unit.owner,
            "_links": {
              self: { href: `/units/${unitId}` }
            }
          });
        } catch (error) {
          console.error(`Error loading unit ${unitId}: ${error.message}`);
        }
      }
    }
    
    return createHydraCollection('unit', units, units.length);
  } catch (error) {
    throw new Error(`Failed to get units: ${error.message}`);
  }
}

/**
 * Create a new unit
 * 
 * @param {string} playerId - ID of the player
 * @param {Object} unitData - Unit data
 * @param {string} gameRepoDir - Path to the game repository
 * @returns {Promise<Object>} - Created unit
 */
async function createUnit(playerId, unitData, gameRepoDir = DEFAULT_GAME_REPO_DIR) {
  try {
    // Create a new unit entity
    const unit = new entityManager.Unit(
      null, // Generate a new ID
      unitData.unitType,
      unitData.x,
      unitData.y,
      playerId,
      unitData.health || 100,
      unitData.attack || 1,
      unitData.defense || 1
    );
    
    // Save the unit to the repository
    await entityManager.saveEntity(unit, gameRepoDir);
    
    // Return the unit with hypermedia controls
    return unit.toJsonLd();
  } catch (error) {
    throw new Error(`Failed to create unit: ${error.message}`);
  }
}

/**
 * Move a unit
 * 
 * @param {string} unitId - ID of the unit
 * @param {Object} moveData - Move data
 * @param {string} gameRepoDir - Path to the game repository
 * @returns {Promise<Object>} - Updated unit
 */
async function moveUnit(unitId, moveData, gameRepoDir = DEFAULT_GAME_REPO_DIR) {
  try {
    // Load the unit
    const unit = await entityManager.loadEntity(unitId, gameRepoDir);
    
    // Check if the unit has a flying capability
    const capabilities = unit.getCapabilities();
    if (capabilities.includes('fly')) {
      // Use the fly capability
      for (const decorator of unit.decorators) {
        if (decorator.capabilities.some(cap => cap.name === 'fly')) {
          const flyImplementation = decorator.capabilities.find(cap => cap.name === 'fly').implementation;
          flyImplementation(unit, moveData.x, moveData.y);
        }
      }
    } else {
      // Regular movement
      unit.x = moveData.x;
      unit.y = moveData.y;
    }
    
    // Save the updated unit
    await entityManager.saveEntity(unit, gameRepoDir);
    
    // Return the updated unit with hypermedia controls
    return unit.toJsonLd();
  } catch (error) {
    throw new Error(`Failed to move unit: ${error.message}`);
  }
}

/**
 * Apply a decorator to a unit
 * 
 * @param {string} unitId - ID of the unit
 * @param {Object} decoratorData - Decorator data
 * @param {string} gameRepoDir - Path to the game repository
 * @returns {Promise<Object>} - Updated unit
 */
async function applyDecorator(unitId, decoratorData, gameRepoDir = DEFAULT_GAME_REPO_DIR) {
  try {
    // Load the unit
    const unit = await entityManager.loadEntity(unitId, gameRepoDir);
    
    // Create the decorator
    const decorator = entityManager.createDecorator(
      decoratorData.type,
      decoratorData.properties || {}
    );
    
    // Apply the decorator to the unit
    unit.applyDecorator(decorator);
    
    // Save the decorator
    await entityManager.saveDecorator(decorator, unitId, gameRepoDir);
    
    // Save the updated unit
    await entityManager.saveEntity(unit, gameRepoDir);
    
    // Return the updated unit with hypermedia controls
    return unit.toJsonLd();
  } catch (error) {
    throw new Error(`Failed to apply decorator: ${error.message}`);
  }
}

/**
 * Synchronize with peers
 * 
 * @param {string} gameRepoDir - Path to the game repository
 * @returns {Promise<Object>} - Sync results
 */
async function syncWithPeers(gameRepoDir = DEFAULT_GAME_REPO_DIR) {
  try {
    const results = await peerManager.syncWithAllPeers(gameRepoDir);
    
    return {
      "@context": API_CONTEXT,
      "@type": "game:SyncResults",
      "results": results,
      "_links": {
        self: { href: "/sync" },
        peers: { href: "/peers" }
      }
    };
  } catch (error) {
    throw new Error(`Failed to sync with peers: ${error.message}`);
  }
}

/**
 * Get all peers
 * 
 * @returns {Promise<Object>} - Peers collection
 */
async function getPeers() {
  try {
    const peers = await peerManager.listPeers();
    
    const peersCollection = {
      "@context": API_CONTEXT,
      "@type": ["hydra:Collection", "game:PeerCollection"],
      "hydra:totalItems": peers.length,
      "hydra:member": peers.map(peer => ({
        "@type": "game:Peer",
        "name": peer.name,
        "url": peer.url,
        "status": peer.status,
        "lastSync": peer.lastSync,
        "_links": {
          self: { href: `/peers/${peer.name}` },
          sync: { href: `/peers/${peer.name}/sync`, method: "POST" },
          push: { href: `/peers/${peer.name}/push`, method: "POST" },
          status: { href: `/peers/${peer.name}/status` }
        }
      })),
      "_links": {
        self: { href: "/peers" },
        add: {
          href: "/peers",
          method: "POST",
          expects: {
            name: "string",
            url: "string"
          }
        },
        syncAll: { href: "/peers/sync-all", method: "POST" },
        pushAll: { href: "/peers/push-all", method: "POST" }
      }
    };
    
    return peersCollection;
  } catch (error) {
    throw new Error(`Failed to get peers: ${error.message}`);
  }
}

/**
 * Add a new peer
 * 
 * @param {Object} peerData - Peer data
 * @returns {Promise<Object>} - Added peer
 */
async function addPeer(peerData) {
  try {
    const peers = await peerManager.addPeer(peerData.name, peerData.url, peerData.metadata || {});
    const addedPeer = peers.peers.find(p => p.name === peerData.name);
    
    return {
      "@context": API_CONTEXT,
      "@type": "game:Peer",
      "name": addedPeer.name,
      "url": addedPeer.url,
      "status": addedPeer.status,
      "lastSync": addedPeer.lastSync,
      "_links": {
        self: { href: `/peers/${addedPeer.name}` },
        sync: { href: `/peers/${addedPeer.name}/sync`, method: "POST" },
        push: { href: `/peers/${addedPeer.name}/push`, method: "POST" },
        status: { href: `/peers/${addedPeer.name}/status` },
        allPeers: { href: "/peers" }
      }
    };
  } catch (error) {
    throw new Error(`Failed to add peer: ${error.message}`);
  }
}

module.exports = {
  getApiDocumentation,
  getEntryPoint,
  getWorld,
  getPlayer,
  getPlayers,
  getUnit,
  getUnits,
  createUnit,
  moveUnit,
  applyDecorator,
  syncWithPeers,
  getPeers,
  addPeer,
  generateLinks,
  createHydraCollection,
  createHydraError
};