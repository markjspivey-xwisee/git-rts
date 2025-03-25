/**
 * Diplomacy and Alliances System for Git-RTS
 * 
 * This module implements a comprehensive diplomacy system with:
 * - Diplomatic relations between players
 * - Alliance formation and management
 * - Trade agreements and resource sharing
 * - Non-aggression pacts and peace treaties
 * - Diplomatic actions and reputation
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Diplomatic relation states
const RELATION_STATES = {
  'war': { 'index': 0, 'name': 'War', 'color': '#ff0000' },
  'hostile': { 'index': 1, 'name': 'Hostile', 'color': '#ff6600' },
  'neutral': { 'index': 2, 'name': 'Neutral', 'color': '#ffcc00' },
  'favorable': { 'index': 3, 'name': 'Favorable', 'color': '#66cc00' },
  'friendly': { 'index': 4, 'name': 'Friendly', 'color': '#00cc00' },
  'allied': { 'index': 5, 'name': 'Allied', 'color': '#0066ff' },
};

// Diplomatic agreement types
const AGREEMENT_TYPES = {
  'peace_treaty': {
    'name': 'Peace Treaty',
    'duration': 20, // turns
    'effects': {
      'min_relation': 'neutral',
      'prevents_war': true,
    },
    'description': 'Ends the state of war and prevents declaring war for a period.',
  },
  'non_aggression_pact': {
    'name': 'Non-Aggression Pact',
    'duration': 30, // turns
    'effects': {
      'min_relation': 'neutral',
      'prevents_war': true,
    },
    'description': 'Agreement not to attack each other for a period.',
  },
  'trade_agreement': {
    'name': 'Trade Agreement',
    'duration': 40, // turns
    'effects': {
      'min_relation': 'favorable',
      'trade_bonus': 0.2,
      'resource_sharing': true,
    },
    'description': 'Establishes trade routes and resource sharing between players.',
  },
  'research_agreement': {
    'name': 'Research Agreement',
    'duration': 40, // turns
    'effects': {
      'min_relation': 'favorable',
      'research_bonus': 0.2,
      'technology_sharing': true,
    },
    'description': 'Collaboration on research projects for mutual benefit.',
  },
  'defensive_pact': {
    'name': 'Defensive Pact',
    'duration': 50, // turns
    'effects': {
      'min_relation': 'friendly',
      'defensive_alliance': true,
    },
    'description': 'Agreement to defend each other if attacked by a third party.',
  },
  'alliance': {
    'name': 'Alliance',
    'duration': 60, // turns
    'effects': {
      'min_relation': 'allied',
      'defensive_alliance': true,
      'offensive_alliance': true,
      'resource_sharing': true,
      'vision_sharing': true,
    },
    'description': 'Full military and economic alliance between players.',
  },
};

// Diplomatic actions
const DIPLOMATIC_ACTIONS = {
  'declare_war': {
    'name': 'Declare War',
    'reputation_cost': 20,
    'relation_change': -100,
    'min_relation': null,
    'max_relation': 'hostile',
    'result_relation': 'war',
    'description': 'Formally declare war on another player.',
  },
  'offer_peace': {
    'name': 'Offer Peace',
    'reputation_cost': 0,
    'relation_change': 20,
    'min_relation': 'war',
    'max_relation': 'war',
    'result_relation': 'neutral',
    'creates_agreement': 'peace_treaty',
    'description': 'Offer to end the state of war.',
  },
  'propose_non_aggression': {
    'name': 'Propose Non-Aggression Pact',
    'reputation_cost': 0,
    'relation_change': 10,
    'min_relation': 'neutral',
    'max_relation': 'favorable',
    'creates_agreement': 'non_aggression_pact',
    'description': 'Propose a pact to avoid conflict.',
  },
  'propose_trade': {
    'name': 'Propose Trade Agreement',
    'reputation_cost': 0,
    'relation_change': 15,
    'min_relation': 'neutral',
    'max_relation': 'friendly',
    'creates_agreement': 'trade_agreement',
    'description': 'Propose a formal trade agreement.',
  },
  'propose_research': {
    'name': 'Propose Research Agreement',
    'reputation_cost': 0,
    'relation_change': 15,
    'min_relation': 'favorable',
    'max_relation': 'friendly',
    'creates_agreement': 'research_agreement',
    'description': 'Propose collaboration on research.',
  },
  'propose_defensive_pact': {
    'name': 'Propose Defensive Pact',
    'reputation_cost': 0,
    'relation_change': 20,
    'min_relation': 'favorable',
    'max_relation': 'allied',
    'creates_agreement': 'defensive_pact',
    'description': 'Propose a mutual defense agreement.',
  },
  'propose_alliance': {
    'name': 'Propose Alliance',
    'reputation_cost': 0,
    'relation_change': 30,
    'min_relation': 'friendly',
    'max_relation': null,
    'creates_agreement': 'alliance',
    'description': 'Propose a full military and economic alliance.',
  },
  'send_gift': {
    'name': 'Send Gift',
    'reputation_cost': -5,
    'relation_change': 15,
    'min_relation': 'hostile',
    'max_relation': 'allied',
    'description': 'Send resources as a gift to improve relations.',
  },
  'denounce': {
    'name': 'Denounce',
    'reputation_cost': 5,
    'relation_change': -30,
    'min_relation': 'neutral',
    'max_relation': 'allied',
    'result_relation': 'hostile',
    'description': 'Publicly denounce another player.',
  },
  'break_agreement': {
    'name': 'Break Agreement',
    'reputation_cost': 30,
    'relation_change': -50,
    'min_relation': 'neutral',
    'max_relation': 'allied',
    'result_relation': 'hostile',
    'description': 'Unilaterally break an existing agreement.',
  },
};

/**
 * Initialize the diplomacy system for a new game
 * 
 * @param {Array} players - Array of player IDs
 * @returns {Object} - Initial diplomatic state
 */
