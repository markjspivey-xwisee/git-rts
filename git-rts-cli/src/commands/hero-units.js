const { program } = require('commander');
const fs = require('fs').promises;
const { exec } = require('child_process');
const path = require('path');

// Define hero unit types and their abilities
const heroTypes = {
  'Commander': {
    baseStats: {
      attack: 25,
      defense: 15,
      health: 200,
      visibilityRange: 6
    },
    abilities: {
      'inspire': {
        description: 'Increases attack of nearby friendly units by 20% for 5 turns',
        cooldown: 5,
        range: 3,
        effect: 'buff',
        target: 'friendly',
        stats: { attack: 1.2 }
      },
      'rally': {
        description: 'Increases movement speed of nearby friendly units by 30% for 3 turns',
        cooldown: 4,
        range: 4,
        effect: 'buff',
        target: 'friendly',
        stats: { movement: 1.3 }
      },
      'charge': {
        description: 'Deal 150% damage to a single enemy unit',
        cooldown: 3,
        range: 2,
        effect: 'attack',
        target: 'enemy',
        stats: { damage: 1.5 }
      }
    }
  },
  'Scout': {
    baseStats: {
      attack: 15,
      defense: 8,
      health: 120,
      visibilityRange: 10
    },
    abilities: {
      'reveal': {
        description: 'Reveals all units and buildings within a large radius',
        cooldown: 5,
        range: 8,
        effect: 'reveal',
        target: 'area'
      },
      'stealth': {
        description: 'Becomes invisible to enemy units for 3 turns',
        cooldown: 6,
        range: 0,
        effect: 'stealth',
        target: 'self'
      }
    }
  }
};

// Equipment types and their effects
const equipmentTypes = {
  'sword': {
    description: 'Increases attack',
    stats: { attack: 5 }
  },
  'shield': {
    description: 'Increases defense',
    stats: { defense: 5 }
  },
  'armor': {
    description: 'Increases health',
    stats: { health: 50 }
  }
};

// Create a new hero unit
program
  .command('create-hero <heroType> <x> <y>')
  .description('Create a new hero unit')
  .action(async (heroType, x, y) => {
    console.log(`Creating ${heroType} hero at (${x}, ${y})...`);
    
    const gameRepoDir = 'C:/Users/markj/Desktop/game-repo';
    const unitsPath = `${gameRepoDir}/units.ttl`;
    const heroesPath = `${gameRepoDir}/heroes.ttl`;
    const playerUnitsPath = `${gameRepoDir}/player_units.ttl`;
    const playerResourcesPath = `${gameRepoDir}/player_resources.ttl`;
    
    try {
      // Check if hero type exists
      if (!heroTypes[heroType]) {
        console.error(`Invalid hero type: ${heroType}`);
        console.log('Available hero types:');
        Object.keys(heroTypes).forEach(type => {
          console.log(`- ${type}`);
        });
        return;
      }
      
      // Check if player has enough resources
      const playerResourcesContent = await fs.readFile(playerResourcesPath, 'utf8');
      
      const goldMatch = playerResourcesContent.match(/game:gold (\d+)/);
      if (!goldMatch) {
        console.error('Could not find player gold');
        return;
      }
      
      const playerGold = parseInt(goldMatch[1]);
      const heroCost = 500; // Heroes are expensive!
      
      if (playerGold < heroCost) {
        console.error(`Not enough gold to create a hero. Required: ${heroCost}, Available: ${playerGold}`);
        return;
      }
      
      // Create heroes.ttl if it doesn't exist
      let heroesContent;
      try {
        heroesContent = await fs.readFile(heroesPath, 'utf8');
      } catch (error) {
        // Create initial heroes file
        heroesContent = `@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>.
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>.
@prefix xsd: <http://www.w3.org/2001/XMLSchema#>.
@prefix game: <http://example.org/game#>.

`;
      }
      
      // Get unit count for unique ID
      const unitsContent = await fs.readFile(unitsPath, 'utf8');
      const unitCount = (unitsContent.match(/game:unit\d+/g) || []).length;
      const heroCount = (heroesContent.match(/game:hero\d+/g) || []).length;
      
      const heroId = `game:hero${heroCount + 1}`;
      const unitId = `game:unit${unitCount + 1}`;
      
      // Create hero unit in units.ttl
      const heroStats = heroTypes[heroType].baseStats;
      const newUnit = `
${unitId} a game:Unit;
 game:name "${heroType}";
 game:attack ${heroStats.attack};
 game:defense ${heroStats.defense};
 game:health ${heroStats.health};
 game:location "{x: ${x}, y: ${y}}".`;
      
      // Create hero entry in heroes.ttl
      const abilities = Object.keys(heroTypes[heroType].abilities).join(',');
      const newHero = `
${heroId} a game:HeroUnit;
 game:unitRef ${unitId};
 game:heroType "${heroType}";
 game:abilities "${abilities}";
 game:equipment "";
 game:experience 0;
 game:level 1;
 game:abilityCooldowns "".`;
      
      // Update files
      const updatedUnitsContent = unitsContent + newUnit;
      const updatedHeroesContent = heroesContent + newHero;
      
      await fs.writeFile(unitsPath, updatedUnitsContent);
      await fs.writeFile(heroesPath, updatedHeroesContent);
      
      // Add unit to player's units
      const playerUnitsContent = await fs.readFile(playerUnitsPath, 'utf8');
      const updatedPlayerUnitsContent = playerUnitsContent.replace(
        /game:player1 a game:Player;([^.]*)\./,
        `game:player1 a game:Player;$1;\n game:units ${unitId}.`
      );
      
      await fs.writeFile(playerUnitsPath, updatedPlayerUnitsContent);
      
      // Deduct resources
      const updatedPlayerResourcesContent = playerResourcesContent.replace(
        /game:gold \d+/,
        `game:gold ${playerGold - heroCost}`
      );
      
      await fs.writeFile(playerResourcesPath, updatedPlayerResourcesContent);
      
      // Commit changes
      await exec('git add units.ttl heroes.ttl player_units.ttl player_resources.ttl', { cwd: gameRepoDir });
      await exec(`git commit -m "Create ${heroType} hero (${heroId})"`, { cwd: gameRepoDir });
      
      console.log(`Successfully created ${heroType} hero (${heroId})!`);
      console.log(`Available abilities: ${abilities}`);
    } catch (error) {
      console.error(`Error creating hero: ${error.message}`);
    }
  });

