/**
 * Technology Tree System for Git-RTS
 * 
 * This module implements a comprehensive technology tree with:
 * - Multiple technology paths (military, economy, infrastructure)
 * - Prerequisites and dependencies
 * - Resource costs and research times
 * - Technology effects and bonuses
 * - Era progression
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Technology eras
const TECH_ERAS = {
  'ancient': { 'index': 0, 'name': 'Ancient Era' },
  'medieval': { 'index': 1, 'name': 'Medieval Era' },
  'renaissance': { 'index': 2, 'name': 'Renaissance Era' },
  'industrial': { 'index': 3, 'name': 'Industrial Era' },
  'modern': { 'index': 4, 'name': 'Modern Era' },
  'future': { 'index': 5, 'name': 'Future Era' },
};

// Technology categories
const TECH_CATEGORIES = {
  'military': { 'name': 'Military', 'color': '#ff0000' },
  'economy': { 'name': 'Economy', 'color': '#ffcc00' },
  'infrastructure': { 'name': 'Infrastructure', 'color': '#0099ff' },
  'science': { 'name': 'Science', 'color': '#00cc99' },
  'culture': { 'name': 'Culture', 'color': '#cc00ff' },
};

// Technology tree definition
const TECH_TREE = {
  // Ancient Era
  'agriculture': {
    'name': 'Agriculture',
    'era': 'ancient',
    'category': 'economy',
    'cost': { 'science': 10 },
    'research_time': 1,
    'prerequisites': [],
    'effects': {
      'food_production': 0.2,
      'population_growth': 0.1,
    },
    'description': 'Enables farming and increases food production.',
  },
  'mining': {
    'name': 'Mining',
    'era': 'ancient',
    'category': 'economy',
    'cost': { 'science': 15 },
    'research_time': 1,
    'prerequisites': [],
    'effects': {
      'stone_production': 0.2,
      'gold_production': 0.1,
    },
    'description': 'Enables mining of stone and precious metals.',
  },
  'bronze_working': {
    'name': 'Bronze Working',
    'era': 'ancient',
    'category': 'military',
    'cost': { 'science': 20 },
    'research_time': 2,
    'prerequisites': ['mining'],
    'effects': {
      'unit_attack': 0.1,
      'unit_defense': 0.1,
    },
    'unlocks': ['spearman'],
    'description': 'Enables bronze weapons and armor.',
  },
  'writing': {
    'name': 'Writing',
    'era': 'ancient',
    'category': 'science',
    'cost': { 'science': 25 },
    'research_time': 2,
    'prerequisites': [],
    'effects': {
      'science_production': 0.2,
    },
    'description': 'Enables written records and scientific progress.',
  },
  
  // Medieval Era
  'iron_working': {
    'name': 'Iron Working',
    'era': 'medieval',
    'category': 'military',
    'cost': { 'science': 40 },
    'research_time': 3,
    'prerequisites': ['bronze_working'],
    'effects': {
      'unit_attack': 0.2,
      'unit_defense': 0.2,
    },
    'unlocks': ['swordsman'],
    'description': 'Enables iron weapons and armor.',
  },
  'mathematics': {
    'name': 'Mathematics',
    'era': 'medieval',
    'category': 'science',
    'cost': { 'science': 45 },
    'research_time': 3,
    'prerequisites': ['writing'],
    'effects': {
      'science_production': 0.2,
      'building_cost': -0.1,
    },
    'description': 'Enables advanced calculations and engineering.',
  },
  'construction': {
    'name': 'Construction',
    'era': 'medieval',
    'category': 'infrastructure',
    'cost': { 'science': 50 },
    'research_time': 4,
    'prerequisites': ['mathematics'],
    'effects': {
      'building_health': 0.3,
      'building_cost': -0.1,
    },
    'unlocks': ['walls', 'aqueduct'],
    'description': 'Enables advanced building techniques.',
  },
  'feudalism': {
    'name': 'Feudalism',
    'era': 'medieval',
    'category': 'economy',
    'cost': { 'science': 55 },
    'research_time': 4,
    'prerequisites': ['agriculture'],
    'effects': {
      'food_production': 0.2,
      'gold_production': 0.2,
    },
    'description': 'Establishes a feudal system for resource management.',
  },
  
  // Renaissance Era
  'gunpowder': {
    'name': 'Gunpowder',
    'era': 'renaissance',
    'category': 'military',
    'cost': { 'science': 80 },
    'research_time': 5,
    'prerequisites': ['iron_working'],
    'effects': {
      'unit_attack': 0.3,
    },
    'unlocks': ['musketman'],
    'description': 'Enables gunpowder weapons.',
  },
  'printing_press': {
    'name': 'Printing Press',
    'era': 'renaissance',
    'category': 'science',
    'cost': { 'science': 85 },
    'research_time': 5,
    'prerequisites': ['mathematics'],
    'effects': {
      'science_production': 0.3,
      'culture_production': 0.2,
    },
    'description': 'Enables mass production of books and knowledge sharing.',
  },
  'banking': {
    'name': 'Banking',
    'era': 'renaissance',
    'category': 'economy',
    'cost': { 'science': 90 },
    'research_time': 6,
    'prerequisites': ['feudalism'],
    'effects': {
      'gold_production': 0.3,
      'trade_income': 0.2,
    },
    'description': 'Establishes a banking system for economic growth.',
  },
  
  // Industrial Era
  'steam_power': {
    'name': 'Steam Power',
    'era': 'industrial',
    'category': 'infrastructure',
    'cost': { 'science': 120 },
    'research_time': 7,
    'prerequisites': ['construction'],
    'effects': {
      'production_speed': 0.3,
      'movement_speed': 0.2,
    },
    'unlocks': ['factory'],
    'description': 'Harnesses steam for industrial applications.',
  },
  'rifling': {
    'name': 'Rifling',
    'era': 'industrial',
    'category': 'military',
    'cost': { 'science': 130 },
    'research_time': 7,
    'prerequisites': ['gunpowder'],
    'effects': {
      'unit_attack': 0.3,
      'unit_range': 0.2,
    },
    'unlocks': ['rifleman'],
    'description': 'Enables rifled firearms for increased accuracy.',
  },
  'industrialization': {
    'name': 'Industrialization',
    'era': 'industrial',
    'category': 'economy',
    'cost': { 'science': 140 },
    'research_time': 8,
    'prerequisites': ['steam_power', 'banking'],
    'effects': {
      'production_speed': 0.4,
      'resource_production': 0.3,
    },
    'description': 'Establishes industrial methods for mass production.',
  },
  
  // Modern Era
  'electricity': {
    'name': 'Electricity',
    'era': 'modern',
    'category': 'infrastructure',
    'cost': { 'science': 180 },
    'research_time': 9,
    'prerequisites': ['industrialization'],
    'effects': {
      'production_speed': 0.4,
      'building_efficiency': 0.3,
    },
    'unlocks': ['power_plant'],
    'description': 'Harnesses electrical power for various applications.',
  },
  'radio': {
    'name': 'Radio',
    'era': 'modern',
    'category': 'science',
    'cost': { 'science': 190 },
    'research_time': 9,
    'prerequisites': ['electricity'],
    'effects': {
      'communication_range': 0.5,
      'culture_production': 0.3,
    },
    'description': 'Enables wireless communication over long distances.',
  },
  'combustion': {
    'name': 'Combustion',
    'era': 'modern',
    'category': 'military',
    'cost': { 'science': 200 },
    'research_time': 10,
    'prerequisites': ['rifling'],
    'effects': {
      'unit_movement': 0.4,
      'unit_attack': 0.3,
    },
    'unlocks': ['tank'],
    'description': 'Enables combustion engines for vehicles.',
  },
  
  // Future Era
  'computers': {
    'name': 'Computers',
    'era': 'future',
    'category': 'science',
    'cost': { 'science': 250 },
    'research_time': 12,
    'prerequisites': ['electricity', 'radio'],
    'effects': {
      'science_production': 0.5,
      'production_efficiency': 0.4,
    },
    'description': 'Enables digital computing for advanced applications.',
  },
  'robotics': {
    'name': 'Robotics',
    'era': 'future',
    'category': 'infrastructure',
    'cost': { 'science': 280 },
    'research_time': 14,
    'prerequisites': ['computers'],
    'effects': {
      'production_speed': 0.5,
      'resource_efficiency': 0.4,
    },
    'unlocks': ['robot_factory'],
    'description': 'Enables automated robots for various tasks.',
  },
  'artificial_intelligence': {
    'name': 'Artificial Intelligence',
    'era': 'future',
    'category': 'science',
    'cost': { 'science': 300 },
    'research_time': 15,
    'prerequisites': ['computers', 'robotics'],
    'effects': {
      'science_production': 0.6,
      'production_efficiency': 0.5,
      'resource_efficiency': 0.5,
    },
    'description': 'Enables intelligent systems that can learn and adapt.',
  },
};

/**
 * Get the full technology tree
 * 
 * @returns {Object} - The technology tree
 */
