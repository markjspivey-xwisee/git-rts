const { program } = require('commander');
const fs = require('fs').promises;
const { exec } = require('child_process');
const path = require('path');

program
  .command('create-alliance <allianceName>')
  .description('Create a new alliance')
  .action(async (allianceName) => {
    console.log(`Creating alliance: ${allianceName}...`);
    
    const gameRepoDir = 'C:/Users/markj/Desktop/game-repo';
    const alliancesPath = `${gameRepoDir}/alliances.ttl`;
    
    // Check if alliances.ttl exists, create it if not
    let alliancesContent;
    try {
      alliancesContent = await fs.readFile(alliancesPath, 'utf8');
    } catch (error) {
      // Create initial alliances file
      alliancesContent = `@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>.
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>.
@prefix xsd: <http://www.w3.org/2001/XMLSchema#>.
@prefix game: <http://example.org/game#>.

`;
    }
    
    // Check if alliance already exists
    if (alliancesContent.includes(`game:alliance${allianceName}`)) {
      console.error(`Alliance ${allianceName} already exists.`);
      return;
    }
    
    // Add new alliance to alliances.ttl
    const newAlliance = `game:alliance${allianceName} a game:Alliance;
 game:name "${allianceName}";
 game:founder game:player1;
 game:members "game:player1";
 game:created "${new Date().toISOString()}".

`;
    
    const updatedAlliancesContent = alliancesContent + newAlliance;
    await fs.writeFile(alliancesPath, updatedAlliancesContent);
    
    // Create a branch for the alliance
    await exec(`git checkout -b alliance-${allianceName}`, { cwd: gameRepoDir });
    await exec('git add alliances.ttl', { cwd: gameRepoDir });
    await exec(`git commit -m "Create alliance: ${allianceName}"`, { cwd: gameRepoDir });
    
    // Create a shared resources file for the alliance
    const allianceResourcesTtl = `@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>.
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>.
@prefix xsd: <http://www.w3.org/2001/XMLSchema#>.
@prefix game: <http://example.org/game#>.

game:alliance${allianceName}Resources a game:AllianceResources;
 game:gold 0;
 game:wood 0;
 game:stone 0;
 game:food 0.`;
    
    await fs.writeFile(`${gameRepoDir}/alliance_${allianceName}_resources.ttl`, allianceResourcesTtl);
    await exec(`git add alliance_${allianceName}_resources.ttl`, { cwd: gameRepoDir });
    await exec(`git commit -m "Initialize alliance resources for ${allianceName}"`, { cwd: gameRepoDir });
    
    // Switch back to main branch
    await exec('git checkout main', { cwd: gameRepoDir });
    
    // Merge the alliance branch
    await exec(`git merge alliance-${allianceName}`, { cwd: gameRepoDir });
    
    console.log(`Alliance ${allianceName} created successfully.`);
    console.log(`Use 'git checkout alliance-${allianceName}' to work on alliance-specific features.`);
  });

program
  .command('join-alliance <allianceName>')
  .description('Join an existing alliance')
  .action(async (allianceName) => {
    console.log(`Joining alliance: ${allianceName}...`);
    
    const gameRepoDir = 'C:/Users/markj/Desktop/game-repo';
    const alliancesPath = `${gameRepoDir}/alliances.ttl`;
    
    // Check if alliances.ttl exists
    let alliancesContent;
    try {
      alliancesContent = await fs.readFile(alliancesPath, 'utf8');
    } catch (error) {
      console.error('No alliances file found. Create an alliance first.');
      return;
    }
    
    // Check if alliance exists
    const allianceMatch = alliancesContent.match(new RegExp(`game:alliance${allianceName} a game:Alliance;[\\s\\S]*?game:members "([^"]*)"`));
    if (!allianceMatch) {
      console.error(`Alliance ${allianceName} does not exist.`);
      return;
    }
    
    // Check if player is already a member
    const members = allianceMatch[1].split(',');
    if (members.includes('game:player1')) {
      console.error(`You are already a member of alliance ${allianceName}.`);
      return;
    }
    
    // Add player to alliance members
    members.push('game:player1');
    const updatedAlliancesContent = alliancesContent.replace(
      new RegExp(`(game:alliance${allianceName} a game:Alliance;[\\s\\S]*?game:members ")[^"]*"`),
      `$1${members.join(',')}`
    );
    
    // Create a branch for joining the alliance
    await exec(`git checkout -b join-alliance-${allianceName}`, { cwd: gameRepoDir });
    await fs.writeFile(alliancesPath, updatedAlliancesContent);
    await exec('git add alliances.ttl', { cwd: gameRepoDir });
    await exec(`git commit -m "Join alliance: ${allianceName}"`, { cwd: gameRepoDir });
    
    // Switch back to main branch
    await exec('git checkout main', { cwd: gameRepoDir });
    
    // Merge the join alliance branch
    await exec(`git merge join-alliance-${allianceName}`, { cwd: gameRepoDir });
    
    console.log(`Successfully joined alliance ${allianceName}.`);
  });

