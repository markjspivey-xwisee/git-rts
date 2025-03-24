# Git-RTS Architecture: Leveraging Git for Game Mechanics

## Repository Structure

### 1. Main Development Repository (`git-rts`)
- Contains all code for the project:
  - CLI tools (`git-rts-cli/`)
  - MCP server (`git-rts-mcp/`)
  - Web application (`git-rts-web/`)
  - Documentation (`docs/`)
  - Tests (`tests/`)

### 2. Default World State Repository (`git-rts-world-template`)
- Contains the initial state of a new game world:
  - Ontology definitions (`ontology/`)
  - Base world data (`world.ttl`)
  - Default units (`units.ttl`)
  - Default resource nodes (`resource_nodes.ttl`)
  - Default buildings (`buildings.ttl`)
  - Default technologies (`technologies.ttl`)
  - README with instructions for creating a new game

## Git-Based Game Mechanics

### Creating a New Game
1. **Fork the template repository**
   - Each game gets its own repository
   - The fork maintains a connection to the template for updates
   - Game-specific URI namespace is created based on repository name

2. **Initialize the game**
   ```bash
   git-rts init --repo <game-repo-url> --name "My Game World"
   ```
   - Clones the forked repository
   - Updates the ontology with game-specific URI
   - Initializes the world with custom parameters
   - Creates initial commit

### Player Management

1. **Creating a New Player**
   ```bash
   git-rts player create --name "Player1"
   ```
   - Creates a new branch: `player/player1`
   - Adds player resources file
   - Adds player units file
   - Commits changes

2. **Joining a Game**
   ```bash
   git-rts join --repo <game-repo-url> --player "Player1"
   ```
   - Clones the game repository
   - Checks out the player's branch
   - Sets up local configuration

### Game Actions

1. **Unit Movement**
   ```bash
   git-rts move <unit-id> <x> <y>
   ```
   - Updates unit position in player's branch
   - Creates a commit with the movement action
   - Pushes to remote repository

2. **Resource Gathering**
   ```bash
   git-rts gather <unit-id> <resource-node-id>
   ```
   - Updates resource node and player resources
   - Creates a commit with the gathering action
   - Pushes to remote repository

3. **Building Construction**
   ```bash
   git-rts build <building-type> <x> <y>
   ```
   - Adds new building to player's buildings
   - Deducts resources from player
   - Creates a commit with the building action
   - Pushes to remote repository

### Game State Synchronization

1. **Turn-Based Mechanics**
   - Each player's actions are committed to their branch
   - At the end of a turn, branches are merged into `master`
   - Conflicts represent game rule violations or competing actions
   - Conflict resolution follows game rules

2. **Pull Requests for Special Actions**
   - Research proposals
   - Alliance formation
   - Trade agreements
   - Territory claims
   - Game admins review and approve/reject

3. **Game Events via Webhooks**
   - Commit hooks trigger game events
   - Push events notify other players
   - Pull request events trigger diplomatic notifications

## Ontology URI Structure

### Game-Specific URI Namespace

Instead of using `http://example.org/game#`, each game instance will have its own namespace:

```
https://[username].github.io/[repo-name]/ontology#
```

For example:
```
https://player1.github.io/my-rts-world/ontology#Unit
https://player1.github.io/my-rts-world/ontology#Player
```

### Implementation

1. **Ontology Generation**
   - During game initialization, generate ontology with correct URIs
   - Host ontology on GitHub Pages for the repository
   - Update all TTL files to use the game-specific namespace

2. **URI Resolution**
   - GitHub Pages serves the ontology files
   - Game clients can resolve URIs to get semantic definitions
   - MCP server uses the ontology for validation

## Enhanced Hypermedia Controls

With game-specific URIs, hypermedia controls become more powerful:

```turtle
@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>.
@prefix hydra: <http://www.w3.org/ns/hydra/core#>.
@prefix game: <https://player1.github.io/my-rts-world/ontology#>.

game:unit1 a game:Unit;
  game:name "Warrior";
  game:attack 10;
  game:defense 5;
  hydra:operation [
    a hydra:Operation;
    hydra:method "POST";
    hydra:title "Move Unit";
    hydra:description "Moves this unit to a new position";
    hydra:expects [
      a hydra:Class;
      hydra:supportedProperty [
        a hydra:SupportedProperty;
        hydra:property game:x;
        hydra:required "true"^^xsd:boolean
      ], [
        a hydra:SupportedProperty;
        hydra:property game:y;
        hydra:required "true"^^xsd:boolean
      ]
    ];
    hydra:returns game:Unit
  ].
```

## Implementation Plan

1. **Refactor Repository Structure**
   - Create the main development repository
   - Create the world template repository
   - Move code to appropriate repositories

2. **Update CLI Tools**
   - Add commands for Git-based game mechanics
   - Implement URI namespace management
   - Add branch management for players

3. **Update MCP Server**
   - Support dynamic ontology URIs
   - Implement game state synchronization
   - Add webhook support for game events

4. **Update Web Application**
   - Support multiple games/worlds
   - Add player branch visualization
   - Implement pull request UI for special actions

5. **Documentation**
   - Create tutorials for creating games
   - Document Git-based game mechanics
   - Provide examples of common workflows