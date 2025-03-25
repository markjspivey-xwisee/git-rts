/**
 * Advanced Combat System for Git-RTS
 * 
 * This module implements an advanced combat system with:
 * - Unit types with different strengths and weaknesses
 * - Terrain effects on combat
 * - Experience and leveling for units
 * - Special abilities and formations
 * - Combat modifiers (weather, time of day, etc.)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Combat constants
const COMBAT_CONSTANTS = {
  BASE_ATTACK_DAMAGE: 10,
  BASE_DEFENSE: 5,
  CRITICAL_HIT_CHANCE: 0.1,
  CRITICAL_HIT_MULTIPLIER: 2.0,
  EXPERIENCE_PER_COMBAT: 10,
  EXPERIENCE_FOR_LEVEL_UP: 100,
  MAX_LEVEL: 10,
  LEVEL_UP_STAT_INCREASE: 0.1,
};

// Unit type advantages (rock-paper-scissors system)
const UNIT_TYPE_ADVANTAGES = {
  'infantry': { 'strong_against': ['archer'], 'weak_against': ['cavalry'] },
  'archer': { 'strong_against': ['cavalry'], 'weak_against': ['infantry'] },
  'cavalry': { 'strong_against': ['infantry'], 'weak_against': ['archer'] },
  'siege': { 'strong_against': ['building'], 'weak_against': ['cavalry'] },
  'building': { 'strong_against': [], 'weak_against': ['siege'] },
};

// Terrain effects on combat
const TERRAIN_EFFECTS = {
  'plains': { 'movement_cost': 1, 'attack_modifier': 0, 'defense_modifier': 0 },
  'forest': { 'movement_cost': 2, 'attack_modifier': -0.1, 'defense_modifier': 0.2 },
  'mountain': { 'movement_cost': 3, 'attack_modifier': 0.1, 'defense_modifier': 0.3 },
  'water': { 'movement_cost': 4, 'attack_modifier': -0.2, 'defense_modifier': -0.1 },
  'desert': { 'movement_cost': 2, 'attack_modifier': -0.1, 'defense_modifier': -0.1 },
};

// Weather effects on combat
const WEATHER_EFFECTS = {
  'clear': { 'attack_modifier': 0, 'defense_modifier': 0, 'movement_modifier': 0 },
  'rain': { 'attack_modifier': -0.1, 'defense_modifier': 0, 'movement_modifier': -0.2 },
  'snow': { 'attack_modifier': -0.2, 'defense_modifier': -0.1, 'movement_modifier': -0.3 },
  'fog': { 'attack_modifier': -0.3, 'defense_modifier': 0.1, 'movement_modifier': -0.1 },
  'storm': { 'attack_modifier': -0.2, 'defense_modifier': -0.2, 'movement_modifier': -0.4 },
};

// Special abilities
const SPECIAL_ABILITIES = {
  'charge': { 'attack_modifier': 0.5, 'defense_modifier': -0.2, 'cooldown': 3 },
  'shield_wall': { 'attack_modifier': -0.2, 'defense_modifier': 0.5, 'cooldown': 3 },
  'volley': { 'attack_modifier': 0.3, 'defense_modifier': -0.1, 'cooldown': 2 },
  'ambush': { 'attack_modifier': 0.7, 'defense_modifier': 0, 'cooldown': 4 },
  'heal': { 'heal_amount': 20, 'cooldown': 5 },
};

// Formations
const FORMATIONS = {
  'line': { 'attack_modifier': 0.1, 'defense_modifier': 0.1, 'movement_modifier': 0 },
  'column': { 'attack_modifier': 0, 'defense_modifier': 0, 'movement_modifier': 0.2 },
  'square': { 'attack_modifier': -0.1, 'defense_modifier': 0.3, 'movement_modifier': -0.2 },
  'wedge': { 'attack_modifier': 0.3, 'defense_modifier': -0.1, 'movement_modifier': 0 },
  'skirmish': { 'attack_modifier': 0, 'defense_modifier': 0, 'movement_modifier': 0.3 },
};

/**
 * Calculate the attack damage for a unit
 * 
 * @param {Object} attacker - The attacking unit
 * @param {Object} defender - The defending unit
 * @param {Object} options - Combat options (terrain, weather, etc.)
 * @returns {Object} - Combat result
 */
