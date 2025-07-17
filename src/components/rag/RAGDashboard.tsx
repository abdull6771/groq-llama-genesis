/**
 * Main RAG Dashboard component
 * Orchestrates the entire RAG application interface
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Brain, FileText, MessageSquare, Settings, Activity } from 'lucide-react';
import { ConfigurationForm } from './ConfigurationForm';
import { DocumentUpload } from './DocumentUpload';
import { DocumentList } from './DocumentList';
import { ChatInterface } from './ChatInterface';
import { useRAG } from '@/hooks/useRAG';
import { RAGConfig } from '@/lib/rag';

export function RAGDashboard() {
  const {
    documents,
    queries,
    isProcessing,
    isQuerying,
    isInitialized,
    hasDocuments,
    initializePipeline,
    addDocument,
    removeDocument,
    query,
    streamQuery,
    clearHistory,
    clearKnowledgeBase,
    getStats,
  } = useRAG();

  const [activeTab, setActiveTab] = useState('setup');

  const handleInitialize = async (config: RAGConfig) => {
    try {
      await initializePipeline(config);
      setActiveTab('documents');
    } catch (error) {
      console.error('Failed to initialize:', error);
    }
  };

  const stats = getStats();

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gradient-subtle p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="p-3 bg-primary rounded-full">
                <Brain className="h-8 w-8 text-primary-foreground" />
              </div>
            </div>
            <h1 className="text-4xl font-bold mb-2">RAG System</h1>
            <p className="text-xl text-muted-foreground">
              Retrieval-Augmented Generation with LangChain & Groq
            </p>
          </div>

          <div className="flex justify-center">
            <ConfigurationForm 
              onSubmit={handleInitialize}
              isLoading={isProcessing}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary rounded-lg">
                <Brain className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">RAG System</h1>
                <p className="text-sm text-muted-foreground">
                  Powered by LangChain & Groq
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {stats && (
                <>
                  <div className="flex items-center space-x-1">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <Badge variant="secondary">
                      {stats.documents?.totalDocuments || 0} docs
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-1">
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    <Badge variant="secondary">
                      {stats.conversations || 0} conversations
                    </Badge>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="documents" className="flex items-center space-x-2">
              <FileText className="h-4 w-4" />
              <span>Documents</span>
            </TabsTrigger>
            <TabsTrigger value="chat" className="flex items-center space-x-2">
              <MessageSquare className="h-4 w-4" />
              <span>Chat</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center space-x-2">
              <Activity className="h-4 w-4" />
              <span>Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="documents" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Upload Documents</CardTitle>
                    <CardDescription>
                      Add documents to your knowledge base
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <DocumentUpload 
                      onUpload={addDocument}
                      isProcessing={isProcessing}
                    />
                  </CardContent>
                </Card>
              </div>
              
              <div>
                <DocumentList 
                  documents={documents}
                  onRemove={removeDocument}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="chat" className="space-y-6">
            {!hasDocuments ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="font-medium mb-2">No documents available</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Upload some documents first to start chatting with your knowledge base.
                  </p>
                  <button 
                    onClick={() => setActiveTab('documents')}
                    className="text-primary hover:underline"
                  >
                    Go to Documents →
                  </button>
                </CardContent>
              </Card>
            ) : (
              <div className="h-[600px]">
                <ChatInterface
                  onQuery={query}
                  onStreamQuery={streamQuery}
                  isQuerying={isQuerying}
                  className="h-full"
                />
              </div>
            )}
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.documents?.totalDocuments || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats?.documents?.totalChunks || 0} chunks total
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Conversations</CardTitle>
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.conversations || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Active conversation history
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Average Chunk Size</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {Math.round(stats?.documents?.avgChunkLength || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Characters per chunk
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Recent Queries</CardTitle>
                <CardDescription>
                  Your recent questions and responses
                </CardDescription>
              </CardHeader>
              <CardContent>
                {queries.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    No queries yet. Start a conversation in the Chat tab.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {queries.slice(0, 5).map((q) => (
                      <div key={q.id} className="border rounded-lg p-4">
                        <div className="font-medium mb-2">{q.question}</div>
                        <div className="text-sm text-muted-foreground mb-2">
                          {q.answer?.substring(0, 200)}...
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="text-xs">
                            {q.timestamp.toLocaleString()}
                          </Badge>
                          {q.sources.map((source, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {source}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>System Management</CardTitle>
                <CardDescription>
                  Manage your RAG system settings and data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Clear Conversation History</h4>
                    <p className="text-sm text-muted-foreground">
                      Remove all chat history while keeping documents
                    </p>
                  </div>
                  <button 
                    onClick={clearHistory}
                    className="text-sm text-destructive hover:underline"
                  >
                    Clear History
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Clear Knowledge Base</h4>
                    <p className="text-sm text-muted-foreground">
                      Remove all documents and conversation history
                    </p>
                  </div>
                  <button 
                    onClick={clearKnowledgeBase}
                    className="text-sm text-destructive hover:underline"
                  >
                    Clear All
                  </button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}