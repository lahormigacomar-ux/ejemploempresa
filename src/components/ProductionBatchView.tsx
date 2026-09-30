import React from 'react';
import { Factory, CheckCircle } from 'lucide-react';
import { ProduccionHormigon } from '../types';

interface ProductionBatchViewProps {
  produccion: ProduccionHormigon[];
}

export const ProductionBatchView: React.FC<ProductionBatchViewProps> = ({ produccion }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Producción de Hormigón, Dosificación & Integración Betonmac</h2>
          <p className="text-xs text-slate-400">Comparativa teórica vs real de materias primas (cemento, áridos, aditivos) y fábrica de premoldeados</p>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
          <Factory className="w-4 h-4 text-amber-400" /> Lotes de Producción Registrados (Planta Central)
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase font-semibold">
              <tr>
                <th className="p-3">Lote ID</th>
                <th className="p-3">Fórmula</th>
                <th className="p-3">Volumen</th>
                <th className="p-3">Cemento (Teo / Real)</th>
                <th className="p-3">Arena (Teo / Real)</th>
                <th className="p-3">Piedra (Teo / Real)</th>
                <th className="p-3">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {produccion.map((p) => (
                <tr key={p.id} className="hover:bg-slate-800/50">
                  <td className="p-3 font-mono font-bold text-amber-400">{p.id}</td>
                  <td className="p-3 font-medium text-white">{p.formulaId}</td>
                  <td className="p-3 font-bold text-emerald-400">{p.m3Producidos} m³</td>
                  <td className="p-3">{p.cementoTeoricoKg} kg / <span className="text-white font-bold">{p.cementoRealKg} kg</span></td>
                  <td className="p-3">{p.arenaTeoricoKg} kg / <span className="text-white font-bold">{p.arenaRealKg} kg</span></td>
                  <td className="p-3">{p.piedraTeoricoKg} kg / <span className="text-white font-bold">{p.piedraRealKg} kg</span></td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 w-fit">
                      <CheckCircle className="w-3 h-3" /> BETONMAC OK
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
