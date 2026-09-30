import React from 'react';
import {
  LayoutDashboard,
  Layers,
  Users,
  Truck,
  Box,
  ShoppingCart,
  MapPin,
  Factory,
  FlaskConical,
  Receipt,
  PieChart,
  Globe,
  ShieldAlert
} from 'lucide-react';

export type ActiveTab =
  | 'dashboard'
  | 'masters'
  | 'personnel'
  | 'fleet'
  | 'stock'
  | 'sales'
  | 'logistics'
  | 'production'
  | 'lab'
  | 'finance'
  | 'costs'
  | 'portal'
  | 'audit';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const menuItems: { id: ActiveTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'dashboard', label: 'Tablero Gerencial', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'masters', label: 'Maestros & C. Costo', icon: <Layers className="w-4 h-4" /> },
    { id: 'personnel', label: 'Personal & Sueldos', icon: <Users className="w-4 h-4" />, badge: 'ARCA' },
    { id: 'fleet', label: 'Flota & Taller', icon: <Truck className="w-4 h-4" /> },
    { id: 'stock', label: 'Stock & Áridos (A/B/C)', icon: <Box className="w-4 h-4" /> },
    { id: 'sales', label: 'Ventas & Pedidos', icon: <ShoppingCart className="w-4 h-4" /> },
    { id: 'logistics', label: 'Logística & GPS', icon: <MapPin className="w-4 h-4" />, badge: 'OR-Tools' },
    { id: 'production', label: 'Producción & Planta', icon: <Factory className="w-4 h-4" />, badge: 'Betonmac' },
    { id: 'lab', label: 'Laboratorio & Probetas', icon: <FlaskConical className="w-4 h-4" /> },
    { id: 'finance', label: 'Facturación & Tesorería', icon: <Receipt className="w-4 h-4" /> },
    { id: 'costs', label: 'Costos & Rentabilidad', icon: <PieChart className="w-4 h-4" />, badge: 'Real' },
    { id: 'portal', label: 'Portal Clientes (Web)', icon: <Globe className="w-4 h-4" /> },
    { id: 'audit', label: 'Auditoría & Eventos', icon: <ShieldAlert className="w-4 h-4" /> }
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-[calc(100vh-61px)] overflow-y-auto">
      <div className="p-4">
        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-2">Módulos del ERP</span>
        <nav className="mt-2 space-y-1">
          {menuItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 font-semibold shadow-md'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-3">
                  {item.icon}
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                      isActive ? 'bg-slate-950 text-amber-300' : 'bg-slate-800 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto p-4 border-t border-slate-800 bg-slate-950/40">
        <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 text-xs">
          <p className="text-slate-400 font-medium">Estado del Sistema:</p>
          <div className="mt-1 flex items-center justify-between text-[11px]">
            <span className="text-slate-300">Plantas Operativas:</span>
            <span className="font-bold text-emerald-400">2 / 2</span>
          </div>
          <div className="mt-0.5 flex items-center justify-between text-[11px]">
            <span className="text-slate-300">Mixers en Ruta:</span>
            <span className="font-bold text-amber-400">4 activos</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
