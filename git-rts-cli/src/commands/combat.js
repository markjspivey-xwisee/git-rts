const { program } = require('commander');
const fs = require('fs').promises;
const { exec } = require('child_process');
const path = require('path');

// Unit type advantages/disadvantages
const unitTypeAdvantages = {
  'warrior': {
    strongAgainst: ['archer'],
    weakAgainst: ['cavalry'],
    advantageMultiplier: 1.5,
    disadvantageMultiplier: 0.7
  },
  'archer': {
    strongAgainst: ['cavalry'],
    weakAgainst: ['warrior'],
    advantageMultiplier: 1.5,
    disadvantageMultiplier: 0.7
  },
  'cavalry': {
    strongAgainst: ['warrior'],
    weakAgainst: ['archer'],
    advantageMultiplier: 1.5,
    disadvantageMultiplier: 0.7
  },
  'worker': {
    strongAgainst: [],
    weakAgainst: ['warrior', 'archer', 'cavalry'],
    advantageMultiplier: 1.0,
    disadvantageMultiplier: 0.5
  }
};

// Formation types and their bonuses
const formationTypes = {
  'line': {
    description: 'Units in a line formation',
    requirements: 'At least 3 units in a horizontal or vertical line',
    attackBonus: 1.2,
    defenseBonus: 1.1
  },
  'square': {
    description: 'Units in a square formation',
    requirements: 'At least 4 units forming a square',
    attackBonus: 1.1,
    defenseBonus: 1.3
  },
  'wedge': {
    description: 'Units in a wedge/triangle formation',
    requirements: 'At least 3 units forming a triangle',
    attackBonus: 1.3,
    defenseBonus: 1.0
  },
  'scattered': {
    description: 'Units spread out',
    requirements: 'Units not in any other formation',
    attackBonus: 1.0,
    defenseBonus: 1.0
  }
};

// Experience levels and their bonuses
const experienceLevels = {
  'recruit': {
    minXP: 0,
    attackBonus: 1.0,
    defenseBonus: 1.0,
    healthBonus: 1.0
  },
  'veteran': {
    minXP: 100,
    attackBonus: 1.2,
    defenseBonus: 1.2,
    healthBonus: 1.1
  },
  'elite': {
    minXP: 300,
    attackBonus: 1.4,
    defenseBonus: 1.3,
    healthBonus: 1.2
  },
  'legendary': {
    minXP: 600,
    attackBonus: 1.6,
    defenseBonus: 1.5,
    healthBonus: 1.3
  }
};

