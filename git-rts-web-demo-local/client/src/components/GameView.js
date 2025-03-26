import React from 'react';

function GameView({ gameState }) {
  if (!gameState || !gameState.map || !gameState.players) {
    return (
      <div className="game-view-container">
        <div className="game-view-header">
          <span className="game-view-title">Game View</span>
        </div>
        <div className="game-view-empty">
          <p>Game state will appear here once the demo starts.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="game-view-container">
      <div className="game-view-header">
        <span className="game-view-title">Game View</span>
      </div>
      
      <div className="game-content">
        <div className="game-map">
          <div 
            className="map-grid" 
            style={{ 
              gridTemplateColumns: `repeat(${gameState.map.width}, 20px)`,
              gridTemplateRows: `repeat(${gameState.map.height}, 20px)`,
            }}
          >
            {gameState.map.cells.map((cell, index) => (
              <div 
                key={index} 
                className={`map-cell ${cell.type} ${cell.explored ? 'explored' : 'unexplored'}`}
                title={`${cell.x},${cell.y}: ${cell.type}`}
              >
                {/* Render unit if present */}
                {renderUnit(cell, gameState.players)}
                
                {/* Render resource if present */}
                {cell.resource && (
                  <div 
                    className={`resource ${cell.resource.type}`}
                    title={`${cell.resource.type}: ${cell.resource.amount}`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
        
        <div className="game-info">
          {gameState.players.map((player, index) => (
            <div key={index} className="player-info">
              <h4>Player {player.id}</h4>
              
              <div className="resources">
                <h5>Resources</h5>
                <ul>
                  {Object.entries(player.resources).map(([resource, amount]) => (
                    <li key={resource}>{resource}: {amount}</li>
                  ))}
                </ul>
              </div>
              
              <div className="units">
                <h5>Units</h5>
                {player.units.length === 0 ? (
                  <p>No units</p>
                ) : (
                  <ul>
                    {player.units.map((unit, unitIndex) => (
                      <li key={unitIndex}>
                        {unit.type} at ({unit.x},{unit.y}) - HP: {unit.health}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Helper function to render a unit on the map
function renderUnit(cell, players) {
  // Find unit at this cell position
  for (const player of players) {
    const unit = player.units.find(u => u.x === cell.x && u.y === cell.y);
    
    if (unit) {
      return (
        <div 
          className={`unit ${unit.type} player-${player.id}`}
          title={`${unit.type} (Player ${player.id}) - HP: ${unit.health}`}
        />
      );
    }
  }
  
  return null;
}

export default GameView;