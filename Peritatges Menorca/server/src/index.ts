import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import archiver from 'archiver';

const app = express();
const PORT = process.env.PORT || 3001;

// Base uploads directory organized by pure license plates: storage/uploads/1234ABC/foto_001.jpg
const UPLOADS_DIR = path.join(process.cwd(), 'server', 'storage', 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// In-memory or file-backed database of appraisals
const DB_FILE = path.join(process.cwd(), 'server', 'storage', 'db.json');
let appraisalsDb: Record<string, any> = {};

if (fs.existsSync(DB_FILE)) {
  try {
    appraisalsDb = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
  } catch {
    appraisalsDb = {};
  }
}

function persistDb() {
  fs.writeFileSync(DB_FILE, JSON.stringify(appraisalsDb, null, 2), 'utf-8');
}

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Healthcheck
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'PERITATGES MENORCA API',
    timestamp: new Date().toISOString()
  });
});

// GET all appraisals
app.get('/api/appraisals', (req, res) => {
  const list = Object.values(appraisalsDb).sort((a: any, b: any) => 
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
  res.json(list);
});

// GET appraisal by plate
app.get('/api/appraisals/:plate', (req, res) => {
  const plate = req.params.plate.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const found = appraisalsDb[plate];
  if (!found) {
    return res.status(404).json({ error: 'Peritaje no encontrado' });
  }
  res.json(found);
});

// POST / UPSERT appraisal (Sync endpoint)
app.post('/api/appraisals', async (req, res) => {
  try {
    const appraisal = req.body;
    if (!appraisal || !appraisal.plate) {
      return res.status(400).json({ error: 'Datos de peritaje o matrícula no válidos' });
    }

    const cleanPlate = appraisal.plate.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const vehicleFolder = path.join(UPLOADS_DIR, cleanPlate);

    if (!fs.existsSync(vehicleFolder)) {
      fs.mkdirSync(vehicleFolder, { recursive: true });
    }

    // Save photos to disk folder: 1234ABC/foto_001.jpg
    if (Array.isArray(appraisal.photos)) {
      for (const photo of appraisal.photos) {
        if (photo.dataUrl && photo.filename) {
          const filePath = path.join(vehicleFolder, photo.filename);
          const base64Data = photo.dataUrl.replace(/^data:image\/\w+;base64,/, '');
          fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
        }
      }
    }

    appraisal.synced = true;
    appraisal.folderName = cleanPlate;
    appraisalsDb[cleanPlate] = appraisal;
    persistDb();

    res.status(200).json({ success: true, appraisal });
  } catch (err: any) {
    console.error('Error al guardar peritaje en servidor:', err);
    res.status(500).json({ error: err.message || 'Error interno del servidor' });
  }
});

// DELETE appraisal
app.delete('/api/appraisals/:plate', (req, res) => {
  const cleanPlate = req.params.plate.toUpperCase().replace(/[^A-Z0-9]/g, '');
  delete appraisalsDb[cleanPlate];
  persistDb();

  const vehicleFolder = path.join(UPLOADS_DIR, cleanPlate);
  if (fs.existsSync(vehicleFolder)) {
    fs.rmSync(vehicleFolder, { recursive: true, force: true });
  }

  res.json({ success: true, message: `Peritaje ${cleanPlate} eliminado` });
});

// Bulk ZIP Download
app.get('/api/download/all', (req, res) => {
  const dateStr = new Date().toISOString().split('T')[0];
  const zipFilename = `PERITAJES_MENORCA_${dateStr}.zip`;

  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', `attachment; filename="${zipFilename}"`);

  const archive = archiver('zip', { zlib: { level: 6 } });
  archive.pipe(res);

  // Add each folder
  if (fs.existsSync(UPLOADS_DIR)) {
    archive.directory(UPLOADS_DIR, false);
  }

  archive.finalize();
});

// Single plate ZIP Download
app.get('/api/download/:plate', (req, res) => {
  const cleanPlate = req.params.plate.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const vehicleFolder = path.join(UPLOADS_DIR, cleanPlate);

  if (!fs.existsSync(vehicleFolder)) {
    return res.status(404).json({ error: 'Carpeta de peritaje no encontrada' });
  }

  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', `attachment; filename="${cleanPlate}.zip"`);

  const archive = archiver('zip', { zlib: { level: 6 } });
  archive.pipe(res);
  archive.directory(vehicleFolder, cleanPlate);
  archive.finalize();
});

// Admin Stats Endpoint
app.get('/api/admin/stats', (req, res) => {
  const all = Object.values(appraisalsDb);
  let totalPhotos = 0;
  let totalBytes = 0;

  all.forEach((a: any) => {
    if (Array.isArray(a.photos)) {
      totalPhotos += a.photos.length;
      a.photos.forEach((p: any) => {
        totalBytes += p.sizeBytes || 0;
      });
    }
  });

  res.json({
    totalAppraisals: all.length,
    totalPhotos,
    totalBytes,
    activeAppraisers: 3
  });
});

app.listen(PORT, () => {
  console.log(`[PERITATGES MENORCA] Servidor escuchando en http://localhost:${PORT}`);
});
