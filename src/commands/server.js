/**
 * Server Command Module
 * 
 * Provides commands for managing the Git-RTS REST API server
 * - Starting and stopping the server
 * - Configuring server options
 * - Managing API endpoints
 */

const { Command } = require('commander');
const restServer = require('../lib/rest-server');
const fs = require('fs').promises;
const path = require('path');

// Default paths
const DEFAULT_CONFIG_FILE = path.join(process.cwd(), 'server-config.json');

// Create server command
const server = new Command('server')
  .description('Manage the Git-RTS REST API server');

/**
 * Start the REST API server
 */
server
  .command('start')
  .description('Start the REST API server')
  .option('-p, --port <port>', 'Port to listen on', '3000')
  .option('-c, --config <config>', 'Path to server configuration file')
  .action(async (options) => {
    try {
      // Load configuration if provided
      let config = {
        port: options.port
      };
      
      if (options.config) {
        try {
          const configData = await fs.readFile(options.config, 'utf8');
          const loadedConfig = JSON.parse(configData);
          config = { ...config, ...loadedConfig };
        } catch (error) {
          console.error(`Error loading configuration: ${error.message}`);
        }
      }
      
      console.log(`Starting Git-RTS REST API server on port ${config.port}...`);
      const { app, server } = restServer.createServer(config);
      
      // Handle graceful shutdown
      process.on('SIGINT', () => {
        console.log('Shutting down server...');
        server.close(() => {
          console.log('Server shut down successfully');
          process.exit(0);
        });
      });
    } catch (error) {
      console.error(`Error starting server: ${error.message}`);
      process.exit(1);
    }
  });

/**
 * Generate API documentation
 */
