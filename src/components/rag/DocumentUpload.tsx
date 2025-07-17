/**
 * Document upload component with drag & drop support
 * Handles file validation and upload progress
 */

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SUPPORTED_FILE_TYPES, MAX_FILE_SIZE } from '@/lib/rag/config';
import { Document } from '@/lib/rag';

interface DocumentUploadProps {
  onUpload: (file: File) => Promise<Document>;
  isProcessing?: boolean;
  className?: string;
}

interface UploadFile {
  file: File;
  id: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
  document?: Document;
}

export function DocumentUpload({ onUpload, isProcessing, className }: DocumentUploadProps) {
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);

  const processFile = async (uploadFile: UploadFile) => {
    setUploadFiles(prev => 
      prev.map(f => 
        f.id === uploadFile.id 
          ? { ...f, status: 'uploading', progress: 0 }
          : f
      )
    );

    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadFiles(prev => 
          prev.map(f => 
            f.id === uploadFile.id 
              ? { ...f, progress: Math.min(f.progress + 10, 90) }
              : f
          )
        );
      }, 200);

      const document = await onUpload(uploadFile.file);

      clearInterval(progressInterval);
      setUploadFiles(prev => 
        prev.map(f => 
          f.id === uploadFile.id 
            ? { ...f, status: 'success', progress: 100, document }
            : f
        )
      );

      // Remove successful uploads after 3 seconds
      setTimeout(() => {
        setUploadFiles(prev => prev.filter(f => f.id !== uploadFile.id));
      }, 3000);

    } catch (error) {
      setUploadFiles(prev => 
        prev.map(f => 
          f.id === uploadFile.id 
            ? { 
                ...f, 
                status: 'error', 
                progress: 0,
                error: error instanceof Error ? error.message : 'Upload failed'
              }
            : f
        )
      );
    }
  };

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    // Handle rejected files
    rejectedFiles.forEach(({ file, errors }) => {
      const uploadFile: UploadFile = {
        file,
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        status: 'error',
        progress: 0,
        error: errors.map((e: any) => e.message).join(', '),
      };
      setUploadFiles(prev => [...prev, uploadFile]);
    });

    // Handle accepted files
    acceptedFiles.forEach(file => {
      const uploadFile: UploadFile = {
        file,
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        status: 'pending',
        progress: 0,
      };
      
      setUploadFiles(prev => [...prev, uploadFile]);
      processFile(uploadFile);
    });
  }, [onUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxSize: MAX_FILE_SIZE,
    multiple: true,
    disabled: isProcessing,
  });

  const removeFile = (id: string) => {
    setUploadFiles(prev => prev.filter(f => f.id !== id));
  };

  const supportedTypes = Object.entries(SUPPORTED_FILE_TYPES).map(([mime, ext]) => ext.toUpperCase()).join(', ');

  return (
    <div className={cn('space-y-4', className)}>
      <Card>
        <CardContent className="p-6">
          <div
            {...getRootProps()}
            className={cn(
              'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
              isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50',
              isProcessing && 'cursor-not-allowed opacity-50'
            )}
          >
            <input {...getInputProps()} />
            
            <div className="flex flex-col items-center space-y-4">
              <div className={cn(
                'p-3 rounded-full',
                isDragActive ? 'bg-primary text-primary-foreground' : 'bg-muted'
              )}>
                <Upload className="h-6 w-6" />
              </div>
              
              <div className="space-y-2">
                <h3 className="font-medium">
                  {isDragActive ? 'Drop files here' : 'Upload documents'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Drag & drop files or click to browse
                </p>
                <div className="flex flex-wrap gap-1 justify-center">
                  <Badge variant="outline">{supportedTypes}</Badge>
                  <Badge variant="outline">Max {MAX_FILE_SIZE / (1024 * 1024)}MB</Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upload Progress */}
      {uploadFiles.length > 0 && (
        <div className="space-y-3">
          {uploadFiles.map(uploadFile => (
            <Card key={uploadFile.id} className="p-4">
              <div className="flex items-center space-x-3">
                <FileText className="h-4 w-4 text-muted-foreground" />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium truncate">
                      {uploadFile.file.name}
                    </p>
                    <div className="flex items-center space-x-2">
                      {uploadFile.status === 'success' && (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      )}
                      {uploadFile.status === 'error' && (
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeFile(uploadFile.id)}
                        className="h-6 w-6 p-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  
                  {uploadFile.status === 'uploading' && (
                    <Progress value={uploadFile.progress} className="h-1" />
                  )}
                  
                  {uploadFile.error && (
                    <p className="text-xs text-red-500 mt-1">{uploadFile.error}</p>
                  )}
                  
                  {uploadFile.status === 'success' && uploadFile.document && (
                    <p className="text-xs text-green-600 mt-1">
                      Processed successfully • {uploadFile.document.chunks?.length || 0} chunks created
                    </p>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}