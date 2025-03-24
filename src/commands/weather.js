const { program } = require('commander');
const fs = require('fs').promises;
const { exec } = require('child_process');
const path = require('path');

// Weather types and their effects
const weatherTypes = {
  'clear': {
    description: 'Clear skies',
    movementModifier: 1.0,
    gatheringModifier: 1.0,
    combatModifier: 1.0,
    visibilityModifier: 1.0
  },
  'rain': {
    description: 'Rainy weather',
    movementModifier: 0.8,
    gatheringModifier: 0.9,
    combatModifier: 0.9,
    visibilityModifier: 0.7
  },
  'snow': {
    description: 'Snowy weather',
    movementModifier: 0.6,
    gatheringModifier: 0.7,
    combatModifier: 0.8,
    visibilityModifier: 0.6
  },
  'storm': {
    description: 'Stormy weather',
    movementModifier: 0.4,
    gatheringModifier: 0.5,
    combatModifier: 0.7,
    visibilityModifier: 0.4
  },
  'fog': {
    description: 'Foggy weather',
    movementModifier: 0.7,
    gatheringModifier: 0.8,
    combatModifier: 0.6,
    visibilityModifier: 0.3
  },
  'heat_wave': {
    description: 'Heat wave',
    movementModifier: 0.7,
    gatheringModifier: 0.6,
    combatModifier: 0.8,
    visibilityModifier: 0.9
  }
};

// Time of day types and their effects
const timeOfDayTypes = {
  'dawn': {
    description: 'Early morning',
    movementModifier: 0.9,
    gatheringModifier: 0.8,
    combatModifier: 0.9,
    visibilityModifier: 0.7
  },
  'day': {
    description: 'Daytime',
    movementModifier: 1.0,
    gatheringModifier: 1.0,
    combatModifier: 1.0,
    visibilityModifier: 1.0
  },
  'dusk': {
    description: 'Evening',
    movementModifier: 0.9,
    gatheringModifier: 0.8,
    combatModifier: 0.9,
    visibilityModifier: 0.7
  },
  'night': {
    description: 'Nighttime',
    movementModifier: 0.7,
    gatheringModifier: 0.6,
    combatModifier: 0.8,
    visibilityModifier: 0.5
  }
};

// Season types and their effects
const seasonTypes = {
  'spring': {
    description: 'Spring season',
    movementModifier: 0.9,
    gatheringModifier: 1.2,
    combatModifier: 1.0,
    visibilityModifier: 1.0
  },
  'summer': {
    description: 'Summer season',
    movementModifier: 1.0,
    gatheringModifier: 1.0,
    combatModifier: 1.0,
    visibilityModifier: 1.0
  },
  'autumn': {
    description: 'Autumn season',
    movementModifier: 0.9,
    gatheringModifier: 1.1,
    combatModifier: 1.0,
    visibilityModifier: 0.9
  },
  'winter': {
    description: 'Winter season',
    movementModifier: 0.7,
    gatheringModifier: 0.6,
    combatModifier: 0.9,
    visibilityModifier: 0.8
  }
};

