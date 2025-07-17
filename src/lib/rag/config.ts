/**
 * Configuration management for the RAG application
 * Centralizes all configuration options with sensible defaults
 */

import { RAGConfig } from './types';

export const DEFAULT_RAG_CONFIG: Omit<RAGConfig, 'groqApiKey'> = {
  model: 'llama-3.1-8b-instant',
  temperature: 0.1,
  maxTokens: 1024,
  topK: 4,
  chunkSize: 1000,
  chunkOverlap: 200,
};

export const SUPPORTED_FILE_TYPES = {
  'application/pdf': 'pdf',
  'text/plain': 'txt',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
} as const;

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const GROQ_MODELS = [
  {
    id: 'llama-3.1-8b-instant',
    name: 'Llama 3.1 8B',
    description: 'Fast and efficient for quick responses',
    contextLength: 128000,
  },
  {
    id: 'mixtral-8x7b-32768',
    name: 'Mixtral 8x7B',
    description: 'Best overall performance for most tasks',
    contextLength: 32768,
  },
  {
    id: 'llama-3.1-70b-versatile',
    name: 'Llama 3.1 70B',
    description: 'Excellent reasoning and versatile performance',
    contextLength: 128000,
  },
] as const;

export function validateConfig(config: Partial<RAGConfig>): string[] {
  const errors: string[] = [];

  if (!config.groqApiKey?.trim()) {
    errors.push('Groq API key is required');
  }

  if (config.temperature && (config.temperature < 0 || config.temperature > 1)) {
    errors.push('Temperature must be between 0 and 1');
  }

  if (config.maxTokens && config.maxTokens < 1) {
    errors.push('Max tokens must be greater than 0');
  }

  if (config.topK && config.topK < 1) {
    errors.push('Top K must be greater than 0');
  }

  if (config.chunkSize && config.chunkSize < 100) {
    errors.push('Chunk size must be at least 100 characters');
  }

  return errors;
}