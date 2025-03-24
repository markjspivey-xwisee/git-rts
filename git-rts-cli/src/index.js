const { program } = require('commander');
const fs = require('fs').promises;
const { exec } = require('child_process');
const path = require('path');
const terrain = require('./terrain');
const mapViewer = require('./map-viewer');
const visibility = require('./visibility');
const heroUnits = require('./hero-units');
const weather = require('./weather');
const quest = require('./quest');
const combat = require('./combat');
const economy = require('./economy');
const diplomacy = require('./diplomacy');
const gitGameMechanics = require('./git-game-mechanics');

// Load GitHub configuration
async function loadGitHubConfig() {
  try {
    const configPath = path.join(__dirname, 'git-rts-config.json');
    const configData = await fs.readFile(configPath, 'utf8');
    return JSON.parse(configData).github;
  } catch (error) {
    console.error('Error loading GitHub configuration:', error.message);
    return null;
  }
}

// Get the GitHub repository URL with authentication
async function getGitHubRepoUrl() {
  const config = await loadGitHubConfig();
  if (!config) {
    return null;
  }
  
  return `https://${config.username}:${config.token}@github.com/${config.username}/${config.repository}.git`;
}

// Push changes to GitHub
async function pushToGitHub(gameRepoDir) {
  return new Promise((resolve, reject) => {
    exec('git push origin master', { cwd: gameRepoDir }, (err, stdout, stderr) => {
      if (err) {
        reject(err);
      } else {
        resolve(stdout);
      }
    });
  });
}

// Pull changes from GitHub
async function pullFromGitHub(gameRepoDir) {
  return new Promise((resolve, reject) => {
    exec('git pull origin master', { cwd: gameRepoDir }, (err, stdout, stderr) => {
      if (err) {
        reject(err);
      } else {
        resolve(stdout);
      }
    });
  });
}

program
  .command('init')
  .description('Initialize a new game repository')
  .action(async () => {
    console.log('Initializing a new game repository...');
    const rootDir = 'C:/Users/markj/Desktop';
    const gameRepoDir = 'C:/Users/markj/Desktop/game-repo';
    await fs.mkdir(gameRepoDir, { recursive: true });

    const worldTtl = `@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>.
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>.
@prefix xsd: <http://www.w3.org/2001/XMLSchema#>.
@prefix game: <http://example.org/game#>.

game:world a game:World;
 game:name "My Game World";
 game:size 100.`;
    await fs.writeFile(`${gameRepoDir}/world.ttl`, worldTtl);

    const unitsTtl = `@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>.
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>.
@prefix xsd: <http://www.w3.org/2001/XMLSchema#>.
@prefix game: <http://example.org/game#>.

game:unit1 a game:Unit;
 game:name "Warrior";
 game:attack 10;
 game:defense 5;
 game:health 100;
 game:location "{x: 10, y: 10}".`;
    await fs.writeFile(`${gameRepoDir}/units.ttl`, unitsTtl);

    const playerResourcesTtl = `@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>.
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>.
@prefix xsd: <http://www.w3.org/2001/XMLSchema#>.
@prefix game: <http://example.org/game#>.

game:player1 a game:Player;
 game:gold 100;
 game:wood 100;
 game:stone 50;
 game:food 200.`;
    await fs.writeFile(`${gameRepoDir}/player_resources.ttl`, playerResourcesTtl);

    const playerUnitsTtl = `@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>.
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>.
@prefix xsd: <http://www.w3.org/2001/XMLSchema#>.
@prefix game: <http://example.org/game#>.

game:player1 a game:Player;
 game:units game:unit1.`;
    await fs.writeFile(`${gameRepoDir}/player_units.ttl`, playerUnitsTtl);

    const resourceNodesTtl = `@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>.
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>.
@prefix xsd: <http://www.w3.org/2001/XMLSchema#>.
@prefix game: <http://example.org/game#>.

game:goldMine1 a game:ResourceNode;
 game:type "gold";
 game:amount 1000;
 game:location "{x: 20, y: 30}".

game:forest1 a game:ResourceNode;
 game:type "wood";
 game:amount 2000;
 game:location "{x: 40, y: 15}".

game:quarry1 a game:ResourceNode;
 game:type "stone";
 game:amount 1500;
 game:location "{x: 60, y: 50}".

game:farm1 a game:ResourceNode;
 game:type "food";
 game:amount 3000;
 game:location "{x: 25, y: 70}".`;
    await fs.writeFile(`${gameRepoDir}/resource_nodes.ttl`, resourceNodesTtl);

    const buildingsTtl = `@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>.
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>.
@prefix xsd: <http://www.w3.org/2001/XMLSchema#>.
@prefix game: <http://example.org/game#>.

game:townCenter1 a game:Building;
 game:type "townCenter";
 game:owner game:player1;
 game:health 500;
 game:location "{x: 15, y: 15}".`;
    await fs.writeFile(`${gameRepoDir}/buildings.ttl`, buildingsTtl);

    await new Promise((resolve, reject) => {
      exec('git init', { cwd: gameRepoDir }, (err, stdout, stderr) => {
        if (err) reject(err);
        else resolve();
      });
    });
    await exec('git add .', { cwd: gameRepoDir });
    await exec('git commit -m "Initial commit"', { cwd: gameRepoDir });
    
    // Add GitHub remote and push if GitHub configuration exists
    try {
      const repoUrl = await getGitHubRepoUrl();
      if (repoUrl) {
        await exec(`git remote add origin ${repoUrl}`, { cwd: gameRepoDir });
        await exec('git push -u origin master', { cwd: gameRepoDir });
        console.log('Successfully pushed to GitHub repository.');
      }
    } catch (error) {
      console.error('Failed to push to GitHub:', error.message);
      console.log('Continuing with local repository only.');
    }
    
    console.log('Game repository initialized successfully!');
  });

