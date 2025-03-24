const { program } = require('commander');
const fs = require('fs').promises;
const { exec } = require('child_process');
const path = require('path');

// Diplomatic relation types
const relationTypes = {
  'neutral': {
    description: 'Default neutral relationship',
    visibilitySharing: false,
    resourceSharing: false,
    militaryAccess: false,
    tradingBonus: 0.0
  },
  'friendly': {
    description: 'Friendly relationship with basic cooperation',
    visibilitySharing: false,
    resourceSharing: false,
    militaryAccess: true,
    tradingBonus: 0.1 // 10% trading bonus
  },
  'alliance': {
    description: 'Full alliance with shared interests',
    visibilitySharing: true,
    resourceSharing: false,
    militaryAccess: true,
    tradingBonus: 0.2 // 20% trading bonus
  },
  'federation': {
    description: 'Deep federation with shared resources',
    visibilitySharing: true,
    resourceSharing: true,
    militaryAccess: true,
    tradingBonus: 0.3 // 30% trading bonus
  },
  'hostile': {
    description: 'Hostile relationship with potential for conflict',
    visibilitySharing: false,
    resourceSharing: false,
    militaryAccess: false,
    tradingBonus: -0.2 // 20% trading penalty
  },
  'war': {
    description: 'Active state of war',
    visibilitySharing: false,
    resourceSharing: false,
    militaryAccess: false,
    tradingBonus: -1.0 // No trading allowed
  }
};

// Diplomatic action types
const diplomaticActions = {
  'propose_alliance': {
    description: 'Propose an alliance with another player',
    requiredRelation: 'friendly',
    resultRelation: 'alliance',
    cooldown: 10, // turns
    cost: { gold: 100, wood: 0, stone: 0, food: 0 }
  },
  'declare_war': {
    description: 'Declare war on another player',
    requiredRelation: 'any',
    resultRelation: 'war',
    cooldown: 20, // turns
    cost: { gold: 200, wood: 0, stone: 0, food: 0 }
  },
  'propose_peace': {
    description: 'Propose peace with a player you are at war with',
    requiredRelation: 'war',
    resultRelation: 'neutral',
    cooldown: 5, // turns
    cost: { gold: 300, wood: 0, stone: 0, food: 0 }
  },
  'form_federation': {
    description: 'Form a federation with an allied player',
    requiredRelation: 'alliance',
    resultRelation: 'federation',
    cooldown: 15, // turns
    cost: { gold: 500, wood: 200, stone: 200, food: 200 }
  },
  'improve_relations': {
    description: 'Improve relations with another player',
    requiredRelation: 'any',
    resultRelation: 'better',
    cooldown: 3, // turns
    cost: { gold: 50, wood: 0, stone: 0, food: 0 }
  }
};