function initDiplomacy(players) {
  const relations = {};
  const agreements = {};
  const reputations = {};
  
  // Initialize relations between all players
  for (const player1 of players) {
    relations[player1] = {};
    agreements[player1] = {};
    reputations[player1] = 100; // Start with neutral reputation
    
    for (const player2 of players) {
      if (player1 !== player2) {
        relations[player1][player2] = 'neutral';
        agreements[player1][player2] = [];
      }
    }
  }
  
  return {
    relations,
    agreements,
    reputations,
    turn: 0,
  };
}

/**
 * Get available diplomatic actions between two players
 * 
 * @param {string} player1 - First player ID
 * @param {string} player2 - Second player ID
 * @param {Object} diplomacyState - Current diplomatic state
 * @returns {Array} - Available diplomatic actions
 */
function getAvailableActions(player1, player2, diplomacyState) {
  const currentRelation = diplomacyState.relations[player1][player2];
  const currentAgreements = diplomacyState.agreements[player1][player2] || [];
  
  const availableActions = [];
  
  for (const [actionId, action] of Object.entries(DIPLOMATIC_ACTIONS)) {
    // Check if relation is within allowed range
    if (action.min_relation && RELATION_STATES[currentRelation].index < RELATION_STATES[action.min_relation].index) {
      continue;
    }
    
    if (action.max_relation && RELATION_STATES[currentRelation].index > RELATION_STATES[action.max_relation].index) {
      continue;
    }
    
    // Check if action would create an agreement that already exists
    if (action.creates_agreement) {
      const hasAgreement = currentAgreements.some(agreement => agreement.type === action.creates_agreement);
      if (hasAgreement) {
        continue;
      }
    }
    
    // Special case for break_agreement
    if (actionId === 'break_agreement' && currentAgreements.length === 0) {
      continue;
    }
    
    availableActions.push({
      id: actionId,
      ...action,
    });
  }
  
  return availableActions;
}

/**
 * Execute a diplomatic action
 * 
 * @param {string} player1 - Acting player ID
 * @param {string} player2 - Target player ID
 * @param {string} actionId - Diplomatic action ID
 * @param {Object} diplomacyState - Current diplomatic state
 * @param {Object} options - Additional options for the action
 * @returns {Object} - Updated diplomatic state and action result
 */
