/**
 * Peer Command Module
 * 
 * Command-line interface for managing peers in the Git-RTS P2P network
 */

const { program } = require('commander');
const path = require('path');
const chalk = require('chalk');
const Table = require('cli-table3');
const peerManager = require('../lib/peer-manager');

// Default paths
const DEFAULT_GAME_REPO_DIR = process.env.GAME_REPO_DIR || path.join(process.cwd(), 'game-repo');
const DEFAULT_PEERS_FILE = path.join(process.cwd(), 'peers.json');

// Helper function to format dates
function formatDate(dateString) {
  if (!dateString) return 'Never';
  
  const date = new Date(dateString);
  return date.toLocaleString();
}

// Helper function to format status
function formatStatus(status) {
  switch (status) {
    case 'active':
      return chalk.green(status);
    case 'pending':
      return chalk.yellow(status);
    case 'error':
    case 'unreachable':
      return chalk.red(status);
    default:
      return status;
  }
}

// Add peer command
program
  .command('add <name> <url>')
  .description('Add a new peer to the network')
  .option('-d, --dir <directory>', 'Game repository directory', DEFAULT_GAME_REPO_DIR)
  .option('-p, --peers-file <file>', 'Path to peers.json file', DEFAULT_PEERS_FILE)
  .action(async (name, url, options) => {
    try {
      const result = await peerManager.addPeer(name, url, {}, options.peersFile);
      console.log(chalk.green(`✓ Peer "${name}" added successfully`));
      console.log(`Total peers: ${result.peers.length}`);
    } catch (error) {
      console.error(chalk.red(`✗ Error adding peer: ${error.message}`));
      process.exit(1);
    }
  });

// Remove peer command
program
  .command('remove <nameOrUrl>')
  .description('Remove a peer from the network')
  .option('-d, --dir <directory>', 'Game repository directory', DEFAULT_GAME_REPO_DIR)
  .option('-p, --peers-file <file>', 'Path to peers.json file', DEFAULT_PEERS_FILE)
  .action(async (nameOrUrl, options) => {
    try {
      const result = await peerManager.removePeer(nameOrUrl, options.peersFile);
      console.log(chalk.green(`✓ Peer "${nameOrUrl}" removed successfully`));
      console.log(`Remaining peers: ${result.peers.length}`);
    } catch (error) {
      console.error(chalk.red(`✗ Error removing peer: ${error.message}`));
      process.exit(1);
    }
  });

// List peers command
program
  .command('list')
  .description('List all peers in the network')
  .option('-d, --dir <directory>', 'Game repository directory', DEFAULT_GAME_REPO_DIR)
  .option('-p, --peers-file <file>', 'Path to peers.json file', DEFAULT_PEERS_FILE)
  .action(async (options) => {
    try {
      const peers = await peerManager.listPeers(options.peersFile);
      
      if (peers.length === 0) {
        console.log(chalk.yellow('No peers found. Add peers with the "peer add" command.'));
        return;
      }
      
      const table = new Table({
        head: ['Name', 'URL', 'Status', 'Added', 'Last Sync'],
        colWidths: [20, 40, 15, 25, 25]
      });
      
      peers.forEach(peer => {
        table.push([
          peer.name,
          peer.url,
          formatStatus(peer.status),
          formatDate(peer.added),
          formatDate(peer.lastSync)
        ]);
      });
      
      console.log(table.toString());
      console.log(`Total peers: ${peers.length}`);
    } catch (error) {
      console.error(chalk.red(`✗ Error listing peers: ${error.message}`));
      process.exit(1);
    }
  });

// Sync with peer command
program
  .command('sync [nameOrUrl]')
  .description('Synchronize with a peer or all peers')
  .option('-d, --dir <directory>', 'Game repository directory', DEFAULT_GAME_REPO_DIR)
  .option('-p, --peers-file <file>', 'Path to peers.json file', DEFAULT_PEERS_FILE)
  .option('-a, --all', 'Sync with all peers', false)
  .action(async (nameOrUrl, options) => {
    try {
      if (options.all || !nameOrUrl) {
        console.log(chalk.blue('Synchronizing with all peers...'));
        const results = await peerManager.syncWithAllPeers(options.dir, options.peersFile);
        
        const table = new Table({
          head: ['Name', 'Status', 'Message'],
          colWidths: [20, 15, 50]
        });
        
        results.forEach(result => {
          table.push([
            result.peer.name,
            result.success ? chalk.green('Success') : chalk.red('Failed'),
            result.message || result.error || ''
          ]);
        });
        
        console.log(table.toString());
        console.log(`Synchronized with ${results.filter(r => r.success).length}/${results.length} peers`);
      } else {
        console.log(chalk.blue(`Synchronizing with peer "${nameOrUrl}"...`));
        const result = await peerManager.syncWithPeer(nameOrUrl, options.dir, options.peersFile);
        console.log(chalk.green(`✓ ${result.message}`));
      }
    } catch (error) {
      console.error(chalk.red(`✗ Error synchronizing: ${error.message}`));
      process.exit(1);
    }
  });