function getTechnologyTree() {
  return TECH_TREE;
}

/**
 * Get technologies available for research
 * 
 * @param {Array} researchedTechs - Array of already researched technologies
 * @returns {Array} - Array of available technologies
 */
function getAvailableTechnologies(researchedTechs) {
  const available = [];
  
  for (const [techId, tech] of Object.entries(TECH_TREE)) {
    // Skip already researched technologies
    if (researchedTechs.includes(techId)) {
      continue;
    }
    
    // Check if all prerequisites are met
    const prereqsMet = tech.prerequisites.every(prereq => researchedTechs.includes(prereq));
    
    if (prereqsMet) {
      available.push({
        id: techId,
        ...tech,
      });
    }
  }
  
  return available;
}

/**
 * Start researching a technology
 * 
 * @param {string} techId - ID of the technology to research
 * @param {Object} playerState - Current player state
 * @returns {Object} - Updated player state
 */
function startResearch(techId, playerState) {
  const tech = TECH_TREE[techId];
  
  if (!tech) {
    throw new Error(`Technology ${techId} not found`);
  }
  
  // Check if already researched
  if (playerState.researched_technologies.includes(techId)) {
    throw new Error(`Technology ${techId} already researched`);
  }
  
  // Check if prerequisites are met
  const prereqsMet = tech.prerequisites.every(prereq => 
    playerState.researched_technologies.includes(prereq)
  );
  
  if (!prereqsMet) {
    throw new Error(`Prerequisites for ${techId} not met`);
  }
  
  // Check if enough resources
  for (const [resource, amount] of Object.entries(tech.cost)) {
    if (playerState.resources[resource] < amount) {
      throw new Error(`Not enough ${resource} to research ${techId}`);
    }
  }
  
  // Deduct resources
  for (const [resource, amount] of Object.entries(tech.cost)) {
    playerState.resources[resource] -= amount;
  }
  
  // Set current research
  playerState.current_research = {
    technology: techId,
    progress: 0,
    total: tech.research_time,
  };
  
  return playerState;
}