function calculateAttackDamage(attacker, defender, options = {}) {
  const terrain = options.terrain || 'plains';
  const weather = options.weather || 'clear';
  const formation = options.formation || 'line';
  const specialAbility = options.specialAbility || null;
  
  // Base damage calculation
  let damage = COMBAT_CONSTANTS.BASE_ATTACK_DAMAGE * (attacker.attack / defender.defense);
  
  // Apply unit type advantages
  if (UNIT_TYPE_ADVANTAGES[attacker.type].strong_against.includes(defender.type)) {
    damage *= 1.5;
  } else if (UNIT_TYPE_ADVANTAGES[attacker.type].weak_against.includes(defender.type)) {
    damage *= 0.7;
  }
  
  // Apply terrain effects
  damage *= (1 + TERRAIN_EFFECTS[terrain].attack_modifier);
  damage /= (1 + TERRAIN_EFFECTS[terrain].defense_modifier);
  
  // Apply weather effects
  damage *= (1 + WEATHER_EFFECTS[weather].attack_modifier);
  damage /= (1 + WEATHER_EFFECTS[weather].defense_modifier);
  
  // Apply formation effects
  damage *= (1 + FORMATIONS[formation].attack_modifier);
  damage /= (1 + FORMATIONS[formation].defense_modifier);
  
  // Apply special ability effects
  if (specialAbility && SPECIAL_ABILITIES[specialAbility]) {
    damage *= (1 + SPECIAL_ABILITIES[specialAbility].attack_modifier);
    damage /= (1 + SPECIAL_ABILITIES[specialAbility].defense_modifier);
  }
  
  // Apply level effects
  damage *= (1 + (attacker.level - 1) * COMBAT_CONSTANTS.LEVEL_UP_STAT_INCREASE);
  damage /= (1 + (defender.level - 1) * COMBAT_CONSTANTS.LEVEL_UP_STAT_INCREASE);
  
  // Check for critical hit
  let isCritical = Math.random() < COMBAT_CONSTANTS.CRITICAL_HIT_CHANCE;
  if (isCritical) {
    damage *= COMBAT_CONSTANTS.CRITICAL_HIT_MULTIPLIER;
  }
  
  // Calculate experience gained
  const experienceGained = Math.ceil(COMBAT_CONSTANTS.EXPERIENCE_PER_COMBAT * (defender.level / attacker.level));
  
  // Round damage to integer
  damage = Math.round(damage);
  
  return {
    damage,
    isCritical,
    experienceGained,
  };
}

/**
 * Apply damage to a unit and update its state
 * 
 * @param {Object} unit - The unit to update
 * @param {number} damage - The damage to apply
 * @param {number} experienceGained - The experience gained
 * @returns {Object} - Updated unit
 */
function updateUnitAfterCombat(unit, damage, experienceGained) {
  // Apply damage
  unit.health -= damage;
  
  // Check if unit is defeated
  if (unit.health <= 0) {
    unit.health = 0;
    unit.status = 'defeated';
    return unit;
  }
  
  // Add experience
  unit.experience += experienceGained;
  
  // Check for level up
  if (unit.experience >= COMBAT_CONSTANTS.EXPERIENCE_FOR_LEVEL_UP && unit.level < COMBAT_CONSTANTS.MAX_LEVEL) {
    unit.level += 1;
    unit.experience = 0;
    unit.attack *= (1 + COMBAT_CONSTANTS.LEVEL_UP_STAT_INCREASE);
    unit.defense *= (1 + COMBAT_CONSTANTS.LEVEL_UP_STAT_INCREASE);
    unit.status = 'leveled_up';
  } else {
    unit.status = 'damaged';
  }
  
  return unit;
}

/**
 * Execute a combat between two units
 * 
 * @param {string} attackerUri - URI of the attacking unit
 * @param {string} defenderUri - URI of the defending unit
 * @param {Object} options - Combat options
 * @returns {Object} - Combat result
 */
function executeCombat(attackerUri, defenderUri, options = {}) {
  // Load units from the game state
  const gameRepoDir = process.env.GAME_REPO_DIR || path.join(process.cwd(), 'game-repo');
  
  try {
    // Read the units file
    const unitsFilePath = path.join(gameRepoDir, 'units.ttl');
    const unitsContent = fs.readFileSync(unitsFilePath, 'utf8');
    
    // Extract attacker and defender data
    const attacker = extractUnitData(unitsContent, attackerUri);
    const defender = extractUnitData(unitsContent, defenderUri);
    
    if (!attacker || !defender) {
      throw new Error(`Could not find units: ${attackerUri}, ${defenderUri}`);
    }
    
    // Calculate combat result
    const attackResult = calculateAttackDamage(attacker, defender, options);
    
    // Update units after combat
    const updatedDefender = updateUnitAfterCombat(defender, attackResult.damage, 0);
    const updatedAttacker = updateUnitAfterCombat(attacker, 0, attackResult.experienceGained);
    
    // Update the game state
    updateUnitInGameState(unitsContent, unitsFilePath, updatedAttacker);
    updateUnitInGameState(unitsContent, unitsFilePath, updatedDefender);
    
    // Commit the changes
    const commitMessage = `Combat: ${attackerUri} attacked ${defenderUri} for ${attackResult.damage} damage`;
    execSync(`cd ${gameRepoDir} && git add units.ttl && git commit -m "${commitMessage}"`, { stdio: 'inherit' });
    
    return {
      attacker: updatedAttacker,
      defender: updatedDefender,
      damage: attackResult.damage,
      isCritical: attackResult.isCritical,
      experienceGained: attackResult.experienceGained,
    };
  } catch (error) {
    console.error(`Error executing combat: ${error.message}`);
    throw error;
  }
}

