const express = require('express');
const path = require('path');
const { exec } = require('child_process');
const fs = require('fs').promises;

const http = require('http');
const { Server } = require('socket.io');

const app = express();
const port = 3000;

const server = http.createServer(app);
const io = new Server(server);

// Serve static files
app.use(express.static(path.join(__dirname)));

// Serve the main HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Explicitly serve the interactive-map.js file
app.get('/interactive-map.js', (req, res) => {
  console.log('Serving interactive-map.js file');
  res.sendFile(path.join(__dirname, 'interactive-map.js'));
});

// Function to read game state
async function getGameState() {
  const gameRepoDir = 'C:/Users/markj/Desktop/game-repo';
  
  try {
    
    // Read world data
    const worldTtl = await fs.readFile(path.join(gameRepoDir, 'world.ttl'), 'utf8');
    
    // Read units data
    const unitsTtl = await fs.readFile(path.join(gameRepoDir, 'units.ttl'), 'utf8');
    
    // Read buildings data
    let buildingsTtl = '';
    try {
      buildingsTtl = await fs.readFile(path.join(gameRepoDir, 'buildings.ttl'), 'utf8');
    } catch (error) {
      console.log('No buildings.ttl file found');
    }
    
    // Read resource nodes data
    const resourceNodesTtl = await fs.readFile(path.join(gameRepoDir, 'resource_nodes.ttl'), 'utf8');
    
    // Read player1 resources data
    const player1ResourcesTtl = await fs.readFile(path.join(gameRepoDir, 'player_resources.ttl'), 'utf8');
    
    // Read player2 resources data if it exists
    let player2ResourcesTtl = '';
    try {
      player2ResourcesTtl = await fs.readFile(path.join(gameRepoDir, 'player2_resources.ttl'), 'utf8');
    } catch (error) {
      console.log('No player2_resources.ttl file found');
    }
    
    // Read player1 units data
    const player1UnitsTtl = await fs.readFile(path.join(gameRepoDir, 'player_units.ttl'), 'utf8');
    
    // Read player2 units data if it exists
    let player2UnitsTtl = '';
    try {
      player2UnitsTtl = await fs.readFile(path.join(gameRepoDir, 'player2_units.ttl'), 'utf8');
    } catch (error) {
      console.log('No player2_units.ttl file found');
    }
    
    return {
      world: worldTtl,
      units: unitsTtl,
      buildings: buildingsTtl,
      resourceNodes: resourceNodesTtl,
      player1Resources: player1ResourcesTtl,
      player2Resources: player2ResourcesTtl,
      player1Units: player1UnitsTtl,
      player2Units: player2UnitsTtl
    };
  } catch (error) {
    console.error('Error reading game state:', error);
    throw error;
  }
}

// Function to get game log
function getGameLog() {
  return new Promise((resolve, reject) => {
    const gameRepoDir = 'C:/Users/markj/Desktop/game-repo';
    exec('git log --pretty=format:"%h - %an, %ar : %s" --max-count=10', { cwd: gameRepoDir }, (error, stdout, stderr) => {
      if (error) {
        console.error(`Command execution error: ${error.message}`);
        reject(error);
      } else {
        resolve(stdout);
      }
    });
  });
}

// API endpoint to get game state
app.get('/api/game-state', async (req, res) => {
  try {
    const gameState = await getGameState();
    res.json(gameState);
  } catch (error) {
    console.error('Error reading game state:', error);
    res.status(500).json({ error: 'Failed to read game state', details: error.message });
  }
});

// API endpoint to get game log
app.get('/api/game-log', async (req, res) => {
  try {
    const gameLog = await getGameLog();
    res.json({
      gameLog: gameLog,
      message: 'This is a read-only visualization. Use the CLI or MCP to control the game.'
    });
  } catch (error) {
    console.error('Error executing command:', error);
    res.status(500).json({ error: 'Failed to execute command' });
  }
});

// API endpoint to move a unit
app.post('/api/move-unit', async (req, res) => {
  try {
    const { unitId, x, y } = req.body;
    
    if (!unitId || x === undefined || y === undefined) {
      return res.status(400).json({ error: 'Unit ID, x, and y coordinates are required' });
    }
    
    const gameRepoDir = 'C:/Users/markj/Desktop/game-repo';
    const unitsTtlPath = path.join(gameRepoDir, 'units.ttl');
    
    // Read the units.ttl file
    const unitsTtl = await fs.readFile(unitsTtlPath, 'utf8');
    
    // Extract the unit ID without the 'game:' prefix
    const unitIdWithoutPrefix = unitId.replace('game:', '');
    
    // Update the unit's location
    const updatedUnitsTtl = unitsTtl.replace(
      new RegExp(`game:${unitIdWithoutPrefix}[\\s\\S]*?game:location "{x: \\d+, y: \\d+}"`),
      `game:${unitIdWithoutPrefix} a game:Unit;\n game:location "{x: ${x}, y: ${y}}"`
    );
    
    // Write the updated TTL data back to the file
    await fs.writeFile(unitsTtlPath, updatedUnitsTtl);
    
    res.json({ success: true, message: `Unit ${unitId} moved to (${x}, ${y})` });
  } catch (error) {
    console.error('Error moving unit:', error);
    res.status(500).json({ error: 'Failed to move unit', details: error.message });
  }
});


// Set up Socket.IO connection
io.on('connection', (socket) => {
  console.log('A client connected');
  
  // Send initial game state
  getGameState().then(gameState => {
    socket.emit('gameState', gameState);
  }).catch(error => {
    console.error('Error sending initial game state:', error);
  });
  
  // Send initial game log
  getGameLog().then(gameLog => {
    socket.emit('gameLog', gameLog);
  }).catch(error => {
    console.error('Error sending initial game log:', error);
  });
  
  socket.on('disconnect', () => {
    console.log('A client disconnected');
  });
});

// Set up file watchers to detect changes
const gameRepoDir = 'C:/Users/markj/Desktop/game-repo';
fs.readdir(gameRepoDir).then(files => {
  files.filter(file => file.endsWith('.ttl')).forEach(file => {
    const filePath = path.join(gameRepoDir, file);
    fs.stat(filePath).then(stats => {
      let lastModified = stats.mtime;
      // Check for file changes every second
      setInterval(async () => {
        try {
          const stats = await fs.stat(filePath);
          if (stats.mtime > lastModified) {
            console.log(`File ${file} changed, updating clients`);
            lastModified = stats.mtime;
            
            // Send updated game state to all clients
            const gameState = await getGameState();
            io.emit('gameState', gameState);
            
            // Send updated game log
            const gameLog = await getGameLog();
            io.emit('gameLog', gameLog);
          }
        } catch (error) {
          console.error(`Error checking file ${file}:`, error);
        }
      }, 1000);
    }).catch(error => {
      console.error(`Error setting up watcher for ${file}:`, error);
    });
  });
}).catch(error => {
  console.error('Error setting up file watchers:', error);
});

// Start the server with Socket.IO
server.listen(port, () => {
  console.log(`Git-RTS web server running at http://localhost:${port}`);
});