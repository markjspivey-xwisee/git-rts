// Interactive map functionality for Git-RTS

// Note: All game state variables and DOM elements are declared in index.html
// This file uses those existing variables without redeclaring them

// Initialize interactive map
function initInteractiveMap() {
    console.log('Initializing interactive map...');
    
    // Canvas and context are already initialized in index.html
    // Just verify they exist
    if (!canvas) {
        console.error('Canvas element not found');
        return;
    }
    
    // Create action panel if it doesn't exist
    if (!document.getElementById('actionPanel')) {
        const actionPanel = document.createElement('div');
        actionPanel.id = 'actionPanel';
        actionPanel.className = 'action-panel';
        actionPanel.style.marginTop = '10px';
        actionPanel.style.padding = '10px';
        actionPanel.style.backgroundColor = '#f0f0f0';
        actionPanel.style.borderRadius = '5px';
        actionPanel.style.display = 'none';
        
        const moveButton = document.createElement('button');
        moveButton.id = 'moveButton';
        moveButton.className = 'action-button';
        moveButton.textContent = 'Move';
        moveButton.style.marginRight = '5px';
        moveButton.style.padding = '5px 10px';
        moveButton.style.cursor = 'pointer';
        
        const attackButton = document.createElement('button');
        attackButton.id = 'attackButton';
        attackButton.className = 'action-button';
        attackButton.textContent = 'Attack';
        attackButton.style.marginRight = '5px';
        attackButton.style.padding = '5px 10px';
        attackButton.style.cursor = 'pointer';
        
        actionPanel.appendChild(moveButton);
        actionPanel.appendChild(attackButton);
        canvas.parentNode.appendChild(actionPanel);
        
        // Add event listeners to buttons
        moveButton.addEventListener('click', function() {
            this.classList.toggle('active');
            attackButton.classList.remove('active');
            activeTool = this.classList.contains('active') ? 'move' : null;
            showNotification('Click on the map to move the selected unit');
        });
        
        attackButton.addEventListener('click', function() {
            this.classList.toggle('active');
            moveButton.classList.remove('active');
            activeTool = this.classList.contains('active') ? 'attack' : null;
            showNotification('Click on an enemy unit to attack');
        });
    }
    
    // Add click event listener to canvas
    canvas.style.cursor = 'pointer';
    canvas.addEventListener('click', handleCanvasClick);
    
    // Add event listeners for tabs
    setupTabNavigation();
    
    console.log('Interactive map initialized');
}

