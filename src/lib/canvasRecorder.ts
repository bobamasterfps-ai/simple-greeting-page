/**
 * Canvas Recorder - Record canvas animations to video
 * Supports WebM export with watermark
 */

export interface RecordingOptions {
  duration: number;
  framerate?: number;
  mimeType?: string;
}

/**
 * Record a canvas element to a video blob
 */
export async function recordCanvas(
  canvas: HTMLCanvasElement,
  options: RecordingOptions
): Promise<Blob> {
  const { duration, framerate = 60, mimeType = 'video/webm;codecs=vp9' } = options;

  return new Promise((resolve, reject) => {
    try {
      const stream = canvas.captureStream(framerate);
      const recorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported(mimeType) ? mimeType : 'video/webm',
        videoBitsPerSecond: 5000000, // 5 Mbps for quality
      });

      const chunks: Blob[] = [];
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        resolve(blob);
      };

      recorder.onerror = (e) => {
        reject(new Error(`Recording failed: ${e}`));
      };

      recorder.start(100); // Collect data every 100ms

      setTimeout(() => {
        recorder.stop();
      }, duration);
    } catch (e) {
      reject(e);
    }
  });
}

/**
 * Download a blob as a file
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Check if canvas recording is supported
 */
export function isRecordingSupported(): boolean {
  return typeof HTMLCanvasElement.prototype.captureStream === 'function' &&
         typeof MediaRecorder !== 'undefined';
}
