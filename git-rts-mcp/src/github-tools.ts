import { exec } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';

// Define the game repository directory from environment variable or default
const gameRepoDir = process.env.GAME_REPO_DIR || 'C:/Users/markj/Desktop/game-repo';

// Load GitHub configuration from environment variables or file
export async function loadGitHubConfig() {
  try {
    // First try to get from environment variables
    if (process.env.GITHUB_USERNAME && process.env.GITHUB_TOKEN && process.env.GITHUB_REPOSITORY) {
      return {
        username: process.env.GITHUB_USERNAME,
        token: process.env.GITHUB_TOKEN,
        repository: process.env.GITHUB_REPOSITORY
      };
    }
    
    // Fall back to file-based configuration
    const configPath = path.join('C:/Users/markj/Desktop/git-rts-cli', 'git-rts-config.json');
    const configData = await fs.readFile(configPath, 'utf8');
    return JSON.parse(configData).github;
  } catch (error) {
    console.error('Error loading GitHub configuration:', error instanceof Error ? error.message : String(error));
    return null;
  }
}

// Get the GitHub repository URL with authentication
export async function getGitHubRepoUrl() {
  const config = await loadGitHubConfig();
  if (!config) {
    return null;
  }
  
  return `https://${config.username}:${config.token}@github.com/${config.username}/${config.repository}.git`;
}

// Push changes to GitHub
export async function pushToGitHub() {
  return new Promise<string>((resolve, reject) => {
    exec('git push origin master', { cwd: gameRepoDir }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(`Command execution error: ${error.message}\n${stderr}`));
      } else {
        resolve(stdout);
      }
    });
  });
}

// Pull changes from GitHub
export async function pullFromGitHub() {
  return new Promise<string>((resolve, reject) => {
    exec('git pull origin master', { cwd: gameRepoDir }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(`Command execution error: ${error.message}\n${stderr}`));
      } else {
        resolve(stdout);
      }
    });
  });
}

// Push a specific branch to GitHub
export async function pushBranchToGitHub(branchName: string) {
  return new Promise<string>((resolve, reject) => {
    exec(`git push -u origin ${branchName}`, { cwd: gameRepoDir }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(`Command execution error: ${error.message}\n${stderr}`));
      } else {
        resolve(stdout);
      }
    });
  });
}

// Pull a specific branch from GitHub
export async function pullBranchFromGitHub(branchName: string) {
  return new Promise<string>((resolve, reject) => {
    exec(`git pull origin ${branchName}`, { cwd: gameRepoDir }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(`Command execution error: ${error.message}\n${stderr}`));
      } else {
        resolve(stdout);
      }
    });
  });
}

// Execute a CLI command with GitHub integration
export async function executeCliWithGitHub(command: string, args: string[]): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const cliPath = 'C:/Users/markj/Desktop/git-rts-cli/index.js';
    const fullCommand = `node ${cliPath} ${command} ${args.join(' ')}`;
    
    exec(fullCommand, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(`Command execution error: ${error.message}\n${stderr}`));
      } else {
        // Process the output to remove duplicates
        const processedOutput = deduplicateOutput(stdout);
        resolve(processedOutput);
      }
    });
  });
}

// Function to deduplicate repeated lines in command output
function deduplicateOutput(output: string): string {
  // Split the output into lines
  const lines = output.split('\n');
  
  // Create a map to track seen lines and their counts
  const seenLines = new Map<string, number>();
  const uniqueLines: string[] = [];
  
  // Process each line
  for (const line of lines) {
    // Skip empty lines
    if (!line.trim()) {
      uniqueLines.push(line);
      continue;
    }
    
    // If we've seen this line before, skip it
    if (seenLines.has(line)) {
      seenLines.set(line, seenLines.get(line)! + 1);
    } else {
      // First time seeing this line
      seenLines.set(line, 1);
      uniqueLines.push(line);
    }
  }
  
  // For lines that appeared multiple times, add a count indicator
  const finalLines = uniqueLines.map(line => {
    const count = seenLines.get(line);
    if (count && count > 1) {
      // Only add count for non-empty lines
      return line.trim() ? line : line;
    }
    return line;
  });
  
  return finalLines.join('\n');
}