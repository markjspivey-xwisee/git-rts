const { program } = require('commander');
const fs = require('fs').promises;
const { exec } = require('child_process');
const path = require('path');

// Define quest types
const questTypes = {
  'resource_gathering': {
    description: 'Gather a specific amount of resources',
    checkCompletion: async (quest, playerUri) => {
      const gameRepoDir = 'C:/Users/markj/Desktop/game-repo';
      const playerResourcesPath = `${gameRepoDir}/player_resources.ttl`;
      
      try {
        const playerResourcesContent = await fs.readFile(playerResourcesPath, 'utf8');
        const requirements = quest.requirements.split(',');
        
        for (const requirement of requirements) {
          const [resourceType, amountStr] = requirement.split(':');
          const requiredAmount = parseInt(amountStr);
          
          const resourceMatch = playerResourcesContent.match(new RegExp(`game:${resourceType} (\\d+)`));
          if (!resourceMatch) {
            return false;
          }
          
          const currentAmount = parseInt(resourceMatch[1]);
          if (currentAmount < requiredAmount) {
            return false;
          }
        }
        
        return true;
      } catch (error) {
        console.error(`Error checking resource gathering quest: ${error.message}`);
        return false;
      }
    }
  },
  'unit_training': {
    description: 'Train a specific number of units',
    checkCompletion: async (quest, playerUri) => {
      const gameRepoDir = 'C:/Users/markj/Desktop/game-repo';
      const unitsPath = `${gameRepoDir}/units.ttl`;
      const playerUnitsPath = `${gameRepoDir}/player_units.ttl`;
      
      try {
        const unitsContent = await fs.readFile(unitsPath, 'utf8');
        const playerUnitsContent = await fs.readFile(playerUnitsPath, 'utf8');
        
        const requirements = quest.requirements.split(',');
        
        for (const requirement of requirements) {
          const [unitType, countStr] = requirement.split(':');
          const requiredCount = parseInt(countStr);
          
          // Count units of the specified type owned by the player
          const unitMatches = playerUnitsContent.matchAll(new RegExp(`${playerUri}[\\s\\S]*?game:units (game:[a-zA-Z0-9]+)`, 'g'));
          let unitCount = 0;
          
          for (const unitMatch of unitMatches) {
            const unitUri = unitMatch[1];
            const unitTypeMatch = unitsContent.match(new RegExp(`${unitUri} a game:Unit;[\\s\\S]*?game:name "([^"]+)"`));
            
            if (unitTypeMatch && unitTypeMatch[1].toLowerCase() === unitType.toLowerCase()) {
              unitCount++;
            }
          }
          
          if (unitCount < requiredCount) {
            return false;
          }
        }
        
        return true;
      } catch (error) {
        console.error(`Error checking unit training quest: ${error.message}`);
        return false;
      }
    }
  },
  'building_construction': {
    description: 'Construct specific buildings',
    checkCompletion: async (quest, playerUri) => {
      const gameRepoDir = 'C:/Users/markj/Desktop/game-repo';
      const buildingsPath = `${gameRepoDir}/buildings.ttl`;
      
      try {
        const buildingsContent = await fs.readFile(buildingsPath, 'utf8');
        const requirements = quest.requirements.split(',');
        
        for (const requirement of requirements) {
          const [buildingType, countStr] = requirement.split(':');
          const requiredCount = parseInt(countStr);
          
          // Count buildings of the specified type owned by the player
          const buildingMatches = buildingsContent.matchAll(new RegExp(`game:building\\d+ a game:Building;[\\s\\S]*?game:type "${buildingType}"[\\s\\S]*?game:owner ${playerUri}`, 'g'));
          let buildingCount = 0;
          
          for (const match of buildingMatches) {
            buildingCount++;
          }
          
          if (buildingCount < requiredCount) {
            return false;
          }
        }
        
        return true;
      } catch (error) {
        console.error(`Error checking building construction quest: ${error.message}`);
        return false;
      }
    }
  },
  'exploration': {
    description: 'Explore a specific number of terrain cells',
    checkCompletion: async (quest, playerUri) => {
      const gameRepoDir = 'C:/Users/markj/Desktop/game-repo';
      const visibilityPath = `${gameRepoDir}/visibility.ttl`;
      
      try {
        const visibilityContent = await fs.readFile(visibilityPath, 'utf8');
        const requirements = quest.requirements.split(',');
        
        for (const requirement of requirements) {
          const [type, countStr] = requirement.split(':');
          
          if (type === 'cells') {
            const requiredCount = parseInt(countStr);
            
            // Count explored cells
            const exploredCellMatches = visibilityContent.matchAll(/game:terrain_\d+_\d+ game:exploredBy game:player1/g);
            let exploredCount = 0;
            
            for (const match of exploredCellMatches) {
              exploredCount++;
            }
            
            if (exploredCount < requiredCount) {
              return false;
            }
          }
        }
        
        return true;
      } catch (error) {
        console.error(`Error checking exploration quest: ${error.message}`);
        return false;
      }
    }
  },
  'combat': {
    description: 'Defeat a specific number of enemy units',
    checkCompletion: async (quest, playerUri) => {
      const gameRepoDir = 'C:/Users/markj/Desktop/game-repo';
      const combatLogPath = `${gameRepoDir}/combat_log.ttl`;
      
      try {
        // Check if combat log exists
        let combatLogContent;
        try {
          combatLogContent = await fs.readFile(combatLogPath, 'utf8');
        } catch (error) {
          return false; // No combat log means no combat has occurred
        }
        
        const requirements = quest.requirements.split(',');
        
        for (const requirement of requirements) {
          const [type, countStr] = requirement.split(':');
          
          if (type === 'defeats') {
            const requiredCount = parseInt(countStr);
            
            // Count enemy defeats
            const defeatMatches = combatLogContent.matchAll(new RegExp(`${playerUri} game:defeated game:[a-zA-Z0-9]+`, 'g'));
            let defeatCount = 0;
            
            for (const match of defeatMatches) {
              defeatCount++;
            }
            
            if (defeatCount < requiredCount) {
              return false;
            }
          }
        }
        
        return true;
      } catch (error) {
        console.error(`Error checking combat quest: ${error.message}`);
        return false;
      }
    }
  }
};

