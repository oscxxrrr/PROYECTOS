import React, { useState } from 'react';
import { authService } from '../services/authService';

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

type Mode = 'login' | 'register';

export const LoginModal: React.FC<Props> = ({ onClose, onSuccess }) => {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await authService.login(email, password);
      } else {
        if (!name.trim()) { setError('Introduce tu nombre'); setLoading(false); return; }
        await authService.register(email, password, name.trim());
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      const msg: string = err?.code || err?.message || '';
      if (msg.includes('wrong-password') || msg.includes('invalid-credential')) {
        setError('Contraseña incorrecta');
      } else if (msg.includes('user-not-found')) {
        setError('No existe una cuenta con ese email');
      } else if (msg.includes('email-already-in-use')) {
        setError('Ese email ya está registrado');
      } else if (msg.includes('weak-password')) {
        setError('La contraseña debe tener al menos 6 caracteres');
      } else if (msg.includes('invalid-email')) {
        setError('Email no válido');
      } else {
        setError('Error al conectar. Comprueba tu conexión.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content login-modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>

        <div className="login-header">
          <div className="login-icon">🔐</div>
          <h2>{mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}</h2>
          <p className="login-subtitle">
            {mode === 'login'
              ? 'Accede para sincronizar tus informes en todos tus dispositivos'
              : 'Crea tu cuenta de perito para sincronizar datos'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {mode === 'register' && (
            <div className="form-group">
              <label>Nombre del perito</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Ej: Joan Pérez"
                required
                autoFocus
              />
            </div>
          )}

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="perito@example.com"
              required
              autoFocus={mode === 'login'}
            />
          </div>

          <div className="form-group">
            <label>Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder={mode === 'register' ? 'Mínimo 6 caracteres' : '••••••••'}
              required
              minLength={6}
            />
          </div>

          {error && <div className="login-error">⚠️ {error}</div>}

          <button type="submit" className="btn-primary login-btn" disabled={loading}>
            {loading ? (
              <span className="btn-loading">
                <span className="spinner-small"></span>
                {mode === 'login' ? 'Entrando...' : 'Creando cuenta...'}
              </span>
            ) : (
              mode === 'login' ? '→ Entrar' : '→ Crear cuenta'
            )}
          </button>
        </form>

        <div className="login-switch">
          {mode === 'login' ? (
            <><span>¿No tienes cuenta? </span><button type="button" onClick={() => { setMode('register'); setError(''); }}>Crear cuenta</button></>
          ) : (
            <><span>¿Ya tienes cuenta? </span><button type="button" onClick={() => { setMode('login'); setError(''); }}>Iniciar sesión</button></>
          )}
        </div>

        <div className="login-note">
          🔒 Tus datos se guardan de forma segura en Firebase. Sin Firebase configurado, la app funciona en modo local.
        </div>
      </div>
    </div>
  );
};