program
  .command('join <repoUrl>')
  .description('Join an existing game by cloning a repository')
  .action(async (repoUrl) => {
    console.log(`Joining game from ${repoUrl}...`);
    
    // If repoUrl is 'github', use the configured GitHub repository
    if (repoUrl === 'github') {
      const githubRepoUrl = await getGitHubRepoUrl();
      if (githubRepoUrl) {
        repoUrl = githubRepoUrl;
        console.log(`Using configured GitHub repository: ${githubRepoUrl.replace(/\/\/.*?@/, '//')}`); // Hide token in log
      } else {
        console.error('No GitHub repository configured.');
        return;
      }
    }
    
    await exec(`git clone ${repoUrl} game-repo`);
    console.log('Successfully joined the game!');
  });

program
  .command('explore <resourceUri>')
  .description('Explore a resource by viewing its RDF data')
  .action(async (resourceUri) => {
    console.log(`Exploring resource ${resourceUri}...`);
    const gameRepoDir = 'C:/Users/markj/Desktop/game-repo';
    
    try {
      // Determine which file to read based on the resource URI
      let filePath;
      if (resourceUri.includes('world')) {
        filePath = `${gameRepoDir}/world.ttl`;
      } else if (resourceUri.includes('unit')) {
        filePath = `${gameRepoDir}/units.ttl`;
      } else if (resourceUri.includes('building') || resourceUri.includes('townCenter')) {
        filePath = `${gameRepoDir}/buildings.ttl`;
      } else if (resourceUri.includes('goldMine') || resourceUri.includes('forest') || 
                resourceUri.includes('quarry') || resourceUri.includes('farm')) {
        filePath = `${gameRepoDir}/resource_nodes.ttl`;
      } else if (resourceUri.includes('player')) {
        filePath = `${gameRepoDir}/player_resources.ttl`;
      } else {
        console.error(`Unknown resource type: ${resourceUri}`);
        return;
      }
      
      const content = await fs.readFile(filePath, 'utf8');
      console.log(content);
    } catch (error) {
      console.error(`Error exploring resource: ${error.message}`);
    }
  });