program
  .command('leave-alliance <allianceName>')
  .description('Leave an alliance')
  .action(async (allianceName) => {
    console.log(`Leaving alliance: ${allianceName}...`);
    
    const gameRepoDir = 'C:/Users/markj/Desktop/game-repo';
    const alliancesPath = `${gameRepoDir}/alliances.ttl`;
    
    // Check if alliances.ttl exists
    let alliancesContent;
    try {
      alliancesContent = await fs.readFile(alliancesPath, 'utf8');
    } catch (error) {
      console.error('No alliances file found.');
      return;
    }
    
    // Check if alliance exists
    const allianceMatch = alliancesContent.match(new RegExp(`game:alliance${allianceName} a game:Alliance;[\\s\\S]*?game:members "([^"]*)"`));
    if (!allianceMatch) {
      console.error(`Alliance ${allianceName} does not exist.`);
      return;
    }
    
    // Check if player is a member
    const members = allianceMatch[1].split(',');
    if (!members.includes('game:player1')) {
      console.error(`You are not a member of alliance ${allianceName}.`);
      return;
    }
    
    // Check if player is the founder
    const founderMatch = alliancesContent.match(new RegExp(`game:alliance${allianceName} a game:Alliance;[\\s\\S]*?game:founder ([^;\\n]+)`));
    if (founderMatch && founderMatch[1] === 'game:player1') {
      console.error(`You are the founder of alliance ${allianceName}. You cannot leave. Disband the alliance instead.`);
      return;
    }
    
    // Remove player from alliance members
    const updatedMembers = members.filter(member => member !== 'game:player1');
    const updatedAlliancesContent = alliancesContent.replace(
      new RegExp(`(game:alliance${allianceName} a game:Alliance;[\\s\\S]*?game:members ")[^"]*"`),
      `$1${updatedMembers.join(',')}`
    );
    
    // Create a branch for leaving the alliance
    await exec(`git checkout -b leave-alliance-${allianceName}`, { cwd: gameRepoDir });
    await fs.writeFile(alliancesPath, updatedAlliancesContent);
    await exec('git add alliances.ttl', { cwd: gameRepoDir });
    await exec(`git commit -m "Leave alliance: ${allianceName}"`, { cwd: gameRepoDir });
    
    // Switch back to main branch
    await exec('git checkout main', { cwd: gameRepoDir });
    
    // Merge the leave alliance branch
    await exec(`git merge leave-alliance-${allianceName}`, { cwd: gameRepoDir });
    
    console.log(`Successfully left alliance ${allianceName}.`);
  });

