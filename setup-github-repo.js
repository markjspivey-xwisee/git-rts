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
const username = 'markj'; // Your GitHub username
const repoName = 'git-rts'; // Repository name

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
      execSync(`git remote set-url origin https://github.com/${username}/${repoName}.git`, { stdio: 'inherit' });
    } else {
      // Add remote
      console.log('\nAdding remote...');
      execSync(`git remote add origin https://github.com/${username}/${repoName}.git`, { stdio: 'inherit' });
    }
  } catch (error) {
    // Add remote
    console.log('\nAdding remote...');
    execSync(`git remote add origin https://github.com/${username}/${repoName}.git`, { stdio: 'inherit' });
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
    console.log('\nGitHub CLI not installed or not authenticated. Please create the repository manually:');
    console.log(`1. Go to https://github.com/new`);
    console.log(`2. Repository name: ${repoName}`);
    console.log(`3. Description: Git-based Real-Time Strategy Game`);
    console.log(`4. Make it Public`);
    console.log(`5. Do NOT initialize with README, .gitignore, or license`);
    console.log(`6. Click "Create repository"`);
  }
  
  // Push to GitHub
  console.log('\nPushing to GitHub...');
  try {
    execSync('git push -u origin master', { stdio: 'inherit' });
    console.log('\nRepository successfully pushed to GitHub!');
  } catch (error) {
    console.error('\nError pushing to GitHub:', error.message);
    console.log('\nYou may need to create a personal access token:');
    console.log('1. Go to https://github.com/settings/tokens');
    console.log('2. Click "Generate new token"');
    console.log('3. Give it a name and select the "repo" scope');
    console.log('4. Click "Generate token"');
    console.log('5. Use the token as your password when pushing');
    console.log('\nThen try pushing manually:');
    console.log('git push -u origin master');
  }
  
  console.log('\nSetup complete!');
  console.log(`\nYour repository is available at: https://github.com/${username}/${repoName}`);
  
} catch (error) {
  console.error('\nError setting up repository:', error.message);
}