// List heroes
program
  .command('list-heroes')
  .description('List all heroes')
  .action(async () => {
    console.log('Listing all heroes...');
    
    const gameRepoDir = 'C:/Users/markj/Desktop/game-repo';
    const heroesPath = `${gameRepoDir}/heroes.ttl`;
    
    try {
      // Load heroes data
      let heroesContent;
      try {
        heroesContent = await fs.readFile(heroesPath, 'utf8');
      } catch (error) {
        console.log('No heroes found.');
        return;
      }
      
      // Find all heroes
      const heroMatches = heroesContent.matchAll(/game:(hero\d+) a game:HeroUnit;[\s\S]*?game:unitRef ([^;]+);[\s\S]*?game:heroType "([^"]+)";[\s\S]*?game:abilities "([^"]+)";[\s\S]*?game:equipment "([^"]*)";[\s\S]*?game:experience (\d+);[\s\S]*?game:level (\d+)/g);
      
      let heroesFound = false;
      for (const match of heroMatches) {
        heroesFound = true;
        const heroId = match[1];
        const unitId = match[2].replace('game:', '');
        const heroType = match[3];
        const abilities = match[4].split(',');
        const equipment = match[5] ? match[5].split(',') : [];
        const experience = parseInt(match[6]);
        const level = parseInt(match[7]);
        
        console.log(`\nHero: ${heroId}`);
        console.log(`Type: ${heroType}`);
        console.log(`Unit: ${unitId}`);
        console.log(`Level: ${level} (${experience} XP)`);
        console.log(`Abilities: ${abilities.join(', ')}`);
        console.log(`Equipment: ${equipment.length > 0 ? equipment.join(', ') : 'None'}`);
        
        // Get unit stats
        const unitsPath = `${gameRepoDir}/units.ttl`;
        const unitsContent = await fs.readFile(unitsPath, 'utf8');
        
        const unitMatch = unitsContent.match(new RegExp(`game:${unitId} a game:Unit;[\\s\\S]*?game:attack (\\d+);[\\s\\S]*?game:defense (\\d+);[\\s\\S]*?game:health (\\d+);[\\s\\S]*?game:location "{x: (\\d+), y: (\\d+)}"`));
        
        if (unitMatch) {
          const attack = parseInt(unitMatch[1]);
          const defense = parseInt(unitMatch[2]);
          const health = parseInt(unitMatch[3]);
          const x = parseInt(unitMatch[4]);
          const y = parseInt(unitMatch[5]);
          
          console.log(`Stats: ATK ${attack}, DEF ${defense}, HP ${health}`);
          console.log(`Position: (${x}, ${y})`);
        }
      }
      
      if (!heroesFound) {
        console.log('No heroes found.');
      }
    } catch (error) {
      console.error(`Error listing heroes: ${error.message}`);
    }
  });

module.exports = program;
