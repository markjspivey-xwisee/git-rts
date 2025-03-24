# Git-RTS World Template

This repository serves as a template for creating new Git-RTS game worlds. It contains the initial state of a game world, including the ontology, world data, units, resource nodes, and buildings.

## How to Use This Template

### Option 1: Using the Git-RTS CLI

The easiest way to create a new game world is to use the Git-RTS CLI:

```bash
git-rts create-game <repo-url> <game-name>
```

For example:

```bash
git-rts create-game https://github.com/yourusername/my-rts-world.git "My RTS World"
```

This will:
1. Clone this template repository
2. Update the ontology URIs to use your repository's namespace
3. Initialize the world with your custom name
4. Push the changes to your repository

### Option 2: Manual Setup

If you prefer to set up the game world manually:

1. Fork this repository or use it as a template to create a new repository
2. Clone your new repository:
   ```bash
   git clone https://github.com/yourusername/my-rts-world.git
   cd my-rts-world
   ```
3. Update the ontology URIs:
   ```bash
   node /path/to/git-rts-cli/update-ontology-uris.js https://github.com/yourusername/my-rts-world.git .
   ```
4. Customize the world data in `world.ttl`
5. Commit and push your changes:
   ```bash
   git add .
   git commit -m "Initialize game world"
   git push
   ```

## Repository Structure

- `ontology/` - Contains the game ontology files
  - `index.ttl` - The main ontology file in Turtle format
  - `index.html` - A simple HTML page to serve the ontology
- `world.ttl` - The main world data file
- `units.ttl` - Definitions of units in the game
- `resource_nodes.ttl` - Definitions of resource nodes in the game
- `buildings.ttl` - Definitions of buildings in the game

## Creating Players

After creating a game world, you can create players:

```bash
git-rts create-player "Player One"
```

This will:
1. Create a new branch for the player
2. Add player resources and units files
3. Create a starting unit for the player
4. Push the branch to the repository

## Joining a Game

Players can join an existing game:

```bash
git-rts join-game https://github.com/yourusername/my-rts-world.git "Player One"
```

This will:
1. Clone the game repository
2. Check out the player's branch
3. Set up local configuration

## Game Mechanics

Git-RTS uses Git as the underlying mechanism for game state management:

- Each player has their own branch
- Game actions are commits to the player's branch
- Turn-based mechanics are implemented via merging
- Special actions can be implemented as pull requests

For more information, see the [Git-RTS Architecture](https://github.com/git-rts/git-rts/blob/master/docs/architecture.md) documentation.

## Hosting the Ontology

To enable GitHub Pages for this repository:

1. Go to the repository settings
2. Scroll down to the GitHub Pages section
3. Select the main branch as the source
4. Save the settings

This will make the ontology available at:

```
https://yourusername.github.io/my-rts-world/ontology
```

## License

This template is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.