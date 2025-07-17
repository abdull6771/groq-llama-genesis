/**
 * Main RAG Pipeline - Orchestrates retrieval and generation
 * Provides a clean interface for the entire RAG workflow
 */

import { Document, DocumentChunk, RAGQuery, RAGConfig, LLMProvider, VectorStore } from './types';
import { GroqLLMProvider } from './llm-provider';
import { InMemoryVectorStore } from './vector-store';
import { DocumentProcessor } from './document-processor';
import { RAG_PROMPT_TEMPLATE, formatContextChunks, createConversationPrompt } from './prompts';
import { DEFAULT_RAG_CONFIG, validateConfig } from './config';

export class RAGPipeline {
  private llmProvider: LLMProvider;
  private vectorStore: VectorStore;
  private documentProcessor: DocumentProcessor;
  private config: RAGConfig;
  private conversationHistory: Array<{ question: string; answer: string }> = [];

  constructor(config: Partial<RAGConfig>) {
    // Validate and merge config
    const errors = validateConfig(config);
    if (errors.length > 0) {
      throw new Error(`Configuration errors: ${errors.join(', ')}`);
    }

    this.config = { ...DEFAULT_RAG_CONFIG, ...config } as RAGConfig;
    
    // Initialize components
    this.llmProvider = new GroqLLMProvider(this.config);
    this.vectorStore = new InMemoryVectorStore();
    this.documentProcessor = new DocumentProcessor({
      chunkSize: this.config.chunkSize,
      chunkOverlap: this.config.chunkOverlap,
    });
  }

