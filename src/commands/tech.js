const { program } = require('commander');
const fs = require('fs').promises;
const { exec } = require('child_process');
const path = require('path');

program
  .command('research <techName>')
  .description('Research a new technology by creating a Git branch')
  .action(async (techName) => {
    console.log(`Researching technology: ${techName}...`);
    
    const gameRepoDir = 'C:/Users/markj/Desktop/game-repo';
    const techTreePath = `${gameRepoDir}/tech_tree.ttl`;
    
    // Define available technologies and their requirements
    const technologies = {
      'metalWorking': {
        cost: { gold: 100, wood: 50, stone: 100, food: 0 },
        effects: { unitAttack: 5 },
        researchTime: 60, // seconds
        prerequisites: []
      },
      'archery': {
        cost: { gold: 50, wood: 150, stone: 0, food: 50 },
        effects: { unlockUnit: 'archer' },
        researchTime: 90,
        prerequisites: []
      },
      'horsemanship': {
        cost: { gold: 150, wood: 0, stone: 0, food: 200 },
        effects: { unlockUnit: 'cavalry' },
        researchTime: 120,
        prerequisites: []
      },
      'masonry': {
        cost: { gold: 100, wood: 50, stone: 200, food: 0 },
        effects: { buildingHealth: 100 },
        researchTime: 90,
        prerequisites: []
      },
      'agriculture': {
        cost: { gold: 0, wood: 100, stone: 50, food: 100 },
        effects: { foodProduction: 2 },
        researchTime: 60,
        prerequisites: []
      },
      'ironWorking': {
        cost: { gold: 200, wood: 100, stone: 150, food: 0 },
        effects: { unitAttack: 10, unitDefense: 5 },
        researchTime: 120,
        prerequisites: ['metalWorking']
      },
      'cavalry': {
        cost: { gold: 200, wood: 50, stone: 0, food: 250 },
        effects: { unlockUnit: 'heavyCavalry' },
        researchTime: 150,
        prerequisites: ['horsemanship']
      },
      'construction': {
        cost: { gold: 150, wood: 200, stone: 250, food: 0 },
        effects: { unlockBuilding: 'fortress' },
        researchTime: 180,
        prerequisites: ['masonry']
      }
    };
    
    // Check if the technology exists
    if (!technologies[techName]) {
      console.error(`Unknown technology: ${techName}`);
      console.log('Available technologies:');
      Object.keys(technologies).forEach(tech => {
        console.log(`- ${tech}`);
      });
      return;
    }
    
    const tech = technologies[techName];
    
    // Check if tech_tree.ttl exists, create it if not
    let techTreeContent;
    try {
      techTreeContent = await fs.readFile(techTreePath, 'utf8');
    } catch (error) {
      // Create initial tech tree file
      techTreeContent = `@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>.
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>.
@prefix xsd: <http://www.w3.org/2001/XMLSchema#>.
@prefix game: <http://example.org/game#>.

game:techTree a game:TechTree;
 game:researchedTechs "";
 game:researchingTech "";
 game:researchProgress 0.`;
      
      await fs.writeFile(techTreePath, techTreeContent);
      await exec('git add tech_tree.ttl', { cwd: gameRepoDir });
      await exec('git commit -m "Initialize technology tree"', { cwd: gameRepoDir });
    }
    
    // Check if the technology is already researched
    const researchedMatch = techTreeContent.match(/game:researchedTechs "([^"]*)"/);
    if (researchedMatch) {
      const researchedTechs = researchedMatch[1].split(',').filter(t => t.length > 0);
      if (researchedTechs.includes(techName)) {
        console.log(`Technology ${techName} is already researched.`);
        return;
      }
    }
    
    // Check if another technology is currently being researched
    const researchingMatch = techTreeContent.match(/game:researchingTech "([^"]*)"/);
    if (researchingMatch && researchingMatch[1] !== "") {
      console.log(`Already researching technology: ${researchingMatch[1]}`);
      return;
    }
    
    // Check prerequisites
    if (tech.prerequisites.length > 0) {
      const researchedTechs = researchedMatch ? researchedMatch[1].split(',').filter(t => t.length > 0) : [];
      const missingPrereqs = tech.prerequisites.filter(prereq => !researchedTechs.includes(prereq));
      
      if (missingPrereqs.length > 0) {
        console.error(`Missing prerequisites for ${techName}:`);
        missingPrereqs.forEach(prereq => {
          console.log(`- ${prereq}`);
        });
        return;
      }
    }
    
    // Check if player has enough resources
    const playerResourcesPath = `${gameRepoDir}/player_resources.ttl`;
    const playerResourcesContent = await fs.readFile(playerResourcesPath, 'utf8');
    
    const goldMatch = playerResourcesContent.match(/game:gold (\d+)/);
    const woodMatch = playerResourcesContent.match(/game:wood (\d+)/);
    const stoneMatch = playerResourcesContent.match(/game:stone (\d+)/);
    const foodMatch = playerResourcesContent.match(/game:food (\d+)/);
    
    if (!goldMatch || !woodMatch || !stoneMatch || !foodMatch) {
      console.error('Could not find player resources');
      return;
    }
    
    const playerGold = parseInt(goldMatch[1]);
    const playerWood = parseInt(woodMatch[1]);
    const playerStone = parseInt(stoneMatch[1]);
    const playerFood = parseInt(foodMatch[1]);
    
    if (playerGold < tech.cost.gold || playerWood < tech.cost.wood || 
        playerStone < tech.cost.stone || playerFood < tech.cost.food) {
      console.error(`Not enough resources to research ${techName}`);
      console.log(`Required: Gold: ${tech.cost.gold}, Wood: ${tech.cost.wood}, Stone: ${tech.cost.stone}, Food: ${tech.cost.food}`);
      console.log(`Available: Gold: ${playerGold}, Wood: ${playerWood}, Stone: ${playerStone}, Food: ${playerFood}`);
      return;
    }
    
    // Deduct resources
    const updatedPlayerResourcesContent = playerResourcesContent
      .replace(/game:gold \d+/, `game:gold ${playerGold - tech.cost.gold}`)
      .replace(/game:wood \d+/, `game:wood ${playerWood - tech.cost.wood}`)
      .replace(/game:stone \d+/, `game:stone ${playerStone - tech.cost.stone}`)
      .replace(/game:food \d+/, `game:food ${playerFood - tech.cost.food}`);
    
    await fs.writeFile(playerResourcesPath, updatedPlayerResourcesContent);
    
    // Update tech tree to indicate research in progress
    const updatedTechTreeContent = techTreeContent
      .replace(/game:researchingTech "[^"]*"/, `game:researchingTech "${techName}"`)
      .replace(/game:researchProgress \d+/, 'game:researchProgress 0');
    
    await fs.writeFile(techTreePath, updatedTechTreeContent);
    
    // Create a branch for the technology research
    await exec(`git checkout -b research-${techName}`, { cwd: gameRepoDir });
    await exec('git add player_resources.ttl tech_tree.ttl', { cwd: gameRepoDir });
    await exec(`git commit -m "Start researching ${techName}"`, { cwd: gameRepoDir });
    
    console.log(`Started researching ${techName}. This will take ${tech.researchTime} seconds.`);
    console.log(`Effects when completed: ${JSON.stringify(tech.effects)}`);
    
    // In a real implementation, we would use a timer or a background process
    // For this demo, we'll simulate the research completion immediately
    console.log('Simulating research completion...');
    
    // Switch back to main branch
    await exec('git checkout main', { cwd: gameRepoDir });
    
    // Merge the research branch
    await exec(`git merge research-${techName}`, { cwd: gameRepoDir });
    
    // Update tech tree to mark research as completed
    const completedTechTreeContent = updatedTechTreeContent
      .replace(/game:researchingTech "[^"]*"/, 'game:researchingTech ""')
      .replace(/game:researchedTechs "([^"]*)"/, (match, techs) => {
        const techsList = techs.length > 0 ? techs.split(',') : [];
        techsList.push(techName);
        return `game:researchedTechs "${techsList.join(',')}"`;
      });
    
    await fs.writeFile(techTreePath, completedTechTreeContent);
    
    // Apply technology effects
    await applyTechnologyEffects(techName, tech.effects, gameRepoDir);
    
    // Commit the changes
    await exec('git add tech_tree.ttl', { cwd: gameRepoDir });
    await exec(`git commit -m "Complete research: ${techName}"`, { cwd: gameRepoDir });
    
    console.log(`Research completed: ${techName}`);
    console.log(`Effects applied: ${JSON.stringify(tech.effects)}`);
  });

