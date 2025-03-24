#!/usr/bin/env node
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
import { fileURLToPath } from 'url';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
        resolve(stdout.toString());
      }
    });
  });
};

// Helper function to execute a command as a Promise
function execPromise(command: string, options?: any): Promise<string> {
  return new Promise((resolve, reject) => {
    exec(command, options, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(`Command execution error: ${error.message}\n${stderr}`));
      } else {
        resolve(stdout.toString());
      }
    });
  });
}

// Load peers from the peers.json file
async function loadPeers(peersFile = path.join(process.cwd(), 'peers.json')): Promise<any> {
  try {
    const data = await fs.readFile(peersFile, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      // File doesn't exist, create a new one
      const defaultPeers = {
        peers: [],
        settings: {
          autoSync: true,
          syncInterval: 300,
          maxPeers: 10,
          discoveryEnabled: true
        },
        metadata: {
          version: "0.1.0",
          lastUpdated: new Date().toISOString()
        }
      };
      
      await fs.writeFile(peersFile, JSON.stringify(defaultPeers, null, 2));
      return defaultPeers;
    }
    
    throw new Error(`Failed to load peers: ${(error as Error).message}`);
  }
}

// Save peers to the peers.json file
async function savePeers(peers: any, peersFile = path.join(process.cwd(), 'peers.json')): Promise<void> {
  try {
    // Update lastUpdated timestamp
    peers.metadata.lastUpdated = new Date().toISOString();
    
    await fs.writeFile(peersFile, JSON.stringify(peers, null, 2));
  } catch (error) {
    throw new Error(`Failed to save peers: ${(error as Error).message}`);
  }
}

