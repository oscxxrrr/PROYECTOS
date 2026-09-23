export type VehicleType = 
  | 'Coches' 
  | 'Furgonetas' 
  | 'Camiones' 
  | 'Motos' 
  | 'Ciclomotores' 
  | 'Autocaravanas' 
  | 'Remolques' 
  | 'Semirremolques' 
  | 'Autobuses' 
  | 'Vehículos industriales' 
  | 'Maquinaria' 
  | 'Vehículos especiales' 
  | 'Grúas' 
  | 'Tractores' 
  | 'Vehículos agrícolas' 
  | 'OTROS';

export interface AppraisalPhoto {
  id: string;
  filename: string; // e.g. "foto_001.jpg"
  dataUrl: string; // base64 preview
  sizeBytes: number; // compressed size
  originalSizeBytes: number;
  width: number;
  height: number;
  createdAt: string;
}

export interface Appraisal {
  id: string;
  plate: string; // strictly normalized, e.g. "1234ABC"
  folderName: string; // strictly same as plate, e.g. "1234ABC"
  createdAt: string;
  updatedAt: string;
  userId: string;
  userName: string;
  photos: AppraisalPhoto[];
  photoCount: number;
  totalSizeBytes: number;
  synced: boolean;
  notes?: string;
  vehicleData?: VehicleTechnicalData;
}

export interface VehicleTechnicalData {
  plate: string;
  brand: string;
  model: string;
  version: string;
  year: number;
  registrationDate: string;
  fuelType: string;
  displacement: string;
  powerHp: number;
  vehicleType: VehicleType;
  environmentalBadge: '0' | 'ECO' | 'C' | 'B' | 'Sin distintivo';
  estimatedMarketValue: number;
  source: string;
  verified: boolean;
  notes?: string;
}

export type VehicleCondition = 'Excelente' | 'Bueno' | 'Regular' | 'Dañado';

export interface VehicleValuationInput {
  plate: string;
  kilometers: number;
  vehicleType: VehicleType;
  condition: VehicleCondition;
  registrationDate?: string;
  brand?: string;
  model?: string;
  version?: string;
}

export interface VehicleValuationResult {
  valorVenalBoe: number;
  porcentajeDepreciacionBoe: number;
  valorMercadoEstimado: number;
  factorKilometraje: number;
  factorEstado: number;
  fechaCalculo: string;
  fuenteBoe: string;
  disclaimer: string;
}

export interface CompressionSettings {
  maxDimension: number; // e.g. 1920
  quality: number; // 0.75 - 0.90
  format: 'image/jpeg' | 'image/webp';
}

export type SyncState = 'synced' | 'pending' | 'offline';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'perito';
  createdAt: string;
  lastLogin: string;
  appraisalCount?: number;
  photoCount?: number;
  storageBytesUsed?: number;
}