// Set up tab navigation for visualization filters
function setupTabNavigation() {
    const unitsTab = document.getElementById('unitsTab');
    const buildingsTab = document.getElementById('buildingsTab');
    const techTab = document.getElementById('techTab');
    const diplomacyTab = document.getElementById('diplomacyTab');
    
    // Create visualization panels if they don't exist
    createVisualizationPanels();
    
    const unitsPanel = document.getElementById('unitsPanel');
    const buildingsPanel = document.getElementById('buildingsPanel');
    const techPanel = document.getElementById('techPanel');
    const diplomacyPanel = document.getElementById('diplomacyPanel');
    
    // Helper function to hide all panels
    function hideAllPanels() {
        console.log('Hiding all panels');
        
        // Get all visualization panels
        const allPanels = document.querySelectorAll('.visualization-panel');
        allPanels.forEach(panel => {
            panel.style.display = 'none';
            console.log(`Hidden panel: ${panel.id}`);
        });
        
        // Also hide any existing panel with specific IDs
        const specificPanels = ['unitsPanel', 'buildingsPanel', 'techPanel', 'diplomacyPanel'];
        specificPanels.forEach(id => {
            const panel = document.getElementById(id);
            if (panel) {
                panel.style.display = 'none';
                console.log(`Hidden specific panel: ${id}`);
            }
        });
        
        // Remove active class from all tabs
        unitsTab.classList.remove('active');
        buildingsTab.classList.remove('active');
        techTab.classList.remove('active');
        diplomacyTab.classList.remove('active');
        
        // Reset map filters
        resetMapFilters();
    }
    
    // Units tab - filter map to show only units
    unitsTab.addEventListener('click', function() {
        console.log('Units tab clicked');
        hideAllPanels();
        unitsTab.classList.add('active');
        
        const unitsPanel = document.getElementById('unitsPanel');
        if (unitsPanel) {
            unitsPanel.style.display = 'block';
            console.log('Units panel displayed');
        }
        
        // Filter map to show only units
        filterMapToUnits();
        
        // Update units panel content
        updateUnitsPanel();
        
        // Show notification
        showNotification('Units view active - showing only units on map');
    });
    
    // Buildings tab - filter map to show only buildings
    buildingsTab.addEventListener('click', function() {
        console.log('Buildings tab clicked');
        hideAllPanels();
        buildingsTab.classList.add('active');
        
        const buildingsPanel = document.getElementById('buildingsPanel');
        if (buildingsPanel) {
            buildingsPanel.style.display = 'block';
            console.log('Buildings panel displayed');
        }
        
        // Filter map to show only buildings
        filterMapToBuildings();
        
        // Update buildings panel content
        updateBuildingsPanel();
        
        // Show notification
        showNotification('Buildings view active - showing only buildings on map');
    });
    
    // Technology tab - show research timeline
    techTab.addEventListener('click', function() {
        console.log('Technology tab clicked');
        hideAllPanels();
        techTab.classList.add('active');
        
        const techPanel = document.getElementById('techPanel');
        if (techPanel) {
            techPanel.style.display = 'block';
            console.log('Technology panel displayed');
        }
        
        // Update technology timeline
        updateTechnologyTimeline();
        
        // Show notification
        showNotification('Technology view active - showing research timeline');
    });
    
    // Diplomacy tab - show diplomacy timeline
    diplomacyTab.addEventListener('click', function() {
        console.log('Diplomacy tab clicked');
        hideAllPanels();
        diplomacyTab.classList.add('active');
        
        const diplomacyPanel = document.getElementById('diplomacyPanel');
        if (diplomacyPanel) {
            diplomacyPanel.style.display = 'block';
            console.log('Diplomacy panel displayed');
        }
        
        // Update diplomacy timeline
        updateDiplomacyTimeline();
        
        // Show notification
        showNotification('Diplomacy view active - showing diplomatic actions timeline');
    });
    
    // Initialize with Units tab active
    unitsTab.click();
}

