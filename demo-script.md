# Git-RTS Demo Script

This script provides a step-by-step guide to demonstrate all the features of Git-RTS, including the enhanced peer-to-peer architecture, Git hooks, advanced combat system, technology tree, diplomacy, and alliances.

## Prerequisites

- Node.js 14.x or higher
- Git 2.20 or higher
- Two terminal windows (for simulating two players)
- Web browser

## Setup

1. Clone the repository and install dependencies:

```bash
# Terminal 1 (Player 1)
git clone https://github.com/markjspivey-xwisee/git-rts.git git-rts-player1
cd git-rts-player1
git checkout enhanced-p2p-new
npm install
npm link

# Terminal 2 (Player 2)
git clone https://github.com/markjspivey-xwisee/git-rts.git git-rts-player2
cd git-rts-player2
git checkout enhanced-p2p-new
npm install
npm link
```

2. Create game repositories for both players:

```bash
# Terminal 1 (Player 1)
git-rts create-game https://github.com/player1/my-rts-world.git "Player 1 World"
git-rts create-player "Player1"

# Terminal 2 (Player 2)
git-rts create-game https://github.com/player2/my-rts-world.git "Player 2 World"
git-rts create-player "Player2"
```

## Demo Part 1: Enhanced P2P Architecture

1. Install Git hooks:

```bash
# Terminal 1 (Player 1)
git-rts hook install --all

# Terminal 2 (Player 2)
git-rts hook install --all
```

2. Add peers:

```bash
# Terminal 1 (Player 1)
git-rts peer add "Player2" https://github.com/player2/my-rts-world.git

# Terminal 2 (Player 2)
git-rts peer add "Player1" https://github.com/player1/my-rts-world.git
```

3. List peers:

```bash
# Terminal 1 (Player 1)
git-rts peer list

# Terminal 2 (Player 2)
git-rts peer list
```

4. Check peer status:

```bash
# Terminal 1 (Player 1)
git-rts peer status --all

# Terminal 2 (Player 2)
git-rts peer status --all
```

## Demo Part 2: Game Actions and Git Hooks

1. Create units for both players:

```bash
# Terminal 1 (Player 1)
git-rts create-unit "infantry" 10 20

# Terminal 2 (Player 2)
git-rts create-unit "archer" 30 40
```

2. Move units (triggers pre-commit hook validation):

```bash
# Terminal 1 (Player 1)
git-rts move-unit "unit1" 15 25

# Terminal 2 (Player 2)
git-rts move-unit "unit1" 35 45
```

3. Gather resources (triggers post-commit hook events):

```bash
# Terminal 1 (Player 1)
git-rts gather-resources "unit1" "resource1" 50

# Terminal 2 (Player 2)
git-rts gather-resources "unit1" "resource2" 50
```

4. Synchronize with peers:

```bash
# Terminal 1 (Player 1)
git-rts peer sync --all

# Terminal 2 (Player 2)
git-rts peer sync --all
```

## Demo Part 3: Advanced Combat System

1. Create combat units:

```bash
# Terminal 1 (Player 1)
git-rts create-unit "infantry" 50 50 --attack 15 --defense 10

# Terminal 2 (Player 2)
git-rts create-unit "cavalry" 55 55 --attack 20 --defense 5
```

2. Initiate combat:

```bash
# Terminal 1 (Player 1)
git-rts attack "unit2" "unit3" --terrain forest --weather clear --formation line
```

3. View combat results:

```bash
# Terminal 1 (Player 1)
git-rts view-unit "unit2"
git-rts view-unit "unit3"
```

4. Use special abilities:

```bash
# Terminal 1 (Player 1)
git-rts use-ability "unit2" "shield_wall"

# Terminal 2 (Player 2)
git-rts use-ability "unit3" "charge"
```

## Demo Part 4: Technology Tree

1. View available technologies:

```bash
# Terminal 1 (Player 1)
git-rts tech-tree

# Terminal 2 (Player 2)
git-rts tech-tree
```

2. Research technologies:

```bash
# Terminal 1 (Player 1)
git-rts research "agriculture"
git-rts research "mining"

# Terminal 2 (Player 2)
git-rts research "bronze_working"
git-rts research "writing"
```

