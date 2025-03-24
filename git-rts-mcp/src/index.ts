import express from 'express';
import { exec } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { pushToGitHub, pullFromGitHub, executeCliWithGitHub, loadGitHubConfig } from './github-tools.js';

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

// Create Express app
const app = express();
app.use(express.json());

// Enable CORS
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

// MCP Server implementation
app.post('/mcp/request', async (req, res) => {
  try {
    const { id, method, params } = req.body;
    
    if (method === 'list_tools') {
      res.json({
        id,
        result: {
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
            }
          ]
        }
      });
    } else if (method === 'call_tool') {
      const { name, arguments: args } = params;
      
      if (name === 'get_github_config') {
        const config = await loadGitHubConfig();
        if (!config) {
          return res.status(404).json({
            id,
            error: {
              code: -32000,
              message: 'GitHub configuration not found'
            }
          });
        }
        
        // Don't expose the token
        const safeConfig = {
          username: config.username,
          repository: config.repository
        };
        
        res.json({
          id,
          result: {
            content: [
              {
                type: 'text',
                text: JSON.stringify(safeConfig, null, 2)
              }
            ]
          }
        });
      } else if (name === 'move_unit') {
        const { unitUri, x, y } = args;
        if (!unitUri || x === undefined || y === undefined) {
          return res.status(400).json({
            id,
            error: {
              code: -32000,
              message: 'Unit URI, x, and y coordinates are required'
            }
          });
        }
        
        const output = await executeCli('move', [unitUri, x.toString(), y.toString()]);
        
        // Push changes to GitHub
        try {
          await pushToGitHub();
        } catch (pushError) {
          console.error('Failed to push to GitHub:', pushError instanceof Error ? pushError.message : String(pushError));
        }
        
        res.json({
          id,
          result: {
            content: [
              {
                type: 'text',
                text: output
              }
            ]
          }
        });
      } else if (name === 'gather_resources') {
        const { unitUri, resourceNodeUri } = args;
        if (!unitUri || !resourceNodeUri) {
          return res.status(400).json({
            id,
            error: {
              code: -32000,
              message: 'Unit URI and resource node URI are required'
            }
          });
        }
        
        const output = await executeCli('gather', [unitUri, resourceNodeUri]);
        
        // Push changes to GitHub
        try {
          await pushToGitHub();
        } catch (pushError) {
          console.error('Failed to push to GitHub:', pushError instanceof Error ? pushError.message : String(pushError));
        }
        
        res.json({
          id,
          result: {
            content: [
              {
                type: 'text',
                text: output
              }
            ]
          }
        });
      } else if (name === 'push_to_github') {
        const output = await pushToGitHub();
        res.json({
          id,
          result: {
            content: [
              {
                type: 'text',
                text: output
              }
            ]
          }
        });
      } else if (name === 'pull_from_github') {
        const output = await pullFromGitHub();
        res.json({
          id,
          result: {
            content: [
              {
                type: 'text',
                text: output
              }
            ]
          }
        });
      } else {
        res.status(404).json({
          id,
          error: {
            code: -32601,
            message: `Method not found: ${name}`
          }
        });
      }
    } else {
      res.status(404).json({
        id,
        error: {
          code: -32601,
          message: `Method not found: ${method}`
        }
      });
    }
  } catch (error) {
    res.status(500).json({
      id: req.body.id,
      error: {
        code: -32000,
        message: error instanceof Error ? error.message : String(error)
      }
    });
  }
});

// SSE endpoint for MCP
app.get('/mcp/sse', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  // Send a ping event every 10 seconds to keep the connection alive
  const pingInterval = setInterval(() => {
    res.write('event: ping\ndata: {}\n\n');
  }, 10000);
  
  // Clean up when the client disconnects
  req.on('close', () => {
    clearInterval(pingInterval);
  });
  
  // Send an initial event to confirm the connection
  res.write('event: connected\ndata: {"status":"connected"}\n\n');
});

// Define API routes
app.post('/api/init', async (req, res) => {
  try {
    const output = await executeCli('init', []);
    res.json({ success: true, output });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : String(error) });
  }
});

app.post('/api/join', async (req, res) => {
  try {
    const { repoUrl } = req.body;
    if (!repoUrl) {
      return res.status(400).json({ success: false, error: 'Repository URL is required' });
    }
    const output = await executeCli('join', [repoUrl]);
    res.json({ success: true, output });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : String(error) });
  }
});

