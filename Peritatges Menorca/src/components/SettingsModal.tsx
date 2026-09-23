import React from 'react';
import { CompressionSettings } from '../types';
import { X, Settings, Sliders, HardDrive, Shield, Cloud } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: CompressionSettings;
  onSaveSettings: (newSettings: CompressionSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-menorca-600 text-white">
              <Settings className="w-5 h-5" />
            </div>
            <h2 className="font-bold text-base">Ajustes de Peritaje</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5 text-xs text-slate-700 max-h-[80vh] overflow-y-auto">
          {/* Compression Quality */}
          <div>
            <div className="flex items-center justify-between mb-1.5 font-bold text-slate-900">
              <span className="flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-menorca-600" />
                <span>Calidad de Compresión</span>
              </span>
              <span className="font-mono text-menorca-600 text-sm">
                {Math.round(settings.quality * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0.65"
              max="0.95"
              step="0.05"
              value={settings.quality}
              onChange={(e) => onSaveSettings({ ...settings, quality: parseFloat(e.target.value) })}
              className="w-full accent-menorca-600 cursor-pointer"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Recomendado: 80%. Ahorra hasta el 88% de almacenamiento manteniendo nitidez pericial de detalles.
            </p>
          </div>

          {/* Max Resolution */}
          <div>
            <label className="block font-bold text-slate-900 mb-1.5 flex items-center gap-1.5">
              <HardDrive className="w-4 h-4 text-menorca-600" />
              <span>Resolución Máxima (Lado Mayor)</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[1280, 1920, 2560].map(res => (
                <button
                  key={res}
                  onClick={() => onSaveSettings({ ...settings, maxDimension: res })}
                  className={`py-2 px-2 rounded-xl font-mono font-bold text-center border transition-all ${
                    settings.maxDimension === res
                      ? 'bg-menorca-600 text-white border-menorca-600 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {res}px
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              1920px (Full HD) es el estándar óptimo para peritaje de chapa y pintura.
            </p>
          </div>

          {/* Format */}
          <div>
            <label className="block font-bold text-slate-900 mb-1.5">Formato de Imagen</label>
            <div className="grid grid-cols-2 gap-2">
              {(['image/jpeg', 'image/webp'] as const).map(fmt => (
                <button
                  key={fmt}
                  onClick={() => onSaveSettings({ ...settings, format: fmt })}
                  className={`py-2 px-2 rounded-xl font-bold uppercase text-center border transition-all ${
                    settings.format === fmt
                      ? 'bg-menorca-600 text-white border-menorca-600 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {fmt === 'image/jpeg' ? 'JPEG (Universal)' : 'WebP (Ultra Ligero)'}
                </button>
              ))}
            </div>
          </div>

          {/* Storage Architecture Overview */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
            <span className="font-bold text-slate-900 flex items-center gap-1.5">
              <Cloud className="w-4 h-4 text-menorca-600" />
              <span>Arquitectura de Almacenamiento</span>
            </span>
            <p className="text-[11px] text-slate-600">
              • <strong>Local Móvil:</strong> IndexedDB persistente en el dispositivo (opera 100% offline).<br/>
              • <strong>Servidor Cloud:</strong> Compatible con S3 / Cloudflare R2 / Supabase Storage sin límite práctico.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="py-2 px-5 bg-menorca-600 hover:bg-menorca-500 text-white font-bold rounded-xl text-xs"
          >
            Guardar y Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
