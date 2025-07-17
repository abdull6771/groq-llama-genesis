/**
 * LLM Provider implementation using Groq
 * Provides high-performance inference with streaming support
 */

import { ChatGroq } from '@langchain/groq';
import { LLMProvider, RAGConfig } from './types';

export class GroqLLMProvider implements LLMProvider {
  private llm: ChatGroq;
  private config: RAGConfig;

  constructor(config: RAGConfig) {
    this.config = config;
    this.llm = new ChatGroq({
      apiKey: config.groqApiKey,
      model: config.model,
      temperature: config.temperature,
      maxTokens: config.maxTokens,
    });
  }

  /**
   * Generate a complete response from the LLM
   */
  async generate(prompt: string): Promise<string> {
    try {
      const response = await this.llm.invoke([
        {
          role: 'user',
          content: prompt,
        },
      ]);

      return response.content as string;
    } catch (error) {
      console.error('Error generating response:', error);
      throw new Error(`Failed to generate response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Stream response from the LLM for real-time display
   */
  async *stream(prompt: string): AsyncGenerator<string, void, unknown> {
    try {
      const stream = await this.llm.stream([
        {
          role: 'user',
          content: prompt,
        },
      ]);

      for await (const chunk of stream) {
        if (chunk.content) {
          yield chunk.content as string;
        }
      }
    } catch (error) {
      console.error('Error streaming response:', error);
      throw new Error(`Failed to stream response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<RAGConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.llm = new ChatGroq({
      apiKey: this.config.groqApiKey,
      model: this.config.model,
      temperature: this.config.temperature,
      maxTokens: this.config.maxTokens,
    });
  }

  /**
   * Get current configuration
   */
  getConfig(): RAGConfig {
    return { ...this.config };
  }

  /**
   * Test the LLM connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.generate('Hello! Please respond with just "OK" to confirm the connection.');
      return response.toLowerCase().includes('ok');
    } catch {
      return false;
    }
  }

  /**
   * Get available models from Groq
   */
  static getAvailableModels(): Array<{ id: string; name: string; description: string }> {
    return [
      {
        id: 'mixtral-8x7b-32768',
        name: 'Mixtral 8x7B',
        description: 'Best overall performance for most RAG tasks',
      },
      {
        id: 'llama-3.1-70b-versatile',
        name: 'Llama 3.1 70B',
        description: 'Excellent reasoning and versatile performance',
      },
      {
        id: 'llama-3.1-8b-instant',
        name: 'Llama 3.1 8B',
        description: 'Fast and efficient for quick responses',
      },
    ];
  }
}

/**
 * Factory function to create LLM provider instances
 */
export function createLLMProvider(config: RAGConfig): GroqLLMProvider {
  return new GroqLLMProvider(config);
}

/**
 * Utility function to validate Groq API key format
 */
export function validateGroqApiKey(apiKey: string): boolean {
  // Basic validation - Groq API keys typically start with 'gsk_'
  return apiKey.startsWith('gsk_') && apiKey.length > 20;
}