server
  .command('generate-docs')
  .description('Generate API documentation')
  .option('-o, --output <output>', 'Output file path', 'api-doc.jsonld')
  .action(async (options) => {
    try {
      // Create API documentation
      const apiDoc = {
        "@context": {
          "hydra": "http://www.w3.org/ns/hydra/core#",
          "vocab": "http://example.org/game/vocab#",
          "ApiDocumentation": "hydra:ApiDocumentation",
          "Class": "hydra:Class",
          "supportedClass": "hydra:supportedClass",
          "supportedProperty": "hydra:supportedProperty",
          "supportedOperation": "hydra:supportedOperation",
          "method": "hydra:method",
          "expects": "hydra:expects",
          "returns": "hydra:returns",
          "statusCodes": "hydra:statusCodes",
          "property": "hydra:property",
          "readable": "hydra:readable",
          "writable": "hydra:writable",
          "required": "hydra:required",
          "title": "hydra:title",
          "description": "hydra:description"
        },
        "@id": "http://example.org/game/api-doc",
        "@type": "ApiDocumentation",
        "title": "Git-RTS Game API",
        "description": "API for interacting with the Git-RTS game",
        "supportedClass": [
          {
            "@id": "vocab:EntryPoint",
            "@type": "Class",
            "title": "EntryPoint",
            "description": "The main entry point or homepage of the API",
            "supportedProperty": [
              {
                "property": "vocab:world",
                "title": "world",
                "description": "The world",
                "readable": true,
                "writable": false,
                "required": true
              },
              {
                "property": "vocab:players",
                "title": "players",
                "description": "All players",
                "readable": true,
                "writable": false,
                "required": true
              },
              {
                "property": "vocab:units",
                "title": "units",
                "description": "All units",
                "readable": true,
                "writable": false,
                "required": true
              },
              {
                "property": "vocab:resourceNodes",
                "title": "resourceNodes",
                "description": "All resource nodes",
                "readable": true,
                "writable": false,
                "required": true
              },
              {
                "property": "vocab:buildings",
                "title": "buildings",
                "description": "All buildings",
                "readable": true,
                "writable": false,
                "required": true
              }
            ],
            "supportedOperation": [
              {
                "@id": "_:entry_point",
                "@type": "hydra:Operation",
                "method": "GET",
                "title": "Get the API entry point",
                "description": "Retrieves the API entry point",
                "expects": null,
                "returns": "vocab:EntryPoint",
                "statusCodes": []
              }
            ]
          },
          {
            "@id": "vocab:World",
            "@type": "Class",
            "title": "World",
            "description": "The game world",
            "supportedProperty": [
              {
                "property": "vocab:name",
                "title": "name",
                "description": "The name of the world",
                "readable": true,
                "writable": true,
                "required": true
              },
              {
                "property": "vocab:size",
                "title": "size",
                "description": "The size of the world",
                "readable": true,
                "writable": true,
                "required": true
              }
            ],
            "supportedOperation": [
              {
                "@id": "_:world_retrieve",
                "@type": "hydra:Operation",
                "method": "GET",
                "title": "Retrieve world",
                "description": "Retrieves the world information",
                "expects": null,
                "returns": "vocab:World",
                "statusCodes": []
              }
            ]
          },
          {
            "@id": "vocab:Player",
            "@type": "Class",
            "title": "Player",
            "description": "A player in the game",
            "supportedProperty": [
              {
                "property": "vocab:gold",
                "title": "gold",
                "description": "The amount of gold a player has",
                "readable": true,
                "writable": true,
                "required": true
              },
              {
                "property": "vocab:wood",
                "title": "wood",
                "description": "The amount of wood a player has",
                "readable": true,
                "writable": true,
                "required": true
              },
              {
                "property": "vocab:stone",
                "title": "stone",
                "description": "The amount of stone a player has",
                "readable": true,
                "writable": true,
                "required": true
              },
              {
                "property": "vocab:food",
                "title": "food",
                "description": "The amount of food a player has",
                "readable": true,
                "writable": true,
                "required": true
              },
              {
                "property": "vocab:units",
                "title": "units",
                "description": "The units owned by a player",
                "readable": true,
                "writable": true,
                "required": false
              }
            ],
            "supportedOperation": [
              {
                "@id": "_:player_retrieve",
                "@type": "hydra:Operation",
                "method": "GET",
                "title": "Retrieve player",
                "description": "Retrieves a player's information",
                "expects": null,
                "returns": "vocab:Player",
                "statusCodes": []
              },
              {
                "@id": "_:player_create_unit",
                "@type": "hydra:Operation",
                "method": "POST",
                "title": "Create unit",
                "description": "Creates a new unit for this player",
                "expects": "vocab:UnitCreationInput",
                "returns": "vocab:Unit",
                "statusCodes": []
              }
            ]
          },
          {
            "@id": "vocab:Unit",
            "@type": "Class",
            "title": "Unit",
            "description": "A unit in the game",
            "supportedProperty": [
              {
                "property": "vocab:unitType",
                "title": "unitType",
                "description": "The type of the unit",
                "readable": true,
                "writable": true,
                "required": true
              },
              {
                "property": "vocab:x",
                "title": "x",
                "description": "The x coordinate of the unit",
                "readable": true,
                "writable": true,
                "required": true
              },
              {
                "property": "vocab:y",
                "title": "y",
                "description": "The y coordinate of the unit",
                "readable": true,
                "writable": true,
                "required": true
              },
              {
                "property": "vocab:owner",
                "title": "owner",
                "description": "The owner of the unit",
                "readable": true,
                "writable": true,
                "required": true
              },
              {
                "property": "vocab:health",
                "title": "health",
                "description": "The health of the unit",
                "readable": true,
                "writable": true,
                "required": true
              },
              {
                "property": "vocab:attack",
                "title": "attack",
                "description": "The attack value of the unit",
                "readable": true,
                "writable": true,
                "required": true
              },
              {
                "property": "vocab:defense",
                "title": "defense",
                "description": "The defense value of the unit",
                "readable": true,
                "writable": true,
                "required": true
              }
            ],
            "supportedOperation": [
              {
                "@id": "_:unit_retrieve",
                "@type": "hydra:Operation",
                "method": "GET",
                "title": "Retrieve unit",
                "description": "Retrieves a unit's information",
                "expects": null,
                "returns": "vocab:Unit",
                "statusCodes": []
              },
              {
                "@id": "_:unit_move",
                "@type": "hydra:Operation",
                "method": "POST",
                "title": "Move unit",
                "description": "Moves a unit to a new location",
                "expects": "vocab:MoveUnitInput",
                "returns": "vocab:Unit",
                "statusCodes": []
              },
              {
                "@id": "_:unit_apply_decorator",
                "@type": "hydra:Operation",
                "method": "POST",
                "title": "Apply decorator",
                "description": "Applies a decorator to a unit",
                "expects": "vocab:DecoratorInput",
                "returns": "vocab:Unit",
                "statusCodes": []
              }
            ]
          }
        ]
      };
      
      // Write to file
      await fs.writeFile(options.output, JSON.stringify(apiDoc, null, 2));
      
      console.log(`API documentation generated at ${options.output}`);
    } catch (error) {
      console.error(`Error generating API documentation: ${error.message}`);
      process.exit(1);
    }
  });

/**
 * Configure server settings
 */
server
  .command('config')
  .description('Configure server settings')
  .option('-p, --port <port>', 'Port to listen on')
  .option('-c, --cors <origin>', 'CORS origin')
  .option('-s, --save [file]', 'Save configuration to file', DEFAULT_CONFIG_FILE)
  .action(async (options) => {
    try {
      // Load existing configuration if available
      let config = {};
      try {
        const configData = await fs.readFile(options.save, 'utf8');
        config = JSON.parse(configData);
      } catch (error) {
        if (error.code !== 'ENOENT') {
          console.error(`Error loading configuration: ${error.message}`);
        }
      }
      
      // Update configuration
      if (options.port) {
        config.port = options.port;
      }
      
      if (options.cors) {
        config.cors = options.cors;
      }
      
      // Save configuration
      await fs.writeFile(options.save, JSON.stringify(config, null, 2));
      
      console.log(`Configuration saved to ${options.save}`);
    } catch (error) {
      console.error(`Error configuring server: ${error.message}`);
      process.exit(1);
    }
  });

module.exports = server;