import React, { useState } from 'react';
import { Appraisal, User } from '../types';
import { formatBytes } from '../services/imageCompressor';
import { ShieldCheck, Users, Folder, Camera, HardDrive, CheckCircle2, UserPlus, Calendar } from 'lucide-react';

interface AdminDashboardProps {
  appraisals: Appraisal[];
  currentUser: User;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  appraisals,
  currentUser
}) => {
  const [users, setUsers] = useState<User[]>([
    {
      id: 'usr_1',
      name: 'Óscar (Perito Principal)',
      email: 'oscar@peritatgesmenorca.com',
      role: 'admin',
      createdAt: '2026-01-15',
      lastLogin: new Date().toISOString()
    },
    {
      id: 'usr_2',
      name: 'Joan Pons (Perito Zona Ciutadella)',
      email: 'joan.ciutadella@peritatgesmenorca.com',
      role: 'perito',
      createdAt: '2026-03-10',
      lastLogin: '2026-09-22T17:40:00Z'
    },
    {
      id: 'usr_3',
      name: 'Marta Sintes (Perito Zona Maó)',
      email: 'marta.mao@peritatgesmenorca.com',
      role: 'perito',
      createdAt: '2026-05-02',
      lastLogin: '2026-09-23T11:15:00Z'
    }
  ]);

  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<'perito' | 'admin'>('perito');

  // Compute metrics
  const totalPhotos = appraisals.reduce((sum, a) => sum + a.photos.length, 0);
  const totalBytes = appraisals.reduce((sum, a) => sum + a.totalSizeBytes, 0);
  const originalBytesEstimated = appraisals.reduce((sum, a) => {
    return sum + a.photos.reduce((sub, p) => sub + (p.originalSizeBytes || p.sizeBytes * 8), 0);
  }, 0);
  const savedBytes = Math.max(0, originalBytesEstimated - totalBytes);
  const savedPercentage = originalBytesEstimated > 0
    ? Math.round((savedBytes / originalBytesEstimated) * 100)
    : 85;

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName || !newUserEmail) return;

    const newUser: User = {
      id: `usr_${Date.now()}`,
      name: newUserName,
      email: newUserEmail,
      role: newUserRole,
      createdAt: new Date().toISOString().split('T')[0],
      lastLogin: 'Nunca'
    };

    setUsers(prev => [...prev, newUser]);
    setNewUserName('');
    setNewUserEmail('');
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-200 flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-menorca-600" />
            <span>Panel de Administración Global</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Métricas de infraestructura, auditoría de peritos y optimización de almacenamiento
          </p>
        </div>
        <span className="px-3 py-1 bg-slate-900 text-white text-xs font-bold rounded-lg font-mono">
          ROL: ADMINISTRADOR
        </span>
      </div>

      {/* Metrics 4-grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Appraisals */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Peritajes</span>
            <Folder className="w-5 h-5 text-menorca-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
            {appraisals.length}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Carpetas por matrícula</p>
        </div>

        {/* Total Photos */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Fotografías</span>
            <Camera className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
            {totalPhotos}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Fotos optimizadas</p>
        </div>

        {/* Storage Used */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Espacio Ocupado</span>
            <HardDrive className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
            {formatBytes(totalBytes)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Compresión WebP/JPEG</p>
        </div>

        {/* Space Saved */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm bg-gradient-to-br from-emerald-50 to-emerald-100/50">
          <div className="flex items-center justify-between text-emerald-800 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Espacio Ahorrado</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-900 font-mono">
            {savedPercentage}%
          </div>
          <p className="text-[11px] text-emerald-800 mt-1">
            ~{formatBytes(savedBytes)} ahorrados
          </p>
        </div>
      </div>

      {/* Users & Appraisers List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-menorca-600" />
              <span>Peritos y Usuarios del Sistema ({users.length})</span>
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-600 uppercase font-semibold">
                  <th className="pb-2.5">Nombre</th>
                  <th className="pb-2.5">Email</th>
                  <th className="pb-2.5">Rol</th>
                  <th className="pb-2.5">Alta</th>
                  <th className="pb-2.5">Último Acceso</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 font-bold text-slate-900">{u.name}</td>
                    <td className="py-3 text-slate-700 font-mono">{u.email}</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                        u.role === 'admin'
                          ? 'bg-slate-900 text-white'
                          : 'bg-menorca-100 text-menorca-800'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 text-slate-600">{u.createdAt}</td>
                    <td className="py-3 text-slate-600 font-mono">{u.lastLogin.split('T')[0]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add User Box */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-200">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider pb-3 mb-4 border-b border-slate-100 flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-emerald-600" />
            <span>Añadir Nuevo Perito</span>
          </h2>

          <form onSubmit={handleAddUser} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nombre Completo</label>
              <input
                type="text"
                placeholder="ej: Carles Barber"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email Profesional</label>
              <input
                type="email"
                placeholder="perito@peritatgesmenorca.com"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Rol</label>
              <select
                value={newUserRole}
                onChange={(e) => setNewUserRole(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
              >
                <option value="perito">Perito</option>
                <option value="admin">Administrador</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-menorca-600 hover:bg-menorca-500 text-white font-bold text-xs rounded-xl shadow-md transition-all mt-2"
            >
              Registrar Perito
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
