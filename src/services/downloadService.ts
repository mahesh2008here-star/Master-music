import { Track, LyricsData } from '../types/music';
import { fetchLyricsFromLrclib } from './lrclibService';
import { newpipeService } from './newpipeService';

export interface DownloadedItem {
  id: string;
  track: Track;
  audioBlob?: Blob;
  blobUrl?: string;
  artworkDataUrl?: string;
  lyricsData?: LyricsData;
  downloadedAt: string;
  fileSizeBytes: number;
  fileExt?: string;
  artworkMerged?: boolean;
  savedToDevice?: boolean;
}

const DB_NAME = 'masterwave_offline_db';
const STORE_NAME = 'downloads';
const DB_VERSION = 2;
const AUTO_SAVE_DEVICE_KEY = 'masterwave_autosave_device_storage';

class MasterWaveDownloadService {
  private dbPromise: Promise<IDBDatabase> | null = null;
  private memoryCache: Map<string, DownloadedItem> = new Map();

  constructor() {
    this.initDB();
  }

  private initDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        reject(new Error('IndexedDB not supported'));
        return;
      }

      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    return this.dbPromise;
  }

  public getAutoSaveToDevice(): boolean {
    try {
      const v = localStorage.getItem(AUTO_SAVE_DEVICE_KEY);
      return v === null ? true : v === 'true';
    } catch {
      return true;
    }
  }

  public setAutoSaveToDevice(enabled: boolean) {
    try {
      localStorage.setItem(AUTO_SAVE_DEVICE_KEY, String(enabled));
    } catch {
      // ignore storage failure
    }
  }

  public async getAllDownloads(): Promise<DownloadedItem[]> {
    try {
      const db = await this.initDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.getAll();

        req.onsuccess = () => {
          const items: DownloadedItem[] = req.result || [];
          items.forEach((item) => {
            if (item.audioBlob && !item.blobUrl) {
              item.blobUrl = URL.createObjectURL(item.audioBlob);
            }
            this.memoryCache.set(item.id, item);
          });
          resolve(items);
        };

        req.onerror = () => reject(req.error);
      });
    } catch {
      return Array.from(this.memoryCache.values());
    }
  }

  public isDownloaded(trackId: string): boolean {
    return this.memoryCache.has(trackId);
  }

  public getDownloadedTrack(trackId: string): DownloadedItem | undefined {
    return this.memoryCache.get(trackId);
  }

  private getSafeFileName(track: Track, ext: string): string {
    const cleanArtist = (track.artist || 'Artist').replace(/[\\/:*?"<>|]/g, '').trim();
    const cleanTitle = (track.title || 'Track').replace(/[\\/:*?"<>|]/g, '').trim();
    return `${cleanArtist} - ${cleanTitle}.${ext}`;
  }

  public async saveItemToDeviceStorage(item: DownloadedItem): Promise<boolean> {
    if (!item.audioBlob || item.audioBlob.size < 1024) return false;
    const ext = item.fileExt || (item.audioBlob.type.includes('mpeg') ? 'mp3' : 'm4a');
    const filename = this.getSafeFileName(item.track, ext);

    try {
      const win = window as unknown as {
        showSaveFilePicker?: (opts: {
          suggestedName: string;
          types: Array<{ description: string; accept: Record<string, string[]> }>;
        }) => Promise<{
          createWritable: () => Promise<{ write: (data: Blob) => Promise<void>; close: () => Promise<void> }>;
        }>;
      };

      // Use native Save File Picker when top-level window permits, else standard Download anchor to Internal Storage Downloads
      if (typeof win.showSaveFilePicker === 'function' && window.self === window.top) {
        const handle = await win.showSaveFilePicker({
          suggestedName: filename,
          types: [
            {
              description: ext === 'mp3' ? 'MP3 Audio with Cover' : 'M4A Audio with Cover',
              accept: { [ext === 'mp3' ? 'audio/mpeg' : 'audio/mp4']: [`.${ext}`] }
            }
          ]
        });
        const writable = await handle.createWritable();
        await writable.write(item.audioBlob);
        await writable.close();
      } else {
        const url = item.blobUrl || URL.createObjectURL(item.audioBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        if (!item.blobUrl) {
          setTimeout(() => URL.revokeObjectURL(url), 4000);
        }
      }

      const updated: DownloadedItem = { ...item, savedToDevice: true };
      this.memoryCache.set(item.id, updated);
      const db = await this.initDB();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put({ ...updated, blobUrl: undefined });
      return true;
    } catch {
      return false;
    }
  }

  public async downloadTrack(
    track: Track,
    options?: { saveToDevice?: boolean }
  ): Promise<DownloadedItem> {
    // 1. Fetch lyrics for offline cache
    let lyricsData: LyricsData | undefined;
    try {
      lyricsData = await fetchLyricsFromLrclib(
        track.title,
        track.artist,
        track.album,
        track.duration,
        track.id
      );
    } catch {
      // Ignore if offline
    }

    // 2. Ensure track has a real playable audio stream URL before downloading (handles unplayed NewPipe tracks)
    let resolvedStreamUrl = track.streamUrl || '';
    let resolvedArtworkUrl = track.artworkUrl;
    if (!resolvedStreamUrl && track.provider === 'newpipe' && track.newpipeVideoId) {
      const res = await newpipeService.resolveStream(
        track.newpipeVideoId,
        track.title,
        track.artist
      );
      if (res.resolved && res.audioStreams.length > 0) {
        resolvedStreamUrl = res.audioStreams[0].url;
        if (res.artworkUrl) resolvedArtworkUrl = res.artworkUrl;
      }
    }
    if (!resolvedStreamUrl) {
      const fallback = await newpipeService.resolveByQuery(`${track.title} ${track.artist}`);
      if (fallback.resolved && fallback.audioStreams.length > 0) {
        resolvedStreamUrl = fallback.audioStreams[0].url;
        if (fallback.artworkUrl) resolvedArtworkUrl = fallback.artworkUrl;
      }
    }

    // 3. Convert high-res artwork into inline Data URL so artwork renders cleanly 100% offline
    let artworkDataUrl = resolvedArtworkUrl;
    try {
      const artRes = await fetch(resolvedArtworkUrl);
      if (artRes.ok) {
        const artBlob = await artRes.blob();
        artworkDataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve((reader.result as string) || resolvedArtworkUrl);
          reader.readAsDataURL(artBlob);
        });
      }
    } catch {
      // keep resolved URL fallback
    }

    // 4. Request FFmpeg server-side muxing so audio + embedded thumbnail cover + ID3/MP4 tags are merged into ONE file!
    let audioBlob: Blob | null = null;
    let fileExt = 'm4a';
    let artworkMerged = false;

    if (resolvedStreamUrl) {
      try {
        const muxRes = await fetch('/api/downloads/mux', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            streamUrl: resolvedStreamUrl,
            artworkUrl: resolvedArtworkUrl,
            title: track.title,
            artist: track.artist,
            album: track.album
          })
        });
        if (muxRes.ok) {
          const blob = await muxRes.blob();
          if (blob.size > 4096 && !blob.type.includes('text/html')) {
            audioBlob = blob;
            fileExt = muxRes.headers.get('X-File-Ext') || (blob.type.includes('mpeg') ? 'mp3' : 'm4a');
            artworkMerged = muxRes.headers.get('X-Artwork-Merged') === 'true';
          }
        }
      } catch {
        // Fallback below
      }

      // Direct audio fetch fallback if mux endpoint unavailable
      if (!audioBlob) {
        try {
          const rawRes = await fetch(resolvedStreamUrl);
          if (rawRes.ok) {
            const blob = await rawRes.blob();
            if (blob.size > 4096 && !blob.type.includes('text/html')) {
              audioBlob = blob;
              fileExt = blob.type.includes('mpeg') ? 'mp3' : 'm4a';
            }
          }
        } catch {
          // ignore
        }
      }
    }

    if (!audioBlob) {
      throw new Error(`Could not download audio stream for "${track.title}".`);
    }

    const blobUrl = URL.createObjectURL(audioBlob);
    const shouldSaveToDevice = options?.saveToDevice ?? this.getAutoSaveToDevice();

    const downloadedItem: DownloadedItem = {
      id: track.id,
      track: {
        ...track,
        streamUrl: resolvedStreamUrl,
        artworkUrl: artworkDataUrl
      },
      audioBlob,
      blobUrl,
      artworkDataUrl,
      lyricsData,
      downloadedAt: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }),
      fileSizeBytes: audioBlob.size,
      fileExt,
      artworkMerged,
      savedToDevice: false
    };

    // Persist in memory + IndexedDB first so offline playback works immediately
    this.memoryCache.set(track.id, downloadedItem);
    try {
      const db = await this.initDB();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put({
        ...downloadedItem,
        blobUrl: undefined
      });
    } catch (e) {
      console.warn('Failed to store in IndexedDB, retained in memory:', e);
    }

    // Automatically save merged audio+artwork file to mobile internal storage Downloads
    if (shouldSaveToDevice) {
      await this.saveItemToDeviceStorage(downloadedItem);
    }

    return this.memoryCache.get(track.id) || downloadedItem;
  }

  public async removeDownload(trackId: string): Promise<void> {
    const item = this.memoryCache.get(trackId);
    if (item?.blobUrl) {
      URL.revokeObjectURL(item.blobUrl);
    }
    this.memoryCache.delete(trackId);

    try {
      const db = await this.initDB();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(trackId);
    } catch (e) {
      console.warn('Failed to delete from IndexedDB:', e);
    }
  }

  public getTotalStorageBytes(): number {
    let total = 0;
    this.memoryCache.forEach((item) => {
      total += item.fileSizeBytes || 0;
    });
    return total;
  }
}

export const downloadService = new MasterWaveDownloadService();
