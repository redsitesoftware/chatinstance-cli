import chalk from 'chalk';
import { ChatInstanceAPI, Model } from '../api/client.js';
import { ConfigManager } from '../utils/config.js';

const config = new ConfigManager();

export async function modelsCommand(options: {
  provider?: string;
  format?: string;
}): Promise<void> {
  try {
    const apiKey = config.get('apiKey');
    if (!apiKey) {
      console.error(chalk.red('Please login first: chatinstance login'));
      process.exit(1);
    }

    const api = new ChatInstanceAPI(config);
    console.log(chalk.yellow('Fetching available models...'));

    const response = await api.getModels(options.provider);
    const models = response.data;

    if (models.length === 0) {
      console.log(chalk.yellow('No models found.'));
      return;
    }

    if (options.format === 'json') {
      console.log(JSON.stringify(models, null, 2));
      return;
    }

    // Group models by provider
    const modelsByProvider = models.reduce((groups: Record<string, Model[]>, model) => {
      const provider = model.provider;
      if (!groups[provider]) {
        groups[provider] = [];
      }
      groups[provider].push(model);
      return groups;
    }, {});

    console.log(chalk.bold('\nAvailable AI Models:\n'));

    Object.entries(modelsByProvider).forEach(([provider, providerModels], providerIndex) => {
      console.log(chalk.cyan.bold(`${provider.toUpperCase()}:`));
      
      providerModels.forEach((model, modelIndex) => {
        console.log(`  ${chalk.bold(model.id)}`);
        console.log(`    ${chalk.gray('Name:')} ${model.name}`);
        console.log(`    ${chalk.gray('Description:')} ${model.description}`);
        console.log(`    ${chalk.gray('Context Length:')} ${model.context_length.toLocaleString()} tokens`);
        console.log(`    ${chalk.gray('Capabilities:')} ${model.capabilities.join(', ')}`);
        
        if (model.pricing.input === 0 && model.pricing.output === 0) {
          console.log(`    ${chalk.gray('Pricing:')} Free (Local/Open Source)`);
        } else {
          console.log(`    ${chalk.gray('Pricing:')} $${model.pricing.input}/1K input, $${model.pricing.output}/1K output`);
        }
        
        if (modelIndex < providerModels.length - 1) {
          console.log('');
        }
      });
      
      if (providerIndex < Object.keys(modelsByProvider).length - 1) {
        console.log('');
      }
    });

    console.log(`\n${chalk.gray('Total:')} ${models.length} model${models.length === 1 ? '' : 's'} across ${Object.keys(modelsByProvider).length} provider${Object.keys(modelsByProvider).length === 1 ? '' : 's'}`);
    
    // Show usage examples
    console.log(`\n${chalk.bold('Usage Examples:')}`);
    console.log(chalk.gray('  chatinstance ask "Hello" --provider chatgpt --model gpt-4o'));
    console.log(chalk.gray('  chatinstance chat --provider claude --model claude-3-5-sonnet'));
    
    // Show current defaults
    const defaultProvider = config.get('defaultProvider');
    const defaultModel = config.get('defaultModel');
    console.log(`\n${chalk.bold('Current Defaults:')}`);
    console.log(`  ${chalk.gray('Provider:')} ${defaultProvider}`);
    console.log(`  ${chalk.gray('Model:')} ${defaultModel}`);

  } catch (error: any) {
    console.error(chalk.red('Failed to fetch models:'), error.message);
    process.exit(1);
  }
}