/**
 * Update research progress
 * 
 * @param {Object} playerState - Current player state
 * @param {number} sciencePoints - Science points to add
 * @returns {Object} - Updated player state with research progress
 */
function updateResearchProgress(playerState, sciencePoints) {
  if (!playerState.current_research) {
    return playerState;
  }
  
  // Update progress
  playerState.current_research.progress += sciencePoints;
  
  // Check if research is complete
  if (playerState.current_research.progress >= playerState.current_research.total) {
    // Add to researched technologies
    playerState.researched_technologies.push(playerState.current_research.technology);
    
    // Apply technology effects
    const tech = TECH_TREE[playerState.current_research.technology];
    for (const [effect, value] of Object.entries(tech.effects)) {
      if (!playerState.effects[effect]) {
        playerState.effects[effect] = 0;
      }
      playerState.effects[effect] += value;
    }
    
    // Clear current research
    playerState.current_research = null;
    
    // Check for era advancement
    updatePlayerEra(playerState);
  }
  
  return playerState;
}

/**
 * Update player's current era based on researched technologies
 * 
 * @param {Object} playerState - Current player state
 * @returns {Object} - Updated player state with current era
 */
function updatePlayerEra(playerState) {
  let highestEraIndex = -1;
  let highestEra = null;
  
  // Find the highest era among researched technologies
  for (const techId of playerState.researched_technologies) {
    const tech = TECH_TREE[techId];
    const eraIndex = TECH_ERAS[tech.era].index;
    
    if (eraIndex > highestEraIndex) {
      highestEraIndex = eraIndex;
      highestEra = tech.era;
    }
  }
  
  if (highestEra && highestEra !== playerState.current_era) {
    playerState.current_era = highestEra;
    playerState.era_changed = true;
  } else {
    playerState.era_changed = false;
  }
  
  return playerState;
}