/**
 * Extract unit data from the units file
 * 
 * @param {string} unitsContent - Content of the units file
 * @param {string} unitUri - URI of the unit to extract
 * @returns {Object|null} - Unit data or null if not found
 */
function extractUnitData(unitsContent, unitUri) {
  // Simple regex-based extraction (in a real implementation, use a proper RDF parser)
  const unitRegex = new RegExp(`${unitUri}[\\s\\S]*?\\n\\n`, 'g');
  const unitMatch = unitsContent.match(unitRegex);
  
  if (!unitMatch) {
    return null;
  }
  
  const unitData = unitMatch[0];
  
  // Extract unit properties
  const typeMatch = unitData.match(/game:type\\s+"([^"]+)"/);
  const healthMatch = unitData.match(/game:health\\s+(\\d+)/);
  const attackMatch = unitData.match(/game:attack\\s+(\\d+)/);
  const defenseMatch = unitData.match(/game:defense\\s+(\\d+)/);
  const levelMatch = unitData.match(/game:level\\s+(\\d+)/);
  const experienceMatch = unitData.match(/game:experience\\s+(\\d+)/);
  
  return {
    uri: unitUri,
    type: typeMatch ? typeMatch[1] : 'infantry',
    health: healthMatch ? parseInt(healthMatch[1]) : 100,
    attack: attackMatch ? parseInt(attackMatch[1]) : COMBAT_CONSTANTS.BASE_ATTACK_DAMAGE,
    defense: defenseMatch ? parseInt(defenseMatch[1]) : COMBAT_CONSTANTS.BASE_DEFENSE,
    level: levelMatch ? parseInt(levelMatch[1]) : 1,
    experience: experienceMatch ? parseInt(experienceMatch[1]) : 0,
    status: 'active',
  };
}

/**
 * Update a unit in the game state
 * 
 * @param {string} unitsContent - Content of the units file
 * @param {string} unitsFilePath - Path to the units file
 * @param {Object} unit - Updated unit data
 */
function updateUnitInGameState(unitsContent, unitsFilePath, unit) {
  // Simple regex-based replacement (in a real implementation, use a proper RDF parser)
  const unitRegex = new RegExp(`${unit.uri}[\\s\\S]*?\\n\\n`, 'g');
  
  const updatedUnitData = `${unit.uri} a game:Unit;
  game:type "${unit.type}";
  game:health ${unit.health};
  game:attack ${Math.round(unit.attack)};
  game:defense ${Math.round(unit.defense)};
  game:level ${unit.level};
  game:experience ${unit.experience}.

`;
  
  const updatedUnitsContent = unitsContent.replace(unitRegex, updatedUnitData);
  
  fs.writeFileSync(unitsFilePath, updatedUnitsContent, 'utf8');
}

/**
 * Enhanced attack function for the MCP server
 * 
 * @param {Object} params - Attack parameters
 * @returns {Object} - Attack result
 */
function enhancedAttack(params) {
  const { attackerUri, defenderUri, terrain, weather, formation, specialAbility } = params;
  
  return executeCombat(attackerUri, defenderUri, {
    terrain,
    weather,
    formation,
    specialAbility,
  });
}

/**
 * Initialize the combat system
 * 
 * @returns {Object} - Combat system API
 */
function initCombatSystem() {
  return {
    calculateAttackDamage,
    updateUnitAfterCombat,
    executeCombat,
    enhancedAttack,
    COMBAT_CONSTANTS,
    UNIT_TYPE_ADVANTAGES,
    TERRAIN_EFFECTS,
    WEATHER_EFFECTS,
    SPECIAL_ABILITIES,
    FORMATIONS,
  };
}

module.exports = {
  initCombatSystem,
  enhancedAttack,
};