function executeDiplomaticAction(player1, player2, actionId, diplomacyState, options = {}) {
  const action = DIPLOMATIC_ACTIONS[actionId];
  
  if (!action) {
    throw new Error(`Diplomatic action ${actionId} not found`);
  }
  
  // Check if action is available
  const availableActions = getAvailableActions(player1, player2, diplomacyState);
  const isAvailable = availableActions.some(a => a.id === actionId);
  
  if (!isAvailable) {
    throw new Error(`Diplomatic action ${actionId} is not available`);
  }
  
  // Update reputation
  diplomacyState.reputations[player1] -= action.reputation_cost;
  
  // Update relation
  let newRelation = diplomacyState.relations[player1][player2];
  
  if (action.result_relation) {
    newRelation = action.result_relation;
  } else {
    // Calculate new relation based on current relation and relation change
    const currentIndex = RELATION_STATES[diplomacyState.relations[player1][player2]].index;
    let newIndex = currentIndex;
    
    // Convert relation_change to index change (each 25 points is one level)
    const indexChange = Math.floor(action.relation_change / 25);
    newIndex += indexChange;
    
    // Clamp to valid range
    newIndex = Math.max(0, Math.min(newIndex, Object.keys(RELATION_STATES).length - 1));
    
    // Convert back to relation state
    newRelation = Object.keys(RELATION_STATES).find(key => RELATION_STATES[key].index === newIndex);
  }
  
  diplomacyState.relations[player1][player2] = newRelation;
  diplomacyState.relations[player2][player1] = newRelation;
  
  // Create agreement if applicable
  if (action.creates_agreement) {
    const agreementType = action.creates_agreement;
    const agreement = {
      type: agreementType,
      created_turn: diplomacyState.turn,
      expires_turn: diplomacyState.turn + AGREEMENT_TYPES[agreementType].duration,
      ...options,
    };
    
    if (!diplomacyState.agreements[player1][player2]) {
      diplomacyState.agreements[player1][player2] = [];
    }
    if (!diplomacyState.agreements[player2][player1]) {
      diplomacyState.agreements[player2][player1] = [];
    }
    
    diplomacyState.agreements[player1][player2].push(agreement);
    diplomacyState.agreements[player2][player1].push(agreement);
  }
  
  // Handle special actions
  if (actionId === 'break_agreement' && options.agreement_index !== undefined) {
    const agreement = diplomacyState.agreements[player1][player2][options.agreement_index];
    
    if (!agreement) {
      throw new Error(`Agreement at index ${options.agreement_index} not found`);
    }
    
    // Remove agreement
    diplomacyState.agreements[player1][player2].splice(options.agreement_index, 1);
    
    // Find and remove the same agreement from the other player's perspective
    const otherIndex = diplomacyState.agreements[player2][player1].findIndex(a => 
      a.type === agreement.type && a.created_turn === agreement.created_turn
    );
    
    if (otherIndex !== -1) {
      diplomacyState.agreements[player2][player1].splice(otherIndex, 1);
    }
  }
  
  return {
    diplomacyState,
    result: {
      action: actionId,
      player1,
      player2,
      new_relation: newRelation,
      new_reputation: diplomacyState.reputations[player1],
    },
  };
}

/**
 * Update diplomatic state for a new turn
 * 
 * @param {Object} diplomacyState - Current diplomatic state
 * @returns {Object} - Updated diplomatic state
 */
function updateDiplomacy(diplomacyState) {
  diplomacyState.turn += 1;
  
  // Check for expired agreements
  for (const player1 in diplomacyState.agreements) {
    for (const player2 in diplomacyState.agreements[player1]) {
      if (player1 === player2) continue;
      
      const agreements = diplomacyState.agreements[player1][player2];
      const expiredIndexes = [];
      
      // Find expired agreements
      for (let i = 0; i < agreements.length; i++) {
        if (agreements[i].expires_turn <= diplomacyState.turn) {
          expiredIndexes.push(i);
        }
      }
      
      // Remove expired agreements (in reverse order to avoid index shifting)
      for (let i = expiredIndexes.length - 1; i >= 0; i--) {
        agreements.splice(expiredIndexes[i], 1);
      }
    }
  }
  
  return diplomacyState;
}

/**
 * Check if two players are at war
 * 
 * @param {string} player1 - First player ID
 * @param {string} player2 - Second player ID
 * @param {Object} diplomacyState - Current diplomatic state
 * @returns {boolean} - True if players are at war
 */
function arePlayersAtWar(player1, player2, diplomacyState) {
  return diplomacyState.relations[player1][player2] === 'war';
}

/**
 * Check if two players are allies
 * 
 * @param {string} player1 - First player ID
 * @param {string} player2 - Second player ID
 * @param {Object} diplomacyState - Current diplomatic state
 * @returns {boolean} - True if players are allies
 */
