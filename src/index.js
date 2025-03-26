/**
 * Git-RTS Main Entry Point
 * 
 * This file serves as the main entry point for the Git-RTS application.
 * It imports and sets up all the commands and modules.
 */

const { program } = require('commander');
const fs = require('fs').promises;
const { exec } = require('child_process');
const path = require('path');

// Import command modules
const peer = require('./commands/peer');
const hook = require('./commands/hook');
const server = require('./commands/server');
const entity = require('./commands/entity');

// Set up program information
program
  .name('git-rts')
  .description('Git-based Real-Time Strategy Game')
  .version('0.1.0');

// Add peer commands
program.addCommand(peer);

// Add hook commands
program.addCommand(hook);

// Add server commands
program.addCommand(server);

// Add entity commands
program.addCommand(entity);

// Parse command line arguments
program.parse(process.argv);

// Display help if no arguments provided
if (process.argv.length <= 2) {
  console.log('Git-RTS: A Git-based Real-Time Strategy Game');
  console.log('');
  console.log('Usage:');
  console.log('  git-rts [command] [options]');
  console.log('');
  console.log('Peer-to-Peer Network:');
  console.log('  peer add <name> <url>               Add a new peer to the network');
  console.log('  peer remove <nameOrUrl>             Remove a peer from the network');
  console.log('  peer list                           List all peers in the network');
  console.log('  peer sync [nameOrUrl]               Synchronize with a peer or all peers');
  console.log('  peer push [nameOrUrl]               Push changes to a peer or all peers');
  console.log('  peer status [nameOrUrl]             Check the status of a peer or all peers');
  console.log('  peer settings                       Update peer network settings');
  console.log('');
  console.log('Git Hooks:');
  console.log('  hook install [hookName]             Install a Git hook or all hooks');
  console.log('  hook uninstall [hookName]           Uninstall a Git hook or all hooks');
  console.log('  hook update [hookName]              Update a Git hook or all hooks');
  console.log('  hook list                           List all Git hooks and their status');
  console.log('');
  console.log('REST API Server:');
  console.log('  server start [--port <port>]        Start the REST API server');
  console.log('  server generate-docs                Generate API documentation');
  console.log('  server config                       Configure server settings');
  console.log('');
  console.log('Entity Management:');
  console.log('  entity create <type> [options]      Create a new entity');
  console.log('  entity get <entityId>               Get entity information');
  console.log('  entity list                         List all entities');
  console.log('  entity move <entityId> <x> <y>      Move an entity to a new position');
  console.log('  entity apply-decorator <entityId> <decoratorType> [options]  Apply a decorator to an entity');
  console.log('');
  console.log('For more commands and options, use:');
  console.log('  git-rts --help');
}