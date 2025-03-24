const { program } = require('commander');
const fs = require('fs').promises;
const path = require('path');
const terrain = require('./terrain');
const visibility = require('./visibility');

program
  .command('generate-map')
  .description('Generate an HTML visualization of the game map')
  .action(async () => {
    console.log('Generating map visualization...');
    
    const gameRepoDir = 'C:/Users/markj/Desktop/game-repo';
    const outputPath = path.join(gameRepoDir, 'map-view.html');
    
    try {
      // Load game data
      const worldData = await loadWorldData();
      const unitsData = await loadUnitsData();
      const buildingsData = await loadBuildingsData();
      const resourceNodesData = await loadResourceNodesData();
      const terrainData = await loadTerrainData();
      const visibilityData = await loadVisibilityData();
      
      // Generate HTML
      const html = generateMapHtml(worldData, unitsData, buildingsData, resourceNodesData, terrainData, visibilityData);
      
      // Write HTML to file
      await fs.writeFile(outputPath, html);
      
      console.log(`Map visualization generated at ${outputPath}`);
      console.log('Open this file in a web browser to view the map.');
    } catch (error) {
      console.error(`Error generating map: ${error.message}`);
    }
  });

program
  .command('generate-map-with-fog <playerUri>')
  .description('Generate an HTML visualization of the game map with fog of war for a specific player')
  .action(async (playerUri) => {
    console.log(`Generating map visualization with fog of war for ${playerUri}...`);
    
    // Update visibility data first
    await visibility.updateExploredCells(playerUri);
    await visibility.updateVisibleEntities(playerUri);
    
    const gameRepoDir = 'C:/Users/markj/Desktop/game-repo';
    const outputPath = path.join(gameRepoDir, 'map-view.html');
    
    try {
      // Load game data
      const worldData = await loadWorldData();
      const unitsData = await loadUnitsData();
      const buildingsData = await loadBuildingsData();
      const resourceNodesData = await loadResourceNodesData();
      const terrainData = await loadTerrainData();
      const visibilityData = await loadVisibilityData(playerUri);
      
      // Generate HTML
      const html = generateMapHtml(world, unitsData, buildingsData, resourceNodesData, terrainData, visibilityData, playerUri);
      
      // Write HTML to file
      await fs.writeFile(outputPath, html);
      
      console.log(`Map visualization generated at ${outputPath}`);
      console.log('Open this file in a web browser to view the map.');
    } catch (error) {
      console.error(`Error generating map: ${error.message}`);
    }
  });

// Load world data
async function loadWorldData() {
  const gameRepoDir = 'C:/Users/markj/Desktop/game-repo';
  const worldPath = path.join(gameRepoDir, 'world.ttl');
  
  try {
    const content = await fs.readFile(worldPath, 'utf8');
    const sizeMatch = content.match(/game:size (\d+)/);
    const nameMatch = content.match(/game:name "([^"]+)"/);
    
    return {
      name: nameMatch ? nameMatch[1] : 'Game World',
      size: sizeMatch ? parseInt(sizeMatch[1]) : 100
    };
  } catch (error) {
    console.error(`Error loading world data: ${error.message}`);
    return { name: 'Game World', size: 100 };
  }
}

// Load units data
async function loadUnitsData() {
  const gameRepoDir = 'C:/Users/markj/Desktop/game-repo';
  const unitsPath = path.join(gameRepoDir, 'units.ttl');
  
  try {
    const content = await fs.readFile(unitsPath, 'utf8');
    const units = [];
    
    // Match all units
    const unitMatches = content.matchAll(/game:unit\d+ a game:Unit;[\s\S]*?game:name "([^"]+)";[\s\S]*?game:attack (\d+);[\s\S]*?game:defense (\d+);[\s\S]*?game:health (\d+);[\s\S]*?game:location "{x: (\d+), y: (\d+)}"/g);
    
    for (const match of unitMatches) {
      units.push({
        name: match[1],
        attack: parseInt(match[2]),
        defense: parseInt(match[3]),
        health: parseInt(match[4]),
        x: parseInt(match[5]),
        y: parseInt(match[6])
      });
    }
    
    return units;
  } catch (error) {
    console.error(`Error loading units data: ${error.message}`);
    return [];
  }
}

