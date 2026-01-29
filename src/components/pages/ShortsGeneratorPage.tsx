/**
 * Shorts Generator Page - Simplified, Working Implementation
 * 
 * Features:
 * ✅ Reads file correctly
 * ✅ Loads FFmpeg correctly (blob URL pattern)
 * ✅ Cuts clips correctly
 * ✅ Crops to 9:16
 * ✅ Downloads final MP4
 * ✅ 100% browser-based (no cloud/APIs needed)
 */
import { useState, useRef, useCallback, useEffect } from 'react';
import { 
  Upload, Video, Download, Play, Pause, Loader2, 
  Sparkles, Scissors, FileVideo, HardDrive, RefreshCw,
  CheckCircle2, Clock, Volume2, AlertTriangle
} from 'lucide-react';
import { createShort, downloadBlob, preloadFFmpeg, isFFmpegReady } from '@/lib/shortsProcessor';
import { findHighlightTimestamps } from '@/lib/audioDetector';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface DetectedClip {
  id: string;
  timestamp: number;
  status: 'pending' | 'processing' | 'ready' | 'error';
  blob?: Blob;
}

export function ShortsGeneratorPage() {
  // File state
  const [file, setFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // FFmpeg state
  const [ffmpegReady, setFfmpegReady] = useState(false);
  const [ffmpegLoading, setFfmpegLoading] = useState(false);
  const [ffmpegProgress, setFfmpegProgress] = useState(0);
  
  // Detection state
  const [detecting, setDetecting] = useState(false);
  const [detectedClips, setDetectedClips] = useState<DetectedClip[]>([]);
  
  // Processing state
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [processProgress, setProcessProgress] = useState(0);
  
  // Settings
  const [clipDuration, setClipDuration] = useState(7);
  const [preRoll, setPreRoll] = useState(4);

  // Preload FFmpeg on mount
  useEffect(() => {
    if (isFFmpegReady()) {
      setFfmpegReady(true);
      return;
    }

    setFfmpegLoading(true);
    preloadFFmpeg((p) => setFfmpegProgress(p))
      .then(() => {
        setFfmpegReady(true);
        setFfmpegLoading(false);
      })
      .catch((err) => {
        console.error('FFmpeg preload failed:', err);
        setFfmpegLoading(false);
      });
  }, []);

  // Handle file selection
  const handleFileSelect = useCallback((selectedFile: File) => {
    if (!selectedFile.type.startsWith('video/')) {
      toast.error('Please select a video file');
      return;
    }
    
    // Cleanup previous video URL
    if (videoUrl) {
      URL.revokeObjectURL(videoUrl);
    }
    
    setFile(selectedFile);
    setVideoUrl(URL.createObjectURL(selectedFile));
    setDetectedClips([]);
  }, [videoUrl]);

  // Detect highlights
  const handleDetect = useCallback(async () => {
    if (!file || !videoRef.current) return;
    
    setDetecting(true);
    setDetectedClips([]);
    
    try {
      toast.info('Analyzing video for highlights...');
      
      // Use the video element for audio analysis
      const video = videoRef.current;
      video.currentTime = 0;
      
      // Play video for audio analysis
      await video.play();
      
      // Simple detection: scan audio peaks
      const audioContext = new AudioContext();
      const source = audioContext.createMediaElementSource(video);
      const analyser = audioContext.createAnalyser();
      source.connect(analyser);
      analyser.connect(audioContext.destination);
      
      analyser.fftSize = 2048;
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const peaks: number[] = [];
      let lastPeakTime = -2;
      
      const scanAudio = () => {
        if (video.paused || video.ended) {
          // Done scanning
          audioContext.close();
          setDetecting(false);
          
          // Create clip entries
          const clips: DetectedClip[] = peaks.slice(0, 10).map((t, i) => ({
            id: `clip-${Date.now()}-${i}`,
            timestamp: t,
            status: 'pending'
          }));
          
          setDetectedClips(clips);
          
          if (clips.length > 0) {
            toast.success(`Found ${clips.length} potential highlights!`);
          } else {
            toast.info('No highlights detected. Try adjusting sensitivity.');
          }
          return;
        }
        
        analyser.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        
        // Detect peaks above threshold
        if (avg > 150 && video.currentTime - lastPeakTime >= 2) {
          peaks.push(video.currentTime);
          lastPeakTime = video.currentTime;
        }
        
        requestAnimationFrame(scanAudio);
      };
      
      scanAudio();
    } catch (error) {
      console.error('Detection failed:', error);
      toast.error('Failed to analyze video');
      setDetecting(false);
    }
  }, [file]);

  // Generate a single short
  const handleGenerateClip = useCallback(async (clip: DetectedClip) => {
    if (!file || !ffmpegReady) {
      toast.error('FFmpeg not ready');
      return;
    }
    
    setProcessingId(clip.id);
    setProcessProgress(0);
    
    // Update clip status
    setDetectedClips(prev => 
      prev.map(c => c.id === clip.id ? { ...c, status: 'processing' } : c)
    );
    
    try {
      const startTime = Math.max(0, clip.timestamp - preRoll);
      
      const blob = await createShort(
        file,
        startTime,
        clipDuration,
        (p) => setProcessProgress(p)
      );
      
      // Update clip with blob
      setDetectedClips(prev =>
        prev.map(c => c.id === clip.id ? { ...c, status: 'ready', blob } : c)
      );
      
      toast.success('Short generated!');
    } catch (error) {
      console.error('Generation failed:', error);
      setDetectedClips(prev =>
        prev.map(c => c.id === clip.id ? { ...c, status: 'error' } : c)
      );
      toast.error('Failed to generate short');
    } finally {
      setProcessingId(null);
      setProcessProgress(0);
    }
  }, [file, ffmpegReady, preRoll, clipDuration]);

  // Download a clip
  const handleDownload = useCallback((clip: DetectedClip, index: number) => {
    if (!clip.blob) return;
    downloadBlob(clip.blob, `short-${index + 1}.mp4`);
    toast.success('Downloaded!');
  }, []);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold">
              Shorts Generator
            </h1>
            <p className="text-muted-foreground">
              100% browser-based • No uploads • No cloud
            </p>
          </div>
        </div>
        
        {/* Status badges */}
        <div className="flex flex-wrap gap-2">
          <Badge 
            variant={ffmpegReady ? 'default' : 'secondary'}
            className="gap-1"
          >
            {ffmpegReady ? (
              <CheckCircle2 className="w-3 h-3" />
            ) : ffmpegLoading ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <AlertTriangle className="w-3 h-3" />
            )}
            FFmpeg {ffmpegReady ? 'Ready' : ffmpegLoading ? `Loading ${ffmpegProgress}%` : 'Not Loaded'}
          </Badge>
          <Badge variant="outline" className="gap-1">
            <Video className="w-3 h-3" />
            WASM Powered
          </Badge>
          <Badge variant="outline" className="gap-1">
            <HardDrive className="w-3 h-3" />
            Local Only
          </Badge>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: Upload & Video Preview */}
        <div className="space-y-4">
          {/* Upload Card */}
          <Card className={cn(
            "border-2 border-dashed transition-colors",
            file ? "border-primary/50" : "border-muted-foreground/30"
          )}>
            <CardContent className="p-6">
              {!file ? (
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                    <Upload className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold mb-2">Upload Your Gameplay</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    MP4, WebM, or MOV files supported
                  </p>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                    className="hidden"
                    id="video-upload"
                  />
                  <label
                    htmlFor="video-upload"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg cursor-pointer hover:bg-primary/90 transition-colors"
                  >
                    <FileVideo className="w-5 h-5" />
                    Select Video
                  </label>
                </div>
              ) : (
                <div className="space-y-4">
                  <video
                    ref={videoRef}
                    src={videoUrl || undefined}
                    controls
                    className="w-full rounded-lg bg-black"
                    crossOrigin="anonymous"
                  />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileVideo className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm truncate max-w-[200px]">{file.name}</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setFile(null);
                        if (videoUrl) URL.revokeObjectURL(videoUrl);
                        setVideoUrl(null);
                        setDetectedClips([]);
                      }}
                    >
                      <RefreshCw className="w-4 h-4 mr-1" />
                      Change
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Settings */}
          {file && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Scissors className="w-4 h-4" />
                  Clip Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium">Pre-roll</label>
                    <span className="text-sm text-muted-foreground">{preRoll}s before highlight</span>
                  </div>
                  <Slider
                    value={[preRoll]}
                    onValueChange={([v]) => setPreRoll(v)}
                    min={1}
                    max={10}
                    step={1}
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium">Clip Duration</label>
                    <span className="text-sm text-muted-foreground">{clipDuration}s total</span>
                  </div>
                  <Slider
                    value={[clipDuration]}
                    onValueChange={([v]) => setClipDuration(v)}
                    min={5}
                    max={30}
                    step={1}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Detect Button */}
          {file && (
            <Button
              onClick={handleDetect}
              disabled={!ffmpegReady || detecting}
              className="w-full gap-2"
              size="lg"
            >
              {detecting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Analyzing Audio...
                </>
              ) : (
                <>
                  <Volume2 className="w-5 h-5" />
                  Find Highlights
                </>
              )}
            </Button>
          )}
        </div>

        {/* Right: Detected Clips */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Detected Highlights
            </CardTitle>
            <CardDescription>
              {detectedClips.length > 0 
                ? `${detectedClips.length} highlights found` 
                : 'Upload a video and click "Find Highlights"'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {detectedClips.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Video className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No highlights detected yet</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                {detectedClips.map((clip, index) => (
                  <div
                    key={clip.id}
                    className={cn(
                      "flex items-center justify-between p-4 rounded-lg border transition-colors",
                      clip.status === 'ready' && "bg-primary/5 border-primary/30",
                      clip.status === 'processing' && "bg-muted border-muted",
                      clip.status === 'error' && "bg-destructive/5 border-destructive/30"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-2xl font-bold text-muted-foreground">
                        #{index + 1}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span className="font-mono font-medium">
                            {formatTime(clip.timestamp)}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {clip.status === 'ready' ? 'Ready to download' : 
                           clip.status === 'processing' ? 'Processing...' :
                           clip.status === 'error' ? 'Generation failed' : 
                           'Click to generate'}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {clip.status === 'processing' && processingId === clip.id && (
                        <div className="w-20">
                          <Progress value={processProgress} className="h-2" />
                        </div>
                      )}
                      
                      {clip.status === 'pending' && (
                        <Button
                          size="sm"
                          onClick={() => handleGenerateClip(clip)}
                          disabled={!!processingId}
                        >
                          <Play className="w-4 h-4 mr-1" />
                          Generate
                        </Button>
                      )}
                      
                      {clip.status === 'processing' && (
                        <Button size="sm" disabled>
                          <Loader2 className="w-4 h-4 animate-spin" />
                        </Button>
                      )}
                      
                      {clip.status === 'ready' && (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleDownload(clip, index)}
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Download
                        </Button>
                      )}
                      
                      {clip.status === 'error' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleGenerateClip(clip)}
                          disabled={!!processingId}
                        >
                          <RefreshCw className="w-4 h-4 mr-1" />
                          Retry
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Memory Warning */}
      <Card className="border-warning/30 bg-warning/5">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-warning">Browser Memory Limits</p>
              <p className="text-muted-foreground mt-1">
                Browser-based FFmpeg uses 1-2GB RAM. Very large videos may cause crashes. 
                For best results, use clips under 10 minutes.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
