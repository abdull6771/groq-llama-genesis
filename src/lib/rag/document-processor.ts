/**
 * Document processing utilities
 * Handles file parsing and text extraction with robust error handling
 */

import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { Document, DocumentChunk, RAGConfig } from './types';
import { SUPPORTED_FILE_TYPES } from './config';

// Import document parsers - browser compatible versions
import { extractText, getDocumentProxy } from 'unpdf';
import mammoth from 'mammoth';

export class DocumentProcessor {
  private textSplitter: RecursiveCharacterTextSplitter;

  constructor(config: Pick<RAGConfig, 'chunkSize' | 'chunkOverlap'>) {
    this.textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: config.chunkSize,
      chunkOverlap: config.chunkOverlap,
      separators: ['\n\n', '\n', '. ', '! ', '? ', ' ', ''],
    });
  }

  /**
   * Extract text content from uploaded file
   */
  async extractText(file: File): Promise<string> {
    const mimeType = file.type;
    
    if (!Object.keys(SUPPORTED_FILE_TYPES).includes(mimeType)) {
      throw new Error(`Unsupported file type: ${mimeType}`);
    }

    try {
      switch (mimeType) {
        case 'application/pdf':
          return await this.extractFromPDF(file);
        case 'text/plain':
          return await this.extractFromText(file);
        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
          return await this.extractFromDocx(file);
        default:
          throw new Error(`Unsupported file type: ${mimeType}`);
      }
    } catch (error) {
      console.error('Error extracting text from file:', error);
      throw new Error(`Failed to extract text: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extract text from PDF file using unpdf (browser-compatible)
   */
  private async extractFromPDF(file: File): Promise<string> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await getDocumentProxy(new Uint8Array(arrayBuffer));
      const { text } = await extractText(pdf, { mergePages: true });
      return text;
    } catch (error) {
      throw new Error(`Failed to parse PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extract text from plain text file
   */
  private async extractFromText(file: File): Promise<string> {
    return await file.text();
  }

  /**
   * Extract text from DOCX file
   */
  private async extractFromDocx(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    
    try {
      const result = await mammoth.extractRawText({ arrayBuffer });
      return result.value;
    } catch (error) {
      throw new Error(`Failed to parse DOCX: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Split document text into chunks
   */
  async createChunks(document: Document): Promise<DocumentChunk[]> {
    if (!document.content) {
      throw new Error('Document content is empty');
    }

    try {
      const texts = await this.textSplitter.splitText(document.content);
      
      return texts.map((text, index) => ({
        id: `${document.id}_chunk_${index}`,
        content: text.trim(),
        metadata: {
          source: document.name,
          startIndex: document.content.indexOf(text),
          endIndex: document.content.indexOf(text) + text.length,
        },
      }));
    } catch (error) {
      console.error('Error creating chunks:', error);
      throw new Error(`Failed to create chunks: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Process a complete document from file to chunks
   */
  async processDocument(file: File): Promise<Document> {
    // Validate file
    this.validateFile(file);

    // Create document object
    const document: Document = {
      id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: file.name,
      content: '',
      metadata: {
        type: this.getFileType(file.type),
        size: file.size,
        uploadedAt: new Date(),
      },
      status: 'processing',
    };

    try {
      // Extract text content
      document.content = await this.extractText(file);
      
      if (!document.content.trim()) {
        throw new Error('No text content found in document');
      }

      // Create chunks
      document.chunks = await this.createChunks(document);
      
      // Update status and metadata
      document.status = 'ready';
      document.metadata.processedAt = new Date();

      return document;
    } catch (error) {
      document.status = 'error';
      console.error('Error processing document:', error);
      throw error;
    }
  }

  /**
   * Validate uploaded file
   */
  private validateFile(file: File): void {
    // Check file type
    if (!Object.keys(SUPPORTED_FILE_TYPES).includes(file.type)) {
      throw new Error(`Unsupported file type: ${file.type}. Supported types: PDF, TXT, DOCX`);
    }

    // Check file size (10MB limit)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new Error(`File too large. Maximum size is ${maxSize / (1024 * 1024)}MB`);
    }

    // Check if file is empty
    if (file.size === 0) {
      throw new Error('File is empty');
    }
  }

  /**
   * Get file type from MIME type
   */
  private getFileType(mimeType: string): 'pdf' | 'txt' | 'docx' {
    const typeMap = SUPPORTED_FILE_TYPES as Record<string, 'pdf' | 'txt' | 'docx'>;
    return typeMap[mimeType] || 'txt';
  }

  /**
   * Update text splitter configuration
   */
  updateConfig(config: Pick<RAGConfig, 'chunkSize' | 'chunkOverlap'>): void {
    this.textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: config.chunkSize,
      chunkOverlap: config.chunkOverlap,
      separators: ['\n\n', '\n', '. ', '! ', '? ', ' ', ''],
    });
  }
}

/**
 * Utility function to estimate reading time for document
 */
export function estimateReadingTime(text: string): number {
  const wordsPerMinute = 200;
  const wordCount = text.split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
}

/**
 * Utility function to get document statistics
 */
export function getDocumentStats(document: Document) {
  return {
    characterCount: document.content.length,
    wordCount: document.content.split(/\s+/).length,
    chunkCount: document.chunks?.length || 0,
    readingTime: estimateReadingTime(document.content),
  };
}