class GitRtsP2pMcpServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: 'git-rts-p2p',
        version: '0.1.0',
      },
      {
        capabilities: {
          resources: {},
          tools: {},
        },
      }
    );
    
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
        // Peer management tools
        {
          name: 'add_peer',
          description: 'Add a new peer to the network',
          inputSchema: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
                description: 'Name of the peer'
              },
              url: {
                type: 'string',
                description: 'Git URL of the peer\'s repository'
              }
            },
            required: ['name', 'url']
          }
        },
        {
          name: 'remove_peer',
          description: 'Remove a peer from the network',
          inputSchema: {
            type: 'object',
            properties: {
              nameOrUrl: {
                type: 'string',
                description: 'Name or URL of the peer to remove'
              }
            },
            required: ['nameOrUrl']
          }
        },
        {
          name: 'list_peers',
          description: 'List all peers in the network',
          inputSchema: {
            type: 'object',
            properties: {},
            required: []
          }
        },
        {
          name: 'sync_with_peer',
          description: 'Synchronize with a specific peer',
          inputSchema: {
            type: 'object',
            properties: {
              nameOrUrl: {
                type: 'string',
                description: 'Name or URL of the peer to sync with'
              }
            },
            required: ['nameOrUrl']
          }
        },
        {
          name: 'sync_with_all_peers',
          description: 'Synchronize with all peers',
          inputSchema: {
            type: 'object',
            properties: {},
            required: []
          }
        },
        {
          name: 'push_to_peer',
          description: 'Push changes to a specific peer',
          inputSchema: {
            type: 'object',
            properties: {
              nameOrUrl: {
                type: 'string',
                description: 'Name or URL of the peer to push to'
              }
            },
            required: ['nameOrUrl']
          }
        },
        {
          name: 'push_to_all_peers',
          description: 'Push changes to all peers',
          inputSchema: {
            type: 'object',
            properties: {},
            required: []
          }
        },
        {
          name: 'check_peer_status',
          description: 'Check the status of a specific peer',
          inputSchema: {
            type: 'object',
            properties: {
              nameOrUrl: {
                type: 'string',
                description: 'Name or URL of the peer to check'
              }
            },
            required: ['nameOrUrl']
          }
        },
        {
          name: 'check_all_peers_status',
          description: 'Check the status of all peers',
          inputSchema: {
            type: 'object',
            properties: {},
            required: []
          }
        },
        {
          name: 'update_peer_settings',
          description: 'Update peer network settings',
          inputSchema: {
            type: 'object',
            properties: {
              autoSync: {
                type: 'boolean',
                description: 'Enable/disable automatic synchronization'
              },
              syncInterval: {
                type: 'number',
                description: 'Set synchronization interval in seconds'
              },
              maxPeers: {
                type: 'number',
                description: 'Set maximum number of peers'
              },
              discoveryEnabled: {
                type: 'boolean',
                description: 'Enable/disable peer discovery'
              }
            },
            required: []
          }
        },
        
        // Git hook management tools
        {
          name: 'install_hook',
          description: 'Install a Git hook',
          inputSchema: {
            type: 'object',
            properties: {
              hookName: {
                type: 'string',
                description: 'Name of the hook to install'
              }
            },
            required: ['hookName']
          }
        },
        {
          name: 'install_all_hooks',
          description: 'Install all Git hooks',
          inputSchema: {
            type: 'object',
            properties: {},
            required: []
          }
        },
        {
          name: 'uninstall_hook',
          description: 'Uninstall a Git hook',
          inputSchema: {
            type: 'object',
            properties: {
              hookName: {
                type: 'string',
                description: 'Name of the hook to uninstall'
              }
            },
            required: ['hookName']
          }
        },
        {
          name: 'uninstall_all_hooks',
          description: 'Uninstall all Git hooks',
          inputSchema: {
            type: 'object',
            properties: {},
            required: []
          }
        },
        {
          name: 'update_hook',
          description: 'Update a Git hook',
          inputSchema: {
            type: 'object',
            properties: {
              hookName: {
                type: 'string',
                description: 'Name of the hook to update'
              }
            },
            required: ['hookName']
          }
        },
        {
          name: 'update_all_hooks',
          description: 'Update all Git hooks',
          inputSchema: {
            type: 'object',
            properties: {},
            required: []
          }
        },
        {
          name: 'list_hooks',
          description: 'List all Git hooks and their status',
          inputSchema: {
            type: 'object',
            properties: {},
            required: []
          }
        },
        
        // Game action tools (these will use the enhanced commit message format)
        {
          name: 'move_unit_p2p',
          description: 'Move a unit to a new position with enhanced P2P support',
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
          name: 'gather_resources_p2p',
          description: 'Gather resources from a resource node with enhanced P2P support',
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
        }
      ]
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      
      // Peer management tools
      if (name === 'add_peer') {
        const { name: peerName, url } = args as { name: string; url: string };
        
        try {
          // Execute the peer add command
          const output = await executeCli('peer', ['add', peerName, url]);
          
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
            `Failed to add peer: ${(error as Error).message}`
          );
        }
      } 
      else if (name === 'remove_peer') {
        const { nameOrUrl } = args as { nameOrUrl: string };
        
        try {
          // Execute the peer remove command
          const output = await executeCli('peer', ['remove', nameOrUrl]);
          
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
            `Failed to remove peer: ${(error as Error).message}`
          );
        }
      }
      else if (name === 'list_peers') {
        try {
          // Execute the peer list command
          const output = await executeCli('peer', ['list']);
          
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
            `Failed to list peers: ${(error as Error).message}`
          );
        }
      }
      else if (name === 'sync_with_peer') {
        const { nameOrUrl } = args as { nameOrUrl: string };
        
        try {
          // Execute the peer sync command
          const output = await executeCli('peer', ['sync', nameOrUrl]);
          
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
            `Failed to sync with peer: ${(error as Error).message}`
          );
        }
      }
      else if (name === 'sync_with_all_peers') {
        try {
          // Execute the peer sync --all command
          const output = await executeCli('peer', ['sync', '--all']);
          
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
            `Failed to sync with all peers: ${(error as Error).message}`
          );
        }
      }
      else if (name === 'push_to_peer') {
        const { nameOrUrl } = args as { nameOrUrl: string };
        
        try {
          // Execute the peer push command
          const output = await executeCli('peer', ['push', nameOrUrl]);
          
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
            `Failed to push to peer: ${(error as Error).message}`
          );
        }
      }
      else if (name === 'push_to_all_peers') {
        try {
          // Execute the peer push --all command
          const output = await executeCli('peer', ['push', '--all']);
          
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
            `Failed to push to all peers: ${(error as Error).message}`
          );
        }
      }
      else if (name === 'check_peer_status') {
        const { nameOrUrl } = args as { nameOrUrl: string };
        
        try {
          // Execute the peer status command
          const output = await executeCli('peer', ['status', nameOrUrl]);
          
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
            `Failed to check peer status: ${(error as Error).message}`
          );
        }
      }
      else if (name === 'check_all_peers_status') {
        try {
          // Execute the peer status --all command
          const output = await executeCli('peer', ['status', '--all']);
          
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
            `Failed to check all peers status: ${(error as Error).message}`
          );
        }
      }
      else if (name === 'update_peer_settings') {
        try {
          const settings = args as {
            autoSync?: boolean;
            syncInterval?: number;
            maxPeers?: number;
            discoveryEnabled?: boolean;
          };
          
          // Build the command arguments
          const cmdArgs = ['settings'];
          
          if (settings.autoSync !== undefined) {
            cmdArgs.push('--auto-sync', settings.autoSync.toString());
          }
          
          if (settings.syncInterval !== undefined) {
            cmdArgs.push('--sync-interval', settings.syncInterval.toString());
          }
          
          if (settings.maxPeers !== undefined) {
            cmdArgs.push('--max-peers', settings.maxPeers.toString());
          }
          
          if (settings.discoveryEnabled !== undefined) {
            cmdArgs.push('--discovery', settings.discoveryEnabled.toString());
          }
          
          // Execute the peer settings command
          const output = await executeCli('peer', cmdArgs);
          
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
            `Failed to update peer settings: ${(error as Error).message}`
          );
        }
      }
      
      // Git hook management tools
      else if (name === 'install_hook') {
        const { hookName } = args as { hookName: string };
        
        try {
          // Execute the hook install command
          const output = await executeCli('hook', ['install', hookName]);
          
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
            `Failed to install hook: ${(error as Error).message}`
          );
        }
      }
      else if (name === 'install_all_hooks') {
        try {
          // Execute the hook install --all command
          const output = await executeCli('hook', ['install', '--all']);
          
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
            `Failed to install all hooks: ${(error as Error).message}`
          );
        }
      }
      else if (name === 'uninstall_hook') {
        const { hookName } = args as { hookName: string };
        
        try {
          // Execute the hook uninstall command
          const output = await executeCli('hook', ['uninstall', hookName]);
          
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
            `Failed to uninstall hook: ${(error as Error).message}`
          );
        }
      }
      else if (name === 'uninstall_all_hooks') {
        try {
          // Execute the hook uninstall --all command
          const output = await executeCli('hook', ['uninstall', '--all']);
          
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
            `Failed to uninstall all hooks: ${(error as Error).message}`
          );
        }
      }
      else if (name === 'update_hook') {
        const { hookName } = args as { hookName: string };
        
        try {
          // Execute the hook update command
          const output = await executeCli('hook', ['update', hookName]);
          
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
            `Failed to update hook: ${(error as Error).message}`
          );
        }
      }
      else if (name === 'update_all_hooks') {
        try {
          // Execute the hook update --all command
          const output = await executeCli('hook', ['update', '--all']);
          
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
            `Failed to update all hooks: ${(error as Error).message}`
          );
        }
      }
      else if (name === 'list_hooks') {
        try {
          // Execute the hook list command
          const output = await executeCli('hook', ['list']);
          
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
            `Failed to list hooks: ${(error as Error).message}`
          );
        }
      }
      
      // Game action tools with enhanced P2P support
      else if (name === 'move_unit_p2p') {
        const { unitUri, x, y } = args as { unitUri: string; x: number; y: number };
        
        try {
          // Execute the move command with the enhanced commit message format
          const output = await executeCli('move', [unitUri, x.toString(), y.toString()]);
          
          // After successful move, sync with peers
          try {
            await executeCli('peer', ['sync', '--all']);
          } catch (syncError) {
            console.error(`Warning: Failed to sync with peers after move: ${(syncError as Error).message}`);
          }
          
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
            `Failed to move unit: ${(error as Error).message}`
          );
        }
      }
      else if (name === 'gather_resources_p2p') {
        const { unitUri, resourceNodeUri } = args as { unitUri: string; resourceNodeUri: string };
        
        try {
          // Execute the gather command with the enhanced commit message format
          const output = await executeCli('gather', [unitUri, resourceNodeUri]);
          
          // After successful gathering, sync with peers
          try {
            await executeCli('peer', ['sync', '--all']);
          } catch (syncError) {
            console.error(`Warning: Failed to sync with peers after gathering: ${(syncError as Error).message}`);
          }
          
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
            `Failed to gather resources: ${(error as Error).message}`
          );
        }
      }
      
      throw new McpError(
        ErrorCode.MethodNotFound,
        `Unknown tool: ${name}`
      );
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Git-RTS P2P MCP server running on stdio');
  }
}

const server = new GitRtsP2pMcpServer();
server.run().catch(console.error);