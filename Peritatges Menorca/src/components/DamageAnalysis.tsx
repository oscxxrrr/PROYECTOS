import React, { useState } from 'react';
import { Appraisal, AppraisalPhoto } from '../types';
import { Bot, Sparkles, AlertCircle, CheckCircle, ShieldAlert, FileText, ArrowRight } from 'lucide-react';

interface DamageAnalysisProps {
  appraisals: Appraisal[];
  onSelectAppraisal: (plate: string) => void;
}

interface DetectedDamage {
  id: string;
  zone: 'Paragolpes delantero' | 'Aleta izquierda' | 'Aleta derecha' | 'Puerta conductor' | 'Óptica / Faro' | 'Paragolpes trasero' | 'Luna delantera';
  damageType: 'Abolladura' | 'Arañazo profundo' | 'Rotura de plástico' | 'Impacto de gravilla' | 'Fisura';
  severity: 'Leve' | 'Media' | 'Grave';
  confidence: number;
  repairHoursEstimated: number;
}

export const DamageAnalysis: React.FC<DamageAnalysisProps> = ({
  appraisals,
  onSelectAppraisal
}) => {
  const [selectedPlate, setSelectedPlate] = useState<string>(appraisals[0]?.plate || '');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [damageReport, setDamageReport] = useState<DetectedDamage[] | null>(null);

  const selectedAppraisal = appraisals.find(a => a.plate === selectedPlate);

  const handleRunAnalysis = () => {
    if (!selectedAppraisal || selectedAppraisal.photos.length === 0) return;

    setIsAnalyzing(true);
    setDamageReport(null);

    // AI Inspection simulation with realistic insurance appraisal heuristic
    setTimeout(() => {
      const mockDamages: DetectedDamage[] = [
        {
          id: 'dmg_1',
          zone: 'Paragolpes delantero',
          damageType: 'Arañazo profundo',
          severity: 'Media',
          confidence: 88,
          repairHoursEstimated: 1.5
        },
        {
          id: 'dmg_2',
          zone: 'Aleta izquierda',
          damageType: 'Abolladura',
          severity: 'Media',
          confidence: 94,
          repairHoursEstimated: 2.0
        },
        {
          id: 'dmg_3',
          zone: 'Óptica / Faro',
          damageType: 'Fisura',
          severity: 'Leve',
          confidence: 81,
          repairHoursEstimated: 0.5
        }
      ];
      setDamageReport(mockDamages);
      setIsAnalyzing(false);
    }, 1500);
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'Grave':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'Media':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-200">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-purple-100 text-purple-700">
            <Bot className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <span>IA Pericial: Análisis de Daños</span>
              <span className="px-2 py-0.5 text-xs bg-purple-100 text-purple-800 rounded-full font-bold">
                Módulo Arquitectura Futura
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
              Inspección visual asistida para detección de impactos, arañazos, abolladuras y roturas
            </p>
          </div>
        </div>
      </div>

      {appraisals.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center border border-slate-200">
          <p className="text-sm text-slate-500">
            Aún no tienes peritajes guardados. Realiza primero fotos a un vehículo para poder analizarlas.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls */}
          <div className="lg:col-span-5 bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-200 space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100">
              Seleccionar Peritaje para Analizar
            </h2>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Matrícula del Vehículo
              </label>
              <select
                value={selectedPlate}
                onChange={(e) => {
                  setSelectedPlate(e.target.value);
                  setDamageReport(null);
                }}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold text-sm text-slate-900 outline-none"
              >
                {appraisals.map(a => (
                  <option key={a.plate} value={a.plate}>
                    {a.plate} ({a.photos.length} fotos)
                  </option>
                ))}
              </select>
            </div>

            {selectedAppraisal && (
              <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1.5 border border-slate-100">
                <div className="flex justify-between">
                  <span className="text-slate-500">Fotografías disponibles:</span>
                  <span className="font-bold text-slate-900">{selectedAppraisal.photos.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Carpeta:</span>
                  <span className="font-mono font-bold text-slate-900">{selectedAppraisal.folderName}/</span>
                </div>
              </div>
            )}

            <button
              onClick={handleRunAnalysis}
              disabled={isAnalyzing || !selectedAppraisal || selectedAppraisal.photos.length === 0}
              className={`w-full py-3 px-4 rounded-xl font-bold text-sm shadow-lg flex items-center justify-center gap-2 transition-all ${
                !isAnalyzing && selectedAppraisal && selectedAppraisal.photos.length > 0
                  ? 'bg-purple-600 hover:bg-purple-500 text-white active:scale-95 shadow-purple-700/20'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>{isAnalyzing ? 'Analizando fotografías con IA...' : 'Ejecutar Detección de Daños'}</span>
            </button>

            <div className="p-3 bg-purple-50 border border-purple-100 rounded-xl text-[11px] text-purple-900">
              <strong className="block mb-1">Módulo preparado para conectar a:</strong>
              • Modelos de visión por computador (YOLO / Vision Transformers) para detección de paneles.<br/>
              • Clasificación automática de severidad de chapa y pintura.<br/>
              • Estimación de tiempos de baremo de reparación (Cesvimap / Audatex).
            </div>
          </div>

          {/* Results */}
          <div className="lg:col-span-7 space-y-4">
            {damageReport ? (
              <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-200 space-y-4 animate-in fade-in duration-300">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="font-bold text-base text-slate-900">
                    Informe Preliminar de Daños ({damageReport.length} zonas detectadas)
                  </h3>
                  <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                    IA Completada
                  </span>
                </div>

                <div className="space-y-2.5">
                  {damageReport.map(item => (
                    <div
                      key={item.id}
                      className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900">{item.zone}</span>
                          <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${getSeverityBadge(item.severity)}`}>
                            {item.severity}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600">
                          Tipo: <strong>{item.damageType}</strong> • Confianza: {item.confidence}%
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-xs text-slate-500 block">Baremo est.</span>
                        <span className="font-mono font-bold text-sm text-purple-700">
                          {item.repairHoursEstimated} h
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-3 bg-slate-100 rounded-xl flex items-center justify-between text-xs font-semibold text-slate-800">
                  <span>Tiempo total de reparación estimado:</span>
                  <span className="font-mono text-sm font-bold text-slate-900">
                    {damageReport.reduce((acc, d) => acc + d.repairHoursEstimated, 0).toFixed(1)} horas
                  </span>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-10 text-center border border-dashed border-slate-300 h-full flex flex-col items-center justify-center">
                <Bot className="w-12 h-12 text-slate-300 mb-3" />
                <h3 className="text-sm font-bold text-slate-700">Detección Automática de Daños</h3>
                <p className="text-xs text-slate-500 max-w-sm mt-1">
                  Selecciona un peritaje y pulsa el botón para ejecutar el escaneo inteligente sobre las fotografías del vehículo.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
