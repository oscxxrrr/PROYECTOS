import React from 'react';
import { Camera, Folder, Download, Car, Search, ShieldCheck, Wifi, WifiOff, RefreshCw, Settings, Bot, Smartphone, LogIn, LogOut, User2 } from 'lucide-react';
import { SyncState, User } from '../types';
import { AuthUser } from '../services/authService';

interface HeaderProps {
  currentTab: string;
  onNavigate: (tab: string) => void;
  syncState: SyncState;
  onManualSync: () => void;
  currentUser: User;
  onToggleUserRole: () => void;
  onOpenSettings: () => void;
  onOpenInstallModal: () => void;
  onOpenLoginModal: () => void;
  firebaseUser: AuthUser | null;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onNavigate,
  syncState,
  onManualSync,
  currentUser,
  onToggleUserRole,
  onOpenSettings,
  onOpenInstallModal,
  onOpenLoginModal,
  firebaseUser,
  onLogout
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <div 
            className="flex items-center gap-2.5 cursor-pointer select-none"
            onClick={() => onNavigate('dashboard')}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-menorca-600 to-menorca-800 flex items-center justify-center text-white shadow-md">
              <Car className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg sm:text-xl tracking-tight text-slate-900">
                  PERITATGES <span className="text-menorca-600">MENORCA</span>
                </span>
                <span className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-bold bg-menorca-100 text-menorca-800 rounded">
                  PRO
                </span>
              </div>
              <p className="text-[11px] text-slate-700 hidden sm:block">Peritaje fotográfico de vehículos</p>
            </div>
          </div>

          {/* Sync status & Actions */}
          <div className="flex items-center gap-2">
            {/* Install App / APK Button */}
            <button
              onClick={onOpenInstallModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black shadow-sm transition-all active:scale-95 cursor-pointer"
              title="Descargar APK para Android o instalar en iPhone"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>App Móvil</span>
            </button>

            {/* Sync State Badge */}
            <button
              onClick={onManualSync}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                syncState === 'synced'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                  : syncState === 'pending'
                  ? 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse hover:bg-amber-100'
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}
              title="Estado de sincronización (Pulsar para forzar sincronización)"
            >
              {syncState === 'synced' && (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span className="hidden xs:inline">Sincronizado</span>
                </>
              )}
              {syncState === 'pending' && (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-600" />
                  <span className="hidden xs:inline">Pendiente</span>
                </>
              )}
              {syncState === 'offline' && (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-rose-600" />
                  <span className="hidden xs:inline">Sin conexión</span>
                </>
              )}
            </button>

            {/* User role switch / Profile */}
            <button
              onClick={onToggleUserRole}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors"
              title={`Usuario actual: ${currentUser.name}. Pulsa para alternar rol`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-menorca-600" />
              <span className="capitalize">{currentUser.role}</span>
            </button>

            {/* Login / Logout button */}
            {firebaseUser ? (
              <button
                onClick={onLogout}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50 text-xs font-medium text-emerald-700 hover:bg-emerald-100 transition-colors"
                title={`Sesión iniciada como ${firebaseUser.email}. Pulsa para cerrar sesión`}
              >
                <User2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline max-w-[80px] truncate">{firebaseUser.displayName || firebaseUser.email?.split('@')[0]}</span>
                <LogOut className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={onOpenLoginModal}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-medium text-slate-600 hover:bg-menorca-50 hover:border-menorca-300 hover:text-menorca-700 transition-colors"
                title="Iniciar sesión para sincronizar datos en la nube"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Cuenta</span>
              </button>
            )}

            {/* Settings button */}
            <button
              onClick={onOpenSettings}
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Ajustes de compresión y almacenamiento"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Secondary Navigation Bar (Desktop & Mobile Tabs) */}
        <nav className="flex space-x-1 sm:space-x-2 py-2 overflow-x-auto no-scrollbar border-t border-slate-100 text-xs sm:text-sm font-medium">
          <button
            onClick={() => onNavigate('dashboard')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
              currentTab === 'dashboard'
                ? 'bg-menorca-600 text-white font-semibold shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>Inicio</span>
          </button>

          <button
            onClick={() => onNavigate('camera')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
              currentTab === 'camera'
                ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 font-medium'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>📷 Nuevo Peritaje</span>
          </button>

          <button
            onClick={() => onNavigate('appraisals')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
              currentTab === 'appraisals'
                ? 'bg-menorca-600 text-white font-semibold shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Folder className="w-4 h-4" />
            <span>📁 Mis Peritajes</span>
          </button>

          <button
            onClick={() => onNavigate('valuation')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
              currentTab === 'valuation'
                ? 'bg-menorca-600 text-white font-semibold shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Car className="w-4 h-4" />
            <span>🚗 Valoración</span>
          </button>

          <button
            onClick={() => onNavigate('lookup')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
              currentTab === 'lookup'
                ? 'bg-menorca-600 text-white font-semibold shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Search className="w-4 h-4" />
            <span>🔎 Datos Vehículo</span>
          </button>

          <button
            onClick={() => onNavigate('damage')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
              currentTab === 'damage'
                ? 'bg-purple-600 text-white font-semibold shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Bot className="w-4 h-4" />
            <span>🤖 Daños IA</span>
          </button>

          {currentUser.role === 'admin' && (
            <button
              onClick={() => onNavigate('admin')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                currentTab === 'admin'
                  ? 'bg-slate-800 text-white font-semibold shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span>Admin</span>
            </button>
          )}
        </nav>
      </div>
    </header>
  );
};
