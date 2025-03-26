const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const cors = require('cors');
const { Octokit } = require('@octokit/rest');
const { v4: uuidv4 } = require('uuid');
const { execSync } = require('child_process');
const fs = require('fs');
const demoSteps = require('./demo-steps');

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

app.post('/api/initialize-repositories', async (req, res) => {
  const { sessionId } = req.body;
  
  if (!sessions.has(sessionId)) {
    return res.status(400).json({ success: false, error: 'Invalid session' });
  }
  
  const session = sessions.get(sessionId);
  const { player1, player2 } = session;
  
  try {
    // Create repositories for both players
    const octokit1 = new Octokit({ auth: player1.token });
    const octokit2 = new Octokit({ auth: player2.token });
    
    // Create repository for player 1
    const repo1Name = `git-rts-demo-${uuidv4().substring(0, 8)}`;
    await octokit1.repos.createForAuthenticatedUser({
      name: repo1Name,
      description: 'Git-RTS Demo Repository for Player 1',
      private: true,
      auto_init: true,
    });
    
    // Create repository for player 2
    const repo2Name = `git-rts-demo-${uuidv4().substring(0, 8)}`;
    await octokit2.repos.createForAuthenticatedUser({
      name: repo2Name,
      description: 'Git-RTS Demo Repository for Player 2',
      private: true,
      auto_init: true,
    });
    
    // Store repository information
    session.repositories = [
      { name: repo1Name, owner: player1.username, url: `https://github.com/${player1.username}/${repo1Name}.git` },
      { name: repo2Name, owner: player2.username, url: `https://github.com/${player2.username}/${repo2Name}.git` },
    ];
    
    res.json({ success: true, repositories: session.repositories });
  } catch (error) {
    console.error('Repository initialization error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/start-demo', (req, res) => {
  const { sessionId } = req.body;
  
  if (!sessions.has(sessionId)) {
    return res.status(400).json({ success: false, error: 'Invalid session' });
  }
  
  const session = sessions.get(sessionId);
  
  // Start demo in a separate process
  startDemo(sessionId, session);
  
  res.json({ success: true });
});

app.post('/api/cleanup', async (req, res) => {
  const { sessionId } = req.body;
  
  if (!sessions.has(sessionId)) {
    return res.status(400).json({ success: false, error: 'Invalid session' });
  }
  
  const session = sessions.get(sessionId);
  const { player1, player2, repositories } = session;
  
  try {
    // Delete repositories
    const octokit1 = new Octokit({ auth: player1.token });
    const octokit2 = new Octokit({ auth: player2.token });
    
    await octokit1.repos.delete({
      owner: player1.username,
      repo: repositories[0].name,
    });
    
    await octokit2.repos.delete({
      owner: player2.username,
      repo: repositories[1].name,
    });
    
    // Remove session
    sessions.delete(sessionId);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Cleanup error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Socket.IO connection handler
io.on('connection', (socket) => {
  console.log('New client connected');
  
  socket.on('join', (sessionId) => {
    if (sessions.has(sessionId)) {
      socket.join(sessionId);
      console.log(`Client joined session ${sessionId}`);
    }
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Demo script executor
function startDemo(sessionId, session) {
  const { repositories } = session;
  
  // Create working directory
  const workDir = path.join(__dirname, '..', 'temp', sessionId);
  if (!fs.existsSync(workDir)) {
    fs.mkdirSync(workDir, { recursive: true });
  }
  
  // Clone repositories locally (in a real implementation)
  // For demo purposes, we'll simulate the commands and their outputs
  
  let currentStep = 0;
  const demoInterval = setInterval(() => {
    if (currentStep >= demoSteps.length) {
      clearInterval(demoInterval);
      return;
    }
    
    const step = demoSteps[currentStep];
    
    // Simulate command execution
    console.log(`Executing step ${currentStep}: ${step.command}`);
    
    // Broadcast command to clients
    io.to(sessionId).emit('command', {
      player: step.player,
      command: step.command,
      output: step.output || `Simulated output for: ${step.command}`,
    });
    
    // Simulate commit if this step creates one
    if (step.createsCommit) {
      const commitInfo = {
        repository: repositories[step.player - 1].name,
        author: step.player === 1 ? session.player1.username : session.player2.username,
        message: step.commitMessage || `Commit from step ${currentStep}`,
        hash: `simulated-hash-${currentStep}`,
        isMerge: step.isMerge || false,
        mergeFrom: step.mergeFrom,
      };
      
      io.to(sessionId).emit('commit', commitInfo);
    }
    
    // Update game state
    if (step.updatesGameState) {
      // In a real implementation, we would parse the game state from the repositories
      // For demo purposes, we'll use predefined game states
      const gameState = getSimulatedGameState(currentStep);
      session.gameState = gameState;
      
      io.to(sessionId).emit('gameState', gameState);
    }
    
    currentStep++;
  }, 3000); // Execute a step every 3 seconds
  
  // Store interval for cleanup
  session.demoInterval = demoInterval;
}

// Simulated game state generator
function getSimulatedGameState(step) {
  // Basic game state that evolves with each step
  const gameState = {
    map: {
      width: 10,
      height: 10,
      cells: []
    },
    players: [
      {
        id: 1,
        name: 'Player 1',
        resources: {
          gold: 100 + step * 10,
          wood: 200 + step * 5,
          stone: 50 + step * 2,
          food: 150 + step * 8
        },
        units: []
      },
      {
        id: 2,
        name: 'Player 2',
        resources: {
          gold: 100 + step * 8,
          wood: 200 + step * 6,
          stone: 50 + step * 3,
          food: 150 + step * 7
        },
        units: []
      }
    ]
  };
  
  // Generate map cells
  for (let y = 0; y < gameState.map.height; y++) {
    for (let x = 0; x < gameState.map.width; x++) {
      const cell = {
        x,
        y,
        type: 'grass',
        explored: Math.random() > 0.3,
      };
      
      // Add some resources
      if (Math.random() < 0.1) {
        cell.resource = {
          type: ['gold', 'wood', 'stone', 'food'][Math.floor(Math.random() * 4)],
          amount: Math.floor(Math.random() * 100) + 50
        };
      }
      
      gameState.map.cells.push(cell);
    }
  }
  
  // Add units based on step
  if (step >= 2) {
    gameState.players[0].units.push({
      id: 'unit1',
      type: 'settler',
      x: 2,
      y: 3,
      health: 100,
      attack: 1,
      defense: 1
    });
  }
  
  if (step >= 3) {
    gameState.players[1].units.push({
      id: 'unit2',
      type: 'settler',
      x: 7,
      y: 6,
      health: 100,
      attack: 1,
      defense: 1
    });
  }
  
  if (step >= 5) {
    gameState.players[0].units.push({
      id: 'unit3',
      type: 'warrior',
      x: 3,
      y: 4,
      health: 100,
      attack: 5,
      defense: 3
    });
  }
  
  if (step >= 6) {
    gameState.players[1].units.push({
      id: 'unit4',
      type: 'archer',
      x: 6,
      y: 5,
      health: 100,
      attack: 7,
      defense: 2
    });
  }
  
  return gameState;
}

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../client/build', 'index.html'));
  });
}

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));