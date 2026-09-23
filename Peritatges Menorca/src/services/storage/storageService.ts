import { Appraisal, AppraisalPhoto, SyncState } from '../../types';
import { IndexedDbStorage } from './indexedDbStorage';

class StorageService {
  private indexedDb = new IndexedDbStorage();
  private syncState: SyncState = 'synced';
  private listeners: ((state: SyncState) => void)[] = [];

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleNetworkChange());
      window.addEventListener('offline', () => this.handleNetworkChange());
      this.handleNetworkChange();
    }
  }

  public subscribeSyncState(callback: (state: SyncState) => void): () => void {
    this.listeners.push(callback);
    callback(this.syncState);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  private setSyncState(newState: SyncState) {
    this.syncState = newState;
    this.listeners.forEach(cb => cb(newState));
  }

  public getSyncState(): SyncState {
    return this.syncState;
  }

  private async handleNetworkChange() {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      this.setSyncState('offline');
      return;
    }

    // When online, check pending queue
    const pendingCount = await this.indexedDb.getSyncQueueCount();
    if (pendingCount > 0) {
      this.setSyncState('pending');
      this.syncPendingData();
    } else {
      this.setSyncState('synced');
    }
  }

  /**
   * Syncs locally saved appraisals with the server if accessible
   */
  public async syncPendingData(): Promise<void> {
    if (typeof navigator !== 'undefined' && !navigator.onLine) return;

    try {
      const appraisals = await this.indexedDb.getAllAppraisals();
      const unsynced = appraisals.filter(a => !a.synced);

      for (const appraisal of unsynced) {
        try {
          const res = await fetch('/api/appraisals', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(appraisal)
          });
          if (res.ok) {
            appraisal.synced = true;
            await this.indexedDb.saveAppraisal(appraisal);
          }
        } catch {
          // Server might be offline or running standalone client mode
          break;
        }
      }

      const pendingCount = await this.indexedDb.getSyncQueueCount();
      this.setSyncState(pendingCount > 0 ? 'pending' : 'synced');
    } catch (err) {
      console.warn('Error durante la sincronización:', err);
      this.setSyncState('pending');
    }
  }

  /**
   * Retrieves all vehicle appraisals
   */
  async getAppraisals(): Promise<Appraisal[]> {
    return this.indexedDb.getAllAppraisals();
  }

  /**
   * Retrieves a single appraisal by license plate
   */
  async getAppraisalByPlate(plate: string): Promise<Appraisal | null> {
    return this.indexedDb.getAppraisal(plate);
  }

  /**
   * Saves or creates a new vehicle appraisal with strictly normalized plate folder
   */
  async saveAppraisal(plate: string, newPhotos: AppraisalPhoto[], userId = 'user_1', userName = 'Perito Menorca'): Promise<Appraisal> {
    const cleanPlate = plate.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const existing = await this.indexedDb.getAppraisal(cleanPlate);

    const now = new Date().toISOString();
    let updatedPhotos: AppraisalPhoto[] = [];

    if (existing) {
      // Append to existing folder, continue sequential numbering
      const startIndex = existing.photos.length;
      const renumberedNewPhotos = newPhotos.map((p, idx) => ({
        ...p,
        filename: `foto_${String(startIndex + idx + 1).padStart(3, '0')}.jpg`
      }));
      updatedPhotos = [...existing.photos, ...renumberedNewPhotos];
    } else {
      // First time creation: sequential numbering starting at 001
      updatedPhotos = newPhotos.map((p, idx) => ({
        ...p,
        filename: `foto_${String(idx + 1).padStart(3, '0')}.jpg`
      }));
    }

    const totalSizeBytes = updatedPhotos.reduce((sum, p) => sum + (p.sizeBytes || 0), 0);

    const appraisal: Appraisal = {
      id: existing ? existing.id : `appr_${Date.now()}_${cleanPlate}`,
      plate: cleanPlate,
      folderName: cleanPlate, // STRICT RULE: Folder name is ONLY the license plate
      createdAt: existing ? existing.createdAt : now,
      updatedAt: now,
      userId,
      userName,
      photos: updatedPhotos,
      photoCount: updatedPhotos.length,
      totalSizeBytes,
      synced: false
    };

    await this.indexedDb.saveAppraisal(appraisal);
    this.handleNetworkChange();
    return appraisal;
  }

  /**
   * Deletes an entire vehicle appraisal
   */
  async deleteAppraisal(plate: string): Promise<void> {
    await this.indexedDb.deleteAppraisal(plate);
    this.handleNetworkChange();
  }

  /**
   * Deletes a specific photo from an appraisal
   */
  async deletePhoto(plate: string, photoId: string): Promise<Appraisal | null> {
    const appraisal = await this.indexedDb.getAppraisal(plate);
    if (!appraisal) return null;

    appraisal.photos = appraisal.photos.filter(p => p.id !== photoId);
    appraisal.photoCount = appraisal.photos.length;
    appraisal.totalSizeBytes = appraisal.photos.reduce((sum, p) => sum + p.sizeBytes, 0);
    appraisal.updatedAt = new Date().toISOString();
    appraisal.synced = false;

    await this.indexedDb.saveAppraisal(appraisal);
    this.handleNetworkChange();
    return appraisal;
  }

  /**
   * Calculates overall storage statistics
   */
  async getStorageStats(): Promise<{ totalAppraisals: number; totalPhotos: number; totalBytes: number; originalBytes: number; savedBytes: number }> {
    const all = await this.indexedDb.getAllAppraisals();
    let totalPhotos = 0;
    let totalBytes = 0;
    let originalBytes = 0;

    all.forEach(a => {
      totalPhotos += a.photos.length;
      a.photos.forEach(p => {
        totalBytes += p.sizeBytes || 0;
        originalBytes += p.originalSizeBytes || p.sizeBytes || 0;
      });
    });

    return {
      totalAppraisals: all.length,
      totalPhotos,
      totalBytes,
      originalBytes,
      savedBytes: Math.max(0, originalBytes - totalBytes)
    };
  }
}

export const storageService = new StorageService();