program
  .command('move <unitUri> <x> <y>')
  .description('Move a unit to a new location')
  .action(async (unitUri, x, y) => {
    const terrainModule = require('./terrain');
    const visibilityModule = require('./visibility');
    console.log(`Moving unit ${unitUri} to ${x}, ${y}...`);
    const gameRepoDir = 'C:/Users/markj/Desktop/game-repo';
    const unitsTtlPath = `${gameRepoDir}/units.ttl`;

    try {
      // 1. Read the content of units.ttl
      const unitsTtlContent = await fs.readFile(unitsTtlPath, 'utf8');

      // 1.5. Extract current unit location
      const unitLocationMatch = unitsTtlContent.match(/game:location "{x: (\d+), y: (\d+)}"/);
      if (!unitLocationMatch) {
        console.error('Could not find unit location');
        return;
      }
      const currentX = parseInt(unitLocationMatch[1]);
      const currentY = parseInt(unitLocationMatch[2]);
      
      // 1.6. Calculate movement cost based on terrain
      const movementCost = await terrainModule.calculateMovementCost(currentX, currentY, parseInt(x), parseInt(y));
      console.log(`Movement cost: ${movementCost.toFixed(2)}`);
      
      // 1.7. Check if movement is possible (max movement distance is 20)
      if (movementCost > 20) {
        console.error(`Movement cost too high (${movementCost.toFixed(2)}). Maximum movement distance is 20.`);
        return;
      }

      // 2. Update the unit's location
      const updatedUnitsTtlContent = unitsTtlContent.replace(
        /game:location "{x: \d+, y: \d+}"/,
        `game:location "{x: ${x}, y: ${y}}"`
      );

      // 3. Write the updated TTL data to units.ttl
      await fs.writeFile(unitsTtlPath, updatedUnitsTtlContent);

      // 4. Commit the changes to Git
      await exec('git add units.ttl', { cwd: gameRepoDir });
      await exec(`git commit -m "Move ${unitUri} to (${x}, ${y})"`, { cwd: gameRepoDir });

      // Update visibility after movement
      await visibilityModule.updateExploredCells('game:player1');
      await visibilityModule.updateVisibleEntities('game:player1');

      console.log(`Successfully moved ${unitUri} to (${x}, ${y})!`);
    } catch (error) {
      console.error(`Error moving unit: ${error.message}`);
    }
  });

program
  .command('gather <unitUri> <resourceNodeUri>')
  .description('Gather resources from a resource node')
  .action(async (unitUri, resourceNodeUri) => {
    const terrainModule = require('./terrain');
    console.log(`Unit ${unitUri} gathering resources from ${resourceNodeUri}...`);
    const gameRepoDir = 'C:/Users/markj/Desktop/game-repo';
    const unitsTtlPath = `${gameRepoDir}/units.ttl`;
    const resourceNodesTtlPath = `${gameRepoDir}/resource_nodes.ttl`;
    const playerResourcesTtlPath = `${gameRepoDir}/player_resources.ttl`;

    try {
      // 1. Read the content of units.ttl, resource_nodes.ttl, and player_resources.ttl
      const unitsTtlContent = await fs.readFile(unitsTtlPath, 'utf8');
      const resourceNodesTtlContent = await fs.readFile(resourceNodesTtlPath, 'utf8');
      const playerResourcesTtlContent = await fs.readFile(playerResourcesTtlPath, 'utf8');

      // 2. Extract unit location
      const unitLocationMatch = unitsTtlContent.match(/game:location "{x: (\d+), y: (\d+)}"/);
      if (!unitLocationMatch) {
        console.error('Could not find unit location');
        return;
      }
      const unitX = parseInt(unitLocationMatch[1]);
      const unitY = parseInt(unitLocationMatch[2]);

      // 3. Extract resource node location and type
      const resourceTypeMatch = resourceNodesTtlContent.match(new RegExp(`${resourceNodeUri.replace(':', '\\:')}[\\s\\S]*?game:type "([^"]+)"`));
      const resourceAmountMatch = resourceNodesTtlContent.match(new RegExp(`${resourceNodeUri.replace(':', '\\:')}[\\s\\S]*?game:amount (\\d+)`));
      const resourceLocationMatch = resourceNodesTtlContent.match(new RegExp(`${resourceNodeUri.replace(':', '\\:')}[\\s\\S]*?game:location "{x: (\\d+), y: (\\d+)}"`));
      
      if (!resourceTypeMatch || !resourceAmountMatch || !resourceLocationMatch) {
        console.error('Could not find resource node information');
        return;
      }
      
      const resourceType = resourceTypeMatch[1];
      const resourceAmount = parseInt(resourceAmountMatch[1]);
      const resourceX = parseInt(resourceLocationMatch[1]);
      const resourceY = parseInt(resourceLocationMatch[2]);

      // 4. Calculate distance between unit and resource node
      const distance = Math.sqrt(Math.pow(unitX - resourceX, 2) + Math.pow(unitY - resourceY, 2));
      if (distance > 10) {
        console.error(`Unit is too far from resource node (distance: ${distance}). Move closer to gather.`);
        return;
      }

      // 5. Apply terrain gathering modifier
      const gatheringModifier = await terrainModule.getTerrainModifier(resourceX, resourceY, 'gathering');
      console.log(`Gathering modifier at (${resourceX}, ${resourceY}): ${gatheringModifier}`);
      
      // 6. Calculate amount to gather (10% of available, max 100)
      // Apply terrain gathering modifier to the amount
      const gatherAmount = Math.min(Math.floor(resourceAmount * 0.1), 100);
      if (gatherAmount <= 0) {
        console.error('Resource node is depleted');
        return;
      }

      // 6. Update resource node amount
      const modifiedGatherAmount = Math.floor(gatherAmount * gatheringModifier);
      const updatedResourceNodesTtlContent = resourceNodesTtlContent.replace(
        new RegExp(`(${resourceNodeUri.replace(':', '\\:')}[\\s\\S]*?game:amount )\\d+`),
        `$1${resourceAmount - gatherAmount}`
      );

      // 7. Update player resources
      const playerResourceMatch = playerResourcesTtlContent.match(new RegExp(`game:${resourceType} (\\d+)`));
      if (!playerResourceMatch) {
        console.error(`Could not find player's ${resourceType} resource`);
        return;
      }
      const currentAmount = parseInt(playerResourceMatch[1]);
      const updatedPlayerResourcesTtlContent = playerResourcesTtlContent.replace(
        new RegExp(`(game:${resourceType} )\\d+`),
        `$1${currentAmount + gatherAmount}`
      );

      // 8. Write the updated TTL data
      await fs.writeFile(resourceNodesTtlPath, updatedResourceNodesTtlContent);
      await fs.writeFile(playerResourcesTtlPath, updatedPlayerResourcesTtlContent);

      // 9. Commit the changes to Git
      await exec('git add resource_nodes.ttl player_resources.ttl', { cwd: gameRepoDir });
      await exec(`git commit -m "Gather ${gatherAmount} ${resourceType} from ${resourceNodeUri}"`, { cwd: gameRepoDir });

      console.log(`Successfully gathered ${modifiedGatherAmount} ${resourceType}! (Base amount: ${gatherAmount}, Terrain modifier: ${gatheringModifier})`);
    } catch (error) {
      console.error(`Error gathering resources: ${error.message}`);
    }
  });