/**
 * Get the technology path to a specific technology
 * 
 * @param {string} techId - ID of the target technology
 * @returns {Array} - Array of technology IDs forming the path
 */
function getTechnologyPath(techId) {
  const tech = TECH_TREE[techId];
  
  if (!tech) {
    throw new Error(`Technology ${techId} not found`);
  }
  
  if (tech.prerequisites.length === 0) {
    return [techId];
  }
  
  // Find the shortest path through prerequisites
  let shortestPath = null;
  let shortestLength = Infinity;
  
  for (const prereq of tech.prerequisites) {
    const path = getTechnologyPath(prereq);
    
    if (path.length < shortestLength) {
      shortestLength = path.length;
      shortestPath = path;
    }
  }
  
  return [...shortestPath, techId];
}

/**
 * Get all effects from researched technologies
 * 
 * @param {Array} researchedTechs - Array of researched technology IDs
 * @returns {Object} - Combined effects from all technologies
 */
function getCombinedTechEffects(researchedTechs) {
  const effects = {};
  
  for (const techId of researchedTechs) {
    const tech = TECH_TREE[techId];
    
    for (const [effect, value] of Object.entries(tech.effects)) {
      if (!effects[effect]) {
        effects[effect] = 0;
      }
      effects[effect] += value;
    }
  }
  
  return effects;
}

/**
 * Get all units and buildings unlocked by researched technologies
 * 
 * @param {Array} researchedTechs - Array of researched technology IDs
 * @returns {Object} - Object with unlocked units and buildings
 */
function getUnlockedContent(researchedTechs) {
  const unlocked = {
    units: [],
    buildings: [],
  };
  
  for (const techId of researchedTechs) {
    const tech = TECH_TREE[techId];
    
    if (tech.unlocks) {
      for (const item of tech.unlocks) {
        // Simple heuristic: buildings have 'factory', 'plant', etc. in their name
        if (item.includes('factory') || item.includes('plant') || item.includes('building') || 
            item.includes('walls') || item.includes('tower') || item.includes('aqueduct')) {
          unlocked.buildings.push(item);
        } else {
          unlocked.units.push(item);
        }
      }
    }
  }
  
  return unlocked;
}

/**
 * Initialize the technology system
 * 
 * @returns {Object} - Technology system API
 */
function initTechnologyTree() {
  return {
    getTechnologyTree,
    getAvailableTechnologies,
    startResearch,
    updateResearchProgress,
    updatePlayerEra,
    getTechnologyPath,
    getCombinedTechEffects,
    getUnlockedContent,
    TECH_ERAS,
    TECH_CATEGORIES,
  };
}

module.exports = {
  initTechnologyTree,
};