// Initialize weather system
program
  .command('init-weather')
  .description('Initialize the weather system')
  .action(async () => {
    console.log('Initializing weather system...');
    
    const gameRepoDir = 'C:/Users/markj/Desktop/game-repo';
    const weatherPath = `${gameRepoDir}/weather.ttl`;
    
    try {
      // Create weather.ttl
      const weatherContent = `@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>.
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>.
@prefix xsd: <http://www.w3.org/2001/XMLSchema#>.
@prefix game: <http://example.org/game#>.

# Weather and time system
game:weatherSystem a game:WeatherSystem;
  game:currentWeather "clear";
  game:currentTimeOfDay "day";
  game:currentSeason "summer";
  game:currentTurn 1;
  game:weatherChangeInterval 10;
  game:timeOfDayChangeInterval 5;
  game:seasonChangeInterval 50;
  game:nextWeatherChange 10;
  game:nextTimeOfDayChange 5;
  game:nextSeasonChange 50.

# Weather effects
game:clearWeather a game:Weather;
  game:description "Clear skies";
  game:movementModifier "1.0"^^xsd:float;
  game:gatheringModifier "1.0"^^xsd:float;
  game:combatModifier "1.0"^^xsd:float;
  game:visibilityModifier "1.0"^^xsd:float.

game:rainWeather a game:Weather;
  game:description "Rainy weather";
  game:movementModifier "0.8"^^xsd:float;
  game:gatheringModifier "0.9"^^xsd:float;
  game:combatModifier "0.9"^^xsd:float;
  game:visibilityModifier "0.7"^^xsd:float.

game:snowWeather a game:Weather;
  game:description "Snowy weather";
  game:movementModifier "0.6"^^xsd:float;
  game:gatheringModifier "0.7"^^xsd:float;
  game:combatModifier "0.8"^^xsd:float;
  game:visibilityModifier "0.6"^^xsd:float.

game:stormWeather a game:Weather;
  game:description "Stormy weather";
  game:movementModifier "0.4"^^xsd:float;
  game:gatheringModifier "0.5"^^xsd:float;
  game:combatModifier "0.7"^^xsd:float;
  game:visibilityModifier "0.4"^^xsd:float.

game:fogWeather a game:Weather;
  game:description "Foggy weather";
  game:movementModifier "0.7"^^xsd:float;
  game:gatheringModifier "0.8"^^xsd:float;
  game:combatModifier "0.6"^^xsd:float;
  game:visibilityModifier "0.3"^^xsd:float.

game:heatWaveWeather a game:Weather;
  game:description "Heat wave";
  game:movementModifier "0.7"^^xsd:float;
  game:gatheringModifier "0.6"^^xsd:float;
  game:combatModifier "0.8"^^xsd:float;
  game:visibilityModifier "0.9"^^xsd:float.

# Time of day effects
game:dawnTime a game:TimeOfDay;
  game:description "Early morning";
  game:movementModifier "0.9"^^xsd:float;
  game:gatheringModifier "0.8"^^xsd:float;
  game:combatModifier "0.9"^^xsd:float;
  game:visibilityModifier "0.7"^^xsd:float.

game:dayTime a game:TimeOfDay;
  game:description "Daytime";
  game:movementModifier "1.0"^^xsd:float;
  game:gatheringModifier "1.0"^^xsd:float;
  game:combatModifier "1.0"^^xsd:float;
  game:visibilityModifier "1.0"^^xsd:float.

game:duskTime a game:TimeOfDay;
  game:description "Evening";
  game:movementModifier "0.9"^^xsd:float;
  game:gatheringModifier "0.8"^^xsd:float;
  game:combatModifier "0.9"^^xsd:float;
  game:visibilityModifier "0.7"^^xsd:float.

game:nightTime a game:TimeOfDay;
  game:description "Nighttime";
  game:movementModifier "0.7"^^xsd:float;
  game:gatheringModifier "0.6"^^xsd:float;
  game:combatModifier "0.8"^^xsd:float;
  game:visibilityModifier "0.5"^^xsd:float.

# Season effects
game:springSeason a game:Season;
  game:description "Spring season";
  game:movementModifier "0.9"^^xsd:float;
  game:gatheringModifier "1.2"^^xsd:float;
  game:combatModifier "1.0"^^xsd:float;
  game:visibilityModifier "1.0"^^xsd:float.

game:summerSeason a game:Season;
  game:description "Summer season";
  game:movementModifier "1.0"^^xsd:float;
  game:gatheringModifier "1.0"^^xsd:float;
  game:combatModifier "1.0"^^xsd:float;
  game:visibilityModifier "1.0"^^xsd:float.

game:autumnSeason a game:Season;
  game:description "Autumn season";
  game:movementModifier "0.9"^^xsd:float;
  game:gatheringModifier "1.1"^^xsd:float;
  game:combatModifier "1.0"^^xsd:float;
  game:visibilityModifier "0.9"^^xsd:float.

game:winterSeason a game:Season;
  game:description "Winter season";
  game:movementModifier "0.7"^^xsd:float;
  game:gatheringModifier "0.6"^^xsd:float;
  game:combatModifier "0.9"^^xsd:float;
  game:visibilityModifier "0.8"^^xsd:float.`;
      
      await fs.writeFile(weatherPath, weatherContent);
      
      // Commit changes
      await exec('git add weather.ttl', { cwd: gameRepoDir });
      await exec('git commit -m "Initialize weather system"', { cwd: gameRepoDir });
      
      console.log('Weather system initialized successfully!');
    } catch (error) {
      console.error(`Error initializing weather system: ${error.message}`);
    }
  });

