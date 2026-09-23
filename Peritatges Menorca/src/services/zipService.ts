import JSZip from 'jszip';
import { Appraisal } from '../types';

/**
 * Converts a dataUrl (base64) to a pure binary Uint8Array for fast JSZip bundling
 */
function dataUrlToUint8Array(dataUrl: string): Uint8Array {
  const base64Index = dataUrl.indexOf(',');
  const base64 = base64Index !== -1 ? dataUrl.slice(base64Index + 1) : dataUrl;
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Triggers a browser download of a generated Blob
 */
function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/**
 * Generates and downloads a ZIP file for a single appraisal
 * Structure:
 * 1234ABC.zip
 * └── 1234ABC/
 *     ├── foto_001.jpg
 *     └── foto_002.jpg
 */
export async function downloadSingleAppraisalZip(
  appraisal: Appraisal,
  onProgress?: (percent: number, status: string) => void
): Promise<void> {
  const zip = new JSZip();
  const folder = zip.folder(appraisal.plate);

  if (!folder) {
    throw new Error('No se pudo crear la carpeta ZIP');
  }

  const totalPhotos = appraisal.photos.length;
  for (let i = 0; i < totalPhotos; i++) {
    const photo = appraisal.photos[i];
    const bytes = dataUrlToUint8Array(photo.dataUrl);
    folder.file(photo.filename, bytes, { binary: true });

    if (onProgress) {
      const pct = Math.round(((i + 1) / totalPhotos) * 50);
      onProgress(pct, `Empaquetando ${photo.filename}...`);
    }
  }

  if (onProgress) onProgress(60, 'Comprimiendo archivo ZIP...');

  const content = await zip.generateAsync(
    {
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 }
    },
    (metadata) => {
      if (onProgress) {
        const pct = 60 + Math.round((metadata.percent * 0.4));
        onProgress(pct, `Generando ZIP: ${Math.round(metadata.percent)}%`);
      }
    }
  );

  triggerDownload(content, `${appraisal.plate}.zip`);
  if (onProgress) onProgress(100, 'Descarga iniciada');
}

/**
 * Generates and downloads a bulk ZIP containing ALL vehicle appraisals
 * Structure:
 * PERITAJES_MENORCA_YYYY-MM-DD.zip
 * ├── 1234ABC/
 * │   ├── foto_001.jpg
 * │   └── foto_002.jpg
 * └── 5678DEF/
 *     ├── foto_001.jpg
 *     └── foto_002.jpg
 */
export async function downloadBulkAppraisalsZip(
  appraisals: Appraisal[],
  onProgress?: (percent: number, status: string) => void
): Promise<void> {
  if (appraisals.length === 0) {
    throw new Error('No hay peritajes para descargar');
  }

  const zip = new JSZip();
  let totalProcessed = 0;
  const totalPhotosOverall = appraisals.reduce((acc, a) => acc + a.photos.length, 0);

  for (const appraisal of appraisals) {
    const folder = zip.folder(appraisal.plate);
    if (!folder) continue;

    for (const photo of appraisal.photos) {
      const bytes = dataUrlToUint8Array(photo.dataUrl);
      folder.file(photo.filename, bytes, { binary: true });
      totalProcessed++;

      if (onProgress && totalPhotosOverall > 0) {
        const pct = Math.round((totalProcessed / totalPhotosOverall) * 60);
        onProgress(pct, `Empaquetando ${appraisal.plate}/${photo.filename}...`);
      }
    }
  }

  if (onProgress) onProgress(65, 'Comprimiendo archivo masivo...');

  const dateStr = new Date().toISOString().split('T')[0];
  const zipFilename = `PERITAJES_MENORCA_${dateStr}.zip`;

  const content = await zip.generateAsync(
    {
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 }
    },
    (metadata) => {
      if (onProgress) {
        const pct = 65 + Math.round((metadata.percent * 0.35));
        onProgress(pct, `Comprimiendo: ${Math.round(metadata.percent)}%`);
      }
    }
  );

  triggerDownload(content, zipFilename);
  if (onProgress) onProgress(100, '¡Descarga completa!');
}
