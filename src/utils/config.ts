import Conf from 'conf';
import os from 'os';
import path from 'path';

export interface ChatInstanceConfig {
  apiKey?: string;
  apiUrl?: string;
  defaultProvider?: string;
  defaultModel?: string;
  maxTokens?: number;
  temperature?: number;
  streamResponse?: boolean;
  saveHistory?: boolean;
  historyLimit?: number;
  debug?: boolean;
}

export class ConfigManager {
  private conf: Conf<ChatInstanceConfig>;

  constructor() {
    this.conf = new Conf<ChatInstanceConfig>({
      configName: 'config',
      projectName: 'chatinstance',
      defaults: {
        apiUrl: 'https://api.chatinstance.com/v1',
        defaultProvider: 'chatgpt',
        defaultModel: 'gpt-4o',
        maxTokens: 2000,
        temperature: 0.7,
        streamResponse: false,
        saveHistory: true,
        historyLimit: 100,
        debug: false
      }
    });
  }

  // Get configuration value
  get<K extends keyof ChatInstanceConfig>(key: K): ChatInstanceConfig[K];
  get<K extends keyof ChatInstanceConfig>(key: K, defaultValue: ChatInstanceConfig[K]): ChatInstanceConfig[K];
  get<K extends keyof ChatInstanceConfig>(key: K, defaultValue?: ChatInstanceConfig[K]): ChatInstanceConfig[K] {
    const value = this.conf.get(key as string);
    return value !== undefined ? value as ChatInstanceConfig[K] : defaultValue as ChatInstanceConfig[K];
  }

  // Set configuration value
  set<K extends keyof ChatInstanceConfig>(key: K, value: ChatInstanceConfig[K]): void {
    this.conf.set(key as string, value);
  }

  // Delete configuration value
  delete<K extends keyof ChatInstanceConfig>(key: K): void {
    this.conf.delete(key as string);
  }

  // Check if key exists
  has<K extends keyof ChatInstanceConfig>(key: K): boolean {
    return this.conf.has(key as string);
  }

  // Get all configuration
  getAll(): ChatInstanceConfig {
    return this.conf.store as ChatInstanceConfig;
  }

  // Reset to defaults
  reset(): void {
    this.conf.clear();
  }

  // Get config file path
  getConfigPath(): string {
    return this.conf.path;
  }

  // Get configuration for display (hide sensitive values)
  getDisplayConfig(): Record<string, any> {
    const config = this.getAll();
    return {
      ...config,
      apiKey: config.apiKey ? '***' + config.apiKey.slice(-4) : undefined
    };
  }

  // Validate API key format
  validateApiKey(apiKey: string): boolean {
    return /^ci_[a-zA-Z0-9]{20,}$/.test(apiKey);
  }

  // Get history directory
  getHistoryDir(): string {
    return path.join(os.homedir(), '.config', 'chatinstance', 'history');
  }

  // Get prompts directory
  getPromptsDir(): string {
    return path.join(os.homedir(), '.config', 'chatinstance', 'prompts');
  }
}