// Initialize advanced combat system
program
  .command('init-combat')
  .description('Initialize the advanced combat system')
  .action(async () => {
    console.log('Initializing advanced combat system...');
    
    const gameRepoDir = 'C:/Users/markj/Desktop/game-repo';
    const combatSystemPath = `${gameRepoDir}/combat_system.ttl`;
    const combatLogPath = `${gameRepoDir}/combat_log.ttl`;
    
    try {
      // Create combat_system.ttl
      const combatSystemContent = `@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>.
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>.
@prefix xsd: <http://www.w3.org/2001/XMLSchema#>.
@prefix game: <http://example.org/game#>.

# Combat system
game:combatSystem a game:CombatSystem;
  game:version "1.0";
  game:enableUnitTypeAdvantages "true";
  game:enableFormationBonuses "true";
  game:enableExperienceSystem "true".

# Unit type advantages
game:warriorUnit a game:UnitType;
  game:name "warrior";
  game:strongAgainst "archer";
  game:weakAgainst "cavalry";
  game:advantageMultiplier "1.5"^^xsd:float;
  game:disadvantageMultiplier "0.7"^^xsd:float.

game:archerUnit a game:UnitType;
  game:name "archer";
  game:strongAgainst "cavalry";
  game:weakAgainst "warrior";
  game:advantageMultiplier "1.5"^^xsd:float;
  game:disadvantageMultiplier "0.7"^^xsd:float.

game:cavalryUnit a game:UnitType;
  game:name "cavalry";
  game:strongAgainst "warrior";
  game:weakAgainst "archer";
  game:advantageMultiplier "1.5"^^xsd:float;
  game:disadvantageMultiplier "0.7"^^xsd:float.

game:workerUnit a game:UnitType;
  game:name "worker";
  game:strongAgainst "";
  game:weakAgainst "warrior,archer,cavalry";
  game:advantageMultiplier "1.0"^^xsd:float;
  game:disadvantageMultiplier "0.5"^^xsd:float.

# Formation types
game:lineFormation a game:Formation;
  game:name "line";
  game:description "Units in a line formation";
  game:requirements "At least 3 units in a horizontal or vertical line";
  game:attackBonus "1.2"^^xsd:float;
  game:defenseBonus "1.1"^^xsd:float.

game:squareFormation a game:Formation;
  game:name "square";
  game:description "Units in a square formation";
  game:requirements "At least 4 units forming a square";
  game:attackBonus "1.1"^^xsd:float;
  game:defenseBonus "1.3"^^xsd:float.

game:wedgeFormation a game:Formation;
  game:name "wedge";
  game:description "Units in a wedge/triangle formation";
  game:requirements "At least 3 units forming a triangle";
  game:attackBonus "1.3"^^xsd:float;
  game:defenseBonus "1.0"^^xsd:float.

game:scatteredFormation a game:Formation;
  game:name "scattered";
  game:description "Units spread out";
  game:requirements "Units not in any other formation";
  game:attackBonus "1.0"^^xsd:float;
  game:defenseBonus "1.0"^^xsd:float.

# Experience levels
game:recruitLevel a game:ExperienceLevel;
  game:name "recruit";
  game:minXP 0;
  game:attackBonus "1.0"^^xsd:float;
  game:defenseBonus "1.0"^^xsd:float;
  game:healthBonus "1.0"^^xsd:float.

game:veteranLevel a game:ExperienceLevel;
  game:name "veteran";
  game:minXP 100;
  game:attackBonus "1.2"^^xsd:float;
  game:defenseBonus "1.2"^^xsd:float;
  game:healthBonus "1.1"^^xsd:float.

game:eliteLevel a game:ExperienceLevel;
  game:name "elite";
  game:minXP 300;
  game:attackBonus "1.4"^^xsd:float;
  game:defenseBonus "1.3"^^xsd:float;
  game:healthBonus "1.2"^^xsd:float.

game:legendaryLevel a game:ExperienceLevel;
  game:name "legendary";
  game:minXP 600;
  game:attackBonus "1.6"^^xsd:float;
  game:defenseBonus "1.5"^^xsd:float;
  game:healthBonus "1.3"^^xsd:float.`;
      
      // Create combat_log.ttl
      const combatLogContent = `@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>.
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>.
@prefix xsd: <http://www.w3.org/2001/XMLSchema#>.
@prefix game: <http://example.org/game#>.

# Combat log
game:combatLog a game:CombatLog;
  game:entries "";
  game:lastCombatId 0.`;
      
      await fs.writeFile(combatSystemPath, combatSystemContent);
      await fs.writeFile(combatLogPath, combatLogContent);
      
      // Commit changes
      await exec('git add combat_system.ttl combat_log.ttl', { cwd: gameRepoDir });
      await exec('git commit -m "Initialize advanced combat system"', { cwd: gameRepoDir });
      
      console.log('Advanced combat system initialized successfully!');
    } catch (error) {
      console.error(`Error initializing combat system: ${error.message}`);
    }
  });

