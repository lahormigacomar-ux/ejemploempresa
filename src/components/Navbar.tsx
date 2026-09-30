import React from 'react';
import { Truck, Building2, UserCircle, Bell, ShieldCheck, DollarSign } from 'lucide-react';
import { UserRole, Planta } from '../types';

interface NavbarProps {
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  plantas: Planta[];
  selectedPlantaId: string;
  setSelectedPlantaId: (id: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRole,
  setCurrentRole,
  plantas,
  selectedPlantaId,
  setSelectedPlantaId
}) => {
  return (
    <header className="bg-slate-900 text-white shadow-md border-b border-slate-800 px-6 py-3 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center space-x-4">
        <div className="bg-amber-500 text-slate-950 p-2 rounded-xl font-bold flex items-center justify-center shadow-inner">
          <Truck className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
            CONCRETERA ERP <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/30">PRO v3.2</span>
          </h1>
          <p className="text-xs text-slate-400">Sistema Operativo Integral para Plantas de Hormigón y Áridos</p>
        </div>
      </div>

      <div className="flex items-center space-x-6">
        {/* Plant Selector */}
        <div className="flex items-center space-x-2 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
          <Building2 className="w-4 h-4 text-amber-400" />
          <span className="text-xs text-slate-400">Planta:</span>
          <select
            value={selectedPlantaId}
            onChange={(e) => setSelectedPlantaId(e.target.value)}
            className="bg-transparent text-xs font-medium text-white focus:outline-none cursor-pointer"
          >
            {plantas.map((p) => (
              <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                {p.nombre} ({p.codigo})
              </option>
            ))}
          </select>
        </div>

        {/* Role switcher for demo/testing */}
        <div className="flex items-center space-x-2 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
          <UserCircle className="w-4 h-4 text-emerald-400" />
          <span className="text-xs text-slate-400">Perfil:</span>
          <select
            value={currentRole}
            onChange={(e) => setCurrentRole(e.target.value as UserRole)}
            className="bg-transparent text-xs font-semibold text-amber-300 focus:outline-none cursor-pointer"
          >
            <option value="admin" className="bg-slate-900 text-white">Gerente / Administrador</option>
            <option value="dispatcher" className="bg-slate-900 text-white">Programador Logística</option>
            <option value="plant_operator" className="bg-slate-900 text-white">Operador Planta</option>
            <option value="lab" className="bg-slate-900 text-white">Laboratorista</option>
            <option value="sales" className="bg-slate-900 text-white">Comercial / Ventas</option>
            <option value="maintenance" className="bg-slate-900 text-white">Jefe Taller / Flota</option>
            <option value="client" className="bg-slate-900 text-white">🌐 Portal Cliente</option>
          </select>
        </div>

        <div className="flex items-center space-x-3">
          <button aria-label="Notificaciones del sistema" className="relative p-2 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition">
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
          </button>
          <div className="hidden lg:flex flex-col items-end">
            <span className="text-xs font-medium text-slate-200">ISO 9001:2015</span>
            <span className="text-[10px] text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Sistema Conectado
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
