/**
 * React hook for RAG functionality
 * Provides state management and actions for the RAG pipeline
 */

import { useState, useCallback, useRef } from 'react';
import { RAGPipeline, Document, RAGQuery, RAGConfig } from '@/lib/rag';
import { toast } from '@/hooks/use-toast';

interface RAGState {
  documents: Document[];
  queries: RAGQuery[];
  isProcessing: boolean;
  isQuerying: boolean;
  config: Partial<RAGConfig>;
  pipeline: RAGPipeline | null;
}

export function useRAG() {
  const [state, setState] = useState<RAGState>({
    documents: [],
    queries: [],
    isProcessing: false,
    isQuerying: false,
    config: {},
    pipeline: null,
  });

  const pipelineRef = useRef<RAGPipeline | null>(null);

  // Initialize RAG pipeline
  const initializePipeline = useCallback(async (config: RAGConfig) => {
    try {
      setState(prev => ({ ...prev, isProcessing: true }));
      
      const { createRAGPipeline } = await import('@/lib/rag');
      const pipeline = createRAGPipeline(config);
      
      // Test the pipeline
      const testResult = await pipeline.testPipeline();
      if (!testResult.success) {
        throw new Error(testResult.error || 'Pipeline initialization failed');
      }

      pipelineRef.current = pipeline;
      setState(prev => ({
        ...prev,
        pipeline,
        config,
        isProcessing: false,
      }));

      toast({
        title: 'RAG System Initialized',
        description: 'Successfully connected to Groq and initialized the pipeline.',
      });

      return pipeline;
    } catch (error) {
      setState(prev => ({ ...prev, isProcessing: false }));
      
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast({
        title: 'Initialization Failed',
        description: message,
        variant: 'destructive',
      });
      
      throw error;
    }
  }, []);

  // Add document to knowledge base
  const addDocument = useCallback(async (file: File) => {
    if (!pipelineRef.current) {
      throw new Error('Pipeline not initialized');
    }

    try {
      setState(prev => ({ ...prev, isProcessing: true }));
      
      const document = await pipelineRef.current.addDocument(file);
      
      setState(prev => ({
        ...prev,
        documents: [...prev.documents, document],
        isProcessing: false,
      }));

      toast({
        title: 'Document Added',
        description: `Successfully processed "${file.name}"`,
      });

      return document;
    } catch (error) {
      setState(prev => ({ ...prev, isProcessing: false }));
      
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast({
        title: 'Document Processing Failed',
        description: message,
        variant: 'destructive',
      });
      
      throw error;
    }
  }, []);

  // Remove document from knowledge base
  const removeDocument = useCallback(async (documentId: string) => {
    if (!pipelineRef.current) {
      return;
    }

    try {
      await pipelineRef.current.removeDocument(documentId);
      
      setState(prev => ({
        ...prev,
        documents: prev.documents.filter(doc => doc.id !== documentId),
      }));

      toast({
        title: 'Document Removed',
        description: 'Document successfully removed from knowledge base.',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast({
        title: 'Removal Failed',
        description: message,
        variant: 'destructive',
      });
    }
  }, []);

  // Query the RAG system
  const query = useCallback(async (question: string) => {
    if (!pipelineRef.current) {
      throw new Error('Pipeline not initialized');
    }

    try {
      setState(prev => ({ ...prev, isQuerying: true }));
      
      const result = await pipelineRef.current.query(question);
      
      setState(prev => ({
        ...prev,
        queries: [result, ...prev.queries],
        isQuerying: false,
      }));

      return result;
    } catch (error) {
      setState(prev => ({ ...prev, isQuerying: false }));
      
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast({
        title: 'Query Failed',
        description: message,
        variant: 'destructive',
      });
      
      throw error;
    }
  }, []);

  // Stream query response
  const streamQuery = useCallback(async function* (question: string) {
    if (!pipelineRef.current) {
      throw new Error('Pipeline not initialized');
    }

    try {
      setState(prev => ({ ...prev, isQuerying: true }));
      
      const generator = pipelineRef.current.streamQuery(question);
      let result: RAGQuery | null = null;
      
      for await (const chunk of generator) {
        if (chunk.type === 'answer') {
          yield chunk.content;
        }
      }

      // The generator should return the final result when done
      // For now, we'll create a basic result structure
      result = {
        id: `query_${Date.now()}`,
        question,
        context: [],
        answer: '',
        timestamp: new Date(),
        sources: [],
      };
      
      if (result) {
        setState(prev => ({
          ...prev,
          queries: [result!, ...prev.queries],
          isQuerying: false,
        }));
      }

      return result;
    } catch (error) {
      setState(prev => ({ ...prev, isQuerying: false }));
      
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast({
        title: 'Stream Query Failed',
        description: message,
        variant: 'destructive',
      });
      
      throw error;
    }
  }, []);

  // Clear conversation history
  const clearHistory = useCallback(() => {
    if (pipelineRef.current) {
      pipelineRef.current.clearHistory();
    }
    setState(prev => ({ ...prev, queries: [] }));
  }, []);

  // Clear knowledge base
  const clearKnowledgeBase = useCallback(() => {
    if (pipelineRef.current) {
      pipelineRef.current.clearKnowledgeBase();
    }
    setState(prev => ({ ...prev, documents: [], queries: [] }));
    
    toast({
      title: 'Knowledge Base Cleared',
      description: 'All documents and conversation history have been removed.',
    });
  }, []);

  // Update configuration
  const updateConfig = useCallback((newConfig: Partial<RAGConfig>) => {
    if (pipelineRef.current) {
      try {
        pipelineRef.current.updateConfig(newConfig);
        setState(prev => ({ ...prev, config: { ...prev.config, ...newConfig } }));
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        toast({
          title: 'Configuration Update Failed',
          description: message,
          variant: 'destructive',
        });
      }
    }
  }, []);

  // Get statistics
  const getStats = useCallback(() => {
    if (!pipelineRef.current) {
      return null;
    }
    return pipelineRef.current.getStats();
  }, []);

  return {
    // State
    ...state,
    
    // Actions
    initializePipeline,
    addDocument,
    removeDocument,
    query,
    streamQuery,
    clearHistory,
    clearKnowledgeBase,
    updateConfig,
    getStats,
    
    // Computed values
    isInitialized: !!state.pipeline,
    hasDocuments: state.documents.length > 0,
    hasQueries: state.queries.length > 0,
  };
}