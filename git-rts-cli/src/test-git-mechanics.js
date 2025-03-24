const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Test script for Git-based game mechanics
 * 
 * This script demonstrates how to use the Git-based game mechanics
 * by creating a new game, adding a player, and performing game actions.
 * 
 * Note: This is a demonstration script and should be customized for your needs.
 * You'll need to replace the GitHub repository URL with your own.
 */

// Configuration
const GITHUB_REPO_URL = 'https://github.com/yourusername/my-rts-world.git';
const GAME_NAME = 'Test RTS World';
const PLAYER_NAME = 'TestPlayer';
const GAME_REPO_DIR = path.join(__dirname, 'test-game-repo');

// Ensure the test directory exists
if (!fs.existsSync(GAME_REPO_DIR)) {
  fs.mkdirSync(GAME_REPO_DIR, { recursive: true });
} else {
  // Clean up any existing files
  fs.rmSync(GAME_REPO_DIR, { recursive: true, force: true });
  fs.mkdirSync(GAME_REPO_DIR, { recursive: true });
}

console.log('=== Git-RTS Game Mechanics Test ===');
console.log('');

try {
  // Step 1: Create a new game
  console.log(`Creating new game: ${GAME_NAME}`);
  console.log(`Repository: ${GITHUB_REPO_URL}`);
  console.log(`Local directory: ${GAME_REPO_DIR}`);
  console.log('');
  
  execSync(`node index.js create-game "${GITHUB_REPO_URL}" "${GAME_NAME}" --dir "${GAME_REPO_DIR}"`, {
    stdio: 'inherit'
  });
  
  console.log('');
  console.log('Game created successfully!');
  console.log('');
  
  // Step 2: Create a player
  console.log(`Creating player: ${PLAYER_NAME}`);
  console.log('');
  
  execSync(`node index.js create-player "${PLAYER_NAME}" --dir "${GAME_REPO_DIR}"`, {
    stdio: 'inherit'
  });
  
  console.log('');
  console.log('Player created successfully!');
  console.log('');
  
  // Step 3: Perform game actions
  
  // Move a unit
  console.log('Moving unit to position (20, 30)');
  console.log('');
  
  const unitId = `${PLAYER_NAME.toLowerCase()}_unit1`;
  
  execSync(`node index.js move "game:${unitId}" 20 30 --dir "${GAME_REPO_DIR}"`, {
    stdio: 'inherit'
  });
  
  console.log('');
  console.log('Unit moved successfully!');
  console.log('');
  
  // Gather resources
  console.log('Gathering resources from goldMine1');
  console.log('');
  
  execSync(`node index.js gather "game:${unitId}" "game:goldMine1" --dir "${GAME_REPO_DIR}"`, {
    stdio: 'inherit'
  });
  
  console.log('');
  console.log('Resources gathered successfully!');
  console.log('');
  
  // Step 4: Synchronize the turn
  console.log('Synchronizing turn');
  console.log('');
  
  execSync(`node index.js sync-turn --dir "${GAME_REPO_DIR}"`, {
    stdio: 'inherit'
  });
  
  console.log('');
  console.log('Turn synchronized successfully!');
  console.log('');
  
  // Display summary
  console.log('=== Test Summary ===');
  console.log('');
  console.log(`Game: ${GAME_NAME}`);
  console.log(`Repository: ${GITHUB_REPO_URL}`);
  console.log(`Player: ${PLAYER_NAME}`);
  console.log(`Local directory: ${GAME_REPO_DIR}`);
  console.log('');
  console.log('Actions performed:');
  console.log('1. Created a new game');
  console.log('2. Created a player');
  console.log('3. Moved a unit');
  console.log('4. Gathered resources');
  console.log('5. Synchronized the turn');
  console.log('');
  console.log('Test completed successfully!');
  
} catch (error) {
  console.error('Error during test:', error.message);
  process.exit(1);
}