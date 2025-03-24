const { program } = require('commander');
const fs = require('fs').promises;
const { exec } = require('child_process');
const path = require('path');

// Resource types and their base values
const resourceValues = {
  'gold': {
    baseValue: 1.0,
    weight: 0.5,
    description: 'Currency for trading and purchasing'
  },
  'wood': {
    baseValue: 0.5,
    weight: 1.0,
    description: 'Used for buildings and some units'
  },
  'stone': {
    baseValue: 0.7,
    weight: 2.0,
    description: 'Used for advanced buildings and defenses'
  },
  'food': {
    baseValue: 0.3,
    weight: 0.8,
    description: 'Required for unit training and maintenance'
  }
};

// Market building types
const marketTypes = {
  'trading_post': {
    description: 'Basic market for local trading',
    tradingRange: 20,
    tradingFee: 0.1, // 10% fee
    buildCost: { gold: 100, wood: 150, stone: 50, food: 0 }
  },
  'marketplace': {
    description: 'Advanced market with better rates',
    tradingRange: 40,
    tradingFee: 0.05, // 5% fee
    buildCost: { gold: 300, wood: 200, stone: 150, food: 0 }
  },
  'trading_hub': {
    description: 'Central hub for global trading',
    tradingRange: 100,
    tradingFee: 0.02, // 2% fee
    buildCost: { gold: 500, wood: 300, stone: 300, food: 0 }
  }
};

// Trade route types
const tradeRouteTypes = {
  'caravan': {
    description: 'Basic land trade route',
    capacity: 100,
    speed: 1,
    securityLevel: 'low',
    setupCost: { gold: 50, wood: 20, stone: 0, food: 30 }
  },
  'merchant_ship': {
    description: 'Water-based trade route',
    capacity: 300,
    speed: 2,
    securityLevel: 'medium',
    setupCost: { gold: 200, wood: 100, stone: 0, food: 50 }
  }
};

