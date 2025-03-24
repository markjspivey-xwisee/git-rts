import { exec } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';

// Define the game repository directory from environment variable or default
const gameRepoDir = process.env.GAME_REPO_DIR || 'C:/Users/markj/Desktop/game-repo';

// Define the CLI path
const cliPath = 'C:/Users/markj/Desktop/git-rts-cli/index.js';

/**
 * Execute a CLI command as a Promise
 * 
 * @param command - The command to execute
 * @param args - The arguments for the command
 * @returns The command output
 */
export async function executeCli(command: string, args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const fullCommand = `node ${cliPath} ${command} ${args.join(' ')}`;
    exec(fullCommand, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(`Command execution error: ${error.message}\n${stderr}`));
      } else {
        // Process the output to remove duplicates
        const processedOutput = deduplicateOutput(stdout);
        resolve(processedOutput);
      }
    });
  });
}

/**
 * Function to deduplicate repeated lines in command output
 * 
 * @param output - The command output
 * @returns The deduplicated output
 */
function deduplicateOutput(output: string): string {
  // Split the output into lines
  const lines = output.split('\n');
  
  // Create a map to track seen lines and their counts
  const seenLines = new Map<string, number>();
  const uniqueLines: string[] = [];
  
  // Process each line
  for (const line of lines) {
    // Skip empty lines
    if (!line.trim()) {
      uniqueLines.push(line);
      continue;
    }
    
    // If we've seen this line before, skip it
    if (seenLines.has(line)) {
      seenLines.set(line, seenLines.get(line)! + 1);
    } else {
      // First time seeing this line
      seenLines.set(line, 1);
      uniqueLines.push(line);
    }
  }
  
  // For lines that appeared multiple times, add a count indicator
  const finalLines = uniqueLines.map(line => {
    const count = seenLines.get(line);
    if (count && count > 1) {
      // Only add count for non-empty lines
      return line.trim() ? line : line;
    }
    return line;
  });
  
  return finalLines.join('\n');
}

/**
 * Create a new game by forking the template repository
 * 
 * @param repoUrl - The URL of the new game repository
 * @param gameName - The name of the game world
 * @returns The command output
 */
export async function createNewGame(repoUrl: string, gameName: string): Promise<string> {
  return executeCli('create-game', [repoUrl, gameName]);
}

/**
 * Create a new player in the game
 * 
 * @param playerName - The name of the player
 * @returns The command output
 */
export async function createPlayer(playerName: string): Promise<string> {
  return executeCli('create-player', [playerName]);
}

/**
 * Join a game as a player
 * 
 * @param repoUrl - The URL of the game repository
 * @param playerName - The name of the player
 * @returns The command output
 */
export async function joinGame(repoUrl: string, playerName: string): Promise<string> {
  return executeCli('join-game', [repoUrl, playerName]);
}

/**
 * Perform a turn-based synchronization
 * 
 * @returns The command output
 */
export async function syncTurn(): Promise<string> {
  return executeCli('sync-turn', []);
}

/**
 * Get the current game state as a JSON object
 * 
 * @returns The game state
 */
export async function getGameState(): Promise<any> {
  try {
    // Get the repository URL
    const gitConfigPath = path.join(gameRepoDir, '.git', 'config');
    const gitConfig = await fs.readFile(gitConfigPath, 'utf8');
    const repoUrlMatch = gitConfig.match(/url = ([^\n]+)/);
    const repoUrl = repoUrlMatch ? repoUrlMatch[1] : 'unknown';
    
    // Get the current branch
    const headPath = path.join(gameRepoDir, '.git', 'HEAD');
    const headContent = await fs.readFile(headPath, 'utf8');
    const branchMatch = headContent.match(/ref: refs\/heads\/(.+)/);
    const branch = branchMatch ? branchMatch[1] : 'unknown';
    
    // Get the player name from the branch
    const playerMatch = branch.match(/player\/(.+)/);
    const player = playerMatch ? playerMatch[1] : 'unknown';
    
    // Read the world data
    const worldPath = path.join(gameRepoDir, 'world.ttl');
    const worldContent = await fs.readFile(worldPath, 'utf8');
    const worldNameMatch = worldContent.match(/game:name "([^"]+)"/);
    const worldName = worldNameMatch ? worldNameMatch[1] : 'unknown';
    
    // Read the player resources
    const playerResourcesPath = path.join(gameRepoDir, `${player.replace(/-/g, '_')}_resources.ttl`);
    let playerResources = null;
    try {
      const playerResourcesContent = await fs.readFile(playerResourcesPath, 'utf8');
      const goldMatch = playerResourcesContent.match(/game:gold (\d+)/);
      const woodMatch = playerResourcesContent.match(/game:wood (\d+)/);
      const stoneMatch = playerResourcesContent.match(/game:stone (\d+)/);
      const foodMatch = playerResourcesContent.match(/game:food (\d+)/);
      
      playerResources = {
        gold: goldMatch ? parseInt(goldMatch[1]) : 0,
        wood: woodMatch ? parseInt(woodMatch[1]) : 0,
        stone: stoneMatch ? parseInt(stoneMatch[1]) : 0,
        food: foodMatch ? parseInt(foodMatch[1]) : 0
      };
    } catch (error) {
      console.error('Error reading player resources:', error instanceof Error ? error.message : String(error));
    }
    
    // Read the player units
    const playerUnitsPath = path.join(gameRepoDir, `${player.replace(/-/g, '_')}_units.ttl`);
    let playerUnits = [];
    try {
      const playerUnitsContent = await fs.readFile(playerUnitsPath, 'utf8');
      const unitMatches = playerUnitsContent.match(/game:units game:([^,\s]+)/g);
      if (unitMatches) {
        playerUnits = unitMatches.map(match => {
          const unitId = match.replace('game:units game:', '');
          return unitId;
        });
      }
    } catch (error) {
      console.error('Error reading player units:', error instanceof Error ? error.message : String(error));
    }
    
    // Read the units data
    const unitsPath = path.join(gameRepoDir, 'units.ttl');
    const unitsContent = await fs.readFile(unitsPath, 'utf8');
    
    // Extract unit data for the player's units
    const units = [];
    for (const unitId of playerUnits) {
      const unitSection = unitsContent.match(new RegExp(`game:${unitId}[\\s\\S]*?(?=game:[a-zA-Z0-9_]+ a|$)`));
      if (unitSection) {
        const nameMatch = unitSection[0].match(/game:name "([^"]+)"/);
        const attackMatch = unitSection[0].match(/game:attack (\d+)/);
        const defenseMatch = unitSection[0].match(/game:defense (\d+)/);
        const healthMatch = unitSection[0].match(/game:health (\d+)/);
        const locationMatch = unitSection[0].match(/game:location "{x: (\d+), y: (\d+)}"/);
        
        units.push({
          id: unitId,
          name: nameMatch ? nameMatch[1] : 'unknown',
          attack: attackMatch ? parseInt(attackMatch[1]) : 0,
          defense: defenseMatch ? parseInt(defenseMatch[1]) : 0,
          health: healthMatch ? parseInt(healthMatch[1]) : 0,
          location: locationMatch ? { x: parseInt(locationMatch[1]), y: parseInt(locationMatch[2]) } : { x: 0, y: 0 }
        });
      }
    }
    
    return {
      repository: {
        url: repoUrl,
        branch: branch
      },
      world: {
        name: worldName
      },
      player: {
        name: player,
        resources: playerResources,
        units: units
      }
    };
  } catch (error) {
    console.error('Error getting game state:', error instanceof Error ? error.message : String(error));
    throw error;
  }
}