import React, { useState, useEffect } from 'react';
import { VehicleType, VehicleCondition, VehicleValuationInput, VehicleValuationResult, VehicleTechnicalData } from '../types';
import { calculateVehicleValuation } from '../services/valuationService';
import { vehicleDataProvider } from '../services/vehicleDataProvider';
import { normalizePlate } from '../services/plateOcrService';
import { Car, Calculator, AlertTriangle, FileText, CheckCircle, Info, RefreshCw } from 'lucide-react';

interface VehicleValuationProps {
  initialPlate?: string;
}

const VEHICLE_TYPES: VehicleType[] = [
  'Coches',
  'Furgonetas',
  'Camiones',
  'Motos',
  'Ciclomotores',
  'Autocaravanas',
  'Remolques',
  'Semirremolques',
  'Autobuses',
  'Vehículos industriales',
  'Maquinaria',
  'Vehículos especiales',
  'Grúas',
  'Tractores',
  'Vehículos agrícolas',
  'OTROS'
];

export const VehicleValuation: React.FC<VehicleValuationProps> = ({ initialPlate }) => {
  const [plate, setPlate] = useState(initialPlate ? normalizePlate(initialPlate) : '');
  const [kilometers, setKilometers] = useState<number>(85000);
  const [vehicleType, setVehicleType] = useState<VehicleType>('Coches');
  const [condition, setCondition] = useState<VehicleCondition>('Bueno');
  const [registrationYear, setRegistrationYear] = useState<number>(2019);
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [version, setVersion] = useState('');

  const [isLoadingLookup, setIsLoadingLookup] = useState(false);
  const [technicalData, setTechnicalData] = useState<VehicleTechnicalData | null>(null);
  const [result, setResult] = useState<VehicleValuationResult | null>(null);

  useEffect(() => {
    if (initialPlate) {
      setPlate(normalizePlate(initialPlate));
      handleAutoLookup(normalizePlate(initialPlate));
    }
  }, [initialPlate]);

  const handleAutoLookup = async (lookupPlate: string) => {
    if (!lookupPlate || lookupPlate.length < 5) return;
    setIsLoadingLookup(true);

    try {
      const data = await vehicleDataProvider.getVehicleData(lookupPlate);
      if (data) {
        setTechnicalData(data);
        if (data.year) setRegistrationYear(data.year);
        if (data.vehicleType) setVehicleType(data.vehicleType);
        if (data.verified) {
          setBrand(data.brand);
          setModel(data.model);
          setVersion(data.version);
        }
      }
    } finally {
      setIsLoadingLookup(false);
    }
  };

  const handlePlateBlur = () => {
    const clean = normalizePlate(plate);
    setPlate(clean);
    if (clean) {
      handleAutoLookup(clean);
    }
  };

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPlate = normalizePlate(plate);
    if (!cleanPlate) {
      alert('Introduce una matrícula válida para calcular la tasación.');
      return;
    }

    const input: VehicleValuationInput = {
      plate: cleanPlate,
      kilometers: Number(kilometers) || 0,
      vehicleType,
      condition,
      registrationDate: `${registrationYear}-06-15`,
      brand,
      model,
      version
    };

    const basePrice = technicalData?.estimatedMarketValue 
      ? technicalData.estimatedMarketValue * 1.6 
      : undefined;

    const res = calculateVehicleValuation(input, basePrice, registrationYear);
    setResult(res);
  };

  return (
    <div className="space-y-6">
      {/* Title Card */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-200">
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <Car className="w-6 h-6 text-menorca-600" />
          <span>Valoración del Vehículo</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1">
          Cálculo técnico comparativo de <strong>Valor Venal BOE</strong> (Orden HFP Hacienda) vs. <strong>Valor de Mercado Estimado</strong>
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Inputs (Left) */}
        <div className="lg:col-span-6 bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-200">
          <form onSubmit={handleCalculate} className="space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center justify-between">
              <span>Parámetros del Vehículo</span>
              {isLoadingLookup && (
                <span className="text-xs text-menorca-600 flex items-center gap-1 normal-case font-normal">
                  <RefreshCw className="w-3 h-3 animate-spin" /> Buscando DGT...
                </span>
              )}
            </h2>

            {/* License plate input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Matrícula *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={plate}
                  onChange={(e) => setPlate(normalizePlate(e.target.value))}
                  onBlur={handlePlateBlur}
                  placeholder="1234ABC"
                  maxLength={10}
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold text-lg text-slate-900 uppercase focus:bg-white focus:border-menorca-600 focus:ring-2 focus:ring-menorca-200 outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleAutoLookup(normalizePlate(plate))}
                  className="absolute right-2 top-2 px-2.5 py-1 text-xs font-semibold bg-menorca-50 text-menorca-700 hover:bg-menorca-100 rounded-lg"
                >
                  Consultar DGT
                </button>
              </div>
            </div>

            {/* Vehicle Type (16 categories) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Tipo de Vehículo
              </label>
              <select
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value as VehicleType)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:border-menorca-600 outline-none"
              >
                {VEHICLE_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {/* Kilometers and Year Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Kilómetros
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={kilometers}
                  onChange={(e) => setKilometers(Number(e.target.value))}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Año Matriculación
                </label>
                <input
                  type="number"
                  min="1970"
                  max={new Date().getFullYear()}
                  value={registrationYear}
                  onChange={(e) => setRegistrationYear(Number(e.target.value))}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 outline-none"
                />
              </div>
            </div>

            {/* Vehicle Condition */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Estado de Conservación
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(['Excelente', 'Bueno', 'Regular', 'Dañado'] as VehicleCondition[]).map(cond => (
                  <button
                    key={cond}
                    type="button"
                    onClick={() => setCondition(cond)}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition-colors ${
                      condition === cond
                        ? 'bg-menorca-600 text-white border-menorca-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {cond}
                  </button>
                ))}
              </div>
            </div>

            {/* Optional details */}
            <div className="pt-2 border-t border-slate-100">
              <span className="text-xs text-slate-500 font-semibold mb-2 block">
                Datos descriptivos (Opcional):
              </span>
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder="Marca (ej: SEAT)"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className="px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
                <input
                  type="text"
                  placeholder="Modelo (ej: Ibiza)"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
                <input
                  type="text"
                  placeholder="Versión"
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  className="px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 bg-menorca-600 hover:bg-menorca-500 text-white font-bold rounded-xl shadow-lg shadow-menorca-700/20 active:scale-98 transition-all flex items-center justify-center gap-2"
            >
              <Calculator className="w-5 h-5" />
              <span>Calcular Valoración Técnica</span>
            </button>
          </form>
        </div>

        {/* Results Card (Right) */}
        <div className="lg:col-span-6 space-y-4">
          {result ? (
            <div className="space-y-4 animate-in fade-in duration-300">
              {/* Main Comparison Banner */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Valor Venal BOE */}
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-5 shadow-md flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs text-slate-300 mb-1">
                      <span className="font-bold uppercase tracking-wider">Valor Venal BOE</span>
                      <span className="bg-white/10 px-2 py-0.5 rounded text-[11px] font-mono">
                        {result.porcentajeDepreciacionBoe}% Hacienda
                      </span>
                    </div>
                    <div className="text-3xl font-black font-mono tracking-tight text-white my-2">
                      {result.valorVenalBoe.toLocaleString('es-ES')} €
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-2">
                    Tabla oficial de depreciación según fecha de primera matriculación ({registrationYear}).
                  </p>
                </div>

                {/* Valor Mercado Estimado */}
                <div className="bg-gradient-to-br from-menorca-600 to-menorca-800 text-white rounded-2xl p-5 shadow-md flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs text-menorca-100 mb-1">
                      <span className="font-bold uppercase tracking-wider">Valor Mercado Estimado</span>
                      <span className="bg-emerald-400/20 text-emerald-300 px-2 py-0.5 rounded text-[11px] font-mono font-bold">
                        Ajustado
                      </span>
                    </div>
                    <div className="text-3xl font-black font-mono tracking-tight text-white my-2">
                      {result.valorMercadoEstimado.toLocaleString('es-ES')} €
                    </div>
                  </div>
                  <p className="text-[11px] text-menorca-100 mt-2">
                    Ajustado por kilometraje ({kilometers.toLocaleString('es-ES')} km) y estado ({condition}).
                  </p>
                </div>
              </div>

              {/* Factors Breakdown */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100">
                  Desglose Técnico de Tasación
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="p-2.5 bg-slate-50 rounded-xl">
                    <span className="text-[10px] text-slate-500 block uppercase">Antigüedad</span>
                    <span className="text-sm font-bold text-slate-900">
                      {new Date().getFullYear() - registrationYear} años
                    </span>
                  </div>

                  <div className="p-2.5 bg-slate-50 rounded-xl">
                    <span className="text-[10px] text-slate-500 block uppercase">% BOE Retenido</span>
                    <span className="text-sm font-bold text-slate-900">
                      {result.porcentajeDepreciacionBoe}%
                    </span>
                  </div>

                  <div className="p-2.5 bg-slate-50 rounded-xl">
                    <span className="text-[10px] text-slate-500 block uppercase">Factor Km</span>
                    <span className="text-sm font-bold text-slate-900 font-mono">
                      x{result.factorKilometraje}
                    </span>
                  </div>

                  <div className="p-2.5 bg-slate-50 rounded-xl">
                    <span className="text-[10px] text-slate-500 block uppercase">Factor Estado</span>
                    <span className="text-sm font-bold text-slate-900 font-mono">
                      x{result.factorEstado}
                    </span>
                  </div>
                </div>

                <div className="pt-2 text-xs text-slate-500 flex items-center justify-between border-t border-slate-100">
                  <span>Fuente: {result.fuenteBoe}</span>
                  <span>Fecha: {result.fechaCalculo}</span>
                </div>
              </div>

              {/* Disclaimer Notice */}
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="font-semibold block">Aviso Técnico Legal:</strong>
                  <span>{result.disclaimer}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-10 text-center border border-dashed border-slate-300 h-full flex flex-col items-center justify-center">
              <Calculator className="w-12 h-12 text-slate-300 mb-3" />
              <h3 className="text-sm font-bold text-slate-700">Calculadora de Tasación Pericial</h3>
              <p className="text-xs text-slate-500 max-w-xs mt-1">
                Introduce la matrícula y los kilómetros del vehículo para calcular el valor venal oficial y la estimación de mercado.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
