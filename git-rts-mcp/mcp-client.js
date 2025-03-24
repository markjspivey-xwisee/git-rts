import fetch from 'node-fetch';

// Base URL for the MCP server
const BASE_URL = 'http://localhost:3020/mcp/request'; // Changed to 3020

// Helper function to make MCP requests
async function makeMcpRequest(method, params = {}) {
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      id: Date.now(),
      method,
      params
    })
  };

  const response = await fetch(BASE_URL, options);
  return await response.json();
}

// List available tools
async function listTools() {
  console.log('Listing available tools...');
  const result = await makeMcpRequest('list_tools');
  console.log('Available tools:');
  result.result.tools.forEach(tool => {
    console.log(`- ${tool.name}: ${tool.description}`);
  });
  return result;
}

// Call a tool
async function callTool(name, args = {}) {
  console.log(`Calling tool: ${name}`);
  const result = await makeMcpRequest('call_tool', {
    name,
    arguments: args
  });
  console.log('Result:');
  if (result.result && result.result.content) {
    result.result.content.forEach(content => {
      if (content.type === 'text') {
        console.log(content.text);
      } else {
        console.log(content);
      }
    });
  } else {
    console.log(result);
  }
  return result;
}

// Main function
async function main() {
  try {
    // List available tools
    await listTools();
    console.log();

    // Get GitHub configuration
    console.log('Getting GitHub configuration...');
    await callTool('get_github_config');
    console.log();

    // Move a unit
    console.log('Moving unit...');
    await callTool('move_unit', {
      unitUri: 'game:unit1',
      x: 10,
      y: 10
    });
    console.log();

    // Gather resources
    console.log('Gathering resources...');
    await callTool('gather_resources', {
      unitUri: 'game:unit1',
      resourceNodeUri: 'game:goldMine1'
    });
    console.log();

    // Push changes to GitHub
    console.log('Pushing changes to GitHub...');
    await callTool('push_to_github');
    console.log();

    // Pull changes from GitHub
    console.log('Pulling changes from GitHub...');
    await callTool('pull_from_github');
    console.log();

  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the main function
main();