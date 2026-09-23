import { CompressionSettings } from '../types';

export const DEFAULT_COMPRESSION_SETTINGS: CompressionSettings = {
  maxDimension: 1920,
  quality: 0.80,
  format: 'image/jpeg'
};

export interface CompressionResult {
  blob: Blob;
  dataUrl: string;
  sizeBytes: number;
  originalSizeBytes: number;
  savedPercentage: number;
  width: number;
  height: number;
}

/**
 * Compresses an image blob/file on the client using an offscreen canvas.
 * Strips unnecessary EXIF metadata, downsizes to maxDimension, and applies JPEG/WebP compression.
 */
export async function compressImage(
  imageSource: Blob | File | string,
  settings: CompressionSettings = DEFAULT_COMPRESSION_SETTINGS
): Promise<CompressionResult> {
  const originalSizeBytes = typeof imageSource === 'string' 
    ? Math.round(imageSource.length * 0.75) 
    : imageSource.size;

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      let width = img.naturalWidth || img.width;
      let height = img.naturalHeight || img.height;

      // Calculate new dimensions preserving aspect ratio
      if (width > settings.maxDimension || height > settings.maxDimension) {
        if (width > height) {
          height = Math.round((height * settings.maxDimension) / width);
          width = settings.maxDimension;
        } else {
          width = Math.round((width * settings.maxDimension) / height);
          height = settings.maxDimension;
        }
      }

      // Draw onto canvas with smoothing enabled
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d', { alpha: false });

      if (!ctx) {
        reject(new Error('No se pudo inicializar el contexto de imagen 2D'));
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      // Convert to blob and dataUrl
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Fallo al comprimir la imagen'));
            return;
          }

          const reader = new FileReader();
          reader.onloadend = () => {
            const dataUrl = reader.result as string;
            const sizeBytes = blob.size;
            const savedPercentage = originalSizeBytes > 0
              ? Math.max(0, Math.round(((originalSizeBytes - sizeBytes) / originalSizeBytes) * 100))
              : 0;

            resolve({
              blob,
              dataUrl,
              sizeBytes,
              originalSizeBytes,
              savedPercentage,
              width,
              height
            });
          };
          reader.onerror = () => reject(new Error('Error al leer el archivo comprimido'));
          reader.readAsDataURL(blob);
        },
        settings.format,
        settings.quality
      );
    };

    img.onerror = () => reject(new Error('Error al cargar la imagen original para compresión'));

    if (typeof imageSource === 'string') {
      img.src = imageSource;
    } else {
      img.src = URL.createObjectURL(imageSource);
    }
  });
}

/**
 * Format bytes to readable string (KB, MB)
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}
