import { createWorker } from 'tesseract.js';

export interface OcrDetectionResult {
  success: boolean;
  plate?: string;
  rawText?: string;
  confidence?: number;
  error?: string;
}

/**
 * Regex patterns for Spanish / European license plates
 */
const PLATE_PATTERNS = [
  // Modern Spanish: 4 numbers + 3 consonants (excluding vowels, Ñ, Q)
  /\b(\d{4})\s*([BCDFGHJKLMNPRSTVWXYZ]{3})\b/i,
  // Provincial: 1 or 2 letters + 4-6 digits + 0-2 letters (IB, PM for Balears/Menorca)
  /\b(IB|PM|M|B|V|SE|Z|A|AL|AB|AV|BA|BI|BU|C|CA|CC|CS|CR|CO|CU|GI|GE|GR|GU|H|HU|J|L|LE|LO|LU|MA|ML|MU|NA|O|OR|OU|P|PO|S|SA|SG|SO|SS|T|TE|TF|TO|VA|VI|ZA|CE)\s*[- ]?\s*(\d{4,6})\s*[- ]?\s*([A-Z]{1,2})?\b/i,
  // Special / Remolques / Históricos: R1234BBB, E1234BBB, H1234BBB
  /\b([RECPTHV])\s*[- ]?\s*(\d{4})\s*[- ]?\s*([A-Z]{3})\b/i,
  // Generic European fallback: 1-3 letters, 1-4 digits, 1-2 letters
  /\b([A-Z]{1,3})\s*[- ]?\s*(\d{1,4})\s*[- ]?\s*([A-Z]{1,3})\b/i
];

/**
 * Normalizes a detected or manually entered plate string strictly to uppercase without symbols
 */
export function normalizePlate(plate: string): string {
  if (!plate) return '';
  return plate
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .trim();
}

/**
 * Validates if a string corresponds to a valid Spanish or European license plate
 */
export function isValidPlate(plate: string): boolean {
  const clean = normalizePlate(plate);
  if (!clean || clean.length < 5 || clean.length > 9) return false;

  // Modern Spanish check: 4 digits followed by 3 letters
  const modernRegex = /^\d{4}[A-Z]{3}$/;
  if (modernRegex.test(clean)) return true;

  // Provincial check (e.g. IB1234AB, PM123456, M1234AB)
  const provincialRegex = /^[A-Z]{1,2}\d{4,6}[A-Z]{0,2}$/;
  if (provincialRegex.test(clean)) return true;

  // Special / Remolque (e.g. R1234BBB)
  const specialRegex = /^[RECPTHV]\d{4}[A-Z]{3}$/;
  if (specialRegex.test(clean)) return true;

  // Generic backup: at least some digits and letters
  return /\d/.test(clean) && /[A-Z]/.test(clean);
}

/**
 * Preprocesses an image on canvas to boost license plate contrast (grayscale + adaptive binarization)
 */
async function preprocessForOcr(dataUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const scale = Math.min(1, 1200 / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      canvas.width = w;
      canvas.height = h;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUrl);
        return;
      }

      ctx.drawImage(img, 0, 0, w, h);
      const imgData = ctx.getImageData(0, 0, w, h);
      const d = imgData.data;

      // Enhance contrast and convert to grayscale
      for (let i = 0; i < d.length; i += 4) {
        const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
        // High contrast curve
        const enhanced = gray > 140 ? 255 : gray < 70 ? 0 : (gray - 70) * (255 / 70);
        d[i] = enhanced;
        d[i + 1] = enhanced;
        d[i + 2] = enhanced;
      }

      ctx.putImageData(imgData, 0, 0);
      resolve(canvas.toDataURL('image/jpeg', 0.9));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

/**
 * Extracts license plate from image using Tesseract.js OCR with regex parsing
 */
export async function detectPlateFromImage(imageDataUrl: string): Promise<OcrDetectionResult> {
  try {
    const processedUrl = await preprocessForOcr(imageDataUrl);

    // Run Tesseract worker
    const worker = await createWorker('spa', 1, {
      errorHandler: (err) => console.warn('Tesseract warning:', err)
    });

    await worker.setParameters({
      tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ -',
      tessedit_pageseg_mode: '1' as any
    });

    const ret = await Promise.race([
      worker.recognize(processedUrl),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Tiempo de espera agotado en OCR')), 10000)
      )
    ]);

    await worker.terminate();

    const rawText = ret.data.text || '';
    const cleanLines = rawText.split('\n').map(l => l.trim()).filter(Boolean);

    // 1. Try matching with strict regex patterns
    for (const pattern of PLATE_PATTERNS) {
      for (const line of cleanLines) {
        const match = line.match(pattern);
        if (match) {
          const matchedPlate = normalizePlate(match[0]);
          if (isValidPlate(matchedPlate)) {
            return {
              success: true,
              plate: matchedPlate,
              rawText,
              confidence: ret.data.confidence
            };
          }
        }
      }
      // Also match full text
      const fullMatch = rawText.match(pattern);
      if (fullMatch) {
        const matchedPlate = normalizePlate(fullMatch[0]);
        if (isValidPlate(matchedPlate)) {
          return {
            success: true,
            plate: matchedPlate,
            rawText,
            confidence: ret.data.confidence
          };
        }
      }
    }

    // 2. Fallback heuristic: check if any line looks like 4 digits + 3 letters
    const allAlphanumeric = rawText.replace(/[^A-Z0-9]/g, ' ');
    const tokens = allAlphanumeric.split(/\s+/).filter(t => t.length >= 6 && t.length <= 8);
    for (const token of tokens) {
      const candidate = normalizePlate(token);
      if (isValidPlate(candidate)) {
        return {
          success: true,
          plate: candidate,
          rawText,
          confidence: ret.data.confidence
        };
      }
    }

    return {
      success: false,
      rawText,
      confidence: ret.data.confidence,
      error: 'No se detectó un patrón de matrícula válido'
    };
  } catch (err: any) {
    console.error('Error durante OCR de matrícula:', err);
    return {
      success: false,
      error: err.message || 'Error al procesar OCR'
    };
  }
}