program
  .command('tech-status')
  .description('Show the status of technology research')
  .action(async () => {
    console.log('Technology research status:');
    
    const gameRepoDir = 'C:/Users/markj/Desktop/game-repo';
    const techTreePath = `${gameRepoDir}/tech_tree.ttl`;
    
    try {
      const techTreeContent = await fs.readFile(techTreePath, 'utf8');
      
      const researchedMatch = techTreeContent.match(/game:researchedTechs "([^"]*)"/);
      const researchingMatch = techTreeContent.match(/game:researchingTech "([^"]*)"/);
      const progressMatch = techTreeContent.match(/game:researchProgress (\d+)/);
      
      const researchedTechs = researchedMatch ? researchedMatch[1].split(',').filter(t => t.length > 0) : [];
      const researchingTech = researchingMatch ? researchingMatch[1] : '';
      const progress = progressMatch ? parseInt(progressMatch[1]) : 0;
      
      console.log('Researched technologies:');
      if (researchedTechs.length > 0) {
        researchedTechs.forEach(tech => {
          console.log(`- ${tech}`);
        });
      } else {
        console.log('None');
      }
      
      console.log('\nCurrently researching:');
      if (researchingTech) {
        console.log(`${researchingTech} (${progress}% complete)`);
      } else {
        console.log('None');
      }
    } catch (error) {
      console.log('No technology research in progress.');
    }
  });

