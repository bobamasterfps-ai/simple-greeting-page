import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import type { SubtitleSegment } from '@/types/clipTypes';

/**
 * Browser-based FFmpeg worker for clip processing
 * Uses CDN-loaded WASM binaries with blob URLs to bypass CORS issues
 */
class ClipFFmpegWorker {
  private ffmpeg: FFmpeg;
  private loaded: boolean = false;
  private loading: Promise<void> | null = null;

  constructor() {
    this.ffmpeg = new FFmpeg();
  }

  /**
   * Load FFmpeg with proper blob URL pattern for browser compatibility
   */
  async load(onProgress?: (progress: number) => void): Promise<void> {
    if (this.loaded) return;
    
    // If already loading, wait for that to complete
    if (this.loading) {
      await this.loading;
      return;
    }

    this.loading = this._doLoad(onProgress);
    
    try {
      await this.loading;
    } finally {
      this.loading = null;
    }
  }

  private async _doLoad(onProgress?: (progress: number) => void): Promise<void> {
    try {
      // Use unpkg CDN with UMD build for browser compatibility
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';

      // Set up logging for debugging
      this.ffmpeg.on('log', ({ message }) => {
        console.log('[FFmpeg]', message);
      });

      // Progress callback for encoding operations
      this.ffmpeg.on('progress', ({ progress }) => {
        if (onProgress) {
          onProgress(Math.round(progress * 100));
        }
      });

      // CRITICAL: Convert URLs to blob URLs to avoid CORS/CSP issues
      // This is the proven fix for browser FFmpeg loading
      const coreURL = await toBlobURL(
        `${baseURL}/ffmpeg-core.js`,
        'text/javascript'
      );
      const wasmURL = await toBlobURL(
        `${baseURL}/ffmpeg-core.wasm`,
        'application/wasm'
      );

      await this.ffmpeg.load({ coreURL, wasmURL });
      this.loaded = true;
      console.log('[FFmpeg] Loaded successfully');
    } catch (error) {
      console.error('[FFmpeg] Load failed:', error);
      throw new Error(`FFmpeg failed to load: ${error}`);
    }
  }

  /**
   * Quick short generation - extract, crop to 9:16, output MP4
   * Based on proven working pattern
   */
  async makeShort(
    file: File | Blob,
    startSeconds: number,
    durationSeconds: number,
    onProgress?: (progress: number) => void
  ): Promise<Blob> {
    await this.load(onProgress);

    const inputName = `input_${Date.now()}.mp4`;
    const outputName = `out_${Date.now()}.mp4`;

    try {
      // Write input file using fetchFile for proper blob handling
      await this.ffmpeg.writeFile(inputName, await fetchFile(file));

      // Execute FFmpeg with TikTok/Shorts 9:16 crop
      await this.ffmpeg.exec([
        '-ss', String(startSeconds),
        '-t', String(durationSeconds),
        '-i', inputName,
        '-vf', 'scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920',
        '-c:v', 'libx264',
        '-preset', 'veryfast',
        '-c:a', 'aac',
        '-movflags', 'faststart',
        outputName
      ]);

      // Read output
      const data = await this.ffmpeg.readFile(outputName);
      
      // Cleanup
      await this.ffmpeg.deleteFile(inputName);
      await this.ffmpeg.deleteFile(outputName);

      // Properly convert FileData to Blob
      const uint8Array = data instanceof Uint8Array 
        ? new Uint8Array(data.buffer.slice(0)) 
        : data;
      
      return new Blob([uint8Array as BlobPart], { type: 'video/mp4' });
    } catch (error) {
      console.error('[FFmpeg] makeShort failed:', error);
      throw error;
    }
  }

