# Git-RTS: Git-based Real-Time Strategy Game

Git-RTS is a unique real-time strategy game that uses Git as the underlying mechanism for game state management. It leverages Git's distributed version control features to create a collaborative and competitive gaming experience.

## Project Components

The Git-RTS project consists of several components:

### 1. CLI Tools (`git-rts-cli`)

Command-line interface for interacting with the game. Features include:

- Creating and joining games
- Managing players and units
- Performing game actions (movement, resource gathering, building)
- Turn-based synchronization
- Integration with GitHub for multiplayer

### 2. MCP Server (`git-rts-mcp`)

Model Context Protocol server that provides:

- RESTful hypermedia API for game state access
- SPARQL query support for complex game state queries
- Real-time updates via Server-Sent Events
- GitHub integration for repository management

### 3. Web Application (`git-rts-web`)

Web-based interface for the game, featuring:

- Interactive map visualization
- Unit and building management
- Resource tracking
- Player interaction
- Turn management

### 4. World Template (`git-rts-world-template`)

Template repository for creating new game worlds:

- Base ontology definitions
- Default world data
- Initial resource nodes and units
- Documentation for customization

## Getting Started

### Prerequisites

- Node.js 14.x or higher
- Git 2.20 or higher
- GitHub account (for multiplayer features)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/git-rts/git-rts.git
   cd git-rts
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Link the CLI globally:
   ```bash
   npm link
   ```

### Creating a New Game

1. Create a new repository on GitHub for your game world

2. Use the CLI to create a new game:
   ```bash
   git-rts create-game https://github.com/yourusername/my-rts-world.git "My RTS World"
   ```

3. Create a player:
   ```bash
   git-rts create-player "Player One"
   ```

4. Start the MCP server:
   ```bash
   cd git-rts-mcp
   npm start
   ```

5. Start the web application:
   ```bash
   cd git-rts-web
   npm start
   ```

6. Open your browser to http://localhost:3000

## Game Mechanics

Git-RTS uses Git as the underlying mechanism for game state management:

### Repository Structure

- Each game has its own repository
- The game world is defined in Turtle (TTL) files
- Players have their own branches
- Game actions are commits
- Turn-based mechanics are implemented via merging

### Player Actions

- **Movement**: Move units around the map
  ```bash
  git-rts move unit1 10 20
  ```

- **Resource Gathering**: Collect resources from nodes
  ```bash
  git-rts gather unit1 goldMine1
  ```

- **Building**: Construct buildings
  ```bash
  git-rts build townCenter 15 25
  ```

- **Training**: Create new units
  ```bash
  git-rts train townCenter1 warrior
  ```

### Turn-Based Mechanics

1. Players perform actions on their branches
2. At the end of a turn, branches are synchronized
3. Conflicts represent game rule violations or competing actions
4. Conflict resolution follows game rules

### Special Actions via Pull Requests

- Research proposals
- Alliance formation
- Trade agreements
- Territory claims

## RESTful Hypermedia API

Git-RTS implements a RESTful hypermedia API using the Hydra vocabulary:

- Self-describing resources with operations and links
- Discoverable API that guides clients through available actions
- Semantic meaning through ontology definitions
- Game-specific URI namespaces

Example resource:

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
  "game:defense": 5,
  "game:health": 100,
  "game:location": "{x: 10, y: 10}",
  "hydra:operation": [
    {
      "@type": "hydra:Operation",
      "hydra:method": "POST",
      "hydra:title": "Move Unit",
      "hydra:description": "Moves this unit to a new position",
      "hydra:expects": {
        "@type": "hydra:Class",
        "hydra:supportedProperty": [
          {
            "@type": "hydra:SupportedProperty",
            "hydra:property": "game:x",
            "hydra:required": true
          },
          {
            "@type": "hydra:SupportedProperty",
            "hydra:property": "game:y",
            "hydra:required": true
          }
        ]
      }
    }
  ]
}
```

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Inspired by the intersection of distributed version control and strategy games
- Built with [Model Context Protocol](https://github.com/modelcontextprotocol/mcp) for AI integration
- Uses [Hydra](https://www.hydra-cg.com/) for hypermedia controls