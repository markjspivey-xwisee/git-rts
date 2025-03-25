/**
 * Alliance System for Git-RTS
 * 
 * This module implements an advanced alliance system with:
 * - Alliance creation and management
 * - Shared resources and vision
 * - Alliance objectives and victory conditions
 * - Alliance chat and coordination
 * - Alliance levels and benefits
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const diplomacy = require('./diplomacy');

// Alliance levels and benefits
const ALLIANCE_LEVELS = {
  1: {
    'name': 'Basic Alliance',
    'required_turns': 0,
    'benefits': {
      'shared_vision': true,
      'resource_sharing_percent': 0.1,
      'defense_bonus': 0.1,
    },
  },
  2: {
    'name': 'Strong Alliance',
    'required_turns': 10,
    'benefits': {
      'shared_vision': true,
      'resource_sharing_percent': 0.15,
      'defense_bonus': 0.15,
      'research_bonus': 0.1,
    },
  },
  3: {
    'name': 'Strategic Alliance',
    'required_turns': 25,
    'benefits': {
      'shared_vision': true,
      'resource_sharing_percent': 0.2,
      'defense_bonus': 0.2,
      'research_bonus': 0.15,
      'production_bonus': 0.1,
    },
  },
  4: {
    'name': 'Unbreakable Alliance',
    'required_turns': 50,
    'benefits': {
      'shared_vision': true,
      'resource_sharing_percent': 0.25,
      'defense_bonus': 0.25,
      'research_bonus': 0.2,
      'production_bonus': 0.15,
      'attack_bonus': 0.1,
    },
  },
  5: {
    'name': 'Blood Brotherhood',
    'required_turns': 100,
    'benefits': {
      'shared_vision': true,
      'resource_sharing_percent': 0.3,
      'defense_bonus': 0.3,
      'research_bonus': 0.25,
      'production_bonus': 0.2,
      'attack_bonus': 0.15,
      'shared_technologies': true,
    },
  },
};

// Alliance objective types
const ALLIANCE_OBJECTIVES = {
  'eliminate_player': {
    'name': 'Eliminate Player',
    'description': 'Eliminate a specific player from the game.',
    'reward': {
      'reputation': 20,
      'alliance_experience': 50,
    },
  },
  'control_region': {
    'name': 'Control Region',
    'description': 'Gain control of a specific region on the map.',
    'reward': {
      'reputation': 15,
      'alliance_experience': 40,
    },
  },
  'research_technology': {
    'name': 'Research Technology',
    'description': 'Research a specific technology as an alliance.',
    'reward': {
      'reputation': 10,
      'alliance_experience': 30,
    },
  },
  'build_wonder': {
    'name': 'Build Wonder',
    'description': 'Build a specific wonder as an alliance.',
    'reward': {
      'reputation': 25,
      'alliance_experience': 60,
    },
  },
  'accumulate_resources': {
    'name': 'Accumulate Resources',
    'description': 'Accumulate a specific amount of resources as an alliance.',
    'reward': {
      'reputation': 5,
      'alliance_experience': 20,
    },
  },
};

/**
 * Create a new alliance
 * 
 * @param {string} name - Name of the alliance
 * @param {string} founderPlayer - ID of the founding player
 * @param {Array} initialMembers - Array of initial member player IDs
 * @param {Object} diplomacyState - Current diplomatic state
 * @returns {Object} - New alliance object and updated diplomacy state
 */
