/**
 * Audio peak detection for highlight moments
 * Uses Web Audio API for browser-based analysis
 */

interface AudioPeak {
  timestamp: number; // seconds
  intensity: number; // 0-1
}

/**
 * Detect audio peaks in a video for highlight detection
 * Uses MediaElementSource for blob-based video analysis
 */
export async function detectAudioPeaks(
  video: HTMLVideoElement,
  threshold: number = 165
): Promise<AudioPeak[]> {
  // Create audio context
  const audioContext = new AudioContext();
  
  // Create media element source from video
  const source = audioContext.createMediaElementSource(video);
  const analyser = audioContext.createAnalyser();
  
  // Connect the audio graph
  source.connect(analyser);
  analyser.connect(audioContext.destination);
  
  // Configure analyser
  analyser.fftSize = 2048;
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);
  
  const peaks: AudioPeak[] = [];
  let isScanning = true;
  
  return new Promise((resolve) => {
    function scan() {
      if (!isScanning) {
        audioContext.close();
        resolve(peaks);
        return;
      }
      
      analyser.getByteFrequencyData(dataArray);
      
      // Calculate average volume
      const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
      
      // Detect peak above threshold
      if (average > threshold) {
        peaks.push({
          timestamp: video.currentTime,
          intensity: Math.min(1, average / 255)
        });
      }
      
      requestAnimationFrame(scan);
    }
    
    // Start scanning
    scan();
    
    // Stop when video ends
    video.addEventListener('ended', () => {
      isScanning = false;
    }, { once: true });
    
    // Safety timeout (2 min max)
    setTimeout(() => {
      isScanning = false;
    }, 120000);
  });
}

/**
 * Simplified audio peak detection that returns timestamps only
 */
export async function findHighlightTimestamps(
  videoBlob: Blob,
  sensitivity: number = 0.7
): Promise<number[]> {
  // Create video element from blob
  const video = document.createElement('video');
  video.src = URL.createObjectURL(videoBlob);
  video.muted = false; // Need audio for analysis
  video.volume = 0.1; // Low volume for background processing
  
  await new Promise<void>((resolve, reject) => {
    video.onloadedmetadata = () => resolve();
    video.onerror = () => reject(new Error('Failed to load video'));
  });
  
  // Calculate threshold based on sensitivity (0.5-1 sensitivity = 100-200 threshold)
  const threshold = 100 + (1 - sensitivity) * 100;
  
  // Play video to enable audio analysis
  try {
    await video.play();
  } catch (e) {
    console.warn('Video autoplay blocked, analysis may be incomplete');
  }
  
  const peaks = await detectAudioPeaks(video, threshold);
  
  // Cleanup
  video.pause();
  URL.revokeObjectURL(video.src);
  
  // Return just the timestamps, deduped within 2 second windows
  const timestamps: number[] = [];
  let lastTimestamp = -2;
  
  for (const peak of peaks) {
    if (peak.timestamp - lastTimestamp >= 2) {
      timestamps.push(peak.timestamp);
      lastTimestamp = peak.timestamp;
    }
  }
  
  return timestamps;
}