// Helper function to apply technology effects
async function applyTechnologyEffects(techName, effects, gameRepoDir) {
  for (const [effect, value] of Object.entries(effects)) {
    switch (effect) {
      case 'unitAttack':
        await applyUnitAttackBonus(value, gameRepoDir);
        break;
      case 'unitDefense':
        await applyUnitDefenseBonus(value, gameRepoDir);
        break;
      case 'buildingHealth':
        await applyBuildingHealthBonus(value, gameRepoDir);
        break;
      case 'unlockUnit':
        // This would be handled by the train command checking the tech tree
        console.log(`Unlocked unit type: ${value}`);
        break;
      case 'unlockBuilding':
        // This would be handled by the build command checking the tech tree
        console.log(`Unlocked building type: ${value}`);
        break;
      case 'foodProduction':
        // This would affect resource gathering rates
        console.log(`Increased food production by factor: ${value}`);
        break;
      default:
        console.log(`Unknown effect: ${effect}`);
    }
  }
}

async function applyUnitAttackBonus(bonus, gameRepoDir) {
  const unitsTtlPath = `${gameRepoDir}/units.ttl`;
  const unitsTtlContent = await fs.readFile(unitsTtlPath, 'utf8');
  
  // Apply attack bonus to all units
  const updatedUnitsTtlContent = unitsTtlContent.replace(
    /game:attack (\d+)/g,
    (match, attack) => `game:attack ${parseInt(attack) + bonus}`
  );
  
  await fs.writeFile(unitsTtlPath, updatedUnitsTtlContent);
  await exec('git add units.ttl', { cwd: gameRepoDir });
}

async function applyUnitDefenseBonus(bonus, gameRepoDir) {
  const unitsTtlPath = `${gameRepoDir}/units.ttl`;
  const unitsTtlContent = await fs.readFile(unitsTtlPath, 'utf8');
  
  // Apply defense bonus to all units
  const updatedUnitsTtlContent = unitsTtlContent.replace(
    /game:defense (\d+)/g,
    (match, defense) => `game:defense ${parseInt(defense) + bonus}`
  );
  
  await fs.writeFile(unitsTtlPath, updatedUnitsTtlContent);
  await exec('git add units.ttl', { cwd: gameRepoDir });
}

async function applyBuildingHealthBonus(bonus, gameRepoDir) {
  const buildingsTtlPath = `${gameRepoDir}/buildings.ttl`;
  
  try {
    const buildingsTtlContent = await fs.readFile(buildingsTtlPath, 'utf8');
    
    // Apply health bonus to all buildings
    const updatedBuildingsTtlContent = buildingsTtlContent.replace(
      /game:health (\d+)/g,
      (match, health) => `game:health ${parseInt(health) + bonus}`
    );
    
    await fs.writeFile(buildingsTtlPath, updatedBuildingsTtlContent);
    await exec('git add buildings.ttl', { cwd: gameRepoDir });
  } catch (error) {
    console.log('No buildings to upgrade.');
  }
}

module.exports = program;