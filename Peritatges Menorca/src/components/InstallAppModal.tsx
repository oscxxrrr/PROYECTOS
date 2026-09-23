import React, { useState } from 'react';
import { X, Smartphone, Apple, Download, CheckCircle2, Share2, PlusSquare, Sparkles, Shield, ArrowRight, ExternalLink } from 'lucide-react';

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallAppModal: React.FC<InstallAppModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'android' | 'ios'>('android');
  const [downloadStarted, setDownloadStarted] = useState(false);

  if (!isOpen) return null;

  const handleDownloadApk = () => {
    setDownloadStarted(true);
    // Disparar descarga del APK empaquetado
    const link = document.createElement('a');
    link.href = './peritatges-menorca.apk';
    link.download = 'peritatges-menorca.apk';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 select-none animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh] border border-slate-200">
        
        {/* Cabecera */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-menorca-950 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-menorca-600/30 border border-menorca-400/30 flex items-center justify-center text-menorca-400">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-extrabold text-base sm:text-lg">Instalar App Móvil</h2>
              <p className="text-xs text-slate-300">Peritatges Menorca en tu teléfono</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pestañas de Selección de Sistema */}
        <div className="grid grid-cols-2 p-2 bg-slate-100 border-b border-slate-200 text-xs font-bold">
          <button
            onClick={() => setActiveTab('android')}
            className={`py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'android'
                ? 'bg-white text-emerald-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Smartphone className="w-4 h-4 text-emerald-600" />
            <span>Android (APK)</span>
          </button>

          <button
            onClick={() => setActiveTab('ios')}
            className={`py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'ios'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Apple className="w-4 h-4 text-slate-900" />
            <span>iPhone / iPad (iOS)</span>
          </button>
        </div>

        {/* Contenido según Pestaña */}
        <div className="p-5 overflow-y-auto space-y-4 text-slate-700 text-xs sm:text-sm">
          
          {/* TAB ANDROID */}
          {activeTab === 'android' && (
            <div className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-emerald-900 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="font-extrabold text-sm text-emerald-950">Descarga Directa APK</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-200/70 text-emerald-800">
                    v1.0.0
                  </span>
                </div>

                <p className="text-xs text-emerald-800 leading-relaxed">
                  Descarga el instalador APK e instálalo en tu móvil Android para usar la app con acceso total a cámara y ráfagas.
                </p>

                <button
                  onClick={handleDownloadApk}
                  className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm rounded-xl shadow-lg shadow-emerald-900/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Download className="w-5 h-5" />
                  <span>DESCARGAR ARCHIVO APK</span>
                </button>

                {downloadStarted && (
                  <p className="text-center text-xs text-emerald-700 font-semibold animate-in fade-in">
                    ✓ Descarga iniciada. Revisa la barra de notificaciones de tu móvil.
                  </p>
                )}
              </div>

              {/* Pasos para instalar en Android */}
              <div className="border border-slate-200 rounded-2xl p-4 space-y-3 bg-white">
                <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm flex items-center gap-2">
                  <span>¿Cómo instalarlo en 2 minutos?</span>
                </h4>

                <div className="space-y-2.5 text-xs text-slate-600">
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center shrink-0 text-[11px]">1</span>
                    <p>Pulsa el botón <strong>Descargar Archivo APK</strong> arriba.</p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center shrink-0 text-[11px]">2</span>
                    <p>Si tu navegador muestra <em>"¿Descargar de todos modos?"</em>, confirma. (Es el aviso estándar de Android para apps descargadas fuera de Google Play).</p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center shrink-0 text-[11px]">3</span>
                    <p>Abre el archivo descargado y pulsa <strong>Instalar</strong>. ¡Listo!</p>
                  </div>
                </div>
              </div>

              {/* Opción rápida sin descargar: PWA */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 flex items-center justify-between gap-3 text-xs">
                <div>
                  <span className="font-bold text-slate-900 block">¿Prefieres no instalar el APK?</span>
                  <span className="text-slate-500 text-[11px]">En Chrome: Menú (⋮) &gt; <strong>"Instalar aplicación"</strong>.</span>
                </div>
                <span className="text-menorca-600 font-bold shrink-0">Instalación PWA</span>
              </div>
            </div>
          )}

          {/* TAB IPHONE / IOS */}
          {activeTab === 'ios' && (
            <div className="space-y-4">
              <div className="bg-slate-900 text-white rounded-2xl p-4 space-y-2.5">
                <div className="flex items-center gap-2 text-menorca-400">
                  <Apple className="w-5 h-5" />
                  <span className="font-bold text-sm">Instalación Nativa en iPhone</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Apple <strong>no admite archivos APK</strong> ni descargas de instaladores externos. En iPhone, la aplicación se instala en <strong>5 segundos</strong> mediante Safari como <strong>App Nativa PWA</strong>:
                </p>
              </div>

              {/* Pasos visuales Safari */}
              <div className="space-y-3">
                <div className="bg-white border border-slate-200 rounded-2xl p-3.5 flex items-center gap-3 shadow-sm">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <span className="font-black text-sm">1</span>
                  </div>
                  <div className="text-xs">
                    <p className="font-bold text-slate-900">Abre esta página en Safari</p>
                    <p className="text-slate-500 text-[11px]">Asegúrate de estar navegando desde el navegador Safari de tu iPhone.</p>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-3.5 flex items-center gap-3 shadow-sm">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <Share2 className="w-5 h-5" />
                  </div>
                  <div className="text-xs">
                    <p className="font-bold text-slate-900">Pulsa el botón Compartir</p>
                    <p className="text-slate-500 text-[11px]">El icono del cuadrado con una flecha hacia arriba (⎋) en la barra inferior de Safari.</p>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-3.5 flex items-center gap-3 shadow-sm">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <PlusSquare className="w-5 h-5" />
                  </div>
                  <div className="text-xs">
                    <p className="font-bold text-slate-900">Selecciona "Añadir a pantalla de inicio"</p>
                    <p className="text-slate-500 text-[11px]">Desliza un poco hacia abajo en el menú y pulsa <strong>Añadir a pantalla de inicio</strong> (➕).</p>
                  </div>
                </div>
              </div>

              {/* Ventajas en iPhone */}
              <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200 text-xs text-slate-600 space-y-1.5">
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Beneficios en iPhone:</span>
                </span>
                <p className="text-[11px]">
                  • Se abre a pantalla completa como una App nativa (sin barras de navegador).<br/>
                  • Icono exclusivo de Peritatges Menorca en tu pantalla de inicio.<br/>
                  • Ráfaga rápida de fotos con cámara y funcionamiento sin cobertura (offline).
                </p>
              </div>
            </div>
          )}

        </div>

        {/* Pie de modal */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Peritatges Menorca • Multiplataforma
          </span>
          <button
            onClick={onClose}
            className="py-2 px-5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs cursor-pointer transition-colors"
          >
            Entendido
          </button>
        </div>

      </div>
    </div>
  );
};
