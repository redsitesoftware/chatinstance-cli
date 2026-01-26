import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { ConfigManager } from '../utils/config.js';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  provider?: string;
  model?: string;
  messages: ChatMessage[];
  stream?: boolean;
  temperature?: number;
  max_tokens?: number;
  system_prompt?: string;
}

export interface ChatResponse {
  id: string;
  provider: string;
  model: string;
  created: number;
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface Instance {
  id: string;
  name: string;
  description: string;
  provider: string;
  model: string;
  status: string;
  settings: {
    temperature: number;
    max_tokens: number;
    system_prompt?: string;
  };
  created_at: string;
  updated_at: string;
  usage: {
    total_requests: number;
    total_tokens: number;
    last_used?: string;
  };
}

export interface Model {
  id: string;
  name: string;
  provider: string;
  description: string;
  context_length: number;
  capabilities: string[];
  pricing: {
    input: number;
    output: number;
  };
}

export interface User {
  id: string;
  email: string;
  name: string;
  apiKeys: Array<{
    id: string;
    name: string;
    created_at: string;
    last_used?: string;
    permissions: string[];
  }>;
}

export class ChatInstanceAPI {
  private client: AxiosInstance;
  private config: ConfigManager;

  constructor(config: ConfigManager) {
    this.config = config;
    
    const apiUrl = config.get('apiUrl', 'https://api.chatinstance.com/v1');
    const apiKey = config.get('apiKey');

    this.client = axios.create({
      baseURL: apiUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'ChatInstance CLI v1.0.0',
        ...(apiKey && { Authorization: `Bearer ${apiKey}` })
      }
    });

    // Request interceptor for debugging
    this.client.interceptors.request.use(
      (config) => {
        if (this.config.get('debug')) {
          console.log('API Request:', config.method?.toUpperCase(), config.url);
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          throw new Error('Authentication failed. Please check your API key.');
        } else if (error.response?.status === 429) {
          throw new Error('Rate limit exceeded. Please try again later.');
        } else if (error.response?.data?.message) {
          throw new Error(error.response.data.message);
        } else if (error.code === 'ECONNREFUSED') {
          throw new Error('Unable to connect to ChatInstance API. Please check your internet connection.');
        }
        throw error;
      }
    );
  }

  // Update API key
  setApiKey(apiKey: string): void {
    this.client.defaults.headers.Authorization = `Bearer ${apiKey}`;
  }

  // Chat completion
  async chat(request: ChatRequest): Promise<ChatResponse> {
    const response: AxiosResponse<ChatResponse> = await this.client.post('/chat', request);
    return response.data;
  }

  // Stream chat completion
  async streamChat(request: ChatRequest, onChunk: (chunk: string) => void): Promise<void> {
    const response = await this.client.post('/chat', 
      { ...request, stream: true },
      {
        responseType: 'stream',
        headers: {
          Accept: 'text/event-stream'
        }
      }
    );

    return new Promise((resolve, reject) => {
      response.data.on('data', (chunk: Buffer) => {
        const lines = chunk.toString().split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data === '[DONE]') {
              resolve();
              return;
            }
            try {
              const parsed = JSON.parse(data);
              if (parsed.choices?.[0]?.delta?.content) {
                onChunk(parsed.choices[0].delta.content);
              }
            } catch (e) {
              // Ignore malformed chunks
            }
          }
        }
      });

      response.data.on('error', (error: Error) => {
        reject(error);
      });

      response.data.on('end', () => {
        resolve();
      });
    });
  }

  // Get current user
  async getCurrentUser(): Promise<User> {
    const response: AxiosResponse<User> = await this.client.get('/auth/me');
    return response.data;
  }

  // Get instances
  async getInstances(): Promise<{ data: Instance[] }> {
    const response = await this.client.get('/instances');
    return response.data;
  }

  // Create instance
  async createInstance(data: {
    name: string;
    description?: string;
    provider?: string;
    model?: string;
    settings?: any;
  }): Promise<Instance> {
    const response: AxiosResponse<Instance> = await this.client.post('/instances', data);
    return response.data;
  }

  // Get instance
  async getInstance(id: string): Promise<Instance> {
    const response: AxiosResponse<Instance> = await this.client.get(`/instances/${id}`);
    return response.data;
  }

  // Delete instance
  async deleteInstance(id: string): Promise<void> {
    await this.client.delete(`/instances/${id}`);
  }

  // Get models
  async getModels(provider?: string): Promise<{ data: Model[] }> {
    const url = provider ? `/models?provider=${provider}` : '/models';
    const response = await this.client.get(url);
    return response.data;
  }

  // Get specific model
  async getModel(id: string): Promise<Model> {
    const response: AxiosResponse<Model> = await this.client.get(`/models/${id}`);
    return response.data;
  }

  // Get supported providers
  async getProviders(): Promise<{ providers: string[]; count: number; default: string }> {
    const response = await this.client.get('/chat/providers');
    return response.data;
  }

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string; version: string }> {
    const response = await this.client.get('/health');
    return response.data;
  }
}