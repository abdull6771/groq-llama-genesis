/**
 * Chat interface for RAG queries
 * Provides a conversation-style interface with streaming responses
 */

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Send, User, Bot, FileText, Loader2 } from 'lucide-react';
import { RAGQuery } from '@/lib/rag';
import { cn } from '@/lib/utils';

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  sources?: string[];
  timestamp: Date;
  isStreaming?: boolean;
}

interface ChatInterfaceProps {
  onQuery: (question: string) => Promise<RAGQuery>;
  onStreamQuery?: (question: string) => AsyncGenerator<string, RAGQuery | null, unknown>;
  isQuerying?: boolean;
  className?: string;
  placeholder?: string;
}

export function ChatInterface({ 
  onQuery, 
  onStreamQuery, 
  isQuerying, 
  className,
  placeholder = "Ask a question about your documents..."
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      type: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      if (onStreamQuery) {
        // Streaming response
        const assistantMessage: ChatMessage = {
          id: `assistant_${Date.now()}`,
          type: 'assistant',
          content: '',
          timestamp: new Date(),
          isStreaming: true,
        };

        setMessages(prev => [...prev, assistantMessage]);

        let fullContent = '';
        const stream = onStreamQuery(userMessage.content);
        
        for await (const chunk of stream) {
          fullContent += chunk;
          setMessages(prev => 
            prev.map(msg => 
              msg.id === assistantMessage.id 
                ? { ...msg, content: fullContent }
                : msg
            )
          );
        }

        // Mark as complete
        setMessages(prev => 
          prev.map(msg => 
            msg.id === assistantMessage.id 
              ? { 
                  ...msg, 
                  content: fullContent,
                  sources: [], // We'll get sources from the actual result if needed
                  isStreaming: false
                }
              : msg
          )
        );
      } else {
        // Regular response
        const result = await onQuery(userMessage.content);
        
        const assistantMessage: ChatMessage = {
          id: `assistant_${Date.now()}`,
          type: 'assistant',
          content: result.answer || 'No response generated.',
          sources: result.sources,
          timestamp: new Date(),
        };

        setMessages(prev => [...prev, assistantMessage]);
      }
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: `error_${Date.now()}`,
        type: 'assistant',
        content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearMessages = () => {
    setMessages([]);
  };

  return (
    <Card className={cn('flex flex-col h-full', className)}>
      <CardContent className="flex flex-col h-full p-0">
        {/* Chat Header */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bot className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">RAG Assistant</h3>
            </div>
            {messages.length > 0 && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={clearMessages}
                disabled={isLoading}
              >
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Messages */}
        <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Start a conversation by asking a question about your documents.</p>
              </div>
            ) : (
              messages.map((message, index) => (
                <div key={message.id} className="space-y-2">
                  <div className={cn(
                    'flex items-start space-x-3',
                    message.type === 'user' ? 'justify-end' : 'justify-start'
                  )}>
                    {message.type === 'assistant' && (
                      <div className="flex-shrink-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                        <Bot className="h-4 w-4 text-primary-foreground" />
                      </div>
                    )}
                    
                    <div className={cn(
                      'max-w-[80%] rounded-lg px-4 py-3',
                      message.type === 'user' 
                        ? 'bg-primary text-primary-foreground ml-12' 
                        : 'bg-muted'
                    )}>
                      <div className="space-y-2">
                        <p className="text-sm whitespace-pre-wrap">
                          {message.content}
                          {message.isStreaming && (
                            <span className="ml-1 animate-pulse">▋</span>
                          )}
                        </p>
                        
                        {message.sources && message.sources.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-2 border-t border-border/50">
                            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                              <FileText className="h-3 w-3" />
                              <span>Sources:</span>
                            </div>
                            {message.sources.map((source, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {source}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {message.type === 'user' && (
                      <div className="flex-shrink-0 w-8 h-8 bg-secondary rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-secondary-foreground" />
                      </div>
                    )}
                  </div>
                  
                  {index < messages.length - 1 && <Separator className="my-4" />}
                </div>
              ))
            )}
            
            {isLoading && (
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <Bot className="h-4 w-4 text-primary-foreground" />
                </div>
                <div className="bg-muted rounded-lg px-4 py-3">
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">Thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="p-4 border-t">
          <form onSubmit={handleSubmit} className="flex space-x-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={placeholder}
              disabled={isLoading || isQuerying}
              className="flex-1"
            />
            <Button 
              type="submit" 
              disabled={!input.trim() || isLoading || isQuerying}
              size="icon"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}