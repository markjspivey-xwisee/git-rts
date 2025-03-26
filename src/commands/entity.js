/**
 * Entity Command Module
 * 
 * Provides commands for managing game entities
 * - Creating and modifying entities
 * - Applying decorators to entities
 * - Querying entity information
 */

const { Command } = require('commander');
const entityManager = require('../lib/entity-manager');
const fs = require('fs').promises;
const path = require('path');

// Default paths
const DEFAULT_GAME_REPO_DIR = process.env.GAME_REPO_DIR || path.join(process.cwd(), 'game-repo');

// Create entity command
const entity = new Command('entity')
  .description('Manage game entities');

/**
 * Create a new entity
 */
entity
  .command('create')
  .description('Create a new entity')
  .argument('<type>', 'Type of entity (unit, building, resourceNode)')
  .option('-p, --player <player>', 'Player ID')
  .option('-t, --entity-type <entityType>', 'Entity subtype (e.g., warrior, barracks, gold)')
  .option('-x, --x <x>', 'X coordinate')
  .option('-y, --y <y>', 'Y coordinate')
  .option('--attack <attack>', 'Attack value (for units)')
  .option('--defense <defense>', 'Defense value (for units)')
  .option('--health <health>', 'Health value')
  .option('--amount <amount>', 'Resource amount (for resource nodes)')
  .action(async (type, options) => {
    try {
      // Validate required options
      if (!options.player && (type === 'unit' || type === 'building')) {
        throw new Error('Player ID is required for units and buildings');
      }
      
      if (!options.entityType) {
        throw new Error('Entity type is required');
      }
      
      if (!options.x || !options.y) {
        throw new Error('X and Y coordinates are required');
      }
      
      // Create properties object from options
      const properties = {
        owner: options.player,
        unitType: options.entityType,
        buildingType: options.entityType,
        resourceType: options.entityType,
        x: parseInt(options.x),
        y: parseInt(options.y),
        attack: options.attack ? parseInt(options.attack) : undefined,
        defense: options.defense ? parseInt(options.defense) : undefined,
        health: options.health ? parseInt(options.health) : undefined,
        amount: options.amount ? parseInt(options.amount) : undefined
      };
      
      // Create the entity
      const entity = entityManager.createEntity(type, properties);
      
      // Save the entity
      await entityManager.saveEntity(entity, DEFAULT_GAME_REPO_DIR);
      
      console.log(`Created ${type} with ID: ${entity.id}`);
      console.log(JSON.stringify(entity.toJsonLd(), null, 2));
    } catch (error) {
      console.error(`Error creating entity: ${error.message}`);
      process.exit(1);
    }
  });

/**
 * Get entity information
 */
entity
  .command('get')
  .description('Get entity information')
  .argument('<entityId>', 'ID of the entity')
  .option('-f, --format <format>', 'Output format (json, turtle)', 'json')
  .action(async (entityId, options) => {
    try {
      // Load the entity
      const entity = await entityManager.loadEntity(entityId, DEFAULT_GAME_REPO_DIR);
      
      // Output in the requested format
      if (options.format === 'turtle') {
        console.log(entity.toTurtle());
      } else {
        console.log(JSON.stringify(entity.toJsonLd(), null, 2));
      }
    } catch (error) {
      console.error(`Error getting entity: ${error.message}`);
      process.exit(1);
    }
  });

/**
 * Apply a decorator to an entity
 */