// Load buildings data
async function loadBuildingsData() {
  const gameRepoDir = 'C:/Users/markj/Desktop/game-repo';
  const buildingsPath = path.join(gameRepoDir, 'buildings.ttl');
  
  try {
    const content = await fs.readFile(buildingsPath, 'utf8');
    const buildings = [];
    
    // Match all buildings
    const buildingMatches = content.matchAll(/game:building\d+ a game:Building;[\s\S]*?game:type "([^"]+)";[\s\S]*?game:owner ([^;]+);[\s\S]*?game:health (\d+);[\s\S]*?game:location "{x: (\d+), y: (\d+)}"/g);
    
    for (const match of buildingMatches) {
      buildings.push({
        type: match[1],
        owner: match[2],
        health: parseInt(match[3]),
        x: parseInt(match[4]),
        y: parseInt(match[5])
      });
    }
    
    return buildings;
  } catch (error) {
    console.error(`Error loading buildings data: ${error.message}`);
    return [];
  }
}

// Load resource nodes data
async function loadResourceNodesData() {
  const gameRepoDir = 'C:/Users/markj/Desktop/game-repo';
  const resourceNodesPath = path.join(gameRepoDir, 'resource_nodes.ttl');
  
  try {
    const content = await fs.readFile(resourceNodesPath, 'utf8');
    const resourceNodes = [];
    
    // Match all resource nodes
    const nodeMatches = content.matchAll(/game:(\w+\d+) a game:ResourceNode;[\s\S]*?game:type "([^"]+)";[\s\S]*?game:amount (\d+);[\s\S]*?game:location "{x: (\d+), y: (\d+)}"/g);
    
    for (const match of nodeMatches) {
      resourceNodes.push({
        id: match[1],
        type: match[2],
        amount: parseInt(match[3]),
        x: parseInt(match[4]),
        y: parseInt(match[5])
      });
    }
    
    return resourceNodes;
  } catch (error) {
    console.error(`Error loading resource nodes data: ${error.message}`);
    return [];
  }
}

// Load terrain data
async function loadTerrainData() {
  const gameRepoDir = 'C:/Users/markj/Desktop/game-repo';
  const terrainPath = path.join(gameRepoDir, 'terrain.ttl');
  
  try {
    const content = await fs.readFile(terrainPath, 'utf8');
    const terrainCells = [];
    
    // Match all terrain cells
    const cellMatches = content.matchAll(/game:terrain_(\d+)_(\d+) a game:TerrainCell;[\s\S]*?game:terrainType game:(\w+Terrain)/g);
    
    for (const match of cellMatches) {
      terrainCells.push({
        x: parseInt(match[1]),
        y: parseInt(match[2]),
        type: match[3]
      });
    }
    
    // Get default terrain type
    const defaultMatch = content.match(/game:defaultTerrain a game:DefaultTerrain;[\s\S]*?game:terrainType game:(\w+Terrain)/);
    const defaultType = defaultMatch ? defaultMatch[1] : 'PlainsTerrain';
    
    return {
      cells: terrainCells,
      defaultType: defaultType
    };
  } catch (error) {
    console.error(`Error loading terrain data: ${error.message}`);
    return {
      cells: [],
      defaultType: 'PlainsTerrain'
    };
  }
}

// Load visibility data
async function loadVisibilityData(playerUri = 'game:player1') {
  const gameRepoDir = 'C:/Users/markj/Desktop/game-repo';
  const visibilityPath = path.join(gameRepoDir, 'visibility.ttl');
  
  try {
    const content = await fs.readFile(visibilityPath, 'utf8');
    
    // Get visibility settings
    const settingsMatch = content.match(new RegExp(`${playerUri} a game:Player;[\\s\\S]*?game:visibilitySettings ([^.]+)`));
    const settingsUri = settingsMatch ? settingsMatch[1] : null;
    
    let fogOfWarEnabled = true;
    let defaultVisibilityRange = 5;
    
    if (settingsUri) {
      const fogOfWarMatch = content.match(new RegExp(`${settingsUri} a game:VisibilitySettings;[\\s\\S]*?game:fogOfWarEnabled "([^"]+)"`));
      const visibilityRangeMatch = content.match(new RegExp(`${settingsUri} a game:VisibilitySettings;[\\s\\S]*?game:defaultVisibilityRange (\\d+)`));
      
      fogOfWarEnabled = fogOfWarMatch ? fogOfWarMatch[1] === 'true' : true;
      defaultVisibilityRange = visibilityRangeMatch ? parseInt(visibilityRangeMatch[1]) : 5;
    }
    
    // Get explored cells
    const exploredCells = [];
    const cellMatches = content.matchAll(/game:terrain_(\d+)_(\d+) game:exploredBy game:player1/g);
    
    for (const match of cellMatches) {
      exploredCells.push({
        x: parseInt(match[1]),
        y: parseInt(match[2])
      });
    }
    
    return {
      fogOfWarEnabled,
      defaultVisibilityRange,
      exploredCells
    };
  } catch (error) {
    console.error(`Error loading visibility data: ${error.message}`);
    return {
      fogOfWarEnabled: true,
      defaultVisibilityRange: 5,
      exploredCells: []
    };
  }
}