function createAlliance(name, founderPlayer, initialMembers, diplomacyState) {
  // Validate initial members
  for (const member of initialMembers) {
    if (member !== founderPlayer) {
      // Check if players are already allied
      if (!diplomacy.arePlayersAllied(founderPlayer, member, diplomacyState)) {
        throw new Error(`Player ${founderPlayer} and ${member} must be allied to form an alliance`);
      }
    }
  }
  
  // Create alliance object
  const alliance = {
    id: generateAllianceId(name),
    name,
    founder: founderPlayer,
    created_turn: diplomacyState.turn,
    level: 1,
    experience: 0,
    members: [...initialMembers],
    resources: {},
    objectives: [],
    messages: [],
    shared_technologies: [],
  };
  
  // Update diplomatic relations to ensure all members are allied
  for (const member1 of alliance.members) {
    for (const member2 of alliance.members) {
      if (member1 !== member2) {
        diplomacyState.relations[member1][member2] = 'allied';
        
        // Ensure alliance agreement exists
        if (!diplomacy.hasAgreement(member1, member2, 'alliance', diplomacyState)) {
          const agreement = {
            type: 'alliance',
            created_turn: diplomacyState.turn,
            expires_turn: diplomacyState.turn + diplomacy.AGREEMENT_TYPES['alliance'].duration,
            alliance_id: alliance.id,
          };
          
          if (!diplomacyState.agreements[member1][member2]) {
            diplomacyState.agreements[member1][member2] = [];
          }
          if (!diplomacyState.agreements[member2][member1]) {
            diplomacyState.agreements[member2][member1] = [];
          }
          
          diplomacyState.agreements[member1][member2].push(agreement);
          diplomacyState.agreements[member2][member1].push(agreement);
        }
      }
    }
  }
  
  // Generate initial objectives
  alliance.objectives = generateAllianceObjectives(alliance, 3);
  
  return {
    alliance,
    diplomacyState,
  };
}

/**
 * Generate a unique alliance ID
 * 
 * @param {string} name - Alliance name
 * @returns {string} - Unique alliance ID
 */
function generateAllianceId(name) {
  const timestamp = Date.now();
  const sanitizedName = name.toLowerCase().replace(/[^a-z0-9]/g, '');
  return `alliance_${sanitizedName}_${timestamp}`;
}

/**
 * Add a player to an alliance
 * 
 * @param {Object} alliance - Alliance object
 * @param {string} playerId - ID of the player to add
 * @param {Object} diplomacyState - Current diplomatic state
 * @returns {Object} - Updated alliance and diplomacy state
 */
function addPlayerToAlliance(alliance, playerId, diplomacyState) {
  // Check if player is already in the alliance
  if (alliance.members.includes(playerId)) {
    throw new Error(`Player ${playerId} is already a member of alliance ${alliance.name}`);
  }
  
  // Check if player is allied with at least one alliance member
  let isAlliedWithMember = false;
  for (const member of alliance.members) {
    if (diplomacy.arePlayersAllied(playerId, member, diplomacyState)) {
      isAlliedWithMember = true;
      break;
    }
  }
  
  if (!isAlliedWithMember) {
    throw new Error(`Player ${playerId} must be allied with at least one alliance member`);
  }
  
  // Add player to alliance
  alliance.members.push(playerId);
  
  // Update diplomatic relations to ensure all members are allied
  for (const member of alliance.members) {
    if (member !== playerId) {
      diplomacyState.relations[playerId][member] = 'allied';
      diplomacyState.relations[member][playerId] = 'allied';
      
      // Ensure alliance agreement exists
      if (!diplomacy.hasAgreement(playerId, member, 'alliance', diplomacyState)) {
        const agreement = {
          type: 'alliance',
          created_turn: diplomacyState.turn,
          expires_turn: diplomacyState.turn + diplomacy.AGREEMENT_TYPES['alliance'].duration,
          alliance_id: alliance.id,
        };
        
        if (!diplomacyState.agreements[playerId][member]) {
          diplomacyState.agreements[playerId][member] = [];
        }
        if (!diplomacyState.agreements[member][playerId]) {
          diplomacyState.agreements[member][playerId] = [];
        }
        
        diplomacyState.agreements[playerId][member].push(agreement);
        diplomacyState.agreements[member][playerId].push(agreement);
      }
    }
  }
  
  // Add alliance join message
  alliance.messages.push({
    turn: diplomacyState.turn,
    type: 'member_joined',
    player: playerId,
    text: `${playerId} has joined the alliance.`,
  });
  
  return {
    alliance,
    diplomacyState,
  };
}

/**
 * Remove a player from an alliance
 * 
 * @param {Object} alliance - Alliance object
 * @param {string} playerId - ID of the player to remove
 * @param {Object} diplomacyState - Current diplomatic state
 * @returns {Object} - Updated alliance and diplomacy state
 */
