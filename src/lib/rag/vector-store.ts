/**
 * In-memory vector store implementation
 * Uses cosine similarity for document retrieval
 * For production, consider integrating with Pinecone, Weaviate, or similar
 */

import { DocumentChunk, VectorStore } from './types';

// Simple embedding function using character-based features
// In production, use proper embeddings from OpenAI, Cohere, or Hugging Face
function createSimpleEmbedding(text: string): number[] {
  // Create a simple embedding based on character frequencies and patterns
  const embedding = new Array(384).fill(0); // 384-dimensional vector
  
  // Character frequency features
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789 ';
  for (let i = 0; i < chars.length; i++) {
    const char = chars[i];
    const frequency = (text.toLowerCase().split(char).length - 1) / text.length;
    embedding[i] = frequency;
  }
  
  // N-gram features
  const bigrams = new Map<string, number>();
  for (let i = 0; i < text.length - 1; i++) {
    const bigram = text.substr(i, 2).toLowerCase();
    bigrams.set(bigram, (bigrams.get(bigram) || 0) + 1);
  }
  
  let idx = chars.length;
  for (const [bigram, count] of Array.from(bigrams.entries()).slice(0, 100)) {
    if (idx < embedding.length) {
      embedding[idx] = count / text.length;
      idx++;
    }
  }
  
  // Word length features
  const words = text.split(/\s+/);
  const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length || 0;
  embedding[300] = avgWordLength / 20; // Normalize
  embedding[301] = words.length / text.length; // Word density
  
  // Punctuation features
  const punctuation = '.!?,:;-()[]{}';
  for (let i = 0; i < punctuation.length && 302 + i < embedding.length; i++) {
    const char = punctuation[i];
    embedding[302 + i] = (text.split(char).length - 1) / text.length;
  }
  
  return embedding;
}

function cosineSimilarity(a: number[], b: number[]): number {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  
  if (magnitudeA === 0 || magnitudeB === 0) return 0;
  return dotProduct / (magnitudeA * magnitudeB);
}

export class InMemoryVectorStore implements VectorStore {
  private documents: Map<string, DocumentChunk & { embedding: number[] }> = new Map();

  /**
   * Add document chunks to the vector store
   */
  async addDocuments(chunks: DocumentChunk[]): Promise<void> {
    for (const chunk of chunks) {
      try {
        const embedding = createSimpleEmbedding(chunk.content);
        this.documents.set(chunk.id, {
          ...chunk,
          embedding,
        });
      } catch (error) {
        console.error(`Error adding chunk ${chunk.id}:`, error);
        throw new Error(`Failed to add chunk: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }

  /**
   * Perform similarity search to find relevant chunks
   */
  async similaritySearch(query: string, k = 4): Promise<DocumentChunk[]> {
    if (this.documents.size === 0) {
      return [];
    }

    try {
      const queryEmbedding = createSimpleEmbedding(query);
      
      // Calculate similarities
      const similarities: Array<{ chunk: DocumentChunk; similarity: number }> = [];
      
      for (const doc of this.documents.values()) {
        const similarity = cosineSimilarity(queryEmbedding, doc.embedding);
        similarities.push({
          chunk: {
            id: doc.id,
            content: doc.content,
            metadata: doc.metadata,
          },
          similarity,
        });
      }

      // Sort by similarity and return top k
      return similarities
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, k)
        .filter(item => item.similarity > 0.1) // Filter out very low similarity results
        .map(item => item.chunk);
    } catch (error) {
      console.error('Error performing similarity search:', error);
      throw new Error(`Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete documents by document ID
   */
  async delete(documentId: string): Promise<void> {
    const keysToDelete = Array.from(this.documents.keys()).filter(key => 
      key.startsWith(documentId)
    );
    
    for (const key of keysToDelete) {
      this.documents.delete(key);
    }
  }

  /**
   * Get all stored document chunks
   */
  getAllChunks(): DocumentChunk[] {
    return Array.from(this.documents.values()).map(doc => ({
      id: doc.id,
      content: doc.content,
      metadata: doc.metadata,
    }));
  }

  /**
   * Get statistics about the vector store
   */
  getStats() {
    const chunks = this.getAllChunks();
    const sources = new Set(chunks.map(chunk => chunk.metadata.source));
    
    return {
      totalChunks: chunks.length,
      totalDocuments: sources.size,
      avgChunkLength: chunks.reduce((sum, chunk) => sum + chunk.content.length, 0) / chunks.length || 0,
      sources: Array.from(sources),
    };
  }

  /**
   * Clear all documents from the store
   */
  clear(): void {
    this.documents.clear();
  }

  /**
   * Check if the store contains any documents
   */
  isEmpty(): boolean {
    return this.documents.size === 0;
  }

  /**
   * Get document chunks by source
   */
  getChunksBySource(source: string): DocumentChunk[] {
    return this.getAllChunks().filter(chunk => chunk.metadata.source === source);
  }

  /**
   * Advanced search with additional filters
   */
  async advancedSearch(
    query: string,
    options: {
      k?: number;
      minSimilarity?: number;
      sourceFilter?: string[];
      maxChunkLength?: number;
    } = {}
  ): Promise<DocumentChunk[]> {
    const {
      k = 4,
      minSimilarity = 0.1,
      sourceFilter,
      maxChunkLength,
    } = options;

    let results = await this.similaritySearch(query, k * 2); // Get more results to filter

    // Apply filters
    if (sourceFilter && sourceFilter.length > 0) {
      results = results.filter(chunk => sourceFilter.includes(chunk.metadata.source));
    }

    if (maxChunkLength) {
      results = results.filter(chunk => chunk.content.length <= maxChunkLength);
    }

    return results.slice(0, k);
  }
}

/**
 * Factory function to create a vector store instance
 */
export function createVectorStore(): InMemoryVectorStore {
  return new InMemoryVectorStore();
}