entity
  .command('apply-decorator')
  .description('Apply a decorator to an entity')
  .argument('<entityId>', 'ID of the entity')
  .argument('<decoratorType>', 'Type of decorator (flying, healing, etc.)')
  .option('--flying-height <height>', 'Flying height (for flying decorator)')
  .option('--speed-bonus <bonus>', 'Speed bonus (for flying decorator)')
  .option('--healing-power <power>', 'Healing power (for healing decorator)')
  .option('--healing-range <range>', 'Healing range (for healing decorator)')
  .action(async (entityId, decoratorType, options) => {
    try {
      // Load the entity
      const entity = await entityManager.loadEntity(entityId, DEFAULT_GAME_REPO_DIR);
      
      // Create properties object from options
      const properties = {
        flyingHeight: options.flyingHeight ? parseInt(options.flyingHeight) : undefined,
        speedBonus: options.speedBonus ? parseFloat(options.speedBonus) : undefined,
        healingPower: options.healingPower ? parseInt(options.healingPower) : undefined,
        healingRange: options.healingRange ? parseInt(options.healingRange) : undefined
      };
      
      // Create the decorator
      const decorator = entityManager.createDecorator(decoratorType, properties);
      
      // Apply the decorator to the entity
      entity.applyDecorator(decorator);
      
      // Save the decorator
      await entityManager.saveDecorator(decorator, entityId, DEFAULT_GAME_REPO_DIR);
      
      // Save the entity
      await entityManager.saveEntity(entity, DEFAULT_GAME_REPO_DIR);
      
      console.log(`Applied ${decoratorType} decorator to entity ${entityId}`);
      console.log(`New capabilities: ${entity.getCapabilities().join(', ')}`);
    } catch (error) {
      console.error(`Error applying decorator: ${error.message}`);
      process.exit(1);
    }
  });

/**
 * Move an entity
 */
entity
  .command('move')
  .description('Move an entity to a new position')
  .argument('<entityId>', 'ID of the entity')
  .argument('<x>', 'X coordinate')
  .argument('<y>', 'Y coordinate')
  .action(async (entityId, x, y, options) => {
    try {
      // Load the entity
      const entity = await entityManager.loadEntity(entityId, DEFAULT_GAME_REPO_DIR);
      
      // Check if the entity is a unit
      if (entity.type !== 'Unit') {
        throw new Error('Only units can be moved');
      }
      
      // Check if the entity has a flying capability
      const capabilities = entity.getCapabilities();
      if (capabilities.includes('fly')) {
        // Use the fly capability
        for (const decorator of entity.decorators) {
          if (decorator.capabilities.some(cap => cap.name === 'fly')) {
            const flyImplementation = decorator.capabilities.find(cap => cap.name === 'fly').implementation;
            flyImplementation(entity, parseInt(x), parseInt(y));
            console.log(`Entity ${entityId} flew to (${x}, ${y})`);
          }
        }
      } else {
        // Regular movement
        entity.x = parseInt(x);
        entity.y = parseInt(y);
        console.log(`Entity ${entityId} moved to (${x}, ${y})`);
      }
      
      // Save the updated entity
      await entityManager.saveEntity(entity, DEFAULT_GAME_REPO_DIR);
    } catch (error) {
      console.error(`Error moving entity: ${error.message}`);
      process.exit(1);
    }
  });

/**
 * List all entities
 */
entity
  .command('list')
  .description('List all entities')
  .option('-t, --type <type>', 'Filter by entity type')
  .option('-p, --player <player>', 'Filter by player ID')
  .action(async (options) => {
    try {
      // Get all TTL files in the game repository
      const files = await fs.readdir(DEFAULT_GAME_REPO_DIR);
      const ttlFiles = files.filter(file => file.endsWith('.ttl'));
      
      const entities = [];
      
      for (const file of ttlFiles) {
        const filePath = path.join(DEFAULT_GAME_REPO_DIR, file);
        const content = await fs.readFile(filePath, 'utf8');
        
        // Extract entity IDs and types
        const entityRegex = /game:(\w+) a game:(\w+)/g;
        let match;
        
        while ((match = entityRegex.exec(content)) !== null) {
          const entityId = match[1];
          const entityType = match[2];
          
          // Skip if not matching the type filter
          if (options.type && entityType !== options.type) {
            continue;
          }
          
          // Skip if not matching the player filter
          if (options.player && !content.includes(`game:owner "${options.player}"`)) {
            continue;
          }
          
          entities.push({
            id: entityId,
            type: entityType,
            file: file
          });
        }
      }
      
      // Output the entities
      console.log(`Found ${entities.length} entities:`);
      for (const entity of entities) {
        console.log(`- ${entity.id} (${entity.type}) in ${entity.file}`);
      }
    } catch (error) {
      console.error(`Error listing entities: ${error.message}`);
      process.exit(1);
    }
  });

module.exports = entity;