program
  .command('disband-alliance <allianceName>')
  .description('Disband an alliance (founder only)')
  .action(async (allianceName) => {
    console.log(`Disbanding alliance: ${allianceName}...`);
    
    const gameRepoDir = 'C:/Users/markj/Desktop/game-repo';
    const alliancesPath = `${gameRepoDir}/alliances.ttl`;
    
    // Check if alliances.ttl exists
    let alliancesContent;
    try {
      alliancesContent = await fs.readFile(alliancesPath, 'utf8');
    } catch (error) {
      console.error('No alliances file found.');
      return;
    }
    
    // Check if alliance exists
    const allianceMatch = alliancesContent.match(new RegExp(`game:alliance${allianceName} a game:Alliance;[\\s\\S]*?game:founder ([^;\\n]+)`));
    if (!allianceMatch) {
      console.error(`Alliance ${allianceName} does not exist.`);
      return;
    }
    
    // Check if player is the founder
    if (allianceMatch[1] !== 'game:player1') {
      console.error(`You are not the founder of alliance ${allianceName}. Only the founder can disband the alliance.`);
      return;
    }
    
    // Remove alliance from alliances.ttl
    const updatedAlliancesContent = alliancesContent.replace(
      new RegExp(`game:alliance${allianceName} a game:Alliance;[\\s\\S]*?\\n\\n`),
      ''
    );
    
    // Create a branch for disbanding the alliance
    await exec(`git checkout -b disband-alliance-${allianceName}`, { cwd: gameRepoDir });
    await fs.writeFile(alliancesPath, updatedAlliancesContent);
    
    // Remove alliance resources file
    try {
      await fs.unlink(`${gameRepoDir}/alliance_${allianceName}_resources.ttl`);
    } catch (error) {
      console.log(`No alliance resources file found for ${allianceName}.`);
    }
    
    await exec('git add alliances.ttl', { cwd: gameRepoDir });
    await exec(`git rm alliance_${allianceName}_resources.ttl`, { cwd: gameRepoDir });
    await exec(`git commit -m "Disband alliance: ${allianceName}"`, { cwd: gameRepoDir });
    
    // Switch back to main branch
    await exec('git checkout main', { cwd: gameRepoDir });
    
    // Merge the disband alliance branch
    await exec(`git merge disband-alliance-${allianceName}`, { cwd: gameRepoDir });
    
    // Remove the alliance branch
    await exec(`git branch -D alliance-${allianceName}`, { cwd: gameRepoDir });
    
    console.log(`Successfully disbanded alliance ${allianceName}.`);
  });

program
  .command('contribute <allianceName> <resourceType> <amount>')
  .description('Contribute resources to an alliance')
  .action(async (allianceName, resourceType, amount) => {
    console.log(`Contributing ${amount} ${resourceType} to alliance ${allianceName}...`);
    
    const gameRepoDir = 'C:/Users/markj/Desktop/game-repo';
    const alliancesPath = `${gameRepoDir}/alliances.ttl`;
    const playerResourcesPath = `${gameRepoDir}/player_resources.ttl`;
    const allianceResourcesPath = `${gameRepoDir}/alliance_${allianceName}_resources.ttl`;
    
    // Check if alliance exists and player is a member
    let alliancesContent;
    try {
      alliancesContent = await fs.readFile(alliancesPath, 'utf8');
    } catch (error) {
      console.error('No alliances file found.');
      return;
    }
    
    const allianceMatch = alliancesContent.match(new RegExp(`game:alliance${allianceName} a game:Alliance;[\\s\\S]*?game:members "([^"]*)"`));
    if (!allianceMatch) {
      console.error(`Alliance ${allianceName} does not exist.`);
      return;
    }
    
    const members = allianceMatch[1].split(',');
    if (!members.includes('game:player1')) {
      console.error(`You are not a member of alliance ${allianceName}.`);
      return;
    }
    
    // Check if resource type is valid
    if (!['gold', 'wood', 'stone', 'food'].includes(resourceType)) {
      console.error(`Invalid resource type: ${resourceType}. Valid types are: gold, wood, stone, food.`);
      return;
    }
    
    // Check if amount is valid
    const amountNum = parseInt(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      console.error(`Invalid amount: ${amount}. Amount must be a positive number.`);
      return;
    }
    
    // Check if player has enough resources
    let playerResourcesContent;
    try {
      playerResourcesContent = await fs.readFile(playerResourcesPath, 'utf8');
    } catch (error) {
      console.error('No player resources file found.');
      return;
    }
    
    const playerResourceMatch = playerResourcesContent.match(new RegExp(`game:${resourceType} (\\d+)`));
    if (!playerResourceMatch) {
      console.error(`Could not find player's ${resourceType} resource.`);
      return;
    }
    
    const playerResourceAmount = parseInt(playerResourceMatch[1]);
    if (playerResourceAmount < amountNum) {
      console.error(`Not enough ${resourceType}. You have ${playerResourceAmount}, but need ${amountNum}.`);
      return;
    }
    
    // Check if alliance resources file exists
    let allianceResourcesContent;
    try {
      allianceResourcesContent = await fs.readFile(allianceResourcesPath, 'utf8');
    } catch (error) {
      console.error(`No alliance resources file found for ${allianceName}.`);
      return;
    }
    
    // Get current alliance resource amount
    const allianceResourceMatch = allianceResourcesContent.match(new RegExp(`game:${resourceType} (\\d+)`));
    if (!allianceResourceMatch) {
      console.error(`Could not find alliance's ${resourceType} resource.`);
      return;
    }
    
    const allianceResourceAmount = parseInt(allianceResourceMatch[1]);
    
    // Update player resources
    const updatedPlayerResourcesContent = playerResourcesContent.replace(
      new RegExp(`(game:${resourceType} )\\d+`),
      `$1${playerResourceAmount - amountNum}`
    );
    
    // Update alliance resources
    const updatedAllianceResourcesContent = allianceResourcesContent.replace(
      new RegExp(`(game:${resourceType} )\\d+`),
      `$1${allianceResourceAmount + amountNum}`
    );
    
    // Create a branch for contributing to the alliance
    await exec(`git checkout -b contribute-alliance-${allianceName}`, { cwd: gameRepoDir });
    await fs.writeFile(playerResourcesPath, updatedPlayerResourcesContent);
    await fs.writeFile(allianceResourcesPath, updatedAllianceResourcesContent);
    await exec('git add player_resources.ttl', { cwd: gameRepoDir });
    await exec(`git add alliance_${allianceName}_resources.ttl`, { cwd: gameRepoDir });
    await exec(`git commit -m "Contribute ${amountNum} ${resourceType} to alliance ${allianceName}"`, { cwd: gameRepoDir });
    
    // Switch back to main branch
    await exec('git checkout main', { cwd: gameRepoDir });
    
    // Merge the contribute alliance branch
    await exec(`git merge contribute-alliance-${allianceName}`, { cwd: gameRepoDir });
    
    console.log(`Successfully contributed ${amountNum} ${resourceType} to alliance ${allianceName}.`);
  });