// Get current weather information
program
  .command('get-weather')
  .description('Get current weather information')
  .action(async () => {
    console.log('Getting current weather information...');
    
    const gameRepoDir = 'C:/Users/markj/Desktop/game-repo';
    const weatherPath = `${gameRepoDir}/weather.ttl`;
    
    try {
      // Read weather.ttl
      const weatherContent = await fs.readFile(weatherPath, 'utf8');
      
      // Extract current weather, time of day, and season
      const weatherMatch = weatherContent.match(/game:currentWeather "([^"]+)"/);
      const timeOfDayMatch = weatherContent.match(/game:currentTimeOfDay "([^"]+)"/);
      const seasonMatch = weatherContent.match(/game:currentSeason "([^"]+)"/);
      const turnMatch = weatherContent.match(/game:currentTurn (\d+)/);
      
      if (!weatherMatch || !timeOfDayMatch || !seasonMatch || !turnMatch) {
        console.error('Could not find weather information');
        return;
      }
      
      const currentWeather = weatherMatch[1];
      const currentTimeOfDay = timeOfDayMatch[1];
      const currentSeason = seasonMatch[1];
      const currentTurn = parseInt(turnMatch[1]);
      
      // Get weather effects
      const weatherEffects = weatherTypes[currentWeather];
      const timeOfDayEffects = timeOfDayTypes[currentTimeOfDay];
      const seasonEffects = seasonTypes[currentSeason];
      
      if (!weatherEffects || !timeOfDayEffects || !seasonEffects) {
        console.error('Could not find weather effects');
        return;
      }
      
      // Calculate combined effects
      const combinedMovementModifier = weatherEffects.movementModifier * timeOfDayEffects.movementModifier * seasonEffects.movementModifier;
      const combinedGatheringModifier = weatherEffects.gatheringModifier * timeOfDayEffects.gatheringModifier * seasonEffects.gatheringModifier;
      const combinedCombatModifier = weatherEffects.combatModifier * timeOfDayEffects.combatModifier * seasonEffects.combatModifier;
      const combinedVisibilityModifier = weatherEffects.visibilityModifier * timeOfDayEffects.visibilityModifier * seasonEffects.visibilityModifier;
      
      // Display information
      console.log(`Current Turn: ${currentTurn}`);
      console.log(`Weather: ${weatherEffects.description}`);
      console.log(`Time of Day: ${timeOfDayEffects.description}`);
      console.log(`Season: ${seasonEffects.description}`);
      console.log('\nCombined Effects:');
      console.log(`Movement Modifier: ${combinedMovementModifier.toFixed(2)}`);
      console.log(`Gathering Modifier: ${combinedGatheringModifier.toFixed(2)}`);
      console.log(`Combat Modifier: ${combinedCombatModifier.toFixed(2)}`);
      console.log(`Visibility Modifier: ${combinedVisibilityModifier.toFixed(2)}`);
      
      // Get next changes
      const nextWeatherChangeMatch = weatherContent.match(/game:nextWeatherChange (\d+)/);
      const nextTimeOfDayChangeMatch = weatherContent.match(/game:nextTimeOfDayChange (\d+)/);
      const nextSeasonChangeMatch = weatherContent.match(/game:nextSeasonChange (\d+)/);
      
      if (nextWeatherChangeMatch && nextTimeOfDayChangeMatch && nextSeasonChangeMatch) {
        const nextWeatherChange = parseInt(nextWeatherChangeMatch[1]);
        const nextTimeOfDayChange = parseInt(nextTimeOfDayChangeMatch[1]);
        const nextSeasonChange = parseInt(nextSeasonChangeMatch[1]);
        
        console.log('\nNext Changes:');
        console.log(`Weather will change in ${nextWeatherChange - currentTurn} turns`);
        console.log(`Time of day will change in ${nextTimeOfDayChange - currentTurn} turns`);
        console.log(`Season will change in ${nextSeasonChange - currentTurn} turns`);
      }
    } catch (error) {
      console.error(`Error getting weather information: ${error.message}`);
    }
  });

