const { program } = require('commander');
const fs = require('fs').promises;
const { exec } = require('child_process');
const path = require('path');

// Cache for visibility data
let visibilityCache = null;
let exploredCellsCache = null;
let visibleEntitiesCache = null;

// Get visibility settings for a player
async function getPlayerVisibilitySettings(playerUri) {
  const gameRepoDir = 'C:/Users/markj/Desktop/game-repo';
  const visibilityPath = `${gameRepoDir}/visibility.ttl`;

  try {
    const visibilityContent = await fs.readFile(visibilityPath, 'utf8');
    
    // Extract visibility settings
    const settingsMatch = visibilityContent.match(new RegExp(`${playerUri} a game:Player;[\\s\\S]*?game:visibilitySettings ([^.]+)`));
    if (!settingsMatch) {
      console.error(`No visibility settings found for ${playerUri}`);
      return { fogOfWarEnabled: true, defaultVisibilityRange: 5 };
    }
    
    const settingsUri = settingsMatch[1];
    const fogOfWarMatch = visibilityContent.match(new RegExp(`${settingsUri} a game:VisibilitySettings;[\\s\\S]*?game:fogOfWarEnabled "([^"]+)"`));
    const visibilityRangeMatch = visibilityContent.match(new RegExp(`${settingsUri} a game:VisibilitySettings;[\\s\\S]*?game:defaultVisibilityRange (\\d+)`));
    
    return {
      fogOfWarEnabled: fogOfWarMatch ? fogOfWarMatch[1] === 'true' : true,
      defaultVisibilityRange: visibilityRangeMatch ? parseInt(visibilityRangeMatch[1]) : 5
    };
  } catch (error) {
    console.error(`Error loading visibility settings: ${error.message}`);
    return { fogOfWarEnabled: true, defaultVisibilityRange: 5 };
  }
}

// Get all terrain cells explored by a player
async function getExploredCells(playerUri) {
  if (exploredCellsCache && exploredCellsCache.playerUri === playerUri) {
    return exploredCellsCache.cells;
  }

  const gameRepoDir = 'C:/Users/markj/Desktop/game-repo';
  const visibilityPath = `${gameRepoDir}/visibility.ttl`;

  try {
    const visibilityContent = await fs.readFile(visibilityPath, 'utf8');
    
    // Extract explored cells
    const exploredCells = [];
    const cellMatches = visibilityContent.matchAll(/game:terrain_(\d+)_(\d+) game:exploredBy game:player1/g);
    
    for (const match of cellMatches) {
      exploredCells.push({
        x: parseInt(match[1]),
        y: parseInt(match[2])
      });
    }
    
    exploredCellsCache = {
      playerUri,
      cells: exploredCells
    };
    
    return exploredCells;
  } catch (error) {
    console.error(`Error loading explored cells: ${error.message}`);
    return [];
  }
}

// Get all entities currently visible to a player
async function getVisibleEntities(playerUri) {
  if (visibleEntitiesCache && visibleEntitiesCache.playerUri === playerUri) {
    return visibleEntitiesCache.entities;
  }

  const gameRepoDir = 'C:/Users/markj/Desktop/game-repo';
  const visibilityPath = `${gameRepoDir}/visibility.ttl`;

  try {
    const visibilityContent = await fs.readFile(visibilityPath, 'utf8');
    
    // Extract visible entities
    const visibleEntities = [];
    const entityMatches = visibilityContent.matchAll(/game:([a-zA-Z0-9]+) game:visibleTo game:player1/g);
    
    for (const match of entityMatches) {
      visibleEntities.push(match[1]);
    }
    
    visibleEntitiesCache = {
      playerUri,
      entities: visibleEntities
    };
    
    return visibleEntities;
  } catch (error) {
    console.error(`Error loading visible entities: ${error.message}`);
    return [];
  }
}

// Check if a position is explored by a player
async function isPositionExplored(x, y, playerUri) {
  const exploredCells = await getExploredCells(playerUri);
  
  return exploredCells.some(cell => cell.x === x && cell.y === y);
}