// Initialize diplomacy system
program
  .command('init-diplomacy')
  .description('Initialize the diplomacy system')
  .action(async () => {
    console.log('Initializing diplomacy system...');
    
    const gameRepoDir = 'C:/Users/markj/Desktop/game-repo';
    const diplomacyPath = `${gameRepoDir}/diplomacy.ttl`;
    const treatiesPath = `${gameRepoDir}/treaties.ttl`;
    
    try {
      // Create diplomacy.ttl
      const diplomacyContent = `@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>.
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>.
@prefix xsd: <http://www.w3.org/2001/XMLSchema#>.
@prefix game: <http://example.org/game#>.

# Diplomacy system
game:diplomacySystem a game:DiplomacySystem;
  game:version "1.0";
  game:treatyCount 0;
  game:lastDiplomacyUpdate "${new Date().toISOString()}".

# Relation types
game:neutralRelation a game:RelationType;
  game:name "neutral";
  game:description "Default neutral relationship";
  game:visibilitySharing "false"^^xsd:boolean;
  game:resourceSharing "false"^^xsd:boolean;
  game:militaryAccess "false"^^xsd:boolean;
  game:tradingBonus "0.0"^^xsd:float.

game:friendlyRelation a game:RelationType;
  game:name "friendly";
  game:description "Friendly relationship with basic cooperation";
  game:visibilitySharing "false"^^xsd:boolean;
  game:resourceSharing "false"^^xsd:boolean;
  game:militaryAccess "true"^^xsd:boolean;
  game:tradingBonus "0.1"^^xsd:float.

game:allianceRelation a game:RelationType;
  game:name "alliance";
  game:description "Full alliance with shared interests";
  game:visibilitySharing "true"^^xsd:boolean;
  game:resourceSharing "false"^^xsd:boolean;
  game:militaryAccess "true"^^xsd:boolean;
  game:tradingBonus "0.2"^^xsd:float.

game:federationRelation a game:RelationType;
  game:name "federation";
  game:description "Deep federation with shared resources";
  game:visibilitySharing "true"^^xsd:boolean;
  game:resourceSharing "true"^^xsd:boolean;
  game:militaryAccess "true"^^xsd:boolean;
  game:tradingBonus "0.3"^^xsd:float.

game:hostileRelation a game:RelationType;
  game:name "hostile";
  game:description "Hostile relationship with potential for conflict";
  game:visibilitySharing "false"^^xsd:boolean;
  game:resourceSharing "false"^^xsd:boolean;
  game:militaryAccess "false"^^xsd:boolean;
  game:tradingBonus "-0.2"^^xsd:float.

game:warRelation a game:RelationType;
  game:name "war";
  game:description "Active state of war";
  game:visibilitySharing "false"^^xsd:boolean;
  game:resourceSharing "false"^^xsd:boolean;
  game:militaryAccess "false"^^xsd:boolean;
  game:tradingBonus "-1.0"^^xsd:float.

# Player relations
game:player1_player2_relation a game:PlayerRelation;
  game:player1 game:player1;
  game:player2 game:player2;
  game:relationType "neutral";
  game:relationSince "${new Date().toISOString()}".`;
      
      // Create treaties.ttl
      const treatiesContent = `@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>.
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>.
@prefix xsd: <http://www.w3.org/2001/XMLSchema#>.
@prefix game: <http://example.org/game#>.

# Treaties
game:treatyRegistry a game:TreatyRegistry;
  game:activeTreaties "";
  game:historicalTreaties "";
  game:pendingTreaties "".`;
      
      await fs.writeFile(diplomacyPath, diplomacyContent);
      await fs.writeFile(treatiesPath, treatiesContent);
      
      // Commit changes
      await exec('git add diplomacy.ttl treaties.ttl', { cwd: gameRepoDir });
      await exec('git commit -m "Initialize diplomacy system"', { cwd: gameRepoDir });
      
      console.log('Diplomacy system initialized successfully!');
    } catch (error) {
      console.error(`Error initializing diplomacy system: ${error.message}`);
    }
  });

