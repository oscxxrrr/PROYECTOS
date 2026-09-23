import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Trash2, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary capturó un error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleClearAndReload = () => {
    if (window.confirm('¿Deseas reiniciar la memoria caché local? Los datos guardados se recargarán desde almacenamiento.')) {
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (e) {
        console.error(e);
      }
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4 font-sans">
          <div className="bg-slate-800 border border-slate-700 max-w-md w-full rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 mx-auto flex items-center justify-center border border-amber-500/30">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-xl font-extrabold text-white">Recuperación del Sistema</h2>
              <p className="text-slate-400 text-sm mt-1.5 leading-relaxed">
                Se ha producido una excepción en la carga de la interfaz. Pulsa recargar para restablecer la vista.
              </p>
            </div>

            {this.state.error && (
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-left font-mono text-xs text-rose-300 max-h-24 overflow-y-auto">
                {this.state.error.message}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                onClick={this.handleReload}
                className="py-3 px-4 bg-menorca-600 hover:bg-menorca-500 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Recargar</span>
              </button>

              <button
                onClick={this.handleClearAndReload}
                className="py-3 px-4 bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium rounded-xl text-sm flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Limpiar Caché</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
