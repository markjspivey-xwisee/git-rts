/**
 * Hook Manager Module
 * 
 * Manages Git hooks for Git-RTS, including:
 * - Installing hooks
 * - Updating hooks
 * - Enabling/disabling hooks
 */

const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execPromise = promisify(exec);

// Default paths
const DEFAULT_HOOKS_DIR = path.join(process.cwd(), 'hooks');
const DEFAULT_GAME_REPO_DIR = process.env.GAME_REPO_DIR || path.join(process.cwd(), 'game-repo');

// List of available hooks
const AVAILABLE_HOOKS = [
  'pre-commit',
  'post-commit',
  'pre-push',
  'post-merge',
  'post-checkout'
];

/**
 * Check if a hook is installed
 * 
 * @param {string} hookName - Name of the hook
 * @param {string} gameRepoDir - Path to the game repository
 * @returns {Promise<boolean>} - Whether the hook is installed
 */
async function isHookInstalled(hookName, gameRepoDir = DEFAULT_GAME_REPO_DIR) {
  try {
    const gitHooksDir = path.join(gameRepoDir, '.git', 'hooks');
    const hookPath = path.join(gitHooksDir, hookName);
    
    await fs.access(hookPath);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Install a hook
 * 
 * @param {string} hookName - Name of the hook
 * @param {string} gameRepoDir - Path to the game repository
 * @param {string} hooksDir - Path to the hooks directory
 * @returns {Promise<boolean>} - Whether the hook was installed successfully
 */
async function installHook(hookName, gameRepoDir = DEFAULT_GAME_REPO_DIR, hooksDir = DEFAULT_HOOKS_DIR) {
  try {
    // Check if the hook is available
    if (!AVAILABLE_HOOKS.includes(hookName)) {
      throw new Error(`Hook "${hookName}" is not available`);
    }
    
    // Check if the hook template exists
    const hookTemplatePath = path.join(hooksDir, hookName);
    try {
      await fs.access(hookTemplatePath);
    } catch (error) {
      throw new Error(`Hook template "${hookName}" not found in ${hooksDir}`);
    }
    
    // Create the Git hooks directory if it doesn't exist
    const gitHooksDir = path.join(gameRepoDir, '.git', 'hooks');
    await fs.mkdir(gitHooksDir, { recursive: true });
    
    // Copy the hook template to the Git hooks directory
    const hookPath = path.join(gitHooksDir, hookName);
    await fs.copyFile(hookTemplatePath, hookPath);
    
    // Make the hook executable
    await fs.chmod(hookPath, 0o755);
    
    return true;
  } catch (error) {
    throw new Error(`Failed to install hook "${hookName}": ${error.message}`);
  }
}

/**
 * Install all available hooks
 * 
 * @param {string} gameRepoDir - Path to the game repository
 * @param {string} hooksDir - Path to the hooks directory
 * @returns {Promise<Object>} - Result of the installation
 */
async function installAllHooks(gameRepoDir = DEFAULT_GAME_REPO_DIR, hooksDir = DEFAULT_HOOKS_DIR) {
  const results = {};
  
  for (const hookName of AVAILABLE_HOOKS) {
    try {
      // Check if the hook template exists
      const hookTemplatePath = path.join(hooksDir, hookName);
      try {
        await fs.access(hookTemplatePath);
      } catch (error) {
        results[hookName] = { success: false, error: `Hook template not found` };
        continue;
      }
      
      // Install the hook
      await installHook(hookName, gameRepoDir, hooksDir);
      results[hookName] = { success: true };
    } catch (error) {
      results[hookName] = { success: false, error: error.message };
    }
  }
  
  return results;
}

/**
 * Uninstall a hook
 * 
 * @param {string} hookName - Name of the hook
 * @param {string} gameRepoDir - Path to the game repository
 * @returns {Promise<boolean>} - Whether the hook was uninstalled successfully
 */
async function uninstallHook(hookName, gameRepoDir = DEFAULT_GAME_REPO_DIR) {
  try {
    // Check if the hook is available
    if (!AVAILABLE_HOOKS.includes(hookName)) {
      throw new Error(`Hook "${hookName}" is not available`);
    }
    
    // Check if the hook is installed
    const gitHooksDir = path.join(gameRepoDir, '.git', 'hooks');
    const hookPath = path.join(gitHooksDir, hookName);
    
    try {
      await fs.access(hookPath);
    } catch (error) {
      throw new Error(`Hook "${hookName}" is not installed`);
    }
    
    // Remove the hook
    await fs.unlink(hookPath);
    
    return true;
  } catch (error) {
    throw new Error(`Failed to uninstall hook "${hookName}": ${error.message}`);
  }
}

/**
 * Uninstall all hooks
 * 
 * @param {string} gameRepoDir - Path to the game repository
 * @returns {Promise<Object>} - Result of the uninstallation
 */
async function uninstallAllHooks(gameRepoDir = DEFAULT_GAME_REPO_DIR) {
  const results = {};
  
  for (const hookName of AVAILABLE_HOOKS) {
    try {
      // Check if the hook is installed
      if (await isHookInstalled(hookName, gameRepoDir)) {
        // Uninstall the hook
        await uninstallHook(hookName, gameRepoDir);
        results[hookName] = { success: true };
      } else {
        results[hookName] = { success: true, message: 'Hook was not installed' };
      }
    } catch (error) {
      results[hookName] = { success: false, error: error.message };
    }
  }
  
  return results;
}

/**
 * Update a hook
 * 
 * @param {string} hookName - Name of the hook
 * @param {string} gameRepoDir - Path to the game repository
 * @param {string} hooksDir - Path to the hooks directory
 * @returns {Promise<boolean>} - Whether the hook was updated successfully
 */
async function updateHook(hookName, gameRepoDir = DEFAULT_GAME_REPO_DIR, hooksDir = DEFAULT_HOOKS_DIR) {
  try {
    // Check if the hook is available
    if (!AVAILABLE_HOOKS.includes(hookName)) {
      throw new Error(`Hook "${hookName}" is not available`);
    }
    
    // Check if the hook template exists
    const hookTemplatePath = path.join(hooksDir, hookName);
    try {
      await fs.access(hookTemplatePath);
    } catch (error) {
      throw new Error(`Hook template "${hookName}" not found in ${hooksDir}`);
    }
    
    // Check if the hook is installed
    const gitHooksDir = path.join(gameRepoDir, '.git', 'hooks');
    const hookPath = path.join(gitHooksDir, hookName);
    
    try {
      await fs.access(hookPath);
    } catch (error) {
      // Hook is not installed, install it
      return installHook(hookName, gameRepoDir, hooksDir);
    }
    
    // Update the hook
    await fs.copyFile(hookTemplatePath, hookPath);
    
    // Make the hook executable
    await fs.chmod(hookPath, 0o755);
    
    return true;
  } catch (error) {
    throw new Error(`Failed to update hook "${hookName}": ${error.message}`);
  }
}

/**
 * Update all hooks
 * 
 * @param {string} gameRepoDir - Path to the game repository
 * @param {string} hooksDir - Path to the hooks directory
 * @returns {Promise<Object>} - Result of the update
 */
async function updateAllHooks(gameRepoDir = DEFAULT_GAME_REPO_DIR, hooksDir = DEFAULT_HOOKS_DIR) {
  const results = {};
  
  for (const hookName of AVAILABLE_HOOKS) {
    try {
      // Check if the hook template exists
      const hookTemplatePath = path.join(hooksDir, hookName);
      try {
        await fs.access(hookTemplatePath);
      } catch (error) {
        results[hookName] = { success: false, error: `Hook template not found` };
        continue;
      }
      
      // Update the hook
      await updateHook(hookName, gameRepoDir, hooksDir);
      results[hookName] = { success: true };
    } catch (error) {
      results[hookName] = { success: false, error: error.message };
    }
  }
  
  return results;
}

/**
 * List all hooks and their status
 * 
 * @param {string} gameRepoDir - Path to the game repository
 * @param {string} hooksDir - Path to the hooks directory
 * @returns {Promise<Object>} - Status of all hooks
 */
async function listHooks(gameRepoDir = DEFAULT_GAME_REPO_DIR, hooksDir = DEFAULT_HOOKS_DIR) {
  const results = {};
  
  for (const hookName of AVAILABLE_HOOKS) {
    try {
      // Check if the hook template exists
      const hookTemplatePath = path.join(hooksDir, hookName);
      let templateExists = false;
      try {
        await fs.access(hookTemplatePath);
        templateExists = true;
      } catch (error) {
        templateExists = false;
      }
      
      // Check if the hook is installed
      const installed = await isHookInstalled(hookName, gameRepoDir);
      
      results[hookName] = {
        templateExists,
        installed
      };
    } catch (error) {
      results[hookName] = {
        templateExists: false,
        installed: false,
        error: error.message
      };
    }
  }
  
  return results;
}

module.exports = {
  isHookInstalled,
  installHook,
  installAllHooks,
  uninstallHook,
  uninstallAllHooks,
  updateHook,
  updateAllHooks,
  listHooks,
  AVAILABLE_HOOKS
};