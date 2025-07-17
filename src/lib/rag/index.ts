/**
 * Main RAG module exports
 * Provides a clean public API for the RAG system
 */

// Core exports
export { RAGPipeline, createRAGPipeline, validateRAGConfig } from './rag-pipeline';
export { GroqLLMProvider, createLLMProvider } from './llm-provider';
export { InMemoryVectorStore, createVectorStore } from './vector-store';
export { DocumentProcessor } from './document-processor';

// Configuration and types
export * from './types';
export * from './config';

// Prompt templates
export * from './prompts';

// Utility functions
export { estimateReadingTime, getDocumentStats } from './document-processor';

/**
 * Quick start function to create a RAG system with minimal configuration
 */
export async function createQuickRAGSystem(groqApiKey: string) {
  if (!groqApiKey) {
    throw new Error('Groq API key is required');
  }

  const { createRAGPipeline } = await import('./rag-pipeline');
  const pipeline = createRAGPipeline({
    groqApiKey,
    model: 'llama-3.1-8b-instant',
    temperature: 0.1,
    maxTokens: 1024,
    topK: 4,
    chunkSize: 1000,
    chunkOverlap: 200,
  });

  // Test the connection
  const testResult = await pipeline.testPipeline();
  if (!testResult.success) {
    throw new Error(`RAG system initialization failed: ${testResult.error}`);
  }

  return pipeline;
}