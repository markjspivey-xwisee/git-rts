const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');

/**
 * Updates ontology URIs in a game repository to use game-specific namespaces
 * 
 * @param {string} repoUrl - The URL of the game repository
 * @param {string} gameRepoDir - The local directory of the game repository
 */
async function updateOntologyUris(repoUrl, gameRepoDir = 'C:/Users/markj/Desktop/game-repo') {
  console.log(`Updating ontology URIs for repository: ${repoUrl}`);
  
  try {
    // Extract username and repo name from the URL
    let username, repoName;
    
    if (repoUrl.includes('github.com')) {
      // Format: https://github.com/username/repo-name.git
      const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/\.]+)/);
      if (match) {
        username = match[1];
        repoName = match[2];
      }
    } else if (repoUrl.includes('@github.com')) {
      // Format: https://username:token@github.com/username/repo-name.git
      const match = repoUrl.match(/@github\.com\/([^\/]+)\/([^\/\.]+)/);
      if (match) {
        username = match[1];
        repoName = match[2];
      }
    }
    
    if (!username || !repoName) {
      throw new Error('Could not extract username and repository name from URL');
    }
    
    // Generate the game-specific URI namespace
    const oldNamespace = 'http://example.org/game';
    const newNamespace = `https://${username}.github.io/${repoName}/ontology`;
    
    console.log(`Updating namespace from ${oldNamespace} to ${newNamespace}`);
    
    // Get all TTL files in the game repository
    const files = await fs.readdir(gameRepoDir);
    const ttlFiles = files.filter(file => file.endsWith('.ttl'));
    
    // Update each TTL file
    for (const file of ttlFiles) {
      const filePath = path.join(gameRepoDir, file);
      console.log(`Updating file: ${filePath}`);
      
      // Read the file content
      let content = await fs.readFile(filePath, 'utf8');
      
      // Replace the namespace
      content = content.replace(new RegExp(oldNamespace, 'g'), newNamespace);
      
      // Write the updated content back to the file
      await fs.writeFile(filePath, content);
    }
    
    // Create the ontology directory if it doesn't exist
    const ontologyDir = path.join(gameRepoDir, 'ontology');
    await fs.mkdir(ontologyDir, { recursive: true });
    
    // Copy the game-ontology.ttl file to the ontology directory
    const ontologyPath = path.join(gameRepoDir, 'game-ontology.ttl');
    const newOntologyPath = path.join(ontologyDir, 'index.ttl');
    
    if (await fileExists(ontologyPath)) {
      // Read the ontology file
      let ontologyContent = await fs.readFile(ontologyPath, 'utf8');
      
      // Replace the namespace
      ontologyContent = ontologyContent.replace(new RegExp(oldNamespace, 'g'), newNamespace);
      
      // Write the updated ontology to the ontology directory
      await fs.writeFile(newOntologyPath, ontologyContent);
      
      console.log(`Ontology file copied to ${newOntologyPath}`);
    }
    
    // Create a simple HTML file to serve the ontology
    const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Game Ontology</title>
  <meta name="description" content="Ontology for ${repoName} game world">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body>
  <h1>Game Ontology for ${repoName}</h1>
  <p>This page serves the ontology for the ${repoName} game world.</p>
  <p>The ontology is available in Turtle format at <a href="index.ttl">index.ttl</a>.</p>
  <p>The game is hosted at <a href="https://github.com/${username}/${repoName}">https://github.com/${username}/${repoName}</a>.</p>
</body>
</html>`;
    
    await fs.writeFile(path.join(ontologyDir, 'index.html'), htmlContent);
    
    // Create a README.md file for the ontology directory
    const readmeContent = `# Game Ontology for ${repoName}

This directory contains the ontology for the ${repoName} game world.

## Files

- \`index.ttl\`: The main ontology file in Turtle format
- \`index.html\`: A simple HTML page to serve the ontology

## URI Namespace

The URI namespace for this game is:

\`\`\`
${newNamespace}#
\`\`\`

For example, the URI for the Unit class is:

\`\`\`
${newNamespace}#Unit
\`\`\`

## Hosting

The ontology is hosted on GitHub Pages at:

\`\`\`
https://${username}.github.io/${repoName}/ontology
\`\`\`

To enable GitHub Pages for this repository, go to the repository settings and enable GitHub Pages for the main branch.
`;
    
    await fs.writeFile(path.join(ontologyDir, 'README.md'), readmeContent);
    
    // Commit the changes
    await execPromise('git add .', { cwd: gameRepoDir });
    await execPromise('git commit -m "Update ontology URIs to use game-specific namespace"', { cwd: gameRepoDir });
    
    console.log('Ontology URIs updated successfully!');
    console.log(`New namespace: ${newNamespace}#`);
    console.log('To enable GitHub Pages for this repository, go to the repository settings and enable GitHub Pages for the main branch.');
    
    return newNamespace;
  } catch (error) {
    console.error('Error updating ontology URIs:', error.message);
    throw error;
  }
}

/**
 * Check if a file exists
 * 
 * @param {string} filePath - The path to the file
 * @returns {Promise<boolean>} - True if the file exists, false otherwise
 */
async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Execute a command as a Promise
 * 
 * @param {string} command - The command to execute
 * @param {object} options - Options for the command
 * @returns {Promise<string>} - The command output
 */
function execPromise(command, options) {
  return new Promise((resolve, reject) => {
    exec(command, options, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing command: ${error.message}`);
        console.error(`stderr: ${stderr}`);
        reject(error);
      } else {
        resolve(stdout);
      }
    });
  });
}

// If this script is run directly, execute the function with command line arguments
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.error('Usage: node update-ontology-uris.js <repo-url> [game-repo-dir]');
    process.exit(1);
  }
  
  const repoUrl = args[0];
  const gameRepoDir = args[1] || 'C:/Users/markj/Desktop/game-repo';
  
  updateOntologyUris(repoUrl, gameRepoDir)
    .then(() => {
      console.log('Done!');
    })
    .catch(error => {
      console.error('Error:', error.message);
      process.exit(1);
    });
} else {
  // Export the function for use in other modules
  module.exports = { updateOntologyUris };
}