import { useState, useEffect, useCallback } from 'react';
import { Download, Trash2, Play, FolderOpen, RefreshCw } from 'lucide-react';
import { clipDBManager } from '@/lib/clipIndexedDB';
import type { ClipData } from '@/types/clipTypes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

interface ClipLibraryProps {
  refreshTrigger?: number;
}

const MODE_LABELS = {
  FUNNY: '😂 Funny',
  FLEX: '🔥 Flex',
  TEACHING: '📚 Teaching',
};

const PRESET_LABELS = {
  STACKED_FACECAM: '9:16 Stacked',
  FULLSCREEN: '16:9',
  CENTERED: '1:1',
  CROPPED: '9:16 Shorts',
};

export function ClipLibrary({ refreshTrigger }: ClipLibraryProps) {
  const [clips, setClips] = useState<ClipData[]>([]);
  const [selectedClip, setSelectedClip] = useState<ClipData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadClips = useCallback(async () => {
    setLoading(true);
    try {
      const allClips = await clipDBManager.getAllClips();
      // Sort by creation date, newest first
      setClips(allClips.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ));
    } catch (error) {
      console.error('Failed to load clips:', error);
      toast.error('Failed to load clips');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadClips();
  }, [loadClips, refreshTrigger]);

  const downloadClip = (clip: ClipData) => {
    if (!clip.processedVideoBlob) {
      toast.error('Clip video not available');
      return;
    }

    const url = URL.createObjectURL(clip.processedVideoBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${clip.event.type}-${clip.mode}-${clip.id}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Clip downloaded!');
  };

  const deleteClip = async (clipId: string) => {
    try {
      await clipDBManager.deleteClip(clipId);
      toast.success('Clip deleted');
      loadClips();
    } catch (error) {
      console.error('Failed to delete clip:', error);
      toast.error('Failed to delete clip');
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="w-full max-w-6xl mx-auto">
        <Card>
          <CardContent className="p-12 text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Loading clips...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-primary" />
              Clip Library ({clips.length})
            </span>
            <Button variant="ghost" size="sm" onClick={loadClips}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {clips.length === 0 ? (
            <div className="text-center py-12">
              <FolderOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="font-display text-xl font-bold mb-2">No clips yet</h3>
              <p className="text-muted-foreground">
                Generate clips from detected events to see them here
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {clips.map((clip) => (
                <div key={clip.id} className="group bg-card rounded-lg border overflow-hidden hover:border-primary/50 transition-colors">
                  {/* Thumbnail */}
                  <div 
                    className="relative aspect-video bg-muted cursor-pointer"
                    onClick={() => setSelectedClip(clip)}
                  >
                    {clip.thumbnailUrl ? (
                      <img 
                        src={clip.thumbnailUrl} 
                        alt="Clip thumbnail"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Play className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Play className="w-12 h-12 text-white" />
                    </div>
                    <Badge className="absolute top-2 left-2 bg-background/80">
                      {clip.event.type}
                    </Badge>
                  </div>
                  
                  {/* Info */}
                  <div className="p-4">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <Badge variant="outline" className="text-xs">
                        {MODE_LABELS[clip.mode]}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {PRESET_LABELS[clip.preset]}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">
                      {formatDate(clip.createdAt)}
                    </p>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => downloadClip(clip)}
                        size="sm"
                        className="flex-1"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete clip?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. The clip will be permanently deleted from your browser storage.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteClip(clip.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Video Modal */}
      {selectedClip && selectedClip.processedVideoBlob && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedClip(null)}
        >
          <div className="relative max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
            <video
              src={URL.createObjectURL(selectedClip.processedVideoBlob)}
              controls
              autoPlay
              className="w-full rounded-lg"
            />
            <Button
              variant="secondary"
              size="sm"
              className="absolute top-4 right-4"
              onClick={() => setSelectedClip(null)}
            >
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
