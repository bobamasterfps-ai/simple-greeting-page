import type { GameEvent, SubtitleSegment } from '@/types/clipTypes';

export class ClipAudioAnalyzer {
  private audioContext: AudioContext | null = null;

  private getAudioContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }
    return this.audioContext;
  }

  async analyzeAudioPeaks(
    videoBlob: Blob,
    sensitivity: number = 0.7
  ): Promise<GameEvent[]> {
    const audioContext = this.getAudioContext();
    const audioBuffer = await this.extractAudio(videoBlob);
    const channelData = audioBuffer.getChannelData(0);
    
    const events: GameEvent[] = [];
    const windowSize = Math.floor(audioBuffer.sampleRate * 0.5); // 500ms windows
    const threshold = sensitivity * 0.3; // Adjusted threshold for RMS values

    // Calculate baseline RMS
    let totalRms = 0;
    let windowCount = 0;
    for (let i = 0; i < channelData.length; i += windowSize) {
      const window = channelData.slice(i, i + windowSize);
      totalRms += this.calculateRMS(window);
      windowCount++;
    }
    const avgRms = totalRms / windowCount;
    const dynamicThreshold = avgRms * (2 + sensitivity * 3);

    for (let i = 0; i < channelData.length; i += windowSize) {
      const window = channelData.slice(i, i + windowSize);
      const rms = this.calculateRMS(window);

      if (rms > Math.max(threshold, dynamicThreshold)) {
        const timestamp = (i / audioBuffer.sampleRate) * 1000;
        const normalizedScore = Math.min(1, rms / (avgRms * 5));
        
        events.push({
          id: `audio-${Date.now()}-${i}`,
          timestamp,
          type: 'KILL', // Default - will be refined by visual analysis
          score: Math.min(10, Math.floor(normalizedScore * 10)),
          confidence: normalizedScore,
          audioSpike: true
        });
      }
    }

    // Merge nearby events (within 2 seconds)
    return this.mergeNearbyEvents(events, 2000);
  }

  private async extractAudio(videoBlob: Blob): Promise<AudioBuffer> {
    const audioContext = this.getAudioContext();
    const arrayBuffer = await videoBlob.arrayBuffer();
    return await audioContext.decodeAudioData(arrayBuffer);
  }

  private calculateRMS(samples: Float32Array): number {
    let sum = 0;
    for (let i = 0; i < samples.length; i++) {
      sum += samples[i] * samples[i];
    }
    return Math.sqrt(sum / samples.length);
  }

  private mergeNearbyEvents(events: GameEvent[], threshold: number): GameEvent[] {
    if (events.length === 0) return [];

    const merged: GameEvent[] = [];
    let current = events[0];

    for (let i = 1; i < events.length; i++) {
      if (events[i].timestamp - current.timestamp < threshold) {
        // Merge - keep higher score
        if (events[i].score > current.score) {
          current = {
            ...events[i],
            confidence: Math.min(1, current.confidence + events[i].confidence * 0.3)
          };
        } else {
          current = {
            ...current,
            confidence: Math.min(1, current.confidence + events[i].confidence * 0.3)
          };
        }
      } else {
        merged.push(current);
        current = events[i];
      }
    }

    merged.push(current);
    return merged;
  }

  // Web Speech API for subtitles (browser native)
  async generateSubtitles(videoBlob: Blob): Promise<SubtitleSegment[]> {
    // Check if Web Speech API is available
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.warn('Speech recognition not supported in this browser');
      return [];
    }

    return new Promise((resolve, reject) => {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      const subtitles: SubtitleSegment[] = [];
      let sessionStartTime = 0;
      let segmentStartTime = 0;

      recognition.onresult = (event: any) => {
        const currentTime = Date.now() - sessionStartTime;
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript.trim();
          
          if (event.results[i].isFinal && transcript) {
            subtitles.push({
              start: segmentStartTime,
              end: currentTime,
              text: transcript
            });
            segmentStartTime = currentTime;
          }
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        // Don't reject - just return what we have
        resolve(subtitles);
      };

      recognition.onend = () => {
        resolve(subtitles);
      };

      // Create audio element to play video for speech recognition
      const audio = new Audio(URL.createObjectURL(videoBlob));
      
      audio.onplay = () => {
        sessionStartTime = Date.now();
        segmentStartTime = 0;
        try {
          recognition.start();
        } catch (e) {
          console.warn('Could not start speech recognition:', e);
          resolve([]);
        }
      };
      
      audio.onended = () => {
        try {
          recognition.stop();
        } catch (e) {
          // Ignore
        }
        URL.revokeObjectURL(audio.src);
      };
      
      audio.onerror = () => {
        URL.revokeObjectURL(audio.src);
        resolve([]);
      };

      // Play audio (muted visual feedback, recognition still works)
      audio.volume = 0.1;
      audio.play().catch(() => {
        URL.revokeObjectURL(audio.src);
        resolve([]);
      });

      // Timeout after video duration + buffer
      setTimeout(() => {
        try {
          recognition.stop();
          audio.pause();
          URL.revokeObjectURL(audio.src);
        } catch (e) {
          // Ignore
        }
      }, 120000); // 2 minute max
    });
  }

  dispose(): void {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

export const clipAudioAnalyzer = new ClipAudioAnalyzer();
