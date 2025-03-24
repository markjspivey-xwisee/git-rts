import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { exec } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { SparqlService } from './sparql-service.js';
import {
  createNewGame,
  createPlayer,
  joinGame,
  syncTurn,
  getGameState
} from './git-mechanics.js';

// Define the game repository directory from environment variable or default
const gameRepoDir = process.env.GAME_REPO_DIR || 'C:/Users/markj/Desktop/game-repo';

// Define the CLI path
const cliPath = 'C:/Users/markj/Desktop/git-rts-cli/index.js';

// Helper function to execute CLI commands
const executeCli = async (command: string, args: string[]): Promise<string> => {
  return new Promise((resolve, reject) => {
    const fullCommand = `node ${cliPath} ${command} ${args.join(' ')}`;
    exec(fullCommand, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(`Command execution error: ${error.message}\n${stderr}`));
      } else {
        // Process the output to remove duplicates
        const processedOutput = deduplicateOutput(stdout);
        resolve(processedOutput);
      }
    });
  });
};

// Function to deduplicate repeated lines in command output
function deduplicateOutput(output: string): string {
  // Split the output into lines
  const lines = output.split('\n');
  
  // Create a map to track seen lines and their counts
  const seenLines = new Map<string, number>();
  const uniqueLines: string[] = [];
  
  // Process each line
  for (const line of lines) {
    // Skip empty lines
    if (!line.trim()) {
      uniqueLines.push(line);
      continue;
    }
    
    // If we've seen this line before, skip it
    if (seenLines.has(line)) {
      seenLines.set(line, seenLines.get(line)! + 1);
    } else {
      // First time seeing this line
      seenLines.set(line, 1);
      uniqueLines.push(line);
    }
  }
  
  // For lines that appeared multiple times, add a count indicator
  const finalLines = uniqueLines.map(line => {
    const count = seenLines.get(line);
    if (count && count > 1) {
      // Only add count for non-empty lines
      return line.trim() ? line : line;
    }
    return line;
  });
  
  return finalLines.join('\n');
}

// Load GitHub configuration from environment variables or file
export async function loadGitHubConfig() {
  try {
    // First try to get from environment variables
    if (process.env.GITHUB_USERNAME && process.env.GITHUB_TOKEN && process.env.GITHUB_REPOSITORY) {
      return {
        username: process.env.GITHUB_USERNAME,
        token: process.env.GITHUB_TOKEN,
        repository: process.env.GITHUB_REPOSITORY
      };
    }
    
    // Fall back to file-based configuration
    const configPath = path.join('C:/Users/markj/Desktop/git-rts-cli', 'git-rts-config.json');
    const configData = await fs.readFile(configPath, 'utf8');
    return JSON.parse(configData).github;
  } catch (error) {
    console.error('Error loading GitHub configuration:', error instanceof Error ? error.message : String(error));
    return null;
  }
}

// Push changes to GitHub
export async function pushToGitHub() {
  return new Promise<string>((resolve, reject) => {
    exec('git push origin master', { cwd: gameRepoDir }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(`Command execution error: ${error.message}\n${stderr}`));
      } else {
        resolve(stdout);
      }
    });
  });
}

// Pull changes from GitHub
export async function pullFromGitHub() {
  return new Promise<string>((resolve, reject) => {
    exec('git pull origin master', { cwd: gameRepoDir }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(`Command execution error: ${error.message}\n${stderr}`));
      } else {
        resolve(stdout);
      }
    });
  });
}

class GitRtsMcpServer {
  private server: Server;
  private sparqlService: SparqlService;