// Check if an entity is visible to a player
async function isEntityVisible(entityUri, playerUri) {
  const visibleEntities = await getVisibleEntities(playerUri);
  
  return visibleEntities.includes(entityUri.replace('game:', ''));
}

// Get the visibility range of a unit
async function getUnitVisibilityRange(unitUri) {
  const gameRepoDir = 'C:/Users/markj/Desktop/game-repo';
  const visibilityPath = `${gameRepoDir}/visibility.ttl`;
  const unitsPath = `${gameRepoDir}/units.ttl`;

  try {
    const visibilityContent = await fs.readFile(visibilityPath, 'utf8');
    
    // Check for specific unit visibility range
    const unitRangeMatch = visibilityContent.match(new RegExp(`${unitUri} game:visibilityRange (\\d+)`));
    if (unitRangeMatch) {
      return parseInt(unitRangeMatch[1]);
    }
    
    // If no specific range, check unit type
    const unitsContent = await fs.readFile(unitsPath, 'utf8');
    const unitTypeMatch = unitsContent.match(new RegExp(`${unitUri} a game:Unit;[\\s\\S]*?game:name "([^"]+)"`));
    
    if (unitTypeMatch) {
      const unitType = unitTypeMatch[1];
      const typeRangeMatch = visibilityContent.match(new RegExp(`game:${unitType}Unit game:defaultVisibilityRange (\\d+)`));
      
      if (typeRangeMatch) {
        return parseInt(typeRangeMatch[1]);
      }
    }
    
    // Default visibility range
    return 5;
  } catch (error) {
    console.error(`Error getting unit visibility range: ${error.message}`);
    return 5;
  }
}

// Update explored cells based on unit positions
async function updateExploredCells(playerUri) {
  const gameRepoDir = 'C:/Users/markj/Desktop/game-repo';
  const unitsPath = `${gameRepoDir}/units.ttl`;
  const playerUnitsPath = `${gameRepoDir}/player_units.ttl`;
  const visibilityPath = `${gameRepoDir}/visibility.ttl`;

  try {
    // Get player units
    const playerUnitsContent = await fs.readFile(playerUnitsPath, 'utf8');
    const unitMatches = playerUnitsContent.match(new RegExp(`${playerUri} a game:Player;[\\s\\S]*?game:units ([^.]+)`, 'g'));
    
    if (!unitMatches) {
      console.error(`No units found for ${playerUri}`);
      return;
    }
    
    // Get unit positions and visibility ranges
    const unitsContent = await fs.readFile(unitsPath, 'utf8');
    const visibilityContent = await fs.readFile(visibilityPath, 'utf8');
    
    const unitPositions = [];
    
    for (const unitMatch of unitMatches) {
      const unitUri = unitMatch.match(/game:units (game:[a-zA-Z0-9]+)/)[1];
      const positionMatch = unitsContent.match(new RegExp(`${unitUri} a game:Unit;[\\s\\S]*?game:location "{x: (\\d+), y: (\\d+)}"`));
      
      if (positionMatch) {
        const x = parseInt(positionMatch[1]);
        const y = parseInt(positionMatch[2]);
        const visibilityRange = await getUnitVisibilityRange(unitUri);
        
        unitPositions.push({ unitUri, x, y, visibilityRange });
      }
    }
    
    // Calculate explored cells
    const exploredCells = new Set();
    
    for (const unit of unitPositions) {
      for (let dx = -unit.visibilityRange; dx <= unit.visibilityRange; dx++) {
        for (let dy = -unit.visibilityRange; dy <= unit.visibilityRange; dy++) {
          // Check if within visibility range (using Euclidean distance)
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance <= unit.visibilityRange) {
            const cellX = unit.x + dx;
            const cellY = unit.y + dy;
            
            // Ensure coordinates are non-negative
            if (cellX >= 0 && cellY >= 0) {
              exploredCells.add(`game:terrain_${cellX}_${cellY} game:exploredBy ${playerUri}.`);
            }
          }
        }
      }
    }
    
    // Update visibility.ttl
    let updatedVisibilityContent = visibilityContent;
    
    // Remove existing explored cells
    updatedVisibilityContent = updatedVisibilityContent.replace(/game:terrain_\d+_\d+ game:exploredBy game:player1\./g, '');
    
    // Add new explored cells
    const exploredCellsText = Array.from(exploredCells).join('\n');
    updatedVisibilityContent = updatedVisibilityContent.replace(/# Explored terrain cells for player1[^\n]*\n/, `# Explored terrain cells for player1\n${exploredCellsText}\n`);
    
    await fs.writeFile(visibilityPath, updatedVisibilityContent);
    
    // Clear cache
    exploredCellsCache = null;
    
    console.log(`Updated explored cells for ${playerUri}`);
  } catch (error) {
    console.error(`Error updating explored cells: ${error.message}`);
  }
}