// Enhanced attack command with unit type advantages and formation bonuses
program
  .command('enhanced-attack <attackerUri> <targetUri>')
  .description('Attack with unit type advantages and formation bonuses')
  .action(async (attackerUri, targetUri) => {
    console.log(`Unit ${attackerUri} attacking ${targetUri} with advanced combat system...`);
    
    const fs = require('fs').promises;
    const { exec } = require('child_process');
    
    const gameRepoDir = 'C:/Users/markj/Desktop/game-repo';
    const unitsPath = `${gameRepoDir}/units.ttl`;
    const buildingsPath = `${gameRepoDir}/buildings.ttl`;
    const combatSystemPath = `${gameRepoDir}/combat_system.ttl`;
    const combatLogPath = `${gameRepoDir}/combat_log.ttl`;
    const terrainPath = `${gameRepoDir}/terrain.ttl`;
    const weatherPath = `${gameRepoDir}/weather.ttl`;
    
    try {
      // 1. Read the content of units.ttl and buildings.ttl
      const unitsContent = await fs.readFile(unitsPath, 'utf8');
      let buildingsContent;
      try {
        buildingsContent = await fs.readFile(buildingsPath, 'utf8');
      } catch (error) {
        buildingsContent = '';
      }
      
      // 2. Read combat system settings
      let combatSystemContent;
      try {
        combatSystemContent = await fs.readFile(combatSystemPath, 'utf8');
      } catch (error) {
        console.error('Combat system not initialized. Run init-combat first.');
        return;
      }
      
      // 3. Determine if target is a unit or building
      let targetContent;
      let targetPath;
      let targetType;
      if (targetUri.includes('unit')) {
        targetContent = unitsContent;
        targetPath = unitsPath;
        targetType = 'Unit';
      } else if (targetUri.includes('building')) {
        targetContent = buildingsContent;
        targetPath = buildingsPath;
        targetType = 'Building';
      } else {
        console.error('Invalid target type');
        return;
      }
      
      // 4. Extract attacker stats
      const attackerMatch = unitsContent.match(new RegExp(`${attackerUri} a game:Unit;[\\s\\S]*?game:name "([^"]+)";[\\s\\S]*?game:attack (\\d+);[\\s\\S]*?game:defense (\\d+);[\\s\\S]*?game:health (\\d+);[\\s\\S]*?game:location "{x: (\\d+), y: (\\d+)}"`));
      if (!attackerMatch) {
        console.error('Could not find attacker unit');
        return;
      }
      
      const attackerName = attackerMatch[1].toLowerCase();
      const attackPower = parseInt(attackerMatch[2]);
      const attackerDefense = parseInt(attackerMatch[3]);
      const attackerHealth = parseInt(attackerMatch[4]);
      const attackerX = parseInt(attackerMatch[5]);
      const attackerY = parseInt(attackerMatch[6]);
      
      // 5. Extract target stats
      let targetName = '';
      let targetDefense = 0;
      let targetHealth = 0;
      let targetX = 0;
      let targetY = 0;
      
      if (targetType === 'Unit') {
        const targetMatch = targetContent.match(new RegExp(`${targetUri} a game:Unit;[\\s\\S]*?game:name "([^"]+)";[\\s\\S]*?game:attack \\d+;[\\s\\S]*?game:defense (\\d+);[\\s\\S]*?game:health (\\d+);[\\s\\S]*?game:location "{x: (\\d+), y: (\\d+)}"`));
        if (!targetMatch) {
          console.error('Could not find target unit');
          return;
        }
        
        targetName = targetMatch[1].toLowerCase();
        targetDefense = parseInt(targetMatch[2]);
        targetHealth = parseInt(targetMatch[3]);
        targetX = parseInt(targetMatch[4]);
        targetY = parseInt(targetMatch[5]);
      } else {
        const targetMatch = targetContent.match(new RegExp(`${targetUri} a game:Building;[\\s\\S]*?game:type "([^"]+)";[\\s\\S]*?game:health (\\d+);[\\s\\S]*?game:location "{x: (\\d+), y: (\\d+)}"`));
        if (!targetMatch) {
          console.error('Could not find target building');
          return;
        }
        
        targetName = targetMatch[1].toLowerCase();
        targetDefense = 0; // Buildings don't have defense stat
        targetHealth = parseInt(targetMatch[2]);
        targetX = parseInt(targetMatch[3]);
        targetY = parseInt(targetMatch[4]);
      }
      
      // 6. Calculate distance between attacker and target
      const distance = Math.sqrt(Math.pow(attackerX - targetX, 2) + Math.pow(attackerY - targetY, 2));
      if (distance > 5) {
        console.error(`Target is out of range (distance: ${distance}). Move closer to attack.`);
        return;
      }
      
      // 7. Check for unit type advantages
      let typeAdvantageMultiplier = 1.0;
      const enableUnitTypeAdvantages = combatSystemContent.match(/game:enableUnitTypeAdvantages "([^"]+)"/)[1] === 'true';
      
      if (enableUnitTypeAdvantages && targetType === 'Unit') {
        const attackerUnitType = unitTypeAdvantages[attackerName];
        
        if (attackerUnitType) {
          if (attackerUnitType.strongAgainst.includes(targetName)) {
            typeAdvantageMultiplier = attackerUnitType.advantageMultiplier;
            console.log(`${attackerName} has advantage against ${targetName} (${typeAdvantageMultiplier}x damage)`);
          } else if (attackerUnitType.weakAgainst.includes(targetName)) {
            typeAdvantageMultiplier = attackerUnitType.disadvantageMultiplier;
            console.log(`${attackerName} has disadvantage against ${targetName} (${typeAdvantageMultiplier}x damage)`);
          }
        }
      }
      
      // 8. Check for formation bonuses
      let formationAttackBonus = 1.0;
      const enableFormationBonuses = combatSystemContent.match(/game:enableFormationBonuses "([^"]+)"/)[1] === 'true';
      
      if (enableFormationBonuses) {
        // Find nearby friendly units
        const nearbyUnitsMatches = unitsContent.matchAll(/game:unit\d+ a game:Unit;[\s\S]*?game:location "{x: (\d+), y: (\d+)}"/g);
        const nearbyUnits = [];
        
        for (const match of nearbyUnitsMatches) {
          const unitX = parseInt(match[1]);
          const unitY = parseInt(match[2]);
          
          // Check if unit is nearby (within 2 cells)
          const unitDistance = Math.sqrt(Math.pow(unitX - attackerX, 2) + Math.pow(unitY - attackerY, 2));
          if (unitDistance <= 2 && unitDistance > 0) { // Exclude self
            nearbyUnits.push({ x: unitX, y: unitY });
          }
        }
        
        // Determine formation type based on unit positions
        let formationType = 'scattered';
        
        if (nearbyUnits.length >= 3) {
          // Check for line formation
          const horizontalCount = nearbyUnits.filter(unit => Math.abs(unit.y - attackerY) <= 1).length;
          const verticalCount = nearbyUnits.filter(unit => Math.abs(unit.x - attackerX) <= 1).length;
          
          if (horizontalCount >= 2 || verticalCount >= 2) {
            formationType = 'line';
          }
          
          // Check for wedge formation
          const diagonalCount = nearbyUnits.filter(unit => 
            Math.abs(unit.x - attackerX) === Math.abs(unit.y - attackerY)
          ).length;
          
          if (diagonalCount >= 2) {
            formationType = 'wedge';
          }
          
          // Check for square formation
          if (nearbyUnits.length >= 3) {
            const squareCount = nearbyUnits.filter(unit => 
              Math.abs(unit.x - attackerX) <= 1 && Math.abs(unit.y - attackerY) <= 1
            ).length;
            
            if (squareCount >= 3) {
              formationType = 'square';
            }
          }
        }
        
        formationAttackBonus = formationTypes[formationType].attackBonus;
        console.log(`Units in ${formationType} formation (${formationAttackBonus}x attack bonus)`);
      }
      
      // 9. Check for terrain effects
      let terrainCombatModifier = 1.0;
      try {
        const terrainContent = await fs.readFile(terrainPath, 'utf8');
        
        // Find terrain at target location
        const terrainMatch = terrainContent.match(new RegExp(`game:terrain_${targetX}_${targetY} a game:TerrainCell;[\\s\\S]*?game:terrainType game:(\\w+Terrain)`));
        
        if (terrainMatch) {
          const terrainType = terrainMatch[1];
          
          // Get terrain combat modifier
          const terrainModifierMatch = terrainContent.match(new RegExp(`game:${terrainType} a game:Terrain;[\\s\\S]*?game:combatModifier "([^"]+)"`));
          
          if (terrainModifierMatch) {
            terrainCombatModifier = parseFloat(terrainModifierMatch[1]);
            console.log(`Terrain combat modifier: ${terrainCombatModifier}`);
          }
        }
      } catch (error) {
        console.log('No terrain data found, using default combat modifier');
      }
      
      // 10. Check for weather effects
      let weatherCombatModifier = 1.0;
      try {
        const weatherContent = await fs.readFile(weatherPath, 'utf8');
        
        // Get current weather
        const weatherMatch = weatherContent.match(/game:currentWeather "([^"]+)"/);
        
        if (weatherMatch) {
          const currentWeather = weatherMatch[1];
          
          // Get weather combat modifier
          const weatherModifierMatch = weatherContent.match(new RegExp(`game:${currentWeather}Weather a game:Weather;[\\s\\S]*?game:combatModifier "([^"]+)"`));
          
          if (weatherModifierMatch) {
            weatherCombatModifier = parseFloat(weatherModifierMatch[1]);
            console.log(`Weather combat modifier: ${weatherCombatModifier}`);
          }
        }
      } catch (error) {
        console.log('No weather data found, using default combat modifier');
      }
      
      // 11. Calculate final damage
      const baseRoll = 0.8 + Math.random() * 0.4; // Random factor between 0.8 and 1.2
      const damage = Math.floor(
        attackPower * baseRoll * 
        typeAdvantageMultiplier * 
        formationAttackBonus * 
        terrainCombatModifier * 
        weatherCombatModifier
      );
      
      // Apply defense reduction
      const damageReduction = targetDefense / (targetDefense + 50); // Diminishing returns formula
      const finalDamage = Math.max(1, Math.floor(damage * (1 - damageReduction)));
      
      const newHealth = Math.max(0, targetHealth - finalDamage);
      
      // 12. Update target health
      let updatedTargetContent;
      if (newHealth > 0) {
        updatedTargetContent = targetContent.replace(
          new RegExp(`(${targetUri} a game:${targetType};[\\s\\S]*?game:health )\\d+`),
          `$1${newHealth}`
        );
      } else {
        // If health is 0, remove the target
        updatedTargetContent = targetContent.replace(
          new RegExp(`${targetUri} a game:${targetType};[\\s\\S]*?game:location "{x: \\d+, y: \\d+}".`),
          ''
        );
      }
      
      await fs.writeFile(targetPath, updatedTargetContent);
      
      // 13. Add entry to combat log
      try {
        let combatLogContent = await fs.readFile(combatLogPath, 'utf8');
        
        // Get last combat ID
        const lastCombatIdMatch = combatLogContent.match(/game:lastCombatId (\d+)/);
        const lastCombatId = parseInt(lastCombatIdMatch[1]);
        const newCombatId = lastCombatId + 1;
        
        // Add new combat entry
        const combatEntry = `
game:combat${newCombatId} a game:CombatEvent;
  game:attacker ${attackerUri};
  game:target ${targetUri};
  game:damage ${finalDamage};
  game:typeAdvantageMultiplier ${typeAdvantageMultiplier};
  game:formationBonus ${formationAttackBonus};
  game:terrainModifier ${terrainCombatModifier};
  game:weatherModifier ${weatherCombatModifier};
  game:timestamp "${new Date().toISOString()}".`;
        
        // Update combat log
        const updatedCombatLogContent = combatLogContent
          .replace(/game:lastCombatId \d+/, `game:lastCombatId ${newCombatId}`)
          .replace(/game:entries "([^"]*)"/, (match, entries) => {
            const newEntries = entries ? `${entries},combat${newCombatId}` : `combat${newCombatId}`;
            return `game:entries "${newEntries}"`;
          });
        
        await fs.writeFile(combatLogPath, updatedCombatLogContent + combatEntry);
        await exec('git add combat_log.ttl', { cwd: gameRepoDir });
      } catch (error) {
        console.error(`Error updating combat log: ${error.message}`);
      }
      
      // 14. Award experience to attacker if target is defeated
      if (newHealth <= 0 && targetType === 'Unit') {
        const experienceGain = 50; // Base experience for defeating a unit
        
        // Check if unit has experience attribute
        const experienceMatch = unitsContent.match(new RegExp(`${attackerUri} a game:Unit;[\\s\\S]*?game:experience (\\d+)`));
        
        if (experienceMatch) {
          // Update experience
          const currentExperience = parseInt(experienceMatch[1]);
          const newExperience = currentExperience + experienceGain;
          
          const updatedUnitsContent = unitsContent.replace(
            new RegExp(`(${attackerUri} a game:Unit;[\\s\\S]*?game:experience )\\d+`),
            `$1${newExperience}`
          );
          
          await fs.writeFile(unitsPath, updatedUnitsContent);
          console.log(`${attackerUri} gained ${experienceGain} experience (total: ${newExperience})`);
          
          // Check for level up
          for (const [levelName, level] of Object.entries(experienceLevels)) {
            if (newExperience >= level.minXP && currentExperience < level.minXP) {
              console.log(`${attackerUri} reached ${levelName} level!`);
              break;
            }
          }
        } else {
          // Add experience attribute
          const updatedUnitsContent = unitsContent.replace(
            new RegExp(`(${attackerUri} a game:Unit;[\\s\\S]*?game:location "{x: \\d+, y: \\d+}")`),
            `$1;\n game:experience ${experienceGain}`
          );
          
          await fs.writeFile(unitsPath, updatedUnitsContent);
          console.log(`${attackerUri} gained ${experienceGain} experience`);
        }
        
        await exec('git add units.ttl', { cwd: gameRepoDir });
      }
      
      // 15. Commit the changes to Git
      await exec(`git add ${targetPath.split('/').pop()}`, { cwd: gameRepoDir });
      if (newHealth > 0) {
        await exec(`git commit -m "Attack ${targetUri}: ${finalDamage} damage, ${newHealth} health remaining"`, { cwd: gameRepoDir });
        console.log(`Attack successful! Dealt ${finalDamage} damage. ${targetUri} has ${newHealth} health remaining.`);
      } else {
        await exec(`git commit -m "Attack ${targetUri}: ${finalDamage} damage, destroyed"`, { cwd: gameRepoDir });
        console.log(`Attack successful! Dealt ${finalDamage} damage. ${targetUri} has been destroyed!`);
      }
    } catch (error) {
      console.error(`Error in enhanced attack: ${error.message}`);
    }
  });