// Advance the weather system by one turn
program
  .command('advance-weather')
  .description('Advance the weather system by one turn')
  .action(async () => {
    console.log('Advancing weather system...');
    
    const gameRepoDir = 'C:/Users/markj/Desktop/game-repo';
    const weatherPath = `${gameRepoDir}/weather.ttl`;
    
    try {
      // Read weather.ttl
      const weatherContent = await fs.readFile(weatherPath, 'utf8');
      
      // Extract current values
      const turnMatch = weatherContent.match(/game:currentTurn (\d+)/);
      const weatherMatch = weatherContent.match(/game:currentWeather "([^"]+)"/);
      const timeOfDayMatch = weatherContent.match(/game:currentTimeOfDay "([^"]+)"/);
      const seasonMatch = weatherContent.match(/game:currentSeason "([^"]+)"/);
      
      const weatherChangeIntervalMatch = weatherContent.match(/game:weatherChangeInterval (\d+)/);
      const timeOfDayChangeIntervalMatch = weatherContent.match(/game:timeOfDayChangeInterval (\d+)/);
      const seasonChangeIntervalMatch = weatherContent.match(/game:seasonChangeInterval (\d+)/);
      
      const nextWeatherChangeMatch = weatherContent.match(/game:nextWeatherChange (\d+)/);
      const nextTimeOfDayChangeMatch = weatherContent.match(/game:nextTimeOfDayChange (\d+)/);
      const nextSeasonChangeMatch = weatherContent.match(/game:nextSeasonChange (\d+)/);
      
      if (!turnMatch || !weatherMatch || !timeOfDayMatch || !seasonMatch ||
          !weatherChangeIntervalMatch || !timeOfDayChangeIntervalMatch || !seasonChangeIntervalMatch ||
          !nextWeatherChangeMatch || !nextTimeOfDayChangeMatch || !nextSeasonChangeMatch) {
        console.error('Could not find required weather information');
        return;
      }
      
      const currentTurn = parseInt(turnMatch[1]);
      const currentWeather = weatherMatch[1];
      const currentTimeOfDay = timeOfDayMatch[1];
      const currentSeason = seasonMatch[1];
      
      const weatherChangeInterval = parseInt(weatherChangeIntervalMatch[1]);
      const timeOfDayChangeInterval = parseInt(timeOfDayChangeIntervalMatch[1]);
      const seasonChangeInterval = parseInt(seasonChangeIntervalMatch[1]);
      
      let nextWeatherChange = parseInt(nextWeatherChangeMatch[1]);
      let nextTimeOfDayChange = parseInt(nextTimeOfDayChangeMatch[1]);
      let nextSeasonChange = parseInt(nextSeasonChangeMatch[1]);
      
      // Increment turn
      const newTurn = currentTurn + 1;
      
      // Check for weather changes
      let newWeather = currentWeather;
      let newTimeOfDay = currentTimeOfDay;
      let newSeason = currentSeason;
      
      // Weather change
      if (newTurn >= nextWeatherChange) {
        // Choose a new random weather
        const weatherOptions = Object.keys(weatherTypes);
        newWeather = weatherOptions[Math.floor(Math.random() * weatherOptions.length)];
        nextWeatherChange = newTurn + weatherChangeInterval;
        console.log(`Weather changed to: ${weatherTypes[newWeather].description}`);
      }
      
      // Time of day change
      if (newTurn >= nextTimeOfDayChange) {
        // Cycle through time of day
        const timeOfDayOptions = Object.keys(timeOfDayTypes);
        const currentIndex = timeOfDayOptions.indexOf(currentTimeOfDay);
        const nextIndex = (currentIndex + 1) % timeOfDayOptions.length;
        newTimeOfDay = timeOfDayOptions[nextIndex];
        nextTimeOfDayChange = newTurn + timeOfDayChangeInterval;
        console.log(`Time of day changed to: ${timeOfDayTypes[newTimeOfDay].description}`);
      }
      
      // Season change
      if (newTurn >= nextSeasonChange) {
        // Cycle through seasons
        const seasonOptions = Object.keys(seasonTypes);
        const currentIndex = seasonOptions.indexOf(currentSeason);
        const nextIndex = (currentIndex + 1) % seasonOptions.length;
        newSeason = seasonOptions[nextIndex];
        nextSeasonChange = newTurn + seasonChangeInterval;
        console.log(`Season changed to: ${seasonTypes[newSeason].description}`);
      }
      
      // Update weather.ttl
      let updatedWeatherContent = weatherContent
        .replace(/game:currentTurn \d+/, `game:currentTurn ${newTurn}`)
        .replace(/game:currentWeather "[^"]+"/, `game:currentWeather "${newWeather}"`)
        .replace(/game:currentTimeOfDay "[^"]+"/, `game:currentTimeOfDay "${newTimeOfDay}"`)
        .replace(/game:currentSeason "[^"]+"/, `game:currentSeason "${newSeason}"`)
        .replace(/game:nextWeatherChange \d+/, `game:nextWeatherChange ${nextWeatherChange}`)
        .replace(/game:nextTimeOfDayChange \d+/, `game:nextTimeOfDayChange ${nextTimeOfDayChange}`)
        .replace(/game:nextSeasonChange \d+/, `game:nextSeasonChange ${nextSeasonChange}`);
      
      await fs.writeFile(weatherPath, updatedWeatherContent);
      
      // Commit changes
      await exec('git add weather.ttl', { cwd: gameRepoDir });
      await exec(`git commit -m "Advance weather system to turn ${newTurn}"`, { cwd: gameRepoDir });
      
      console.log(`Weather system advanced to turn ${newTurn}`);
    } catch (error) {
      console.error(`Error advancing weather system: ${error.message}`);
    }
  });