3. View research progress:

```bash
# Terminal 1 (Player 1)
git-rts research-status

# Terminal 2 (Player 2)
git-rts research-status
```

4. Complete research and view effects:

```bash
# Terminal 1 (Player 1)
git-rts advance-turn 5
git-rts view-effects

# Terminal 2 (Player 2)
git-rts advance-turn 5
git-rts view-effects
```

## Demo Part 5: Diplomacy

1. View diplomatic status:

```bash
# Terminal 1 (Player 1)
git-rts diplomacy-status

# Terminal 2 (Player 2)
git-rts diplomacy-status
```

2. Perform diplomatic actions:

```bash
# Terminal 1 (Player 1)
git-rts diplomacy-action "propose_trade" "Player2"

# Terminal 2 (Player 2)
git-rts diplomacy-action "accept" "Player1" --action-id 1
```

3. View agreements:

```bash
# Terminal 1 (Player 1)
git-rts view-agreements

# Terminal 2 (Player 2)
git-rts view-agreements
```

4. Send diplomatic gifts:

```bash
# Terminal 1 (Player 1)
git-rts diplomacy-action "send_gift" "Player2" --resource gold --amount 100

# Terminal 2 (Player 2)
git-rts view-resources
```

## Demo Part 6: Alliances

1. Create an alliance:

```bash
# Terminal 1 (Player 1)
git-rts create-alliance "Mighty Alliance" "Player2"

# Terminal 2 (Player 2)
git-rts view-alliances
```

2. Set alliance objectives:

```bash
# Terminal 1 (Player 1)
git-rts alliance-objective "accumulate_resources" --resource gold --amount 1000
```

3. Share resources through alliance:

```bash
# Terminal 1 (Player 1)
git-rts alliance-share-resources

# Terminal 2 (Player 2)
git-rts view-resources
```

4. View alliance benefits:

```bash
# Terminal 1 (Player 1)
git-rts alliance-benefits

# Terminal 2 (Player 2)
git-rts alliance-benefits
```

## Demo Part 7: Web Interface

1. Start the web interface:

```bash
# Terminal 1 (Player 1)
cd git-rts-web
npm start
```

2. Open the web interface in a browser:
   - Navigate to http://localhost:3000

3. Explore the game map and units
   - View units and their properties
   - View resources and their locations
   - View technology tree visualization
   - View diplomatic relations

4. Perform actions through the web interface:
   - Move units
   - Gather resources
   - Research technologies
   - Perform diplomatic actions

## Demo Part 8: MCP Integration with Claude

1. Start the MCP server:

```bash
# Terminal 1 (Player 1)
cd git-rts-mcp-p2p
npm start
```

2. Open Claude and ask it to:
   - Analyze the game state
   - Suggest optimal moves
   - Help with diplomatic strategies
   - Recommend research paths
   - Assist with combat tactics

## Demo Part 9: Semantic Web Features

1. Examine the RDF data:

```bash
# Terminal 1 (Player 1)
cat game-repo/units.ttl
cat game-repo/player_resources.ttl
```

2. View the Hydra API:

```bash
# Terminal 1 (Player 1)
git-rts api-docs
```

3. Validate game state with SHACL:

```bash
# Terminal 1 (Player 1)
git-rts validate-state
```

4. Query the game state with SPARQL:

```bash
# Terminal 1 (Player 1)
git-rts query "SELECT ?unit ?health WHERE { ?unit a game:Unit; game:health ?health }"
```

## Conclusion

This demo showcases the full range of Git-RTS features:

1. **Enhanced P2P Architecture**: Peer management, synchronization, and Git hooks
2. **Advanced Combat System**: Unit types, terrain effects, and special abilities
3. **Technology Tree**: Research paths, prerequisites, and effects
4. **Diplomacy**: Relations, agreements, and actions
5. **Alliances**: Formation, objectives, and resource sharing
6. **Web Interface**: Visual representation of the game state
7. **MCP Integration**: AI assistance through Claude
8. **Semantic Web**: RDF data, Hydra API, SHACL validation, and SPARQL queries

The combination of Git-based synchronization with Semantic Web technologies creates a unique gaming platform that is both distributed and semantically rich.