import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';
import { ChatInstanceAPI, ChatMessage } from '../api/client.js';
import { ConfigManager } from '../utils/config.js';
import { TerminalUtils } from '../utils/terminal.js';

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

    // Clear screen and show header with better formatting
    TerminalUtils.clearScreen();
    const headerBox = TerminalUtils.formatChatBox('ChatInstance CLI v1.0.0');
    console.log(chalk.bold.green(headerBox[0]));
    console.log(chalk.bold.green(headerBox[1]));
    console.log(chalk.bold.green(headerBox[2]));
    console.log(chalk.cyan(`🤖 Connected to ${provider} (${model})`));
    console.log(chalk.gray('Type /help for commands, /exit to quit'));
    console.log(chalk.gray(TerminalUtils.createSeparator()));
    TerminalUtils.ensureNewlines();

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
            console.log('');
            console.log(chalk.green('👋 Goodbye!'));
            console.log('');
            process.exit(0);
          case 'clear':
            messages.length = 0;
            if (options.system) {
              messages.push({ role: 'system', content: options.system });
            }
            TerminalUtils.clearScreen();
            const headerBox = TerminalUtils.formatChatBox('ChatInstance CLI v1.0.0');
            console.log(chalk.bold.green(headerBox[0]));
            console.log(chalk.bold.green(headerBox[1]));
            console.log(chalk.bold.green(headerBox[2]));
            console.log(chalk.cyan(`🤖 Connected to ${provider} (${model})`));
            console.log(chalk.yellow('✨ Conversation cleared.'));
            console.log(chalk.gray(TerminalUtils.createSeparator()));
            TerminalUtils.ensureNewlines();
            continue;
          case 'provider':
            if (args[0]) {
              console.log(chalk.yellow(`🔄 Switched to ${args[0]}`));
              // In a real implementation, we'd switch the provider
            } else {
              console.log(chalk.red('Usage: /provider <provider>'));
            }
            continue;
          case 'tokens':
            const totalTokens = messages.reduce((sum, msg) => sum + (msg.content.length / 4), 0);
            console.log(chalk.gray(`📊 Estimated tokens used: ${Math.ceil(totalTokens)}`));
            continue;
          default:
            console.log(chalk.red(`❌ Unknown command: /${command}`));
            continue;
        }
      }

      messages.push({ role: 'user', content: userInput });

      // Add visual separator before AI response
      TerminalUtils.ensureNewlines();
      console.log(chalk.gray(TerminalUtils.createSeparator('─', 30)));

      const spinner = ora('🤔 AI is thinking...').start();

      try {
        if (useStream) {
          spinner.stop();
          TerminalUtils.ensureNewlines();
          process.stdout.write(chalk.green('🤖 AI: '));
          
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
          
          TerminalUtils.ensureNewlines();
          messages.push({ role: 'assistant', content: response });
        } else {
          const response = await api.chat({
            provider,
            model,
            messages
          });

          spinner.stop();
          TerminalUtils.ensureNewlines();
          
          // Format long responses with proper wrapping
          console.log(chalk.green('🤖 AI:'));
          const wrappedLines = TerminalUtils.wrapText(response.choices[0].message.content);
          wrappedLines.forEach(line => console.log(`   ${line}`));
          
          TerminalUtils.ensureNewlines();
          console.log(chalk.gray(`📊 Tokens: ${response.usage.total_tokens}`));
          
          messages.push({ role: 'assistant', content: response.choices[0].message.content });
        }
      } catch (error: any) {
        spinner.stop();
        TerminalUtils.ensureNewlines();
        console.error(chalk.red('❌ Error:'), error.message);
      }

      // Add visual separator after AI response
      TerminalUtils.ensureNewlines();
      console.log(chalk.gray(TerminalUtils.createSeparator()));
      TerminalUtils.ensureNewlines();
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
        console.log('');
        console.log(chalk.cyan(`🤖 ${provider} (${model}):`));
        console.log(chalk.gray('─'.repeat(40)));
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
      const spinner = ora('🤔 Getting response...').start();
      
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
          console.log('');
          console.log(chalk.cyan(`🤖 ${provider} (${model}):`));
          console.log(chalk.gray('─'.repeat(40)));
          console.log('');
          console.log(response.choices[0].message.content);
          console.log('');
          if (config.get('debug')) {
            console.log(chalk.gray(`📊 Tokens: ${response.usage.total_tokens}`));
            console.log('');
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
  console.log('');
  console.log(chalk.yellow('⚠️  Continue feature not yet implemented.'));
  console.log(chalk.gray('💡 Use `chatinstance chat` to start a new conversation.'));
  console.log('');
}

export async function clearCommand(): Promise<void> {
  console.log('');
  console.log(chalk.yellow('✨ Chat history cleared.'));
  console.log(chalk.gray('📝 Note: This is a placeholder - history management not yet implemented.'));
  console.log('');
}

function showChatHelp(): void {
  TerminalUtils.ensureNewlines();
  const helpBox = TerminalUtils.formatChatBox('Chat Commands');
  console.log(chalk.bold.cyan(helpBox[0]));
  console.log(chalk.bold.cyan(helpBox[1]));
  console.log(chalk.bold.cyan(helpBox[2]));
  TerminalUtils.ensureNewlines();
  console.log(chalk.cyan('  /help') + '             - Show this help');
  console.log(chalk.cyan('  /exit') + '             - Exit chat session');
  console.log(chalk.cyan('  /quit') + '             - Exit chat session');
  console.log(chalk.cyan('  /clear') + '            - Clear conversation');
  console.log(chalk.cyan('  /provider <name>') + '   - Switch AI provider');
  console.log(chalk.cyan('  /tokens') + '           - Show token usage');
  TerminalUtils.ensureNewlines();
  console.log(chalk.gray(TerminalUtils.createSeparator('─', 40)));
  TerminalUtils.ensureNewlines();
}