// Get weather modifier for a specific action
program
  .command('get-weather-modifier <actionType>')
  .description('Get weather modifier for a specific action (movement, gathering, combat, visibility)')
  .action(async (actionType) => {
    console.log(`Getting weather modifier for ${actionType}...`);
    
    const gameRepoDir = 'C:/Users/markj/Desktop/game-repo';
    const weatherPath = `${gameRepoDir}/weather.ttl`;
    
    try {
      // Read weather.ttl
      const weatherContent = await fs.readFile(weatherPath, 'utf8');
      
      // Extract current weather, time of day, and season
      const weatherMatch = weatherContent.match(/game:currentWeather "([^"]+)"/);
      const timeOfDayMatch = weatherContent.match(/game:currentTimeOfDay "([^"]+)"/);
      const seasonMatch = weatherContent.match(/game:currentSeason "([^"]+)"/);
      
      if (!weatherMatch || !timeOfDayMatch || !seasonMatch) {
        console.error('Could not find weather information');
        return;
      }
      
      const currentWeather = weatherMatch[1];
      const currentTimeOfDay = timeOfDayMatch[1];
      const currentSeason = seasonMatch[1];
      
      // Get weather effects
      const weatherEffects = weatherTypes[currentWeather];
      const timeOfDayEffects = timeOfDayTypes[currentTimeOfDay];
      const seasonEffects = seasonTypes[currentSeason];
      
      if (!weatherEffects || !timeOfDayEffects || !seasonEffects) {
        console.error('Could not find weather effects');
        return;
      }
      
      // Calculate modifier based on action type
      let modifier = 1.0;
      
      switch (actionType) {
        case 'movement':
          modifier = weatherEffects.movementModifier * timeOfDayEffects.movementModifier * seasonEffects.movementModifier;
          break;
        case 'gathering':
          modifier = weatherEffects.gatheringModifier * timeOfDayEffects.gatheringModifier * seasonEffects.gatheringModifier;
          break;
        case 'combat':
          modifier = weatherEffects.combatModifier * timeOfDayEffects.combatModifier * seasonEffects.combatModifier;
          break;
        case 'visibility':
          modifier = weatherEffects.visibilityModifier * timeOfDayEffects.visibilityModifier * seasonEffects.visibilityModifier;
          break;
        default:
          console.error(`Unknown action type: ${actionType}`);
          return;
      }
      
      console.log(`Weather: ${weatherEffects.description}`);
      console.log(`Time of Day: ${timeOfDayEffects.description}`);
      console.log(`Season: ${seasonEffects.description}`);
      console.log(`${actionType.charAt(0).toUpperCase() + actionType.slice(1)} Modifier: ${modifier.toFixed(2)}`);
    } catch (error) {
      console.error(`Error getting weather modifier: ${error.message}`);
    }
  });

// Export functions and program
module.exports = {
  weatherTypes,
  timeOfDayTypes,
  seasonTypes,
  program
};