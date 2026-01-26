import chalk from 'chalk';
import inquirer from 'inquirer';
import { ChatInstanceAPI, Instance } from '../api/client.js';
import { ConfigManager } from '../utils/config.js';

const config = new ConfigManager();

export async function instancesCommand(
  action: 'list' | 'create' | 'delete' | 'info',
  options: any
): Promise<void> {
  try {
    const apiKey = config.get('apiKey');
    if (!apiKey) {
      console.error(chalk.red('Please login first: chatinstance login'));
      process.exit(1);
    }

    const api = new ChatInstanceAPI(config);

    switch (action) {
      case 'list':
        await listInstances(api, options);
        break;

      case 'create':
        await createInstance(api, options);
        break;

      case 'delete':
        await deleteInstance(api, options);
        break;

      case 'info':
        await showInstanceInfo(api, options);
        break;

      default:
        console.error(chalk.red(`Unknown instances action: ${action}`));
        process.exit(1);
    }
  } catch (error: any) {
    console.error(chalk.red('Instances command failed:'), error.message);
    process.exit(1);
  }
}

async function listInstances(api: ChatInstanceAPI, options: { format?: string }): Promise<void> {
  try {
    const response = await api.getInstances();
    const instances = response.data;

    if (instances.length === 0) {
      console.log(chalk.yellow('No instances found.'));
      console.log(chalk.gray('Create one with: chatinstance instances create "My Assistant"'));
      return;
    }

    if (options.format === 'json') {
      console.log(JSON.stringify(instances, null, 2));
      return;
    }

    // Table format
    console.log(chalk.bold('AI Instances:\n'));
    
    instances.forEach((instance, index) => {
      console.log(`${chalk.cyan((index + 1).toString())}. ${chalk.bold(instance.name)}`);
      console.log(`   ${chalk.gray('ID:')} ${instance.id}`);
      console.log(`   ${chalk.gray('Provider:')} ${instance.provider} (${instance.model})`);
      console.log(`   ${chalk.gray('Status:')} ${getStatusColor(instance.status)}`);
      console.log(`   ${chalk.gray('Created:')} ${new Date(instance.created_at).toLocaleDateString()}`);
      if (instance.usage.last_used) {
        console.log(`   ${chalk.gray('Last Used:')} ${new Date(instance.usage.last_used).toLocaleDateString()}`);
      }
      console.log(`   ${chalk.gray('Requests:')} ${instance.usage.total_requests}`);
      console.log(`   ${chalk.gray('Tokens:')} ${instance.usage.total_tokens.toLocaleString()}`);
      
      if (index < instances.length - 1) console.log('');
    });

    console.log(`\n${chalk.gray('Total:')} ${instances.length} instance${instances.length === 1 ? '' : 's'}`);
  } catch (error: any) {
    throw new Error(`Failed to list instances: ${error.message}`);
  }
}

async function createInstance(api: ChatInstanceAPI, options: {
  name: string;
  provider?: string;
  model?: string;
  description?: string;
  system?: string;
}): Promise<void> {
  try {
    const instanceData = {
      name: options.name,
      description: options.description || '',
      provider: options.provider || config.get('defaultProvider', 'chatgpt'),
      model: options.model || config.get('defaultModel', 'gpt-4o'),
      settings: {
        ...(options.system && { system_prompt: options.system }),
        temperature: config.get('temperature', 0.7),
        max_tokens: config.get('maxTokens', 2000)
      }
    };

    console.log(chalk.yellow('Creating instance...'));
    const instance = await api.createInstance(instanceData);

    console.log(chalk.green('✓ Instance created successfully!'));
    console.log(`${chalk.bold('ID:')} ${instance.id}`);
    console.log(`${chalk.bold('Name:')} ${instance.name}`);
    console.log(`${chalk.bold('Provider:')} ${instance.provider}`);
    console.log(`${chalk.bold('Model:')} ${instance.model}`);
    
    console.log(chalk.gray('\nUse with: chatinstance chat --instance ' + instance.id));
  } catch (error: any) {
    throw new Error(`Failed to create instance: ${error.message}`);
  }
}

async function deleteInstance(api: ChatInstanceAPI, options: {
  id: string;
  force?: boolean;
}): Promise<void> {
  try {
    // Get instance info first
    const instance = await api.getInstance(options.id);

    if (!options.force) {
      const answers = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: `Are you sure you want to delete instance "${instance.name}" (${instance.id})?`,
          default: false
        }
      ]);

      if (!answers.confirm) {
        console.log(chalk.gray('Deletion cancelled.'));
        return;
      }
    }

    console.log(chalk.yellow('Deleting instance...'));
    await api.deleteInstance(options.id);

    console.log(chalk.green('✓ Instance deleted successfully.'));
  } catch (error: any) {
    if (error.message.includes('not found')) {
      console.error(chalk.red(`Instance '${options.id}' not found.`));
    } else {
      throw new Error(`Failed to delete instance: ${error.message}`);
    }
  }
}

async function showInstanceInfo(api: ChatInstanceAPI, options: { id: string }): Promise<void> {
  try {
    const instance = await api.getInstance(options.id);

    console.log(chalk.bold('Instance Information:\n'));
    console.log(`${chalk.cyan('ID:')} ${instance.id}`);
    console.log(`${chalk.cyan('Name:')} ${instance.name}`);
    console.log(`${chalk.cyan('Description:')} ${instance.description || chalk.gray('(none)')}`);
    console.log(`${chalk.cyan('Provider:')} ${instance.provider}`);
    console.log(`${chalk.cyan('Model:')} ${instance.model}`);
    console.log(`${chalk.cyan('Status:')} ${getStatusColor(instance.status)}`);
    
    console.log(`\n${chalk.bold('Settings:')}`);
    console.log(`  ${chalk.gray('Temperature:')} ${instance.settings.temperature}`);
    console.log(`  ${chalk.gray('Max Tokens:')} ${instance.settings.max_tokens}`);
    if (instance.settings.system_prompt) {
      console.log(`  ${chalk.gray('System Prompt:')} ${instance.settings.system_prompt.substring(0, 100)}${instance.settings.system_prompt.length > 100 ? '...' : ''}`);
    }

    console.log(`\n${chalk.bold('Usage:')}`);
    console.log(`  ${chalk.gray('Total Requests:')} ${instance.usage.total_requests.toLocaleString()}`);
    console.log(`  ${chalk.gray('Total Tokens:')} ${instance.usage.total_tokens.toLocaleString()}`);
    console.log(`  ${chalk.gray('Created:')} ${new Date(instance.created_at).toLocaleString()}`);
    console.log(`  ${chalk.gray('Updated:')} ${new Date(instance.updated_at).toLocaleString()}`);
    if (instance.usage.last_used) {
      console.log(`  ${chalk.gray('Last Used:')} ${new Date(instance.usage.last_used).toLocaleString()}`);
    } else {
      console.log(`  ${chalk.gray('Last Used:')} Never`);
    }

    console.log(chalk.gray('\nUse with: chatinstance chat --instance ' + instance.id));
  } catch (error: any) {
    if (error.message.includes('not found')) {
      console.error(chalk.red(`Instance '${options.id}' not found.`));
    } else {
      throw new Error(`Failed to get instance info: ${error.message}`);
    }
  }
}

function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'active':
      return chalk.green(status);
    case 'inactive':
      return chalk.yellow(status);
    case 'error':
      return chalk.red(status);
    default:
      return chalk.gray(status);
  }
}