// Initialize quest system
program
  .command('init-quests')
  .description('Initialize the quest system')
  .action(async () => {
    console.log('Initializing quest system...');
    
    const gameRepoDir = 'C:/Users/markj/Desktop/game-repo';
    const questsPath = `${gameRepoDir}/quests.ttl`;
    const achievementsPath = `${gameRepoDir}/achievements.ttl`;
    
    try {
      // Create quests.ttl
      const questsContent = `@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>.
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>.
@prefix xsd: <http://www.w3.org/2001/XMLSchema#>.
@prefix game: <http://example.org/game#>.

# Quest system
game:questSystem a game:QuestSystem;
  game:activeQuests "quest1,quest2,quest3";
  game:completedQuests "";
  game:questRewardPool "gold:1000,wood:1000,stone:500,food:1000".

# Resource gathering quests
game:quest1 a game:Quest;
  game:name "Resource Gatherer";
  game:description "Gather 500 of each resource type";
  game:type "resource_gathering";
  game:requirements "gold:500,wood:500,stone:500,food:500";
  game:reward "gold:200,wood:200";
  game:completed "false";
  game:difficulty "easy".

# Unit training quests
game:quest2 a game:Quest;
  game:name "Army Builder";
  game:description "Train 5 warrior units";
  game:type "unit_training";
  game:requirements "warrior:5";
  game:reward "gold:300,food:200";
  game:completed "false";
  game:difficulty "medium".

# Building construction quests
game:quest3 a game:Quest;
  game:name "Master Builder";
  game:description "Construct 1 barracks and 1 tower";
  game:type "building_construction";
  game:requirements "barracks:1,tower:1";
  game:reward "stone:300,wood:300";
  game:completed "false";
  game:difficulty "medium".

# Exploration quests
game:quest4 a game:Quest;
  game:name "Explorer";
  game:description "Explore at least 50 terrain cells";
  game:type "exploration";
  game:requirements "cells:50";
  game:reward "gold:250,food:250";
  game:completed "false";
  game:difficulty "easy".

# Combat quests
game:quest5 a game:Quest;
  game:name "Warrior";
  game:description "Defeat 10 enemy units";
  game:type "combat";
  game:requirements "defeats:10";
  game:reward "gold:500";
  game:completed "false";
  game:difficulty "hard".`;
      
      // Create achievements.ttl
      const achievementsContent = `@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>.
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>.
@prefix xsd: <http://www.w3.org/2001/XMLSchema#>.
@prefix game: <http://example.org/game#>.

# Achievement system
game:achievementSystem a game:AchievementSystem;
  game:unlockedAchievements "";
  game:totalAchievements "5".

# Resource gathering achievements
game:achievement1 a game:Achievement;
  game:name "Resource Baron";
  game:description "Accumulate 1000 of each resource type";
  game:requirements "gold:1000,wood:1000,stone:1000,food:1000";
  game:reward "gold:500";
  game:unlocked "false".

# Unit training achievements
game:achievement2 a game:Achievement;
  game:name "Commander";
  game:description "Train 20 units of any type";
  game:requirements "units:20";
  game:reward "hero:Commander";
  game:unlocked "false".

# Building construction achievements
game:achievement3 a game:Achievement;
  game:name "City Builder";
  game:description "Construct 10 buildings of any type";
  game:requirements "buildings:10";
  game:reward "gold:500,wood:500,stone:500";
  game:unlocked "false".

# Exploration achievements
game:achievement4 a game:Achievement;
  game:name "Cartographer";
  game:description "Explore the entire map";
  game:requirements "cells:100";
  game:reward "visibility:2";
  game:unlocked "false".

# Combat achievements
game:achievement5 a game:Achievement;
  game:name "Conqueror";
  game:description "Defeat 50 enemy units";
  game:requirements "defeats:50";
  game:reward "hero:Scout";
  game:unlocked "false".`;
      
      await fs.writeFile(questsPath, questsContent);
      await fs.writeFile(achievementsPath, achievementsContent);
      
      // Commit changes
      await exec('git add quests.ttl achievements.ttl', { cwd: gameRepoDir });
      await exec('git commit -m "Initialize quest and achievement system"', { cwd: gameRepoDir });
      
      console.log('Quest and achievement system initialized successfully!');
    } catch (error) {
      console.error(`Error initializing quest system: ${error.message}`);
    }
  });