  constructor() {
    this.server = new Server(
      {
        name: 'git-rts',
        version: '0.1.0',
      },
      {
        capabilities: {
          resources: {},
          tools: {},
        },
      }
    );

    this.sparqlService = new SparqlService();
    
    this.setupToolHandlers();
    
    // Error handling
    this.server.onerror = (error) => console.error('[MCP Error]', error);
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'get_github_config',
          description: 'Get GitHub configuration',
          inputSchema: {
            type: 'object',
            properties: {},
            required: []
          }
        },
        {
          name: 'move_unit',
          description: 'Move a unit to a new position',
          inputSchema: {
            type: 'object',
            properties: {
              unitUri: {
                type: 'string',
                description: 'URI of the unit to move'
              },
              x: {
                type: 'number',
                description: 'X coordinate'
              },
              y: {
                type: 'number',
                description: 'Y coordinate'
              }
            },
            required: ['unitUri', 'x', 'y']
          }
        },
        {
          name: 'gather_resources',
          description: 'Gather resources from a resource node',
          inputSchema: {
            type: 'object',
            properties: {
              unitUri: {
                type: 'string',
                description: 'URI of the unit to gather resources'
              },
              resourceNodeUri: {
                type: 'string',
                description: 'URI of the resource node to gather from'
              }
            },
            required: ['unitUri', 'resourceNodeUri']
          }
        },
        {
          name: 'push_to_github',
          description: 'Push changes to GitHub',
          inputSchema: {
            type: 'object',
            properties: {},
            required: []
          }
        },
        {
          name: 'pull_from_github',
          description: 'Pull changes from GitHub',
          inputSchema: {
            type: 'object',
            properties: {},
            required: []
          }
        },
        {
          name: 'execute_sparql',
          description: 'Execute a SPARQL query on the game data',
          inputSchema: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'SPARQL query to execute'
              }
            },
            required: ['query']
          }
        },
        {
          name: 'get_all_units',
          description: 'Get all units in the game',
          inputSchema: {
            type: 'object',
            properties: {},
            required: []
          }
        },
        {
          name: 'get_all_resource_nodes',
          description: 'Get all resource nodes in the game',
          inputSchema: {
            type: 'object',
            properties: {},
            required: []
          }
        },
        {
          name: 'get_player_resources',
          description: 'Get resources for a specific player',
          inputSchema: {
            type: 'object',
            properties: {
              playerUri: {
                type: 'string',
                description: 'URI of the player'
              }
            },
            required: ['playerUri']
          }
        },
        {
          name: 'get_player_units',
          description: 'Get units for a specific player',
          inputSchema: {
            type: 'object',
            properties: {
              playerUri: {
                type: 'string',
                description: 'URI of the player'
              }
            },
            required: ['playerUri']
          }
        },
        {
          name: 'get_buildings',
          description: 'Get all buildings in the game',
          inputSchema: {
            type: 'object',
            properties: {},
            required: []
          }
        },
        {
          name: 'find_nearby_resource_nodes',
          description: 'Find resource nodes near a specific location',
          inputSchema: {
            type: 'object',
            properties: {
              x: {
                type: 'number',
                description: 'X coordinate'
              },
              y: {
                type: 'number',
                description: 'Y coordinate'
              },
              radius: {
                type: 'number',
                description: 'Search radius'
              }
            },
            required: ['x', 'y', 'radius']
          }
        },
        {
          name: 'get_terrain_at_position',
          description: 'Get terrain information at a specific position',
          inputSchema: {
            type: 'object',
            properties: {
              x: {
                type: 'number',
                description: 'X coordinate'
              },
              y: {
                type: 'number',
                description: 'Y coordinate'
              }
            },
            required: ['x', 'y']
          }
        },
        {
          name: 'get_terrain_modifier',
          description: 'Get terrain modifier for a specific action at a position',
          inputSchema: {
            type: 'object',
            properties: {
              x: {
                type: 'number',
                description: 'X coordinate'
              },
              y: {
                type: 'number',
                description: 'Y coordinate'
              },
              actionType: {
                type: 'string',
                description: 'Action type (movement, gathering, combat)'
              }
            },
            required: ['x', 'y', 'actionType']
          }
        },
        {
          name: 'generate_map_view',
          description: 'Generate an HTML visualization of the game map',
          inputSchema: {
            type: 'object',
            properties: {},
            required: []
          }
        },
        // Git-based game mechanics tools
        {
          name: 'create_game',
          description: 'Create a new game by forking the template repository',
          inputSchema: {
            type: 'object',
            properties: {
              repoUrl: {
                type: 'string',
                description: 'URL of the new game repository'
              },
              gameName: {
                type: 'string',
                description: 'Name of the game world'
              }
            },
            required: ['repoUrl', 'gameName']
          }
        },
        {
          name: 'create_player',
          description: 'Create a new player in the game',
          inputSchema: {
            type: 'object',
            properties: {
              playerName: {
                type: 'string',
                description: 'Name of the player'
              }
            },
            required: ['playerName']
          }
        },
        {
          name: 'join_game',
          description: 'Join a game as a player',
          inputSchema: {
            type: 'object',
            properties: {
              repoUrl: {
                type: 'string',
                description: 'URL of the game repository'
              },
              playerName: {
                type: 'string',
                description: 'Name of the player'
              }
            },
            required: ['repoUrl', 'playerName']
          }
        },
        {
          name: 'sync_turn',
          description: 'Perform a turn-based synchronization',
          inputSchema: {
            type: 'object',
            properties: {},
            required: []
          }
        },
        {
          name: 'get_game_state',
          description: 'Get the current game state',
          inputSchema: {
            type: 'object',
            properties: {},
            required: []
          }
        }
      ]
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      
      if (name === 'get_github_config') {
        const config = await loadGitHubConfig();
        if (!config) {
          throw new McpError(
            ErrorCode.InternalError,
            'GitHub configuration not found'
          );
        }
        
        // Don't expose the token
        const safeConfig = {
          username: config.username,
          repository: config.repository
        };
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(safeConfig, null, 2)
            }
          ]
        };
      } else if (name === 'move_unit') {
        const { unitUri, x, y } = args as { unitUri: string; x: number; y: number };
        if (!unitUri || x === undefined || y === undefined) {
          throw new McpError(
            ErrorCode.InvalidParams,
            'Unit URI, x, and y coordinates are required'
          );
        }
        
        const output = await executeCli('move', [unitUri, x.toString(), y.toString()]);
        
        // Push changes to GitHub
        try {
          await pushToGitHub();
        } catch (pushError) {
          console.error('Failed to push to GitHub:', pushError instanceof Error ? pushError.message : String(pushError));
        }
        
        return {
          content: [
            {
              type: 'text',
              text: output
            }
          ]
        };
      } else if (name === 'gather_resources') {
        const { unitUri, resourceNodeUri } = args as { unitUri: string; resourceNodeUri: string };
        if (!unitUri || !resourceNodeUri) {
          throw new McpError(
            ErrorCode.InvalidParams,
            'Unit URI and resource node URI are required'
          );
        }
        
        const output = await executeCli('gather', [unitUri, resourceNodeUri]);
        
        // Push changes to GitHub
        try {
          await pushToGitHub();
        } catch (pushError) {
          console.error('Failed to push to GitHub:', pushError instanceof Error ? pushError.message : String(pushError));
        }
        
        return {
          content: [
            {
              type: 'text',
              text: output
            }
          ]
        };
      } else if (name === 'push_to_github') {
        const output = await pushToGitHub();
        return {
          content: [
            {
              type: 'text',
              text: output
            }
          ]
        };
      } else if (name === 'pull_from_github') {
        const output = await pullFromGitHub();
        return {
          content: [
            {
              type: 'text',
              text: output
            }
          ]
        };
      } else if (name === 'execute_sparql') {
        const { query } = args as { query: string };
        if (!query) {
          throw new McpError(
            ErrorCode.InvalidParams,
            'SPARQL query is required'
          );
        }
        
        try {
          const result = await this.sparqlService.executeQuery(query);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2)
              }
            ]
          };
        } catch (error) {
          throw new McpError(
            ErrorCode.InternalError,
            `Error executing SPARQL query: ${error instanceof Error ? error.message : String(error)}`
          );
        }
      } else if (name === 'get_all_units') {
        try {
          const result = await this.sparqlService.getAllUnits();
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2)
              }
            ]
          };
        } catch (error) {
          throw new McpError(
            ErrorCode.InternalError,
            `Error getting units: ${error instanceof Error ? error.message : String(error)}`
          );
        }
      } else if (name === 'get_all_resource_nodes') {
        try {
          const result = await this.sparqlService.getAllResourceNodes();
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2)
              }
            ]
          };
        } catch (error) {
          throw new McpError(
            ErrorCode.InternalError,
            `Error getting resource nodes: ${error instanceof Error ? error.message : String(error)}`
          );
        }
      } else if (name === 'get_player_resources') {
        const { playerUri } = args as { playerUri: string };
        if (!playerUri) {
          throw new McpError(
            ErrorCode.InvalidParams,
            'Player URI is required'
          );
        }
        
        try {
          const result = await this.sparqlService.getPlayerResources(playerUri);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2)
              }
            ]
          };
        } catch (error) {
          throw new McpError(
            ErrorCode.InternalError,
            `Error getting player resources: ${error instanceof Error ? error.message : String(error)}`
          );
        }
      } else if (name === 'get_player_units') {
        const { playerUri } = args as { playerUri: string };
        if (!playerUri) {
          throw new McpError(
            ErrorCode.InvalidParams,
            'Player URI is required'
          );
        }
        
        try {
          const result = await this.sparqlService.getPlayerUnits(playerUri);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2)
              }
            ]
          };
        } catch (error) {
          throw new McpError(
            ErrorCode.InternalError,
            `Error getting player units: ${error instanceof Error ? error.message : String(error)}`
          );
        }
      } else if (name === 'get_buildings') {
        try {
          const result = await this.sparqlService.getBuildings();
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2)
              }
            ]
          };
        } catch (error) {
          throw new McpError(
            ErrorCode.InternalError,
            `Error getting buildings: ${error instanceof Error ? error.message : String(error)}`
          );
        }
      } else if (name === 'find_nearby_resource_nodes') {
        const { x, y, radius } = args as { x: number; y: number; radius: number };
        if (x === undefined || y === undefined || radius === undefined) {
          throw new McpError(
            ErrorCode.InvalidParams,
            'X, Y, and radius are required'
          );
        }
        
        try {
          const result = await this.sparqlService.findNearbyResourceNodes(x, y, radius);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2)
              }
            ]
          };
        } catch (error) {
          throw new McpError(
            ErrorCode.InternalError,
            `Error finding nearby resource nodes: ${error instanceof Error ? error.message : String(error)}`
          );
        }
      } else if (name === 'get_terrain_at_position') {
        const { x, y } = args as { x: number; y: number };
        if (x === undefined || y === undefined) {
          throw new McpError(
            ErrorCode.InvalidParams,
            'X and Y coordinates are required'
          );
        }
        
        try {
          const output = await executeCli('get-terrain', [x.toString(), y.toString()]);
          return {
            content: [
              {
                type: 'text',
                text: output
              }
            ]
          };
        } catch (error) {
          throw new McpError(
            ErrorCode.InternalError,
            `Error getting terrain information: ${error instanceof Error ? error.message : String(error)}`
          );
        }
      } else if (name === 'get_terrain_modifier') {
        const { x, y, actionType } = args as { x: number; y: number; actionType: string };
        if (x === undefined || y === undefined || !actionType) {
          throw new McpError(
            ErrorCode.InvalidParams,
            'X, Y, and actionType are required'
          );
        }
        
        try {
          const output = await executeCli('get-terrain', [x.toString(), y.toString()]);
          return {
            content: [
              {
                type: 'text',
                text: output
              }
            ]
          };
        } catch (error) {
          throw new McpError(
            ErrorCode.InternalError,
            `Error getting terrain modifier: ${error instanceof Error ? error.message : String(error)}`
          );
        }
      } else if (name === 'generate_map_view') {
        try {
          const output = await executeCli('generate-map', []);
          return {
            content: [
              {
                type: 'text',
                text: output
              }
            ]
          };
        } catch (error) {
          throw new McpError(
            ErrorCode.InternalError,
            `Error generating map view: ${error instanceof Error ? error.message : String(error)}`
          );
        }
      }
      // Git-based game mechanics tools
      else if (name === 'create_game') {
        const { repoUrl, gameName } = args as { repoUrl: string; gameName: string };
        if (!repoUrl || !gameName) {
          throw new McpError(
            ErrorCode.InvalidParams,
            'Repository URL and game name are required'
          );
        }
        
        try {
          const output = await createNewGame(repoUrl, gameName);
          return {
            content: [
              {
                type: 'text',
                text: output
              }
            ]
          };
        } catch (error) {
          throw new McpError(
            ErrorCode.InternalError,
            `Error creating game: ${error instanceof Error ? error.message : String(error)}`
          );
        }
      } else if (name === 'create_player') {
        const { playerName } = args as { playerName: string };
        if (!playerName) {
          throw new McpError(
            ErrorCode.InvalidParams,
            'Player name is required'
          );
        }
        
        try {
          const output = await createPlayer(playerName);
          return {
            content: [
              {
                type: 'text',
                text: output
              }
            ]
          };
        } catch (error) {
          throw new McpError(
            ErrorCode.InternalError,
            `Error creating player: ${error instanceof Error ? error.message : String(error)}`
          );
        }
      } else if (name === 'join_game') {
        const { repoUrl, playerName } = args as { repoUrl: string; playerName: string };
        if (!repoUrl || !playerName) {
          throw new McpError(
            ErrorCode.InvalidParams,
            'Repository URL and player name are required'
          );
        }
        
        try {
          const output = await joinGame(repoUrl, playerName);
          return {
            content: [
              {
                type: 'text',
                text: output
              }
            ]
          };
        } catch (error) {
          throw new McpError(
            ErrorCode.InternalError,
            `Error joining game: ${error instanceof Error ? error.message : String(error)}`
          );
        }
      } else if (name === 'sync_turn') {
        try {
          const output = await syncTurn();
          return {
            content: [
              {
                type: 'text',
                text: output
              }
            ]
          };
        } catch (error) {
          throw new McpError(
            ErrorCode.InternalError,
            `Error synchronizing turn: ${error instanceof Error ? error.message : String(error)}`
          );
        }
      } else if (name === 'get_game_state') {
        try {
          const gameState = await getGameState();
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(gameState, null, 2)
              }
            ]
          };
        } catch (error) {
          throw new McpError(
            ErrorCode.InternalError,
            `Error getting game state: ${error instanceof Error ? error.message : String(error)}`
          );
        }
      } else {
        throw new McpError(
          ErrorCode.MethodNotFound,
          `Unknown tool: ${name}`
        );
      }
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Git-RTS MCP server running on stdio');
  }
}

const server = new GitRtsMcpServer();
server.run().catch(console.error);