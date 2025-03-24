# Git-RTS Game Mechanics

This document explains the core game mechanics of Git-RTS, a real-time strategy game that uses Git as its underlying engine.

## Table of Contents

- [Overview](#overview)
- [Resources](#resources)
- [Units](#units)
- [Buildings](#buildings)
- [Technologies](#technologies)
- [Combat](#combat)
- [Terrain](#terrain)
- [Weather](#weather)
- [Diplomacy](#diplomacy)
- [Turn-Based Mechanics](#turn-based-mechanics)
- [Git Integration](#git-integration)

## Overview

Git-RTS is a turn-based strategy game where players control units, gather resources, build structures, and research technologies to defeat their opponents. What makes Git-RTS unique is its use of Git as the underlying game engine, with game actions represented as commits and player states as branches.

## Resources

Players gather and manage four types of resources:

### Gold

- **Source**: Gold mines
- **Uses**: Advanced units, technologies, and buildings
- **Gathering Rate**: 10 gold per minute per worker
- **Starting Amount**: 100 gold

### Wood

- **Source**: Forests
- **Uses**: Basic buildings and units
- **Gathering Rate**: 15 wood per minute per worker
- **Starting Amount**: 100 wood

### Stone

- **Source**: Quarries
- **Uses**: Defensive structures and advanced buildings
- **Gathering Rate**: 8 stone per minute per worker
- **Starting Amount**: 50 stone

### Food

- **Source**: Farms, hunting
- **Uses**: Unit maintenance and population growth
- **Gathering Rate**: 12 food per minute per worker
- **Starting Amount**: 200 food

## Units

Units are the characters that players control in the game. Each unit has different attributes and abilities:

### Settler

- **Cost**: 50 food
- **Attack**: 2
- **Defense**: 2
- **Health**: 50
- **Movement**: 5 tiles per turn
- **Abilities**: Build structures, gather resources

### Warrior

- **Cost**: 50 food, 30 wood
- **Attack**: 10
- **Defense**: 5
- **Health**: 100
- **Movement**: 8 tiles per turn
- **Abilities**: Attack enemy units and buildings

### Archer

- **Cost**: 40 food, 40 wood
- **Attack**: 15
- **Defense**: 3
- **Health**: 80
- **Movement**: 7 tiles per turn
- **Abilities**: Ranged attack (up to 3 tiles away)

### Cavalry

- **Cost**: 80 food, 50 wood
- **Attack**: 12
- **Defense**: 8
- **Health**: 120
- **Movement**: 12 tiles per turn
- **Abilities**: Charge attack (bonus damage on first attack)

### Siege Engine

- **Cost**: 100 food, 80 wood, 50 stone
- **Attack**: 5 (units), 30 (buildings)
- **Defense**: 4
- **Health**: 150
- **Movement**: 4 tiles per turn
- **Abilities**: Area damage, building destruction

## Buildings

Buildings provide various functions such as unit production, resource storage, and defense:

### Town Center

- **Cost**: 100 wood, 50 stone
- **Health**: 500
- **Functions**: Produces settlers, serves as a resource drop-off point
- **Special**: Each player starts with one Town Center

### Barracks

- **Cost**: 150 wood
- **Health**: 300
- **Functions**: Produces military units (Warriors, Archers)

### Stable

- **Cost**: 180 wood, 50 stone
- **Health**: 350
- **Functions**: Produces cavalry units

### Workshop

- **Cost**: 200 wood, 100 stone
- **Health**: 400
- **Functions**: Produces siege engines

### Market

- **Cost**: 150 wood, 50 gold
- **Health**: 250
- **Functions**: Enables resource trading, improves resource gathering rates

### University

- **Cost**: 200 wood, 150 stone, 100 gold
- **Health**: 300
- **Functions**: Enables technology research

### Wall

- **Cost**: 50 stone per segment
- **Health**: 500
- **Functions**: Blocks enemy movement, provides defensive bonus

### Tower

- **Cost**: 100 wood, 100 stone
- **Health**: 400
- **Functions**: Provides visibility, attacks enemy units within range

## Technologies

Technologies provide various bonuses and unlock new abilities:

### Bronze Working

- **Cost**: 150 gold, 100 wood
- **Effect**: +2 attack for all units
- **Prerequisite**: None

### Iron Working

- **Cost**: 250 gold, 150 wood
- **Effect**: +3 attack for all units
- **Prerequisite**: Bronze Working

### Masonry

- **Cost**: 150 stone, 100 wood
- **Effect**: +50% health for all buildings
- **Prerequisite**: None

### Architecture

- **Cost**: 250 stone, 150 wood
- **Effect**: +100% health for all buildings
- **Prerequisite**: Masonry

### Wheel

- **Cost**: 100 wood, 50 gold
- **Effect**: +2 movement for all units
- **Prerequisite**: None

### Horseback Riding

- **Cost**: 150 wood, 100 gold
- **Effect**: Unlocks Cavalry units
- **Prerequisite**: Wheel

### Mathematics

- **Cost**: 200 gold
- **Effect**: +2 range for Archers and Towers
- **Prerequisite**: None

### Engineering

- **Cost**: 300 gold, 150 stone
- **Effect**: Unlocks Siege Engines
- **Prerequisite**: Mathematics

## Combat

Combat in Git-RTS is deterministic and based on unit attributes:

### Attack Resolution

1. Attacker's attack value is compared to defender's defense value
2. Damage = Attacker's attack - Defender's defense (minimum 1)
3. Defender's health is reduced by the damage amount
4. If the defender's health reaches 0, the unit is destroyed

### Terrain Effects

Different terrain types affect combat:

- **Hills**: +2 defense for defenders
- **Forest**: -1 attack for attackers, +1 defense for defenders
- **Plains**: No modifiers
- **Mountains**: Impassable
- **Water**: Impassable (without appropriate technology)

### Unit Advantages

Some units have advantages against others:

- **Archers**: +5 attack against Warriors
- **Cavalry**: +5 attack against Archers
- **Warriors**: +2 defense against Cavalry
- **Siege Engines**: +25 attack against buildings

## Terrain

The game world consists of various terrain types, each with different effects:

### Plains

- **Movement Cost**: 1
- **Resource Yield**: Normal
- **Combat Modifiers**: None

### Hills

- **Movement Cost**: 2
- **Resource Yield**: +25% for stone
- **Combat Modifiers**: +2 defense

### Forest

- **Movement Cost**: 2
- **Resource Yield**: +50% for wood
- **Combat Modifiers**: -1 attack, +1 defense

### Mountains

- **Movement Cost**: Impassable
- **Resource Yield**: +50% for stone (with Mining technology)
- **Combat Modifiers**: N/A

### Water

- **Movement Cost**: Impassable (without Sailing technology)
- **Resource Yield**: +50% for food (with Fishing technology)
- **Combat Modifiers**: N/A

### Desert

- **Movement Cost**: 1
- **Resource Yield**: -50% for all resources
- **Combat Modifiers**: -1 defense

## Weather

Weather conditions can affect gameplay:

### Clear

- **Movement Modifier**: None
- **Resource Gathering**: Normal
- **Combat Modifier**: None

### Rain

- **Movement Modifier**: +1 movement cost for all terrain
- **Resource Gathering**: -25% for wood and stone
- **Combat Modifier**: -1 attack for all units

### Snow

- **Movement Modifier**: +2 movement cost for all terrain
- **Resource Gathering**: -50% for all resources
- **Combat Modifier**: -2 attack, -1 defense for all units

### Fog

- **Movement Modifier**: None
- **Resource Gathering**: Normal
- **Combat Modifier**: -50% visibility range

## Diplomacy

Players can engage in diplomatic relations with each other:

### Alliance

- **Effect**: Players cannot attack each other's units or buildings
- **Implementation**: Pull request from one player to another

### Trade Agreement

- **Effect**: Players can exchange resources at favorable rates
- **Implementation**: Pull request with resource exchange details

### Non-Aggression Pact

- **Effect**: Players agree not to attack each other for a specified number of turns
- **Implementation**: Pull request with turn duration

### Tribute

- **Effect**: One player gives resources to another
- **Implementation**: Commit with resource transfer details

## Turn-Based Mechanics

Git-RTS uses a turn-based system for gameplay:

### Turn Structure

1. **Planning Phase**: Players issue commands to their units and buildings
2. **Execution Phase**: Commands are executed in order
3. **Resolution Phase**: Combat and other interactions are resolved
4. **End Phase**: Resources are gathered, technologies advance, etc.

### Synchronization

At the end of each turn, the game state is synchronized:

1. Players commit their actions to their branches
2. The game server merges all branches into the master branch
3. Conflicts are resolved according to game rules
4. The updated master branch is pulled by all players

## Git Integration

Git-RTS leverages Git's features for game mechanics:

### Branches

Each player has their own branch in the game repository:

```
master           # Main game state
├── player/alice # Alice's branch
└── player/bob   # Bob's branch
```

### Commits

Game actions are recorded as commits:

```
commit abc123
Author: Alice <alice@example.com>
Date:   Mon Mar 24 12:34:56 2025

    Move unit1 to (10, 20)
```

### Merges

Turn synchronization is implemented via merging:

```
      ┌─── Alice's move
      │
A ─── B ─── D
      │     │
      └─── C
           Bob's move
```

### Pull Requests

Diplomatic actions are implemented as pull requests:

```
Pull Request #42: Alliance between Alice and Bob
```

### Conflicts

When conflicts occur (e.g., two players trying to move units to the same tile), they are resolved according to game rules:

1. Movement conflicts: First come, first served
2. Combat conflicts: Resolved using combat rules
3. Resource conflicts: Resources are divided equally

### History

The Git history provides a complete record of the game:

```
git log --pretty=format:"%h - %an, %ar : %s"
```

This allows players to review past actions, analyze strategies, and learn from mistakes.