const { program } = require('commander');
const fs = require('fs').promises;
const { exec } = require('child_process');
const path = require('path');

// Cache for terrain data
let terrainCache = null;
let terrainCellCache = null;

// Get terrain data from the ontology
async function getTerrainTypes() {
  if (terrainCache) {
    return terrainCache;
  }

  const gameRepoDir = 'C:/Users/markj/Desktop/game-repo';
  const ontologyPath = `${gameRepoDir}/game-ontology.owl`;

  try {
    const ontologyContent = await fs.readFile(ontologyPath, 'utf8');
    
    // Extract terrain types and their modifiers
    const terrainTypes = {};
    
    // Match all terrain individuals
    const terrainMatches = ontologyContent.matchAll(/game:(\w+Terrain) a game:Terrain[\s\S]*?game:movementModifier "([^"]+)"[\s\S]*?game:gatheringModifier "([^"]+)"[\s\S]*?game:combatModifier "([^"]+)"/g);
    
    for (const match of terrainMatches) {
      const terrainName = match[1];
      terrainTypes[terrainName] = {
        movementModifier: parseFloat(match[2]),
        gatheringModifier: parseFloat(match[3]),
        combatModifier: parseFloat(match[4])
      };
    }
    
    terrainCache = terrainTypes;
    return terrainTypes;
  } catch (error) {
    console.error('Error loading terrain types:', error.message);
    // Default terrain modifiers if ontology can't be loaded
    return {
      PlainsTerrain: { movementModifier: 1.0, gatheringModifier: 1.0, combatModifier: 1.0 },
      ForestTerrain: { movementModifier: 0.7, gatheringModifier: 1.2, combatModifier: 0.8 },
      MountainTerrain: { movementModifier: 0.5, gatheringModifier: 0.8, combatModifier: 1.2 },
      WaterTerrain: { movementModifier: 0.3, gatheringModifier: 0.5, combatModifier: 0.6 }
    };
  }
}

// Get terrain cells from the terrain.ttl file
async function getTerrainCells() {
  if (terrainCellCache) {
    return terrainCellCache;
  }

  const gameRepoDir = 'C:/Users/markj/Desktop/game-repo';
  const terrainPath = `${gameRepoDir}/terrain.ttl`;

  try {
    const terrainContent = await fs.readFile(terrainPath, 'utf8');
    
    // Extract terrain cells and their positions
    const terrainCells = {};
    
    // Match all terrain cells
    const cellMatches = terrainContent.matchAll(/game:terrain_(\d+)_(\d+) a game:TerrainCell;[\s\S]*?game:terrainType game:(\w+Terrain)/g);
    
    for (const match of cellMatches) {
      const x = parseInt(match[1]);
      const y = parseInt(match[2]);
      const terrainType = match[3];
      
      terrainCells[`${x},${y}`] = terrainType;
    }
    
    // Get default terrain type
    const defaultMatch = terrainContent.match(/game:defaultTerrain a game:DefaultTerrain;[\s\S]*?game:terrainType game:(\w+Terrain)/);
    const defaultTerrainType = defaultMatch ? defaultMatch[1] : 'PlainsTerrain';
    
    terrainCellCache = {
      cells: terrainCells,
      defaultType: defaultTerrainType
    };
    
    return terrainCellCache;
  } catch (error) {
    console.error('Error loading terrain cells:', error.message);
    // Default to plains if terrain.ttl can't be loaded
    return {
      cells: {},
      defaultType: 'PlainsTerrain'
    };
  }
}

// Get the terrain type at a specific position
async function getTerrainAtPosition(x, y) {
  const terrainCells = await getTerrainCells();
  const key = `${x},${y}`;
  
  // Return the terrain type at the position, or the default type if not found
  return terrainCells.cells[key] || terrainCells.defaultType;
}

// Get the terrain modifier for a specific action at a position
async function getTerrainModifier(x, y, actionType) {
  const terrainType = await getTerrainAtPosition(x, y);
  const terrainTypes = await getTerrainTypes();
  
  // Get the terrain modifiers
  const modifiers = terrainTypes[terrainType] || terrainTypes['PlainsTerrain'];
  
  // Return the modifier for the specified action
  switch (actionType) {
    case 'movement':
      return modifiers.movementModifier;
    case 'gathering':
      return modifiers.gatheringModifier;
    case 'combat':
      return modifiers.combatModifier;
    default:
      return 1.0; // Default modifier
  }
}

// Calculate the movement cost between two positions
async function calculateMovementCost(fromX, fromY, toX, toY) {
  // Calculate the base distance (Euclidean distance)
  const distance = Math.sqrt(Math.pow(toX - fromX, 2) + Math.pow(toY - fromY, 2));
  
  // Get the terrain modifier at the destination
  const terrainModifier = await getTerrainModifier(toX, toY, 'movement');
  
  // Calculate the movement cost
  return distance / terrainModifier;
}

// Command to get terrain information at a position
program
  .command('get-terrain <x> <y>')
  .description('Get terrain information at a specific position')
  .action(async (x, y) => {
    const xCoord = parseInt(x);
    const yCoord = parseInt(y);
    
    console.log(`Getting terrain information at position (${xCoord}, ${yCoord})...`);
    
    try {
      const terrainType = await getTerrainAtPosition(xCoord, yCoord);
      const movementModifier = await getTerrainModifier(xCoord, yCoord, 'movement');
      const gatheringModifier = await getTerrainModifier(xCoord, yCoord, 'gathering');
      const combatModifier = await getTerrainModifier(xCoord, yCoord, 'combat');
      
      console.log(`Terrain at (${xCoord}, ${yCoord}): ${terrainType}`);
      console.log(`Movement modifier: ${movementModifier}`);
      console.log(`Gathering modifier: ${gatheringModifier}`);
      console.log(`Combat modifier: ${combatModifier}`);
    } catch (error) {
      console.error(`Error getting terrain information: ${error.message}`);
    }
  });

// Command to calculate movement cost between two positions
program
  .command('movement-cost <fromX> <fromY> <toX> <toY>')
  .description('Calculate the movement cost between two positions')
  .action(async (fromX, fromY, toX, toY) => {
    const fromXCoord = parseInt(fromX);
    const fromYCoord = parseInt(fromY);
    const toXCoord = parseInt(toX);
    const toYCoord = parseInt(toY);
    
    console.log(`Calculating movement cost from (${fromXCoord}, ${fromYCoord}) to (${toXCoord}, ${toYCoord})...`);
    
    try {
      const movementCost = await calculateMovementCost(fromXCoord, fromYCoord, toXCoord, toYCoord);
      console.log(`Movement cost: ${movementCost.toFixed(2)}`);
    } catch (error) {
      console.error(`Error calculating movement cost: ${error.message}`);
    }
  });

// Export functions for use in other modules
module.exports = {
  getTerrainAtPosition,
  getTerrainModifier,
  calculateMovementCost,
  program
};