function removePlayerFromAlliance(alliance, playerId, diplomacyState) {
  // Check if player is in the alliance
  if (!alliance.members.includes(playerId)) {
    throw new Error(`Player ${playerId} is not a member of alliance ${alliance.name}`);
  }
  
  // Check if player is the founder
  if (playerId === alliance.founder && alliance.members.length > 1) {
    // Transfer leadership to the longest-standing member
    const oldestMember = alliance.members.filter(m => m !== playerId)[0];
    alliance.founder = oldestMember;
    
    // Add leadership transfer message
    alliance.messages.push({
      turn: diplomacyState.turn,
      type: 'leadership_transfer',
      player: oldestMember,
      text: `Leadership has been transferred to ${oldestMember}.`,
    });
  }
  
  // Remove player from alliance
  alliance.members = alliance.members.filter(m => m !== playerId);
  
  // Remove alliance agreements with this player
  for (const member of alliance.members) {
    if (member !== playerId) {
      // Find and remove alliance agreements
      if (diplomacyState.agreements[playerId][member]) {
        diplomacyState.agreements[playerId][member] = diplomacyState.agreements[playerId][member].filter(a => 
          a.type !== 'alliance' || a.alliance_id !== alliance.id
        );
      }
      
      if (diplomacyState.agreements[member][playerId]) {
        diplomacyState.agreements[member][playerId] = diplomacyState.agreements[member][playerId].filter(a => 
          a.type !== 'alliance' || a.alliance_id !== alliance.id
        );
      }
    }
  }
  
  // Add alliance leave message
  alliance.messages.push({
    turn: diplomacyState.turn,
    type: 'member_left',
    player: playerId,
    text: `${playerId} has left the alliance.`,
  });
  
  // Check if alliance is empty
  if (alliance.members.length === 0) {
    return {
      alliance: null, // Alliance is dissolved
      diplomacyState,
    };
  }
  
  return {
    alliance,
    diplomacyState,
  };
}

/**
 * Update alliance level based on experience
 * 
 * @param {Object} alliance - Alliance object
 * @returns {Object} - Updated alliance
 */
function updateAllianceLevel(alliance) {
  const allianceAge = alliance.experience;
  let newLevel = 1;
  
  // Determine level based on alliance age
  for (const [level, data] of Object.entries(ALLIANCE_LEVELS)) {
    if (allianceAge >= data.required_turns && parseInt(level) > newLevel) {
      newLevel = parseInt(level);
    }
  }
  
  // Check if level has increased
  if (newLevel > alliance.level) {
    const oldLevel = alliance.level;
    alliance.level = newLevel;
    
    // Add level up message
    alliance.messages.push({
      turn: -1, // Special value for system messages
      type: 'level_up',
      text: `Alliance has advanced from ${ALLIANCE_LEVELS[oldLevel].name} to ${ALLIANCE_LEVELS[newLevel].name}!`,
    });
  }
  
  return alliance;
}

/**
 * Generate alliance objectives
 * 
 * @param {Object} alliance - Alliance object
 * @param {number} count - Number of objectives to generate
 * @returns {Array} - Array of alliance objectives
 */
function generateAllianceObjectives(alliance, count) {
  const objectives = [];
  const objectiveTypes = Object.keys(ALLIANCE_OBJECTIVES);
  
  for (let i = 0; i < count; i++) {
    const type = objectiveTypes[Math.floor(Math.random() * objectiveTypes.length)];
    const objective = {
      id: `objective_${Date.now()}_${i}`,
      type,
      ...ALLIANCE_OBJECTIVES[type],
      progress: 0,
      target: generateObjectiveTarget(type, alliance),
      completed: false,
      assigned_turn: alliance.created_turn,
    };
    
    objectives.push(objective);
  }
  
  return objectives;
}

/**
 * Generate a target for an alliance objective
 * 
 * @param {string} objectiveType - Type of objective
 * @param {Object} alliance - Alliance object
 * @returns {Object} - Objective target
 */
function generateObjectiveTarget(objectiveType, alliance) {
  switch (objectiveType) {
    case 'eliminate_player':
      // Target would be a player not in the alliance
      return { player: 'player3' }; // Placeholder
    
    case 'control_region':
      // Target would be a region on the map
      return { region: 'mountains', x: 50, y: 50, radius: 10 };
    
    case 'research_technology':
      // Target would be a technology
      return { technology: 'advanced_robotics' };
    
    case 'build_wonder':
      // Target would be a wonder
      return { wonder: 'great_pyramid', x: 60, y: 60 };
    
    case 'accumulate_resources':
      // Target would be a resource amount
      return { resource: 'gold', amount: 5000 };
    
    default:
      return {};
  }
}

/**
 * Update alliance objectives progress
 * 
 * @param {Object} alliance - Alliance object
 * @param {string} objectiveId - ID of the objective to update
 * @param {number} progress - Progress to add
 * @returns {Object} - Updated alliance
 */
