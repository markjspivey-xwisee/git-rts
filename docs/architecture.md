# Git-RTS Architecture

This document provides a detailed overview of the Git-RTS architecture, explaining how the different components work together to create a Git-based real-time strategy game.

## System Overview

Git-RTS consists of several key components:

<!-- Note: Image placeholder - replace with actual architecture diagram -->
```
[This is a placeholder for the architecture diagram]
The diagram would show the components and their relationships.
```

### Components

1. **CLI Tools (`git-rts-cli`)**: Command-line interface for interacting with the game
2. **MCP Server (`git-rts-mcp`)**: Model Context Protocol server for AI integration
3. **Web Interface (`git-rts-web`)**: Browser-based game visualization
4. **Game Repository**: Git repository storing the game state

## Repository Structure

Git-RTS uses a two-repository architecture:

### 1. Main Development Repository (`git-rts`)

Contains all code for the project:

```
git-rts/
├── git-rts-cli/       # Command-line interface
│   ├── index.js       # Main CLI entry point
│   └── commands/      # CLI commands
├── git-rts-mcp/       # MCP server
│   ├── src/           # Source code
│   └── build/         # Compiled code
├── git-rts-web/       # Web interface
│   ├── src/           # Source code
│   └── public/        # Static assets
└── docs/              # Documentation
```

### 2. Game World Repository (`git-rts-world-template`)

Template for creating new game worlds:

```
git-rts-world-template/
├── ontology/          # Game ontology files
│   ├── index.ttl      # Main ontology file
│   └── index.html     # HTML documentation
├── world.ttl          # World data
├── units.ttl          # Unit definitions
├── resource_nodes.ttl # Resource node definitions
└── buildings.ttl      # Building definitions
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

## RESTful Hypermedia API

Git-RTS implements a RESTful hypermedia API using the Hydra vocabulary:

### Resources

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
  "hydra:operation": [
    {
      "@type": "hydra:Operation",
      "hydra:method": "POST",
      "hydra:title": "Move Unit",
      "hydra:description": "Moves this unit to a new position"
    }
  ]
}
```

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

### Game-Specific URI Namespaces

Each game instance has its own URI namespace:

```
https://[username].github.io/[repo-name]/ontology#
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

### Game Repository

The game repository uses:

- Turtle (TTL) files for RDF data
- Git for version control
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