// List active quests
program
  .command('list-quests')
  .description('List all active quests')
  .action(async () => {
    console.log('Listing active quests...');
    
    const gameRepoDir = 'C:/Users/markj/Desktop/game-repo';
    const questsPath = `${gameRepoDir}/quests.ttl`;
    
    try {
      // Read quests.ttl
      const questsContent = await fs.readFile(questsPath, 'utf8');
      
      // Extract active quests
      const activeQuestsMatch = questsContent.match(/game:activeQuests "([^"]*)"/);
      if (!activeQuestsMatch) {
        console.error('Could not find active quests');
        return;
      }
      
      const activeQuestIds = activeQuestsMatch[1].split(',').filter(id => id.length > 0);
      
      if (activeQuestIds.length === 0) {
        console.log('No active quests.');
        return;
      }
      
      console.log('Active Quests:');
      
      for (const questId of activeQuestIds) {
        const questMatch = questsContent.match(new RegExp(`game:${questId} a game:Quest;[\\s\\S]*?game:name "([^"]+)";[\\s\\S]*?game:description "([^"]+)";[\\s\\S]*?game:type "([^"]+)";[\\s\\S]*?game:requirements "([^"]+)";[\\s\\S]*?game:reward "([^"]+)";[\\s\\S]*?game:completed "([^"]+)";[\\s\\S]*?game:difficulty "([^"]+)"`));
        
        if (questMatch) {
          const name = questMatch[1];
          const description = questMatch[2];
          const type = questMatch[3];
          const requirements = questMatch[4];
          const reward = questMatch[5];
          const completed = questMatch[6] === 'true';
          const difficulty = questMatch[7];
          
          console.log(`\n[${questId}] ${name} (${difficulty})`);
          console.log(`Type: ${questTypes[type] ? questTypes[type].description : type}`);
          console.log(`Description: ${description}`);
          console.log(`Requirements: ${requirements}`);
          console.log(`Reward: ${reward}`);
          console.log(`Status: ${completed ? 'Completed' : 'In Progress'}`);
        }
      }
    } catch (error) {
      console.error(`Error listing quests: ${error.message}`);
    }
  });

