import fetch from 'node-fetch';

// Base URL for the MCP server
const BASE_URL = 'http://localhost:3020'; // Changed to 3020

// Helper function to make API requests
async function makeRequest(endpoint, method = 'GET', body = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json'
    }
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, options);
  return await response.json();
}

// Test functions
async function testGitHubConfig() {
  console.log('Testing GitHub configuration...');
  const result = await makeRequest('/api/github-config');
  console.log('GitHub Config:', result);
  return result;
}

async function testGameState() {
  console.log('Testing game state...');
  const result = await makeRequest('/api/game-state');
  console.log('Game State:', result.success ? 'Success' : 'Failed');
  if (result.success) {
    console.log('World:', result.gameState.world.substring(0, 100) + '...');
    console.log('Units:', result.gameState.units.substring(0, 100) + '...');
  } else {
    console.error('Error:', result.error);
  }
  return result;
}

async function testGameLog() {
  console.log('Testing game log...');
  const result = await makeRequest('/api/game-log');
  console.log('Game Log:', result.success ? 'Success' : 'Failed');
  if (result.success) {
    console.log(result.log);
  } else {
    console.error('Error:', result.error);
  }
  return result;
}

async function testMoveUnit() {
  console.log('Testing move unit...');
  const result = await makeRequest('/api/move', 'POST', {
    unitUri: 'game:unit1',
    x: 10,
    y: 10
  });
  console.log('Move Unit:', result.success ? 'Success' : 'Failed');
  if (result.success) {
    console.log('Output:', result.output);
  } else {
    console.error('Error:', result.error);
  }
  return result;
}

async function testGatherResources() {
  console.log('Testing gather resources...');
  const result = await makeRequest('/api/gather', 'POST', {
    unitUri: 'game:unit1',
    resourceNodeUri: 'game:goldMine1'
  });
  console.log('Gather Resources:', result.success ? 'Success' : 'Failed');
  if (result.success) {
    console.log('Output:', result.output);
  } else {
    console.error('Error:', result.error);
  }
  return result;
}

async function testPush() {
  console.log('Testing push to GitHub...');
  const result = await makeRequest('/api/push', 'POST');
  console.log('Push to GitHub:', result.success ? 'Success' : 'Failed');
  if (result.success) {
    console.log('Output:', result.output);
  } else {
    console.error('Error:', result.error);
  }
  return result;
}

async function testPull() {
  console.log('Testing pull from GitHub...');
  const result = await makeRequest('/api/pull', 'POST');
  console.log('Pull from GitHub:', result.success ? 'Success' : 'Failed');
  if (result.success) {
    console.log('Output:', result.output);
  } else {
    console.error('Error:', result.error);
  }
  return result;
}

// Run all tests
async function runTests() {
  try {
    console.log('=== Testing Git-RTS MCP Server ===');
    
    // Test GitHub configuration
    await testGitHubConfig();
    console.log();
    
    // Test game state
    await testGameState();
    console.log();
    
    // Test game log
    await testGameLog();
    console.log();
    
    // Test move unit
    await testMoveUnit();
    console.log();
    
    // Test gather resources
    await testGatherResources();
    console.log();
    
    // Test push to GitHub
    await testPush();
    console.log();
    
    // Test pull from GitHub
    await testPull();
    console.log();
    
    console.log('=== All tests completed ===');
  } catch (error) {
    console.error('Error running tests:', error);
  }
}

// Run the tests
runTests();