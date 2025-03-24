/**
 * Peer Manager Module
 * 
 * Handles peer-to-peer operations for Git-RTS, including:
 * - Managing peer repositories
 * - Peer discovery
 * - Synchronization between peers
 * - Remote operations
 */

const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execPromise = promisify(exec);

// Default paths
const DEFAULT_PEERS_FILE = path.join(process.cwd(), 'peers.json');
const DEFAULT_GAME_REPO_DIR = process.env.GAME_REPO_DIR || path.join(process.cwd(), 'game-repo');

/**
 * Load peers from the peers.json file
 * 
 * @param {string} peersFile - Path to the peers.json file
 * @returns {Promise<Object>} - The peers object
 */
async function loadPeers(peersFile = DEFAULT_PEERS_FILE) {
  try {
    const data = await fs.readFile(peersFile, 'utf8');
    const peers = JSON.parse(data);
    
    // Update lastUpdated timestamp
    peers.metadata.lastUpdated = new Date().toISOString();
    
    return peers;
  } catch (error) {
    if (error.code === 'ENOENT') {
      // File doesn't exist, create a new one
      const defaultPeers = {
        peers: [],
        settings: {
          autoSync: true,
          syncInterval: 300,
          maxPeers: 10,
          discoveryEnabled: true
        },
        metadata: {
          version: "0.1.0",
          lastUpdated: new Date().toISOString()
        }
      };
      
      await fs.writeFile(peersFile, JSON.stringify(defaultPeers, null, 2));
      return defaultPeers;
    }
    
    throw new Error(`Failed to load peers: ${error.message}`);
  }
}

/**
 * Save peers to the peers.json file
 * 
 * @param {Object} peers - The peers object
 * @param {string} peersFile - Path to the peers.json file
 * @returns {Promise<void>}
 */
async function savePeers(peers, peersFile = DEFAULT_PEERS_FILE) {
  try {
    // Update lastUpdated timestamp
    peers.metadata.lastUpdated = new Date().toISOString();
    
    await fs.writeFile(peersFile, JSON.stringify(peers, null, 2));
  } catch (error) {
    throw new Error(`Failed to save peers: ${error.message}`);
  }
}

/**
 * Add a peer to the peers list
 * 
 * @param {string} name - The name of the peer
 * @param {string} url - The Git URL of the peer's repository
 * @param {Object} options - Additional options for the peer
 * @param {string} peersFile - Path to the peers.json file
 * @returns {Promise<Object>} - The updated peers object
 */
async function addPeer(name, url, options = {}, peersFile = DEFAULT_PEERS_FILE) {
  const peers = await loadPeers(peersFile);
  
  // Check if we've reached the maximum number of peers
  if (peers.peers.length >= peers.settings.maxPeers) {
    throw new Error(`Maximum number of peers (${peers.settings.maxPeers}) reached`);
  }
  
  // Check if the peer already exists
  const existingPeer = peers.peers.find(peer => peer.name === name || peer.url === url);
  if (existingPeer) {
    throw new Error(`Peer with name "${name}" or URL "${url}" already exists`);
  }
  
  // Add the new peer
  const newPeer = {
    name,
    url,
    added: new Date().toISOString(),
    lastSync: null,
    status: 'pending',
    ...options
  };
  
  peers.peers.push(newPeer);
  
  // Save the updated peers list
  await savePeers(peers, peersFile);
  
  return peers;
}

/**
 * Remove a peer from the peers list
 * 
 * @param {string} nameOrUrl - The name or URL of the peer to remove
 * @param {string} peersFile - Path to the peers.json file
 * @returns {Promise<Object>} - The updated peers object
 */
async function removePeer(nameOrUrl, peersFile = DEFAULT_PEERS_FILE) {
  const peers = await loadPeers(peersFile);
  
  // Find the peer to remove
  const peerIndex = peers.peers.findIndex(peer => 
    peer.name === nameOrUrl || peer.url === nameOrUrl
  );
  
  if (peerIndex === -1) {
    throw new Error(`Peer with name or URL "${nameOrUrl}" not found`);
  }
  
  // Remove the peer
  peers.peers.splice(peerIndex, 1);
  
  // Save the updated peers list
  await savePeers(peers, peersFile);
  
  return peers;
}

/**
 * List all peers
 * 
 * @param {string} peersFile - Path to the peers.json file
 * @returns {Promise<Array>} - Array of peers
 */
async function listPeers(peersFile = DEFAULT_PEERS_FILE) {
  const peers = await loadPeers(peersFile);
  return peers.peers;
}

