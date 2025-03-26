/**
 * Entity Manager Module
 * 
 * Manages game entities using the decorator pattern for distributed affordances
 * - Creating and managing core entities
 * - Applying decorators to entities
 * - Handling entity serialization and deserialization
 */

const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { exec } = require('child_process');
const { promisify } = require('util');
const execPromise = promisify(exec);

// Default paths
const DEFAULT_GAME_REPO_DIR = process.env.GAME_REPO_DIR || path.join(process.cwd(), 'game-repo');

/**
 * Entity class - Base class for all game entities
 */
class Entity {
  constructor(id, type) {
    this.id = id || `entity_${uuidv4()}`;
    this.type = type;
    this.decorators = [];
    this._links = {};
  }

  /**
   * Add hypermedia links to the entity
   * @param {Object} links - Object containing hypermedia links
   */
  addLinks(links) {
    this._links = { ...this._links, ...links };
  }

  /**
   * Apply a decorator to this entity
   * @param {Decorator} decorator - The decorator to apply
   * @returns {Entity} - The decorated entity
   */
  applyDecorator(decorator) {
    this.decorators.push(decorator);
    return this;
  }

  /**
   * Get all capabilities provided by decorators
   * @returns {Array} - Array of capabilities
   */
  getCapabilities() {
    const capabilities = [];
    for (const decorator of this.decorators) {
      capabilities.push(...decorator.getCapabilities());
    }
    return capabilities;
  }

  /**
   * Convert entity to RDF Turtle format
   * @returns {string} - Turtle representation of the entity
   */
  toTurtle() {
    let turtle = `@prefix game: <http://example.org/game#>.\n\n`;
    turtle += `game:${this.id} a game:${this.type};\n`;
    
    // Add basic properties
    const properties = this.getProperties();
    for (const [key, value] of Object.entries(properties)) {
      if (key !== 'id' && key !== 'type' && key !== 'decorators' && key !== '_links') {
        if (typeof value === 'string') {
          turtle += `  game:${key} "${value}";\n`;
        } else if (typeof value === 'number') {
          turtle += `  game:${key} ${value};\n`;
        } else if (typeof value === 'boolean') {
          turtle += `  game:${key} "${value}"^^xsd:boolean;\n`;
        }
      }
    }
    
    // Remove trailing semicolon and add period
    turtle = turtle.slice(0, -2) + '.\n\n';
    
    // Add decorator information
    for (const decorator of this.decorators) {
      turtle += decorator.toTurtle(this.id);
    }
    
    return turtle;
  }

  /**
   * Convert entity to JSON-LD format with hypermedia controls
   * @returns {Object} - JSON-LD representation of the entity
   */
  toJsonLd() {
    const jsonLd = {
      "@context": {
        "game": "http://example.org/game#",
        "hydra": "http://www.w3.org/ns/hydra/core#",
        "xsd": "http://www.w3.org/2001/XMLSchema#"
      },
      "@id": `game:${this.id}`,
      "@type": `game:${this.type}`,
      ...this.getProperties(),
      "_links": this._links
    };
    
    // Add capabilities from decorators
    jsonLd.capabilities = this.getCapabilities();
    
    return jsonLd;
  }

  /**
   * Get all properties of the entity
   * @returns {Object} - Object containing entity properties
   */
  getProperties() {
    const properties = { ...this };
    delete properties.decorators;
    delete properties._links;
    return properties;
  }
}

/**
 * Decorator class - Base class for all entity decorators
 */
class Decorator {
  constructor(id, type) {
    this.id = id || `decorator_${uuidv4()}`;
    this.type = type;
    this.capabilities = [];
  }

  /**
   * Add a capability to this decorator
   * @param {string} name - Name of the capability
   * @param {Function} implementation - Implementation of the capability
   */
  addCapability(name, implementation) {
    this.capabilities.push({ name, implementation });
  }

  /**
   * Get all capabilities provided by this decorator
   * @returns {Array} - Array of capability names
   */
  getCapabilities() {
    return this.capabilities.map(cap => cap.name);
  }

