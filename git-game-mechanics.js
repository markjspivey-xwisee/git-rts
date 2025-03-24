const { program } = require('commander');
const fs = require('fs').promises;
const { exec } = require('child_process');
const path = require('path');
const { updateOntologyUris } = require('./update-ontology-uris');

// Default directories
const DEFAULT_GAME_REPO_DIR = 'C:/Users/markj/Desktop/game-repo';
const DEFAULT_TEMPLATE_REPO = 'https://github.com/git-rts/world-template.git';

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

/**
 * Create a new game by forking the template repository
 * 
 * @param {string} repoUrl - The URL of the new game repository
 * @param {string} gameName - The name of the game world
 * @param {string} gameRepoDir - The local directory to clone the repository to
 */
async function createNewGame(repoUrl, gameName, gameRepoDir = DEFAULT_GAME_REPO_DIR) {
  console.log(`Creating new game: ${gameName}`);
  console.log(`Repository URL: ${repoUrl}`);
  console.log(`Local directory: ${gameRepoDir}`);
  
  try {
    // Clone the template repository
    console.log(`Cloning template repository from ${DEFAULT_TEMPLATE_REPO}...`);
    await execPromise(`git clone ${DEFAULT_TEMPLATE_REPO} ${gameRepoDir}`);
    
    // Remove the original remote
    await execPromise('git remote remove origin', { cwd: gameRepoDir });
    
    // Add the new remote
    await execPromise(`git remote add origin ${repoUrl}`, { cwd: gameRepoDir });
    
    // Update the world name
    const worldTtlPath = path.join(gameRepoDir, 'world.ttl');
    let worldTtl = await fs.readFile(worldTtlPath, 'utf8');
    worldTtl = worldTtl.replace(/game:name "[^"]+"/, `game:name "${gameName}"`);
    await fs.writeFile(worldTtlPath, worldTtl);
    
    // Update the ontology URIs
    await updateOntologyUris(repoUrl, gameRepoDir);
    
    // Commit the changes
    await execPromise('git add .', { cwd: gameRepoDir });
    await execPromise(`git commit -m "Initialize game world: ${gameName}"`, { cwd: gameRepoDir });
    
    // Push to the new repository
    await execPromise('git push -u origin master', { cwd: gameRepoDir });
    
    console.log(`Game "${gameName}" created successfully!`);
    console.log(`Repository: ${repoUrl}`);
    console.log(`Local directory: ${gameRepoDir}`);
  } catch (error) {
    console.error('Error creating new game:', error.message);
    throw error;
  }
}

/**
 * Create a new player in the game
 * 
 * @param {string} playerName - The name of the player
 * @param {string} gameRepoDir - The local directory of the game repository
 */
