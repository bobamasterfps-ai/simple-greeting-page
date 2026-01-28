import type { ClipData, UserClipSettings, VideoStorageItem } from '@/types/clipTypes';

const DB_NAME = 'ValorantClipsDB';
const DB_VERSION = 1;

class ClipIndexedDBManager {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores
        if (!db.objectStoreNames.contains('videos')) {
          db.createObjectStore('videos', { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains('clips')) {
          const clipStore = db.createObjectStore('clips', { keyPath: 'id' });
          clipStore.createIndex('sourceVideoId', 'sourceVideoId', { unique: false });
          clipStore.createIndex('status', 'status', { unique: false });
        }

        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'id' });
        }
      };
    });
  }

  async saveVideo(id: string, videoBlob: Blob, fileName?: string): Promise<void> {
    if (!this.db) await this.init();
    
    const transaction = this.db!.transaction(['videos'], 'readwrite');
    const store = transaction.objectStore('videos');

    const item: VideoStorageItem = {
      id,
      blob: videoBlob,
      uploadedAt: new Date(),
      fileName,
      fileSize: videoBlob.size
    };

    return new Promise((resolve, reject) => {
      const request = store.put(item);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getVideo(id: string): Promise<Blob | null> {
    if (!this.db) await this.init();
    
    const transaction = this.db!.transaction(['videos'], 'readonly');
    const store = transaction.objectStore('videos');

    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => {
        resolve(request.result?.blob || null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async deleteVideo(id: string): Promise<void> {
    if (!this.db) await this.init();
    
    const transaction = this.db!.transaction(['videos'], 'readwrite');
    const store = transaction.objectStore('videos');

    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async saveClip(clip: ClipData): Promise<void> {
    if (!this.db) await this.init();
    
    const transaction = this.db!.transaction(['clips'], 'readwrite');
    const store = transaction.objectStore('clips');

    return new Promise((resolve, reject) => {
      const request = store.put(clip);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getClip(id: string): Promise<ClipData | null> {
    if (!this.db) await this.init();
    
    const transaction = this.db!.transaction(['clips'], 'readonly');
    const store = transaction.objectStore('clips');

    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllClips(): Promise<ClipData[]> {
    if (!this.db) await this.init();
    
    const transaction = this.db!.transaction(['clips'], 'readonly');
    const store = transaction.objectStore('clips');

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getClipsByStatus(status: ClipData['status']): Promise<ClipData[]> {
    if (!this.db) await this.init();
    
    const transaction = this.db!.transaction(['clips'], 'readonly');
    const store = transaction.objectStore('clips');
    const index = store.index('status');

    return new Promise((resolve, reject) => {
      const request = index.getAll(status);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteClip(id: string): Promise<void> {
    if (!this.db) await this.init();
    
    const transaction = this.db!.transaction(['clips'], 'readwrite');
    const store = transaction.objectStore('clips');

    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async saveSettings(settings: UserClipSettings): Promise<void> {
    if (!this.db) await this.init();
    
    const transaction = this.db!.transaction(['settings'], 'readwrite');
    const store = transaction.objectStore('settings');

    return new Promise((resolve, reject) => {
      const request = store.put({ id: 'user-settings', ...settings });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getSettings(): Promise<UserClipSettings | null> {
    if (!this.db) await this.init();
    
    const transaction = this.db!.transaction(['settings'], 'readonly');
    const store = transaction.objectStore('settings');

    return new Promise((resolve, reject) => {
      const request = store.get('user-settings');
      request.onsuccess = () => {
        const result = request.result;
        if (result) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { id, ...settings } = result;
          resolve(settings as UserClipSettings);
        } else {
          resolve(null);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  async clearAllData(): Promise<void> {
    if (!this.db) await this.init();
    
    const stores = ['videos', 'clips', 'settings'];
    
    for (const storeName of stores) {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      await new Promise<void>((resolve, reject) => {
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }
  }
}

export const clipDBManager = new ClipIndexedDBManager();
