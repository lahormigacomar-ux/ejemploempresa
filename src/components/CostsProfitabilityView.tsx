import React from 'react';
import { PieChart, DollarSign, TrendingUp, ShieldCheck } from 'lucide-react';

export const CostsProfitabilityView: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Costeo Real del Hormigón & Rentabilidad por m³</h2>
          <p className="text-xs text-slate-400">Análisis financiero de costos de materias primas, planta, logística, estructura y margen de contribución</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <PieChart className="w-4 h-4 text-amber-400" /> Desglose de Costo Real por m³ (H30 Bombeable)
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400">1. Materias Primas (Cemento, Áridos, Aditivos)</span>
              <div className="text-xl font-bold text-white mt-1">$48,200 <span className="text-xs text-slate-400 font-normal">/m³</span></div>
            </div>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400">2. Producción & Planta Dosificadora</span>
              <div className="text-xl font-bold text-white mt-1">$12,500 <span className="text-xs text-slate-400 font-normal">/m³</span></div>
            </div>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400">3. Logística & Transporte (Mixer + Chofer)</span>
              <div className="text-xl font-bold text-white mt-1">$27,700 <span className="text-xs text-slate-400 font-normal">/m³</span></div>
            </div>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400">4. Costos Indirectos & Estructura</span>
              <div className="text-xl font-bold text-white mt-1">$10,000 <span className="text-xs text-slate-400 font-normal">/m³</span></div>
            </div>
          </div>
          <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-xl flex justify-between items-center">
            <div>
              <span className="text-xs font-semibold text-amber-400">COSTO TOTAL REAL POR m³:</span>
              <div className="text-2xl font-extrabold text-white mt-0.5">$98,400 <span className="text-xs font-normal text-slate-300">/m³</span></div>
            </div>
            <div className="text-right">
              <span className="text-xs font-semibold text-emerald-400">MARGEN DE GANANCIA:</span>
              <div className="text-2xl font-extrabold text-emerald-400 mt-0.5">28.7% ($39,600 /m³)</div>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-amber-400" /> Punto de Equilibrio Mensual
          </h3>
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Costos Fijos Totales:</span>
              <span className="font-bold text-white">$24,500,000</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Margen Contribución Promedio:</span>
              <span className="font-bold text-emerald-400">$45,000 /m³</span>
            </div>
            <div className="pt-2 border-t border-slate-800 flex justify-between text-xs">
              <span className="text-slate-400 font-semibold">Volumen de Equilibrio:</span>
              <span className="font-extrabold text-amber-400">544 m³ / mes</span>
            </div>
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/30 p-3 rounded-lg text-xs text-emerald-400 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>Producción actual (2,850 m³) supera ampliamente el punto de equilibrio.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
