# Git-RTS Modding Guide

This guide explains how to create mods for Git-RTS, extending the game with new units, buildings, technologies, and mechanics.

## Table of Contents

- [Introduction](#introduction)
- [Getting Started](#getting-started)
- [Modding the Ontology](#modding-the-ontology)
- [Creating New Units](#creating-new-units)
- [Creating New Buildings](#creating-new-buildings)
- [Creating New Technologies](#creating-new-technologies)
- [Creating New Resources](#creating-new-resources)
- [Modifying Terrain](#modifying-terrain)
- [Custom Game Mechanics](#custom-game-mechanics)
- [Distributing Your Mod](#distributing-your-mod)
- [Best Practices](#best-practices)

## Introduction

Git-RTS is designed to be highly moddable. Since the game state is stored in Turtle (TTL) files and the game mechanics are implemented using Git operations, you can modify almost every aspect of the game by editing these files and creating new ones.

## Getting Started

To start modding Git-RTS, you'll need:

1. A copy of the Git-RTS repository
2. A text editor for editing TTL files
3. Basic knowledge of RDF and Turtle syntax
4. Understanding of Git operations

### Setting Up a Mod Project

1. Fork the `git-rts-world-template` repository
2. Clone your fork to your local machine
3. Create a new branch for your mod
4. Make your changes
5. Push your changes to your fork
6. Create a pull request to the main repository (optional)

```bash
# Fork the repository on GitHub
# Then clone your fork
git clone https://github.com/yourusername/git-rts-world-template.git
cd git-rts-world-template

# Create a branch for your mod
git checkout -b my-awesome-mod

# Make your changes...

# Commit and push your changes
git add .
git commit -m "Add my awesome mod"
git push origin my-awesome-mod
```

## Modding the Ontology

The game ontology defines the structure of the game resources and their relationships. To add new types of entities or properties, you'll need to modify the ontology.

### Ontology File Location

The main ontology file is located at `ontology/index.ttl`.

### Adding a New Class

To add a new class (e.g., a new type of unit), add a new class definition to the ontology:

```turtle
game:HeroUnit a rdfs:Class, hydra:Class ;
    rdfs:label "Hero Unit" ;
    rdfs:comment "A powerful hero unit with special abilities" ;
    rdfs:subClassOf game:Unit ;
    hydra:supportedOperation [
        a hydra:Operation ;
        hydra:method "POST" ;
        hydra:title "Use Special Ability" ;
        hydra:description "Uses the hero's special ability"
    ] .
```

### Adding a New Property

To add a new property (e.g., a new attribute for units), add a new property definition to the ontology:

```turtle
game:mana a rdf:Property ;
    rdfs:label "Mana" ;
    rdfs:comment "The magical energy of a unit" ;
    rdfs:domain game:HeroUnit ;
    rdfs:range xsd:integer .
```

## Creating New Units

Units are defined in the `units.ttl` file. To create a new unit, add a new unit definition:

```turtle
game:dragonRider a game:Unit ;
    game:name "Dragon Rider" ;
    game:attack 20 ;
    game:defense 15 ;
    game:health 200 ;
    game:location "{x: 10, y: 10}" ;
    game:owner game:player1 ;
    game:specialAbility "Flying" ;
    hydra:operation [
        a hydra:Operation ;
        hydra:method "POST" ;
        hydra:title "Breathe Fire" ;
        hydra:description "Attacks all units in a 3x3 area"
    ] .
```

### Unit Properties

- `game:name`: The name of the unit
- `game:attack`: The attack value of the unit
- `game:defense`: The defense value of the unit
- `game:health`: The health value of the unit
- `game:location`: The location of the unit in the game world
- `game:owner`: The player who owns the unit
- `game:specialAbility`: Any special abilities the unit has

### Unit Operations

Units can have operations that allow them to perform actions:

```turtle
hydra:operation [
    a hydra:Operation ;
    hydra:method "POST" ;
    hydra:title "Move Unit" ;
    hydra:description "Moves this unit to a new position" ;
    hydra:expects [
        a hydra:Class ;
        hydra:supportedProperty [
            a hydra:SupportedProperty ;
            hydra:property game:x ;
            hydra:required "true"^^xsd:boolean
        ], [
            a hydra:SupportedProperty ;
            hydra:property game:y ;
            hydra:required "true"^^xsd:boolean
        ]
    ] ;
    hydra:returns game:Unit
] .
```

## Creating New Buildings

Buildings are defined in the `buildings.ttl` file. To create a new building, add a new building definition:

```turtle
game:mageTower a game:Building ;
    game:name "Mage Tower" ;
    game:health 300 ;
    game:location "{x: 15, y: 15}" ;
    game:owner game:player1 ;
    game:productionType "HeroUnit" ;
    hydra:operation [
        a hydra:Operation ;
        hydra:method "POST" ;
        hydra:title "Train Mage" ;
        hydra:description "Trains a new mage unit"
    ] .
```

### Building Properties

- `game:name`: The name of the building
- `game:health`: The health value of the building
- `game:location`: The location of the building in the game world
- `game:owner`: The player who owns the building
- `game:productionType`: The type of unit or resource this building produces

### Building Operations

Buildings can have operations that allow them to perform actions:

```turtle
hydra:operation [
    a hydra:Operation ;
    hydra:method "POST" ;
    hydra:title "Train Unit" ;
    hydra:description "Trains a new unit at this building" ;
    hydra:expects [
        a hydra:Class ;
        hydra:supportedProperty [
            a hydra:SupportedProperty ;
            hydra:property game:unitType ;
            hydra:required "true"^^xsd:boolean
        ]
    ] ;
    hydra:returns game:Unit
] .
```

## Creating New Technologies

Technologies are defined in the `technologies.ttl` file. To create a new technology, add a new technology definition:

```turtle
game:magicMastery a game:Technology ;
    game:name "Magic Mastery" ;
    game:cost "{gold: 300, wood: 150}" ;
    game:researchTime 10 ;
    game:effect "Increases mana regeneration by 50%" ;
    game:prerequisite game:basicMagic ;
    hydra:operation [
        a hydra:Operation ;
        hydra:method "POST" ;
        hydra:title "Research Technology" ;
        hydra:description "Researches this technology"
    ] .
```

### Technology Properties

- `game:name`: The name of the technology
- `game:cost`: The cost to research the technology
- `game:researchTime`: The time it takes to research the technology
- `game:effect`: The effect of the technology
- `game:prerequisite`: Any technologies that must be researched first

## Creating New Resources

Resources are defined in the `resource_nodes.ttl` file. To create a new resource type, add a new resource node definition:

```turtle
game:crystalDeposit a game:ResourceNode ;
    game:name "Crystal Deposit" ;
    game:type "crystal" ;
    game:amount 1000 ;
    game:location "{x: 30, y: 40}" ;
    hydra:operation [
        a hydra:Operation ;
        hydra:method "POST" ;
        hydra:title "Gather Crystals" ;
        hydra:description "Gathers crystals from this deposit"
    ] .
```

### Resource Properties

- `game:name`: The name of the resource node
- `game:type`: The type of resource
- `game:amount`: The amount of resource available
- `game:location`: The location of the resource node in the game world

## Modifying Terrain

Terrain is defined in the `world.ttl` file. To modify terrain, edit the world definition:

```turtle
game:world a game:World ;
    game:name "My Modded World" ;
    game:size 200 ;
    game:terrain [
        a game:TerrainMap ;
        game:terrainAt [
            a game:TerrainCell ;
            game:x 10 ;
            game:y 20 ;
            game:type "volcano" ;
            game:movementCost 3 ;
            game:combatModifier "{attack: -2, defense: -1}"
        ]
    ] .
```

### Terrain Properties

- `game:type`: The type of terrain
- `game:movementCost`: The movement cost to enter this terrain
- `game:combatModifier`: Any combat modifiers applied in this terrain

## Custom Game Mechanics

To implement custom game mechanics, you'll need to modify the CLI tools and MCP server. This requires JavaScript/TypeScript programming knowledge.

### Adding a New Command

To add a new command to the CLI, create a new file in the `git-rts-cli` directory:

```javascript
// magic.js
const { program } = require('commander');

program
  .command('cast-spell <unitUri> <spellName>')
  .description('Cast a spell with a unit')
  .action(async (unitUri, spellName) => {
    console.log(`Casting spell ${spellName} with unit ${unitUri}...`);
    // Implementation here
  });

module.exports = program;
```

Then, add the command to `index.js`:

```javascript
const magic = require('./magic');
// ...
magic.program.parse(process.argv);
```

### Adding a New MCP Tool

To add a new tool to the MCP server, modify the `mcp-server.ts` file:

```typescript
// Add to the tools list
{
  name: 'cast_spell',
  description: 'Cast a spell with a unit',
  inputSchema: {
    type: 'object',
    properties: {
      unitUri: {
        type: 'string',
        description: 'URI of the unit casting the spell'
      },
      spellName: {
        type: 'string',
        description: 'Name of the spell to cast'
      }
    },
    required: ['unitUri', 'spellName']
  }
}

// Add to the tool handler
else if (name === 'cast_spell') {
  const { unitUri, spellName } = args as { unitUri: string; spellName: string };
  if (!unitUri || !spellName) {
    throw new McpError(
      ErrorCode.InvalidParams,
      'Unit URI and spell name are required'
    );
  }
  
  try {
    const output = await executeCli('cast-spell', [unitUri, spellName]);
    return {
      content: [
        {
          type: 'text',
          text: output
        }
      ]
    };
  } catch (error) {
    throw new McpError(
      ErrorCode.InternalError,
      `Error casting spell: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
```

## Distributing Your Mod

To distribute your mod, you can:

1. Push your mod to GitHub
2. Create a release with a descriptive name and version
3. Share the repository URL with others

Players can use your mod by:

1. Cloning your repository
2. Using it as a template for creating new games
3. Merging your changes into their existing games

## Best Practices

### Naming Conventions

- Use CamelCase for resource URIs (e.g., `game:dragonRider`)
- Use descriptive names for resources
- Prefix custom properties with your mod name to avoid conflicts

### Documentation

- Document your mod thoroughly
- Explain what each new unit, building, and technology does
- Provide examples of how to use your mod

### Compatibility

- Test your mod with the latest version of Git-RTS
- Avoid modifying core game mechanics unless necessary
- Make your mod compatible with other popular mods

### Performance

- Keep your TTL files clean and well-organized
- Avoid adding too many new entities that could slow down the game
- Test your mod with large game worlds to ensure it performs well

### Community

- Share your mod with the Git-RTS community
- Collaborate with other modders
- Incorporate feedback from players