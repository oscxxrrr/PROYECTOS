import {
  doc, setDoc, getDoc, getDocs, deleteDoc,
  collection, serverTimestamp
} from 'firebase/firestore';
import {
  ref, uploadString, getDownloadURL, deleteObject, listAll
} from 'firebase/storage';
import { db, storage, isConfigured } from './firebase';
import { Appraisal } from '../types';

/**
 * Cloud sync service using Firebase Firestore + Storage.
 * All data is namespaced under the user's UID for security.
 */
export const cloudSyncService = {
  isAvailable: () => isConfigured,

  /** Upload a full appraisal (metadata + photos) to Firestore + Storage */
  async uploadAppraisal(userId: string, appraisal: Appraisal): Promise<void> {
    if (!isConfigured) return;

    // Upload photos to Storage
    const uploadedPhotos = await Promise.all(
      appraisal.photos.map(async (photo) => {
        const photoRef = ref(storage, users///);
        await uploadString(photoRef, photo.dataUrl, 'data_url');
        const downloadUrl = await getDownloadURL(photoRef);
        return { ...photo, downloadUrl };
      })
    );

    // Save metadata to Firestore (without heavy dataUrl blobs)
    const meta = {
      ...appraisal,
      photos: uploadedPhotos.map(p => ({
        id: p.id,
        filename: p.filename,
        sizeBytes: p.sizeBytes,
        originalSizeBytes: p.originalSizeBytes,
        width: p.width,
        height: p.height,
        createdAt: p.createdAt,
        downloadUrl: (p as any).downloadUrl
      })),
      synced: true,
      cloudUpdatedAt: serverTimestamp()
    };

    await setDoc(
      doc(db, 'users', userId, 'appraisals', appraisal.plate),
      meta
    );
  },

  /** Download all appraisals for a user from Firestore */
  async downloadAllAppraisals(userId: string): Promise<Appraisal[]> {
    if (!isConfigured) return [];

    const snap = await getDocs(collection(db, 'users', userId, 'appraisals'));
    const appraisals: Appraisal[] = [];

    for (const docSnap of snap.docs) {
      const data = docSnap.data() as any;
      // Re-download photos as dataUrl for offline use
      const photos = await Promise.all(
        (data.photos || []).map(async (p: any) => {
          if (p.downloadUrl) {
            try {
              const response = await fetch(p.downloadUrl);
              const blob = await response.blob();
              const dataUrl = await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as string);
                reader.readAsDataURL(blob);
              });
              return { ...p, dataUrl };
            } catch {
              return { ...p, dataUrl: '' };
            }
          }
          return p;
        })
      );

      appraisals.push({ ...data, photos, synced: true });
    }

    return appraisals;
  },

  /** Delete an appraisal from Firestore + Storage */
  async deleteAppraisal(userId: string, plate: string): Promise<void> {
    if (!isConfigured) return;

    // Delete Firestore document
    await deleteDoc(doc(db, 'users', userId, 'appraisals', plate));

    // Delete all photos from Storage
    try {
      const folderRef = ref(storage, users//);
      const list = await listAll(folderRef);
      await Promise.all(list.items.map(item => deleteObject(item)));
    } catch {
      // Ignore storage errors (files may not exist)
    }
  },

  /** Check if an appraisal exists in the cloud */
  async getAppraisal(userId: string, plate: string): Promise<Appraisal | null> {
    if (!isConfigured) return null;
    const snap = await getDoc(doc(db, 'users', userId, 'appraisals', plate));
    if (!snap.exists()) return null;
    return snap.data() as Appraisal;
  }
};
