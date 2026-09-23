import { VehicleValuationInput, VehicleValuationResult, VehicleType } from '../types';

/**
 * Tabla oficial de coeficientes de depreciación según antigüedad
 * Fuente: Ministerio de Hacienda y Función Pública (Orden HFP / Tablas anuales BOE)
 */
const TABLA_DEPRECIACION_BOE = [
  { maxYears: 1, porcentaje: 100 },
  { maxYears: 2, porcentaje: 84 },
  { maxYears: 3, porcentaje: 67 },
  { maxYears: 4, porcentaje: 56 },
  { maxYears: 5, porcentaje: 47 },
  { maxYears: 6, porcentaje: 39 },
  { maxYears: 7, porcentaje: 34 },
  { maxYears: 8, porcentaje: 28 },
  { maxYears: 9, porcentaje: 24 },
  { maxYears: 10, porcentaje: 19 },
  { maxYears: 11, porcentaje: 17 },
  { maxYears: 12, porcentaje: 13 },
  { maxYears: 999, porcentaje: 10 }
];

/**
 * Valores medios de referencia base según tipo de vehículo nuevo (aproximación BOE)
 */
const PRECIOS_BASE_TIPO: Record<VehicleType, number> = {
  'Coches': 24000,
  'Furgonetas': 28000,
  'Camiones': 65000,
  'Motos': 7500,
  'Ciclomotores': 2400,
  'Autocaravanas': 55000,
  'Remolques': 3500,
  'Semirremolques': 22000,
  'Autobuses': 120000,
  'Vehículos industriales': 45000,
  'Maquinaria': 70000,
  'Vehículos especiales': 50000,
  'Grúas': 85000,
  'Tractores': 48000,
  'Vehículos agrícolas': 32000,
  'OTROS': 20000
};

export function calculateVehicleValuation(
  input: VehicleValuationInput,
  baseNewPrice?: number,
  calculatedRegistrationYear?: number
): VehicleValuationResult {
  const currentYear = new Date().getFullYear();
  const regYear = calculatedRegistrationYear || 
    (input.registrationDate ? new Date(input.registrationDate).getFullYear() : currentYear - 5);
  
  const ageYears = Math.max(0, currentYear - regYear);

  // 1. Obtener porcentaje BOE
  const bracket = TABLA_DEPRECIACION_BOE.find(b => ageYears <= b.maxYears) || TABLA_DEPRECIACION_BOE[TABLA_DEPRECIACION_BOE.length - 1];
  const porcentajeDepreciacionBoe = bracket.porcentaje;

  // Precio base de partida
  const initialBasePrice = baseNewPrice && baseNewPrice > 1000 
    ? baseNewPrice 
    : PRECIOS_BASE_TIPO[input.vehicleType] || 22000;

  // 2. Valor Venal BOE (cálculo puro Hacienda)
  const valorVenalBoe = Math.round(initialBasePrice * (porcentajeDepreciacionBoe / 100));

  // 3. Ajuste por Kilometraje (Mercado)
  // Media anual española: 15.000 km/año
  const expectedKm = Math.max(15000, ageYears * 15000);
  const kmDifference = input.kilometers - expectedKm;
  let factorKilometraje = 1.0;

  if (kmDifference > 0) {
    // Exceso de kilometraje: penalización gradual hasta máx -25%
    const penaltyPct = Math.min(0.25, (kmDifference / 100000) * 0.10);
    factorKilometraje = 1.0 - penaltyPct;
  } else {
    // Poco kilometraje: bonificación gradual hasta máx +15%
    const bonusPct = Math.min(0.15, (Math.abs(kmDifference) / 50000) * 0.08);
    factorKilometraje = 1.0 + bonusPct;
  }

  // 4. Factor de Estado
  const factoresEstado: Record<string, number> = {
    'Excelente': 1.08,
    'Bueno': 1.00,
    'Regular': 0.85,
    'Dañado': 0.60
  };
  const factorEstado = factoresEstado[input.condition] || 1.0;

  // 5. Valor de Mercado Estimado
  const valorMercadoEstimado = Math.round(valorVenalBoe * factorKilometraje * factorEstado);

  const fechaCalculo = new Date().toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  return {
    valorVenalBoe,
    porcentajeDepreciacionBoe,
    valorMercadoEstimado,
    factorKilometraje: Number(factorKilometraje.toFixed(2)),
    factorEstado: Number(factorEstado.toFixed(2)),
    fechaCalculo,
    fuenteBoe: `Orden HFP Ministerio de Hacienda (Antigüedad calculada: ${ageYears} años)`,
    disclaimer: 'Cálculo técnico y orientativo para peritaje de vehículos. Los valores venal y de mercado no constituyen tasación oficial vinculante sin inspección pericial presencial completa.'
  };
}