// Update visible entities based on unit positions
async function updateVisibleEntities(playerUri) {
  const gameRepoDir = 'C:/Users/markj/Desktop/game-repo';
  const unitsPath = `${gameRepoDir}/units.ttl`;
  const buildingsPath = `${gameRepoDir}/buildings.ttl`;
  const resourceNodesPath = `${gameRepoDir}/resource_nodes.ttl`;
  const playerUnitsPath = `${gameRepoDir}/player_units.ttl`;
  const visibilityPath = `${gameRepoDir}/visibility.ttl`;

  try {
    // Get player units
    const playerUnitsContent = await fs.readFile(playerUnitsPath, 'utf8');
    const unitMatches = playerUnitsContent.match(new RegExp(`${playerUri} a game:Player;[\\s\\S]*?game:units ([^.]+)`, 'g'));
    
    if (!unitMatches) {
      console.error(`No units found for ${playerUri}`);
      return;
    }
    
    // Get unit positions and visibility ranges
    const unitsContent = await fs.readFile(unitsPath, 'utf8');
    
    const unitPositions = [];
    
    for (const unitMatch of unitMatches) {
      const unitUri = unitMatch.match(/game:units (game:[a-zA-Z0-9]+)/)[1];
      const positionMatch = unitsContent.match(new RegExp(`${unitUri} a game:Unit;[\\s\\S]*?game:location "{x: (\\d+), y: (\\d+)}"`));
      
      if (positionMatch) {
        const x = parseInt(positionMatch[1]);
        const y = parseInt(positionMatch[2]);
        const visibilityRange = await getUnitVisibilityRange(unitUri);
        
        unitPositions.push({ unitUri, x, y, visibilityRange });
      }
    }
    
    // Get all entities with positions
    const entities = [];
    
    // Units
    const allUnitMatches = unitsContent.matchAll(/game:(unit\d+) a game:Unit;[\s\S]*?game:location "{x: (\d+), y: (\d+)}"/g);
    for (const match of allUnitMatches) {
      entities.push({
        uri: `game:${match[1]}`,
        x: parseInt(match[2]),
        y: parseInt(match[3])
      });
    }
    
    // Buildings
    try {
      const buildingsContent = await fs.readFile(buildingsPath, 'utf8');
      const buildingMatches = buildingsContent.matchAll(/game:(building\d+) a game:Building;[\s\S]*?game:location "{x: (\d+), y: (\d+)}"/g);
      
      for (const match of buildingMatches) {
        entities.push({
          uri: `game:${match[1]}`,
          x: parseInt(match[2]),
          y: parseInt(match[3])
        });
      }
    } catch (error) {
      console.log('No buildings file found');
    }
    
    // Resource nodes
    try {
      const resourceNodesContent = await fs.readFile(resourceNodesPath, 'utf8');
      const nodeMatches = resourceNodesContent.matchAll(/game:(\w+\d+) a game:ResourceNode;[\s\S]*?game:location "{x: (\d+), y: (\d+)}"/g);
      
      for (const match of nodeMatches) {
        entities.push({
          uri: `game:${match[1]}`,
          x: parseInt(match[2]),
          y: parseInt(match[3])
        });
      }
    } catch (error) {
      console.log('No resource nodes file found');
    }
    
    // Calculate visible entities
    const visibleEntities = new Set();
    
    // Player's own units are always visible
    for (const unitMatch of unitMatches) {
      const unitUri = unitMatch.match(/game:units (game:[a-zA-Z0-9]+)/)[1];
      visibleEntities.add(`${unitUri} game:visibleTo ${playerUri}.`);
    }
    
    // Check visibility for other entities
    for (const entity of entities) {
      for (const unit of unitPositions) {
        // Calculate distance
        const dx = entity.x - unit.x;
        const dy = entity.y - unit.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance <= unit.visibilityRange) {
          visibleEntities.add(`${entity.uri} game:visibleTo ${playerUri}.`);
          break;
        }
      }
    }
    
    // Update visibility.ttl
    const visibilityContent = await fs.readFile(visibilityPath, 'utf8');
    let updatedVisibilityContent = visibilityContent;
    
    // Remove existing visible entities
    updatedVisibilityContent = updatedVisibilityContent.replace(/game:[a-zA-Z0-9]+ game:visibleTo game:player1\./g, '');
    
    // Add new visible entities
    const visibleEntitiesText = Array.from(visibleEntities).join('\n');
    updatedVisibilityContent = updatedVisibilityContent.replace(/# Currently visible entities for player1[^\n]*\n/, `# Currently visible entities for player1\n${visibleEntitiesText}\n`);
    
    await fs.writeFile(visibilityPath, updatedVisibilityContent);
    
    // Clear cache
    visibleEntitiesCache = null;
    
    console.log(`Updated visible entities for ${playerUri}`);
  } catch (error) {
    console.error(`Error updating visible entities: ${error.message}`);
  }
}