// Get unit experience and level
program
  .command('get-unit-experience <unitUri>')
  .description('Get experience and level information for a unit')
  .action(async (unitUri) => {
    console.log(`Getting experience for ${unitUri}...`);
    
    const gameRepoDir = 'C:/Users/markj/Desktop/game-repo';
    const unitsPath = `${gameRepoDir}/units.ttl`;
    
    try {
      const unitsContent = await fs.readFile(unitsPath, 'utf8');
      
      // Check if unit has experience attribute
      const experienceMatch = unitsContent.match(new RegExp(`${unitUri} a game:Unit;[\\s\\S]*?game:experience (\\d+)`));
      
      if (experienceMatch) {
        const experience = parseInt(experienceMatch[1]);
        
        // Determine level
        let currentLevel = 'recruit';
        for (const [levelName, level] of Object.entries(experienceLevels)) {
          if (experience >= level.minXP) {
            currentLevel = levelName;
          }
        }
        
        const levelInfo = experienceLevels[currentLevel];
        
        // Get next level
        const levelNames = Object.keys(experienceLevels);
        const currentLevelIndex = levelNames.indexOf(currentLevel);
        let nextLevel = null;
        let xpToNextLevel = null;
        
        if (currentLevelIndex < levelNames.length - 1) {
          nextLevel = levelNames[currentLevelIndex + 1];
          xpToNextLevel = experienceLevels[nextLevel].minXP - experience;
        }
        
        console.log(`Unit ${unitUri} Experience: ${experience} XP`);
        console.log(`Current Level: ${currentLevel}`);
        console.log(`Attack Bonus: ${levelInfo.attackBonus}x`);
        console.log(`Defense Bonus: ${levelInfo.defenseBonus}x`);
        console.log(`Health Bonus: ${levelInfo.healthBonus}x`);
        
        if (nextLevel) {
          console.log(`Next Level: ${nextLevel} (${xpToNextLevel} XP needed)`);
        } else {
          console.log('Maximum level reached');
        }
      } else {
        console.log(`Unit ${unitUri} has no experience yet.`);
      }
    } catch (error) {
      console.error(`Error getting unit experience: ${error.message}`);
    }
  });

