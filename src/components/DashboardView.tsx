import React, { useState } from 'react';
import {
  TrendingUp,
  DollarSign,
  Truck,
  Factory,
  Box,
  FlaskConical,
  AlertTriangle,
  ChevronRight,
  ArrowUpRight,
  ShieldCheck,
  ShoppingCart,
  PieChart
} from 'lucide-react';
import { Pedido, Viaje, ProbetaLab } from '../types';

interface DashboardViewProps {
  pedidos: Pedido[];
  viajes: Viaje[];
  probetas: ProbetaLab[];
  onNavigate: (tab: any) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ pedidos, viajes, probetas, onNavigate }) => {
  const [selectedDrillDown, setSelectedDrillDown] = useState<string | null>(null);

  const totalM3Programados = pedidos.reduce((acc, p) => acc + p.cantidadM3, 0);
  const totalM3Entregados = viajes.filter(v => v.estado === 'entregado' || v.estado === 'en_obra').reduce((acc, v) => acc + v.cantidadM3, 16);
  const facturacionMes = 38450000;
  const costoPromedioM3 = 98400;
  const precioPromedioM3 = 138000;
  const margenPromedio = precioPromedioM3 - costoPromedioM3;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Tablero Gerencial & Rentabilidad Real</h2>
          <p className="text-xs text-slate-400">Resumen ejecutivo en tiempo real de producción, logística y costos por m³</p>
        </div>
        <div className="flex items-center space-x-3">
          <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" /> Consolidado Planta Central & Áridos
          </span>
        </div>
      </div>

      {/* Top KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => setSelectedDrillDown('comercial')}
          className="bg-slate-900 border border-slate-800 p-4 rounded-xl hover:border-amber-500/50 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Ventas & Entregas Mes</span>
            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg group-hover:bg-amber-500/20 group-hover:text-amber-400 transition">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white">{totalM3Entregados} / {totalM3Programados} m³</div>
            <div className="mt-1 flex items-center text-xs text-emerald-400">
              <ArrowUpRight className="w-3.5 h-3.5 mr-1" /> 84% cumplimiento de pedidos
            </div>
          </div>
        </div>

        <div
          onClick={() => setSelectedDrillDown('costos')}
          className="bg-slate-900 border border-slate-800 p-4 rounded-xl hover:border-amber-500/50 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Costo Real vs Venta (m³)</span>
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg group-hover:bg-amber-500/20 group-hover:text-amber-400 transition">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white">${costoPromedioM3.toLocaleString()} <span className="text-xs text-slate-400 font-normal">/m³</span></div>
            <div className="mt-1 text-xs text-amber-400 font-medium">
              Margen bruto: ${margenPromedio.toLocaleString()} ({((margenPromedio / precioPromedioM3) * 100).toFixed(1)}%)
            </div>
          </div>
        </div>

        <div
          onClick={() => onNavigate('logistics')}
          className="bg-slate-900 border border-slate-800 p-4 rounded-xl hover:border-amber-500/50 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Flota & Logística Activa</span>
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg group-hover:bg-amber-500/20 group-hover:text-amber-400 transition">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white">4 / 5 <span className="text-xs text-slate-400 font-normal">Mixers en ruta</span></div>
            <div className="mt-1 text-xs text-emerald-400">
              Tiempo promedio ciclo: 82 min
            </div>
          </div>
        </div>

        <div
          onClick={() => onNavigate('lab')}
          className="bg-slate-900 border border-slate-800 p-4 rounded-xl hover:border-amber-500/50 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Calidad & Probetas</span>
            <div className="p-2 bg-purple-500/10 text-purple-400 rounded-lg group-hover:bg-amber-500/20 group-hover:text-amber-400 transition">
              <FlaskConical className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white">{probetas.filter(p => p.estado === 'pendiente').length} Pendientes</div>
            <div className="mt-1 text-xs text-emerald-400">
              Cumplimiento roturas 28d: 98.4%
            </div>
          </div>
        </div>
      </div>

      {/* Drill-Down Detailed Modal / Box if selected */}
      {selectedDrillDown && (
        <div className="bg-slate-900 border border-amber-500/40 p-5 rounded-xl shadow-lg relative animate-fadeIn">
          <button
            onClick={() => setSelectedDrillDown(null)}
            className="absolute top-4 right-4 text-xs text-slate-400 hover:text-white bg-slate-800 px-2 py-1 rounded"
          >
            Cerrar Detalle
          </button>
          <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wide">
            Desglose de Costos y Rentabilidad Real (Drill-Down)
          </h3>
          <p className="text-xs text-slate-300 mt-1">
            Abriendo la estructura de costos por m³ de Hormigón H30 entregado en Obra Torres del Parque:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
              <span className="text-[11px] text-slate-400">1. Materias Primas</span>
              <div className="text-lg font-bold text-white mt-1">$48,200 <span className="text-xs text-slate-400 font-normal">/m³</span></div>
              <p className="text-[10px] text-slate-500 mt-1">Cemento, áridos lavados y aditivos plastificantes.</p>
            </div>
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
              <span className="text-[11px] text-slate-400">2. Producción & Planta</span>
              <div className="text-lg font-bold text-white mt-1">$12,500 <span className="text-xs text-slate-400 font-normal">/m³</span></div>
              <p className="text-[10px] text-slate-500 mt-1">Energía, operador dosificador, mantenimiento planta.</p>
            </div>
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
              <span className="text-[11px] text-slate-400">3. Logística & Transporte</span>
              <div className="text-lg font-bold text-white mt-1">$27,700 <span className="text-xs text-slate-400 font-normal">/m³</span></div>
              <p className="text-[10px] text-slate-500 mt-1">Mixer 12, combustible gasoil, chofer, neumáticos.</p>
            </div>
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
              <span className="text-[11px] text-slate-400">4. Estructura & Indirectos</span>
              <div className="text-lg font-bold text-white mt-1">$10,000 <span className="text-xs text-slate-400 font-normal">/m³</span></div>
              <p className="text-[10px] text-slate-500 mt-1">Laboratorio, administración, seguros y amortización.</p>
            </div>
          </div>
        </div>
      )}

      {/* Operational Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders & Status */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-amber-400" /> Pedidos del Día & Estado Logístico
            </h3>
            <button
              onClick={() => onNavigate('sales')}
              className="text-xs text-amber-400 hover:underline flex items-center gap-1"
            >
              Ver todos <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase font-semibold">
                <tr>
                  <th className="p-3">Código</th>
                  <th className="p-3">Obra / Destino</th>
                  <th className="p-3">Producto</th>
                  <th className="p-3">Volumen</th>
                  <th className="p-3">Horario</th>
                  <th className="p-3">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {pedidos.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/50 transition">
                    <td className="p-3 font-medium text-white">{p.codigo}</td>
                    <td className="p-3">{p.obraId}</td>
                    <td className="p-3">{p.productoId}</td>
                    <td className="p-3 font-semibold text-amber-400">{p.cantidadM3} m³</td>
                    <td className="p-3">{p.horario} hs</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        p.estado === 'programado' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                        p.estado === 'en_ejecucion' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                        'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      }`}>
                        {p.estado.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Fleet & Alerts Sidebar */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" /> Alertas Operativas & Mantenimiento
          </h3>

          <div className="space-y-3">
            <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-lg text-xs">
              <div className="font-semibold text-amber-400 flex items-center justify-between">
                <span>Vencimiento Licencia Chofer</span>
                <span className="text-[10px] bg-amber-500 text-slate-950 px-1.5 py-0.5 rounded font-bold">URGENTE</span>
              </div>
              <p className="text-slate-300 mt-1">Carlos Gómez (MIX-14) - Licencia vence en 20 días.</p>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/30 p-3 rounded-lg text-xs">
              <div className="font-semibold text-blue-400">Rotura Probeta 28 Días</div>
              <p className="text-slate-300 mt-1">Muestra MUE-2026-995 programada para ensayo hoy en laboratorio.</p>
            </div>

            <div className="bg-emerald-500/10 border border-emerald-500/30 p-3 rounded-lg text-xs">
              <div className="font-semibold text-emerald-400">Stock Cemento Normal</div>
              <p className="text-slate-300 mt-1">Silos al 78% de capacidad (85 Tn disponibles).</p>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={() => onNavigate('costs')}
              className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2.5 px-4 rounded-lg text-xs transition shadow-md flex items-center justify-center gap-2"
            >
              <PieChart className="w-4 h-4" /> Ver Análisis Completo de Costos
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
