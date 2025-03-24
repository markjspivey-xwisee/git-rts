# Git-RTS: A Git-based Real-Time Strategy Game

<div align="center">
  <img src="docs/images/git-rts-logo.png" alt="Git-RTS Logo" width="300"/>
  <br>
  <strong>Where Git Meets Strategy Gaming</strong>
  <br><br>
  
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
  [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
  [![Discord](https://img.shields.io/discord/1234567890?color=7289DA&label=Discord&logo=discord&logoColor=white)](https://discord.gg/git-rts)
  [![Twitter Follow](https://img.shields.io/twitter/follow/git_rts?style=social)](https://twitter.com/git_rts)
</div>

## 🎮 Overview

**Git-RTS** is a revolutionary real-time strategy game that uses Git as its underlying game engine. Players control units, gather resources, and build structures—all through Git operations. Every game action is a commit, every player has their own branch, and game synchronization happens through merges.

<div align="center">
  <img src="docs/images/gameplay-screenshot.png" alt="Git-RTS Gameplay" width="800"/>
</div>

### Why Git-RTS?

- **Innovative Gameplay**: Experience strategy gaming through the lens of distributed version control
- **Complete History**: Every game action is recorded in the Git history
- **Offline Play**: Make moves offline and synchronize when you reconnect
- **Extensible**: Easy to mod and extend with new units, buildings, and mechanics
- **Educational**: Learn Git concepts while having fun

## 🚀 Quick Start

### Prerequisites

- Node.js 14.x or higher
- Git 2.20 or higher
- GitHub account (for multiplayer features)

### Installation

```bash
# Clone the repository
git clone https://github.com/git-rts/git-rts.git
cd git-rts

# Install dependencies
npm install

# Link the CLI globally
npm link
```

### Creating Your First Game

```bash
# Create a new game
git-rts create-game https://github.com/yourusername/my-rts-world.git "My RTS World"

# Create a player
git-rts create-player "Player One"

# Start the web interface
cd git-rts-web
npm start

# Open your browser to http://localhost:3000
```

<div align="center">
  <img src="docs/images/game-creation.gif" alt="Creating a Game" width="600"/>
</div>

## 🏗️ Architecture

Git-RTS consists of several components that work together to create a seamless gaming experience:

<div align="center">
  <img src="docs/images/architecture-diagram.png" alt="Git-RTS Architecture" width="700"/>
</div>

### Components

- **CLI Tools**: Command-line interface for game actions
- **MCP Server**: Model Context Protocol server for AI integration
- **Web Interface**: Browser-based game visualization
- **Game Repository**: Git repository storing the game state

### Game Mechanics

Git-RTS leverages Git's distributed nature to implement game mechanics:

- **Branches**: Each player has their own branch
- **Commits**: Game actions are recorded as commits
- **Merges**: Turn synchronization happens through merges
- **Pull Requests**: Special actions like alliances and trades

## 🎲 Gameplay

### Resources

Players gather four types of resources:

- **Gold**: Used for advanced units and technologies
- **Wood**: Basic building material
- **Stone**: Used for defensive structures
- **Food**: Sustains your population

### Units

Various units with different abilities:

- **Settlers**: Gather resources and build structures
- **Warriors**: Basic combat units
- **Archers**: Ranged combat units
- **Cavalry**: Fast-moving combat units
- **Siege Engines**: Powerful units that can destroy buildings

### Buildings

Construct various buildings:

- **Town Center**: Main building, produces settlers
- **Barracks**: Trains military units
- **Market**: Enables resource trading
- **University**: Researches technologies
- **Walls and Towers**: Defensive structures

## 🧩 RESTful Hypermedia API

Git-RTS implements a RESTful hypermedia API using the Hydra vocabulary:

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

This API enables:

- **Self-discovery**: Clients can explore available actions
- **Semantic meaning**: Resources have well-defined semantics
- **AI integration**: AI assistants can interact with the game

## 🛠️ Development

### Project Structure

```
git-rts/
├── git-rts-cli/       # Command-line interface
├── git-rts-mcp/       # MCP server
├── git-rts-web/       # Web interface
└── docs/              # Documentation
```

### Running Tests

```bash
# Run all tests
npm test

# Run specific test suite
npm test -- --suite=game-mechanics
```

### Building from Source

```bash
# Build all components
npm run build

# Build specific component
npm run build:cli
```

## 🤝 Contributing

We welcome contributions from everyone! Check out our [Contributing Guide](CONTRIBUTING.md) to get started.

### Development Roadmap

- [x] Basic game mechanics
- [x] RESTful hypermedia API
- [x] Web interface
- [ ] Advanced combat system
- [ ] Technology tree
- [ ] Diplomacy and alliances
- [ ] Campaign mode
- [ ] AI opponents

## 📚 Documentation

- [Architecture Guide](docs/architecture.md)
- [API Reference](docs/api-reference.md)
- [Game Mechanics](docs/game-mechanics.md)
- [Modding Guide](docs/modding.md)

## 🌟 Showcase

<div align="center">
  <table>
    <tr>
      <td><img src="docs/images/screenshot1.png" alt="Screenshot 1" width="400"/></td>
      <td><img src="docs/images/screenshot2.png" alt="Screenshot 2" width="400"/></td>
    </tr>
    <tr>
      <td><img src="docs/images/screenshot3.png" alt="Screenshot 3" width="400"/></td>
      <td><img src="docs/images/screenshot4.png" alt="Screenshot 4" width="400"/></td>
    </tr>
  </table>
</div>

## 👥 Community

- [Discord Server](https://discord.gg/git-rts)
- [GitHub Discussions](https://github.com/git-rts/git-rts/discussions)
- [Twitter](https://twitter.com/git_rts)

## 📄 License

Git-RTS is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by the intersection of distributed version control and strategy games
- Built with [Model Context Protocol](https://github.com/modelcontextprotocol/mcp) for AI integration
- Uses [Hydra](https://www.hydra-cg.com/) for hypermedia controls