// Propose a diplomatic action
program
  .command('propose-diplomatic-action <actionType> <targetPlayer>')
  .description('Propose a diplomatic action to another player')
  .action(async (actionType, targetPlayer) => {
    console.log(`Proposing ${actionType} to ${targetPlayer}...`);
    
    const gameRepoDir = 'C:/Users/markj/Desktop/game-repo';
    const diplomacyPath = `${gameRepoDir}/diplomacy.ttl`;
    const treatiesPath = `${gameRepoDir}/treaties.ttl`;
    const playerResourcesPath = `${gameRepoDir}/player_resources.ttl`;
    
    try {
      // Check if action type exists
      if (!diplomaticActions[actionType]) {
        console.error(`Invalid diplomatic action: ${actionType}`);
        console.log('Available diplomatic actions:');
        Object.entries(diplomaticActions).forEach(([type, info]) => {
          console.log(`- ${type}: ${info.description}`);
        });
        return;
      }
      
      // Read diplomacy.ttl
      const diplomacyContent = await fs.readFile(diplomacyPath, 'utf8');
      
      // Check current relation
      const relationMatch = diplomacyContent.match(new RegExp(`game:player1_${targetPlayer.replace('game:', '')}_relation a game:PlayerRelation;[\\s\\S]*?game:relationType "([^"]+)"`));
      
      if (!relationMatch) {
        console.error(`No diplomatic relation found with ${targetPlayer}`);
        return;
      }
      
      const currentRelation = relationMatch[1];
      const action = diplomaticActions[actionType];
      
      // Check if the action is valid for the current relation
      if (action.requiredRelation !== 'any' && action.requiredRelation !== currentRelation) {
        console.error(`Cannot propose ${actionType} with current relation: ${currentRelation}`);
        console.log(`Required relation: ${action.requiredRelation}`);
        return;
      }
      
      // Check if player has enough resources
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
      
      const cost = action.cost;
      
      if (playerGold < cost.gold || playerWood < cost.wood || 
          playerStone < cost.stone || playerFood < cost.food) {
        console.error(`Not enough resources to propose ${actionType}`);
        console.log(`Required: Gold: ${cost.gold}, Wood: ${cost.wood}, Stone: ${cost.stone}, Food: ${cost.food}`);
        console.log(`Available: Gold: ${playerGold}, Wood: ${playerWood}, Stone: ${playerStone}, Food: ${playerFood}`);
        return;
      }
      
      // Read treaties.ttl
      const treatiesContent = await fs.readFile(treatiesPath, 'utf8');
      
      // Get treaty count
      const treatyCountMatch = diplomacyContent.match(/game:treatyCount (\d+)/);
      if (!treatyCountMatch) {
        console.error('Could not find treaty count in diplomacy.ttl');
        return;
      }
      
      const treatyCount = parseInt(treatyCountMatch[1]);
      const newTreatyCount = treatyCount + 1;
      const treatyId = `game:treaty${newTreatyCount}`;
      
      // Create new treaty
      const newTreaty = `
${treatyId} a game:Treaty;
  game:treatyType "${actionType}";
  game:proposer game:player1;
  game:target ${targetPlayer};
  game:currentRelation "${currentRelation}";
  game:proposedRelation "${action.resultRelation === 'better' ? getNextRelation(currentRelation) : action.resultRelation}";
  game:status "pending";
  game:proposedAt "${new Date().toISOString()}";
  game:expiresAt "${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()}".`;
      
      // Update treaties.ttl
      const updatedTreatiesContent = treatiesContent.replace(
        /game:pendingTreaties "([^"]*)"/,
        (match, treaties) => {
          const treatiesList = treaties ? `${treaties},${treatyId.replace('game:', '')}` : treatyId.replace('game:', '');
          return `game:pendingTreaties "${treatiesList}"`;
        }
      );
      
      await fs.writeFile(treatiesPath, updatedTreatiesContent + newTreaty);
      
      // Update diplomacy.ttl
      const updatedDiplomacyContent = diplomacyContent
        .replace(/game:treatyCount \d+/, `game:treatyCount ${newTreatyCount}`)
        .replace(/game:lastDiplomacyUpdate "[^"]+"/, `game:lastDiplomacyUpdate "${new Date().toISOString()}"`);
      
      await fs.writeFile(diplomacyPath, updatedDiplomacyContent);
      
      // Update player resources
      const updatedPlayerResourcesContent = playerResourcesContent
        .replace(/game:gold \d+/, `game:gold ${playerGold - cost.gold}`)
        .replace(/game:wood \d+/, `game:wood ${playerWood - cost.wood}`)
        .replace(/game:stone \d+/, `game:stone ${playerStone - cost.stone}`)
        .replace(/game:food \d+/, `game:food ${playerFood - cost.food}`);
      
      await fs.writeFile(playerResourcesPath, updatedPlayerResourcesContent);
      
      // Commit changes
      await exec('git add diplomacy.ttl treaties.ttl player_resources.ttl', { cwd: gameRepoDir });
      await exec(`git commit -m "Propose ${actionType} to ${targetPlayer}"`, { cwd: gameRepoDir });
      
      console.log(`Successfully proposed ${actionType} to ${targetPlayer}!`);
      console.log(`Treaty ID: ${treatyId}`);
    } catch (error) {
      console.error(`Error proposing diplomatic action: ${error.message}`);
    }
  });