// Initialize economic system
program
  .command('init-economy')
  .description('Initialize the economic system')
  .action(async () => {
    console.log('Initializing economic system...');
    
    const gameRepoDir = 'C:/Users/markj/Desktop/game-repo';
    const economyPath = `${gameRepoDir}/economy.ttl`;
    const marketsPath = `${gameRepoDir}/markets.ttl`;
    const tradeRoutesPath = `${gameRepoDir}/trade_routes.ttl`;
    
    try {
      // Create economy.ttl
      const economyContent = `@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>.
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>.
@prefix xsd: <http://www.w3.org/2001/XMLSchema#>.
@prefix game: <http://example.org/game#>.

# Economic system
game:economicSystem a game:EconomicSystem;
  game:version "1.0";
  game:marketCount 0;
  game:tradeRouteCount 0;
  game:globalTradeVolume 0;
  game:lastMarketUpdate "${new Date().toISOString()}".

# Resource values
game:goldResource a game:ResourceValue;
  game:resourceType "gold";
  game:baseValue "1.0"^^xsd:float;
  game:currentValue "1.0"^^xsd:float;
  game:weight "0.5"^^xsd:float;
  game:volatility "0.1"^^xsd:float;
  game:description "Currency for trading and purchasing".

game:woodResource a game:ResourceValue;
  game:resourceType "wood";
  game:baseValue "0.5"^^xsd:float;
  game:currentValue "0.5"^^xsd:float;
  game:weight "1.0"^^xsd:float;
  game:volatility "0.2"^^xsd:float;
  game:description "Used for buildings and some units".

game:stoneResource a game:ResourceValue;
  game:resourceType "stone";
  game:baseValue "0.7"^^xsd:float;
  game:currentValue "0.7"^^xsd:float;
  game:weight "2.0"^^xsd:float;
  game:volatility "0.15"^^xsd:float;
  game:description "Used for advanced buildings and defenses".

game:foodResource a game:ResourceValue;
  game:resourceType "food";
  game:baseValue "0.3"^^xsd:float;
  game:currentValue "0.3"^^xsd:float;
  game:weight "0.8"^^xsd:float;
  game:volatility "0.3"^^xsd:float;
  game:description "Required for unit training and maintenance".

# Market types
game:tradingPostMarket a game:MarketType;
  game:name "trading_post";
  game:description "Basic market for local trading";
  game:tradingRange 20;
  game:tradingFee "0.1"^^xsd:float;
  game:buildCost "gold:100,wood:150,stone:50,food:0".

game:marketplaceMarket a game:MarketType;
  game:name "marketplace";
  game:description "Advanced market with better rates";
  game:tradingRange 40;
  game:tradingFee "0.05"^^xsd:float;
  game:buildCost "gold:300,wood:200,stone:150,food:0".

game:tradingHubMarket a game:MarketType;
  game:name "trading_hub";
  game:description "Central hub for global trading";
  game:tradingRange 100;
  game:tradingFee "0.02"^^xsd:float;
  game:buildCost "gold:500,wood:300,stone:300,food:0".

# Trade route types
game:caravanRoute a game:TradeRouteType;
  game:name "caravan";
  game:description "Basic land trade route";
  game:capacity 100;
  game:speed 1;
  game:securityLevel "low";
  game:setupCost "gold:50,wood:20,stone:0,food:30".

game:merchantShipRoute a game:TradeRouteType;
  game:name "merchant_ship";
  game:description "Water-based trade route";
  game:capacity 300;
  game:speed 2;
  game:securityLevel "medium";
  game:setupCost "gold:200,wood:100,stone:0,food:50".`;
      
      // Create markets.ttl
      const marketsContent = `@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>.
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>.
@prefix xsd: <http://www.w3.org/2001/XMLSchema#>.
@prefix game: <http://example.org/game#>.

# Markets
game:marketRegistry a game:MarketRegistry;
  game:markets "";
  game:activeTradeOffers "".`;
      
      // Create trade_routes.ttl
      const tradeRoutesContent = `@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>.
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>.
@prefix xsd: <http://www.w3.org/2001/XMLSchema#>.
@prefix game: <http://example.org/game#>.

# Trade routes
game:tradeRouteRegistry a game:TradeRouteRegistry;
  game:tradeRoutes "";
  game:activeShipments "".`;
      
      await fs.writeFile(economyPath, economyContent);
      await fs.writeFile(marketsPath, marketsContent);
      await fs.writeFile(tradeRoutesPath, tradeRoutesContent);
      
      // Commit changes
      await exec('git add economy.ttl markets.ttl trade_routes.ttl', { cwd: gameRepoDir });
      await exec('git commit -m "Initialize economic system"', { cwd: gameRepoDir });
      
      console.log('Economic system initialized successfully!');
    } catch (error) {
      console.error(`Error initializing economic system: ${error.message}`);
    }
  });