app.post('/api/explore', async (req, res) => {
  try {
    const { resourceUri } = req.body;
    if (!resourceUri) {
      return res.status(400).json({ success: false, error: 'Resource URI is required' });
    }
    const output = await executeCli('explore', [resourceUri]);
    res.json({ success: true, output });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : String(error) });
  }
});

app.post('/api/move', async (req, res) => {
  try {
    const { unitUri, x, y } = req.body;
    if (!unitUri || x === undefined || y === undefined) {
      return res.status(400).json({ success: false, error: 'Unit URI, x, and y coordinates are required' });
    }
    const output = await executeCli('move', [unitUri, x.toString(), y.toString()]);
    
    // Push changes to GitHub
    try {
      await pushToGitHub();
    } catch (pushError) {
      console.error('Failed to push to GitHub:', pushError instanceof Error ? pushError.message : String(pushError));
    }
    
    res.json({ success: true, output });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : String(error) });
  }
});

app.post('/api/gather', async (req, res) => {
  try {
    const { unitUri, resourceNodeUri } = req.body;
    if (!unitUri || !resourceNodeUri) {
      return res.status(400).json({ success: false, error: 'Unit URI and resource node URI are required' });
    }
    const output = await executeCli('gather', [unitUri, resourceNodeUri]);
    
    // Push changes to GitHub
    try {
      await pushToGitHub();
    } catch (pushError) {
      console.error('Failed to push to GitHub:', pushError instanceof Error ? pushError.message : String(pushError));
    }
    
    res.json({ success: true, output });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : String(error) });
  }
});

// GitHub integration routes
app.post('/api/push', async (req, res) => {
  try {
    const output = await pushToGitHub();
    res.json({ success: true, output });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : String(error) });
  }
});

app.post('/api/pull', async (req, res) => {
  try {
    const output = await pullFromGitHub();
    res.json({ success: true, output });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : String(error) });
  }
});

// Get GitHub configuration
app.get('/api/github-config', async (req, res) => {
  try {
    const config = await loadGitHubConfig();
    if (!config) {
      return res.status(404).json({ success: false, error: 'GitHub configuration not found' });
    }
    
    // Don't expose the token
    const safeConfig = {
      username: config.username,
      repository: config.repository
    };
    
    res.json({ success: true, config: safeConfig });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : String(error) });
  }
});

// Get game state
app.get('/api/game-state', async (req, res) => {
  try {
    const gameState = {
      world: await fs.readFile(path.join(gameRepoDir, 'world.ttl'), 'utf8'),
      units: await fs.readFile(path.join(gameRepoDir, 'units.ttl'), 'utf8'),
      playerResources: await fs.readFile(path.join(gameRepoDir, 'player_resources.ttl'), 'utf8'),
      resourceNodes: await fs.readFile(path.join(gameRepoDir, 'resource_nodes.ttl'), 'utf8')
    };
    
    try {
      gameState['buildings'] = await fs.readFile(path.join(gameRepoDir, 'buildings.ttl'), 'utf8');
    } catch (error) {
      // Buildings file might not exist yet
    }
    
    // Try to read player2 resources if they exist
    try {
      gameState['player2Resources'] = await fs.readFile(path.join(gameRepoDir, 'player2_resources.ttl'), 'utf8');
    } catch (error) {
      // Player2 resources file might not exist yet
    }
    
    // Try to read player units files
    try {
      gameState['player1Units'] = await fs.readFile(path.join(gameRepoDir, 'player_units.ttl'), 'utf8');
    } catch (error) {
      // Player1 units file might not exist yet
    }
    
    try {
      gameState['player2Units'] = await fs.readFile(path.join(gameRepoDir, 'player2_units.ttl'), 'utf8');
    } catch (error) {
      // Player2 units file might not exist yet
    }
    
    res.json({ success: true, gameState });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : String(error) });
  }
});

// Get game log
app.get('/api/game-log', async (req, res) => {
  try {
    const output = await new Promise<string>((resolve, reject) => {
      exec('git log --pretty=format:"%h - %an, %ar : %s" --max-count=10', { cwd: gameRepoDir }, (error, stdout, stderr) => {
        if (error) {
          reject(new Error(`Command execution error: ${error.message}\n${stderr}`));
        } else {
          resolve(stdout);
        }
      });
    });
    
    res.json({ success: true, log: output });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : String(error) });
  }
});

// Start the server
const PORT = process.env.PORT || 3020; // Changed to 3020
app.listen(PORT, () => {
  console.log(`Git-RTS MCP server running on port ${PORT}`);
  console.log(`Using GitHub username: ${process.env.GITHUB_USERNAME || 'from config file'}`);
  console.log(`Using game repository directory: ${gameRepoDir}`);
});