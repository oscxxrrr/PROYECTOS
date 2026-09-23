import { Appraisal, AppraisalPhoto } from '../../types';

const DB_NAME = 'peritatges_menorca_db';
const DB_VERSION = 1;
const STORE_APPRAISALS = 'appraisals';
const STORE_SYNC_QUEUE = 'sync_queue';

export class IndexedDbStorage {
  private dbPromise: Promise<IDBDatabase>;

  constructor() {
    this.dbPromise = this.initDb();
  }

  private initDb(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        reject(new Error('IndexedDB no está soportado en este entorno'));
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_APPRAISALS)) {
          const appraisalsStore = db.createObjectStore(STORE_APPRAISALS, { keyPath: 'plate' });
          appraisalsStore.createIndex('updatedAt', 'updatedAt', { unique: false });
          appraisalsStore.createIndex('userId', 'userId', { unique: false });
        }
        if (!db.objectStoreNames.contains(STORE_SYNC_QUEUE)) {
          db.createObjectStore(STORE_SYNC_QUEUE, { keyPath: 'id', autoIncrement: true });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllAppraisals(): Promise<Appraisal[]> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_APPRAISALS, 'readonly');
      const store = tx.objectStore(STORE_APPRAISALS);
      const request = store.getAll();
      request.onsuccess = () => {
        const results: Appraisal[] = request.result || [];
        // Sort newest first
        results.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        resolve(results);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getAppraisal(plate: string): Promise<Appraisal | null> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_APPRAISALS, 'readonly');
      const store = tx.objectStore(STORE_APPRAISALS);
      const request = store.get(plate);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async saveAppraisal(appraisal: Appraisal): Promise<void> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_APPRAISALS, STORE_SYNC_QUEUE], 'readwrite');
      const store = tx.objectStore(STORE_APPRAISALS);
      const queueStore = tx.objectStore(STORE_SYNC_QUEUE);

      store.put(appraisal);
      if (!appraisal.synced) {
        queueStore.put({
          type: 'UPSERT_APPRAISAL',
          plate: appraisal.plate,
          timestamp: new Date().toISOString()
        });
      }

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async deleteAppraisal(plate: string): Promise<void> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_APPRAISALS, STORE_SYNC_QUEUE], 'readwrite');
      const store = tx.objectStore(STORE_APPRAISALS);
      const queueStore = tx.objectStore(STORE_SYNC_QUEUE);

      store.delete(plate);
      queueStore.put({
        type: 'DELETE_APPRAISAL',
        plate,
        timestamp: new Date().toISOString()
      });

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async getSyncQueueCount(): Promise<number> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_SYNC_QUEUE, 'readonly');
      const store = tx.objectStore(STORE_SYNC_QUEUE);
      const request = store.count();
      request.onsuccess = () => resolve(request.result || 0);
      request.onerror = () => reject(request.error);
    });
  }

  async clearSyncQueue(): Promise<void> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_SYNC_QUEUE, 'readwrite');
      const store = tx.objectStore(STORE_SYNC_QUEUE);
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}
