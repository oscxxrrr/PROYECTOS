import React, { useState } from 'react';
import { Appraisal, AppraisalPhoto } from '../types';
import { ArrowLeft, Camera, Download, Trash2, Plus, HardDrive, Calendar, Car, Search, ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react';
import { formatBytes } from '../services/imageCompressor';
import { downloadSingleAppraisalZip } from '../services/zipService';

interface AppraisalDetailProps {
  appraisal: Appraisal;
  onBack: () => void;
  onAddPhotos: (plate: string) => void;
  onDeletePhoto: (plate: string, photoId: string) => void;
  onDeleteAppraisal: (plate: string) => void;
  onNavigateToValuation: (plate: string) => void;
  onNavigateToLookup: (plate: string) => void;
}

export const AppraisalDetail: React.FC<AppraisalDetailProps> = ({
  appraisal,
  onBack,
  onAddPhotos,
  onDeletePhoto,
  onDeleteAppraisal,
  onNavigateToValuation,
  onNavigateToLookup
}) => {
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const activePhoto = selectedPhotoIndex !== null ? appraisal.photos[selectedPhotoIndex] : null;

  const handleDownloadZip = async () => {
    setIsDownloading(true);
    try {
      await downloadSingleAppraisalZip(appraisal);
    } catch (err: any) {
      alert(`Error al descargar ZIP: ${err.message}`);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDeleteCurrentPhoto = (photo: AppraisalPhoto) => {
    if (confirm(`¿Deseas eliminar la fotografía ${photo.filename}?`)) {
      onDeletePhoto(appraisal.plate, photo.id);
      if (selectedPhotoIndex !== null) {
        if (appraisal.photos.length <= 1) {
          setSelectedPhotoIndex(null);
        } else if (selectedPhotoIndex >= appraisal.photos.length - 1) {
          setSelectedPhotoIndex(appraisal.photos.length - 2);
        }
      }
    }
  };

  const handlePrevPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedPhotoIndex !== null && selectedPhotoIndex > 0) {
      setSelectedPhotoIndex(selectedPhotoIndex - 1);
    }
  };

  const handleNextPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedPhotoIndex !== null && selectedPhotoIndex < appraisal.photos.length - 1) {
      setSelectedPhotoIndex(selectedPhotoIndex + 1);
    }
  };

  const dateFormatted = new Date(appraisal.updatedAt || appraisal.createdAt).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              title="Volver al listado"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center gap-2">
                {/* European Plate badge */}
                <div className="inline-flex items-stretch bg-white border-2 border-slate-900 rounded-md shadow-xs overflow-hidden">
                  <div className="bg-blue-700 text-white text-[10px] font-bold px-2 flex flex-col justify-center items-center">
                    <span className="leading-none text-[8px]">🇪🇺</span>
                    <span className="leading-none font-mono">E</span>
                  </div>
                  <div className="px-3 py-1 font-mono font-black text-xl sm:text-2xl tracking-widest text-slate-950">
                    {appraisal.plate}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-2 font-medium">
                <span className="flex items-center gap-1 font-mono font-bold text-slate-800">
                  Carpeta: {appraisal.folderName}/
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {dateFormatted}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <HardDrive className="w-3.5 h-3.5" />
                  {formatBytes(appraisal.totalSizeBytes)}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {/* ADD PHOTOS BUTTON */}
            <button
              onClick={() => onAddPhotos(appraisal.plate)}
              className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md active:scale-95 transition-all flex items-center gap-1.5"
            >
              <Camera className="w-4 h-4" />
              <span>📷 AÑADIR FOTOS</span>
            </button>

            {/* DOWNLOAD THIS APPRAISAL */}
            <button
              onClick={handleDownloadZip}
              disabled={isDownloading}
              className="py-2.5 px-3.5 bg-menorca-600 hover:bg-menorca-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md active:scale-95 transition-all flex items-center gap-1.5"
              title={`Descargar ${appraisal.plate}.zip`}
            >
              <Download className="w-4 h-4" />
              <span>⬇️ DESCARGAR ESTE PERITAJE</span>
            </button>

            <button
              onClick={() => {
                if (confirm(`¿Eliminar todo el peritaje de la matrícula ${appraisal.plate}?`)) {
                  onDeleteAppraisal(appraisal.plate);
                  onBack();
                }
              }}
              className="p-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition-colors"
              title="Eliminar peritaje completo"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Integration shortcuts bar */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap gap-2 text-xs">
          <button
            onClick={() => onNavigateToValuation(appraisal.plate)}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <Car className="w-3.5 h-3.5 text-menorca-600" />
            <span>Calcular Valoración Venal/Mercado</span>
          </button>

          <button
            onClick={() => onNavigateToLookup(appraisal.plate)}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <Search className="w-3.5 h-3.5 text-menorca-600" />
            <span>Consultar Datos Técnicos DGT</span>
          </button>
        </div>
      </div>

      {/* Photos Grid */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-slate-900">
            Galería Fotográfica ({appraisal.photos.length} fotos)
          </h2>
          <span className="text-xs text-slate-500 font-mono">
            Ruta: {appraisal.folderName}/foto_XXX.jpg
          </span>
        </div>

        {appraisal.photos.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <p className="text-sm">No hay fotografías en este peritaje.</p>
            <button
              onClick={() => onAddPhotos(appraisal.plate)}
              className="mt-3 py-2 px-4 bg-emerald-600 text-white font-bold rounded-lg text-xs"
            >
              Añadir fotos ahora
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
            {appraisal.photos.map((photo, idx) => (
              <div
                key={photo.id}
                onClick={() => setSelectedPhotoIndex(idx)}
                className="group relative bg-slate-900 rounded-xl overflow-hidden aspect-[4/3] border border-slate-200 shadow-xs cursor-pointer hover:shadow-md transition-all hover:scale-102"
              >
                <img
                  src={photo.dataUrl}
                  alt={photo.filename}
                  className="w-full h-full object-cover"
                />

                {/* Filename & size overlay */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2 text-white">
                  <div className="flex items-center justify-between text-[11px] font-mono font-bold leading-none">
                    <span>{photo.filename}</span>
                    <span className="text-[10px] text-slate-300 font-normal">
                      {formatBytes(photo.sizeBytes)}
                    </span>
                  </div>
                </div>

                {/* Hover Quick Actions */}
                <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteCurrentPhoto(photo);
                    }}
                    className="p-1.5 bg-rose-600 text-white rounded-lg shadow-sm hover:bg-rose-500 transition-colors"
                    title="Eliminar esta foto"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* 1st photo badge */}
                {idx === 0 && (
                  <div className="absolute top-1.5 left-1.5 bg-blue-600/90 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm">
                    Matrícula
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox / Zoom Modal */}
      {selectedPhotoIndex !== null && activePhoto && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col p-3 sm:p-6 select-none">
          {/* Lightbox Topbar */}
          <div className="flex items-center justify-between text-white pb-3 border-b border-white/10">
            <div>
              <span className="font-mono text-base font-bold text-white">
                {appraisal.folderName}/{activePhoto.filename}
              </span>
              <span className="text-xs text-slate-400 ml-3">
                ({selectedPhotoIndex + 1} de {appraisal.photos.length}) • {formatBytes(activePhoto.sizeBytes)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleDeleteCurrentPhoto(activePhoto)}
                className="py-1.5 px-3 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Borrar foto</span>
              </button>

              <button
                onClick={() => setSelectedPhotoIndex(null)}
                className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
                title="Cerrar visor"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Lightbox Main Image & Prev/Next Nav */}
          <div className="flex-1 relative flex items-center justify-center overflow-hidden my-3">
            {selectedPhotoIndex > 0 && (
              <button
                onClick={handlePrevPhoto}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/60 hover:bg-black/80 text-white border border-white/20 transition-all z-10"
                title="Foto anterior"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            <img
              src={activePhoto.dataUrl}
              alt={activePhoto.filename}
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            />

            {selectedPhotoIndex < appraisal.photos.length - 1 && (
              <button
                onClick={handleNextPhoto}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/60 hover:bg-black/80 text-white border border-white/20 transition-all z-10"
                title="Foto siguiente"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
