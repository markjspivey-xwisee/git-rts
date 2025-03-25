# Semantic Web Integration in Git-RTS

Git-RTS combines Git-based version control with Semantic Web technologies to create a unique gaming architecture. This document explains how these technologies work together.

## Architecture Overview

Git-RTS employs a hybrid architecture that leverages:

1. **Git** for version control, history, and synchronization
2. **RDF/Turtle** for data representation
3. **OWL** for ontology definition
4. **SHACL** for data validation
5. **Hydra** for hypermedia controls
6. **RESTful APIs** for client interaction

## Data Flow

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  Client (Web/   │     │  RESTful API    │     │  Git Repository │
│  CLI/AI)        │◄────┤  with Hydra     │◄────┤  with RDF/TTL   │
│                 │     │  Controls       │     │  Files          │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                        │
                                                        │
                                                        ▼
                                              ┌─────────────────┐
                                              │                 │
                                              │  OWL Ontology & │
                                              │  SHACL Shapes   │
                                              │                 │
                                              └─────────────────┘
```

## RDF Data Model

Game state is stored in Turtle (.ttl) files, which are RDF serialization format:

- `units.ttl` - Information about game units
- `resource_nodes.ttl` - Information about resource nodes
- `player_resources.ttl` - Player resource information
- `world.ttl` - World map and terrain information

Example of a unit in Turtle format:

```turtle
game:unit1 a game:Unit;
  game:type "infantry";
  game:health 100;
  game:attack 10;
  game:defense 5;
  game:level 1;
  game:experience 0;
  game:location "{x: 10, y: 20}".
```

## OWL Ontology

The game ontology defines the concepts and relationships in the game:

```turtle
@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>.
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>.
@prefix owl: <http://www.w3.org/2002/07/owl#>.
@prefix xsd: <http://www.w3.org/2001/XMLSchema#>.
@prefix game: <http://example.org/game#>.

game:Unit a owl:Class;
  rdfs:label "Unit"@en;
  rdfs:comment "A game unit that can move and engage in combat"@en.

game:type a owl:DatatypeProperty;
  rdfs:domain game:Unit;
  rdfs:range xsd:string.

game:health a owl:DatatypeProperty;
  rdfs:domain game:Unit;
  rdfs:range xsd:integer.

# ... more properties and classes
```

## SHACL Validation

SHACL shapes validate game state changes before they are committed:

```turtle
@prefix sh: <http://www.w3.org/ns/shacl#>.
@prefix game: <http://example.org/game#>.

game:UnitShape a sh:NodeShape;
  sh:targetClass game:Unit;
  sh:property [
    sh:path game:health;
    sh:datatype xsd:integer;
    sh:minInclusive 0;
    sh:maxInclusive 100;
  ];
  sh:property [
    sh:path game:type;
    sh:datatype xsd:string;
    sh:in ("infantry" "archer" "cavalry" "siege" "building");
  ].

# ... more validation rules
```

## Hydra Hypermedia Controls

Hydra vocabulary provides hypermedia controls for game actions:

```json
{
  "@context": {
    "hydra": "http://www.w3.org/ns/hydra/core#",
    "game": "https://player1.github.io/my-rts-world/ontology#"
  },
  "@type": "game:Unit",
  "@id": "game:unit1",
  "game:name": "Warrior",
  "game:attack": 10,
  "hydra:operation": [
    {
      "@type": "hydra:Operation",
      "hydra:method": "POST",
      "hydra:title": "Move Unit",
      "hydra:description": "Moves this unit to a new position",
      "hydra:expects": {
        "@type": "game:MoveAction",
        "game:x": "number",
        "game:y": "number"
      }
    },
    {
      "@type": "hydra:Operation",
      "hydra:method": "POST",
      "hydra:title": "Attack",
      "hydra:description": "Attack another unit",
      "hydra:expects": {
        "@type": "game:AttackAction",
        "game:target": "URI"
      }
    }
  ]
}
```

## Git Integration

Git operations are used to:

1. **Record Game Actions**: Each game action is a commit
2. **Synchronize Game State**: Merges synchronize game state between players
3. **Validate Actions**: Pre-commit hooks validate actions using SHACL
4. **Trigger Events**: Post-commit hooks trigger game events

## How It All Works Together

1. **Player Action Flow**:
   - Player initiates action through RESTful API with Hydra controls
   - Action is validated against SHACL shapes
   - If valid, action is committed to Git repository as RDF/Turtle
   - Post-commit hooks trigger game events
   - Updated game state is available through RESTful API

2. **Synchronization Flow**:
   - Player synchronizes with peers using Git operations
   - Merges incorporate other players' actions
   - Conflicts are resolved using game rules
   - Updated game state is validated against SHACL shapes

3. **AI Integration Flow**:
   - AI assistant accesses game state through MCP
   - Game state is presented with Hydra controls
   - AI can understand game concepts through OWL ontology
   - AI can take actions through RESTful API

This hybrid architecture combines the best of both worlds:
- **Git** provides distributed version control and synchronization
- **Semantic Web** provides rich data modeling and validation
- **Hypermedia** provides discoverability and self-documentation