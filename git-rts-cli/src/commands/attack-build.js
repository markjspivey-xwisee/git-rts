const { program } = require('commander');
const terrain = require('./terrain');

program
  .command('attack <attackerUri> <targetUri>')
  .action(async (attackerUri, targetUri) => {
    const terrainModule = require('./terrain');
    console.log(`Unit ${attackerUri} attacking ${targetUri}...`);
    const fs = require('fs').promises;
    const { exec } = require('child_process');

    const gameRepoDir = 'C:/Users/markj/Desktop/game-repo';
    const unitsTtlPath = `${gameRepoDir}/units.ttl`;
    const buildingsTtlPath = `${gameRepoDir}/buildings.ttl`;

    // 1. Read the content of units.ttl and buildings.ttl
    const unitsTtlContent = await fs.readFile(unitsTtlPath, 'utf8');
    let buildingsTtlContent;
    try {
      buildingsTtlContent = await fs.readFile(buildingsTtlPath, 'utf8');
    } catch (error) {
      buildingsTtlContent = '';
    }

    // 2. Determine if target is a unit or building
    let targetContent;
    let targetPath;
    let targetType;
    if (targetUri.includes('unit')) {
      targetContent = unitsTtlContent;
      targetPath = unitsTtlPath;
      targetType = 'Unit';
    } else if (targetUri.includes('building') || targetUri.includes('townCenter')) {
      targetContent = buildingsTtlContent;
      targetPath = buildingsTtlPath;
      targetType = 'Building';
    } else {
      console.error('Invalid target type');
      return;
    }

    // 3. Extract attacker stats
    const attackerMatch = unitsTtlContent.match(new RegExp(`<${attackerUri.replace(':', '#')}> a <http://example.org/game#Unit>;[\\s\\S]*?<http://example.org/game#attack> (\\d+)[\\s\\S]*?<http://example.org/game#location> "{x: (\\d+), y: (\\d+)}"`));
    if (!attackerMatch) {
      console.error('Could not find attacker unit');
      return;
    }
    const attackPower = parseInt(attackerMatch[1]);
    const attackerX = parseInt(attackerMatch[2]);
    const attackerY = parseInt(attackerMatch[3]);

    // 4. Extract target stats
    const targetMatch = targetContent.match(new RegExp(`<${targetUri.replace(':', '#')}> a <http://example.org/game#${targetType}>;[\\s\\S]*?<http://example.org/game#health> (\\d+)[\\s\\S]*?<http://example.org/game#location> "{x: (\\d+), y: (\\d+)}"`));
    if (!targetMatch) {
      console.error('Could not find target');
      return;
    }
    const targetHealth = parseInt(targetMatch[1]);
    const targetX = parseInt(targetMatch[2]);
    const targetY = parseInt(targetMatch[3]);

    // 5. Calculate distance between attacker and target
    const distance = Math.sqrt(Math.pow(attackerX - targetX, 2) + Math.pow(attackerY - targetY, 2));
    if (distance > 5) {
      console.error(`Target is out of range (distance: ${distance}). Move closer to attack.`);
      return;
    }

    // 6. Apply terrain combat modifier
    const combatModifier = await terrainModule.getTerrainModifier(targetX, targetY, 'combat');
    console.log(`Combat modifier at (${targetX}, ${targetY}): ${combatModifier}`);
    
    // 7. Calculate damage (attack power with some randomness and terrain modifier)
    const baseRoll = 0.8 + Math.random() * 0.4;
    const damage = Math.floor(attackPower * baseRoll * combatModifier);
    const newHealth = Math.max(0, targetHealth - damage);

    // 7. Update target health
    let updatedTargetContent;
    if (newHealth > 0) {
      updatedTargetContent = targetContent.replace(
        new RegExp(`(<${targetUri.replace(':', '#')}> a <http://example.org/game#${targetType}>;[\\s\\S]*?<http://example.org/game#health> )\\d+`),
        `$1${newHealth}`
      );
    } else {
      // If health is 0, remove the target
      if (targetType === 'Unit') {
        updatedTargetContent = targetContent.replace(
          new RegExp(`<${targetUri.replace(':', '#')}> a <http://example.org/game#${targetType}>;[\\s\\S]*?<http://example.org/game#location> "{x: \\d+, y: \\d+}".`),
          ''
        );
      } else {
        updatedTargetContent = targetContent.replace(
          new RegExp(`<${targetUri.replace(':', '#')}> a <http://example.org/game#${targetType}>;[\\s\\S]*?<http://example.org/game#location> "{x: \\d+, y: \\d+}".`),
          ''
        );
      }
    }

    // 8. Write the updated TTL data
    await fs.writeFile(targetPath, updatedTargetContent);

    // 9. Commit the changes to Git
    await exec(`git add ${targetPath.split('/').pop()}`, { cwd: gameRepoDir });
    if (newHealth > 0) {
      await exec(`git commit -m "Attack ${targetUri}: ${damage} damage, ${newHealth} health remaining"`, { cwd: gameRepoDir });
      console.log(`Attack successful! Dealt ${damage} damage (Terrain modifier: ${combatModifier}). ${targetUri} has ${newHealth} health remaining.`);
    } else {
      await exec(`git commit -m "Attack ${targetUri}: ${damage} damage, destroyed"`, { cwd: gameRepoDir });
      console.log(`Attack successful! Dealt ${damage} damage. ${targetUri} has been destroyed!`);
    }
  });