// Generate HTML for the map
function generateMapHtml(world, units, buildings, resourceNodes, terrain, visibility, playerUri = 'game:player1') {
  const cellSize = 10; // Size of each cell in pixels
  const mapSize = world.size * cellSize;
  
  // Get terrain color
  function getTerrainColor(terrainType) {
    switch (terrainType) {
      case 'PlainsTerrain':
        return '#90EE90'; // Light green
      case 'ForestTerrain':
        return '#228B22'; // Forest green
      case 'MountainTerrain':
        return '#A0522D'; // Brown
      case 'WaterTerrain':
        return '#1E90FF'; // Blue
      default:
        return '#90EE90'; // Default to plains
    }
  }
  
  // Get resource node color
  function getResourceNodeColor(resourceType) {
    switch (resourceType) {
      case 'gold':
        return '#FFD700'; // Gold
      case 'wood':
        return '#8B4513'; // Brown
      case 'stone':
        return '#708090'; // Slate gray
      case 'food':
        return '#32CD32'; // Lime green
      default:
        return '#FFFFFF'; // White
    }
  }
  
  // Check if a cell is explored
  function isCellExplored(x, y) {
    if (!visibility || !visibility.fogOfWarEnabled) {
      return true; // No fog of war
    }
    
    return visibility.exploredCells.some(cell => cell.x === x && cell.y === y);
  }
  
  // Generate HTML
  let html = `
<!DOCTYPE html>
<html>
<head>
  <title>${world.name} - Map Viewer</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 20px;
    }
    .map-container {
      position: relative;
      width: ${mapSize}px;
      height: ${mapSize}px;
      border: 1px solid #000;
      background-color: #90EE90; /* Default plains color */
    }
    .terrain-cell {
      position: absolute;
      width: ${cellSize}px;
      height: ${cellSize}px;
    }
    .unit {
      position: absolute;
      width: ${cellSize}px;
      height: ${cellSize}px;
      background-color: #FF0000;
      border-radius: 50%;
      text-align: center;
      line-height: ${cellSize}px;
      font-size: 8px;
      color: white;
      z-index: 3;
    }
    .building {
      position: absolute;
      width: ${cellSize}px;
      height: ${cellSize}px;
      background-color: #000000;
      text-align: center;
      line-height: ${cellSize}px;
      font-size: 8px;
      color: white;
      z-index: 2;
    }
    .resource-node {
      position: absolute;
      width: ${cellSize}px;
      height: ${cellSize}px;
      border-radius: 50%;
      text-align: center;
      line-height: ${cellSize}px;
      font-size: 8px;
      color: white;
      z-index: 1;
    }
    .fog-of-war {
      position: absolute;
      width: ${cellSize}px;
      height: ${cellSize}px;
      background-color: #000000;
      opacity: 0.7;
      z-index: 4;
    }
    .legend {
      margin-top: 20px;
    }
    .legend-item {
      display: inline-block;
      margin-right: 20px;
    }
    .legend-color {
      display: inline-block;
      width: 20px;
      height: 20px;
      margin-right: 5px;
      vertical-align: middle;
    }
  </style>
</head>
<body>
  <h1>${world.name} - Map Viewer${visibility && visibility.fogOfWarEnabled ? ' (Fog of War Enabled)' : ''}</h1>
  <h1>${world.name} - Map Viewer</h1>
  <div class="map-container">
`;

  // Add terrain cells
  for (const cell of terrain.cells) {
    const left = cell.x * cellSize;
    const top = cell.y * cellSize;
    
    // Only show terrain if the cell is explored
    const isExplored = isCellExplored(cell.x, cell.y);
    const color = isExplored ? getTerrainColor(cell.type) : '#000000';
    
    html += `    <div class="terrain-cell" style="left: ${left}px; top: ${top}px; background-color: ${color};" title="Terrain: ${cell.type} at (${cell.x}, ${cell.y})"></div>\n`;
  }
  
  // Add resource nodes
  for (const node of resourceNodes) {
    const left = node.x * cellSize;
    const top = node.y * cellSize;
    const color = getResourceNodeColor(node.type);

    
// Only show resource nodes if the cell is explored
    if (!isCellExplored(node.x, node.y)) continue;

    html += `    <div class="resource-node" style="left: ${left}px; top: ${top}px; background-color: ${color};" title="${node.type} (${node.amount}) at (${node.x}, ${node.y})"></div>\n`;
  }
  
  // Add buildings
  for (const building of buildings) {
    const left = building.x * cellSize;
    const top = building.y * cellSize;

    // Only show buildings if the cell is explored
    if (!isCellExplored(building.x, building.y)) continue;
    
    html += `    <div class="building" style="left: ${left}px; top: ${top}px;" title="${building.type} (${building.health} HP) at (${building.x}, ${building.y})"></div>\n`;
  }
  
  // Add units
  for (const unit of units) {
    const left = unit.x * cellSize;
    const top = unit.y * cellSize;

    // Only show units if the cell is explored
    if (!isCellExplored(unit.x, unit.y)) continue;
    
    html += `    <div class="unit" style="left: ${left}px; top: ${top}px;" title="${unit.name} (${unit.health} HP, ${unit.attack} ATK, ${unit.defense} DEF) at (${unit.x}, ${unit.y})"></div>\n`;
  }
  
  // Add fog of war
  if (visibility && visibility.fogOfWarEnabled) {
    // Create a grid of cells
    for (let x = 0; x < world.size; x++) {
      for (let y = 0; y < world.size; y++) {
        // Add fog of war to unexplored cells
        if (!isCellExplored(x, y)) {
          html += `    <div class="fog-of-war" style="left: ${x * cellSize}px; top: ${y * cellSize}px;" title="Unexplored at (${x}, ${y})"></div>\n`;
        }
      }
    }
  }
  
  // Close map container and add legend
  html += `  </div>
  
  <div class="legend">
    <h2>Legend</h2>
    <div class="legend-item"><div class="legend-color" style="background-color: #90EE90;"></div> Plains</div>
    <div class="legend-item"><div class="legend-color" style="background-color: #228B22;"></div> Forest</div>
    <div class="legend-item"><div class="legend-color" style="background-color: #A0522D;"></div> Mountain</div>
    <div class="legend-item"><div class="legend-color" style="background-color: #1E90FF;"></div> Water</div>
    <br>
    <div class="legend-item"><div class="legend-color" style="background-color: #FF0000;"></div> Unit</div>
    <div class="legend-item"><div class="legend-color" style="background-color: #000000; opacity: 0.7;"></div> Fog of War</div>
    <div class="legend-item"><div class="legend-color" style="background-color: #000000;"></div> Building</div>
    <div class="legend-item"><div class="legend-color" style="background-color: #FFD700;"></div> Gold</div>
    <div class="legend-item"><div class="legend-color" style="background-color: #8B4513;"></div> Wood</div>
    <div class="legend-item"><div class="legend-color" style="background-color: #708090;"></div> Stone</div>
    <div class="legend-item"><div class="legend-color" style="background-color: #32CD32;"></div> Food</div>
  </div>
  
  <div class="info">
    <h2>Game Information</h2>
    <p>World Size: ${world.size} x ${world.size}</p>
    <p>Units: ${units.length}</p>
    <p>Buildings: ${buildings.length}</p>
    <p>Resource Nodes: ${resourceNodes.length}</p>
    <p>Terrain Cells: ${terrain.cells.length}</p>
    <p>Default Terrain: ${terrain.defaultType}</p>
    ${visibility ? `
    <h3>Visibility Information</h3>
    <p>Fog of War: ${visibility.fogOfWarEnabled ? 'Enabled' : 'Disabled'}</p>
    <p>Default Visibility Range: ${visibility.defaultVisibilityRange}</p>
    <p>Explored Cells: ${visibility.exploredCells.length}</p>` : ''}
  </div>
</body>
</html>
`;

  return html;
}

module.exports = program;