// Accept a treaty
program
  .command('accept-treaty <treatyId>')
  .description('Accept a pending treaty')
  .action(async (treatyId) => {
    console.log(`Accepting treaty ${treatyId}...`);
    
    const gameRepoDir = 'C:/Users/markj/Desktop/game-repo';
    const diplomacyPath = `${gameRepoDir}/diplomacy.ttl`;
    const treatiesPath = `${gameRepoDir}/treaties.ttl`;
    
    try {
      // Read treaties.ttl
      const treatiesContent = await fs.readFile(treatiesPath, 'utf8');
      
      // Check if treaty exists
      const treatyMatch = treatiesContent.match(new RegExp(`${treatyId} a game:Treaty;[\\s\\S]*?game:treatyType "([^"]+)";[\\s\\S]*?game:proposer ([^;\\n]+);[\\s\\S]*?game:target ([^;\\n]+);[\\s\\S]*?game:currentRelation "([^"]+)";[\\s\\S]*?game:proposedRelation "([^"]+)";[\\s\\S]*?game:status "([^"]+)"`));
      
      if (!treatyMatch) {
        console.error(`Treaty ${treatyId} not found`);
        return;
      }
      
      const treatyType = treatyMatch[1];
      const proposer = treatyMatch[2];
      const target = treatyMatch[3];
      const currentRelation = treatyMatch[4];
      const proposedRelation = treatyMatch[5];
      const status = treatyMatch[6];
      
      if (status !== 'pending') {
        console.error(`Treaty ${treatyId} is not pending (status: ${status})`);
        return;
      }
      
      if (target !== 'game:player1') {
        console.error('You can only accept treaties proposed to you');
        return;
      }
      
      // Read diplomacy.ttl
      const diplomacyContent = await fs.readFile(diplomacyPath, 'utf8');
      
      // Update relation
      const proposerPlayer = proposer.replace('game:', '');
      const updatedDiplomacyContent = diplomacyContent.replace(
        new RegExp(`(game:player1_${proposerPlayer}_relation a game:PlayerRelation;[\\s\\S]*?game:relationType ")[^"]+"`),
        `$1${proposedRelation}"`
      ).replace(
        /game:lastDiplomacyUpdate "[^"]+"/,
        `game:lastDiplomacyUpdate "${new Date().toISOString()}"`
      );
      
      await fs.writeFile(diplomacyPath, updatedDiplomacyContent);
      
      // Update treaty status
      const updatedTreatiesContent = treatiesContent
        .replace(
          new RegExp(`(${treatyId} a game:Treaty;[\\s\\S]*?game:status ")[^"]+"`),
          `$1accepted"`
        )
        .replace(
          /game:pendingTreaties "([^"]*)"/,
          (match, treaties) => {
            const treatiesList = treaties.split(',').filter(t => t !== treatyId.replace('game:', '')).join(',');
            return `game:pendingTreaties "${treatiesList}"`;
          }
        )
        .replace(
          /game:activeTreaties "([^"]*)"/,
          (match, treaties) => {
            const treatiesList = treaties ? `${treaties},${treatyId.replace('game:', '')}` : treatyId.replace('game:', '');
            return `game:activeTreaties "${treatiesList}"`;
          }
        );
      
      await fs.writeFile(treatiesPath, updatedTreatiesContent);
      
      // Commit changes
      await exec('git add diplomacy.ttl treaties.ttl', { cwd: gameRepoDir });
      await exec(`git commit -m "Accept treaty ${treatyId}"`, { cwd: gameRepoDir });
      
      console.log(`Successfully accepted treaty ${treatyId}!`);
      console.log(`Relation with ${proposer} changed from ${currentRelation} to ${proposedRelation}`);
      
      // Apply relation effects
      const relationEffects = relationTypes[proposedRelation];
      console.log('\nNew relation effects:');
      console.log(`Visibility Sharing: ${relationEffects.visibilitySharing ? 'Yes' : 'No'}`);
      console.log(`Resource Sharing: ${relationEffects.resourceSharing ? 'Yes' : 'No'}`);
      console.log(`Military Access: ${relationEffects.militaryAccess ? 'Yes' : 'No'}`);
      console.log(`Trading Bonus: ${relationEffects.tradingBonus >= 0 ? '+' : ''}${relationEffects.tradingBonus * 100}%`);
    } catch (error) {
      console.error(`Error accepting treaty: ${error.message}`);
    }
  });