  /**
   * Add a document to the knowledge base
   */
  async addDocument(file: File): Promise<Document> {
    try {
      // Process the document
      const document = await this.documentProcessor.processDocument(file);
      
      // Add chunks to vector store
      if (document.chunks) {
        await this.vectorStore.addDocuments(document.chunks);
      }

      return document;
    } catch (error) {
      console.error('Error adding document:', error);
      throw new Error(`Failed to add document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Remove a document from the knowledge base
   */
  async removeDocument(documentId: string): Promise<void> {
    try {
      await this.vectorStore.delete(documentId);
    } catch (error) {
      console.error('Error removing document:', error);
      throw new Error(`Failed to remove document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Query the RAG system and get a complete answer
   */
  async query(question: string): Promise<RAGQuery> {
    const queryId = `query_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      // Step 1: Retrieve relevant context
      const relevantChunks = await this.retrieveContext(question);
      
      if (relevantChunks.length === 0) {
        return {
          id: queryId,
          question,
          context: [],
          answer: "I don't have any relevant information in my knowledge base to answer your question. Please try uploading relevant documents first.",
          timestamp: new Date(),
          sources: [],
        };
      }

      // Step 2: Format context
      const formattedContext = formatContextChunks(relevantChunks);
      
      // Step 3: Create prompt with conversation history
      const prompt = await createConversationPrompt(question, formattedContext, this.conversationHistory);
      
      // Step 4: Generate answer
      const answer = await this.llmProvider.generate(prompt);
      
      // Step 5: Create query result
      const result: RAGQuery = {
        id: queryId,
        question,
        context: relevantChunks.map(chunk => chunk.content),
        answer,
        timestamp: new Date(),
        sources: [...new Set(relevantChunks.map(chunk => chunk.metadata.source))],
      };

      // Add to conversation history
      this.conversationHistory.push({ question, answer });
      
      // Keep only last 5 exchanges
      if (this.conversationHistory.length > 5) {
        this.conversationHistory = this.conversationHistory.slice(-5);
      }

      return result;
    } catch (error) {
      console.error('Error processing query:', error);
      throw new Error(`Query failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Stream a response to a query for real-time display
   */
  async *streamQuery(question: string): AsyncGenerator<{ type: 'context' | 'answer', content: string }, RAGQuery, unknown> {
    const queryId = `query_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      // Step 1: Retrieve relevant context
      yield { type: 'context', content: 'Searching knowledge base...' };
      const relevantChunks = await this.retrieveContext(question);
      
      if (relevantChunks.length === 0) {
        const result: RAGQuery = {
          id: queryId,
          question,
          context: [],
          answer: "I don't have any relevant information in my knowledge base to answer your question.",
          timestamp: new Date(),
          sources: [],
        };
        yield { type: 'answer', content: result.answer };
        return result;
      }

      yield { type: 'context', content: `Found ${relevantChunks.length} relevant document(s). Generating response...` };

      // Step 2: Format context and create prompt
      const formattedContext = formatContextChunks(relevantChunks);
      const prompt = await createConversationPrompt(question, formattedContext, this.conversationHistory);
      
      // Step 3: Stream the answer
      let fullAnswer = '';
      for await (const chunk of this.llmProvider.stream(prompt)) {
        fullAnswer += chunk;
        yield { type: 'answer', content: chunk };
      }

      // Step 4: Create final result
      const result: RAGQuery = {
        id: queryId,
        question,
        context: relevantChunks.map(chunk => chunk.content),
        answer: fullAnswer,
        timestamp: new Date(),
        sources: [...new Set(relevantChunks.map(chunk => chunk.metadata.source))],
      };

      // Add to conversation history
      this.conversationHistory.push({ question, answer: fullAnswer });
      if (this.conversationHistory.length > 5) {
        this.conversationHistory = this.conversationHistory.slice(-5);
      }

      return result;
    } catch (error) {
      console.error('Error streaming query:', error);
      throw new Error(`Stream query failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Retrieve relevant context for a question
   */
  private async retrieveContext(question: string): Promise<DocumentChunk[]> {
    try {
      return await this.vectorStore.similaritySearch(question, this.config.topK);
    } catch (error) {
      console.error('Error retrieving context:', error);
      return [];
    }
  }

  /**
   * Get knowledge base statistics
   */
  getStats() {
    return {
      documents: this.vectorStore.getStats?.() || { totalChunks: 0, totalDocuments: 0 },
      conversations: this.conversationHistory.length,
      config: this.config,
    };
  }

  /**
   * Clear conversation history
   */
  clearHistory(): void {
    this.conversationHistory = [];
  }

  /**
   * Clear entire knowledge base
   */
  clearKnowledgeBase(): void {
    this.vectorStore.clear?.();
    this.conversationHistory = [];
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<RAGConfig>): void {
    const errors = validateConfig({ ...this.config, ...newConfig });
    if (errors.length > 0) {
      throw new Error(`Configuration errors: ${errors.join(', ')}`);
    }

    this.config = { ...this.config, ...newConfig };
    
    // Update components
    this.llmProvider.updateConfig?.(this.config);
    this.documentProcessor.updateConfig({
      chunkSize: this.config.chunkSize,
      chunkOverlap: this.config.chunkOverlap,
    });
  }

  /**
   * Test the RAG pipeline
   */
  async testPipeline(): Promise<{ success: boolean; error?: string }> {
    try {
      // Test LLM connection
      const llmTest = await this.llmProvider.testConnection?.();
      if (llmTest === false) {
        return { success: false, error: 'LLM connection failed' };
      }

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): RAGConfig {
    return { ...this.config };
  }

  /**
   * Get conversation history
   */
  getConversationHistory(): Array<{ question: string; answer: string }> {
    return [...this.conversationHistory];
  }
}

/**
 * Factory function to create a RAG pipeline
 */
export function createRAGPipeline(config: Partial<RAGConfig>): RAGPipeline {
  return new RAGPipeline(config);
}

/**
 * Utility function to validate RAG pipeline configuration
 */
export function validateRAGConfig(config: Partial<RAGConfig>): { valid: boolean; errors: string[] } {
  const errors = validateConfig(config);
  return {
    valid: errors.length === 0,
    errors,
  };
}