async function createPlayer(playerName, gameRepoDir = DEFAULT_GAME_REPO_DIR) {
  console.log(`Creating new player: ${playerName}`);
  
  try {
    // Create a new branch for the player
    const branchName = `player/${playerName.toLowerCase().replace(/\s+/g, '-')}`;
    console.log(`Creating branch: ${branchName}`);
    await execPromise(`git checkout -b ${branchName}`, { cwd: gameRepoDir });
    
    // Create player resources file
    const playerResourcesTtl = `@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>.
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>.
@prefix xsd: <http://www.w3.org/2001/XMLSchema#>.
@prefix game: <https://PLACEHOLDER/ontology#>.
@prefix hydra: <http://www.w3.org/ns/hydra/core#>.

game:${playerName.toLowerCase().replace(/\s+/g, '_')} a game:Player;
  game:name "${playerName}";
  game:gold 100;
  game:wood 100;
  game:stone 50;
  game:food 200;
  hydra:operation [
    a hydra:Operation;
    hydra:method "GET";
    hydra:title "Get Player Resources";
    hydra:description "Retrieves the resources of this player";
    hydra:returns game:Player
  ], [
    a hydra:Operation;
    hydra:method "PUT";
    hydra:title "Update Player Resources";
    hydra:description "Updates the resources of this player";
    hydra:expects game:Player;
    hydra:returns game:Player
  ];
  hydra:link [
    a hydra:Link;
    hydra:title "Units";
    hydra:description "The units owned by this player";
    hydra:property game:units;
    hydra:collection [
      a hydra:Collection;
      hydra:manages [
        a hydra:IriTemplate;
        hydra:template "https://PLACEHOLDER/api/players/${playerName.toLowerCase().replace(/\s+/g, '_')}/units";
        hydra:variableRepresentation hydra:BasicRepresentation;
        hydra:mapping [
          a hydra:IriTemplateMapping;
          hydra:variable "unit";
          hydra:property game:Unit;
          hydra:required "false"^^xsd:boolean
        ]
      ]
    ]
  ].`;
    
    // Get the correct namespace from the ontology file
    const ontologyPath = path.join(gameRepoDir, 'ontology', 'index.ttl');
    const ontologyContent = await fs.readFile(ontologyPath, 'utf8');
    const namespaceMatch = ontologyContent.match(/prefix game: <([^>]+)>/);
    const namespace = namespaceMatch ? namespaceMatch[1] : 'https://PLACEHOLDER/ontology';
    
    // Replace the placeholder with the correct namespace
    const updatedPlayerResourcesTtl = playerResourcesTtl.replace(/https:\/\/PLACEHOLDER/g, namespace.replace(/ontology#$/, ''));
    
    // Write the player resources file
    const playerResourcesPath = path.join(gameRepoDir, `${playerName.toLowerCase().replace(/\s+/g, '_')}_resources.ttl`);
    await fs.writeFile(playerResourcesPath, updatedPlayerResourcesTtl);
    
    // Create player units file
    const playerUnitsTtl = `@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>.
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>.
@prefix xsd: <http://www.w3.org/2001/XMLSchema#>.
@prefix game: <https://PLACEHOLDER/ontology#>.
@prefix hydra: <http://www.w3.org/ns/hydra/core#>.

game:${playerName.toLowerCase().replace(/\s+/g, '_')} a game:Player;
  game:units [
    a hydra:Collection;
    hydra:title "Units";
    hydra:description "The units owned by this player";
    hydra:manages [
      a hydra:IriTemplate;
      hydra:template "https://PLACEHOLDER/api/players/${playerName.toLowerCase().replace(/\s+/g, '_')}/units{?type}";
      hydra:variableRepresentation hydra:BasicRepresentation;
      hydra:mapping [
        a hydra:IriTemplateMapping;
        hydra:variable "type";
        hydra:property game:unitType;
        hydra:required "false"^^xsd:boolean
      ]
    ]
  ].`;
    
    // Replace the placeholder with the correct namespace
    const updatedPlayerUnitsTtl = playerUnitsTtl.replace(/https:\/\/PLACEHOLDER/g, namespace.replace(/ontology#$/, ''));
    
    // Write the player units file
    const playerUnitsPath = path.join(gameRepoDir, `${playerName.toLowerCase().replace(/\s+/g, '_')}_units.ttl`);
    await fs.writeFile(playerUnitsPath, updatedPlayerUnitsTtl);
    
    // Create a starting unit for the player
    const unitId = `${playerName.toLowerCase().replace(/\s+/g, '_')}_unit1`;
    const unitTtl = `@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>.
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>.
@prefix xsd: <http://www.w3.org/2001/XMLSchema#>.
@prefix game: <https://PLACEHOLDER/ontology#>.
@prefix hydra: <http://www.w3.org/ns/hydra/core#>.

game:${unitId} a game:Unit;
  game:name "Settler";
  game:attack 5;
  game:defense 5;
  game:health 100;
  game:location "{x: 10, y: 10}";
  game:owner game:${playerName.toLowerCase().replace(/\s+/g, '_')};
  hydra:operation [
    a hydra:Operation;
    hydra:method "GET";
    hydra:title "Get Unit Information";
    hydra:description "Retrieves information about this unit";
    hydra:returns game:Unit
  ], [
    a hydra:Operation;
    hydra:method "POST";
    hydra:title "Move Unit";
    hydra:description "Moves this unit to a new position";
    hydra:expects [
      a hydra:Class;
      hydra:supportedProperty [
        a hydra:SupportedProperty;
        hydra:property game:x;
        hydra:required "true"^^xsd:boolean
      ], [
        a hydra:SupportedProperty;
        hydra:property game:y;
        hydra:required "true"^^xsd:boolean
      ]
    ];
    hydra:returns game:Unit
  ], [
    a hydra:Operation;
    hydra:method "POST";
    hydra:title "Gather Resources";
    hydra:description "Gathers resources from a resource node";
    hydra:expects [
      a hydra:Class;
      hydra:supportedProperty [
        a hydra:SupportedProperty;
        hydra:property game:resourceNode;
        hydra:required "true"^^xsd:boolean
      ]
    ];
    hydra:returns game:Unit
  ];
  hydra:link [
    a hydra:Link;
    hydra:title "Owner";
    hydra:description "The player who owns this unit";
    hydra:property game:owner;
    hydra:target game:${playerName.toLowerCase().replace(/\s+/g, '_')}
  ].`;
    
    // Replace the placeholder with the correct namespace
    const updatedUnitTtl = unitTtl.replace(/https:\/\/PLACEHOLDER/g, namespace.replace(/ontology#$/, ''));
    
    // Update the units.ttl file to add the new unit
    const unitsPath = path.join(gameRepoDir, 'units.ttl');
    await fs.appendFile(unitsPath, '\n\n' + updatedUnitTtl);
    
    // Update the player_units.ttl file to reference the new unit
    const playerUnitsContent = await fs.readFile(playerUnitsPath, 'utf8');
    const updatedPlayerUnitsContent = playerUnitsContent.replace(
      /game:units \[/,
      `game:units game:${unitId}, [`
    );
    await fs.writeFile(playerUnitsPath, updatedPlayerUnitsContent);
    
    // Commit the changes
    await execPromise('git add .', { cwd: gameRepoDir });
    await execPromise(`git commit -m "Create player: ${playerName}"`, { cwd: gameRepoDir });
    
    // Push the branch to the remote repository
    await execPromise(`git push -u origin ${branchName}`, { cwd: gameRepoDir });
    
    console.log(`Player "${playerName}" created successfully!`);
    console.log(`Branch: ${branchName}`);
  } catch (error) {
    console.error('Error creating player:', error.message);
    throw error;
  }
}

/**
 * Join a game as a player
 * 
 * @param {string} repoUrl - The URL of the game repository
 * @param {string} playerName - The name of the player
 * @param {string} gameRepoDir - The local directory to clone the repository to
 */
async function joinGame(repoUrl, playerName, gameRepoDir = DEFAULT_GAME_REPO_DIR) {
  console.log(`Joining game as player: ${playerName}`);
  console.log(`Repository URL: ${repoUrl}`);
  console.log(`Local directory: ${gameRepoDir}`);
  
  try {
    // Clone the game repository
    console.log(`Cloning game repository from ${repoUrl}...`);
    await execPromise(`git clone ${repoUrl} ${gameRepoDir}`);
    
    // Check out the player's branch
    const branchName = `player/${playerName.toLowerCase().replace(/\s+/g, '-')}`;
    console.log(`Checking out branch: ${branchName}`);
    await execPromise(`git checkout ${branchName}`, { cwd: gameRepoDir });
    
    console.log(`Joined game as player "${playerName}" successfully!`);
    console.log(`Repository: ${repoUrl}`);
    console.log(`Local directory: ${gameRepoDir}`);
    console.log(`Branch: ${branchName}`);
  } catch (error) {
    console.error('Error joining game:', error.message);
    throw error;
  }
}

/**
 * Perform a turn-based synchronization
 * 
 * @param {string} gameRepoDir - The local directory of the game repository
 */
async function syncTurn(gameRepoDir = DEFAULT_GAME_REPO_DIR) {
  console.log('Synchronizing turn...');
  
  try {
    // Get the current branch
    const currentBranch = (await execPromise('git rev-parse --abbrev-ref HEAD', { cwd: gameRepoDir })).trim();
    console.log(`Current branch: ${currentBranch}`);
    
    // Pull the latest changes from the master branch
    await execPromise('git fetch origin master', { cwd: gameRepoDir });
    
    // Merge the master branch into the current branch
    await execPromise('git merge origin/master', { cwd: gameRepoDir });
    
    // Push the changes to the remote repository
    await execPromise(`git push origin ${currentBranch}`, { cwd: gameRepoDir });
    
    // Create a pull request to merge the current branch into master
    console.log('To complete the turn, create a pull request to merge your branch into master.');
    console.log('You can do this on the GitHub website or using the GitHub CLI.');
    
    console.log('Turn synchronized successfully!');
  } catch (error) {
    console.error('Error synchronizing turn:', error.message);
    throw error;
  }
}

// Add commands to the CLI
function setupCommands(program) {
  program
    .command('create-game <repo-url> <game-name>')
    .description('Create a new game by forking the template repository')
    .option('-d, --dir <directory>', 'Local directory to clone the repository to', DEFAULT_GAME_REPO_DIR)
    .action((repoUrl, gameName, options) => {
      createNewGame(repoUrl, gameName, options.dir)
        .then(() => {
          console.log('Done!');
        })
        .catch(error => {
          console.error('Error:', error.message);
          process.exit(1);
        });
    });
  
  program
    .command('create-player <player-name>')
    .description('Create a new player in the game')
    .option('-d, --dir <directory>', 'Local directory of the game repository', DEFAULT_GAME_REPO_DIR)
    .action((playerName, options) => {
      createPlayer(playerName, options.dir)
        .then(() => {
          console.log('Done!');
        })
        .catch(error => {
          console.error('Error:', error.message);
          process.exit(1);
        });
    });
  
  program
    .command('join-game <repo-url> <player-name>')
    .description('Join a game as a player')
    .option('-d, --dir <directory>', 'Local directory to clone the repository to', DEFAULT_GAME_REPO_DIR)
    .action((repoUrl, playerName, options) => {
      joinGame(repoUrl, playerName, options.dir)
        .then(() => {
          console.log('Done!');
        })
        .catch(error => {
          console.error('Error:', error.message);
          process.exit(1);
        });
    });
  
  program
    .command('sync-turn')
    .description('Perform a turn-based synchronization')
    .option('-d, --dir <directory>', 'Local directory of the game repository', DEFAULT_GAME_REPO_DIR)
    .action((options) => {
      syncTurn(options.dir)
        .then(() => {
          console.log('Done!');
        })
        .catch(error => {
          console.error('Error:', error.message);
          process.exit(1);
        });
    });
}

// Export the functions and setup function
module.exports = {
  createNewGame,
  createPlayer,
  joinGame,
  syncTurn,
  setupCommands
};