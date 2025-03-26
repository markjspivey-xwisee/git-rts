# Git-RTS Architecture

This document provides a detailed overview of the Git-RTS architecture, explaining how the different components work together to create a Git-based real-time strategy game.

## System Overview

Git-RTS consists of several key components:

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                        Git-RTS Architecture                     │
│                                                                 │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐        │
│  │             │     │             │     │             │        │
│  │  Git-RTS    │     │  Git-RTS    │     │  Git-RTS    │        │
│  │    CLI      │────▶│    MCP      │────▶│    Web      │        │
│  │             │     │   Server    │     │  Interface  │        │
│  │             │     │             │     │             │        │
│  └─────────────┘     └─────────────┘     └─────────────┘        │
│        │                   │                   │                 │
│        │                   │                   │                 │
│        ▼                   ▼                   ▼                 │
│  ┌─────────────────────────────────────────────────────┐        │
│  │                                                     │        │
│  │                  Game Repository                    │        │
│  │                                                     │        │
│  └─────────────────────────────────────────────────────┘        │
│                                                                 │
│  ┌─────────────────────────────────────────────────────┐        │
│  │                                                     │        │
│  │               RESTful Hypermedia API                │        │
│  │                                                     │        │
│  └─────────────────────────────────────────────────────┘        │
│                                                                 │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐        │
│  │             │     │             │     │             │        │
│  │   Entity    │     │  Decorator  │     │   Linked    │        │
│  │   System    │◀───▶│   Pattern   │◀───▶│    Data     │        │
│  │             │     │             │     │             │        │
│  └─────────────┘     └─────────────┘     └─────────────┘        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Components

1. **CLI Tools (`git-rts-cli`)**: Command-line interface for interacting with the game
2. **MCP Server (`git-rts-mcp`)**: Model Context Protocol server for AI integration
3. **Web Interface (`git-rts-web`)**: Browser-based game visualization
4. **Game Repository**: Git repository storing the game state
5. **RESTful Hypermedia API**: API with HATEOAS principles for client interaction
6. **Entity System**: System for managing game entities with the decorator pattern
7. **Linked Data**: Semantic representation of game state using RDF and Hydra

## Repository Structure

Git-RTS uses a two-repository architecture:

### 1. Main Development Repository (`git-rts`)

Contains all code for the project:

```
git-rts/
├── git-rts-cli/       # Command-line interface
│   ├── src/           # Source code
│   │   ├── index.js   # Main CLI entry point
│   │   ├── commands/  # CLI commands
│   │   └── lib/       # Library modules
│   └── package.json   # Dependencies
├── git-rts-mcp/       # MCP server
│   ├── src/           # Source code
│   └── build/         # Compiled code
├── git-rts-web/       # Web interface
│   ├── src/           # Source code
│   └── public/        # Static assets
├── git-rts-web-demo-local/ # Local web demo
│   ├── client/        # Client-side code
│   └── server/        # Server-side code
└── docs/              # Documentation
    ├── architecture.md           # Architecture documentation
    └── git-rts-architecture.md   # Detailed architecture documentation
```

### 2. Game World Repository (`git-rts-world-template`)

Template for creating new game worlds:

```
git-rts-world-template/
├── game-ontology.ttl  # Game ontology
├── world.ttl          # World data
├── units.ttl          # Unit definitions
├── player_units.ttl   # Player units
├── player_resources.ttl # Player resources
├── resource_nodes.ttl # Resource node definitions
├── buildings.ttl      # Building definitions
├── decorators.ttl     # Entity decorators
├── diplomacy.ttl      # Diplomatic relations
└── alliance.ttl       # Alliances
```

## Git-Based Game Mechanics

Git-RTS leverages Git's distributed nature to implement game mechanics:

### Branches

Each player has their own branch in the game repository. This allows players to make moves independently and then synchronize when ready.

```
master           # Main game state
├── player/alice # Alice's branch
└── player/bob   # Bob's branch
```

### Commits

Game actions are recorded as commits in the Git history. Each commit represents a single game action, such as moving a unit or gathering resources.

```
commit abc123
Author: Alice <alice@example.com>
Date:   Mon Mar 24 12:34:56 2025

    Move unit1 to (10, 20)
```

### Merges

Turn-based mechanics are implemented via merging. At the end of a turn, players' branches are merged into the master branch.

```
      ┌─── Alice's move
      │
A ─── B ─── D
      │     │
      └─── C
           Bob's move
```

### Pull Requests

Special actions like alliances, trades, and diplomatic agreements are implemented as pull requests. This allows for review and approval before the action is executed.

## RESTful Hypermedia API with HATEOAS

Git-RTS implements a RESTful hypermedia API using the Hydra vocabulary and HATEOAS principles:

### Resources with Hypermedia Controls

All game entities (units, buildings, players, etc.) are represented as resources with hypermedia controls:

```json
{
  "@context": {
    "hydra": "http://www.w3.org/ns/hydra/core#",
    "game": "https://player1.github.io/my-rts-world/ontology#"
  },
  "@type": "game:Unit",
  "@id": "game:unit1",
  "game:name": "Warrior",
  "game:attack": 10,
  "_links": {
    "self": { "href": "/units/unit1" },
    "move": { 
      "href": "/units/unit1/move", 
      "method": "POST",
      "expects": {
        "x": "number",
        "y": "number"
      }
    },
    "attack": { 
      "href": "/units/unit1/attack", 
      "method": "POST",
      "expects": {
        "targetId": "string"
      }
    },
    "owner": { "href": "/players/player1" }
  }
}
```