/**
 * Synchronize with a specific peer
 * 
 * @param {string} nameOrUrl - The name or URL of the peer to sync with
 * @param {string} gameRepoDir - Path to the game repository
 * @param {string} peersFile - Path to the peers.json file
 * @returns {Promise<Object>} - Sync result
 */
async function syncWithPeer(nameOrUrl, gameRepoDir = DEFAULT_GAME_REPO_DIR, peersFile = DEFAULT_PEERS_FILE) {
  const peers = await loadPeers(peersFile);
  
  // Find the peer
  const peer = peers.peers.find(p => p.name === nameOrUrl || p.url === nameOrUrl);
  
  if (!peer) {
    throw new Error(`Peer with name or URL "${nameOrUrl}" not found`);
  }
  
  try {
    // Add the peer as a remote if it doesn't exist
    try {
      await execPromise(`git remote get-url ${peer.name}`, { cwd: gameRepoDir });
    } catch (error) {
      // Remote doesn't exist, add it
      await execPromise(`git remote add ${peer.name} ${peer.url}`, { cwd: gameRepoDir });
    }
    
    // Fetch from the peer
    console.log(`Fetching from peer: ${peer.name}`);
    await execPromise(`git fetch ${peer.name}`, { cwd: gameRepoDir });
    
    // Get the current branch
    const { stdout: branchOutput } = await execPromise('git rev-parse --abbrev-ref HEAD', { cwd: gameRepoDir });
    const currentBranch = branchOutput.trim();
    
    // Merge from the peer's branch
    console.log(`Merging from peer: ${peer.name}/${currentBranch}`);
    await execPromise(`git merge ${peer.name}/${currentBranch}`, { cwd: gameRepoDir });
    
    // Update the peer's last sync time
    peer.lastSync = new Date().toISOString();
    peer.status = 'active';
    
    // Save the updated peers list
    await savePeers(peers, peersFile);
    
    return { success: true, peer, message: `Successfully synchronized with peer: ${peer.name}` };
  } catch (error) {
    // Update the peer's status
    peer.status = 'error';
    peer.lastError = error.message;
    
    // Save the updated peers list
    await savePeers(peers, peersFile);
    
    throw new Error(`Failed to synchronize with peer ${peer.name}: ${error.message}`);
  }
}

/**
 * Synchronize with all active peers
 * 
 * @param {string} gameRepoDir - Path to the game repository
 * @param {string} peersFile - Path to the peers.json file
 * @returns {Promise<Array>} - Array of sync results
 */
async function syncWithAllPeers(gameRepoDir = DEFAULT_GAME_REPO_DIR, peersFile = DEFAULT_PEERS_FILE) {
  const peers = await loadPeers(peersFile);
  const results = [];
  
  for (const peer of peers.peers) {
    try {
      const result = await syncWithPeer(peer.name, gameRepoDir, peersFile);
      results.push(result);
    } catch (error) {
      results.push({ success: false, peer, error: error.message });
    }
  }
  
  return results;
}

/**
 * Push changes to a specific peer
 * 
 * @param {string} nameOrUrl - The name or URL of the peer to push to
 * @param {string} gameRepoDir - Path to the game repository
 * @param {string} peersFile - Path to the peers.json file
 * @returns {Promise<Object>} - Push result
 */
async function pushToPeer(nameOrUrl, gameRepoDir = DEFAULT_GAME_REPO_DIR, peersFile = DEFAULT_PEERS_FILE) {
  const peers = await loadPeers(peersFile);
  
  // Find the peer
  const peer = peers.peers.find(p => p.name === nameOrUrl || p.url === nameOrUrl);
  
  if (!peer) {
    throw new Error(`Peer with name or URL "${nameOrUrl}" not found`);
  }
  
  try {
    // Add the peer as a remote if it doesn't exist
    try {
      await execPromise(`git remote get-url ${peer.name}`, { cwd: gameRepoDir });
    } catch (error) {
      // Remote doesn't exist, add it
      await execPromise(`git remote add ${peer.name} ${peer.url}`, { cwd: gameRepoDir });
    }
    
    // Get the current branch
    const { stdout: branchOutput } = await execPromise('git rev-parse --abbrev-ref HEAD', { cwd: gameRepoDir });
    const currentBranch = branchOutput.trim();
    
    // Push to the peer
    console.log(`Pushing to peer: ${peer.name}`);
    await execPromise(`git push ${peer.name} ${currentBranch}`, { cwd: gameRepoDir });
    
    // Update the peer's last sync time
    peer.lastSync = new Date().toISOString();
    peer.status = 'active';
    
    // Save the updated peers list
    await savePeers(peers, peersFile);
    
    return { success: true, peer, message: `Successfully pushed to peer: ${peer.name}` };
  } catch (error) {
    // Update the peer's status
    peer.status = 'error';
    peer.lastError = error.message;
    
    // Save the updated peers list
    await savePeers(peers, peersFile);
    
    throw new Error(`Failed to push to peer ${peer.name}: ${error.message}`);
  }
}

