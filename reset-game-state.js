const fs = require('fs').promises;
const { exec } = require('child_process');
const path = require('path');

async function execPromise(command, options) {
  return new Promise((resolve, reject) => {
    exec(command, options, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing command: ${error.message}`);
        console.error(`stderr: ${stderr}`);
        reject(error);
      } else {
        resolve(stdout);
      }
    });
  });
}

async function resetGameState() {
  console.log('Resetting game state...');
  const gameRepoDir = 'C:/Users/markj/Desktop/game-repo';

  try {
    // Create basic TTL files with default values
    const worldTtl = `@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>.
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>.
@prefix xsd: <http://www.w3.org/2001/XMLSchema#>.
@prefix game: <http://example.org/game#>.
@prefix hydra: <http://www.w3.org/ns/hydra/core#>.

game:world a game:World, hydra:Resource;
  game:name "My Game World";
  game:size 100;
  hydra:operation [
    a hydra:Operation;
    hydra:method "GET";
    hydra:title "Get World Information";
    hydra:description "Retrieves information about the game world";
    hydra:returns game:World
  ];
  hydra:collection [
    a hydra:Collection;
    hydra:title "Players";
    hydra:description "The players in this game world";
    hydra:member game:player1;
    hydra:manages [
      a hydra:IriTemplate;
      hydra:template "http://example.org/game/players{?name}";
      hydra:variableRepresentation hydra:BasicRepresentation;
      hydra:mapping [
        a hydra:IriTemplateMapping;
        hydra:variable "name";
        hydra:property game:name;
        hydra:required "false"^^xsd:boolean
      ]
    ]
  ], [
    a hydra:Collection;
    hydra:title "Units";
    hydra:description "All units in this game world";
    hydra:member game:unit1;
    hydra:manages [
      a hydra:IriTemplate;
      hydra:template "http://example.org/game/units{?type,player}";
      hydra:variableRepresentation hydra:BasicRepresentation;
      hydra:mapping [
        a hydra:IriTemplateMapping;
        hydra:variable "type";
        hydra:property game:unitType;
        hydra:required "false"^^xsd:boolean
      ], [
        a hydra:IriTemplateMapping;
        hydra:variable "player";
        hydra:property game:owner;
        hydra:required "false"^^xsd:boolean
      ]
    ]
  ], [
    a hydra:Collection;
    hydra:title "Resource Nodes";
    hydra:description "All resource nodes in this game world";
    hydra:manages [
      a hydra:IriTemplate;
      hydra:template "http://example.org/game/resource-nodes{?type}";
      hydra:variableRepresentation hydra:BasicRepresentation;
      hydra:mapping [
        a hydra:IriTemplateMapping;
        hydra:variable "type";
        hydra:property game:type;
        hydra:required "false"^^xsd:boolean
      ]
    ]
  ];
  hydra:link [
    a hydra:Link;
    hydra:title "Game Ontology";
    hydra:description "The ontology that defines the structure of the game";
    hydra:property rdfs:isDefinedBy;
    hydra:target "http://example.org/game/ontology"
  ], [
    a hydra:Link;
    hydra:title "API Documentation";
    hydra:description "The API documentation for the game";
    hydra:property hydra:apiDocumentation;
    hydra:target "http://example.org/game/api-doc"
  ].`;
    await fs.writeFile(`${gameRepoDir}/world.ttl`, worldTtl);

    const unitsTtl = `@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>.
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>.
@prefix xsd: <http://www.w3.org/2001/XMLSchema#>.
@prefix game: <http://example.org/game#>.
@prefix hydra: <http://www.w3.org/ns/hydra/core#>.

game:unit1 a game:Unit;
  game:name "Warrior";
  game:attack 10;
  game:defense 5;
  game:health 100;
  game:location "{x: 10, y: 10}";
  hydra:operation [
    a hydra:Operation;
    hydra:method "GET";
    hydra:title "Get Unit Information";
    hydra:description "Retrieves information about this unit";
    hydra:returns game:Unit
  ], [
    a hydra:Operation;
    hydra:method "POST";
    hydra:title "Move Unit";
    hydra:description "Moves this unit to a new position";
    hydra:expects [
      a hydra:Class;
      hydra:supportedProperty [
        a hydra:SupportedProperty;
        hydra:property game:x;
        hydra:required "true"^^xsd:boolean
      ], [
        a hydra:SupportedProperty;
        hydra:property game:y;
        hydra:required "true"^^xsd:boolean
      ]
    ];
    hydra:returns game:Unit
  ], [
    a hydra:Operation;
    hydra:method "POST";
    hydra:title "Gather Resources";
    hydra:description "Gathers resources from a resource node";
    hydra:expects [
      a hydra:Class;
      hydra:supportedProperty [
        a hydra:SupportedProperty;
        hydra:property game:resourceNode;
        hydra:required "true"^^xsd:boolean
      ]
    ];
    hydra:returns game:Unit
  ];
  hydra:link [
    a hydra:Link;
    hydra:title "Owner";
    hydra:description "The player who owns this unit";
    hydra:property game:owner;
    hydra:target game:player1
  ].`;
    await fs.writeFile(`${gameRepoDir}/units.ttl`, unitsTtl);

    const playerResourcesTtl = `@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>.
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>.
@prefix xsd: <http://www.w3.org/2001/XMLSchema#>.
@prefix game: <http://example.org/game#>.
@prefix hydra: <http://www.w3.org/ns/hydra/core#>.

game:player1 a game:Player;
  game:gold 100;
  game:wood 100;
  game:stone 50;
  game:food 200;
  hydra:operation [
    a hydra:Operation;
    hydra:method "GET";
    hydra:title "Get Player Resources";
    hydra:description "Retrieves the resources of this player";
    hydra:returns game:Player
  ], [
    a hydra:Operation;
    hydra:method "PUT";
    hydra:title "Update Player Resources";
    hydra:description "Updates the resources of this player";
    hydra:expects game:Player;
    hydra:returns game:Player
  ];
  hydra:link [
    a hydra:Link;
    hydra:title "Units";
    hydra:description "The units owned by this player";
    hydra:property game:units;
    hydra:collection [
      a hydra:Collection;
      hydra:manages [
        a hydra:IriTemplate;
        hydra:template "http://example.org/game/player1/units";
        hydra:variableRepresentation hydra:BasicRepresentation;
        hydra:mapping [
          a hydra:IriTemplateMapping;
          hydra:variable "unit";
          hydra:property game:Unit;
          hydra:required "false"^^xsd:boolean
        ]
      ]
    ]
  ], [
    a hydra:Link;
    hydra:title "Create Alliance";
    hydra:description "Create a new alliance";
    hydra:property game:createAlliance;
    hydra:target "http://example.org/game/alliances/create"
  ], [
    a hydra:Link;
    hydra:title "Research Technology";
    hydra:description "Research a new technology";
    hydra:property game:researchTechnology;
    hydra:target "http://example.org/game/technologies"
  ].`;
    await fs.writeFile(`${gameRepoDir}/player_resources.ttl`, playerResourcesTtl);

    const playerUnitsTtl = `@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>.
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>.
@prefix xsd: <http://www.w3.org/2001/XMLSchema#>.
@prefix game: <http://example.org/game#>.
@prefix hydra: <http://www.w3.org/ns/hydra/core#>.

game:player1 a game:Player;
  game:units game:unit1;
  hydra:operation [
    a hydra:Operation;
    hydra:method "GET";
    hydra:title "Get Player Units";
    hydra:description "Retrieves the units owned by this player";
    hydra:returns hydra:Collection
  ], [
    a hydra:Operation;
    hydra:method "POST";
    hydra:title "Train New Unit";
    hydra:description "Trains a new unit for this player";
    hydra:expects [
      a hydra:Class;
      hydra:supportedProperty [
        a hydra:SupportedProperty;
        hydra:property game:unitType;
        hydra:required "true"^^xsd:boolean
      ], [
        a hydra:SupportedProperty;
        hydra:property game:buildingUri;
        hydra:required "true"^^xsd:boolean
      ]
    ];
    hydra:returns game:Unit
  ];
  hydra:collection [
    a hydra:Collection;
    hydra:title "Units";
    hydra:description "The units owned by this player";
    hydra:member game:unit1;
    hydra:manages [
      a hydra:IriTemplate;
      hydra:template "http://example.org/game/player1/units{?type}";
      hydra:variableRepresentation hydra:BasicRepresentation;
      hydra:mapping [
        a hydra:IriTemplateMapping;
        hydra:variable "type";
        hydra:property game:unitType;
        hydra:required "false"^^xsd:boolean
      ]
    ]
  ];
  hydra:link [
    a hydra:Link;
    hydra:title "Resources";
    hydra:description "The resources of this player";
    hydra:property game:resources;
    hydra:target game:player1
  ].`;
    await fs.writeFile(`${gameRepoDir}/player_units.ttl`, playerUnitsTtl);

    const resourceNodesTtl = `@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>.
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>.
@prefix xsd: <http://www.w3.org/2001/XMLSchema#>.
@prefix game: <http://example.org/game#>.
@prefix hydra: <http://www.w3.org/ns/hydra/core#>.

game:goldMine1 a game:ResourceNode;
  game:type "gold";
  game:amount 1000;
  game:location "{x: 20, y: 30}";
  hydra:operation [
    a hydra:Operation;
    hydra:method "GET";
    hydra:title "Get Resource Node Information";
    hydra:description "Retrieves information about this resource node";
    hydra:returns game:ResourceNode
  ];
  hydra:link [
    a hydra:Link;
    hydra:title "World";
    hydra:description "The game world that contains this resource node";
    hydra:property game:world;
    hydra:target game:world
  ].

game:forest1 a game:ResourceNode;
  game:type "wood";
  game:amount 2000;
  game:location "{x: 40, y: 15}";
  hydra:operation [
    a hydra:Operation;
    hydra:method "GET";
    hydra:title "Get Resource Node Information";
    hydra:description "Retrieves information about this resource node";
    hydra:returns game:ResourceNode
  ];
  hydra:link [
    a hydra:Link;
    hydra:title "World";
    hydra:description "The game world that contains this resource node";
    hydra:property game:world;
    hydra:target game:world
  ].

game:quarry1 a game:ResourceNode;
  game:type "stone";
  game:amount 1500;
  game:location "{x: 60, y: 50}";
  hydra:operation [
    a hydra:Operation;
    hydra:method "GET";
    hydra:title "Get Resource Node Information";
    hydra:description "Retrieves information about this resource node";
    hydra:returns game:ResourceNode
  ];
  hydra:link [
    a hydra:Link;
    hydra:title "World";
    hydra:description "The game world that contains this resource node";
    hydra:property game:world;
    hydra:target game:world
  ].

game:farm1 a game:ResourceNode;
  game:type "food";
  game:amount 3000;
  game:location "{x: 25, y: 70}";
  hydra:operation [
    a hydra:Operation;
    hydra:method "GET";
    hydra:title "Get Resource Node Information";
    hydra:description "Retrieves information about this resource node";
    hydra:returns game:ResourceNode
  ];
  hydra:link [
    a hydra:Link;
    hydra:title "World";
    hydra:description "The game world that contains this resource node";
    hydra:property game:world;
    hydra:target game:world
  ].`;
    await fs.writeFile(`${gameRepoDir}/resource_nodes.ttl`, resourceNodesTtl);

    const buildingsTtl = `@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>.
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>.
@prefix xsd: <http://www.w3.org/2001/XMLSchema#>.
@prefix game: <http://example.org/game#>.
@prefix hydra: <http://www.w3.org/ns/hydra/core#>.

game:townCenter1 a game:Building;
  game:type "townCenter";
  game:owner game:player1;
  game:health 500;
  game:location "{x: 15, y: 15}";
  hydra:operation [
    a hydra:Operation;
    hydra:method "GET";
    hydra:title "Get Building Information";
    hydra:description "Retrieves information about this building";
    hydra:returns game:Building
  ], [
    a hydra:Operation;
    hydra:method "POST";
    hydra:title "Train Unit";
    hydra:description "Trains a new unit at this building";
    hydra:expects [
      a hydra:Class;
      hydra:supportedProperty [
        a hydra:SupportedProperty;
        hydra:property game:unitType;
        hydra:required "true"^^xsd:boolean
      ]
    ];
    hydra:returns game:Unit
  ];
  hydra:link [
    a hydra:Link;
    hydra:title "Owner";
    hydra:description "The player who owns this building";
    hydra:property game:owner;
    hydra:target game:player1
  ], [
    a hydra:Link;
    hydra:title "World";
    hydra:description "The game world that contains this building";
    hydra:property game:world;
    hydra:target game:world
  ].`;
    await fs.writeFile(`${gameRepoDir}/buildings.ttl`, buildingsTtl);

    // Create the game ontology file
    const gameOntologyTtl = `@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .
@prefix owl: <http://www.w3.org/2002/07/owl#> .
@prefix hydra: <http://www.w3.org/ns/hydra/core#> .
@prefix game: <http://example.org/game#> .

# Game Ontology with Hydra Hypermedia Controls

# Class definitions
game:World a rdfs:Class, hydra:Class ;
    rdfs:label "Game World" ;
    rdfs:comment "The game world that contains all game entities" ;
    hydra:supportedOperation [
        a hydra:Operation ;
        hydra:method "GET" ;
        hydra:title "Get World Information" ;
        hydra:description "Retrieves information about the game world"
    ] .

game:Player a rdfs:Class, hydra:Class ;
    rdfs:label "Player" ;
    rdfs:comment "A player in the game" ;
    hydra:supportedOperation [
        a hydra:Operation ;
        hydra:method "GET" ;
        hydra:title "Get Player Information" ;
        hydra:description "Retrieves information about a player"
    ], [
        a hydra:Operation ;
        hydra:method "PUT" ;
        hydra:title "Update Player" ;
        hydra:description "Updates player information"
    ] .

game:Unit a rdfs:Class, hydra:Class ;
    rdfs:label "Unit" ;
    rdfs:comment "A unit in the game" ;
    hydra:supportedOperation [
        a hydra:Operation ;
        hydra:method "GET" ;
        hydra:title "Get Unit Information" ;
        hydra:description "Retrieves information about a unit"
    ], [
        a hydra:Operation ;
        hydra:method "PUT" ;
        hydra:title "Update Unit" ;
        hydra:description "Updates unit information"
    ], [
        a hydra:Operation ;
        hydra:method "DELETE" ;
        hydra:title "Delete Unit" ;
        hydra:description "Deletes a unit"
    ], [
        a hydra:Operation ;
        hydra:method "POST" ;
        hydra:title "Move Unit" ;
        hydra:description "Moves a unit to a new position" ;
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
        ]
    ], [
        a hydra:Operation ;
        hydra:method "POST" ;
        hydra:title "Gather Resources" ;
        hydra:description "Gathers resources from a resource node" ;
        hydra:expects [
            a hydra:Class ;
            hydra:supportedProperty [
                a hydra:SupportedProperty ;
                hydra:property game:resourceNode ;
                hydra:required "true"^^xsd:boolean
            ]
        ]
    ] .

game:Building a rdfs:Class, hydra:Class ;
    rdfs:label "Building" ;
    rdfs:comment "A building in the game" ;
    hydra:supportedOperation [
        a hydra:Operation ;
        hydra:method "GET" ;
        hydra:title "Get Building Information" ;
        hydra:description "Retrieves information about a building"
    ], [
        a hydra:Operation ;
        hydra:method "PUT" ;
        hydra:title "Update Building" ;
        hydra:description "Updates building information"
    ], [
        a hydra:Operation ;
        hydra:method "DELETE" ;
        hydra:title "Delete Building" ;
        hydra:description "Deletes a building"
    ], [
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
        ]
    ] .

game:ResourceNode a rdfs:Class, hydra:Class ;
    rdfs:label "Resource Node" ;
    rdfs:comment "A resource node in the game" ;
    hydra:supportedOperation [
        a hydra:Operation ;
        hydra:method "GET" ;
        hydra:title "Get Resource Node Information" ;
        hydra:description "Retrieves information about a resource node"
    ] .

game:Technology a rdfs:Class, hydra:Class ;
    rdfs:label "Technology" ;
    rdfs:comment "A technology that can be researched" ;
    hydra:supportedOperation [
        a hydra:Operation ;
        hydra:method "GET" ;
        hydra:title "Get Technology Information" ;
        hydra:description "Retrieves information about a technology"
    ], [
        a hydra:Operation ;
        hydra:method "POST" ;
        hydra:title "Research Technology" ;
        hydra:description "Starts researching this technology"
    ] .

game:Alliance a rdfs:Class, hydra:Class ;
    rdfs:label "Alliance" ;
    rdfs:comment "An alliance between players" ;
    hydra:supportedOperation [
        a hydra:Operation ;
        hydra:method "GET" ;
        hydra:title "Get Alliance Information" ;
        hydra:description "Retrieves information about an alliance"
    ], [
        a hydra:Operation ;
        hydra:method "POST" ;
        hydra:title "Join Alliance" ;
        hydra:description "Joins this alliance"
    ], [
        a hydra:Operation ;
        hydra:method "DELETE" ;
        hydra:title "Leave Alliance" ;
        hydra:description "Leaves this alliance"
    ], [
        a hydra:Operation ;
        hydra:method "PUT" ;
        hydra:title "Contribute Resources" ;
        hydra:description "Contributes resources to this alliance" ;
        hydra:expects [
            a hydra:Class ;
            hydra:supportedProperty [
                a hydra:SupportedProperty ;
                hydra:property game:resourceType ;
                hydra:required "true"^^xsd:boolean
            ], [
                a hydra:SupportedProperty ;
                hydra:property game:amount ;
                hydra:required "true"^^xsd:boolean
            ]
        ]
    ] .

# Property definitions
game:name a rdf:Property ;
    rdfs:label "Name" ;
    rdfs:comment "The name of an entity" ;
    rdfs:domain rdfs:Resource ;
    rdfs:range xsd:string .

game:size a rdf:Property ;
    rdfs:label "Size" ;
    rdfs:comment "The size of the game world" ;
    rdfs:domain game:World ;
    rdfs:range xsd:integer .

game:attack a rdf:Property ;
    rdfs:label "Attack" ;
    rdfs:comment "The attack value of a unit" ;
    rdfs:domain game:Unit ;
    rdfs:range xsd:integer .

game:defense a rdf:Property ;
    rdfs:label "Defense" ;
    rdfs:comment "The defense value of a unit" ;
    rdfs:domain game:Unit ;
    rdfs:range xsd:integer .

game:health a rdf:Property ;
    rdfs:label "Health" ;
    rdfs:comment "The health value of a unit or building" ;
    rdfs:domain [ a owl:Class ; owl:unionOf (game:Unit game:Building) ] ;
    rdfs:range xsd:integer .

game:location a rdf:Property ;
    rdfs:label "Location" ;
    rdfs:comment "The location of an entity in the game world" ;
    rdfs:domain [ a owl:Class ; owl:unionOf (game:Unit game:Building game:ResourceNode) ] ;
    rdfs:range xsd:string .

game:x a rdf:Property ;
    rdfs:label "X Coordinate" ;
    rdfs:comment "The X coordinate in the game world" ;
    rdfs:range xsd:integer .

game:y a rdf:Property ;
    rdfs:label "Y Coordinate" ;
    rdfs:comment "The Y coordinate in the game world" ;
    rdfs:range xsd:integer .

game:units a rdf:Property ;
    rdfs:label "Units" ;
    rdfs:comment "The units owned by a player" ;
    rdfs:domain game:Player ;
    rdfs:range game:Unit .

game:gold a rdf:Property ;
    rdfs:label "Gold" ;
    rdfs:comment "The amount of gold a player has" ;
    rdfs:domain game:Player ;
    rdfs:range xsd:integer .

game:wood a rdf:Property ;
    rdfs:label "Wood" ;
    rdfs:comment "The amount of wood a player has" ;
    rdfs:domain game:Player ;
    rdfs:range xsd:integer .

game:stone a rdf:Property ;
    rdfs:label "Stone" ;
    rdfs:comment "The amount of stone a player has" ;
    rdfs:domain game:Player ;
    rdfs:range xsd:integer .

game:food a rdf:Property ;
    rdfs:label "Food" ;
    rdfs:comment "The amount of food a player has" ;
    rdfs:domain game:Player ;
    rdfs:range xsd:integer .

game:type a rdf:Property ;
    rdfs:label "Type" ;
    rdfs:comment "The type of an entity" ;
    rdfs:domain [ a owl:Class ; owl:unionOf (game:Building game:ResourceNode) ] ;
    rdfs:range xsd:string .

game:amount a rdf:Property ;
    rdfs:label "Amount" ;
    rdfs:comment "The amount of a resource" ;
    rdfs:domain game:ResourceNode ;
    rdfs:range xsd:integer .

game:owner a rdf:Property ;
    rdfs:label "Owner" ;
    rdfs:comment "The owner of an entity" ;
    rdfs:domain [ a owl:Class ; owl:unionOf (game:Unit game:Building) ] ;
    rdfs:range game:Player .

game:unitType a rdf:Property ;
    rdfs:label "Unit Type" ;
    rdfs:comment "The type of unit to train" ;
    rdfs:range xsd:string .

game:resourceNode a rdf:Property ;
    rdfs:label "Resource Node" ;
    rdfs:comment "A resource node to gather from" ;
    rdfs:range game:ResourceNode .

game:resourceType a rdf:Property ;
    rdfs:label "Resource Type" ;
    rdfs:comment "The type of resource" ;
    rdfs:range xsd:string .`;
    await fs.writeFile(`${gameRepoDir}/game-ontology.ttl`, gameOntologyTtl);

    // Commit the changes to Git
    await execPromise('git add .', { cwd: gameRepoDir });
    await execPromise('git commit -m "Reset game state with hypermedia controls"', { cwd: gameRepoDir });

    console.log('Game state reset successfully!');
  } catch (error) {
    console.error('Error resetting game state:', error.message);
  }
}

// Run the reset function
resetGameState();