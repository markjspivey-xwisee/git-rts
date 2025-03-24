# Git-RTS MCP Server

This is a Model Context Protocol (MCP) server for the Git-based Real-Time Strategy (Git-RTS) game. It provides a RESTful API for interacting with the game through HTTP requests.

## Features

- **Game State Management**: Access and modify the game state stored in Git repositories
- **GitHub Integration**: Push and pull changes to/from GitHub
- **Player Actions**: Move units, gather resources, and more
- **Game Log**: View the history of actions in the game

## Installation

1. Clone the repository:
```bash
git clone https://github.com/markjspivey-xwisee/git-rts-mcp.git
cd git-rts-mcp
```

2. Install dependencies:
```bash
npm install
```

3. Build the TypeScript code:
```bash
npm run build
```

4. Configure the MCP server:
Create a file at `C:/Users/markj/AppData/Roaming/Roo-Code/MCP/git-rts-mcp-config.json` with the following content:
```json
{
  "mcpServers": {
    "git-rts": {
      "command": "node",
      "args": ["C:/Users/markj/Desktop/git-rts-mcp/build/index.js"],
      "env": {},
      "disabled": false,
      "timeout": 60,
      "alwaysAllow": []
    }
  }
}
```

5. Configure GitHub credentials:
Create a file at `C:/Users/markj/Desktop/git-rts-cli/git-rts-config.json` with the following content:
```json
{
  "github": {
    "username": "YOUR_GITHUB_USERNAME",
    "token": "YOUR_PERSONAL_ACCESS_TOKEN",
    "repository": "git-rts-game"
  },
  "gameRepoDir": "C:/Users/markj/Desktop/game-repo"
}
```

## Usage

1. Start the server:
```bash
npm start
```

2. Use the API endpoints:

### Game State

- `GET /api/game-state`: Get the current game state
- `GET /api/game-log`: Get the game log (history of actions)
- `GET /api/github-config`: Get the GitHub configuration (without the token)

### Player Actions

- `POST /api/move`: Move a unit
  ```json
  {
    "unitUri": "game:unit1",
    "x": 10,
    "y": 20
  }
  ```

- `POST /api/gather`: Gather resources
  ```json
  {
    "unitUri": "game:unit1",
    "resourceNodeUri": "game:goldMine1"
  }
  ```

### GitHub Integration

- `POST /api/push`: Push changes to GitHub
- `POST /api/pull`: Pull changes from GitHub

## Testing

You can use the included client script to test the MCP server:

```bash
node client.js
```

This will run a series of tests against the MCP server, including:
- Testing GitHub configuration
- Testing game state retrieval
- Testing game log retrieval
- Testing unit movement
- Testing resource gathering
- Testing GitHub push/pull

## Integration with LLM Chat

The MCP server can be used with LLM chat interfaces to provide a natural language interface to the game. For example, you can say:

- "Move my warrior to position (10, 20)"
- "Gather resources from the gold mine"
- "Show me the current game state"
- "Push my changes to GitHub"

The LLM will translate these natural language commands into API calls to the MCP server.

## License

MIT