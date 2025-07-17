/**
 * Configuration form for RAG settings
 * Allows users to configure Groq API key and model parameters
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Key, Settings } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RAGConfig } from '@/lib/rag';
import { GROQ_MODELS } from '@/lib/rag/config';

interface ConfigurationFormProps {
  onSubmit: (config: RAGConfig) => void;
  isLoading?: boolean;
  initialConfig?: Partial<RAGConfig>;
}

export function ConfigurationForm({ onSubmit, isLoading, initialConfig }: ConfigurationFormProps) {
  const [config, setConfig] = useState({
    groqApiKey: initialConfig?.groqApiKey || '',
    model: initialConfig?.model || 'mixtral-8x7b-32768',
    temperature: initialConfig?.temperature || 0.1,
    maxTokens: initialConfig?.maxTokens || 1024,
    topK: initialConfig?.topK || 4,
    chunkSize: initialConfig?.chunkSize || 1000,
    chunkOverlap: initialConfig?.chunkOverlap || 200,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(config as RAGConfig);
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader className="space-y-4">
        <div className="flex items-center space-x-2">
          <Settings className="h-5 w-5 text-primary" />
          <CardTitle>RAG Configuration</CardTitle>
        </div>
        <CardDescription>
          Configure your Retrieval-Augmented Generation system with Groq integration
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* API Key Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Key className="h-4 w-4 text-accent" />
              <Label htmlFor="apiKey" className="text-sm font-medium">Groq API Key</Label>
              <Badge variant="secondary">Required</Badge>
            </div>
            
            <Input
              id="apiKey"
              type="password"
              placeholder="gsk_..."
              value={config.groqApiKey}
              onChange={(e) => setConfig(prev => ({ ...prev, groqApiKey: e.target.value }))}
              className="font-mono"
              required
            />
            
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Get your free API key from{' '}
                <a 
                  href="https://console.groq.com/keys" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Groq Console
                </a>
              </AlertDescription>
            </Alert>
          </div>

          <Separator />

          {/* Model Selection */}
          <div className="space-y-4">
            <Label className="text-sm font-medium">Language Model</Label>
            
            <Select 
              value={config.model} 
              onValueChange={(value) => setConfig(prev => ({ ...prev, model: value as RAGConfig['model'] }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {GROQ_MODELS.map((model) => (
                  <SelectItem key={model.id} value={model.id}>
                    <div className="flex flex-col items-start">
                      <span className="font-medium">{model.name}</span>
                      <span className="text-xs text-muted-foreground">{model.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Generation Parameters */}
          <div className="space-y-6">
            <Label className="text-sm font-medium">Generation Parameters</Label>
            
            <div className="grid gap-6">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <Label htmlFor="temperature">Temperature</Label>
                  <span className="text-sm text-muted-foreground">{config.temperature}</span>
                </div>
                <Slider
                  id="temperature"
                  min={0}
                  max={1}
                  step={0.1}
                  value={[config.temperature]}
                  onValueChange={([value]) => setConfig(prev => ({ ...prev, temperature: value }))}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  Lower values = more focused, higher values = more creative
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <Label htmlFor="maxTokens">Max Tokens</Label>
                  <span className="text-sm text-muted-foreground">{config.maxTokens}</span>
                </div>
                <Slider
                  id="maxTokens"
                  min={256}
                  max={2048}
                  step={64}
                  value={[config.maxTokens]}
                  onValueChange={([value]) => setConfig(prev => ({ ...prev, maxTokens: value }))}
                  className="w-full"
                />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <Label htmlFor="topK">Top K Results</Label>
                  <span className="text-sm text-muted-foreground">{config.topK}</span>
                </div>
                <Slider
                  id="topK"
                  min={1}
                  max={10}
                  step={1}
                  value={[config.topK]}
                  onValueChange={([value]) => setConfig(prev => ({ ...prev, topK: value }))}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  Number of relevant document chunks to retrieve
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Document Processing */}
          <div className="space-y-6">
            <Label className="text-sm font-medium">Document Processing</Label>
            
            <div className="grid gap-6">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <Label htmlFor="chunkSize">Chunk Size</Label>
                  <span className="text-sm text-muted-foreground">{config.chunkSize}</span>
                </div>
                <Slider
                  id="chunkSize"
                  min={500}
                  max={2000}
                  step={100}
                  value={[config.chunkSize]}
                  onValueChange={([value]) => setConfig(prev => ({ ...prev, chunkSize: value }))}
                  className="w-full"
                />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <Label htmlFor="chunkOverlap">Chunk Overlap</Label>
                  <span className="text-sm text-muted-foreground">{config.chunkOverlap}</span>
                </div>
                <Slider
                  id="chunkOverlap"
                  min={50}
                  max={500}
                  step={50}
                  value={[config.chunkOverlap]}
                  onValueChange={([value]) => setConfig(prev => ({ ...prev, chunkOverlap: value }))}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading || !config.groqApiKey}
            size="lg"
          >
            {isLoading ? 'Initializing...' : 'Initialize RAG System'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}