  /**
   * Convert decorator to RDF Turtle format
   * @param {string} entityId - ID of the entity this decorator is applied to
   * @returns {string} - Turtle representation of the decorator
   */
  toTurtle(entityId) {
    let turtle = `game:${this.id} a game:${this.type};\n`;
    turtle += `  game:decorates game:${entityId};\n`;
    
    // Add capabilities
    for (const capability of this.capabilities) {
      turtle += `  game:providesCapability "${capability.name}";\n`;
    }
    
    // Add properties
    const properties = { ...this };
    delete properties.id;
    delete properties.type;
    delete properties.capabilities;
    
    for (const [key, value] of Object.entries(properties)) {
      if (typeof value === 'string') {
        turtle += `  game:${key} "${value}";\n`;
      } else if (typeof value === 'number') {
        turtle += `  game:${key} ${value};\n`;
      } else if (typeof value === 'boolean') {
        turtle += `  game:${key} "${value}"^^xsd:boolean;\n`;
      }
    }
    
    // Remove trailing semicolon and add period
    turtle = turtle.slice(0, -2) + '.\n\n';
    
    return turtle;
  }
}

/**
 * Unit class - Represents a game unit
 */
class Unit extends Entity {
  constructor(id, type, x, y, owner, health = 100, attack = 1, defense = 1) {
    super(id, 'Unit');
    this.unitType = type;
    this.x = x;
    this.y = y;
    this.owner = owner;
    this.health = health;
    this.attack = attack;
    this.defense = defense;
    
    // Add hypermedia links
    this.addLinks({
      self: { href: `/units/${this.id}` },
      move: { href: `/units/${this.id}/move`, method: 'POST' },
      attack: { href: `/units/${this.id}/attack`, method: 'POST' },
      owner: { href: `/players/${this.owner}` }
    });
  }
}

/**
 * Building class - Represents a game building
 */
class Building extends Entity {
  constructor(id, type, x, y, owner, health = 100) {
    super(id, 'Building');
    this.buildingType = type;
    this.x = x;
    this.y = y;
    this.owner = owner;
    this.health = health;
    
    // Add hypermedia links
    this.addLinks({
      self: { href: `/buildings/${this.id}` },
      train: { href: `/buildings/${this.id}/train`, method: 'POST' },
      owner: { href: `/players/${this.owner}` }
    });
  }
}

/**
 * ResourceNode class - Represents a resource node
 */
class ResourceNode extends Entity {
  constructor(id, type, x, y, amount) {
    super(id, 'ResourceNode');
    this.resourceType = type;
    this.x = x;
    this.y = y;
    this.amount = amount;
    
    // Add hypermedia links
    this.addLinks({
      self: { href: `/resource-nodes/${this.id}` }
    });
  }
}

/**
 * FlyingDecorator - Adds flying capability to units
 */
class FlyingDecorator extends Decorator {
  constructor(id, flyingHeight = 2, speedBonus = 1.5) {
    super(id, 'FlyingDecorator');
    this.flyingHeight = flyingHeight;
    this.speedBonus = speedBonus;
    
    // Add flying capability
    this.addCapability('fly', (unit, targetX, targetY) => {
      // Implementation of flying
      unit.x = targetX;
      unit.y = targetY;
      return `${unit.unitType} flew to (${targetX}, ${targetY})`;
    });
  }
}

/**
 * HealingDecorator - Adds healing capability to units
 */
class HealingDecorator extends Decorator {
  constructor(id, healingPower = 10, healingRange = 2) {
    super(id, 'HealingDecorator');
    this.healingPower = healingPower;
    this.healingRange = healingRange;
    
    // Add healing capability
    this.addCapability('heal', (unit, targetUnit) => {
      // Implementation of healing
      targetUnit.health = Math.min(100, targetUnit.health + this.healingPower);
      return `${unit.unitType} healed ${targetUnit.unitType} for ${this.healingPower} health`;
    });
  }
}

/**
 * Create a new entity
 * 
 * @param {string} type - Type of entity to create
 * @param {Object} properties - Properties for the entity
 * @returns {Entity} - The created entity
 */
function createEntity(type, properties) {
  switch (type.toLowerCase()) {
    case 'unit':
      return new Unit(
        properties.id,
        properties.unitType,
        properties.x,
        properties.y,
        properties.owner,
        properties.health,
        properties.attack,
        properties.defense
      );
    case 'building':
      return new Building(
        properties.id,
        properties.buildingType,
        properties.x,
        properties.y,
        properties.owner,
        properties.health
      );
    case 'resourcenode':
      return new ResourceNode(
        properties.id,
        properties.resourceType,
        properties.x,
        properties.y,
        properties.amount
      );
    default:
      throw new Error(`Unknown entity type: ${type}`);
  }
}

/**
 * Create a new decorator
 * 
 * @param {string} type - Type of decorator to create
 * @param {Object} properties - Properties for the decorator
 * @returns {Decorator} - The created decorator
 */