// Command to update visibility
program
  .command('update-visibility <playerUri>')
  .description('Update explored cells and visible entities for a player')
  .action(async (playerUri) => {
    console.log(`Updating visibility for ${playerUri}...`);
    
    try {
      await updateExploredCells(playerUri);
      await updateVisibleEntities(playerUri);
      
      console.log(`Visibility updated for ${playerUri}`);
    } catch (error) {
      console.error(`Error updating visibility: ${error.message}`);
    }
  });

// Command to check if a position is explored
program
  .command('is-explored <x> <y> <playerUri>')
  .description('Check if a position is explored by a player')
  .action(async (x, y, playerUri) => {
    const xCoord = parseInt(x);
    const yCoord = parseInt(y);
    
    console.log(`Checking if position (${xCoord}, ${yCoord}) is explored by ${playerUri}...`);
    
    try {
      const explored = await isPositionExplored(xCoord, yCoord, playerUri);
      
      console.log(`Position (${xCoord}, ${yCoord}) is ${explored ? 'explored' : 'not explored'} by ${playerUri}`);
    } catch (error) {
      console.error(`Error checking exploration: ${error.message}`);
    }
  });

// Command to check if an entity is visible
program
  .command('is-visible <entityUri> <playerUri>')
  .description('Check if an entity is visible to a player')
  .action(async (entityUri, playerUri) => {
    console.log(`Checking if ${entityUri} is visible to ${playerUri}...`);
    
    try {
      const visible = await isEntityVisible(entityUri, playerUri);
      
      console.log(`${entityUri} is ${visible ? 'visible' : 'not visible'} to ${playerUri}`);
    } catch (error) {
      console.error(`Error checking visibility: ${error.message}`);
    }
  });

// Export functions for use in other modules
module.exports = {
  getPlayerVisibilitySettings,
  getExploredCells,
  getVisibleEntities,
  isPositionExplored,
  isEntityVisible,
  getUnitVisibilityRange,
  updateExploredCells,
  updateVisibleEntities,
  program
};