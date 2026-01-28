import { useState, useCallback } from 'react';
import { Upload, Video, FileVideo, HardDrive } from 'lucide-react';
import { clipDBManager } from '@/lib/clipIndexedDB';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface VideoUploadProps {
  onUploadComplete: (videoId: string) => void;
}

export function VideoUpload({ onUploadComplete }: VideoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);

  const handleFileSelect = useCallback(async (file: File) => {
    if (!file.type.startsWith('video/')) {
      alert('Please select a video file');
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      const videoId = `video-${Date.now()}`;
      
      // Simulate progress for large files
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 5, 90));
      }, 100);

      await clipDBManager.saveVideo(videoId, file, file.name);
      
      clearInterval(progressInterval);
      setProgress(100);
      
      setTimeout(() => {
        onUploadComplete(videoId);
        setUploading(false);
        setProgress(0);
      }, 300);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed - file may be too large for browser storage');
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
    <div className="w-full max-w-2xl mx-auto">
      <Card className={`border-2 border-dashed transition-colors ${
        dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/30'
      }`}>
        <CardContent className="p-12">
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className="text-center"
          >
            {!uploading ? (
              <>
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
                  <Upload className="w-10 h-10 text-muted-foreground" />
                </div>
                <h3 className="font-display text-xl font-bold mb-2">Upload Your VOD</h3>
                <p className="text-muted-foreground mb-6">
                  Drag and drop your Valorant gameplay, or click to browse
                </p>
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleFileInput}
                  className="hidden"
                  id="video-upload"
                />
                <label
                  htmlFor="video-upload"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg cursor-pointer hover:bg-primary/90 transition-colors font-medium"
                >
                  <FileVideo className="w-5 h-5" />
                  Select Video
                </label>
                <div className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <HardDrive className="w-4 h-4" />
                  <span>Videos are stored locally in your browser</span>
                </div>
              </>
            ) : (
              <>
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/20 flex items-center justify-center">
                  <Video className="w-10 h-10 text-primary animate-pulse" />
                </div>
                <h3 className="font-display text-xl font-bold mb-4">Processing Video...</h3>
                <Progress value={progress} className="h-3 mb-2" />
                <p className="text-muted-foreground">{progress}%</p>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 grid grid-cols-3 gap-4 text-center text-sm">
        <div className="p-4 rounded-lg bg-card">
          <div className="font-bold text-lg">100%</div>
          <div className="text-muted-foreground">Browser-Based</div>
        </div>
        <div className="p-4 rounded-lg bg-card">
          <div className="font-bold text-lg">No Upload</div>
          <div className="text-muted-foreground">To Servers</div>
        </div>
        <div className="p-4 rounded-lg bg-card">
          <div className="font-bold text-lg">Private</div>
          <div className="text-muted-foreground">& Secure</div>
        </div>
      </div>
    </div>
  );
}
