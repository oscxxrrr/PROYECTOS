import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { CameraModal } from './components/CameraModal';
import { OcrPlateModal } from './components/OcrPlateModal';
import { AppraisalList } from './components/AppraisalList';
import { AppraisalDetail } from './components/AppraisalDetail';
import { VehicleValuation } from './components/VehicleValuation';
import { VehicleLookup } from './components/VehicleLookup';
import { DamageAnalysis } from './components/DamageAnalysis';
import { AdminDashboard } from './components/AdminDashboard';
import { SettingsModal } from './components/SettingsModal';
import { InstallAppModal } from './components/InstallAppModal';
import { LoginModal } from './components/LoginModal';
import { authService, AuthUser } from './services/authService';
import { cloudSyncService } from './services/cloudSyncService';
import { storageService } from './services/storage/storageService';
import { Appraisal, AppraisalPhoto, CompressionSettings, SyncState, User } from './types';
import { DEFAULT_COMPRESSION_SETTINGS, formatBytes } from './services/imageCompressor';
import { downloadBulkAppraisalsZip } from './services/zipService';
import { Camera, Folder, Download, Car, Search, ShieldCheck, Sparkles, HardDrive, CheckCircle2, Plus, ArrowRight, Smartphone } from 'lucide-react';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [appraisals, setAppraisals] = useState<Appraisal[]>([]);
  const [selectedPlate, setSelectedPlate] = useState<string | null>(null);
  const [valuationPlate, setValuationPlate] = useState<string | undefined>(undefined);
  const [lookupPlate, setLookupPlate] = useState<string | undefined>(undefined);

  // Camera & OCR flow states
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [activeCameraPlate, setActiveCameraPlate] = useState<string | undefined>(undefined);
  const [pendingPhotos, setPendingPhotos] = useState<AppraisalPhoto[]>([]);
  const [isOcrModalOpen, setIsOcrModalOpen] = useState(false);

  // Settings & Sync states
  const [syncState, setSyncState] = useState<SyncState>('synced');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState<AuthUser | null>(null);
  const [compressionSettings, setCompressionSettings] = useState<CompressionSettings>(DEFAULT_COMPRESSION_SETTINGS);

  // Current User (Role: Admin / Perito)
  const [currentUser, setCurrentUser] = useState<User>({
    id: 'usr_oscar',
    name: 'Óscar (Perito Menorca)',
    email: 'oscar@peritatgesmenorca.com',
    role: 'perito',
    createdAt: '2026-01-01',
    lastLogin: new Date().toISOString()
  });

  // Load appraisals on mount
  useEffect(() => {
    loadAppraisals();
    const unsubAuth = authService.onAuthStateChanged(async (user) => {
      setFirebaseUser(user);
      if (user) {
        setCurrentUser(prev => ({
          ...prev,
          id: user.uid,
          name: user.displayName || user.email || prev.name,
          email: user.email || prev.email
        }));
        if (cloudSyncService.isAvailable()) {
          try {
            const cloudAppraisals = await cloudSyncService.downloadAllAppraisals(user.uid);
            for (const appr of cloudAppraisals) {
              const existing = await storageService.getAppraisalByPlate(appr.plate);
              if (!existing) {
                await storageService.saveAppraisal(appr.plate, appr.photos, appr.userId, appr.userName);
              }
            }
            await loadAppraisals();
          } catch (e) { console.warn('Cloud sync error:', e); }
        }
      }
    });
    const unsubscribe = storageService.subscribeSyncState((state) => {
      setSyncState(state);
    });
    return () => { unsubscribe(); unsubAuth(); };
  }, []);

  const loadAppraisals = async () => {
    const data = await storageService.getAppraisals();
    setAppraisals(data);
  };

  // Launch camera for a brand new vehicle appraisal
  const handleStartNewAppraisal = () => {
    setActiveCameraPlate(undefined);
    setIsCameraOpen(true);
  };

  // Launch camera to append photos to an existing plate
  const handleAddPhotosToExistingPlate = (plate: string) => {
    setActiveCameraPlate(plate);
    setIsCameraOpen(true);
  };

  // Camera finished shooting photos
  const handleCameraFinished = async (photos: AppraisalPhoto[]) => {
    setIsCameraOpen(false);

    if (activeCameraPlate) {
      // Append directly to the known plate without needing OCR
      const saved5 = await storageService.saveAppraisal(activeCameraPlate, photos, currentUser.id, currentUser.name);
      if (firebaseUser && cloudSyncService.isAvailable()) {
        cloudSyncService.uploadAppraisal(firebaseUser.uid, saved5).catch(console.warn);
      }
      await loadAppraisals();
      setSelectedPlate(activeCameraPlate);
      setCurrentTab('appraisal-detail');
    } else {
      // Brand new shoot: store temporary photos and trigger OCR / manual entry modal
      setPendingPhotos(photos);
      setIsOcrModalOpen(true);
    }
  };

  const handleConfirmPlate = async (finalPlate: string) => {
    setIsOcrModalOpen(false);
    if (!finalPlate || pendingPhotos.length === 0) return;

    const saved6 = await storageService.saveAppraisal(finalPlate, pendingPhotos, currentUser.id, currentUser.name);
    if (firebaseUser && cloudSyncService.isAvailable()) {
      cloudSyncService.uploadAppraisal(firebaseUser.uid, saved6).catch(console.warn);
    }
    await loadAppraisals();
    setPendingPhotos([]);
    setSelectedPlate(finalPlate);
    setCurrentTab('appraisal-detail');
  };

  const handleDeleteAppraisal = async (plate: string) => {
    await storageService.deleteAppraisal(plate);
    await loadAppraisals();
    if (selectedPlate === plate) {
      setSelectedPlate(null);
      setCurrentTab('appraisals');
    }
  };

  const handleDeletePhoto = async (plate: string, photoId: string) => {
    await storageService.deletePhoto(plate, photoId);
    await loadAppraisals();
  };

  const handleDownloadAllZip = async () => {
    if (appraisals.length === 0) {
      alert('No hay peritajes registrados para descargar.');
      return;
    }
    await downloadBulkAppraisalsZip(appraisals);
  };

  const handleToggleUserRole = () => {
    setCurrentUser(prev => ({
      ...prev,
      role: prev.role === 'admin' ? 'perito' : 'admin'
    }));
  };

  // Navigation helpers
  const handleNavigateToValuation = (plate: string) => {
    setValuationPlate(plate);
    setCurrentTab('valuation');
  };

  const handleNavigateToLookup = (plate: string) => {
    setLookupPlate(plate);
    setCurrentTab('lookup');
  };

  const activeAppraisal = selectedPlate ? appraisals.find(a => a.plate === selectedPlate) : null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Header */}
      <Header
        currentTab={currentTab}
        onNavigate={(tab) => {
          if (tab === 'camera') {
            handleStartNewAppraisal();
          } else {
            setCurrentTab(tab);
          }
        }}
        syncState={syncState}
        onManualSync={() => storageService.syncPendingData()}
        currentUser={currentUser}
        onToggleUserRole={handleToggleUserRole}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenInstallModal={() => setIsInstallModalOpen(true)}
        onOpenLoginModal={() => setIsLoginModalOpen(true)}
        firebaseUser={firebaseUser}
        onLogout={async () => { await authService.logout(); setFirebaseUser(null); }}
      />

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 pb-20">
        {/* DASHBOARD (PANTALLA PRINCIPAL) */}
        {currentTab === 'dashboard' && (
          <div className="space-y-6 max-w-4xl mx-auto">
            {/* Main Hero Card */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-menorca-950 text-white rounded-3xl p-6 sm:p-10 shadow-xl relative overflow-hidden">
              <div className="relative z-10 space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-menorca-500/20 text-menorca-300 border border-menorca-400/30 text-xs font-bold tracking-wide">
                  <Sparkles className="w-3.5 h-3.5 text-menorca-400" />
                  <span>SISTEMA PROFESIONAL DE PERITAJE</span>
                </div>
                <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
                  PERITATGES <span className="text-menorca-400">MENORCA</span>
                </h1>
                <p className="text-slate-300 text-sm sm:text-base max-w-xl leading-relaxed">
                  Fotografía ultrarrápida de vehículos, detección automática de matrícula mediante OCR, compresión en el móvil y organización inmediata en carpetas.
                </p>

                <div className="pt-2 flex flex-wrap gap-3">
                  <button
                    onClick={handleStartNewAppraisal}
                    className="w-full sm:w-auto py-4 px-8 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-lg rounded-2xl shadow-xl shadow-emerald-950/40 active:scale-95 transition-all flex items-center justify-center gap-3 cursor-pointer"
                  >
                    <Camera className="w-7 h-7" />
                    <span>📷 NUEVO PERITAJE</span>
                  </button>
                  <button
                    onClick={() => setIsInstallModalOpen(true)}
                    className="w-full sm:w-auto py-4 px-6 bg-slate-800/80 hover:bg-slate-700/80 text-white border border-slate-700 font-bold text-sm sm:text-base rounded-2xl transition-all flex items-center justify-center gap-2.5 cursor-pointer"
                  >
                    <Smartphone className="w-5 h-5 text-emerald-400" />
                    <span>📱 Instalar App / APK</span>
                  </button>
                </div>
              </div>
              <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 w-64 h-64 bg-menorca-500/10 rounded-full blur-3xl pointer-events-none" />
            </div>

            {/* Quick Action Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={() => setCurrentTab('appraisals')}
                className="bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl p-5 shadow-sm text-left transition-all active:scale-98 flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-menorca-50 text-menorca-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Folder className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900 group-hover:text-menorca-600 transition-colors">
                      📁 MIS PERITAJES
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {appraisals.length} vehículos peritados organizados
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-menorca-600 group-hover:translate-x-1 transition-all" />
              </button>

              <button
                onClick={handleDownloadAllZip}
                disabled={appraisals.length === 0}
                className={`border rounded-2xl p-5 shadow-sm text-left transition-all active:scale-98 flex items-center justify-between group ${
                  appraisals.length > 0
                    ? 'bg-white hover:bg-slate-50 border-slate-200 cursor-pointer'
                    : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Download className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900 group-hover:text-blue-600 transition-colors">
                      ⬇️ DESCARGAR TODO
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Un único ZIP con subcarpetas por matrícula
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
              </button>

              <button
                onClick={() => setCurrentTab('valuation')}
                className="bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl p-5 shadow-sm text-left transition-all active:scale-98 flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Car className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900 group-hover:text-amber-600 transition-colors">
                      🚗 VALORACIÓN DEL VEHÍCULO
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Valor Venal BOE vs. Valor de mercado
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-1 transition-all" />
              </button>

              <button
                onClick={() => setCurrentTab('lookup')}
                className="bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl p-5 shadow-sm text-left transition-all active:scale-98 flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Search className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900 group-hover:text-purple-600 transition-colors">
                      🔎 DATOS DEL VEHÍCULO
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Ficha técnica y serie de matriculación DGT
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
              </button>
            </div>

            {/* Storage Info Widget */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-menorca-600" />
                <span>
                  Espacio en móvil:{' '}
                  <strong className="text-slate-900">
                    {formatBytes(appraisals.reduce((sum, a) => sum + a.totalSizeBytes, 0))}
                  </strong>
                </span>
              </div>
              <div className="flex items-center gap-2 text-emerald-700 font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Compresión activa al {Math.round(compressionSettings.quality * 100)}% (Ahorro ~88%)</span>
              </div>
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="text-menorca-600 font-bold hover:underline cursor-pointer"
              >
                Ajustes de compresión →
              </button>
            </div>
          </div>
        )}

        {/* LISTADO DE PERITAJES */}
        {currentTab === 'appraisals' && (
          <AppraisalList
            appraisals={appraisals}
            onSelectAppraisal={(plate) => {
              setSelectedPlate(plate);
              setCurrentTab('appraisal-detail');
            }}
            onNewAppraisal={handleStartNewAppraisal}
            onDeleteAppraisal={handleDeleteAppraisal}
            onAddPhotosToPlate={handleAddPhotosToExistingPlate}
          />
        )}

        {/* DETALLE Y FOTOGRAFÍAS DE UN VEHÍCULO */}
        {currentTab === 'appraisal-detail' && activeAppraisal && (
          <AppraisalDetail
            appraisal={activeAppraisal}
            onBack={() => setCurrentTab('appraisals')}
            onAddPhotos={handleAddPhotosToExistingPlate}
            onDeletePhoto={handleDeletePhoto}
            onDeleteAppraisal={handleDeleteAppraisal}
            onNavigateToValuation={handleNavigateToValuation}
            onNavigateToLookup={handleNavigateToLookup}
          />
        )}

        {/* MÓDULO DE VALORACIÓN BOE Y MERCADO */}
        {currentTab === 'valuation' && (
          <VehicleValuation
            initialPlate={valuationPlate}
          />
        )}

        {/* CONSULTA DGT Y FICHA TÉCNICA */}
        {currentTab === 'lookup' && (
          <VehicleLookup
            initialPlate={lookupPlate}
            onNavigateToValuation={handleNavigateToValuation}
            onNavigateToCameraWithPlate={handleAddPhotosToExistingPlate}
          />
        )}

        {/* IA DAÑOS PREVIEW */}
        {currentTab === 'damage' && (
          <DamageAnalysis
            appraisals={appraisals}
            onSelectAppraisal={(plate) => {
              setSelectedPlate(plate);
              setCurrentTab('appraisal-detail');
            }}
          />
        )}

        {/* PANEL DE ADMINISTRACIÓN */}
        {currentTab === 'admin' && (
          <AdminDashboard
            appraisals={appraisals}
            currentUser={currentUser}
          />
        )}
      </main>

      {/* FULLSCREEN REAL-TIME CAMERA MODAL */}
      <CameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onFinishAppraisal={handleCameraFinished}
        existingPlate={activeCameraPlate}
        compressionSettings={compressionSettings}
      />

      {/* OCR PLATE DETECTION & MANUAL FALLBACK MODAL */}
      <OcrPlateModal
        isOpen={isOcrModalOpen}
        photos={pendingPhotos}
        onConfirmPlate={handleConfirmPlate}
        onCancel={() => {
          setIsOcrModalOpen(false);
          setPendingPhotos([]);
        }}
      />

      {/* COMPRESSION & STORAGE SETTINGS MODAL */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={compressionSettings}
        onSaveSettings={setCompressionSettings}
      />

      {/* LOGIN MODAL */}
      {isLoginModalOpen && (
        <LoginModal
          onClose={() => setIsLoginModalOpen(false)}
          onSuccess={() => setIsLoginModalOpen(false)}
        />
      )}

      {/* MOBILE APP & APK DOWNLOAD MODAL */}
      <InstallAppModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
      />
    </div>
  );
};

export default App;
