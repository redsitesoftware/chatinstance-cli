# ChatInstance CLI

**Command-line AI Aggregator**

A powerful CLI tool to chat with multiple AI providers through a unified interface. Built by [Red Site Software](https://redsitesoftware.com).

[![RedSiteSoftware GitHub](https://img.shields.io/badge/RedSiteSoftware-GitHub-blue?style=for-the-badge&logo=github)](https://github.com/redsitesoftware)

## 🚀 Quick Start

### Installation

```bash
# Install globally via npm
npm install -g chatinstance-cli

# Or use npx (no installation required)
npx chatinstance-cli
```

### Setup

```bash
# Initialize with your API key
chatinstance login

# Or set directly
chatinstance config set apiKey YOUR_API_KEY
```

### Start Chatting

```bash
# Interactive chat mode
chatinstance chat

# Quick question
chatinstance ask "Explain quantum computing"

# Use specific AI provider
chatinstance ask "Write a Python function" --provider claude

# Stream responses in real-time
chatinstance ask "Tell me a story" --stream
```

## 🤖 Supported AI Providers

- **ChatGPT** (GPT-4o, GPT-4o-mini)
- **Claude** (3.5 Sonnet, Haiku)
- **Gemini** (2.0 Flash, Pro)
- **Perplexity** (Llama 3.1 Sonar)
- **Ollama** (Local models: Llama, Mistral, etc.)

## 📖 Commands

### Authentication

```bash
# Login with API key
chatinstance login

# Check current user
chatinstance whoami

# Logout
chatinstance logout
```

### Chat Commands

```bash
# Interactive chat session
chatinstance chat [options]

# Single question
chatinstance ask <question> [options]

# Continue previous conversation
chatinstance continue

# Clear chat history
chatinstance clear
```

### Configuration

```bash
# View all settings
chatinstance config

# Set API key
chatinstance config set apiKey <key>

# Set default provider
chatinstance config set provider claude

# Set default model
chatinstance config set model gpt-4o

# View specific setting
chatinstance config get provider
```

### Instances

```bash
# List AI instances
chatinstance instances list

# Create new instance
chatinstance instances create "Marketing Assistant"

# Use specific instance
chatinstance chat --instance inst_123

# Delete instance
chatinstance instances delete inst_123
```

### Models

```bash
# List all available models
chatinstance models

# List models for specific provider
chatinstance models --provider chatgpt

# Get model details
chatinstance models info gpt-4o
```

## 🎯 Usage Examples

### Basic Chat

```bash
# Start interactive session
$ chatinstance chat
ChatInstance CLI v1.0.0
Connected to ChatGPT-4o

You: Hello! Can you help me with Python?
AI: Absolutely! I'd be happy to help you with Python...

You: /provider claude
Switched to Claude 3.5 Sonnet

You: What's the difference between lists and tuples?
AI: Great question! Here are the key differences...

You: /exit
Goodbye!
```

### Quick Questions

```bash
# Simple question
$ chatinstance ask "What's the weather like in Brisbane?"

# With specific provider and model
$ chatinstance ask "Write a haiku about coding" --provider gemini --model gemini-pro

# Stream response
$ chatinstance ask "Tell me about machine learning" --stream --provider claude
```

### Working with Instances

```bash
# Create specialized instance
$ chatinstance instances create "Python Tutor" --provider chatgpt --model gpt-4o
Created instance: inst_py_tutor_001

# Chat with instance
$ chatinstance chat --instance inst_py_tutor_001
Connected to Python Tutor (ChatGPT-4o)

# List your instances
$ chatinstance instances
┌─────────────────────┬─────────────────┬───────────┬────────────┐
│ ID                  │ Name            │ Provider  │ Model      │
├─────────────────────┼─────────────────┼───────────┼────────────┤
│ inst_py_tutor_001   │ Python Tutor    │ chatgpt   │ gpt-4o     │
│ inst_marketing_002  │ Marketing Bot   │ claude    │ claude-3.5 │
└─────────────────────┴─────────────────┴───────────┴────────────┘
```

### Advanced Usage

```bash
# Custom system prompt
$ chatinstance ask "Review this code" --system "You are a senior software engineer focused on clean code and best practices"

# Save conversation
$ chatinstance chat --save conversation.json

# Load previous conversation
$ chatinstance chat --load conversation.json

# Export chat history
$ chatinstance export --format json --output chats.json
```

## ⚙️ Configuration Options

### Global Config (~/.config/chatinstance/config.json)

```json
{
  "apiKey": "ci_your_api_key_here",
  "defaultProvider": "chatgpt",
  "defaultModel": "gpt-4o",
  "apiUrl": "https://api.chatinstance.com/v1",
  "maxTokens": 2000,
  "temperature": 0.7,
  "streamResponse": false,
  "saveHistory": true,
  "historyLimit": 100
}
```

### Environment Variables

```bash
export CHATINSTANCE_API_KEY="your_api_key"
export CHATINSTANCE_PROVIDER="claude"
export CHATINSTANCE_MODEL="claude-3.5-sonnet"
export CHATINSTANCE_API_URL="https://api.chatinstance.com/v1"
```

## 🎨 Interactive Features

### Chat Session Commands

While in interactive chat mode, use these commands:

- `/help` - Show available commands
- `/provider <name>` - Switch AI provider
- `/model <name>` - Switch model
- `/system <prompt>` - Set system prompt
- `/clear` - Clear conversation history
- `/save <filename>` - Save current conversation
- `/load <filename>` - Load conversation
- `/tokens` - Show token usage
- `/exit` or `/quit` - Exit chat session

### Keyboard Shortcuts

- `Ctrl+C` - Exit current operation
- `Ctrl+D` - Exit chat session
- `↑` / `↓` - Navigate command history
- `Tab` - Auto-complete commands

## 🔧 Advanced Configuration

### Custom Prompts

Create prompt templates in `~/.config/chatinstance/prompts/`:

```bash
# ~/.config/chatinstance/prompts/code-review.txt
You are a senior software engineer conducting a code review.
Focus on:
- Code quality and best practices
- Performance considerations
- Security vulnerabilities
- Maintainability

# Use with:
chatinstance ask "Review this function" --prompt code-review
```

### Aliases

Add to your shell config:

```bash
# ~/.bashrc or ~/.zshrc
alias ci="chatinstance"
alias ask="chatinstance ask"
alias chat="chatinstance chat"
alias aichat="chatinstance chat --provider claude"
```

## 📊 Output Formats

### JSON Output

```bash
# Get machine-readable output
chatinstance ask "What is AI?" --format json
{
  "id": "chat_123",
  "provider": "chatgpt",
  "model": "gpt-4o",
  "response": "Artificial Intelligence...",
  "usage": {
    "tokens": 45,
    "cost": 0.001
  }
}
```

### Markdown Export

```bash
# Export conversation as markdown
chatinstance export --format markdown --output conversation.md
```

## 🚀 Integration Examples

### Shell Scripts

```bash
#!/bin/bash
# auto-commit.sh - AI-powered git commits
diff=$(git diff --staged)
message=$(echo "$diff" | chatinstance ask "Generate a concise git commit message for these changes" --format plain)
git commit -m "$message"
```

### Pipe Integration

```bash
# Code review pipeline
cat src/app.js | chatinstance ask "Review this code for bugs" --stdin

# Log analysis
tail -f app.log | chatinstance ask "Analyze these logs for issues" --stdin --stream
```

## 🔒 Security & Privacy

- **API Keys**: Stored securely in local config files
- **History**: Chat history stored locally only
- **No Telemetry**: No usage data sent to ChatInstance servers
- **Local Mode**: Use with Ollama for completely local AI

## 🛠️ Development

### Build from Source

```bash
git clone https://github.com/redsitesoftware/chatinstance-cli.git
cd chatinstance-cli
npm install
npm run build
npm link
```

### Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🔗 RedSiteSoftware

Visit our GitHub for more awesome projects:
**🐙 [RedSiteSoftware GitHub](https://github.com/redsitesoftware)**

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/redsitesoftware/chatinstance-cli/issues)
- **Documentation**: [docs.chatinstance.com](https://docs.chatinstance.com)
- **Email**: support@chatinstance.com

---

**Built with ❤️ by [Red Site Software](https://redsitesoftware.com)**

*Brisbane's Premier AI Software Development Consultancy*