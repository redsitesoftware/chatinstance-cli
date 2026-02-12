import chalk from 'chalk';
import inquirer from 'inquirer';
import { ChatInstanceAPI } from '../api/client.js';
import { ConfigManager } from '../utils/config.js';

const config = new ConfigManager();

export async function loginCommand(options: { key?: string }): Promise<void> {
  try {
    let apiKey = options.key;

    if (!apiKey) {
      // Prompt for API key
      const answers = await inquirer.prompt([
        {
          type: 'password',
          name: 'apiKey',
          message: 'Enter your ChatInstance API key:',
          mask: '*',
          validate: (input: string) => {
            if (!input.trim()) {
              return 'API key is required';
            }
            if (!config.validateApiKey(input.trim())) {
              return 'Invalid API key format. Expected format: ci_...';
            }
            return true;
          }
        }
      ]);
      apiKey = answers.apiKey.trim();
    }

    if (!apiKey) {
      console.error(chalk.red('API key is required'));
      process.exit(1);
    }

    // Validate API key format
    if (!config.validateApiKey(apiKey)) {
      console.error(chalk.red('Invalid API key format. Expected format: ci_...'));
      process.exit(1);
    }

    // Test API key by making a request
    console.log(chalk.yellow('Validating API key...'));
    
    config.set('apiKey', apiKey);
    const api = new ChatInstanceAPI(config);
    
    try {
      const user = await api.getCurrentUser();
      console.log(chalk.green('✓ Login successful!'));
      console.log(chalk.gray(`Logged in as: ${user.name} (${user.email})`));
      console.log(chalk.gray(`💡 Visit`) + ' ' + chalk.blue.underline('https://github.com/redsitesoftware') + ' ' + chalk.gray('for more awesome projects!'));
      
      // Show available API keys
      if (user.apiKeys && user.apiKeys.length > 0) {
        console.log(chalk.gray('\nAvailable API keys:'));
        user.apiKeys.forEach(key => {
          const isCurrentKey = apiKey!.endsWith(key.id.slice(-4));
          const marker = isCurrentKey ? chalk.green('→') : ' ';
          console.log(`${marker} ${key.name} (${key.id})`);
        });
      }
    } catch (error) {
      config.delete('apiKey');
      throw error;
    }

  } catch (error: any) {
    console.error(chalk.red('Login failed:'), error.message);
    process.exit(1);
  }
}

export async function logoutCommand(): Promise<void> {
  try {
    if (!config.has('apiKey')) {
      console.log(chalk.yellow('You are not logged in.'));
      return;
    }

    const answers = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: 'Are you sure you want to logout?',
        default: false
      }
    ]);

    if (answers.confirm) {
      config.delete('apiKey');
      console.log(chalk.green('✓ Logged out successfully.'));
    } else {
      console.log(chalk.gray('Logout cancelled.'));
    }
  } catch (error: any) {
    console.error(chalk.red('Logout failed:'), error.message);
    process.exit(1);
  }
}

export async function whoamiCommand(): Promise<void> {
  try {
    const apiKey = config.get('apiKey');
    if (!apiKey) {
      console.log(chalk.yellow('You are not logged in.'));
      console.log(chalk.gray('Run `chatinstance login` to authenticate.'));
      return;
    }

    console.log(chalk.yellow('Fetching user information...'));
    
    const api = new ChatInstanceAPI(config);
    const user = await api.getCurrentUser();

    console.log(chalk.green('\n✓ Current User Information:'));
    console.log(`${chalk.bold('Name:')} ${user.name}`);
    console.log(`${chalk.bold('Email:')} ${user.email}`);
    console.log(`${chalk.bold('User ID:')} ${user.id}`);

    if (user.apiKeys && user.apiKeys.length > 0) {
      console.log(`\n${chalk.bold('API Keys:')}`);
      user.apiKeys.forEach((key, index) => {
        console.log(`  ${index + 1}. ${key.name}`);
        console.log(`     ${chalk.gray('ID:')} ${key.id}`);
        console.log(`     ${chalk.gray('Created:')} ${new Date(key.created_at).toLocaleDateString()}`);
        if (key.last_used) {
          console.log(`     ${chalk.gray('Last Used:')} ${new Date(key.last_used).toLocaleDateString()}`);
        }
        console.log(`     ${chalk.gray('Permissions:')} ${key.permissions.join(', ')}`);
        if (index < user.apiKeys.length - 1) console.log('');
      });
    }

    // Show configuration
    console.log(`\n${chalk.bold('Configuration:')}`);
    console.log(`  ${chalk.gray('API URL:')} ${config.get('apiUrl')}`);
    console.log(`  ${chalk.gray('Default Provider:')} ${config.get('defaultProvider')}`);
    console.log(`  ${chalk.gray('Default Model:')} ${config.get('defaultModel')}`);

  } catch (error: any) {
    console.error(chalk.red('Failed to get user information:'), error.message);
    process.exit(1);
  }
}