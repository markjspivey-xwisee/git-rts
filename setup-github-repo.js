const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Script to set up the Git-RTS project on GitHub
 * 
 * This script will:
 * 1. Initialize a Git repository
 * 2. Add all files to the repository
 * 3. Create an initial commit
 * 4. Add a remote for GitHub
 * 5. Push the repository to GitHub
 */

// GitHub credentials
const username = process.env.GITHUB_USERNAME || 'markjspivey-xwisee'; // Your GitHub username
const token = process.env.GITHUB_TOKEN; // Your personal access token
const repoName = process.env.REPO_NAME || 'git-rts'; // Repository name

if (!token) {
  console.error('Error: GitHub token not provided. Please set the GITHUB_TOKEN environment variable.');
  console.error('Example: GITHUB_TOKEN=your_token node setup-github-repo.js');
  process.exit(1);
}

console.log(`\nSetting up Git-RTS repository for GitHub...`);
console.log(`Username: ${username}`);
console.log(`Repository: ${repoName}`);

try {
  // Check if .git directory already exists
  if (fs.existsSync(path.join(__dirname, '.git'))) {
    console.log('\n.git directory already exists. Skipping git init...');
  } else {
    // Initialize Git repository
    console.log('\nInitializing Git repository...');
    execSync('git init', { stdio: 'inherit' });
  }
  
  // Add all files to the repository
  console.log('\nAdding files to the repository...');
  execSync('git add .', { stdio: 'inherit' });
  
  // Create initial commit
  console.log('\nCreating initial commit...');
  execSync('git commit -m "Initial commit: Git-RTS project setup"', { stdio: 'inherit' });
  
  // Check if remote already exists
  try {
    const remotes = execSync('git remote').toString().trim().split('\n');
    if (remotes.includes('origin')) {
      console.log('\nRemote "origin" already exists. Updating URL...');
      execSync(`git remote set-url origin https://${username}:${token}@github.com/${username}/${repoName}.git`, { stdio: 'inherit' });
    } else {
      // Add remote
      console.log('\nAdding remote...');
      execSync(`git remote add origin https://${username}:${token}@github.com/${username}/${repoName}.git`, { stdio: 'inherit' });
    }
  } catch (error) {
    // Add remote
    console.log('\nAdding remote...');
    execSync(`git remote add origin https://${username}:${token}@github.com/${username}/${repoName}.git`, { stdio: 'inherit' });
  }
  
  // Create repository on GitHub if it doesn't exist
  console.log('\nCreating repository on GitHub if it doesn\'t exist...');
  console.log('Note: This step requires the GitHub CLI (gh) to be installed and authenticated.');
  console.log('If you don\'t have it installed, you can create the repository manually at https://github.com/new');
  
  try {
    // Check if GitHub CLI is installed
    execSync('gh --version', { stdio: 'pipe' });
    
    // Check if repository exists
    try {
      execSync(`gh repo view ${username}/${repoName}`, { stdio: 'pipe' });
      console.log(`\nRepository ${username}/${repoName} already exists on GitHub.`);
    } catch (error) {
      // Create repository
      console.log(`\nCreating repository ${username}/${repoName} on GitHub...`);
      execSync(`gh repo create ${repoName} --public --description "Git-based Real-Time Strategy Game"`, { stdio: 'inherit' });
    }
  } catch (error) {
    console.log('\nGitHub CLI not installed or not authenticated. Creating repository via API...');
    
    try {
      // Create repository via API
      const curlCommand = `curl -X POST -H "Authorization: token ${token}" -H "Accept: application/vnd.github.v3+json" https://api.github.com/user/repos -d "{\\"name\\":\\"${repoName}\\",\\"description\\":\\"Git-based Real-Time Strategy Game\\",\\"private\\":false}"`;
      execSync(curlCommand, { stdio: 'pipe' });
      console.log(`\nRepository ${username}/${repoName} created on GitHub.`);
    } catch (error) {
      console.log('\nFailed to create repository via API. Please create it manually:');
      console.log(`1. Go to https://github.com/new`);
      console.log(`2. Repository name: ${repoName}`);
      console.log(`3. Description: Git-based Real-Time Strategy Game`);
      console.log(`4. Make it Public`);
      console.log(`5. Do NOT initialize with README, .gitignore, or license`);
      console.log(`6. Click "Create repository"`);
    }
  }
  
  // Push to GitHub
  console.log('\nPushing to GitHub...');
  try {
    execSync('git push -u origin master', { stdio: 'inherit' });
    console.log('\nRepository successfully pushed to GitHub!');
  } catch (error) {
    console.error('\nError pushing to GitHub:', error.message);
    console.log('\nTrying alternative push method...');
    
    try {
      execSync(`git push -u https://${username}:${token}@github.com/${username}/${repoName}.git master`, { stdio: 'inherit' });
      console.log('\nRepository successfully pushed to GitHub!');
    } catch (pushError) {
      console.error('\nError pushing to GitHub with token:', pushError.message);
      console.log('\nPlease try pushing manually:');
      console.log(`git push -u https://${username}:${token}@github.com/${username}/${repoName}.git master`);
    }
  }
  
  console.log('\nSetup complete!');
  console.log(`\nYour repository is available at: https://github.com/${username}/${repoName}`);
  
} catch (error) {
  console.error('\nError setting up repository:', error.message);
}