/**
 * Push changes to all active peers
 * 
 * @param {string} gameRepoDir - Path to the game repository
 * @param {string} peersFile - Path to the peers.json file
 * @returns {Promise<Array>} - Array of push results
 */
async function pushToAllPeers(gameRepoDir = DEFAULT_GAME_REPO_DIR, peersFile = DEFAULT_PEERS_FILE) {
  const peers = await loadPeers(peersFile);
  const results = [];
  
  for (const peer of peers.peers) {
    try {
      const result = await pushToPeer(peer.name, gameRepoDir, peersFile);
      results.push(result);
    } catch (error) {
      results.push({ success: false, peer, error: error.message });
    }
  }
  
  return results;
}

/**
 * Update peer settings
 * 
 * @param {Object} settings - New settings to apply
 * @param {string} peersFile - Path to the peers.json file
 * @returns {Promise<Object>} - The updated peers object
 */
async function updateSettings(settings, peersFile = DEFAULT_PEERS_FILE) {
  const peers = await loadPeers(peersFile);
  
  // Update settings
  peers.settings = { ...peers.settings, ...settings };
  
  // Save the updated peers list
  await savePeers(peers, peersFile);
  
  return peers;
}

/**
 * Check the status of a peer
 * 
 * @param {string} nameOrUrl - The name or URL of the peer to check
 * @param {string} gameRepoDir - Path to the game repository
 * @param {string} peersFile - Path to the peers.json file
 * @returns {Promise<Object>} - Status result
 */
async function checkPeerStatus(nameOrUrl, gameRepoDir = DEFAULT_GAME_REPO_DIR, peersFile = DEFAULT_PEERS_FILE) {
  const peers = await loadPeers(peersFile);
  
  // Find the peer
  const peer = peers.peers.find(p => p.name === nameOrUrl || p.url === nameOrUrl);
  
  if (!peer) {
    throw new Error(`Peer with name or URL "${nameOrUrl}" not found`);
  }
  
  try {
    // Add the peer as a remote if it doesn't exist
    try {
      await execPromise(`git remote get-url ${peer.name}`, { cwd: gameRepoDir });
    } catch (error) {
      // Remote doesn't exist, add it
      await execPromise(`git remote add ${peer.name} ${peer.url}`, { cwd: gameRepoDir });
    }
    
    // Ping the peer with a fetch
    await execPromise(`git fetch ${peer.name} --dry-run`, { cwd: gameRepoDir });
    
    // Update the peer's status
    peer.status = 'active';
    delete peer.lastError;
    
    // Save the updated peers list
    await savePeers(peers, peersFile);
    
    return { success: true, peer, message: `Peer ${peer.name} is reachable` };
  } catch (error) {
    // Update the peer's status
    peer.status = 'unreachable';
    peer.lastError = error.message;
    
    // Save the updated peers list
    await savePeers(peers, peersFile);
    
    return { success: false, peer, error: `Peer ${peer.name} is unreachable: ${error.message}` };
  }
}

/**
 * Check the status of all peers
 * 
 * @param {string} gameRepoDir - Path to the game repository
 * @param {string} peersFile - Path to the peers.json file
 * @returns {Promise<Array>} - Array of status results
 */
async function checkAllPeersStatus(gameRepoDir = DEFAULT_GAME_REPO_DIR, peersFile = DEFAULT_PEERS_FILE) {
  const peers = await loadPeers(peersFile);
  const results = [];
  
  for (const peer of peers.peers) {
    try {
      const result = await checkPeerStatus(peer.name, gameRepoDir, peersFile);
      results.push(result);
    } catch (error) {
      results.push({ success: false, peer, error: error.message });
    }
  }
  
  return results;
}

module.exports = {
  loadPeers,
  savePeers,
  addPeer,
  removePeer,
  listPeers,
  syncWithPeer,
  syncWithAllPeers,
  pushToPeer,
  pushToAllPeers,
  updateSettings,
  checkPeerStatus,
  checkAllPeersStatus
};