// GitHub integration commands
program
  .command('push')
  .description('Push changes to GitHub')
  .action(async () => {
    console.log('Pushing changes to GitHub...');
    const gameRepoDir = 'C:/Users/markj/Desktop/game-repo';
    
    try {
      const output = await pushToGitHub(gameRepoDir);
      console.log('Successfully pushed changes to GitHub.');
      console.log(output);
    } catch (error) {
      console.error('Failed to push changes to GitHub:', error.message);
    }
  });

program
  .command('pull')
  .description('Pull changes from GitHub')
  .action(async () => {
    console.log('Pulling changes from GitHub...');
    const gameRepoDir = 'C:/Users/markj/Desktop/game-repo';
    
    try {
      const output = await pullFromGitHub(gameRepoDir);
      console.log('Successfully pulled changes from GitHub.');
      console.log(output);
    } catch (error) {
      console.error('Failed to pull changes from GitHub:', error.message);
    }
  });

// Set up Git-based game mechanics commands
gitGameMechanics.setupCommands(program);

program.parse(process.argv);

// Add terrain commands
terrain.program.parse(process.argv);

// Add map viewer commands
mapViewer.parse(process.argv);

// Add visibility commands
visibility.program.parse(process.argv);

// Add hero units commands
heroUnits.parse(process.argv);

// Add weather commands
weather.program.parse(process.argv);

// Add quest commands
quest.program.parse(process.argv);

// Add combat commands
combat.program.parse(process.argv);

// Add economy commands
economy.program.parse(process.argv);

// Add diplomacy commands
diplomacy.program.parse(process.argv);

// Display help if no arguments provided
if (process.argv.length <= 2) {
  console.log('Git-RTS: A Git-based Real-Time Strategy Game');
  console.log('');
  console.log('Usage:');
  console.log('  git-rts [command] [options]');
  console.log('');
  console.log('Git-Based Game Mechanics:');
  console.log('  create-game <repo-url> <game-name>  Create a new game by forking the template repository');
  console.log('  create-player <player-name>         Create a new player in the game');
  console.log('  join-game <repo-url> <player-name>  Join a game as a player');
  console.log('  sync-turn                           Perform a turn-based synchronization');
  console.log('');
  console.log('Game Actions:');
  console.log('  move <unit-uri> <x> <y>             Move a unit to a new location');
  console.log('  gather <unit-uri> <resource-uri>    Gather resources from a resource node');
  console.log('');
  console.log('For more commands and options, use:');
  console.log('  git-rts --help');
}