// Build a market
program
  .command('build-market <marketType> <x> <y>')
  .description('Build a market at the specified location')
  .action(async (marketType, x, y) => {
    console.log(`Building ${marketType} at (${x}, ${y})...`);
    
    const gameRepoDir = 'C:/Users/markj/Desktop/game-repo';
    const economyPath = `${gameRepoDir}/economy.ttl`;
    const marketsPath = `${gameRepoDir}/markets.ttl`;
    const playerResourcesPath = `${gameRepoDir}/player_resources.ttl`;
    
    try {
      // Check if market type exists
      if (!marketTypes[marketType]) {
        console.error(`Invalid market type: ${marketType}`);
        console.log('Available market types:');
        Object.entries(marketTypes).forEach(([type, info]) => {
          console.log(`- ${type}: ${info.description}`);
        });
        return;
      }
      
      // Read economy.ttl to get market count
      const economyContent = await fs.readFile(economyPath, 'utf8');
      const marketCountMatch = economyContent.match(/game:marketCount (\d+)/);
      if (!marketCountMatch) {
        console.error('Could not find market count in economy.ttl');
        return;
      }
      
      const marketCount = parseInt(marketCountMatch[1]);
      const newMarketCount = marketCount + 1;
      const marketId = `game:market${newMarketCount}`;
      
      // Check if player has enough resources
      const playerResourcesContent = await fs.readFile(playerResourcesPath, 'utf8');
      const goldMatch = playerResourcesContent.match(/game:gold (\d+)/);
      const woodMatch = playerResourcesContent.match(/game:wood (\d+)/);
      const stoneMatch = playerResourcesContent.match(/game:stone (\d+)/);
      const foodMatch = playerResourcesContent.match(/game:food (\d+)/);
      
      if (!goldMatch || !woodMatch || !stoneMatch || !foodMatch) {
        console.error('Could not find player resources');
        return;
      }
      
      const playerGold = parseInt(goldMatch[1]);
      const playerWood = parseInt(woodMatch[1]);
      const playerStone = parseInt(stoneMatch[1]);
      const playerFood = parseInt(foodMatch[1]);
      
      const cost = marketTypes[marketType].buildCost;
      
      if (playerGold < cost.gold || playerWood < cost.wood || 
          playerStone < cost.stone || playerFood < cost.food) {
        console.error(`Not enough resources to build ${marketType}`);
        console.log(`Required: Gold: ${cost.gold}, Wood: ${cost.wood}, Stone: ${cost.stone}, Food: ${cost.food}`);
        console.log(`Available: Gold: ${playerGold}, Wood: ${playerWood}, Stone: ${playerStone}, Food: ${playerFood}`);
        return;
      }
      
      // Read markets.ttl
      const marketsContent = await fs.readFile(marketsPath, 'utf8');
      
      // Create new market entry
      const newMarket = `
${marketId} a game:Market;
  game:marketType "${marketType}";
  game:owner game:player1;
  game:location "{x: ${x}, y: ${y}}";
  game:tradingRange ${marketTypes[marketType].tradingRange};
  game:tradingFee "${marketTypes[marketType].tradingFee}"^^xsd:float;
  game:tradeVolume 0;
  game:activeOffers "";
  game:createdAt "${new Date().toISOString()}".`;
      
      // Update markets.ttl
      const updatedMarketsContent = marketsContent.replace(
        /game:markets "([^"]*)"/,
        (match, markets) => {
          const marketsList = markets ? `${markets},${marketId.replace('game:', '')}` : marketId.replace('game:', '');
          return `game:markets "${marketsList}"`;
        }
      );
      
      await fs.writeFile(marketsPath, updatedMarketsContent + newMarket);
      
      // Update economy.ttl
      const updatedEconomyContent = economyContent
        .replace(/game:marketCount \d+/, `game:marketCount ${newMarketCount}`)
        .replace(/game:lastMarketUpdate "[^"]+"/, `game:lastMarketUpdate "${new Date().toISOString()}"`);
      
      await fs.writeFile(economyPath, updatedEconomyContent);
      
      // Update player resources
      const updatedPlayerResourcesContent = playerResourcesContent
        .replace(/game:gold \d+/, `game:gold ${playerGold - cost.gold}`)
        .replace(/game:wood \d+/, `game:wood ${playerWood - cost.wood}`)
        .replace(/game:stone \d+/, `game:stone ${playerStone - cost.stone}`)
        .replace(/game:food \d+/, `game:food ${playerFood - cost.food}`);
      
      await fs.writeFile(playerResourcesPath, updatedPlayerResourcesContent);
      
      // Commit changes
      await exec('git add economy.ttl markets.ttl player_resources.ttl', { cwd: gameRepoDir });
      await exec(`git commit -m "Build ${marketType} market at (${x}, ${y})"`, { cwd: gameRepoDir });
      
      console.log(`Successfully built ${marketType} market at (${x}, ${y})!`);
    } catch (error) {
      console.error(`Error building market: ${error.message}`);
    }
  });

// Export functions and program
module.exports = {
  resourceValues,
  marketTypes,
  tradeRouteTypes,
  program
};
