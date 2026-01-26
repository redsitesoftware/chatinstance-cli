import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';
import { ChatInstanceAPI, ChatMessage } from '../api/client.js';
import { ConfigManager } from '../utils/config.js';

const config = new ConfigManager();

export async function chatCommand(options: {
  provider?: string;
  model?: string;
  instance?: string;
  system?: string;
  stream?: boolean;
}): Promise<void> {
  try {
    // Check authentication
    const apiKey = config.get('apiKey');
    if (!apiKey) {
      console.error(chalk.red('Please login first: chatinstance login'));
      process.exit(1);
    }

    const api = new ChatInstanceAPI(config);
    const provider = options.provider || config.get('defaultProvider', 'chatgpt');
    const model = options.model || config.get('defaultModel', 'gpt-4o');
    const useStream = options.stream || config.get('streamResponse', false);

    console.log(chalk.green('ChatInstance CLI v1.0.0'));
    console.log(chalk.gray(`Connected to ${provider} (${model})`));
    console.log(chalk.yellow('Type /help for commands, /exit to quit\n'));

    const messages: ChatMessage[] = [];
    if (options.system) {
      messages.push({ role: 'system', content: options.system });
    }

    while (true) {
      const { input } = await inquirer.prompt([
        {
          type: 'input',
          name: 'input',
          message: chalk.blue('You:'),
          validate: (input: string) => input.trim().length > 0 || 'Please enter a message'
        }
      ]);

      const userInput = input.trim();

      // Handle slash commands
      if (userInput.startsWith('/')) {
        const [command, ...args] = userInput.slice(1).split(' ');
        
        switch (command.toLowerCase()) {
          case 'help':
            showChatHelp();
            continue;
          case 'exit':
          case 'quit':
            console.log(chalk.green('Goodbye!'));
            process.exit(0);
          case 'clear':
            messages.length = 0;
            if (options.system) {
              messages.push({ role: 'system', content: options.system });
            }
            console.log(chalk.yellow('Conversation cleared.'));
            continue;
          case 'provider':
            if (args[0]) {
              console.log(chalk.yellow(`Switched to ${args[0]}`));
              // In a real implementation, we'd switch the provider
            } else {
              console.log(chalk.red('Usage: /provider <provider>'));
            }
            continue;
          case 'tokens':
            const totalTokens = messages.reduce((sum, msg) => sum + (msg.content.length / 4), 0);
            console.log(chalk.gray(`Estimated tokens used: ${Math.ceil(totalTokens)}`));
            continue;
          default:
            console.log(chalk.red(`Unknown command: /${command}`));
            continue;
        }
      }

      messages.push({ role: 'user', content: userInput });

      const spinner = ora('Thinking...').start();

      try {
        if (useStream) {
          spinner.stop();
          process.stdout.write(chalk.green('AI: '));
          
          let response = '';
          await api.streamChat({
            provider,
            model,
            messages,
            stream: true
          }, (chunk) => {
            process.stdout.write(chunk);
            response += chunk;
          });
          
          console.log('\n');
          messages.push({ role: 'assistant', content: response });
        } else {
          const response = await api.chat({
            provider,
            model,
            messages
          });

          spinner.stop();
          console.log(chalk.green('AI:'), response.choices[0].message.content);
          console.log(chalk.gray(`\nTokens: ${response.usage.total_tokens}`));
          
          messages.push({ role: 'assistant', content: response.choices[0].message.content });
        }
      } catch (error: any) {
        spinner.stop();
        console.error(chalk.red('Error:'), error.message);
      }

      console.log('');
    }
  } catch (error: any) {
    console.error(chalk.red('Chat failed:'), error.message);
    process.exit(1);
  }
}

export async function askCommand(
  question: string,
  options: {
    provider?: string;
    model?: string;
    instance?: string;
    system?: string;
    stream?: boolean;
    format?: string;
  }
): Promise<void> {
  try {
    const apiKey = config.get('apiKey');
    if (!apiKey) {
      console.error(chalk.red('Please login first: chatinstance login'));
      process.exit(1);
    }

    const api = new ChatInstanceAPI(config);
    const provider = options.provider || config.get('defaultProvider', 'chatgpt');
    const model = options.model || config.get('defaultModel', 'gpt-4o');
    const useStream = options.stream || config.get('streamResponse', false);

    const messages: ChatMessage[] = [];
    if (options.system) {
      messages.push({ role: 'system', content: options.system });
    }
    messages.push({ role: 'user', content: question });

    if (useStream) {
      if (options.format !== 'plain') {
        console.log(chalk.gray(`${provider} (${model}):`));
      }
      
      let response = '';
      await api.streamChat({
        provider,
        model,
        messages,
        stream: true
      }, (chunk) => {
        process.stdout.write(chunk);
        response += chunk;
      });
      
      console.log('');
      
      if (options.format === 'json') {
        console.log(JSON.stringify({
          provider,
          model,
          question,
          response,
          timestamp: new Date().toISOString()
        }, null, 2));
      }
    } else {
      const spinner = ora('Getting response...').start();
      
      try {
        const response = await api.chat({
          provider,
          model,
          messages
        });

        spinner.stop();

        if (options.format === 'json') {
          console.log(JSON.stringify({
            id: response.id,
            provider: response.provider,
            model: response.model,
            question,
            response: response.choices[0].message.content,
            usage: response.usage,
            timestamp: new Date().toISOString()
          }, null, 2));
        } else {
          console.log(response.choices[0].message.content);
          if (config.get('debug')) {
            console.log(chalk.gray(`\nTokens: ${response.usage.total_tokens}`));
          }
        }
      } catch (error: any) {
        spinner.stop();
        throw error;
      }
    }
  } catch (error: any) {
    console.error(chalk.red('Failed to get response:'), error.message);
    process.exit(1);
  }
}

export async function continueCommand(options: {
  provider?: string;
  model?: string;
}): Promise<void> {
  console.log(chalk.yellow('Continue feature not yet implemented.'));
  console.log(chalk.gray('Use `chatinstance chat` to start a new conversation.'));
}

export async function clearCommand(): Promise<void> {
  console.log(chalk.yellow('Chat history cleared.'));
  console.log(chalk.gray('Note: This is a placeholder - history management not yet implemented.'));
}

function showChatHelp(): void {
  console.log(chalk.bold('\nChat Commands:'));
  console.log(chalk.cyan('/help') + '           - Show this help');
  console.log(chalk.cyan('/exit') + '           - Exit chat session');
  console.log(chalk.cyan('/quit') + '           - Exit chat session');
  console.log(chalk.cyan('/clear') + '          - Clear conversation');
  console.log(chalk.cyan('/provider <name>') + ' - Switch AI provider');
  console.log(chalk.cyan('/tokens') + '         - Show token usage');
  console.log('');
}