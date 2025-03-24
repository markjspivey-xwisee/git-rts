# Git-RTS API Reference

This document provides a comprehensive reference for the Git-RTS RESTful hypermedia API.

## Table of Contents

- [Introduction](#introduction)
- [Authentication](#authentication)
- [Base URL](#base-url)
- [Media Types](#media-types)
- [Hypermedia Controls](#hypermedia-controls)
- [Resources](#resources)
  - [World](#world)
  - [Player](#player)
  - [Unit](#unit)
  - [Building](#building)
  - [Resource Node](#resource-node)
  - [Technology](#technology)
  - [Alliance](#alliance)
- [Operations](#operations)
  - [Movement](#movement)
  - [Resource Gathering](#resource-gathering)
  - [Building Construction](#building-construction)
  - [Unit Training](#unit-training)
  - [Technology Research](#technology-research)
  - [Diplomacy](#diplomacy)
- [Error Handling](#error-handling)
- [Pagination](#pagination)
- [Filtering](#filtering)
- [Versioning](#versioning)

## Introduction

The Git-RTS API is a RESTful hypermedia API that uses the Hydra vocabulary to provide self-describing resources with hypermedia controls. This allows clients to discover available actions and navigate the API without prior knowledge.

## Authentication

The API uses GitHub authentication for player identification. To authenticate, include a GitHub token in the Authorization header:

```
Authorization: Bearer <github-token>
```

## Base URL

The base URL for the API is:

```
http://localhost:3020/api
```

For production deployments, the base URL will be:

```
https://api.git-rts.com
```

## Media Types

The API supports the following media types:

- `application/ld+json`: JSON-LD format with hypermedia controls
- `text/turtle`: Turtle RDF format
- `application/n-triples`: N-Triples RDF format

Specify the desired media type using the Accept header:

```
Accept: application/ld+json
```

## Hypermedia Controls

The API uses Hydra hypermedia controls to provide information about available actions and links to related resources.

### Operations

Operations are actions that can be performed on a resource:

```json
"hydra:operation": [
  {
    "@type": "hydra:Operation",
    "hydra:method": "POST",
    "hydra:title": "Move Unit",
    "hydra:description": "Moves this unit to a new position",
    "hydra:expects": {
      "@type": "hydra:Class",
      "hydra:supportedProperty": [
        {
          "@type": "hydra:SupportedProperty",
          "hydra:property": "game:x",
          "hydra:required": true
        },
        {
          "@type": "hydra:SupportedProperty",
          "hydra:property": "game:y",
          "hydra:required": true
        }
      ]
    },
    "hydra:returns": "game:Unit"
  }
]
```

### Links

Links are references to related resources:

```json
"hydra:link": [
  {
    "@type": "hydra:Link",
    "hydra:title": "Owner",
    "hydra:description": "The player who owns this unit",
    "hydra:property": "game:owner",
    "hydra:target": "game:player1"
  }
]
```

### Collections

Collections are groups of resources:

```json
"hydra:collection": [
  {
    "@type": "hydra:Collection",
    "hydra:title": "Units",
    "hydra:description": "The units owned by this player",
    "hydra:member": "game:unit1",
    "hydra:manages": [
      {
        "@type": "hydra:IriTemplate",
        "hydra:template": "http://example.org/game/player1/units{?type}",
        "hydra:variableRepresentation": "hydra:BasicRepresentation",
        "hydra:mapping": [
          {
            "@type": "hydra:IriTemplateMapping",
            "hydra:variable": "type",
            "hydra:property": "game:unitType",
            "hydra:required": false
          }
        ]
      }
    ]
  }
]
```

## Resources

### World

The world resource represents the game world:

```json
{
  "@context": {
    "hydra": "http://www.w3.org/ns/hydra/core#",
    "game": "https://player1.github.io/my-rts-world/ontology#"
  },
  "@type": "game:World",
  "@id": "game:world",
  "game:name": "My Game World",
  "game:size": 100,
  "hydra:operation": [
    {
      "@type": "hydra:Operation",
      "hydra:method": "GET",
      "hydra:title": "Get World Information",
      "hydra:description": "Retrieves information about the game world",
      "hydra:returns": "game:World"
    }
  ],
  "hydra:collection": [
    {
      "@type": "hydra:Collection",
      "hydra:title": "Players",
      "hydra:description": "The players in this game world",
      "hydra:member": "game:player1",
      "hydra:manages": [
        {
          "@type": "hydra:IriTemplate",
          "hydra:template": "http://example.org/game/players{?name}",
          "hydra:variableRepresentation": "hydra:BasicRepresentation",
          "hydra:mapping": [
            {
              "@type": "hydra:IriTemplateMapping",
              "hydra:variable": "name",
              "hydra:property": "game:name",
              "hydra:required": false
            }
          ]
        }
      ]
    }
  ]
}
```

### Player

The player resource represents a player in the game:

```json
{
  "@context": {
    "hydra": "http://www.w3.org/ns/hydra/core#",
    "game": "https://player1.github.io/my-rts-world/ontology#"
  },
  "@type": "game:Player",
  "@id": "game:player1",
  "game:name": "Player One",
  "game:gold": 100,
  "game:wood": 100,
  "game:stone": 50,
  "game:food": 200,
  "hydra:operation": [
    {
      "@type": "hydra:Operation",
      "hydra:method": "GET",
      "hydra:title": "Get Player Resources",
      "hydra:description": "Retrieves the resources of this player",
      "hydra:returns": "game:Player"
    }
  ],
  "hydra:link": [
    {
      "@type": "hydra:Link",
      "hydra:title": "Units",
      "hydra:description": "The units owned by this player",
      "hydra:property": "game:units",
      "hydra:target": "http://example.org/game/player1/units"
    }
  ]
}
```

### Unit

The unit resource represents a unit in the game:

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
  "game:defense": 5,
  "game:health": 100,
  "game:location": "{x: 10, y: 10}",
  "hydra:operation": [
    {
      "@type": "hydra:Operation",
      "hydra:method": "POST",
      "hydra:title": "Move Unit",
      "hydra:description": "Moves this unit to a new position",
      "hydra:expects": {
        "@type": "hydra:Class",
        "hydra:supportedProperty": [
          {
            "@type": "hydra:SupportedProperty",
            "hydra:property": "game:x",
            "hydra:required": true
          },
          {
            "@type": "hydra:SupportedProperty",
            "hydra:property": "game:y",
            "hydra:required": true
          }
        ]
      },
      "hydra:returns": "game:Unit"
    }
  ],
  "hydra:link": [
    {
      "@type": "hydra:Link",
      "hydra:title": "Owner",
      "hydra:description": "The player who owns this unit",
      "hydra:property": "game:owner",
      "hydra:target": "game:player1"
    }
  ]
}
```

## Operations

### Movement

To move a unit, send a POST request to the unit's URI:

```http
POST /api/units/unit1 HTTP/1.1
Content-Type: application/ld+json

{
  "@context": {
    "game": "https://player1.github.io/my-rts-world/ontology#"
  },
  "game:x": 20,
  "game:y": 30
}
```

### Resource Gathering

To gather resources, send a POST request to the unit's URI:

```http
POST /api/units/unit1/gather HTTP/1.1
Content-Type: application/ld+json

{
  "@context": {
    "game": "https://player1.github.io/my-rts-world/ontology#"
  },
  "game:resourceNode": "game:goldMine1"
}
```

## Error Handling

The API uses standard HTTP status codes to indicate success or failure:

- 200 OK: The request was successful
- 201 Created: The resource was created successfully
- 400 Bad Request: The request was invalid
- 401 Unauthorized: Authentication is required
- 403 Forbidden: The client does not have permission to access the resource
- 404 Not Found: The resource was not found
- 500 Internal Server Error: An error occurred on the server

Error responses include a JSON-LD document with details about the error:

```json
{
  "@context": {
    "hydra": "http://www.w3.org/ns/hydra/core#"
  },
  "@type": "hydra:Error",
  "hydra:title": "Invalid Request",
  "hydra:description": "The request is missing required parameters",
  "hydra:statusCode": 400
}
```

## Pagination

Collections are paginated using the Hydra view controls:

```json
"hydra:view": {
  "@id": "http://example.org/game/units?page=1",
  "@type": "hydra:PartialCollectionView",
  "hydra:first": "http://example.org/game/units?page=1",
  "hydra:next": "http://example.org/game/units?page=2",
  "hydra:last": "http://example.org/game/units?page=5"
}
```

## Filtering

Collections can be filtered using query parameters:

```
GET /api/units?type=warrior&owner=player1
```

The available filters are described in the collection's IRI template:

```json
"hydra:manages": [
  {
    "@type": "hydra:IriTemplate",
    "hydra:template": "http://example.org/game/units{?type,owner}",
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
        "hydra:variable": "owner",
        "hydra:property": "game:owner",
        "hydra:required": false
      }
    ]
  }
]
```

## Versioning

The API is versioned using the Accept header:

```
Accept: application/ld+json;version=1.0
```

If no version is specified, the latest version is used.