### API Entry Point

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

### Content Negotiation

The API supports multiple formats through content negotiation:

- **JSON-LD**: Default format for modern clients
- **Turtle**: RDF format for semantic web clients
- **N-Triples**: Simple RDF format for basic clients

## Linked Data with Hydra

All game data is represented using Linked Data principles:

### Ontology

The game ontology defines the structure of the game resources and their relationships:

```turtle
game:Unit a rdfs:Class, hydra:Class ;
    rdfs:label "Unit" ;
    rdfs:comment "A unit in the game" ;
    hydra:supportedOperation [
        a hydra:Operation ;
        hydra:method "POST" ;
        hydra:title "Move Unit" ;
        hydra:description "Moves a unit to a new position"
    ] .
```

### RDF/Turtle Files

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

### Hydra API Documentation

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
        }
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
        }
      ]
    }
  ]
}
```

### Game-Specific URI Namespaces

Each game instance has its own URI namespace:

```
https://[username].github.io/[repo-name]/ontology#
```

## Decorator Pattern for Distributed Affordances

Git-RTS uses the decorator pattern to extend entity capabilities:

### Core Entities

Base entities have minimal functionality:

```javascript
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
  }
}
```

### Decorators

Decorators add new capabilities to entities:

```javascript
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

### Distributed Decorators

Decorators are stored in the game repository and distributed through Git:

```turtle
game:flying_decorator_123 a game:FlyingDecorator;
  game:decorates game:unit_123;
  game:providesCapability "fly";
  game:flyingHeight 3;
  game:speedBonus 1.5.
```

### Dynamic Composition

Entities are composed at runtime by applying all relevant decorators:

```javascript
// Load the unit
const unit = await entityManager.loadEntity(unitId);

// Load decorators for this unit
await loadDecoratorsForEntity(unit);

// Use capabilities provided by decorators
const capabilities = unit.getCapabilities();
if (capabilities.includes('fly')) {
  // Use the fly capability
  // ...
}
```

## Git as a Distributed Database

Git-RTS uses Git as a distributed database:

### Repository as Database

Each player's repository is a complete database of game state:

```
game-repo/
├── game-ontology.ttl
├── world.ttl
├── player_units.ttl
├── player_resources.ttl
└── ...
```

### Commits as Transactions

Game actions are atomic transactions recorded as commits:

```bash
# Save an entity
git add player_units.ttl
git commit -m "Update unit: unit_123"
git push
```

### Merges as State Reconciliation

Conflict resolution happens through Git's merge capabilities:

```bash
# Synchronize with a peer
git fetch peer
git merge peer/master --allow-unrelated-histories
git push
```

## Data Flow

The following diagram illustrates the data flow between components:

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│             │     │             │     │             │
│  Git-RTS    │     │  Git-RTS    │     │  Git-RTS    │
│    CLI      │────▶│    MCP      │────▶│    Web      │
│             │     │   Server    │     │  Interface  │
│             │     │             │     │             │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │
       │                   │                   │
       ▼                   ▼                   ▼
┌─────────────────────────────────────────────────────┐
│                                                     │
│                  Game Repository                    │
│                                                     │
└─────────────────────────────────────────────────────┘
```

1. The CLI tools execute commands that modify the game repository
2. The MCP server provides a RESTful hypermedia API for accessing the game state
3. The web interface visualizes the game state and allows for interaction

## Implementation Details

### CLI Tools

The CLI tools are implemented in Node.js using the Commander.js library. They provide commands for:

- Creating and joining games
- Managing players and units
- Performing game actions
- Turn-based synchronization
- Managing the REST API server
- Creating and managing entities
- Applying decorators to entities

### MCP Server

The MCP server is implemented in TypeScript using the Model Context Protocol SDK. It provides:

- RESTful hypermedia API for game state access
- SPARQL query support for complex game state queries
- Real-time updates via Server-Sent Events
- GitHub integration for repository management

### Web Interface

The web interface is implemented in React and uses:

- Three.js for 3D visualization
- Socket.IO for real-time updates
- Fetch API for RESTful API access

### REST API Server

The REST API server is implemented in Node.js using Express. It provides:

- RESTful endpoints for all game resources
- Hypermedia controls for navigation and state transitions
- Content negotiation for different formats
- Integration with Git operations

### Entity System

The entity system is implemented in Node.js and provides:

- Creating and modifying game entities
- Applying decorators to entities
- Serializing and deserializing entities to/from RDF
- Converting entities to different formats (JSON-LD, Turtle)

### Game Repository

The game repository uses:

- Turtle (TTL) files for RDF data
- Git for version control and distributed database
- GitHub for hosting and collaboration

## Security Considerations

- **Authentication**: GitHub authentication is used for player identification
- **Authorization**: Branch permissions ensure players can only modify their own branches
- **Data Integrity**: Git's cryptographic hashing ensures data integrity
- **Privacy**: Private repositories can be used for private games

## Performance Considerations

- **Caching**: The MCP server caches game state for faster access
- **Pagination**: API responses are paginated for large collections
- **Lazy Loading**: The web interface uses lazy loading for large game worlds
- **Incremental Updates**: Only changed data is transferred between components

## Future Directions

- **AI Players**: Integration with AI assistants for computer-controlled players
- **Multiplayer Scaling**: Support for larger multiplayer games
- **Mobile Support**: Mobile-friendly web interface
- **Offline Play**: Enhanced offline support with local-first architecture
- **Extended Decorators**: More decorator types for additional capabilities
- **Advanced Conflict Resolution**: Improved handling of merge conflicts