function updateObjectiveProgress(alliance, objectiveId, progress) {
  const objective = alliance.objectives.find(o => o.id === objectiveId);
  
  if (!objective) {
    throw new Error(`Objective ${objectiveId} not found in alliance ${alliance.name}`);
  }
  
  objective.progress += progress;
  
  // Check if objective is completed
  if (objective.progress >= 100 && !objective.completed) {
    objective.completed = true;
    
    // Add experience and generate new objective
    alliance.experience += objective.reward.alliance_experience;
    
    // Update alliance level
    alliance = updateAllianceLevel(alliance);
    
    // Add objective completion message
    alliance.messages.push({
      turn: -1, // Special value for system messages
      type: 'objective_completed',
      text: `Objective completed: ${objective.name}`,
    });
    
    // Generate a new objective to replace the completed one
    const newObjective = generateAllianceObjectives(alliance, 1)[0];
    alliance.objectives = alliance.objectives.filter(o => o.id !== objectiveId);
    alliance.objectives.push(newObjective);
  }
  
  return alliance;
}

/**
 * Add a message to the alliance chat
 * 
 * @param {Object} alliance - Alliance object
 * @param {string} playerId - ID of the player sending the message
 * @param {string} text - Message text
 * @param {number} turn - Current game turn
 * @returns {Object} - Updated alliance
 */
function addAllianceMessage(alliance, playerId, text, turn) {
  // Check if player is in the alliance
  if (!alliance.members.includes(playerId)) {
    throw new Error(`Player ${playerId} is not a member of alliance ${alliance.name}`);
  }
  
  // Add message
  alliance.messages.push({
    turn,
    type: 'chat',
    player: playerId,
    text,
  });
  
  return alliance;
}

/**
 * Share resources within the alliance
 * 
 * @param {Object} alliance - Alliance object
 * @param {Object} playerResources - Resources of all players
 * @returns {Object} - Resource sharing benefits for each player
 */
function shareAllianceResources(alliance, playerResources) {
  const benefits = {};
  const allianceLevel = ALLIANCE_LEVELS[alliance.level];
  const sharingPercent = allianceLevel.benefits.resource_sharing_percent;
  
  // Initialize benefits for each member
  for (const member of alliance.members) {
    benefits[member] = {};
  }
  
  // Calculate total resources in the alliance
  const totalResources = {};
  for (const member of alliance.members) {
    const resources = playerResources[member];
    
    for (const resource in resources) {
      if (!totalResources[resource]) {
        totalResources[resource] = 0;
      }
      totalResources[resource] += resources[resource];
    }
  }
  
  // Calculate average resources per member
  const averageResources = {};
  for (const resource in totalResources) {
    averageResources[resource] = totalResources[resource] / alliance.members.length;
  }
  
  // Calculate sharing benefits
  for (const member of alliance.members) {
    const resources = playerResources[member];
    
    for (const resource in averageResources) {
      if (!resources[resource]) {
        resources[resource] = 0;
      }
      
      // If player has less than average, they receive resources
      if (resources[resource] < averageResources[resource]) {
        const deficit = averageResources[resource] - resources[resource];
        const benefit = Math.floor(deficit * sharingPercent);
        
        benefits[member][resource] = benefit;
      }
    }
  }
  
  return benefits;
}

/**
 * Get alliance benefits for a player
 * 
 * @param {string} playerId - ID of the player
 * @param {Object} alliance - Alliance object
 * @returns {Object} - Alliance benefits for the player
 */
function getAllianceBenefits(playerId, alliance) {
  // Check if player is in the alliance
  if (!alliance.members.includes(playerId)) {
    return {};
  }
  
  return ALLIANCE_LEVELS[alliance.level].benefits;
}

/**
 * Initialize the alliance system
 * 
 * @returns {Object} - Alliance system API
 */
function initAllianceSystem() {
  return {
    createAlliance,
    addPlayerToAlliance,
    removePlayerFromAlliance,
    updateAllianceLevel,
    generateAllianceObjectives,
    updateObjectiveProgress,
    addAllianceMessage,
    shareAllianceResources,
    getAllianceBenefits,
    ALLIANCE_LEVELS,
    ALLIANCE_OBJECTIVES,
  };
}

module.exports = {
  initAllianceSystem,
};