// List achievements
program
  .command('list-achievements')
  .description('List all achievements')
  .action(async () => {
    console.log('Listing achievements...');
    
    const gameRepoDir = 'C:/Users/markj/Desktop/game-repo';
    const achievementsPath = `${gameRepoDir}/achievements.ttl`;
    
    try {
      // Read achievements.ttl
      const achievementsContent = await fs.readFile(achievementsPath, 'utf8');
      
      // Extract unlocked achievements
      const unlockedAchievementsMatch = achievementsContent.match(/game:unlockedAchievements "([^"]*)"/);
      if (!unlockedAchievementsMatch) {
        console.error('Could not find unlocked achievements');
        return;
      }
      
      const unlockedAchievementIds = unlockedAchievementsMatch[1].split(',').filter(id => id.length > 0);
      
      // Find all achievements
      const achievementMatches = achievementsContent.matchAll(/game:(achievement\d+) a game:Achievement;[\s\S]*?game:name "([^"]+)";[\s\S]*?game:description "([^"]+)";[\s\S]*?game:requirements "([^"]+)";[\s\S]*?game:reward "([^"]+)";[\s\S]*?game:unlocked "([^"]+)"/g);
      
      let achievementsFound = false;
      
      console.log('Achievements:');
      
      for (const match of achievementMatches) {
        achievementsFound = true;
        const achievementId = match[1];
        const name = match[2];
        const description = match[3];
        const requirements = match[4];
        const reward = match[5];
        const unlocked = match[6] === 'true' || unlockedAchievementIds.includes(achievementId);
        
        console.log(`\n[${achievementId}] ${name}`);
        console.log(`Description: ${description}`);
        console.log(`Requirements: ${requirements}`);
        console.log(`Reward: ${reward}`);
        console.log(`Status: ${unlocked ? 'Unlocked' : 'Locked'}`);
      }
      
      if (!achievementsFound) {
        console.log('No achievements found.');
      }
    } catch (error) {
      console.error(`Error listing achievements: ${error.message}`);
    }
  });

