/**
 * Hook Command Module
 * 
 * Command-line interface for managing Git hooks in Git-RTS
 */

const { program } = require('commander');
const path = require('path');
const chalk = require('chalk');
const Table = require('cli-table3');
const hookManager = require('../lib/hook-manager');

// Default paths
const DEFAULT_GAME_REPO_DIR = process.env.GAME_REPO_DIR || path.join(process.cwd(), 'game-repo');
const DEFAULT_HOOKS_DIR = path.join(process.cwd(), 'hooks');

// Install hook command
program
  .command('install [hookName]')
  .description('Install a Git hook or all hooks')
  .option('-d, --dir <directory>', 'Game repository directory', DEFAULT_GAME_REPO_DIR)
  .option('-s, --hooks-dir <directory>', 'Hooks directory', DEFAULT_HOOKS_DIR)
  .option('-a, --all', 'Install all available hooks', false)
  .action(async (hookName, options) => {
    try {
      if (options.all || !hookName) {
        console.log(chalk.blue('Installing all available hooks...'));
        const results = await hookManager.installAllHooks(options.dir, options.hooksDir);
        
        const table = new Table({
          head: ['Hook', 'Status', 'Message'],
          colWidths: [20, 15, 50]
        });
        
        for (const [hook, result] of Object.entries(results)) {
          table.push([
            hook,
            result.success ? chalk.green('Success') : chalk.red('Failed'),
            result.error || ''
          ]);
        }
        
        console.log(table.toString());
        console.log(`Installed ${Object.values(results).filter(r => r.success).length}/${Object.keys(results).length} hooks`);
      } else {
        console.log(chalk.blue(`Installing hook "${hookName}"...`));
        await hookManager.installHook(hookName, options.dir, options.hooksDir);
        console.log(chalk.green(`✓ Hook "${hookName}" installed successfully`));
      }
    } catch (error) {
      console.error(chalk.red(`✗ Error installing hook: ${error.message}`));
      process.exit(1);
    }
  });

// Uninstall hook command
program
  .command('uninstall [hookName]')
  .description('Uninstall a Git hook or all hooks')
  .option('-d, --dir <directory>', 'Game repository directory', DEFAULT_GAME_REPO_DIR)
  .option('-a, --all', 'Uninstall all hooks', false)
  .action(async (hookName, options) => {
    try {
      if (options.all || !hookName) {
        console.log(chalk.blue('Uninstalling all hooks...'));
        const results = await hookManager.uninstallAllHooks(options.dir);
        
        const table = new Table({
          head: ['Hook', 'Status', 'Message'],
          colWidths: [20, 15, 50]
        });
        
        for (const [hook, result] of Object.entries(results)) {
          table.push([
            hook,
            result.success ? chalk.green('Success') : chalk.red('Failed'),
            result.error || result.message || ''
          ]);
        }
        
        console.log(table.toString());
        console.log(`Uninstalled ${Object.values(results).filter(r => r.success).length}/${Object.keys(results).length} hooks`);
      } else {
        console.log(chalk.blue(`Uninstalling hook "${hookName}"...`));
        await hookManager.uninstallHook(hookName, options.dir);
        console.log(chalk.green(`✓ Hook "${hookName}" uninstalled successfully`));
      }
    } catch (error) {
      console.error(chalk.red(`✗ Error uninstalling hook: ${error.message}`));
      process.exit(1);
    }
  });

// Update hook command
program
  .command('update [hookName]')
  .description('Update a Git hook or all hooks')
  .option('-d, --dir <directory>', 'Game repository directory', DEFAULT_GAME_REPO_DIR)
  .option('-s, --hooks-dir <directory>', 'Hooks directory', DEFAULT_HOOKS_DIR)
  .option('-a, --all', 'Update all hooks', false)
  .action(async (hookName, options) => {
    try {
      if (options.all || !hookName) {
        console.log(chalk.blue('Updating all hooks...'));
        const results = await hookManager.updateAllHooks(options.dir, options.hooksDir);
        
        const table = new Table({
          head: ['Hook', 'Status', 'Message'],
          colWidths: [20, 15, 50]
        });
        
        for (const [hook, result] of Object.entries(results)) {
          table.push([
            hook,
            result.success ? chalk.green('Success') : chalk.red('Failed'),
            result.error || ''
          ]);
        }
        
        console.log(table.toString());
        console.log(`Updated ${Object.values(results).filter(r => r.success).length}/${Object.keys(results).length} hooks`);
      } else {
        console.log(chalk.blue(`Updating hook "${hookName}"...`));
        await hookManager.updateHook(hookName, options.dir, options.hooksDir);
        console.log(chalk.green(`✓ Hook "${hookName}" updated successfully`));
      }
    } catch (error) {
      console.error(chalk.red(`✗ Error updating hook: ${error.message}`));
      process.exit(1);
    }
  });

// List hooks command
program
  .command('list')
  .description('List all Git hooks and their status')
  .option('-d, --dir <directory>', 'Game repository directory', DEFAULT_GAME_REPO_DIR)
  .option('-s, --hooks-dir <directory>', 'Hooks directory', DEFAULT_HOOKS_DIR)
  .action(async (options) => {
    try {
      console.log(chalk.blue('Listing all hooks...'));
      const results = await hookManager.listHooks(options.dir, options.hooksDir);
      
      const table = new Table({
        head: ['Hook', 'Template Exists', 'Installed'],
        colWidths: [20, 20, 20]
      });
      
      for (const [hook, result] of Object.entries(results)) {
        table.push([
          hook,
          result.templateExists ? chalk.green('Yes') : chalk.red('No'),
          result.installed ? chalk.green('Yes') : chalk.red('No')
        ]);
      }
      
      console.log(table.toString());
      console.log(`Available hooks: ${hookManager.AVAILABLE_HOOKS.join(', ')}`);
    } catch (error) {
      console.error(chalk.red(`✗ Error listing hooks: ${error.message}`));
      process.exit(1);
    }
  });

module.exports = program;