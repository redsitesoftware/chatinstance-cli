#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import boxen from 'boxen';
import { ChatInstanceAPI } from './api/client.js';
import { ConfigManager } from './utils/config.js';
import { loginCommand, logoutCommand, whoamiCommand } from './commands/auth.js';
import { chatCommand, askCommand, continueCommand, clearCommand } from './commands/chat.js';
import { configCommand } from './commands/config.js';
import { instancesCommand } from './commands/instances.js';
import { modelsCommand } from './commands/models.js';

const program = new Command();
const config = new ConfigManager();

program
  .name('chatinstance')
  .description('ChatInstance CLI - AI Aggregator Command Line Interface')
  .version('1.0.0', '-v, --version', 'Display version number')
  .helpOption('-h, --help', 'Display help for command')
  .configureOutput({
    writeOut: (str) => {
      // Custom version output
      if (str.includes('1.0.0')) {
        const versionOutput = boxen(
          chalk.bold.green('ChatInstance CLI') + ' ' + chalk.yellow('v1.0.0') + '\n\n' +
          chalk.gray('Built by Red Site Software'),
          {
            padding: 1,
            margin: 1,
            borderStyle: 'single',
            borderColor: 'cyan'
          }
        );
        process.stdout.write(versionOutput + '\n');
      } else {
        process.stdout.write(str);
      }
    }
  });

// Show welcome banner on help
program.configureHelp({
  formatHelp: (cmd, helper) => {
    const banner = boxen(
      chalk.bold.green('ChatInstance CLI') + '\n' +
      chalk.gray('AI Aggregator Command Line Interface') + '\n\n' +
      chalk.yellow('🚀 Chat with multiple AI providers from your terminal') + '\n\n' +
      '🐙 ' + chalk.cyan('RedSiteSoftware GitHub') + ' ' + chalk.blue.underline('https://github.com/redsitesoftware') + '\n' +
      chalk.gray('   Built by Red Site Software'),
      {
        padding: 1,
        margin: 1,
        borderStyle: 'round',
        borderColor: 'green'
      }
    );
    return banner + '\n\n' + helper.formatHelp(cmd, helper);
  }
});

// Global options
program
  .option('--api-url <url>', 'ChatInstance API base URL')
  .option('--api-key <key>', 'ChatInstance API key')
  .option('--debug', 'Enable debug logging')
  .hook('preAction', (thisCommand) => {
    // Set global options
    const opts = thisCommand.optsWithGlobals();
    if (opts.apiUrl) config.set('apiUrl', opts.apiUrl);
    if (opts.apiKey) config.set('apiKey', opts.apiKey);
    if (opts.debug) config.set('debug', true);
  });

// Authentication commands
program
  .command('login')
  .description('Login with API key')
  .option('-k, --key <key>', 'API key')
  .action(loginCommand);

program
  .command('logout')
  .description('Logout and clear stored credentials')
  .action(logoutCommand);

program
  .command('whoami')
  .description('Show current user information')
  .action(whoamiCommand);

// Chat commands
program
  .command('chat')
  .description('Start interactive chat session')
  .option('-p, --provider <provider>', 'AI provider (chatgpt, claude, gemini, perplexity, ollama)')
  .option('-m, --model <model>', 'Model to use')
  .option('-i, --instance <id>', 'Use specific instance')
  .option('-s, --system <prompt>', 'System prompt')
  .option('--stream', 'Stream response in real-time')
  .action(chatCommand);

program
  .command('ask')
  .description('Ask a single question')
  .argument('<question>', 'Question to ask')
  .option('-p, --provider <provider>', 'AI provider')
  .option('-m, --model <model>', 'Model to use')
  .option('-i, --instance <id>', 'Use specific instance')
  .option('-s, --system <prompt>', 'System prompt')
  .option('--stream', 'Stream response in real-time')
  .option('--format <format>', 'Output format (plain, json)', 'plain')
  .action(askCommand);

program
  .command('continue')
  .description('Continue previous conversation')
  .option('-p, --provider <provider>', 'AI provider')
  .option('-m, --model <model>', 'Model to use')
  .action(continueCommand);

program
  .command('clear')
  .description('Clear conversation history')
  .action(clearCommand);

// Configuration commands
const configCmd = program
  .command('config')
  .description('Manage configuration settings');

configCmd
  .command('set <key> <value>')
  .description('Set configuration value')
  .action((key, value) => configCommand('set', key, value));

configCmd
  .command('get <key>')
  .description('Get configuration value')
  .action((key) => configCommand('get', key));

configCmd
  .command('list')
  .description('List all configuration')
  .action(() => configCommand('list'));

configCmd
  .command('reset')
  .description('Reset configuration to defaults')
  .action(() => configCommand('reset'));

// Instance management
const instancesCmd = program
  .command('instances')
  .alias('inst')
  .description('Manage AI instances');

instancesCmd
  .command('list')
  .description('List all instances')
  .option('--format <format>', 'Output format (table, json)', 'table')
  .action((options) => instancesCommand('list', options));

instancesCmd
  .command('create <name>')
  .description('Create new instance')
  .option('-p, --provider <provider>', 'AI provider')
  .option('-m, --model <model>', 'Model to use')
  .option('-d, --description <desc>', 'Instance description')
  .option('-s, --system <prompt>', 'System prompt')
  .action((name, options) => instancesCommand('create', { name, ...options }));

instancesCmd
  .command('delete <id>')
  .description('Delete instance')
  .option('-f, --force', 'Skip confirmation')
  .action((id, options) => instancesCommand('delete', { id, ...options }));

instancesCmd
  .command('info <id>')
  .description('Show instance details')
  .action((id) => instancesCommand('info', { id }));

// Models commands
program
  .command('models')
  .description('List available models')
  .option('-p, --provider <provider>', 'Filter by provider')
  .option('--format <format>', 'Output format (table, json)', 'table')
  .action(modelsCommand);

// Handle unknown commands
program.on('command:*', (operands) => {
  console.error(chalk.red(`Unknown command: ${operands[0]}`));
  console.log(chalk.yellow('Run `chatinstance --help` to see available commands.'));
  process.exit(1);
});

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
  process.exit(0);
}

// Parse command line arguments
program.parse();

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error(chalk.red('Unexpected error:'), error.message);
  if (config.get('debug')) {
    console.error(error.stack);
  }
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error(chalk.red('Unhandled promise rejection:'), reason);
  process.exit(1);
});