program
  .command('alliance-status')
  .description('Show the status of alliances')
  .action(async () => {
    console.log('Alliance status:');
    
    const gameRepoDir = 'C:/Users/markj/Desktop/game-repo';
    const alliancesPath = `${gameRepoDir}/alliances.ttl`;
    
    try {
      const alliancesContent = await fs.readFile(alliancesPath, 'utf8');
      
      // Extract alliances
      const allianceMatches = alliancesContent.matchAll(/game:alliance(\w+) a game:Alliance;[\s\S]*?game:name "([^"]+)";[\s\S]*?game:founder ([^;]+);[\s\S]*?game:members "([^"]+)"/g);
      
      let alliancesFound = false;
      for (const match of allianceMatches) {
        alliancesFound = true;
        const allianceName = match[1];
        const displayName = match[2];
        const founder = match[3];
        const members = match[4].split(',');
        
        console.log(`\nAlliance: ${displayName} (${allianceName})`);
        console.log(`Founder: ${founder}`);
        console.log(`Members: ${members.join(', ')}`);
        
        // Show alliance resources if available
        try {
          const allianceResourcesContent = await fs.readFile(`${gameRepoDir}/alliance_${allianceName}_resources.ttl`, 'utf8');
          
          const goldMatch = allianceResourcesContent.match(/game:gold (\d+)/);
          const woodMatch = allianceResourcesContent.match(/game:wood (\d+)/);
          const stoneMatch = allianceResourcesContent.match(/game:stone (\d+)/);
          const foodMatch = allianceResourcesContent.match(/game:food (\d+)/);
          
          console.log('Resources:');
          console.log(`- Gold: ${goldMatch ? goldMatch[1] : 0}`);
          console.log(`- Wood: ${woodMatch ? woodMatch[1] : 0}`);
          console.log(`- Stone: ${stoneMatch ? stoneMatch[1] : 0}`);
          console.log(`- Food: ${foodMatch ? foodMatch[1] : 0}`);
        } catch (error) {
          console.log('No resources file found for this alliance.');
        }
      }
      
      if (!alliancesFound) {
        console.log('No alliances found.');
      }
    } catch (error) {
      console.log('No alliances file found.');
    }
  });

module.exports = program;