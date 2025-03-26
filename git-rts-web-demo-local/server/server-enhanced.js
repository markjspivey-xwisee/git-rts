const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const cors = require('cors');
const { Octokit } = require('@octokit/rest');
const { v4: uuidv4 } = require('uuid');
const { execSync } = require('child_process');
const fs = require('fs').promises;
const fsSync = require('fs');
const demoSteps = require('./demo-steps');

// Import Git-RTS CLI modules
const peerManager = require('../../src/lib/peer-manager');
const hookManager = require('../../src/lib/hook-manager');

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Add a default route for the root path
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Git-RTS Enhanced Demo</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
          h1 { color: #333; }
          .container { border: 1px solid #ddd; padding: 20px; border-radius: 5px; }
          .info { background-color: #f0f8ff; padding: 10px; border-radius: 5px; margin-bottom: 20px; }
          form { margin-top: 20px; }
          label { display: block; margin-bottom: 5px; }
          input { width: 100%; padding: 8px; margin-bottom: 15px; box-sizing: border-box; }
          button { background-color: #4CAF50; color: white; padding: 10px 15px; border: none; border-radius: 4px; cursor: pointer; }
          button:hover { background-color: #45a049; }
        </style>
      </head>
      <body>
        <h1>Git-RTS Enhanced Demo</h1>
        <div class="info">
          <p>This is the enhanced version of the Git-RTS demo that performs real Git operations.</p>
          <p>To use the demo, please open <a href="/test-enhanced.html">the test interface</a> in your browser.</p>
        </div>
        <div class="container">
          <h2>Direct API Access</h2>
          <p>You can also interact with the API directly:</p>
          <ul>
            <li>POST /api/validate-credentials - Validate GitHub credentials</li>
            <li>POST /api/initialize-repositories - Create repositories</li>
            <li>POST /api/start-demo - Start the demo</li>
            <li>POST /api/cleanup - Clean up repositories</li>
          </ul>
        </div>
      </body>
    </html>
  `);
});

// Serve the test interface
app.get('/test-enhanced.html', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'test-enhanced.html'));
});

// Session storage
const sessions = new Map();

// API endpoints
app.post('/api/validate-credentials', async (req, res) => {
  const { username1, token1, username2, token2 } = req.body;
  
  try {
    // Validate first user
    const octokit1 = new Octokit({ auth: token1 });
    const user1 = await octokit1.users.getAuthenticated();
    
    if (user1.data.login !== username1) {
      return res.status(400).json({ success: false, error: 'Invalid credentials for Player 1' });
    }
    
    // Validate second user
    const octokit2 = new Octokit({ auth: token2 });
    const user2 = await octokit2.users.getAuthenticated();
    
    if (user2.data.login !== username2) {
      return res.status(400).json({ success: false, error: 'Invalid credentials for Player 2' });
    }
    
    // Create session
    const sessionId = uuidv4();
    sessions.set(sessionId, {
      player1: { username: username1, token: token1 },
      player2: { username: username2, token: token2 },
      repositories: [],
      gameState: {},
      demoStep: 0,
    });
    
    res.json({ success: true, sessionId });
  } catch (error) {
    console.error('Credential validation error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

// Helper function to execute Git commands with better error handling
function executeGitCommand(command, cwd, allowFailure = false) {
  try {
    const output = execSync(command, { cwd, encoding: 'utf8' });
    return { success: true, output };
  } catch (error) {
    console.error(`Git command failed: ${command}`, error);
    if (allowFailure) {
      return { success: false, output: error.message };
    }
    throw error;
  }
}

// Use a different port to avoid conflicts
const PORT = process.env.PORT || 5002;
server.listen(PORT, () => console.log(`Enhanced server running on port ${PORT}`));
