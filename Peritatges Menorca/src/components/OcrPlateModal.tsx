import React, { useState, useEffect } from 'react';
import { AppraisalPhoto } from '../types';
import { detectPlateFromImage, normalizePlate, isValidPlate } from '../services/plateOcrService';
import { CheckCircle2, AlertCircle, RefreshCw, FolderCheck, Edit3, Image as ImageIcon } from 'lucide-react';

interface OcrPlateModalProps {
  isOpen: boolean;
  photos: AppraisalPhoto[];
  onConfirmPlate: (finalPlate: string) => void;
  onCancel: () => void;
}

export const OcrPlateModal: React.FC<OcrPlateModalProps> = ({
  isOpen,
  photos,
  onConfirmPlate,
  onCancel
}) => {
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [detectedPlate, setDetectedPlate] = useState<string>('');
  const [manualPlate, setManualPlate] = useState<string>('');
  const [ocrFailed, setOcrFailed] = useState(false);
  const [ocrConfidence, setOcrConfidence] = useState<number | undefined>(undefined);

  const activePhoto = photos[selectedPhotoIndex] || photos[0];

  useEffect(() => {
    if (isOpen && photos.length > 0) {
      setSelectedPhotoIndex(0);
      runOcrAnalysis(0);
    }
  }, [isOpen]);

  const runOcrAnalysis = async (index: number) => {
    const photoToAnalyze = photos[index];
    if (!photoToAnalyze) return;

    setIsAnalyzing(true);
    setOcrFailed(false);
    setDetectedPlate('');

    try {
      const result = await detectPlateFromImage(photoToAnalyze.dataUrl);

      if (result.success && result.plate) {
        setDetectedPlate(result.plate);
        setManualPlate(result.plate);
        setOcrConfidence(result.confidence);
        setOcrFailed(false);
      } else {
        setOcrFailed(true);
        setDetectedPlate('');
        setManualPlate('');
      }
    } catch (err) {
      console.warn('Fallo en análisis OCR:', err);
      setOcrFailed(true);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleManualPlateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const clean = normalizePlate(raw);
    setManualPlate(clean);
  };

  const handleConfirm = () => {
    const finalPlate = normalizePlate(manualPlate || detectedPlate);
    if (!finalPlate) {
      alert('Debes indicar una matrícula válida para organizar las fotos.');
      return;
    }
    onConfirmPlate(finalPlate);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-menorca-600 text-white">
              <FolderCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base leading-tight">Detección de Matrícula</h2>
              <p className="text-xs text-slate-300">Creación de carpeta única para el vehículo</p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold bg-white/10 px-2.5 py-1 rounded-full text-slate-200">
            {photos.length} fotos listas
          </span>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Photo preview with license plate target */}
          <div className="relative aspect-[16/10] bg-slate-950 rounded-xl overflow-hidden border border-slate-200 shadow-inner group">
            {activePhoto && (
              <img
                src={activePhoto.dataUrl}
                alt="Foto analizada"
                className="w-full h-full object-contain"
              />
            )}

            {isAnalyzing && (
              <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm flex flex-col items-center justify-center text-white">
                <RefreshCw className="w-10 h-10 text-menorca-400 animate-spin mb-3" />
                <p className="font-bold text-sm tracking-wide">Analizando matrícula por OCR...</p>
                <p className="text-xs text-slate-400 mt-1">Reconociendo caracteres en la 1ª foto</p>
              </div>
            )}

            <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded text-white text-[11px] font-mono">
              Foto #{selectedPhotoIndex + 1} de {photos.length}
            </div>
          </div>

          {/* Alternate photo selector if user photographed plate in shot 2 or 3 */}
          {photos.length > 1 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
              <span className="text-[11px] font-semibold text-slate-700 whitespace-nowrap mr-1">
                ¿La matrícula está en otra foto?:
              </span>
              {photos.map((p, idx) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setSelectedPhotoIndex(idx);
                    runOcrAnalysis(idx);
                  }}
                  className={`px-2 py-1 rounded font-mono font-bold text-xs border transition-colors ${
                    selectedPhotoIndex === idx
                      ? 'bg-menorca-600 text-white border-menorca-600'
                      : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  #{idx + 1}
                </button>
              ))}
            </div>
          )}

          {/* OCR Result State */}
          {!isAnalyzing && (
            <div>
              {ocrFailed ? (
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl">
                  <div className="flex items-start gap-2.5">
                    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-bold text-amber-900 leading-tight">
                        No hemos podido detectar la matrícula automáticamente
                      </h4>
                      <p className="text-xs text-amber-800 mt-0.5">
                        Introduce la matrícula manualmente a continuación para continuar sin interrupciones.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                    <div>
                      <h4 className="text-sm font-bold text-emerald-950 leading-tight">
                        ¡Matrícula detectada con éxito!
                      </h4>
                      <p className="text-xs text-emerald-800">
                        {ocrConfidence ? `Fiabilidad: ${Math.round(ocrConfidence)}%` : 'Reconocimiento automático'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => runOcrAnalysis(selectedPhotoIndex)}
                    className="p-1.5 text-emerald-700 hover:text-emerald-900 hover:bg-emerald-100 rounded-lg text-xs flex items-center gap-1 font-semibold"
                    title="Volver a analizar"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Reintentar</span>
                  </button>
                </div>
              )}

              {/* License Plate Input Box */}
              <div className="mt-4">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>Nombre de carpeta / Matrícula</span>
                  <span className="text-slate-600 font-normal lowercase">Solo matrícula (ej: 1234ABC)</span>
                </label>

                <div className="relative">
                  {/* European Blue Flag Strip */}
                  <div className="absolute inset-y-1.5 left-1.5 w-8 rounded-l bg-blue-700 flex flex-col items-center justify-center text-white pointer-events-none shadow-sm">
                    <span className="text-[10px] leading-none mb-0.5">🇪🇺</span>
                    <span className="text-[9px] font-bold font-mono">E</span>
                  </div>

                  <input
                    type="text"
                    value={manualPlate}
                    onChange={handleManualPlateChange}
                    placeholder="1234ABC"
                    maxLength={10}
                    autoFocus
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border-2 border-slate-300 rounded-xl text-center font-mono font-extrabold text-2xl tracking-widest text-slate-900 uppercase focus:bg-white focus:border-menorca-600 focus:ring-4 focus:ring-menorca-100 transition-all outline-none"
                  />
                </div>

                <div className="mt-2 text-center">
                  <p className="text-xs text-slate-700">
                    Se creará la carpeta: <strong className="font-mono text-slate-900">{manualPlate || '1234ABC'}/</strong> con {photos.length} fotos organizadas.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 px-4 border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-sm transition-colors"
          >
            Cancelar
          </button>

          <button
            onClick={handleConfirm}
            disabled={!manualPlate || isAnalyzing}
            className={`flex-1 py-3 px-4 font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg transition-all ${
              manualPlate && !isAnalyzing
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white active:scale-95 shadow-emerald-700/20'
                : 'bg-slate-300 text-slate-500 cursor-not-allowed'
            }`}
          >
            <FolderCheck className="w-5 h-5" />
            <span>Crear Carpeta y Guardar</span>
          </button>
        </div>
      </div>
    </div>
  );
};
