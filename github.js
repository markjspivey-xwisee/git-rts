const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');

// Load GitHub configuration
async function loadGitHubConfig() {
  try {
    const configPath = path.join(__dirname, 'git-rts-config.json');
    const configData = await fs.readFile(configPath, 'utf8');
    return JSON.parse(configData).github;
  } catch (error) {
    console.error('Error loading GitHub configuration:', error.message);
    return null;
  }
}

// Get the GitHub repository URL with authentication
async function getGitHubRepoUrl() {
  const config = await loadGitHubConfig();
  if (!config) {
    return null;
  }
  
  return `https://${config.username}:${config.token}@github.com/${config.username}/${config.repository}.git`;
}

// Push changes to GitHub
async function pushToGitHub(gameRepoDir) {
  return new Promise((resolve, reject) => {
    exec('git push origin main', { cwd: gameRepoDir }, (err, stdout, stderr) => {
      if (err) {
        reject(err);
      } else {
        resolve(stdout);
      }
    });
  });
}

// Pull changes from GitHub
async function pullFromGitHub(gameRepoDir) {
  return new Promise((resolve, reject) => {
    exec('git pull origin main', { cwd: gameRepoDir }, (err, stdout, stderr) => {
      if (err) {
        reject(err);
      } else {
        resolve(stdout);
      }
    });
  });
}

// Push a specific branch to GitHub
async function pushBranchToGitHub(gameRepoDir, branchName) {
  return new Promise((resolve, reject) => {
    exec(`git push -u origin ${branchName}`, { cwd: gameRepoDir }, (err, stdout, stderr) => {
      if (err) {
        reject(err);
      } else {
        resolve(stdout);
      }
    });
  });
}

// Pull a specific branch from GitHub
async function pullBranchFromGitHub(gameRepoDir, branchName) {
  return new Promise((resolve, reject) => {
    exec(`git pull origin ${branchName}`, { cwd: gameRepoDir }, (err, stdout, stderr) => {
      if (err) {
        reject(err);
      } else {
        resolve(stdout);
      }
    });
  });
}

// Create a pull request
async function createPullRequest(gameRepoDir, branchName, title, description) {
  const config = await loadGitHubConfig();
  if (!config) {
    throw new Error('GitHub configuration not found');
  }
  
  // Use GitHub API to create a pull request
  const { Octokit } = require('@octokit/rest');
  const octokit = new Octokit({
    auth: config.token
  });
  
  try {
    const response = await octokit.pulls.create({
      owner: config.username,
      repo: config.repository,
      title: title,
      body: description,
      head: branchName,
      base: 'main'
    });
    
    return response.data;
  } catch (error) {
    throw new Error(`Failed to create pull request: ${error.message}`);
  }
}

// List pull requests
async function listPullRequests() {
  const config = await loadGitHubConfig();
  if (!config) {
    throw new Error('GitHub configuration not found');
  }
  
  // Use GitHub API to list pull requests
  const { Octokit } = require('@octokit/rest');
  const octokit = new Octokit({
    auth: config.token
  });
  
  try {
    const response = await octokit.pulls.list({
      owner: config.username,
      repo: config.repository,
      state: 'open'
    });
    
    return response.data;
  } catch (error) {
    throw new Error(`Failed to list pull requests: ${error.message}`);
  }
}

// Merge a pull request
async function mergePullRequest(pullRequestNumber) {
  const config = await loadGitHubConfig();
  if (!config) {
    throw new Error('GitHub configuration not found');
  }
  
  // Use GitHub API to merge a pull request
  const { Octokit } = require('@octokit/rest');
  const octokit = new Octokit({
    auth: config.token
  });
  
  try {
    const response = await octokit.pulls.merge({
      owner: config.username,
      repo: config.repository,
      pull_number: pullRequestNumber
    });
    
    return response.data;
  } catch (error) {
    throw new Error(`Failed to merge pull request: ${error.message}`);
  }
}

// Fork a repository
async function forkRepository(targetUsername, targetRepository) {
  const config = await loadGitHubConfig();
  if (!config) {
    throw new Error('GitHub configuration not found');
  }
  
  // Use GitHub API to fork a repository
  const { Octokit } = require('@octokit/rest');
  const octokit = new Octokit({
    auth: config.token
  });
  
  try {
    const response = await octokit.repos.createFork({
      owner: targetUsername,
      repo: targetRepository
    });
    
    return response.data;
  } catch (error) {
    throw new Error(`Failed to fork repository: ${error.message}`);
  }
}

module.exports = {
  loadGitHubConfig,
  getGitHubRepoUrl,
  pushToGitHub,
  pullFromGitHub,
  pushBranchToGitHub,
  pullBranchFromGitHub,
  createPullRequest,
  listPullRequests,
  mergePullRequest,
  forkRepository
};