// Check quest completion
program
  .command('check-quests')
  .description('Check if any quests have been completed')
  .action(async () => {
    console.log('Checking quest completion...');
    
    const gameRepoDir = 'C:/Users/markj/Desktop/game-repo';
    const questsPath = `${gameRepoDir}/quests.ttl`;
    const playerUri = 'game:player1'; // Default player
    
    try {
      // Read quests.ttl
      const questsContent = await fs.readFile(questsPath, 'utf8');
      
      // Extract active quests
      const activeQuestsMatch = questsContent.match(/game:activeQuests "([^"]*)"/);
      if (!activeQuestsMatch) {
        console.error('Could not find active quests');
        return;
      }
      
      const activeQuestIds = activeQuestsMatch[1].split(',').filter(id => id.length > 0);
      
      if (activeQuestIds.length === 0) {
        console.log('No active quests to check.');
        return;
      }
      
      // Extract completed quests
      const completedQuestsMatch = questsContent.match(/game:completedQuests "([^"]*)"/);
      if (!completedQuestsMatch) {
        console.error('Could not find completed quests');
        return;
      }
      
      const completedQuestIds = completedQuestsMatch[1].split(',').filter(id => id.length > 0);
      
      // Check each active quest
      let updatedQuestsContent = questsContent;
      let questsCompleted = false;
      
      for (const questId of activeQuestIds) {
        // Skip if already completed
        if (completedQuestIds.includes(questId)) {
          continue;
        }
        
        const questMatch = questsContent.match(new RegExp(`game:${questId} a game:Quest;[\\s\\S]*?game:name "([^"]+)";[\\s\\S]*?game:description "([^"]+)";[\\s\\S]*?game:type "([^"]+)";[\\s\\S]*?game:requirements "([^"]+)";[\\s\\S]*?game:reward "([^"]+)";[\\s\\S]*?game:completed "([^"]+)";[\\s\\S]*?game:difficulty "([^"]+)"`));
        
        if (questMatch) {
          const name = questMatch[1];
          const type = questMatch[3];
          const requirements = questMatch[4];
          const reward = questMatch[5];
          const completed = questMatch[6] === 'true';
          
          if (!completed && questTypes[type]) {
            // Create quest object
            const quest = {
              id: questId,
              name,
              type,
              requirements,
              reward
            };
            
            // Check if quest is completed
            const isCompleted = await questTypes[type].checkCompletion(quest, playerUri);
            
            if (isCompleted) {
              console.log(`Quest "${name}" completed!`);
              
              // Update quest status
              updatedQuestsContent = updatedQuestsContent.replace(
                new RegExp(`(game:${questId} a game:Quest;[\\s\\S]*?game:completed ")[^"]+"`),
                `$1true"`
              );
              
              // Add to completed quests
              completedQuestIds.push(questId);
              
              // Award rewards
              await awardQuestRewards(reward, playerUri);
              
              questsCompleted = true;
            }
          }
        }
      }
      
      if (questsCompleted) {
        // Update completed quests list
        updatedQuestsContent = updatedQuestsContent.replace(
          /game:completedQuests "[^"]*"/,
          `game:completedQuests "${completedQuestIds.join(',')}"`
        );
        
        // Write updated quests.ttl
        await fs.writeFile(questsPath, updatedQuestsContent);
        
        // Commit changes
        await exec('git add quests.ttl', { cwd: gameRepoDir });
        await exec('git commit -m "Update quest completion status"', { cwd: gameRepoDir });
        
        console.log('Quest completion status updated.');
      } else {
        console.log('No quests completed.');
      }
    } catch (error) {
      console.error(`Error checking quest completion: ${error.message}`);
    }
  });

// Award quest rewards
async function awardQuestRewards(rewardString, playerUri) {
  const gameRepoDir = 'C:/Users/markj/Desktop/game-repo';
  const playerResourcesPath = `${gameRepoDir}/player_resources.ttl`;
  
  try {
    // Read player resources
    const playerResourcesContent = await fs.readFile(playerResourcesPath, 'utf8');
    
    // Parse rewards
    const rewards = rewardString.split(',');
    let updatedPlayerResourcesContent = playerResourcesContent;
    
    console.log('Awarding rewards:');
    
    for (const reward of rewards) {
      const [resourceType, amountStr] = reward.split(':');
      const amount = parseInt(amountStr);
      
      // Update player resources
      const resourceMatch = playerResourcesContent.match(new RegExp(`game:${resourceType} (\\d+)`));
      if (resourceMatch) {
        const currentAmount = parseInt(resourceMatch[1]);
        const newAmount = currentAmount + amount;
        
        updatedPlayerResourcesContent = updatedPlayerResourcesContent.replace(
          new RegExp(`(game:${resourceType} )\\d+`),
          `$1${newAmount}`
        );
        
        console.log(`- ${amount} ${resourceType}`);
      } else if (resourceType === 'hero') {
        // Special reward: hero unit
        console.log(`- Hero unit: ${amountStr}`);
        // This would call the hero creation function
        // For now, just log it
      } else if (resourceType === 'visibility') {
        // Special reward: increased visibility range
        console.log(`- Increased visibility range by ${amount}`);
        // This would update the visibility settings
        // For now, just log it
      }
    }
    
    // Write updated player resources
    await fs.writeFile(playerResourcesPath, updatedPlayerResourcesContent);
    
    // Commit changes
    await exec('git add player_resources.ttl', { cwd: gameRepoDir });
    
    console.log('Rewards awarded successfully!');
  } catch (error) {
    console.error(`Error awarding quest rewards: ${error.message}`);
  }
}

// Export functions and program
module.exports = {
  questTypes,
  program
};