function createDecorator(type, properties) {
  switch (type.toLowerCase()) {
    case 'flying':
      return new FlyingDecorator(
        properties.id,
        properties.flyingHeight,
        properties.speedBonus
      );
    case 'healing':
      return new HealingDecorator(
        properties.id,
        properties.healingPower,
        properties.healingRange
      );
    default:
      throw new Error(`Unknown decorator type: ${type}`);
  }
}

/**
 * Save an entity to the game repository
 * 
 * @param {Entity} entity - The entity to save
 * @param {string} gameRepoDir - Path to the game repository
 * @returns {Promise<Object>} - Result of the save operation
 */
async function saveEntity(entity, gameRepoDir = DEFAULT_GAME_REPO_DIR) {
  try {
    // Determine the file path based on entity type
    let filePath;
    switch (entity.type) {
      case 'Unit':
        filePath = path.join(gameRepoDir, `${entity.owner}_units.ttl`);
        break;
      case 'Building':
        filePath = path.join(gameRepoDir, `${entity.owner}_buildings.ttl`);
        break;
      case 'ResourceNode':
        filePath = path.join(gameRepoDir, 'resource_nodes.ttl');
        break;
      default:
        filePath = path.join(gameRepoDir, `${entity.type.toLowerCase()}.ttl`);
    }
    
    // Check if the file exists
    let existingContent = '';
    try {
      existingContent = await fs.readFile(filePath, 'utf8');
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
      // File doesn't exist, create it with prefixes
      existingContent = `@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .\n@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .\n@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .\n@prefix game: <http://example.org/game#> .\n\n`;
    }
    
    // Check if the entity already exists in the file
    const entityRegex = new RegExp(`game:${entity.id} a game:${entity.type}`);
    if (entityRegex.test(existingContent)) {
      // Entity exists, update it
      const entityStartRegex = new RegExp(`game:${entity.id} a game:${entity.type}[\\s\\S]*?\\.\\s*`);
      existingContent = existingContent.replace(entityStartRegex, entity.toTurtle());
    } else {
      // Entity doesn't exist, add it
      existingContent += entity.toTurtle();
    }
    
    // Write the updated content to the file
    await fs.writeFile(filePath, existingContent);
    
    // Commit the changes
    await execPromise(`git add "${filePath}"`, { cwd: gameRepoDir });
    await execPromise(`git commit -m "Update entity: ${entity.id}"`, { cwd: gameRepoDir });
    
    return {
      success: true,
      entity,
      message: `Successfully saved entity ${entity.id}`
    };
  } catch (error) {
    throw new Error(`Failed to save entity: ${error.message}`);
  }
}

/**
 * Load an entity from the game repository
 * 
 * @param {string} id - ID of the entity to load
 * @param {string} gameRepoDir - Path to the game repository
 * @returns {Promise<Entity>} - The loaded entity
 */
async function loadEntity(id, gameRepoDir = DEFAULT_GAME_REPO_DIR) {
  try {
    // Search for the entity in all TTL files
    const files = await fs.readdir(gameRepoDir);
    const ttlFiles = files.filter(file => file.endsWith('.ttl'));
    
    for (const file of ttlFiles) {
      const filePath = path.join(gameRepoDir, file);
      const content = await fs.readFile(filePath, 'utf8');
      
      // Check if the entity exists in this file
      const entityRegex = new RegExp(`game:${id} a game:([\\w]+)[\\s\\S]*?\\.[\\s]*`);
      const match = content.match(entityRegex);
      
      if (match) {
        const entityType = match[1];
        const entityContent = match[0];
        
        // Parse entity properties
        const properties = {
          id: id
        };
        
        // Extract properties
        const propertyRegex = /game:(\w+) (.*?);/g;
        let propertyMatch;
        while ((propertyMatch = propertyRegex.exec(entityContent)) !== null) {
          const key = propertyMatch[1];
          let value = propertyMatch[2];
          
          // Skip the type property as we already have it
          if (key === 'a') continue;
          
          // Parse the value based on its format
          if (value.startsWith('"') && value.endsWith('"')) {
            // String value
            value = value.slice(1, -1);
          } else if (value.match(/^-?\d+(\.\d+)?$/)) {
            // Numeric value
            value = parseFloat(value);
          } else if (value === 'true' || value === 'false') {
            // Boolean value
            value = value === 'true';
          }
          
          properties[key] = value;
        }
        
        // Create the entity
        const entity = createEntity(entityType, properties);
        
        // Load decorators for this entity
        await loadDecoratorsForEntity(entity, gameRepoDir);
        
        return entity;
      }
    }
    
    throw new Error(`Entity with ID ${id} not found`);
  } catch (error) {
    throw new Error(`Failed to load entity: ${error.message}`);
  }
}

