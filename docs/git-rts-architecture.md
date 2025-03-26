# Git-RTS Architecture

This document provides a detailed overview of the Git-RTS architecture, focusing on the key technologies and patterns used in the implementation.

## Overview

Git-RTS is built on four key architectural principles:

1. **RESTful Hypermedia API with HATEOAS**
2. **Linked Data with Hydra**
3. **Git as a Distributed Database**
4. **Decorator Pattern for Distributed Affordances**

These principles work together to create a unique, distributed, and extensible game architecture.

## RESTful Hypermedia API with HATEOAS

### Principles

HATEOAS (Hypermedia as the Engine of Application State) is a constraint of the REST application architecture that keeps the RESTful style architecture unique from other network application architectures. With HATEOAS, a client interacts with a network application whose application servers provide information dynamically through hypermedia.

In Git-RTS, this means:

1. **Resource-Based URLs**: Each game entity has a unique URL
2. **Hypermedia Controls**: Every response includes links to possible actions
3. **State Transitions**: Game state changes are driven by following hypermedia links
4. **Discoverability**: The entire API is discoverable from the entry point

### Implementation

The RESTful API is implemented in `src/lib/rest-server.js` and `src/lib/api-manager.js`. Key features include:

#### Entry Point

The API provides an entry point that includes links to all main resources:

```json
{
  "@context": "...",
  "@id": "/",
  "@type": "hydra:EntryPoint",
  "_links": {
    "self": { "href": "/" },
    "world": { "href": "/world" },
    "players": { "href": "/players" },
    "units": { "href": "/units" },
    "buildings": { "href": "/buildings" },
    "resourceNodes": { "href": "/resource-nodes" }
  }
}
```

#### Resource Representation with Hypermedia Controls

Each resource includes hypermedia controls that indicate possible actions:

```json
{
  "@context": "...",
  "@id": "/units/unit_123",
  "@type": "game:Unit",
  "unitType": "warrior",
  "x": 10,
  "y": 20,
  "owner": "Player1",
  "health": 100,
  "attack": 5,
  "defense": 3,
  "_links": {
    "self": { "href": "/units/unit_123" },
    "move": { 
      "href": "/units/unit_123/move", 
      "method": "POST",
      "expects": {
        "x": "number",
        "y": "number"
      }
    },
    "attack": { 
      "href": "/units/unit_123/attack", 
      "method": "POST",
      "expects": {
        "targetId": "string"
      }
    },
    "owner": { "href": "/players/Player1" }
  }
}
```

#### Content Negotiation

The API supports multiple formats through content negotiation:

- **JSON-LD**: Default format for modern clients
- **Turtle**: RDF format for semantic web clients
- **N-Triples**: Simple RDF format for basic clients

This is implemented in the `rest-server.js` file:

```javascript
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
    // Format data based on preferred format
    // ...
  };
  
  next();
});
```

## Linked Data with Hydra

### Principles

Linked Data is a method of publishing structured data so that it can be interlinked and become more useful through semantic queries. It builds upon standard Web technologies such as HTTP, RDF, and URIs.

Hydra is a vocabulary for hypermedia-driven Web APIs, which enables the creation of generic API clients.

In Git-RTS, this means:

1. **RDF Data Model**: Game state is stored in RDF/Turtle files
2. **Hydra Vocabulary**: API capabilities are described using Hydra
3. **Semantic Relationships**: Resources are interconnected through semantic links
4. **Content Negotiation**: API supports multiple RDF formats

### Implementation

The Linked Data implementation is primarily in the `entity-manager.js` file and the game-repo directory.

#### RDF/Turtle Files

Game state is stored in RDF/Turtle files:

```turtle
@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .
@prefix game: <http://example.org/game#> .

game:unit_123 a game:Unit;
  game:unitType "warrior";
  game:x 10;
  game:y 20;
  game:owner "Player1";
  game:health 100;
  game:attack 5;
  game:defense 3.
```

#### Hydra API Documentation

The API is documented using Hydra in the `api-doc.jsonld` file:

