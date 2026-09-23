import React, { useState, useEffect } from 'react';
import { VehicleTechnicalData } from '../types';
import { vehicleDataProvider } from '../services/vehicleDataProvider';
import { normalizePlate } from '../services/plateOcrService';
import { Search, Car, Calendar, Fuel, Gauge, Award, Info, AlertCircle, ArrowRight, Camera } from 'lucide-react';

interface VehicleLookupProps {
  initialPlate?: string;
  onNavigateToValuation?: (plate: string) => void;
  onNavigateToCameraWithPlate?: (plate: string) => void;
}

export const VehicleLookup: React.FC<VehicleLookupProps> = ({
  initialPlate,
  onNavigateToValuation,
  onNavigateToCameraWithPlate
}) => {
  const [searchPlate, setSearchPlate] = useState(initialPlate ? normalizePlate(initialPlate) : '');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<VehicleTechnicalData | null>(null);

  useEffect(() => {
    if (initialPlate) {
      const clean = normalizePlate(initialPlate);
      setSearchPlate(clean);
      handleSearch(clean);
    }
  }, [initialPlate]);

  const handleSearch = async (plateToQuery?: string) => {
    const targetPlate = normalizePlate(plateToQuery || searchPlate);
    if (!targetPlate || targetPlate.length < 5) {
      alert('Introduce una matrícula válida (ej: 1234ABC o IB1234AB).');
      return;
    }

    setLoading(true);
    try {
      const result = await vehicleDataProvider.getVehicleData(targetPlate);
      setData(result);
    } catch (err) {
      console.error('Error al consultar vehículo:', err);
    } finally {
      setLoading(false);
    }
  };

  const getBadgeStyle = (badge: string) => {
    switch (badge) {
      case '0':
        return 'bg-blue-600 text-white border-blue-700';
      case 'ECO':
        return 'bg-emerald-600 text-white border-emerald-700';
      case 'C':
        return 'bg-emerald-500 text-white border-emerald-600';
      case 'B':
        return 'bg-amber-400 text-slate-900 border-amber-500';
      default:
        return 'bg-slate-200 text-slate-700 border-slate-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Title Card */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-200">
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <Search className="w-6 h-6 text-menorca-600" />
          <span>Datos del Vehículo por Matrícula</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1">
          Consulta técnica de homologación, serie DGT, distintivo ambiental y motorización
        </p>
      </div>

      {/* Plate Search Bar */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-200 max-w-xl mx-auto">
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 text-center">
          Introduce la matrícula a consultar
        </label>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <div className="absolute inset-y-1.5 left-1.5 w-8 rounded-l bg-blue-700 flex flex-col items-center justify-center text-white pointer-events-none">
              <span className="text-[10px] leading-none mb-0.5">🇪🇺</span>
              <span className="text-[9px] font-bold font-mono">E</span>
            </div>
            <input
              type="text"
              value={searchPlate}
              onChange={(e) => setSearchPlate(normalizePlate(e.target.value))}
              placeholder="1234ABC"
              maxLength={10}
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border-2 border-slate-300 rounded-xl text-center font-mono font-extrabold text-xl tracking-wider text-slate-900 uppercase focus:bg-white focus:border-menorca-600 focus:ring-4 focus:ring-menorca-100 outline-none"
            />
          </div>

          <button
            onClick={() => handleSearch()}
            disabled={loading || !searchPlate}
            className={`py-3 px-6 rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 ${
              searchPlate && !loading
                ? 'bg-menorca-600 hover:bg-menorca-500 text-white active:scale-95 shadow-menorca-700/20'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Search className="w-4 h-4" />
            <span>{loading ? 'Consultando...' : 'Consultar DGT'}</span>
          </button>
        </div>
      </div>

      {/* Result Card */}
      {data && (
        <div className="max-w-3xl mx-auto space-y-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            {/* Header Badge */}
            <div className="p-5 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="px-3 py-1 bg-white rounded border border-slate-300 font-mono font-black text-xl text-slate-900">
                  {data.plate}
                </div>
                <div>
                  <h2 className="text-lg font-bold">
                    {data.verified ? `${data.brand} ${data.model}` : 'Vehículo identificado por Serie DGT'}
                  </h2>
                  <p className="text-xs text-slate-400">
                    Fuente: {data.source}
                  </p>
                </div>
              </div>

              {/* Environmental Badge */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-300">Distintivo DGT:</span>
                <span className={`px-2.5 py-1 rounded-full text-xs font-black border font-mono ${getBadgeStyle(data.environmentalBadge)}`}>
                  {data.environmentalBadge}
                </span>
              </div>
            </div>

            {/* Technical Grid */}
            <div className="p-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[11px] text-slate-500 block">Marca</span>
                  <span className="text-sm font-bold text-slate-900">{data.brand}</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[11px] text-slate-500 block">Modelo</span>
                  <span className="text-sm font-bold text-slate-900">{data.model}</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[11px] text-slate-500 block">Versión / Acabado</span>
                  <span className="text-sm font-bold text-slate-900">{data.version}</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[11px] text-slate-500 block flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>Año Matriculación</span>
                  </span>
                  <span className="text-sm font-bold text-slate-900">
                    {data.year} ({data.registrationDate})
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[11px] text-slate-500 block flex items-center gap-1">
                    <Fuel className="w-3 h-3" />
                    <span>Combustible</span>
                  </span>
                  <span className="text-sm font-bold text-slate-900">{data.fuelType}</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[11px] text-slate-500 block flex items-center gap-1">
                    <Gauge className="w-3 h-3" />
                    <span>Potencia / Cilindrada</span>
                  </span>
                  <span className="text-sm font-bold text-slate-900">
                    {data.powerHp > 0 ? `${data.powerHp} CV • ${data.displacement}` : 'Datos no disponibles'}
                  </span>
                </div>
              </div>

              {/* Verified or Unverified Notice */}
              {!data.verified && (
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong>Aviso de rigor pericial:</strong> El año ({data.year}) y distintivo han sido estimados a partir de la secuencia oficial de matriculación DGT. Los datos técnicos de motorización están pendientes de consulta a base de datos de pago externa y no han sido inventados.
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                {onNavigateToValuation && (
                  <button
                    onClick={() => onNavigateToValuation(data.plate)}
                    className="py-2.5 px-4 bg-menorca-600 hover:bg-menorca-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm"
                  >
                    <Car className="w-4 h-4" />
                    <span>Calcular Tasación para {data.plate}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}

                {onNavigateToCameraWithPlate && (
                  <button
                    onClick={() => onNavigateToCameraWithPlate(data.plate)}
                    className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Hacer fotos a {data.plate}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