// Create visualization panels for each tab
function createVisualizationPanels() {
    // Find the container to append panels to
    const container = document.querySelector('.container');
    if (!container) {
        console.error('Container element not found');
        return;
    }
    
    // Create a dedicated visualization panels container if it doesn't exist
    let panelsContainer = document.getElementById('visualization-panels');
    if (!panelsContainer) {
        panelsContainer = document.createElement('div');
        panelsContainer.id = 'visualization-panels';
        panelsContainer.style.marginTop = '20px';
        container.appendChild(panelsContainer);
    }
    
    // Create units panel if it doesn't exist
    if (!document.getElementById('unitsPanel')) {
        const unitsPanel = document.createElement('div');
        unitsPanel.id = 'unitsPanel';
        unitsPanel.className = 'visualization-panel';
        unitsPanel.innerHTML = '<h3>Units Overview</h3><div class="panel-content">Showing all units on the map. Click on a unit for details.</div>';
        unitsPanel.style.display = 'none';
        panelsContainer.appendChild(unitsPanel);
    }
    
    // Create buildings panel if it doesn't exist
    if (!document.getElementById('buildingsPanel')) {
        const buildingsPanel = document.createElement('div');
        buildingsPanel.id = 'buildingsPanel';
        buildingsPanel.className = 'visualization-panel';
        buildingsPanel.innerHTML = '<h3>Buildings Overview</h3><div class="panel-content">Showing all buildings on the map. Click on a building for details.</div>';
        buildingsPanel.style.display = 'none';
        panelsContainer.appendChild(buildingsPanel);
    }
    
    // Create technology panel if it doesn't exist
    if (!document.getElementById('techPanel')) {
        const techPanel = document.createElement('div');
        techPanel.id = 'techPanel';
        techPanel.className = 'visualization-panel';
        techPanel.innerHTML = '<h3>Technology Timeline</h3><div class="panel-content">Research progress by player:</div><div id="techTimeline" class="timeline"></div>';
        techPanel.style.display = 'none';
        panelsContainer.appendChild(techPanel);
    }
    
    // Create diplomacy panel if it doesn't exist
    if (!document.getElementById('diplomacyPanel')) {
        const diplomacyPanel = document.createElement('div');
        diplomacyPanel.id = 'diplomacyPanel';
        diplomacyPanel.className = 'visualization-panel';
        diplomacyPanel.innerHTML = '<h3>Diplomacy Timeline</h3><div class="panel-content">Diplomatic actions between players:</div><div id="diplomacyTimeline" class="timeline"></div>';
        diplomacyPanel.style.display = 'none';
        panelsContainer.appendChild(diplomacyPanel);
    }
    
    // Add CSS for visualization panels
    const styleId = 'visualization-styles';
    if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            .visualization-panel {
                margin-top: 10px;
                padding: 10px;
                background-color: #f0f0f0;
                border-radius: 5px;
                border: 1px solid #ddd;
            }
            .timeline {
                margin-top: 10px;
                padding: 10px;
                background-color: #fff;
                border: 1px solid #ddd;
                border-radius: 3px;
                min-height: 100px;
            }
            .timeline-entry {
                margin-bottom: 10px;
                padding: 5px;
                border-bottom: 1px solid #eee;
            }
            .timeline-time {
                font-size: 0.8em;
                color: #666;
            }
            .timeline-player {
                font-weight: bold;
            }
            .tab {
                cursor: pointer;
                padding: 8px 16px;
                background-color: #ddd;
                display: inline-block;
                border-radius: 5px 5px 0 0;
                margin-right: 2px;
            }
            .tab.active {
                background-color: #f0f0f0;
                font-weight: bold;
                border: 1px solid #ccc;
                border-bottom: none;
            }
        `;
        document.head.appendChild(style);
    }
    
    console.log('Visualization panels created');
}

// Filter map to show only units
function filterMapToUnits() {
    // Re-render the map with only units visible
    renderGameState('units');
}

// Filter map to show only buildings
function filterMapToBuildings() {
    // Re-render the map with only buildings visible
    renderGameState('buildings');
}

// Update technology timeline
function updateTechnologyTimeline() {
    const techTimeline = document.getElementById('techTimeline');
    if (!techTimeline) return;
    
    // In a real implementation, this would fetch technology research data
    // For now, we'll just show some mock data
    techTimeline.innerHTML = `
        <div class="timeline-entry">
            <div class="timeline-time">10:15 AM</div>
            <div class="timeline-player" style="color: ${playerColors['player1']}">player1</div>
            <div class="timeline-action">Researched Military Tech</div>
        </div>
        <div class="timeline-entry">
            <div class="timeline-time">10:30 AM</div>
            <div class="timeline-player" style="color: ${playerColors['player2']}">player2</div>
            <div class="timeline-action">Researched Economy Tech</div>
        </div>
    `;
}

// Update diplomacy timeline
function updateDiplomacyTimeline() {
    const diplomacyTimeline = document.getElementById('diplomacyTimeline');
    if (!diplomacyTimeline) return;
    
    // In a real implementation, this would fetch diplomacy action data
    // For now, we'll just show some mock data
    diplomacyTimeline.innerHTML = `
        <div class="timeline-entry">
            <div class="timeline-time">10:20 AM</div>
            <div class="timeline-player" style="color: ${playerColors['player1']}">player1</div>
            <div class="timeline-action">Proposed alliance with player2</div>
        </div>
        <div class="timeline-entry">
            <div class="timeline-time">10:25 AM</div>
            <div class="timeline-player" style="color: ${playerColors['player2']}">player2</div>
            <div class="timeline-action">Accepted alliance with player1</div>
        </div>
    `;
}

// Reset map filters to show everything
function resetMapFilters() {
    // Re-render the map with everything visible
    renderGameState('all');
}

// Render game state on canvas with optional filter
function renderGameState(filter = 'all') {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Calculate scale factor
    const scale = Math.min(canvas.width, canvas.height) / gameState.world.size;

    // Draw grid
    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= gameState.world.size; i += 10) {
        // Vertical lines
        ctx.beginPath();
        ctx.moveTo(i * scale, 0);
        ctx.lineTo(i * scale, canvas.height);
        ctx.stroke();

        // Horizontal lines
        ctx.beginPath();
        ctx.moveTo(0, i * scale);
        ctx.lineTo(canvas.width, i * scale);
        ctx.stroke();
    }

    // Draw resource nodes (always visible)
    if (filter === 'all' || filter === 'resources') {
        gameState.resourceNodes.forEach(node => {
            ctx.fillStyle = getResourceNodeColor(node.type);
            ctx.beginPath();
            ctx.arc(node.x * scale, node.y * scale, 5, 0, Math.PI * 2);
            ctx.fill();

            // Draw resource node label
            ctx.fillStyle = '#000';
            ctx.font = '10px Arial';
            ctx.fillText(`${node.type} (${node.amount})`, node.x * scale - 30, node.y * scale - 10);
        });
    }

    // Draw buildings if not filtered out
    if (filter === 'all' || filter === 'buildings') {
        gameState.buildings.forEach(building => {
            ctx.fillStyle = getBuildingColor(building.type);
            ctx.fillRect(building.x * scale - 10, building.y * scale - 10, 20, 20);

            // Draw building label
            ctx.fillStyle = '#000';
            ctx.font = '10px Arial';
            ctx.fillText(building.type, building.x * scale - 20, building.y * scale - 15);
        });
    }

    // Draw units if not filtered out
    if (filter === 'all' || filter === 'units') {
        gameState.units.forEach(unit => {
            ctx.fillStyle = getUnitColor(unit.player);
            ctx.beginPath();
            ctx.arc(unit.x * scale, unit.y * scale, 5, 0, Math.PI * 2);
            ctx.fill();

            // Draw unit label
            ctx.fillStyle = '#000';
            ctx.font = '10px Arial';
            ctx.fillText(`${unit.name} (${unit.id.split(':')[1]})`, unit.x * scale - 30, unit.y * scale - 10);
        });
    }
    
    // Draw target position if active
    if (targetPosition) {
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(targetPosition.x * scale, targetPosition.y * scale, 8, 0, Math.PI * 2);
        ctx.stroke();
        
        // Draw line from selected unit to target
        if (selectedUnit) {
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(selectedUnit.x * scale, selectedUnit.y * scale);
            ctx.lineTo(targetPosition.x * scale, targetPosition.y * scale);
            ctx.stroke();
        }
    }
    
    // Update panel content based on filter
    updatePanelContent(filter);
}

// Update units panel with current unit information
function updateUnitsPanel() {
    const unitsPanel = document.getElementById('unitsPanel');
    if (!unitsPanel) return;
    
    const content = unitsPanel.querySelector('.panel-content');
    if (!content) return;
    
    if (!gameState || !gameState.units || gameState.units.length === 0) {
        content.innerHTML = 'No units found in the game state.';
        return;
    }
    
    let unitsList = '<ul class="units-list">';
    gameState.units.forEach(unit => {
        const playerColor = playerColors[unit.player] || '#000';
        unitsList += `
            <li style="border-left: 4px solid ${playerColor}; padding-left: 8px; margin-bottom: 8px;">
                <div><strong>${unit.name}</strong> (${unit.id.split(':')[1]})</div>
                <div>Owner: <span style="color: ${playerColor}">${unit.player || 'None'}</span></div>
                <div>Position: (${unit.x}, ${unit.y})</div>
                <div>Stats: Attack ${unit.attack || 0}, Defense ${unit.defense || 0}, Health ${unit.health || 0}</div>
            </li>
        `;
    });
    unitsList += '</ul>';
    
    content.innerHTML = `
        <div class="panel-header">Showing ${gameState.units.length} units on the map:</div>
        ${unitsList}
    `;
}

// Update buildings panel with current building information
function updateBuildingsPanel() {
    const buildingsPanel = document.getElementById('buildingsPanel');
    if (!buildingsPanel) return;
    
    const content = buildingsPanel.querySelector('.panel-content');
    if (!content) return;
    
    if (!gameState || !gameState.buildings || gameState.buildings.length === 0) {
        content.innerHTML = 'No buildings found in the game state.';
        return;
    }
    
    let buildingsList = '<ul class="buildings-list">';
    gameState.buildings.forEach(building => {
        const ownerColor = building.player ? (playerColors[building.player] || '#000') : '#888';
        buildingsList += `
            <li style="border-left: 4px solid ${ownerColor}; padding-left: 8px; margin-bottom: 8px;">
                <div><strong>${building.type}</strong></div>
                <div>Owner: <span style="color: ${ownerColor}">${building.player || 'None'}</span></div>
                <div>Position: (${building.x}, ${building.y})</div>
                <div>Health: ${building.health || 100}</div>
            </li>
        `;
    });
    buildingsList += '</ul>';
    
    content.innerHTML = `
        <div class="panel-header">Showing ${gameState.buildings.length} buildings on the map:</div>
        ${buildingsList}
    `;
}

// Update panel content based on active filter
function updatePanelContent(filter) {
    console.log(`Updating panel content for filter: ${filter}`);
    
    // Update units panel content
    if (filter === 'units') {
        updateUnitsPanel();
    }
    
    // Update buildings panel content
    else if (filter === 'buildings') {
        updateBuildingsPanel();
    }
    
    // For technology and diplomacy, the content is updated in their respective functions
}

// Helper functions for colors
function getResourceNodeColor(type) {
    const colors = {
        'gold': '#FFD700',
        'wood': '#8B4513',
        'stone': '#A9A9A9',
        'food': '#32CD32'
    };
    return colors[type] || '#888';
}

function getBuildingColor(type) {
    const colors = {
        'townCenter': '#4682B4',
        'barracks': '#B22222',
        'tower': '#708090',
        'farm': '#228B22'
    };
    return colors[type] || '#888';
}

function getUnitColor(player) {
    return playerColors[player] || '#888';
}

// Listen for the gameStateLoaded event from index.html
window.addEventListener('gameStateLoaded', function() {
    console.log('Game state loaded event received, initializing interactive map');
    initInteractiveMap();
});

// Also initialize when the DOM is loaded (as a fallback)
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, checking if game state is already loaded');
    // If game state was already loaded, initialize the map
    if (window.gameStateLoaded) {
        console.log('Game state was already loaded, initializing map');
        initInteractiveMap();
    }
});

// Convert canvas coordinates to game coordinates
function canvasToGameCoords(canvasX, canvasY) {
    const scale = Math.min(canvas.width, canvas.height) / gameState.world.size;
    return {
        x: Math.floor(canvasX / scale),
        y: Math.floor(canvasY / scale)
    };
}

// Find unit at coordinates
function findUnitAt(gameX, gameY) {
    return gameState.units.find(unit => 
        Math.abs(unit.x - gameX) < 3 && Math.abs(unit.y - gameY) < 3
    );
}

// Find building at coordinates
function findBuildingAt(gameX, gameY) {
    return gameState.buildings.find(building => 
        Math.abs(building.x - gameX) < 5 && Math.abs(building.y - gameY) < 5
    );
}

// Find resource node at coordinates
function findResourceNodeAt(gameX, gameY) {
    return gameState.resourceNodes.find(node => 
        Math.abs(node.x - gameX) < 3 && Math.abs(node.y - gameY) < 3
    );
}

// Select unit
function selectUnit(unit) {
    selectedUnit = unit;
    selectedBuilding = null;
    
    // Show selection indicator
    if (unit) {
        const scale = Math.min(canvas.width, canvas.height) / gameState.world.size;
        selectionIndicator.style.display = 'block';
        selectionIndicator.style.left = `${unit.x * scale - 10 + canvas.offsetLeft}px`;
        selectionIndicator.style.top = `${unit.y * scale - 10 + canvas.offsetTop}px`;
        selectionIndicator.style.width = '20px';
        selectionIndicator.style.height = '20px';
        
        // Show action panel if it's player's unit and Units tab is active
        const actionPanel = document.getElementById('actionPanel');
        const unitsTab = document.getElementById('unitsTab');
        if (unit.player === 'player1' && unitsTab.classList.contains('active')) {
            actionPanel.style.display = 'block';
        } else {
            actionPanel.style.display = 'none';
        }
    } else {
        selectionIndicator.style.display = 'none';
        document.getElementById('actionPanel').style.display = 'none';
    }
}

// Move unit
function moveUnit(unit, x, y) {
    if (!unit) return;
    
    // Update the TTL file via API
    fetch('/api/move-unit', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            unitId: unit.id,
            x: x,
            y: y
        })
    })
    .then(response => response.json())
    .then(data => {
        console.log('Move command sent:', data);
        showNotification(`Moving ${unit.name} to (${x}, ${y})`);
    })
    .catch(error => {
        console.error('Error moving unit:', error);
        showNotification('Error moving unit', 'error');
    });
}

// Handle canvas click
function handleCanvasClick(event) {
    const rect = canvas.getBoundingClientRect();
    const canvasX = event.clientX - rect.left;
    const canvasY = event.clientY - rect.top;
    const gameCoords = canvasToGameCoords(canvasX, canvasY);
    
    console.log(`Canvas clicked at (${canvasX}, ${canvasY}), game coordinates: (${gameCoords.x}, ${gameCoords.y})`);
    
    const clickedUnit = findUnitAt(gameCoords.x, gameCoords.y);
    const clickedBuilding = findBuildingAt(gameCoords.x, gameCoords.y);
    const clickedResourceNode = findResourceNodeAt(gameCoords.x, gameCoords.y);
    
    if (clickedUnit) {
        // Select the unit
        selectUnit(clickedUnit);
        console.log('Selected unit:', clickedUnit);
    } else if (selectedUnit && activeTool === 'move') {
        // Move the selected unit
        moveUnit(selectedUnit, gameCoords.x, gameCoords.y);
        document.getElementById('moveButton').classList.remove('active');
        activeTool = null;
    } else if (clickedBuilding) {
        // Select the building
        selectedUnit = null;
        selectedBuilding = clickedBuilding;
        console.log('Selected building:', clickedBuilding);
    } else if (clickedResourceNode) {
        console.log('Clicked resource node:', clickedResourceNode);
        
        // If a unit is selected and the tool is gather, gather resources
        if (selectedUnit && activeTool === 'gather') {
            // Implement gathering functionality
        }
    } else {
        // Deselect if clicking on empty space
        selectUnit(null);
    }
}

// Show notification
function showNotification(message, type = 'success') {
    // Check if the notification element exists
    const notification = document.getElementById('notification');
    if (!notification) {
        console.error('Notification element not found');
        return;
    }
    
    notification.textContent = message;
    notification.style.display = 'block';
    
    if (type === 'error') {
        notification.style.backgroundColor = '#f8d7da';
    } else {
        notification.style.backgroundColor = '#d4edda';
    }
    
    setTimeout(() => { notification.style.display = 'none'; }, 3000);
}

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', initInteractiveMap);