// Push to peer command
program
  .command('push [nameOrUrl]')
  .description('Push changes to a peer or all peers')
  .option('-d, --dir <directory>', 'Game repository directory', DEFAULT_GAME_REPO_DIR)
  .option('-p, --peers-file <file>', 'Path to peers.json file', DEFAULT_PEERS_FILE)
  .option('-a, --all', 'Push to all peers', false)
  .action(async (nameOrUrl, options) => {
    try {
      if (options.all || !nameOrUrl) {
        console.log(chalk.blue('Pushing to all peers...'));
        const results = await peerManager.pushToAllPeers(options.dir, options.peersFile);
        
        const table = new Table({
          head: ['Name', 'Status', 'Message'],
          colWidths: [20, 15, 50]
        });
        
        results.forEach(result => {
          table.push([
            result.peer.name,
            result.success ? chalk.green('Success') : chalk.red('Failed'),
            result.message || result.error || ''
          ]);
        });
        
        console.log(table.toString());
        console.log(`Pushed to ${results.filter(r => r.success).length}/${results.length} peers`);
      } else {
        console.log(chalk.blue(`Pushing to peer "${nameOrUrl}"...`));
        const result = await peerManager.pushToPeer(nameOrUrl, options.dir, options.peersFile);
        console.log(chalk.green(`✓ ${result.message}`));
      }
    } catch (error) {
      console.error(chalk.red(`✗ Error pushing: ${error.message}`));
      process.exit(1);
    }
  });

// Check peer status command
program
  .command('status [nameOrUrl]')
  .description('Check the status of a peer or all peers')
  .option('-d, --dir <directory>', 'Game repository directory', DEFAULT_GAME_REPO_DIR)
  .option('-p, --peers-file <file>', 'Path to peers.json file', DEFAULT_PEERS_FILE)
  .option('-a, --all', 'Check all peers', false)
  .action(async (nameOrUrl, options) => {
    try {
      if (options.all || !nameOrUrl) {
        console.log(chalk.blue('Checking status of all peers...'));
        const results = await peerManager.checkAllPeersStatus(options.dir, options.peersFile);
        
        const table = new Table({
          head: ['Name', 'URL', 'Status', 'Last Sync', 'Message'],
          colWidths: [20, 30, 15, 25, 30]
        });
        
        results.forEach(result => {
          table.push([
            result.peer.name,
            result.peer.url,
            formatStatus(result.peer.status),
            formatDate(result.peer.lastSync),
            result.message || result.error || ''
          ]);
        });
        
        console.log(table.toString());
        console.log(`Reachable peers: ${results.filter(r => r.success).length}/${results.length}`);
      } else {
        console.log(chalk.blue(`Checking status of peer "${nameOrUrl}"...`));
        const result = await peerManager.checkPeerStatus(nameOrUrl, options.dir, options.peersFile);
        
        if (result.success) {
          console.log(chalk.green(`✓ ${result.message}`));
        } else {
          console.log(chalk.red(`✗ ${result.error}`));
        }
        
        const table = new Table();
        table.push(
          { 'Name': result.peer.name },
          { 'URL': result.peer.url },
          { 'Status': formatStatus(result.peer.status) },
          { 'Added': formatDate(result.peer.added) },
          { 'Last Sync': formatDate(result.peer.lastSync) }
        );
        
        console.log(table.toString());
      }
    } catch (error) {
      console.error(chalk.red(`✗ Error checking status: ${error.message}`));
      process.exit(1);
    }
  });

// Update settings command
program
  .command('settings')
  .description('Update peer network settings')
  .option('-d, --dir <directory>', 'Game repository directory', DEFAULT_GAME_REPO_DIR)
  .option('-p, --peers-file <file>', 'Path to peers.json file', DEFAULT_PEERS_FILE)
  .option('--auto-sync <boolean>', 'Enable/disable automatic synchronization')
  .option('--sync-interval <seconds>', 'Set synchronization interval in seconds')
  .option('--max-peers <number>', 'Set maximum number of peers')
  .option('--discovery <boolean>', 'Enable/disable peer discovery')
  .action(async (options) => {
    try {
      const settings = {};
      
      if (options.autoSync !== undefined) {
        settings.autoSync = options.autoSync === 'true';
      }
      
      if (options.syncInterval !== undefined) {
        settings.syncInterval = parseInt(options.syncInterval);
      }
      
      if (options.maxPeers !== undefined) {
        settings.maxPeers = parseInt(options.maxPeers);
      }
      
      if (options.discovery !== undefined) {
        settings.discoveryEnabled = options.discovery === 'true';
      }
      
      if (Object.keys(settings).length === 0) {
        // No settings provided, show current settings
        const peers = await peerManager.loadPeers(options.peersFile);
        
        const table = new Table();
        table.push(
          { 'Auto Sync': peers.settings.autoSync ? chalk.green('Enabled') : chalk.red('Disabled') },
          { 'Sync Interval': `${peers.settings.syncInterval} seconds` },
          { 'Max Peers': peers.settings.maxPeers },
          { 'Peer Discovery': peers.settings.discoveryEnabled ? chalk.green('Enabled') : chalk.red('Disabled') },
          { 'Version': peers.metadata.version },
          { 'Last Updated': formatDate(peers.metadata.lastUpdated) }
        );
        
        console.log(chalk.blue('Current peer network settings:'));
        console.log(table.toString());
      } else {
        // Update settings
        const result = await peerManager.updateSettings(settings, options.peersFile);
        
        console.log(chalk.green('✓ Settings updated successfully'));
        
        const table = new Table();
        table.push(
          { 'Auto Sync': result.settings.autoSync ? chalk.green('Enabled') : chalk.red('Disabled') },
          { 'Sync Interval': `${result.settings.syncInterval} seconds` },
          { 'Max Peers': result.settings.maxPeers },
          { 'Peer Discovery': result.settings.discoveryEnabled ? chalk.green('Enabled') : chalk.red('Disabled') },
          { 'Version': result.metadata.version },
          { 'Last Updated': formatDate(result.metadata.lastUpdated) }
        );
        
        console.log(chalk.blue('Updated peer network settings:'));
        console.log(table.toString());
      }
    } catch (error) {
      console.error(chalk.red(`✗ Error updating settings: ${error.message}`));
      process.exit(1);
    }
  });

module.exports = program;