// View combat log
program
  .command('view-combat-log')
  .description('View the combat log')
  .action(async () => {
    console.log('Viewing combat log...');
    
    const gameRepoDir = 'C:/Users/markj/Desktop/game-repo';
    const combatLogPath = `${gameRepoDir}/combat_log.ttl`;
    
    try {
      const combatLogContent = await fs.readFile(combatLogPath, 'utf8');
      
      // Extract combat entries
      const entriesMatch = combatLogContent.match(/game:entries "([^"]*)"/);
      if (!entriesMatch || !entriesMatch[1]) {
        console.log('No combat events recorded yet.');
        return;
      }
      
      const entryIds = entriesMatch[1].split(',');
      
      console.log(`Combat Log (${entryIds.length} entries):`);
      
      for (const entryId of entryIds) {
        const entryMatch = combatLogContent.match(new RegExp(`game:${entryId} a game:CombatEvent;[\\s\\S]*?game:attacker ([^;\\n]+);[\\s\\S]*?game:target ([^;\\n]+);[\\s\\S]*?game:damage (\\d+);[\\s\\S]*?game:timestamp "([^"]+)"`));
        
        if (entryMatch) {
          const attacker = entryMatch[1];
          const target = entryMatch[2];
          const damage = entryMatch[3];
          const timestamp = new Date(entryMatch[4]).toLocaleString();
          
          console.log(`\n[${timestamp}] ${attacker} attacked ${target}`);
          console.log(`Damage: ${damage}`);
        }
      }
    } catch (error) {
      console.error(`Error viewing combat log: ${error.message}`);
    }
  });

// Export functions and program
module.exports = {
  unitTypeAdvantages,
  formationTypes,
  experienceLevels,
  program
};