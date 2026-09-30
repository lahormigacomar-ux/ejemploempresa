import React from 'react';
import { Box, Layers, ArrowUpRight } from 'lucide-react';
import { Articulo } from '../types';

interface StockAggregatesViewProps {
  articulos: Articulo[];
}

export const StockAggregatesView: React.FC<StockAggregatesViewProps> = ({ articulos }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Stock de Materiales & Módulo de Áridos (Modelos A / B / C)</h2>
          <p className="text-xs text-slate-400">Control unificado de materias primas, cemento, aditivos y trazabilidad de áridos triturados/lavados</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <Box className="w-4 h-4 text-amber-400" /> Artículos en Depósito Planta Central
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase font-semibold">
                <tr>
                  <th className="p-3">Código</th>
                  <th className="p-3">Descripción Artículo</th>
                  <th className="p-3">Categoría</th>
                  <th className="p-3">Stock Actual</th>
                  <th className="p-3">Costo Unitario</th>
                  <th className="p-3">Valorización</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {articulos.map((art) => {
                  const valorTotal = art.stockActual * art.costoUnitario;
                  return (
                    <tr key={art.id} className="hover:bg-slate-800/50">
                      <td className="p-3 font-mono font-bold text-amber-400">{art.codigo}</td>
                      <td className="p-3 font-medium text-white">{art.nombre}</td>
                      <td className="p-3 capitalize">{art.categoria.replace('_', ' ')}</td>
                      <td className="p-3 font-semibold text-emerald-400">{art.stockActual.toLocaleString()} {art.unidadMedida}</td>
                      <td className="p-3">${art.costoUnitario.toLocaleString()}</td>
                      <td className="p-3 font-bold text-white">${valorTotal.toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-400" /> Gestión de Áridos (Modelos)
          </h3>
          <div className="space-y-3">
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs">
              <div className="font-bold text-amber-400">Modelo A: Árido Comprado Terminado</div>
              <p className="text-slate-300 mt-1">Arena y piedra recepcionada en planta con costo puesto en destino.</p>
            </div>
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs">
              <div className="font-bold text-amber-400">Modelo B: Crudo + Procesamiento</div>
              <p className="text-slate-300 mt-1">Costo imputado por maquinaria CAT 950, trituración y lavado.</p>
            </div>
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs">
              <div className="font-bold text-amber-400">Modelo C: Producción 100% Cantera Propia</div>
              <p className="text-slate-300 mt-1">Extracción directa con cálculo de costo por tonelada procesada.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
