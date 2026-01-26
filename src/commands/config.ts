import chalk from 'chalk';
import { ConfigManager } from '../utils/config.js';

const config = new ConfigManager();

export async function configCommand(
  action: 'set' | 'get' | 'list' | 'reset',
  key?: string,
  value?: string
): Promise<void> {
  try {
    switch (action) {
      case 'set':
        if (!key || value === undefined) {
          console.error(chalk.red('Usage: chatinstance config set <key> <value>'));
          process.exit(1);
        }
        
        // Validate known keys
        const validKeys = [
          'apiKey', 'apiUrl', 'defaultProvider', 'defaultModel',
          'maxTokens', 'temperature', 'streamResponse', 'saveHistory',
          'historyLimit', 'debug'
        ];
        
        if (!validKeys.includes(key)) {
          console.error(chalk.red(`Unknown configuration key: ${key}`));
          console.log(chalk.yellow(`Valid keys: ${validKeys.join(', ')}`));
          process.exit(1);
        }
        
        // Type conversion
        let typedValue: any = value;
        if (key === 'maxTokens' || key === 'historyLimit') {
          typedValue = parseInt(value);
          if (isNaN(typedValue)) {
            console.error(chalk.red(`${key} must be a number`));
            process.exit(1);
          }
        } else if (key === 'temperature') {
          typedValue = parseFloat(value);
          if (isNaN(typedValue) || typedValue < 0 || typedValue > 2) {
            console.error(chalk.red('temperature must be a number between 0 and 2'));
            process.exit(1);
          }
        } else if (key === 'streamResponse' || key === 'saveHistory' || key === 'debug') {
          typedValue = value.toLowerCase() === 'true';
        }
        
        config.set(key as any, typedValue);
        console.log(chalk.green(`✓ Set ${key} = ${typedValue}`));
        break;

      case 'get':
        if (!key) {
          console.error(chalk.red('Usage: chatinstance config get <key>'));
          process.exit(1);
        }
        
        const configValue = config.get(key as any);
        if (configValue !== undefined) {
          // Hide sensitive values
          const displayValue = key === 'apiKey' && configValue ? 
            '***' + (configValue as string).slice(-4) : configValue;
          console.log(`${chalk.bold(key)}: ${displayValue}`);
        } else {
          console.log(chalk.gray(`${key}: (not set)`));
        }
        break;

      case 'list':
        const displayConfig = config.getDisplayConfig();
        console.log(chalk.bold('Current Configuration:'));
        console.log('');
        
        Object.entries(displayConfig).forEach(([k, v]) => {
          const value = v !== undefined ? v : chalk.gray('(not set)');
          console.log(`${chalk.cyan(k.padEnd(16))}: ${value}`);
        });
        
        console.log('');
        console.log(chalk.gray(`Config file: ${config.getConfigPath()}`));
        break;

      case 'reset':
        const chalk_inquirer = await import('inquirer');
        const answers = await chalk_inquirer.default.prompt([
          {
            type: 'confirm',
            name: 'confirm',
            message: 'Are you sure you want to reset all configuration to defaults?',
            default: false
          }
        ]);

        if (answers.confirm) {
          config.reset();
          console.log(chalk.green('✓ Configuration reset to defaults.'));
        } else {
          console.log(chalk.gray('Reset cancelled.'));
        }
        break;

      default:
        console.error(chalk.red(`Unknown config action: ${action}`));
        process.exit(1);
    }
  } catch (error: any) {
    console.error(chalk.red('Configuration error:'), error.message);
    process.exit(1);
  }
}