/**
 * Load decorators for an entity
 * 
 * @param {Entity} entity - The entity to load decorators for
 * @param {string} gameRepoDir - Path to the game repository
 * @returns {Promise<Entity>} - The entity with decorators applied
 */
async function loadDecoratorsForEntity(entity, gameRepoDir = DEFAULT_GAME_REPO_DIR) {
  try {
    // Search for decorators in all TTL files
    const files = await fs.readdir(gameRepoDir);
    const ttlFiles = files.filter(file => file.endsWith('.ttl'));
    
    for (const file of ttlFiles) {
      const filePath = path.join(gameRepoDir, file);
      const content = await fs.readFile(filePath, 'utf8');
      
      // Find all decorators for this entity
      const decoratorRegex = new RegExp(`game:(\\w+) a game:(\\w+Decorator)[\\s\\S]*?game:decorates game:${entity.id}[\\s\\S]*?\\.[\\s]*`, 'g');
      let decoratorMatch;
      
      while ((decoratorMatch = decoratorRegex.exec(content)) !== null) {
        const decoratorId = decoratorMatch[1];
        const decoratorType = decoratorMatch[2];
        const decoratorContent = decoratorMatch[0];
        
        // Parse decorator properties
        const properties = {
          id: decoratorId
        };
        
        // Extract properties
        const propertyRegex = /game:(\w+) (.*?);/g;
        let propertyMatch;
        while ((propertyMatch = propertyRegex.exec(decoratorContent)) !== null) {
          const key = propertyMatch[1];
          let value = propertyMatch[2];
          
          // Skip the type and decorates properties
          if (key === 'a' || key === 'decorates') continue;
          
          // Parse the value based on its format
          if (value.startsWith('"') && value.endsWith('"')) {
            // String value
            value = value.slice(1, -1);
          } else if (value.match(/^-?\d+(\.\d+)?$/)) {
            // Numeric value
            value = parseFloat(value);
          } else if (value === 'true' || value === 'false') {
            // Boolean value
            value = value === 'true';
          }
          
          properties[key] = value;
        }
        
        // Create and apply the decorator
        const decorator = createDecorator(decoratorType.replace('Decorator', ''), properties);
        entity.applyDecorator(decorator);
      }
    }
    
    return entity;
  } catch (error) {
    throw new Error(`Failed to load decorators: ${error.message}`);
  }
}

/**
 * Save a decorator to the game repository
 * 
 * @param {Decorator} decorator - The decorator to save
 * @param {string} entityId - ID of the entity this decorator is applied to
 * @param {string} gameRepoDir - Path to the game repository
 * @returns {Promise<Object>} - Result of the save operation
 */
async function saveDecorator(decorator, entityId, gameRepoDir = DEFAULT_GAME_REPO_DIR) {
  try {
    // Determine the file path for decorators
    const filePath = path.join(gameRepoDir, 'decorators.ttl');
    
    // Check if the file exists
    let existingContent = '';
    try {
      existingContent = await fs.readFile(filePath, 'utf8');
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
      // File doesn't exist, create it with prefixes
      existingContent = `@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .\n@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .\n@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .\n@prefix game: <http://example.org/game#> .\n\n`;
    }
    
    // Check if the decorator already exists in the file
    const decoratorRegex = new RegExp(`game:${decorator.id} a game:${decorator.type}`);
    if (decoratorRegex.test(existingContent)) {
      // Decorator exists, update it
      const decoratorStartRegex = new RegExp(`game:${decorator.id} a game:${decorator.type}[\\s\\S]*?\\.\\s*`);
      existingContent = existingContent.replace(decoratorStartRegex, decorator.toTurtle(entityId));
    } else {
      // Decorator doesn't exist, add it
      existingContent += decorator.toTurtle(entityId);
    }
    
    // Write the updated content to the file
    await fs.writeFile(filePath, existingContent);
    
    // Commit the changes
    await execPromise(`git add "${filePath}"`, { cwd: gameRepoDir });
    await execPromise(`git commit -m "Update decorator: ${decorator.id}"`, { cwd: gameRepoDir });
    
    return {
      success: true,
      decorator,
      message: `Successfully saved decorator ${decorator.id}`
    };
  } catch (error) {
    throw new Error(`Failed to save decorator: ${error.message}`);
  }
}

module.exports = {
  Entity,
  Unit,
  Building,
  ResourceNode,
  Decorator,
  FlyingDecorator,
  HealingDecorator,
  createEntity,
  createDecorator,
  saveEntity,
  loadEntity,
  loadDecoratorsForEntity,
  saveDecorator
};