// List diplomatic relations
program
  .command('list-relations')
  .description('List all diplomatic relations')
  .action(async () => {
    console.log('Listing diplomatic relations...');
    
    const gameRepoDir = 'C:/Users/markj/Desktop/game-repo';
    const diplomacyPath = `${gameRepoDir}/diplomacy.ttl`;
    
    try {
      // Read diplomacy.ttl
      const diplomacyContent = await fs.readFile(diplomacyPath, 'utf8');
      
      // Find all relations
      const relationMatches = diplomacyContent.matchAll(/game:player1_(\w+)_relation a game:PlayerRelation;[\s\S]*?game:relationType "([^"]+)";[\s\S]*?game:relationSince "([^"]+)"/g);
      
      let relationsFound = false;
      
      console.log('Diplomatic Relations:');
      
      for (const match of relationMatches) {
        relationsFound = true;
        const otherPlayer = match[1];
        const relationType = match[2];
        const since = new Date(match[3]).toLocaleDateString();
        
        const relationInfo = relationTypes[relationType];
        
        console.log(`\nRelation with game:${otherPlayer}:`);
        console.log(`Type: ${relationType}`);
        console.log(`Since: ${since}`);
        console.log(`Description: ${relationInfo.description}`);
        console.log(`Visibility Sharing: ${relationInfo.visibilitySharing ? 'Yes' : 'No'}`);
        console.log(`Resource Sharing: ${relationInfo.resourceSharing ? 'Yes' : 'No'}`);
        console.log(`Military Access: ${relationInfo.militaryAccess ? 'Yes' : 'No'}`);
        console.log(`Trading Bonus: ${relationInfo.tradingBonus >= 0 ? '+' : ''}${relationInfo.tradingBonus * 100}%`);
      }
      
      if (!relationsFound) {
        console.log('No diplomatic relations found.');
      }
    } catch (error) {
      console.error(`Error listing relations: ${error.message}`);
    }
  });

// List pending treaties
program
  .command('list-pending-treaties')
  .description('List all pending treaties')
  .action(async () => {
    console.log('Listing pending treaties...');
    
    const gameRepoDir = 'C:/Users/markj/Desktop/game-repo';
    const treatiesPath = `${gameRepoDir}/treaties.ttl`;
    
    try {
      // Read treaties.ttl
      const treatiesContent = await fs.readFile(treatiesPath, 'utf8');
      
      // Extract pending treaties
      const pendingTreatiesMatch = treatiesContent.match(/game:pendingTreaties "([^"]*)"/);
      if (!pendingTreatiesMatch || !pendingTreatiesMatch[1]) {
        console.log('No pending treaties found.');
        return;
      }
      
      const pendingTreatyIds = pendingTreatiesMatch[1].split(',').filter(id => id.length > 0);
      
      if (pendingTreatyIds.length === 0) {
        console.log('No pending treaties found.');
        return;
      }
      
      console.log(`Found ${pendingTreatyIds.length} pending treaties:`);
      
      for (const treatyId of pendingTreatyIds) {
        const treatyMatch = treatiesContent.match(new RegExp(`game:${treatyId} a game:Treaty;[\\s\\S]*?game:treatyType "([^"]+)";[\\s\\S]*?game:proposer ([^;\\n]+);[\\s\\S]*?game:target ([^;\\n]+);[\\s\\S]*?game:currentRelation "([^"]+)";[\\s\\S]*?game:proposedRelation "([^"]+)";[\\s\\S]*?game:proposedAt "([^"]+)";[\\s\\S]*?game:expiresAt "([^"]+)"`));
        
        if (treatyMatch) {
          const treatyType = treatyMatch[1];
          const proposer = treatyMatch[2];
          const target = treatyMatch[3];
          const currentRelation = treatyMatch[4];
          const proposedRelation = treatyMatch[5];
          const proposedAt = new Date(treatyMatch[6]).toLocaleString();
          const expiresAt = new Date(treatyMatch[7]).toLocaleString();
          
          console.log(`\n[${treatyId}] ${treatyType.toUpperCase()}`);
          console.log(`Proposer: ${proposer}`);
          console.log(`Target: ${target}`);
          console.log(`Current Relation: ${currentRelation}`);
          console.log(`Proposed Relation: ${proposedRelation}`);
          console.log(`Proposed At: ${proposedAt}`);
          console.log(`Expires At: ${expiresAt}`);
          
          const action = diplomaticActions[treatyType];
          if (action) {
            console.log(`Description: ${action.description}`);
          }
        }
      }
    } catch (error) {
      console.error(`Error listing pending treaties: ${error.message}`);
    }
  });

// Helper function to get the next better relation
function getNextRelation(currentRelation) {
  const relationOrder = ['hostile', 'neutral', 'friendly', 'alliance', 'federation'];
  const currentIndex = relationOrder.indexOf(currentRelation);
  
  if (currentIndex === -1 || currentIndex === relationOrder.length - 1) {
    return currentRelation;
  }
  
  return relationOrder[currentIndex + 1];
}

// Export functions and program
module.exports = {
  relationTypes,
  diplomaticActions,
  program
};