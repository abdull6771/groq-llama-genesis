/**
 * Core types for the RAG application
 * Provides type safety and clear contracts between components
 */

export interface Document {
  id: string;
  name: string;
  content: string;
  metadata: {
    type: 'pdf' | 'txt' | 'docx';
    size: number;
    uploadedAt: Date;
    processedAt?: Date;
  };
  chunks?: DocumentChunk[];
  status: 'uploading' | 'processing' | 'ready' | 'error';
}

export interface DocumentChunk {
  id: string;
  content: string;
  metadata: {
    source: string;
    page?: number;
    startIndex: number;
    endIndex: number;
  };
  embedding?: number[];
}

export interface RAGQuery {
  id: string;
  question: string;
  context: string[];
  answer?: string;
  timestamp: Date;
  sources: string[];
}

export interface RAGConfig {
  groqApiKey: string;
  model: 'mixtral-8x7b-32768' | 'llama2-70b-4096' | 'gemma-7b-it';
  temperature: number;
  maxTokens: number;
  topK: number;
  chunkSize: number;
  chunkOverlap: number;
}

export interface VectorStore {
  addDocuments(chunks: DocumentChunk[]): Promise<void>;
  similaritySearch(query: string, k?: number): Promise<DocumentChunk[]>;
  delete(documentId: string): Promise<void>;
  getStats?(): { totalChunks: number; totalDocuments: number; [key: string]: any };
  clear?(): void;
}

export interface Retriever {
  retrieve(query: string): Promise<DocumentChunk[]>;
}

export interface LLMProvider {
  generate(prompt: string): Promise<string>;
  stream(prompt: string): AsyncGenerator<string, void, unknown>;
  updateConfig?(config: RAGConfig): void;
  testConnection?(): Promise<boolean>;
}