  /**
   * Extract a clip segment with accurate seeking
   */
  async extractClip(
    videoBlob: Blob,
    startTimeMs: number,
    durationMs: number,
    onProgress?: (progress: number) => void
  ): Promise<Blob> {
    await this.load(onProgress);

    const inputName = `input_${Date.now()}.mp4`;
    const outputName = `output_${Date.now()}.mp4`;

    try {
      await this.ffmpeg.writeFile(inputName, await fetchFile(videoBlob));

      // Use input seeking (-ss before -i) for faster seeking
      await this.ffmpeg.exec([
        '-ss', (startTimeMs / 1000).toFixed(3),
        '-i', inputName,
        '-t', (durationMs / 1000).toFixed(3),
        '-c:v', 'libx264',
        '-preset', 'veryfast',
        '-c:a', 'aac',
        '-avoid_negative_ts', 'make_zero',
        '-movflags', 'faststart',
        outputName
      ]);

      const data = await this.ffmpeg.readFile(outputName);
      
      await this.ffmpeg.deleteFile(inputName);
      await this.ffmpeg.deleteFile(outputName);

      const uint8Array = data instanceof Uint8Array 
        ? new Uint8Array(data.buffer.slice(0)) 
        : data;
      return new Blob([uint8Array as BlobPart], { type: 'video/mp4' });
    } catch (error) {
      console.error('[FFmpeg] extractClip failed:', error);
      throw error;
    }
  }

  /**
   * Add subtitles to video
   */
  async addSubtitles(
    videoBlob: Blob,
    subtitles: SubtitleSegment[],
    style: {
      fontName: string;
      fontSize: number;
      primaryColor: string;
      outlineColor: string;
    },
    onProgress?: (progress: number) => void
  ): Promise<Blob> {
    await this.load(onProgress);

    if (subtitles.length === 0) {
      return videoBlob;
    }

    const inputName = `input_sub_${Date.now()}.mp4`;
    const srtName = `subtitles_${Date.now()}.srt`;
    const outputName = `output_sub_${Date.now()}.mp4`;

    try {
      const srtContent = this.generateSRT(subtitles);
      await this.ffmpeg.writeFile(srtName, srtContent);
      await this.ffmpeg.writeFile(inputName, await fetchFile(videoBlob));

      // Build subtitle style string for ASS format
      const styleStr = `Fontname=${style.fontName},FontSize=${style.fontSize},PrimaryColour=${this.colorToASS(style.primaryColor)},OutlineColour=${this.colorToASS(style.outlineColor)},Bold=1,Alignment=2,MarginV=30`;

      await this.ffmpeg.exec([
        '-i', inputName,
        '-vf', `subtitles=${srtName}:force_style='${styleStr}'`,
        '-c:a', 'copy',
        '-preset', 'veryfast',
        '-movflags', 'faststart',
        outputName
      ]);

      const data = await this.ffmpeg.readFile(outputName);
      
      await this.ffmpeg.deleteFile(inputName);
      await this.ffmpeg.deleteFile(srtName);
      await this.ffmpeg.deleteFile(outputName);

      const uint8Array = data instanceof Uint8Array 
        ? new Uint8Array(data.buffer.slice(0)) 
        : data;
      return new Blob([uint8Array as BlobPart], { type: 'video/mp4' });
    } catch (error) {
      console.error('[FFmpeg] addSubtitles failed:', error);
      return videoBlob; // Return original if subtitles fail
    }
  }

  /**
   * Crop video to specific aspect ratio
   */
  async cropToAspectRatio(
    videoBlob: Blob,
    preset: 'STACKED_FACECAM' | 'FULLSCREEN' | 'CENTERED' | 'CROPPED',
    onProgress?: (progress: number) => void
  ): Promise<Blob> {
    await this.load(onProgress);

    const inputName = `input_crop_${Date.now()}.mp4`;
    const outputName = `output_crop_${Date.now()}.mp4`;

    try {
      await this.ffmpeg.writeFile(inputName, await fetchFile(videoBlob));

      // Crop filter presets
      const cropFilters: Record<string, string> = {
        STACKED_FACECAM: 'scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920',
        FULLSCREEN: 'scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2',
        CENTERED: 'scale=1080:1080:force_original_aspect_ratio=increase,crop=1080:1080',
        CROPPED: 'scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920'
      };

      await this.ffmpeg.exec([
        '-i', inputName,
        '-vf', cropFilters[preset],
        '-c:v', 'libx264',
        '-preset', 'veryfast',
        '-c:a', 'copy',
        '-movflags', 'faststart',
        outputName
      ]);

      const data = await this.ffmpeg.readFile(outputName);
      
      await this.ffmpeg.deleteFile(inputName);
      await this.ffmpeg.deleteFile(outputName);

      const uint8Array = data instanceof Uint8Array 
        ? new Uint8Array(data.buffer.slice(0)) 
        : data;
      return new Blob([uint8Array as BlobPart], { type: 'video/mp4' });
    } catch (error) {
      console.error('[FFmpeg] cropToAspectRatio failed:', error);
      throw error;
    }
  }

