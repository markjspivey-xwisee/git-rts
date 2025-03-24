import { promises as fs } from 'fs';
import path from 'path';
import { Parser, Writer, Store } from 'n3';
import * as RDF from '@rdfjs/types';

// Define the game repository directory from environment variable or default
const gameRepoDir = process.env.GAME_REPO_DIR || 'C:/Users/markj/Desktop/game-repo';

// Interface for SPARQL query results
interface SparqlResults {
  head: {
    vars: string[];
  };
  results: {
    bindings: any[];
  };
  // Hydra context and controls
  "@context"?: string | object;
  "@type"?: string;
  "hydra:view"?: any;
  "hydra:search"?: any;
  "hydra:operation"?: any[];
  "hydra:link"?: any[];
}

// Class to handle SPARQL queries over the game data
export class SparqlService {
  private store: Store;
  private parser: Parser;
  
  constructor() {
    this.parser = new Parser();
    this.store = new Store();
  }
  
  // Load all TTL files from the game repository
  async loadData(): Promise<void> {
    try {
      // Get all .ttl files in the game repository
      const files = await fs.readdir(gameRepoDir);
      const ttlFiles = files.filter(file => file.endsWith('.ttl'));
      
      // Load each TTL file into the store
      for (const file of ttlFiles) {
        const filePath = path.join(gameRepoDir, file);
        const content = await fs.readFile(filePath, 'utf8');
        const quads = this.parser.parse(content);
        this.store.addQuads(quads);
      }
      
      // Also load the OWL ontology if it exists
      try {
        const ontologyPath = path.join(gameRepoDir, 'game-ontology.owl');
        const ontologyContent = await fs.readFile(ontologyPath, 'utf8');
        const ontologyQuads = this.parser.parse(ontologyContent);
        this.store.addQuads(ontologyQuads);
      } catch (error) {
        console.error('Error loading ontology:', error instanceof Error ? error.message : String(error));
      }
      
      console.log(`Loaded ${this.store.size} triples into the SPARQL store`);
    } catch (error) {
      console.error('Error loading data:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }
  
  // Execute a SPARQL query
  async executeQuery(query: string): Promise<any> {
    try {
      // Make sure data is loaded
      if (this.store.size === 0) {
        await this.loadData();
      }
      
      // For now, we'll return a simplified mock result
      // In a real implementation, we would use a SPARQL engine to execute the query
      console.log(`Executing SPARQL query: ${query}`);
      
      // Parse the query to determine its type
      if (query.toLowerCase().includes('select')) {
        // It's a SELECT query
        const vars = this.extractVariables(query);
        return this.mockSelectResult(vars);
      } else if (query.toLowerCase().includes('construct')) {
        // It's a CONSTRUCT query
        return "# CONSTRUCT query result in Turtle format";
      } else if (query.toLowerCase().includes('ask')) {
        // It's an ASK query
        return {
          head: {},
          boolean: true
        };
      } else {
        // Default to a simple result
        return {
          head: {
            vars: ["subject", "predicate", "object"]
          },
          results: {
            bindings: []
          }
        };
      }
    } catch (error) {
      console.error('Error executing SPARQL query:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }
  
  // Extract variables from a SPARQL query
  private extractVariables(query: string): string[] {
    const selectMatch = query.match(/SELECT\s+(.+?)\s+WHERE/i);
    if (selectMatch && selectMatch[1]) {
      return selectMatch[1]
        .split(/\s+/)
        .filter(v => v.startsWith('?'))
        .map(v => v.substring(1));
    }
    return ["subject", "predicate", "object"];
  }
  
  // Create a mock result for a SELECT query
  private mockSelectResult(vars: string[]): SparqlResults {
    return {
      head: {
        vars: vars
      },
      results: {
        bindings: []
      }
    };
  }
  
  // Format an RDF term into a SPARQL JSON result format
  private formatTerm(term: RDF.Term): any {
    if (term.termType === 'NamedNode') {
      return {
        type: 'uri',
        value: term.value
      };
    }
    
    if (term.termType === 'BlankNode') {
      return {
        type: 'bnode',
        value: term.value
      };
    }
    
    if (term.termType === 'Literal') {
      const literal = term as RDF.Literal;
      const result: any = {
        type: 'literal',
        value: literal.value
      };
      
      if (literal.language) {
        result['xml:lang'] = literal.language;
      }
      
      if (literal.datatype) {
        result.datatype = literal.datatype.value;
      }
      
      return result;
    }
    
    return {
      type: 'unknown',
      value: term.value
    };
  }
  
  // Helper method to get all units
  async getAllUnits(): Promise<SparqlResults> {
    const query = `
      PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
      PREFIX game: <http://example.org/game#>
      
      SELECT ?unit ?name ?attack ?defense ?health ?location
      WHERE {
        ?unit rdf:type game:Unit ;
              game:name ?name ;
              game:attack ?attack ;
              game:defense ?defense ;
              game:health ?health ;
              game:location ?location .
      }
    `;
    
    const results = await this.executeQuery(query) as SparqlResults;
    
    // Add Hydra hypermedia controls
    results["@context"] = {
      "hydra": "http://www.w3.org/ns/hydra/core#",
      "game": "http://example.org/game#",
      "rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
      "rdfs": "http://www.w3.org/2000/01/rdf-schema#",
      "xsd": "http://www.w3.org/2001/XMLSchema#"
    };
    results["@type"] = "hydra:Collection";
    
    // Add view controls for pagination
    results["hydra:view"] = {
      "@id": "http://example.org/game/units?page=1",
      "@type": "hydra:PartialCollectionView",
      "hydra:first": "http://example.org/game/units?page=1",
      "hydra:next": "http://example.org/game/units?page=2"
    };
    
    // Add search controls
    results["hydra:search"] = {
      "@type": "hydra:IriTemplate",
      "hydra:template": "http://example.org/game/units{?type,player}",
      "hydra:variableRepresentation": "hydra:BasicRepresentation",
      "hydra:mapping": [
        {
          "@type": "hydra:IriTemplateMapping",
          "hydra:variable": "type",
          "hydra:property": "game:unitType",
          "hydra:required": false
        },
        {
          "@type": "hydra:IriTemplateMapping",
          "hydra:variable": "player",
          "hydra:property": "game:owner",
          "hydra:required": false
        }
      ]
    };
    
    // Add operations that can be performed on the collection
    results["hydra:operation"] = [
      {
        "@type": "hydra:Operation",
        "hydra:method": "POST",
        "hydra:title": "Create Unit",
        "hydra:description": "Creates a new unit",
        "hydra:expects": "game:Unit",
        "hydra:returns": "game:Unit"
      }
    ];
    
    // Add links to related resources
    results["hydra:link"] = [
      {
        "@type": "hydra:Link",
        "hydra:title": "Game World",
        "hydra:description": "The game world that contains these units",
        "hydra:property": "game:world",
        "hydra:target": "http://example.org/game/world"
      },
      {
        "@type": "hydra:Link",
        "hydra:title": "Players",
        "hydra:description": "The players who own these units",
        "hydra:property": "game:players",
        "hydra:target": "http://example.org/game/players"
      }
    ];
    
    return results;
  }
  
  // Helper method to get all resource nodes
  async getAllResourceNodes(): Promise<SparqlResults> {
    const query = `
      PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
      PREFIX game: <http://example.org/game#>
      
      SELECT ?node ?type ?amount ?location
      WHERE {
        ?node rdf:type game:ResourceNode ;
              game:type ?type ;
              game:amount ?amount ;
              game:location ?location .
      }
    `;
    
    const results = await this.executeQuery(query) as SparqlResults;
    
    // Add Hydra hypermedia controls
    results["@context"] = {
      "hydra": "http://www.w3.org/ns/hydra/core#",
      "game": "http://example.org/game#",
      "rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
      "rdfs": "http://www.w3.org/2000/01/rdf-schema#",
      "xsd": "http://www.w3.org/2001/XMLSchema#"
    };
    results["@type"] = "hydra:Collection";
    
    // Add view controls for pagination
    results["hydra:view"] = {
      "@id": "http://example.org/game/resource-nodes?page=1",
      "@type": "hydra:PartialCollectionView",
      "hydra:first": "http://example.org/game/resource-nodes?page=1",
      "hydra:next": "http://example.org/game/resource-nodes?page=2"
    };
    
    // Add search controls
    results["hydra:search"] = {
      "@type": "hydra:IriTemplate",
      "hydra:template": "http://example.org/game/resource-nodes{?type,x,y,radius}",
      "hydra:variableRepresentation": "hydra:BasicRepresentation",
      "hydra:mapping": [
        {
          "@type": "hydra:IriTemplateMapping",
          "hydra:variable": "type",
          "hydra:property": "game:type",
          "hydra:required": false
        },
        {
          "@type": "hydra:IriTemplateMapping",
          "hydra:variable": "x",
          "hydra:property": "game:x",
          "hydra:required": false
        },
        {
          "@type": "hydra:IriTemplateMapping",
          "hydra:variable": "y",
          "hydra:property": "game:y",
          "hydra:required": false
        },
        {
          "@type": "hydra:IriTemplateMapping",
          "hydra:variable": "radius",
          "hydra:property": "game:radius",
          "hydra:required": false
        }
      ]
    };
    
    // Add operations that can be performed on resource nodes
    results["hydra:operation"] = [
      {
        "@type": "hydra:Operation",
        "hydra:method": "GET",
        "hydra:title": "Get Resource Node",
        "hydra:description": "Gets information about a specific resource node",
        "hydra:returns": "game:ResourceNode"
      }
    ];
    
    // Add links to related resources
    results["hydra:link"] = [
      {
        "@type": "hydra:Link",
        "hydra:title": "Game World",
        "hydra:description": "The game world that contains these resource nodes",
        "hydra:property": "game:world",
        "hydra:target": "http://example.org/game/world"
      }
    ];
    
    return results;
  }
  
  // Helper method to get player resources
  async getPlayerResources(playerUri: string): Promise<SparqlResults> {
    const query = `
      PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
      PREFIX game: <http://example.org/game#>
      
      SELECT ?gold ?wood ?stone ?food
      WHERE {
        <${playerUri}> rdf:type game:Player ;
                      game:gold ?gold ;
                      game:wood ?wood ;
                      game:stone ?stone ;
                      game:food ?food .
      }
    `;
    
    const results = await this.executeQuery(query) as SparqlResults;
    
    // Add Hydra hypermedia controls
    results["@context"] = {
      "hydra": "http://www.w3.org/ns/hydra/core#",
      "game": "http://example.org/game#",
      "rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
      "rdfs": "http://www.w3.org/2000/01/rdf-schema#",
      "xsd": "http://www.w3.org/2001/XMLSchema#"
    };
    results["@type"] = "game:Player";
    results["@id"] = playerUri;
    
    // Add operations that can be performed on the player resources
    results["hydra:operation"] = [
      {
        "@type": "hydra:Operation",
        "hydra:method": "PUT",
        "hydra:title": "Update Resources",
        "hydra:description": "Updates the resources of this player",
        "hydra:expects": "game:Player",
        "hydra:returns": "game:Player"
      },
      {
        "@type": "hydra:Operation",
        "hydra:method": "POST",
        "hydra:title": "Gather Resources",
        "hydra:description": "Gathers resources using a unit",
        "hydra:expects": {
          "@type": "hydra:Class",
          "hydra:supportedProperty": [
            {
              "@type": "hydra:SupportedProperty",
              "hydra:property": "game:unitUri",
              "hydra:required": true
            },
            {
              "@type": "hydra:SupportedProperty",
              "hydra:property": "game:resourceNodeUri",
              "hydra:required": true
            }
          ]
        },
        "hydra:returns": "game:Player"
      }
    ];
    
    // Add links to related resources
    results["hydra:link"] = [
      {
        "@type": "hydra:Link",
        "hydra:title": "Player Units",
        "hydra:description": "The units owned by this player",
        "hydra:property": "game:units",
        "hydra:target": `http://example.org/game/players/${playerUri.split('#')[1]}/units`
      },
      {
        "@type": "hydra:Link",
        "hydra:title": "Player Buildings",
        "hydra:description": "The buildings owned by this player",
        "hydra:property": "game:buildings",
        "hydra:target": `http://example.org/game/players/${playerUri.split('#')[1]}/buildings`
      },
      {
        "@type": "hydra:Link",
        "hydra:title": "Player Technologies",
        "hydra:description": "The technologies researched by this player",
        "hydra:property": "game:technologies",
        "hydra:target": `http://example.org/game/players/${playerUri.split('#')[1]}/technologies`
      }
    ];
    
    return results;
  }
  
  // Helper method to get player units
  async getPlayerUnits(playerUri: string): Promise<SparqlResults> {
    const query = `
      PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
      PREFIX game: <http://example.org/game#>
      
      SELECT ?unit ?name ?attack ?defense ?health ?location
      WHERE {
        <${playerUri}> rdf:type game:Player ;
                      game:units ?unit .
        ?unit rdf:type game:Unit ;
              game:name ?name ;
              game:attack ?attack ;
              game:defense ?defense ;
              game:health ?health ;
              game:location ?location .
      }
    `;
    
    return this.executeQuery(query) as Promise<SparqlResults>;
  }
  
  // Helper method to get buildings
  async getBuildings(): Promise<SparqlResults> {
    const query = `
      PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
      PREFIX game: <http://example.org/game#>
      
      SELECT ?building ?type ?owner ?health ?location
      WHERE {
        ?building rdf:type game:Building ;
                 game:type ?type ;
                 game:owner ?owner ;
                 game:health ?health ;
                 game:location ?location .
      }
    `;
    
    return this.executeQuery(query) as Promise<SparqlResults>;
  }
  
  // Helper method to find nearby resource nodes
  async findNearbyResourceNodes(x: number, y: number, radius: number): Promise<SparqlResults> {
    // Get all resource nodes
    const allNodesResult = await this.getAllResourceNodes();
    
    // Extract the bindings
    const nodes = allNodesResult.results.bindings;
    
    // Filter nodes based on distance
    const nearbyNodes = nodes.filter((node: any) => {
      try {
        // Parse the location string (assuming it's in the format "{x: 10, y: 10}")
        const locationStr = node.location.value;
        const locationMatch = locationStr.match(/\{x:\s*(\d+),\s*y:\s*(\d+)\}/);
        
        if (locationMatch) {
          const nodeX = parseInt(locationMatch[1], 10);
          const nodeY = parseInt(locationMatch[2], 10);
          
          // Calculate distance using Euclidean distance
          const distance = Math.sqrt(Math.pow(nodeX - x, 2) + Math.pow(nodeY - y, 2));
          
          return distance <= radius;
        }
        
        return false;
      } catch (error) {
        console.error('Error parsing location:', error instanceof Error ? error.message : String(error));
        return false;
      }
    });
    
    return {
      head: allNodesResult.head,
      results: {
        bindings: nearbyNodes
      }
    };
  }
}