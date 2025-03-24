const { program } = require('commander');

program
  .command('train <unitType> <buildingUri>')
  .action(async (unitType, buildingUri) => {
    console.log(`Training ${unitType} at ${buildingUri}...`);
    const fs = require('fs').promises;
    const { exec } = require('child_process');

    const gameRepoDir = 'C:/Users/markj/Desktop/game-repo';
    const unitsTtlPath = `${gameRepoDir}/units.ttl`;
    const buildingsTtlPath = `${gameRepoDir}/buildings.ttl`;
    const playerResourcesTtlPath = `${gameRepoDir}/player_resources.ttl`;
    const playerUnitsTtlPath = `${gameRepoDir}/player_units.ttl`;

    // 1. Read the content of units.ttl, buildings.ttl, player_resources.ttl, and player_units.ttl
    const unitsTtlContent = await fs.readFile(unitsTtlPath, 'utf8');
    const buildingsTtlContent = await fs.readFile(buildingsTtlPath, 'utf8');
    const playerResourcesTtlContent = await fs.readFile(playerResourcesTtlPath, 'utf8');
    const playerUnitsTtlContent = await fs.readFile(playerUnitsTtlPath, 'utf8');

    // 2. Check if building exists and is the right type
    const buildingMatch = buildingsTtlContent.match(new RegExp(`<${buildingUri.replace(':', '#')}> a <http://example.org/game#Building>;[\\s\\S]*?<http://example.org/game#type> "([^"]+)"[\\s\\S]*?<http://example.org/game#location> "{x: (\\d+), y: (\\d+)}"`));
    if (!buildingMatch) {
      console.error('Could not find building');
      return;
    }

    const buildingType = buildingMatch[1];
    const buildingX = parseInt(buildingMatch[2]);
    const buildingY = parseInt(buildingMatch[3]);

    // 3. Define unit types, their requirements, and properties
    const unitTypes = {
      'warrior': { 
        requiredBuilding: 'barracks', 
        gold: 50, wood: 0, stone: 0, food: 50,
        attack: 10, defense: 5, health: 100
      },
      'archer': { 
        requiredBuilding: 'barracks', 
        gold: 40, wood: 30, stone: 0, food: 30,
        attack: 15, defense: 3, health: 80
      },
      'cavalry': { 
        requiredBuilding: 'barracks', 
        gold: 80, wood: 0, stone: 0, food: 100,
        attack: 20, defense: 8, health: 150
      },
      'worker': { 
        requiredBuilding: 'townCenter', 
        gold: 0, wood: 0, stone: 0, food: 50,
        attack: 2, defense: 1, health: 50
      }
    };

    if (!unitTypes[unitType]) {
      console.error(`Invalid unit type: ${unitType}`);
      return;
    }

    const unitProps = unitTypes[unitType];

    if (buildingType !== unitProps.requiredBuilding) {
      console.error(`Cannot train ${unitType} at ${buildingType}. Requires ${unitProps.requiredBuilding}.`);
      return;
    }

    // 4. Check if player has enough resources
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

    if (playerGold < unitProps.gold || playerWood < unitProps.wood || 
        playerStone < unitProps.stone || playerFood < unitProps.food) {
      console.error(`Not enough resources to train ${unitType}`);
      console.log(`Required: Gold: ${unitProps.gold}, Wood: ${unitProps.wood}, Stone: ${unitProps.stone}, Food: ${unitProps.food}`);
      console.log(`Available: Gold: ${playerGold}, Wood: ${playerWood}, Stone: ${playerStone}, Food: ${playerFood}`);
      return;
    }

    // 5. Generate a unique ID for the new unit
    const unitCount = (unitsTtlContent.match(/game:unit\d+/g) || []).length;
    const unitId = `game:unit${unitCount + 1}`;

    // 6. Add the new unit to units.ttl
    const newUnit = `
${unitId} a game:Unit;
 game:name "${unitType}";
 game:attack ${unitProps.attack};
 game:defense ${unitProps.defense};
 game:health ${unitProps.health};
 game:location "{x: ${buildingX}, y: ${buildingY}}".`;

    const updatedUnitsTtlContent = unitsTtlContent + newUnit;

    // 7. Update player resources
    const updatedPlayerResourcesTtlContent = playerResourcesTtlContent
      .replace(/<http:\/\/example\.org\/game#gold> \d+/, `<http://example.org/game#gold> ${playerGold - unitProps.gold}`)
      .replace(/<http:\/\/example\.org\/game#wood> \d+/, `<http://example.org/game#wood> ${playerWood - unitProps.wood}`)
      .replace(/<http:\/\/example\.org\/game#stone> \d+/, `<http://example.org/game#stone> ${playerStone - unitProps.stone}`)
      .replace(/<http:\/\/example\.org\/game#food> \d+/, `<http://example.org/game#food> ${playerFood - unitProps.food}`);

    // 8. Update player units
    const updatedPlayerUnitsTtlContent = playerUnitsTtlContent.replace(
      /game:player1 a game:Player;([^.]*)\./,
      `game:player1 a game:Player;$1;\n game:units ${unitId}.`
    );

    // 9. Write the updated TTL data
    await fs.writeFile(unitsTtlPath, updatedUnitsTtlContent);
    await fs.writeFile(playerResourcesTtlPath, updatedPlayerResourcesTtlContent);
    await fs.writeFile(playerUnitsTtlPath, updatedPlayerUnitsTtlContent);

    // 10. Commit the changes to Git
    await exec('git add units.ttl player_resources.ttl player_units.ttl', { cwd: gameRepoDir });
    await exec(`git commit -m "Train ${unitType} unit (${unitId})"`, { cwd: gameRepoDir });

    console.log(`Successfully trained ${unitType} unit (${unitId})!`);
  });

module.exports = program;