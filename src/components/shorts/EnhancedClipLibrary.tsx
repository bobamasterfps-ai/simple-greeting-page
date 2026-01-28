import { useState, useEffect, useCallback } from 'react';
import { 
  Download, Trash2, Play, FolderOpen, RefreshCw, Share2, 
  Calendar, Clock, Sparkles, Filter, Search, MoreHorizontal 
} from 'lucide-react';
import { clipDBManager } from '@/lib/clipIndexedDB';
import type { ClipData } from '@/types/clipTypes';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { cn } from '@/lib/utils';

interface EnhancedClipLibraryProps {
  refreshTrigger?: number;
}

const MODE_STYLES = {
  FUNNY: { label: '😂 Funny', class: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30' },
  FLEX: { label: '🔥 Flex', class: 'bg-orange-500/10 text-orange-500 border-orange-500/30' },
  TEACHING: { label: '📚 Teaching', class: 'bg-blue-500/10 text-blue-500 border-blue-500/30' },
};

const PRESET_LABELS: Record<string, string> = {
  STACKED_FACECAM: '9:16 Stacked',
  FULLSCREEN: '16:9',
  CENTERED: '1:1',
  CROPPED: '9:16 Shorts',
};

export function EnhancedClipLibrary({ refreshTrigger }: EnhancedClipLibraryProps) {
  const [clips, setClips] = useState<ClipData[]>([]);
  const [selectedClip, setSelectedClip] = useState<ClipData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'FUNNY' | 'FLEX' | 'TEACHING'>('all');

  const loadClips = useCallback(async () => {
    setLoading(true);
    try {
      const allClips = await clipDBManager.getAllClips();
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

  const filteredClips = clips.filter(clip => {
    if (filterMode !== 'all' && clip.mode !== filterMode) return false;
    if (search && !clip.event.type.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

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

  const deleteAll = async () => {
    try {
      for (const clip of clips) {
        await clipDBManager.deleteClip(clip.id);
      }
      toast.success('All clips deleted');
      loadClips();
    } catch (error) {
      console.error('Failed to delete clips:', error);
      toast.error('Failed to delete clips');
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

  const formatDuration = (ms: number) => {
    const seconds = Math.round(ms / 1000);
    return `${seconds}s`;
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
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Header & Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <FolderOpen className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Clip Library</h3>
                <p className="text-sm text-muted-foreground">
                  {clips.length} clip{clips.length !== 1 ? 's' : ''} saved locally
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
              <div className="relative flex-1 md:flex-initial md:w-48">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search events..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Filter className="w-4 h-4" />
                    {filterMode === 'all' ? 'All' : filterMode}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setFilterMode('all')}>
                    All Clips
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterMode('FUNNY')}>
                    😂 Funny
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterMode('FLEX')}>
                    🔥 Flex
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterMode('TEACHING')}>
                    📚 Teaching
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button variant="ghost" size="icon" onClick={loadClips}>
                <RefreshCw className="w-4 h-4" />
              </Button>

              {clips.length > 0 && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Clear All
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete all clips?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete all {clips.length} clips from your browser storage.
                        This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={deleteAll}>
                        Delete All
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Clips Grid */}
      {filteredClips.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <FolderOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
            <h3 className="font-display text-xl font-bold mb-2">
              {clips.length === 0 ? 'No clips yet' : 'No matching clips'}
            </h3>
            <p className="text-muted-foreground">
              {clips.length === 0 
                ? 'Generate clips from detected events to see them here'
                : 'Try adjusting your search or filter'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClips.map((clip) => (
            <Card key={clip.id} className="group overflow-hidden hover:border-primary/50 transition-all">
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
                
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="p-3 rounded-full bg-white/20 backdrop-blur-sm">
                    <Play className="w-8 h-8 text-white" fill="white" />
                  </div>
                </div>
                
                {/* Event badge */}
                <Badge className="absolute top-2 left-2 bg-background/90 backdrop-blur-sm">
                  {clip.event.type}
                </Badge>
                
                {/* Duration */}
                <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/70 text-white text-xs font-mono">
                  {formatDuration(clip.duration)}
                </div>
              </div>
              
              {/* Info */}
              <CardContent className="p-4">
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <Badge 
                    variant="outline" 
                    className={cn("text-xs", MODE_STYLES[clip.mode]?.class)}
                  >
                    {MODE_STYLES[clip.mode]?.label || clip.mode}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {PRESET_LABELS[clip.preset] || clip.preset}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                  <Calendar className="w-3 h-3" />
                  {formatDate(clip.createdAt)}
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => downloadClip(clip)}
                    size="sm"
                    className="flex-1 gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </Button>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="icon" className="h-9 w-9">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setSelectedClip(clip)}>
                        <Play className="w-4 h-4 mr-2" />
                        Preview
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => downloadClip(clip)}>
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => deleteClip(clip.id)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Video Preview Modal */}
      {selectedClip && selectedClip.processedVideoBlob && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedClip(null)}
        >
          <div className="relative max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
            <video
              src={URL.createObjectURL(selectedClip.processedVideoBlob)}
              controls
              autoPlay
              className="w-full rounded-xl shadow-2xl"
            />
            <div className="absolute -top-12 left-0 right-0 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge>{selectedClip.event.type}</Badge>
                <Badge variant="outline">{MODE_STYLES[selectedClip.mode]?.label}</Badge>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSelectedClip(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
