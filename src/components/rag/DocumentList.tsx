/**
 * Document list component
 * Shows uploaded documents with management options
 */

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { FileText, Trash2, Eye, Download } from 'lucide-react';
import { Document } from '@/lib/rag';
import { getDocumentStats } from '@/lib/rag';

interface DocumentListProps {
  documents: Document[];
  onRemove?: (documentId: string) => void;
  onView?: (document: Document) => void;
  className?: string;
}

export function DocumentList({ documents, onRemove, onView, className }: DocumentListProps) {
  if (documents.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-8 text-center">
          <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="font-medium mb-2">No documents uploaded</h3>
          <p className="text-sm text-muted-foreground">
            Upload documents to start building your knowledge base
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <FileText className="h-5 w-5" />
          <span>Knowledge Base</span>
          <Badge variant="secondary">{documents.length}</Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="divide-y">
          {documents.map((document, index) => {
            const stats = getDocumentStats(document);
            
            return (
              <div key={document.id} className="p-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-start justify-between space-x-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <h4 className="font-medium truncate">{document.name}</h4>
                      <Badge 
                        variant={document.status === 'ready' ? 'default' : 'secondary'}
                        className="ml-auto"
                      >
                        {document.status}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground mb-3">
                      <div className="space-y-1">
                        <div>Type: {document.metadata.type.toUpperCase()}</div>
                        <div>Size: {(document.metadata.size / 1024).toFixed(1)} KB</div>
                      </div>
                      <div className="space-y-1">
                        <div>Words: {stats.wordCount.toLocaleString()}</div>
                        <div>Chunks: {stats.chunkCount}</div>
                      </div>
                    </div>

                    <div className="text-xs text-muted-foreground">
                      Uploaded: {document.metadata.uploadedAt.toLocaleDateString()} at{' '}
                      {document.metadata.uploadedAt.toLocaleTimeString()}
                      {document.metadata.processedAt && (
                        <>
                          {' • '}
                          Processed: {document.metadata.processedAt.toLocaleDateString()}
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-1">
                    {onView && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onView(document)}
                        className="h-8 w-8 p-0"
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                    )}
                    
                    {onRemove && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onRemove(document.id)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}