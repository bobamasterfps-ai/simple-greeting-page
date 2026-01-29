import { useState, useCallback } from 'react';
import { Upload, Video, FileVideo, HardDrive, CheckCircle2 } from 'lucide-react';
import { clipDBManager } from '@/lib/clipIndexedDB';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ShortsUploadProps {
  onUploadComplete: (videoId: string, videoUrl: string) => void;
  currentVideoId?: string;
}

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
};

export function ShortsUpload({ onUploadComplete, currentVideoId }: ShortsUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{ name: string; size: number } | null>(null);

  const handleFileSelect = useCallback(async (file: File) => {
    if (!file.type.startsWith('video/')) {
      toast.error('Please select a video file');
      return;
    }

    // Check file size (warn if > 500MB)
    if (file.size > 500 * 1024 * 1024) {
      toast.warning('Large file detected. Processing may be slow.', {
        description: 'For best results, use videos under 500MB'
      });
    }

    setUploading(true);
    setProgress(0);

    try {
      const videoId = `video-${Date.now()}`;
      
      // Simulate progress for UX
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 3, 90));
      }, 50);

      await clipDBManager.saveVideo(videoId, file, file.name);
      
      clearInterval(progressInterval);
      setProgress(100);
      
      // Create object URL for preview
      const videoUrl = URL.createObjectURL(file);
      setUploadedFile({ name: file.name, size: file.size });
      
      setTimeout(() => {
        onUploadComplete(videoId, videoUrl);
        setUploading(false);
        setProgress(0);
        toast.success('Video loaded successfully!');
      }, 300);
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error('Upload failed', {
        description: 'File may be too large for browser storage'
      });
      setUploading(false);
    }
  }, [onUploadComplete]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  }, [handleFileSelect]);

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      {/* Upload Card */}
      <Card 
        className={cn(
          "border-2 border-dashed transition-all duration-300",
          dragActive && "border-primary bg-primary/5 scale-[1.02]",
          currentVideoId && !uploading && "border-primary/50 bg-primary/5",
          !dragActive && !currentVideoId && "border-muted-foreground/30 hover:border-muted-foreground/50"
        )}
      >
        <CardContent className="p-8 md:p-12">
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className="text-center"
          >
            {!uploading && !currentVideoId ? (
              <>
                <div className={cn(
                  "w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center transition-colors",
                  dragActive ? "bg-primary/20" : "bg-muted"
                )}>
                  <Upload className={cn(
                    "w-10 h-10 transition-colors",
                    dragActive ? "text-primary" : "text-muted-foreground"
                  )} />
                </div>
                <h3 className="font-display text-xl font-bold mb-2">Upload Your Gameplay</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Drag and drop your Valorant VOD, or click to browse. 
                  Supports MP4, WebM, and MOV files.
                </p>
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleFileInput}
                  className="hidden"
                  id="shorts-video-upload"
                />
                <label
                  htmlFor="shorts-video-upload"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-xl cursor-pointer hover:bg-primary/90 transition-colors font-medium text-lg shadow-lg shadow-primary/20"
                >
                  <FileVideo className="w-5 h-5" />
                  Select Video
                </label>
              </>
            ) : uploading ? (
              <>
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/20 flex items-center justify-center">
                  <Video className="w-10 h-10 text-primary animate-pulse" />
                </div>
                <h3 className="font-display text-xl font-bold mb-4">Processing Video...</h3>
                <div className="max-w-xs mx-auto">
                  <Progress value={progress} className="h-3 mb-3" />
                  <p className="text-muted-foreground font-mono">{progress}%</p>
                </div>
              </>
            ) : (
              <>
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/20 flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10 text-primary" />
                </div>
                <h3 className="font-display text-xl font-bold mb-2">Video Ready</h3>
                {uploadedFile && (
                  <div className="flex items-center justify-center gap-3 text-muted-foreground mb-4">
                    <FileVideo className="w-4 h-4" />
                    <span className="truncate max-w-[200px]">{uploadedFile.name}</span>
                    <Badge variant="secondary">{formatFileSize(uploadedFile.size)}</Badge>
                  </div>
                )}
                <Button
                  variant="outline"
                  onClick={() => {
                    setUploadedFile(null);
                    document.getElementById('shorts-video-upload')?.click();
                  }}
                >
                  Change Video
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Feature badges */}
      <div className="grid grid-cols-3 gap-4 text-center">
        {[
          { value: '100%', label: 'Browser-Based' },
          { value: 'No Upload', label: 'To Servers' },
          { value: 'Private', label: '& Secure' },
        ].map((item) => (
          <div 
            key={item.label}
            className="p-4 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-colors"
          >
            <div className="font-bold text-lg text-primary">{item.value}</div>
            <div className="text-sm text-muted-foreground">{item.label}</div>
          </div>
        ))}
      </div>

      {/* Storage notice */}
      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <HardDrive className="w-4 h-4" />
        <span>Videos are stored locally in your browser — never uploaded to any server</span>
      </div>
    </div>
  );
}
