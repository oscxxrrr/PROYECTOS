import React, { useState } from 'react';
import { Appraisal } from '../types';
import { Camera, Folder, Download, Trash2, Search, ArrowRight, Eye, Calendar, HardDrive, Plus, Sparkles } from 'lucide-react';
import { formatBytes } from '../services/imageCompressor';
import { downloadBulkAppraisalsZip, downloadSingleAppraisalZip } from '../services/zipService';

interface AppraisalListProps {
  appraisals: Appraisal[];
  onSelectAppraisal: (plate: string) => void;
  onNewAppraisal: () => void;
  onDeleteAppraisal: (plate: string) => void;
  onAddPhotosToPlate: (plate: string) => void;
}

export const AppraisalList: React.FC<AppraisalListProps> = ({
  appraisals,
  onSelectAppraisal,
  onNewAppraisal,
  onDeleteAppraisal,
  onAddPhotosToPlate
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [downloadingZip, setDownloadingZip] = useState(false);
  const [zipProgress, setZipProgress] = useState<{ percent: number; status: string } | null>(null);

  const filteredAppraisals = appraisals.filter(a =>
    a.plate.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDownloadAll = async () => {
    if (appraisals.length === 0) {
      alert('No hay peritajes registrados para descargar.');
      return;
    }

    setDownloadingZip(true);
    try {
      await downloadBulkAppraisalsZip(appraisals, (percent, status) => {
        setZipProgress({ percent, status });
      });
    } catch (err: any) {
      alert(`Error al descargar ZIP masivo: ${err.message}`);
    } finally {
      setTimeout(() => {
        setDownloadingZip(false);
        setZipProgress(null);
      }, 1000);
    }
  };

  const handleDownloadSingle = async (e: React.MouseEvent, appraisal: Appraisal) => {
    e.stopPropagation();
    setDownloadingZip(true);
    try {
      await downloadSingleAppraisalZip(appraisal, (percent, status) => {
        setZipProgress({ percent, status });
      });
    } catch (err: any) {
      alert(`Error al descargar ${appraisal.plate}.zip: ${err.message}`);
    } finally {
      setTimeout(() => {
        setDownloadingZip(false);
        setZipProgress(null);
      }, 1000);
    }
  };

  const handleDelete = (e: React.MouseEvent, plate: string) => {
    e.stopPropagation();
    if (confirm(`¿Estás seguro de que deseas eliminar permanentemente el peritaje y las fotos de la matrícula ${plate}?`)) {
      onDeleteAppraisal(plate);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Main Action Buttons */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Folder className="w-6 h-6 text-menorca-600" />
            <span>Mis Peritajes</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            {appraisals.length} vehículos peritados organizados en carpetas independientes
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Big New Appraisal Button */}
          <button
            onClick={onNewAppraisal}
            className="flex-1 sm:flex-none py-3 px-5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-700/20 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Camera className="w-5 h-5" />
            <span>📷 NUEVO PERITAJE</span>
          </button>

          {/* Download ALL Appraisals Button */}
          <button
            onClick={handleDownloadAll}
            disabled={appraisals.length === 0 || downloadingZip}
            className={`py-3 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
              appraisals.length > 0 && !downloadingZip
                ? 'bg-menorca-600 hover:bg-menorca-500 text-white shadow-md active:scale-95'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
            title="Descarga todas las carpetas organizadas en un único archivo ZIP"
          >
            <Download className="w-4 h-4" />
            <span>⬇️ DESCARGAR TODO</span>
          </button>
        </div>
      </div>

      {/* Search Filter Bar */}
      <div className="relative">
        <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar peritaje por matrícula (ej: 1234ABC)..."
          className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-menorca-500 focus:border-menorca-500 shadow-sm"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-3 text-xs text-slate-400 hover:text-slate-600 px-2 py-0.5 rounded"
          >
            Limpiar
          </button>
        )}
      </div>

      {/* Appraisals Grid / List */}
      {filteredAppraisals.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center border border-dashed border-slate-300">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-menorca-50 text-menorca-600 flex items-center justify-center">
            <Camera className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800">
            {searchQuery ? 'No se encontraron peritajes' : 'Aún no hay peritajes registrados'}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto mt-1 mb-6">
            {searchQuery
              ? `No existe ningún vehículo registrado con la matrícula "${searchQuery}".`
              : 'Comienza tu primer peritaje fotográfico pulsando el botón de cámara.'}
          </p>
          <button
            onClick={onNewAppraisal}
            className="py-3 px-6 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl shadow-md inline-flex items-center gap-2"
          >
            <Camera className="w-5 h-5" />
            <span>📷 Iniciar Nuevo Peritaje</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAppraisals.map((appraisal) => {
            const firstPhoto = appraisal.photos[0];
            const dateFormatted = new Date(appraisal.updatedAt || appraisal.createdAt).toLocaleDateString('es-ES', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric'
            });

            return (
              <div
                key={appraisal.id}
                onClick={() => onSelectAppraisal(appraisal.plate)}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md hover:border-menorca-400 transition-all cursor-pointer flex flex-col group"
              >
                {/* Plate Card Header with European Plate badge style */}
                <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {/* Spanish License Plate Replica */}
                    <div className="inline-flex items-stretch bg-white border border-slate-300 rounded shadow-xs overflow-hidden">
                      <div className="bg-blue-700 text-white text-[9px] font-bold px-1.5 flex flex-col justify-center items-center">
                        <span className="leading-none text-[8px]">🇪🇺</span>
                        <span className="leading-none font-mono">E</span>
                      </div>
                      <div className="px-2.5 py-1 font-mono font-extrabold text-base tracking-wider text-slate-900">
                        {appraisal.plate}
                      </div>
                    </div>
                  </div>

                  <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{dateFormatted}</span>
                  </span>
                </div>

                {/* Photo Thumbnail & Details */}
                <div className="p-4 flex gap-3.5 flex-1">
                  <div className="w-24 h-24 rounded-xl bg-slate-900 overflow-hidden flex-shrink-0 border border-slate-200 relative group-hover:scale-102 transition-transform">
                    {firstPhoto ? (
                      <img
                        src={firstPhoto.dataUrl}
                        alt={`Matrícula ${appraisal.plate}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-500">
                        <Camera className="w-8 h-8" />
                      </div>
                    )}
                    <span className="absolute bottom-1 right-1 bg-black/70 backdrop-blur-xs text-white text-[10px] font-mono px-1.5 py-0.5 rounded">
                      {appraisal.photos.length} fotos
                    </span>
                  </div>

                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                        <Folder className="w-3.5 h-3.5 text-menorca-600" />
                        <span className="font-mono font-bold">{appraisal.folderName}/</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        {appraisal.photos.length} fotografías procesadas
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                        <HardDrive className="w-3 h-3" />
                        <span>{formatBytes(appraisal.totalSizeBytes)}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs font-bold text-menorca-600 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                        <span>Ver fotos</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="px-4 py-2.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddPhotosToPlate(appraisal.plate);
                    }}
                    className="p-1.5 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                    title="Añadir más fotos a este vehículo"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Añadir fotos</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => handleDownloadSingle(e, appraisal)}
                      className="p-2 text-menorca-700 hover:bg-menorca-100 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                      title={`Descargar ${appraisal.plate}.zip`}
                    >
                      <Download className="w-4 h-4" />
                      <span className="hidden xs:inline">ZIP</span>
                    </button>

                    <button
                      onClick={(e) => handleDelete(e, appraisal.plate)}
                      className="p-2 text-rose-600 hover:bg-rose-100 rounded-lg text-xs transition-colors"
                      title="Eliminar peritaje"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Progress Dialog when generating ZIP */}
      {downloadingZip && zipProgress && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 shadow-2xl max-w-sm w-full text-center">
            <Download className="w-12 h-12 text-menorca-600 animate-bounce mx-auto mb-3" />
            <h3 className="font-bold text-base text-slate-900 mb-1">Generando archivo ZIP...</h3>
            <p className="text-xs text-slate-500 mb-4">{zipProgress.status}</p>

            {/* Progress bar */}
            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden border border-slate-200 mb-2">
              <div
                className="bg-menorca-600 h-full transition-all duration-200 rounded-full"
                style={{ width: `${zipProgress.percent}%` }}
              />
            </div>
            <span className="text-xs font-mono font-bold text-slate-600">
              {zipProgress.percent}%
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