function arePlayersAllied(player1, player2, diplomacyState) {
  return diplomacyState.relations[player1][player2] === 'allied';
}

/**
 * Check if a player has a specific agreement with another player
 * 
 * @param {string} player1 - First player ID
 * @param {string} player2 - Second player ID
 * @param {string} agreementType - Type of agreement to check
 * @param {Object} diplomacyState - Current diplomatic state
 * @returns {boolean} - True if agreement exists
 */
function hasAgreement(player1, player2, agreementType, diplomacyState) {
  if (!diplomacyState.agreements[player1][player2]) {
    return false;
  }
  
  return diplomacyState.agreements[player1][player2].some(agreement => agreement.type === agreementType);
}

/**
 * Get all agreements between two players
 * 
 * @param {string} player1 - First player ID
 * @param {string} player2 - Second player ID
 * @param {Object} diplomacyState - Current diplomatic state
 * @returns {Array} - Array of agreements
 */
function getAgreements(player1, player2, diplomacyState) {
  if (!diplomacyState.agreements[player1][player2]) {
    return [];
  }
  
  return diplomacyState.agreements[player1][player2].map(agreement => ({
    ...agreement,
    details: AGREEMENT_TYPES[agreement.type],
  }));
}

/**
 * Get all players that would join a war if player1 attacks player2
 * 
 * @param {string} player1 - Attacking player ID
 * @param {string} player2 - Defending player ID
 * @param {Object} diplomacyState - Current diplomatic state
 * @returns {Array} - Array of player IDs that would join the war
 */
function getWarParticipants(player1, player2, diplomacyState) {
  const defenders = [player2];
  
  // Check for defensive pacts and alliances
  for (const player3 in diplomacyState.relations) {
    if (player3 === player1 || player3 === player2) continue;
    
    // Check if player3 has defensive pact or alliance with player2
    const hasDefensivePact = hasAgreement(player2, player3, 'defensive_pact', diplomacyState);
    const hasAlliance = hasAgreement(player2, player3, 'alliance', diplomacyState);
    
    if (hasDefensivePact || hasAlliance) {
      defenders.push(player3);
    }
  }
  
  return defenders;
}

/**
 * Calculate trade benefits between two players
 * 
 * @param {string} player1 - First player ID
 * @param {string} player2 - Second player ID
 * @param {Object} diplomacyState - Current diplomatic state
 * @param {Object} playerResources - Resources of all players
 * @returns {Object} - Trade benefits for both players
 */
function calculateTradeBenefits(player1, player2, diplomacyState, playerResources) {
  if (!hasAgreement(player1, player2, 'trade_agreement', diplomacyState) &&
      !hasAgreement(player1, player2, 'alliance', diplomacyState)) {
    return { player1: {}, player2: {} };
  }
  
  const resources1 = playerResources[player1];
  const resources2 = playerResources[player2];
  
  const benefits1 = {};
  const benefits2 = {};
  
  // Calculate trade benefits based on resource differences
  for (const resource in resources1) {
    if (resources1[resource] > resources2[resource]) {
      // Player1 has excess of this resource
      const excess = resources1[resource] - resources2[resource];
      const tradeAmount = Math.floor(excess * 0.1); // 10% of excess
      
      benefits2[resource] = tradeAmount;
    }
  }
  
  for (const resource in resources2) {
    if (resources2[resource] > resources1[resource]) {
      // Player2 has excess of this resource
      const excess = resources2[resource] - resources1[resource];
      const tradeAmount = Math.floor(excess * 0.1); // 10% of excess
      
      benefits1[resource] = tradeAmount;
    }
  }
  
  return {
    player1: benefits1,
    player2: benefits2,
  };
}

/**
 * Initialize the diplomacy system
 * 
 * @returns {Object} - Diplomacy system API
 */
function initDiplomacySystem() {
  return {
    initDiplomacy,
    getAvailableActions,
    executeDiplomaticAction,
    updateDiplomacy,
    arePlayersAtWar,
    arePlayersAllied,
    hasAgreement,
    getAgreements,
    getWarParticipants,
    calculateTradeBenefits,
    RELATION_STATES,
    AGREEMENT_TYPES,
    DIPLOMATIC_ACTIONS,
  };
}

module.exports = {
  initDiplomacySystem,
};