program
  .command('build <buildingType> <x> <y>')
  .action(async (buildingType, x, y) => {
    console.log(`Building ${buildingType} at (${x}, ${y})...`);
    const fs = require('fs').promises;
    const { exec } = require('child_process');

    const gameRepoDir = 'C:/Users/markj/Desktop/game-repo';
    const buildingsTtlPath = `${gameRepoDir}/buildings.ttl`;
    const playerResourcesTtlPath = `${gameRepoDir}/player_resources.ttl`;

    // 1. Read the content of buildings.ttl and player_resources.ttl
    let buildingsTtlContent;
    try {
      buildingsTtlContent = await fs.readFile(buildingsTtlPath, 'utf8');
    } catch (error) {
      buildingsTtlContent = `@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>.
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>.
@prefix xsd: <http://www.w3.org/2001/XMLSchema#>.
@prefix game: <http://example.org/game#>.

`;
    }
    const playerResourcesTtlContent = await fs.readFile(playerResourcesTtlPath, 'utf8');

    // 2. Define building costs and properties
    const buildingTypes = {
      'barracks': { gold: 100, wood: 150, stone: 50, food: 0, health: 300 },
      'townCenter': { gold: 200, wood: 300, stone: 150, food: 0, health: 500 },
      'farm': { gold: 0, wood: 100, stone: 0, food: 50, health: 150 },
      'mine': { gold: 150, wood: 50, stone: 100, food: 0, health: 200 },
      'tower': { gold: 50, wood: 100, stone: 150, food: 0, health: 250 }
    };

    if (!buildingTypes[buildingType]) {
      console.error(`Invalid building type: ${buildingType}`);
      return;
    }

    const cost = buildingTypes[buildingType];

    // 3. Check if player has enough resources
    const goldMatch = playerResourcesTtlContent.match(/<http:\/\/example\.org\/game#gold> (\d+)/);
    const woodMatch = playerResourcesTtlContent.match(/<http:\/\/example\.org\/game#wood> (\d+)/);
    const stoneMatch = playerResourcesTtlContent.match(/<http:\/\/example\.org\/game#stone> (\d+)/);
    const foodMatch = playerResourcesTtlContent.match(/<http:\/\/example\.org\/game#food> (\d+)/);

    if (!goldMatch || !woodMatch || !stoneMatch || !foodMatch) {
      console.error('Could not find player resources');
      return;
    }

    const playerGold = parseInt(goldMatch[1]);
    const playerWood = parseInt(woodMatch[1]);
    const playerStone = parseInt(stoneMatch[1]);
    const playerFood = parseInt(foodMatch[1]);

    if (playerGold < cost.gold || playerWood < cost.wood || playerStone < cost.stone || playerFood < cost.food) {
      console.error(`Not enough resources to build ${buildingType}`);
      console.log(`Required: Gold: ${cost.gold}, Wood: ${cost.wood}, Stone: ${cost.stone}, Food: ${cost.food}`);
      console.log(`Available: Gold: ${playerGold}, Wood: ${playerWood}, Stone: ${playerStone}, Food: ${playerFood}`);
      return;
    }

    // 4. Generate a unique ID for the new building
    const buildingCount = (buildingsTtlContent.match(/game:building\d+/g) || []).length;
    const buildingId = `game:building${buildingCount + 1}`;

    // 5. Add the new building to buildings.ttl
    const newBuilding = `
${buildingId} a game:Building;
 game:type "${buildingType}";
 game:owner game:player1;
 game:health ${cost.health};
 game:location "{x: ${x}, y: ${y}}".`;

    const updatedBuildingsTtlContent = buildingsTtlContent + newBuilding;

    // 6. Update player resources
    const updatedPlayerResourcesTtlContent = playerResourcesTtlContent
      .replace(/<http:\/\/example\.org\/game#gold> \d+/, `<http://example.org/game#gold> ${playerGold - cost.gold}`)
      .replace(/<http:\/\/example\.org\/game#wood> \d+/, `<http://example.org/game#wood> ${playerWood - cost.wood}`)
      .replace(/<http:\/\/example\.org\/game#stone> \d+/, `<http://example.org/game#stone> ${playerStone - cost.stone}`)
      .replace(/<http:\/\/example\.org\/game#food> \d+/, `<http://example.org/game#food> ${playerFood - cost.food}`);

    // 7. Write the updated TTL data
    await fs.writeFile(buildingsTtlPath, updatedBuildingsTtlContent);
    await fs.writeFile(playerResourcesTtlPath, updatedPlayerResourcesTtlContent);

    // 8. Commit the changes to Git
    await exec('git add buildings.ttl player_resources.ttl', { cwd: gameRepoDir });
    await exec(`git commit -m "Build ${buildingType} at (${x}, ${y})"`, { cwd: gameRepoDir });

    console.log(`Successfully built ${buildingType} at (${x}, ${y})!`);
  });

module.exports = program;