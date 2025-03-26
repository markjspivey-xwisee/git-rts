# Git-RTS: Git-based Real-Time Strategy Game

Git-RTS is a revolutionary real-time strategy game that uses Git as a distributed database for game state. This unique approach enables true peer-to-peer gameplay without requiring a central server.

## Architecture

Git-RTS is built on several key technologies and architectural principles:

### RESTful Hypermedia API with HATEOAS

The game implements a fully RESTful API following HATEOAS principles (Hypermedia as the Engine of Application State). This means:

- Every resource includes hypermedia links to related resources and possible actions
- Clients can navigate the entire API by following these links
- State transitions are driven by hypermedia controls
- The API is self-documenting through Hydra vocabulary

### Linked Data with Hydra

All game data is represented using Linked Data principles:

- Game state is stored as RDF triples in Turtle (.ttl) files
- Hydra vocabulary is used to describe the API's capabilities
- Resources are interconnected through semantic relationships
- Content negotiation supports multiple formats (JSON-LD, Turtle, N-Triples)

### Git as a Distributed Database

Git is used not just for version control but as a true distributed database:

- Each player's repository is a complete database of game state
- Game actions are atomic transactions recorded as commits
- Conflict resolution happens through Git's merge capabilities
- Peer-to-peer synchronization is handled through Git operations

### Decorator Pattern for Distributed Affordances

Game entities are extensible through a distributed decorator pattern:

- Core entities (units, buildings, resources) have minimal functionality
- Decorators add new capabilities to existing entities
- Decorators are distributed across the network through Git
- Entities are composed at runtime by applying all relevant decorators

## Components

Git-RTS consists of several key components:

### CLI

The command-line interface provides commands for:

- Managing the peer-to-peer network
- Installing and managing Git hooks
- Starting and configuring the REST API server
- Creating and managing game entities
- Applying decorators to entities

### REST API Server

The REST API server provides:

- RESTful endpoints for all game resources
- Hypermedia controls for navigation and state transitions
- Content negotiation for different formats
- Integration with Git operations

### Entity System

The entity system manages:

- Creating and modifying game entities
- Applying decorators to entities
- Serializing and deserializing entities to/from RDF
- Converting entities to different formats (JSON-LD, Turtle)

### Peer-to-Peer Network

The peer-to-peer network handles:

- Adding and removing peers
- Synchronizing game state with peers
- Pushing changes to peers
- Checking peer status

## Getting Started

### Installation

```bash
# Clone the repository
git clone https://github.com/markjspivey-xwisee/git-rts.git
cd git-rts

# Install dependencies
npm install
```

### Starting the REST API Server

```bash
# Start the server on the default port (3000)
git-rts server start

# Start the server on a specific port
git-rts server start --port 5000
```

### Creating Game Entities

```bash
# Create a unit
git-rts entity create unit -p Player1 -t warrior -x 10 -y 20 --attack 5 --defense 3

# Create a building
git-rts entity create building -p Player1 -t barracks -x 15 -y 25 --health 100

# Create a resource node
git-rts entity create resourceNode -t gold -x 30 -y 40 --amount 1000
```

### Applying Decorators

```bash
# Apply a flying decorator to a unit
git-rts entity apply-decorator unit_123 flying --flying-height 3 --speed-bonus 1.5

# Apply a healing decorator to a unit
git-rts entity apply-decorator unit_456 healing --healing-power 10 --healing-range 2
```

### Managing Peers

```bash
# Add a peer
git-rts peer add Player2 https://github.com/player2/git-rts-repo.git

# Synchronize with all peers
git-rts peer sync --all

# Push changes to all peers
git-rts peer push --all
```

## API Documentation

The API is self-documenting through Hydra. You can access the API documentation at:

```
GET /api-doc
```

You can also generate the API documentation with:

```bash
git-rts server generate-docs
```

## License

MIT