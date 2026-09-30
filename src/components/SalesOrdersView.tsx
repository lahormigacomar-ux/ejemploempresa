import React from 'react';
import { ShoppingCart, CheckCircle, Clock } from 'lucide-react';
import { Pedido } from '../types';

interface SalesOrdersViewProps {
  pedidos: Pedido[];
}

export const SalesOrdersView: React.FC<SalesOrdersViewProps> = ({ pedidos }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Ventas, Cotizaciones & Pedidos de Hormigón</h2>
          <p className="text-xs text-slate-400">Control de créditos de clientes, aprobación comercial y canal de venta mediante terceros/corralones</p>
        </div>
        <button className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-lg text-xs transition shadow-md flex items-center gap-2">
          + Nueva Cotización / Pedido
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
          <ShoppingCart className="w-4 h-4 text-amber-400" /> Listado de Pedidos Activos y Programados
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase font-semibold">
              <tr>
                <th className="p-3">Código</th>
                <th className="p-3">Cliente / Obra</th>
                <th className="p-3">Producto / Fórmula</th>
                <th className="p-3">Volumen</th>
                <th className="p-3">Precio Unitario</th>
                <th className="p-3">Canal de Venta</th>
                <th className="p-3">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {pedidos.map((p) => (
                <tr key={p.id} className="hover:bg-slate-800/50">
                  <td className="p-3 font-mono font-bold text-amber-400">{p.codigo}</td>
                  <td className="p-3 font-medium text-white">{p.clienteId} <br /><span className="text-[11px] text-slate-400">{p.obraId}</span></td>
                  <td className="p-3">{p.productoId}</td>
                  <td className="p-3 font-bold text-amber-400">{p.cantidadM3} m³</td>
                  <td className="p-3">${p.precioUnitario.toLocaleString()}</td>
                  <td className="p-3 capitalize">{p.canalVenta} {p.terceroNombre && `(${p.terceroNombre})`}</td>
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
    </div>
  );
};