  /**
   * Apply video effects (slow-mo, color grading, zoom)
   */
  async applyEffects(
    videoBlob: Blob,
    effects: {
      slowMo?: { startMs: number; endMs: number; speed: number };
      zoom?: { scale: number; durationFrames: number };
      colorGrade?: { saturation: number; brightness: number; contrast?: number };
    },
    onProgress?: (progress: number) => void
  ): Promise<Blob> {
    await this.load(onProgress);

    const inputName = `input_fx_${Date.now()}.mp4`;
    const outputName = `output_fx_${Date.now()}.mp4`;

    try {
      await this.ffmpeg.writeFile(inputName, await fetchFile(videoBlob));

      const filters: string[] = [];

      if (effects.slowMo) {
        const { speed } = effects.slowMo;
        filters.push(`setpts=${1 / speed}*PTS`);
      }

      if (effects.zoom && effects.zoom.scale > 1) {
        const { scale, durationFrames } = effects.zoom;
        filters.push(`zoompan=z='min(zoom+0.001,${scale})':d=${durationFrames}:s=1920x1080`);
      }

      if (effects.colorGrade) {
        const { saturation, brightness, contrast = 1 } = effects.colorGrade;
        filters.push(`eq=saturation=${saturation}:brightness=${brightness - 1}:contrast=${contrast}`);
      }

      const args = ['-i', inputName];
      
      if (filters.length > 0) {
        args.push('-vf', filters.join(','));
      }
      
      if (effects.slowMo) {
        // Slow down audio to match video
        args.push('-af', `atempo=${effects.slowMo.speed}`);
      } else {
        args.push('-c:a', 'copy');
      }
      
      args.push('-c:v', 'libx264', '-preset', 'veryfast', '-movflags', 'faststart', outputName);

      await this.ffmpeg.exec(args);

      const data = await this.ffmpeg.readFile(outputName);
      
      await this.ffmpeg.deleteFile(inputName);
      await this.ffmpeg.deleteFile(outputName);

      const uint8Array = data instanceof Uint8Array 
        ? new Uint8Array(data.buffer.slice(0)) 
        : data;
      return new Blob([uint8Array as BlobPart], { type: 'video/mp4' });
    } catch (error) {
      console.error('[FFmpeg] applyEffects failed:', error);
      return videoBlob;
    }
  }

  private generateSRT(subtitles: SubtitleSegment[]): string {
    let srt = '';
    
    subtitles.forEach((sub, index) => {
      srt += `${index + 1}\n`;
      srt += `${this.formatTime(sub.start)} --> ${this.formatTime(sub.end)}\n`;
      srt += `${sub.text}\n\n`;
    });

    return srt;
  }

  private formatTime(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const milliseconds = ms % 1000;

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')},${String(milliseconds).padStart(3, '0')}`;
  }

  private colorToASS(hexColor: string): string {
    // Convert #RRGGBB to ASS format &HBBGGRR&
    const hex = hexColor.replace('#', '');
    const r = hex.substring(0, 2);
    const g = hex.substring(2, 4);
    const b = hex.substring(4, 6);
    return `&H${b}${g}${r}&`;
  }

  isLoaded(): boolean {
    return this.loaded;
  }
}

export const clipFFmpegWorker = new ClipFFmpegWorker();