```json
{
  "@context": "...",
  "@id": "http://example.org/game/api-doc",
  "@type": "ApiDocumentation",
  "title": "Git-RTS Game API",
  "description": "API for interacting with the Git-RTS game",
  "supportedClass": [
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
        // ...
      ],
      "supportedOperation": [
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
        // ...
      ]
    },
    // ...
  ]
}
```

#### Entity Serialization

Entities can be serialized to different RDF formats:

```javascript
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
```

## Git as a Distributed Database

### Principles

Git is traditionally used for version control, but in Git-RTS, it serves as a distributed database:

1. **Repository as Database**: Each player's repository is a complete database of game state
2. **Commits as Transactions**: Game actions are atomic transactions recorded as commits
3. **Branches as Game States**: Different game states can be represented as branches
4. **Merges as State Reconciliation**: Conflict resolution happens through Git's merge capabilities

### Implementation

The Git database functionality is implemented in the `peer-manager.js` file and used throughout the application.

#### Saving Entities

When an entity is saved, it's written to a file and committed to Git:

```javascript
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
      // ...
    }
    
    // Write the entity to the file
    // ...
    
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
```

#### Peer Synchronization

Game state is synchronized between peers using Git operations:

```javascript
/**
 * Synchronize with a specific peer
 * 
 * @param {string} nameOrUrl - Name or URL of the peer to sync with
 * @param {string} gameRepoDir - Path to the game repository
 * @param {string} peersFile - Path to the peers.json file
 * @returns {Promise<Object>} - Result of the synchronization
 */
async function syncWithPeer(nameOrUrl, gameRepoDir = DEFAULT_GAME_REPO_DIR, peersFile = DEFAULT_PEERS_FILE) {
  try {
    // Find the peer to sync with
    // ...
    
    // Add the peer as a remote if it doesn't exist
    // ...
    
    // Fetch from the peer
    await execPromise(`git fetch ${peer.name}`, { cwd: gameRepoDir });
    
    // Merge changes from the peer
    try {
      const { stdout } = await execPromise(`git merge ${peer.name}/master --allow-unrelated-histories --no-edit`, { cwd: gameRepoDir });
      
      // Update peer status
      peer.status = 'active';
      peer.lastSync = new Date().toISOString();
      await savePeers(peers, peersFile);
      
      return {
        success: true,
        peer,
        message: `Successfully synchronized with peer "${peer.name}"`
      };
    } catch (error) {
      // Handle merge conflicts
      // ...
    }
  } catch (error) {
    // ...
  }
}
```

## Decorator Pattern for Distributed Affordances

### Principles

The Decorator pattern allows behavior to be added to individual objects, dynamically, without affecting the behavior of other objects from the same class. In Git-RTS, this is extended to a distributed context:

1. **Core Entities**: Base entities have minimal functionality
2. **Decorator Files**: Additional capabilities are defined in separate files
3. **Git-Distributed Decorators**: Decorators are distributed through Git
4. **Dynamic Composition**: Entities are composed at runtime by applying all relevant decorators

### Implementation

The decorator pattern is implemented in the `entity-manager.js` file.

#### Decorator Class

```javascript
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
    // ...
    
    return turtle;
  }
}
```

#### Specific Decorators

```javascript
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
```

#### Applying Decorators

```javascript
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
```

#### Loading Decorators

```javascript
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
        // ...
        
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
```

## Integration

These four architectural principles work together to create a unique, distributed, and extensible game architecture:

1. **RESTful Hypermedia API** provides a clean interface for clients to interact with the game
2. **Linked Data with Hydra** enables semantic representation of game state
3. **Git as a Distributed Database** provides a robust, distributed storage mechanism
4. **Decorator Pattern** allows for extensible game entities

Together, they enable a game that is:

- **Distributed**: No central server required
- **Extensible**: New capabilities can be added dynamically
- **Semantic**: Game state has rich meaning and relationships
- **Self-Documenting**: API is discoverable and well-documented
- **Resilient**: Git's distributed nature provides robustness

## Conclusion

The Git-RTS architecture demonstrates how modern web technologies and patterns can be combined to create a unique and powerful game architecture. By leveraging RESTful Hypermedia, Linked Data, Git, and the Decorator pattern, Git-RTS provides a solid foundation for a distributed, extensible, and semantic game engine.