/**
 * Peer Manager Module
 * 
 * Manages peer-to-peer connections for Git-RTS
 * - Adding/removing peers
 * - Synchronizing with peers
 * - Pushing changes to peers
 * - Checking peer status
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
 * @returns {Promise<Object>} - Peers object
 */
async function loadPeers(peersFile = DEFAULT_PEERS_FILE) {
  try {
    const data = await fs.readFile(peersFile, 'utf8');
    return JSON.parse(data);
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
 * @param {Object} peers - Peers object
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
 * Add a new peer to the network
 * 
 * @param {string} name - Name of the peer
 * @param {string} url - Git URL of the peer's repository
 * @param {Object} metadata - Additional metadata for the peer
 * @param {string} peersFile - Path to the peers.json file
 * @returns {Promise<Object>} - Updated peers object
 */
async function addPeer(name, url, metadata = {}, peersFile = DEFAULT_PEERS_FILE) {
  try {
    const peers = await loadPeers(peersFile);
    
    // Check if peer already exists
    const existingPeerIndex = peers.peers.findIndex(p => p.name === name || p.url === url);
    if (existingPeerIndex !== -1) {
      throw new Error(`Peer with name "${name}" or URL "${url}" already exists`);
    }
    
    // Check if we've reached the maximum number of peers
    if (peers.peers.length >= peers.settings.maxPeers) {
      throw new Error(`Maximum number of peers (${peers.settings.maxPeers}) reached`);
    }
    
    // Add the new peer
    const newPeer = {
      name,
      url,
      status: 'pending',
      added: new Date().toISOString(),
      lastSync: null,
      ...metadata
    };
    
    peers.peers.push(newPeer);
    
    // Save the updated peers
    await savePeers(peers, peersFile);
    
    return peers;
  } catch (error) {
    throw new Error(`Failed to add peer: ${error.message}`);
  }
}

/**
 * Remove a peer from the network
 * 
 * @param {string} nameOrUrl - Name or URL of the peer to remove
 * @param {string} peersFile - Path to the peers.json file
 * @returns {Promise<Object>} - Updated peers object
 */
async function removePeer(nameOrUrl, peersFile = DEFAULT_PEERS_FILE) {
  try {
    const peers = await loadPeers(peersFile);
    
    // Find the peer to remove
    const peerIndex = peers.peers.findIndex(p => p.name === nameOrUrl || p.url === nameOrUrl);
    if (peerIndex === -1) {
      throw new Error(`Peer with name or URL "${nameOrUrl}" not found`);
    }
    
    // Remove the peer
    peers.peers.splice(peerIndex, 1);
    
    // Save the updated peers
    await savePeers(peers, peersFile);
    
    return peers;
  } catch (error) {
    throw new Error(`Failed to remove peer: ${error.message}`);
  }
}

/**
 * List all peers in the network
 * 
 * @param {string} peersFile - Path to the peers.json file
 * @returns {Promise<Array>} - Array of peers
 */
async function listPeers(peersFile = DEFAULT_PEERS_FILE) {
  try {
    const peers = await loadPeers(peersFile);
    return peers.peers;
  } catch (error) {
    throw new Error(`Failed to list peers: ${error.message}`);
  }
}

/**
 * Synchronize with a specific peer
 * 
 * @param {string} nameOrUrl - Name or URL of the peer to sync with
 * @param {string} gameRepoDir - Path to the game repository
 * @param {string} peersFile - Path to the peers.json file
 * @returns {Promise<Object>} - Result of the synchronization
 */
async function syncWithPeer(nameOrUrl, gameRepoDir = DEFAULT_GAME_REPO_DIR, peersFile = DEFAULT_PEERS_FILE) {
  try {
    const peers = await loadPeers(peersFile);
    
    // Find the peer to sync with
    const peer = peers.peers.find(p => p.name === nameOrUrl || p.url === nameOrUrl);
    if (!peer) {
      throw new Error(`Peer with name or URL "${nameOrUrl}" not found`);
    }
    
    // Add the peer as a remote if it doesn't exist
    try {
      await execPromise(`git remote get-url ${peer.name}`, { cwd: gameRepoDir });
    } catch (error) {
      // Remote doesn't exist, add it
      await execPromise(`git remote add ${peer.name} ${peer.url}`, { cwd: gameRepoDir });
    }
    
    // Fetch from the peer
    await execPromise(`git fetch ${peer.name}`, { cwd: gameRepoDir });
    
    // Merge changes from the peer
    try {
      const { stdout } = await execPromise(`git merge ${peer.name}/master --no-edit`, { cwd: gameRepoDir });
      
      // Update peer status
      peer.status = 'active';
      peer.lastSync = new Date().toISOString();
      await savePeers(peers, peersFile);
      
      return {
        success: true,
        peer,
        message: `Successfully synchronized with peer "${peer.name}"`
      };
    } catch (error) {
      // Handle merge conflicts
      if (error.message.includes('CONFLICT')) {
        // Abort the merge
        await execPromise(`git merge --abort`, { cwd: gameRepoDir });
        
        // Update peer status
        peer.status = 'conflict';
        await savePeers(peers, peersFile);
        
        return {
          success: false,
          peer,
          error: `Merge conflict with peer "${peer.name}". Please resolve conflicts manually.`
        };
      }
      
      throw error;
    }
  } catch (error) {
    // Update peer status
    try {
      const peers = await loadPeers(peersFile);
      const peer = peers.peers.find(p => p.name === nameOrUrl || p.url === nameOrUrl);
      if (peer) {
        peer.status = 'error';
        await savePeers(peers, peersFile);
      }
    } catch (saveError) {
      console.error(`Failed to update peer status: ${saveError.message}`);
    }
    
    throw new Error(`Failed to sync with peer: ${error.message}`);
  }
}

/**
 * Synchronize with all peers
 * 
 * @param {string} gameRepoDir - Path to the game repository
 * @param {string} peersFile - Path to the peers.json file
 * @returns {Promise<Array>} - Results of the synchronization
 */
async function syncWithAllPeers(gameRepoDir = DEFAULT_GAME_REPO_DIR, peersFile = DEFAULT_PEERS_FILE) {
  try {
    const peers = await loadPeers(peersFile);
    const results = [];
    
    for (const peer of peers.peers) {
      try {
        const result = await syncWithPeer(peer.name, gameRepoDir, peersFile);
        results.push(result);
      } catch (error) {
        results.push({
          success: false,
          peer,
          error: error.message
        });
      }
    }
    
    return results;
  } catch (error) {
    throw new Error(`Failed to sync with all peers: ${error.message}`);
  }
}

/**
 * Push changes to a specific peer
 * 
 * @param {string} nameOrUrl - Name or URL of the peer to push to
 * @param {string} gameRepoDir - Path to the game repository
 * @param {string} peersFile - Path to the peers.json file
 * @returns {Promise<Object>} - Result of the push
 */
async function pushToPeer(nameOrUrl, gameRepoDir = DEFAULT_GAME_REPO_DIR, peersFile = DEFAULT_PEERS_FILE) {
  try {
    const peers = await loadPeers(peersFile);
    
    // Find the peer to push to
    const peer = peers.peers.find(p => p.name === nameOrUrl || p.url === nameOrUrl);
    if (!peer) {
      throw new Error(`Peer with name or URL "${nameOrUrl}" not found`);
    }
    
    // Add the peer as a remote if it doesn't exist
    try {
      await execPromise(`git remote get-url ${peer.name}`, { cwd: gameRepoDir });
    } catch (error) {
      // Remote doesn't exist, add it
      await execPromise(`git remote add ${peer.name} ${peer.url}`, { cwd: gameRepoDir });
    }
    
    // Push to the peer
    await execPromise(`git push ${peer.name} master`, { cwd: gameRepoDir });
    
    // Update peer status
    peer.status = 'active';
    peer.lastSync = new Date().toISOString();
    await savePeers(peers, peersFile);
    
    return {
      success: true,
      peer,
      message: `Successfully pushed changes to peer "${peer.name}"`
    };
  } catch (error) {
    // Update peer status
    try {
      const peers = await loadPeers(peersFile);
      const peer = peers.peers.find(p => p.name === nameOrUrl || p.url === nameOrUrl);
      if (peer) {
        peer.status = 'error';
        await savePeers(peers, peersFile);
      }
    } catch (saveError) {
      console.error(`Failed to update peer status: ${saveError.message}`);
    }
    
    throw new Error(`Failed to push to peer: ${error.message}`);
  }
}

/**
 * Push changes to all peers
 * 
 * @param {string} gameRepoDir - Path to the game repository
 * @param {string} peersFile - Path to the peers.json file
 * @returns {Promise<Array>} - Results of the push
 */
async function pushToAllPeers(gameRepoDir = DEFAULT_GAME_REPO_DIR, peersFile = DEFAULT_PEERS_FILE) {
  try {
    const peers = await loadPeers(peersFile);
    const results = [];
    
    for (const peer of peers.peers) {
      try {
        const result = await pushToPeer(peer.name, gameRepoDir, peersFile);
        results.push(result);
      } catch (error) {
        results.push({
          success: false,
          peer,
          error: error.message
        });
      }
    }
    
    return results;
  } catch (error) {
    throw new Error(`Failed to push to all peers: ${error.message}`);
  }
}

/**
 * Check the status of a specific peer
 * 
 * @param {string} nameOrUrl - Name or URL of the peer to check
 * @param {string} gameRepoDir - Path to the game repository
 * @param {string} peersFile - Path to the peers.json file
 * @returns {Promise<Object>} - Result of the status check
 */
async function checkPeerStatus(nameOrUrl, gameRepoDir = DEFAULT_GAME_REPO_DIR, peersFile = DEFAULT_PEERS_FILE) {
  try {
    const peers = await loadPeers(peersFile);
    
    // Find the peer to check
    const peer = peers.peers.find(p => p.name === nameOrUrl || p.url === nameOrUrl);
    if (!peer) {
      throw new Error(`Peer with name or URL "${nameOrUrl}" not found`);
    }
    
    // Add the peer as a remote if it doesn't exist
    try {
      await execPromise(`git remote get-url ${peer.name}`, { cwd: gameRepoDir });
    } catch (error) {
      // Remote doesn't exist, add it
      await execPromise(`git remote add ${peer.name} ${peer.url}`, { cwd: gameRepoDir });
    }
    
    // Check if the peer is reachable
    try {
      await execPromise(`git ls-remote --heads ${peer.name}`, { cwd: gameRepoDir });
      
      // Update peer status
      peer.status = 'active';
      await savePeers(peers, peersFile);
      
      return {
        success: true,
        peer,
        message: `Peer "${peer.name}" is reachable`
      };
    } catch (error) {
      // Update peer status
      peer.status = 'unreachable';
      await savePeers(peers, peersFile);
      
      return {
        success: false,
        peer,
        error: `Peer "${peer.name}" is unreachable: ${error.message}`
      };
    }
  } catch (error) {
    throw new Error(`Failed to check peer status: ${error.message}`);
  }
}

/**
 * Check the status of all peers
 * 
 * @param {string} gameRepoDir - Path to the game repository
 * @param {string} peersFile - Path to the peers.json file
 * @returns {Promise<Array>} - Results of the status check
 */
async function checkAllPeersStatus(gameRepoDir = DEFAULT_GAME_REPO_DIR, peersFile = DEFAULT_PEERS_FILE) {
  try {
    const peers = await loadPeers(peersFile);
    const results = [];
    
    for (const peer of peers.peers) {
      try {
        const result = await checkPeerStatus(peer.name, gameRepoDir, peersFile);
        results.push(result);
      } catch (error) {
        results.push({
          success: false,
          peer,
          error: error.message
        });
      }
    }
    
    return results;
  } catch (error) {
    throw new Error(`Failed to check all peers status: ${error.message}`);
  }
}

/**
 * Update peer network settings
 * 
 * @param {Object} settings - Settings to update
 * @param {string} peersFile - Path to the peers.json file
 * @returns {Promise<Object>} - Updated peers object
 */
async function updateSettings(settings, peersFile = DEFAULT_PEERS_FILE) {
  try {
    const peers = await loadPeers(peersFile);
    
    // Update settings
    if (settings.autoSync !== undefined) {
      peers.settings.autoSync = settings.autoSync;
    }
    
    if (settings.syncInterval !== undefined) {
      peers.settings.syncInterval = settings.syncInterval;
    }
    
    if (settings.maxPeers !== undefined) {
      peers.settings.maxPeers = settings.maxPeers;
    }
    
    if (settings.discoveryEnabled !== undefined) {
      peers.settings.discoveryEnabled = settings.discoveryEnabled;
    }
    
    // Save the updated peers
    await savePeers(peers, peersFile);
    
    return peers;
  } catch (error) {
    throw new Error(`Failed to update settings: ${error.message}`);
  }
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
  checkPeerStatus,
  checkAllPeersStatus,
  updateSettings
};