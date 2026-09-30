import React from 'react';
import { Truck, Wrench, Fuel, ShieldAlert } from 'lucide-react';
import { Equipo, OrdenMantenimiento } from '../types';

interface FleetViewProps {
  equipos: Equipo[];
  ordenesMantenimiento: OrdenMantenimiento[];
}

export const FleetView: React.FC<FleetViewProps> = ({ equipos, ordenesMantenimiento }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Flota, Taller & Mantenimiento Preventivo</h2>
          <p className="text-xs text-slate-400">Seguimiento de km, horómetros, órdenes de trabajo (OT), neumáticos y consumo de combustible</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <Truck className="w-4 h-4 text-amber-400" /> Estado de Equipos y Rendimiento (km/lt)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase font-semibold">
                <tr>
                  <th className="p-3">Código</th>
                  <th className="p-3">Tipo</th>
                  <th className="p-3">Dominio</th>
                  <th className="p-3">Km / Horómetro</th>
                  <th className="p-3">Rendimiento Est.</th>
                  <th className="p-3">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {equipos.map((eq) => (
                  <tr key={eq.id} className="hover:bg-slate-800/50">
                    <td className="p-3 font-mono font-bold text-amber-400">{eq.codigo}</td>
                    <td className="p-3 capitalize">{eq.tipo}</td>
                    <td className="p-3 font-mono">{eq.dominio}</td>
                    <td className="p-3">{eq.kmActual > 0 ? `${eq.kmActual.toLocaleString()} km` : `${eq.horometroActual} hs`}</td>
                    <td className="p-3 text-emerald-400 font-semibold">{eq.tipo === 'mixer' ? '3.2 km/lt' : '14.5 lt/h'}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        eq.estado === 'trabajando' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                        'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      }`}>
                        {eq.estado.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Wrench className="w-4 h-4 text-amber-400" /> Órdenes de Trabajo (OT)
          </h3>
          <div className="space-y-3">
            {ordenesMantenimiento.map((ot) => (
              <div key={ot.id} className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs">
                <div className="flex justify-between font-bold text-white">
                  <span>OT #{ot.id} ({ot.equipoId})</span>
                  <span className="text-emerald-400">${ot.costoTotal.toLocaleString()}</span>
                </div>
                <p className="text-slate-300 mt-1">{ot.fallaReportada}</p>
                <p className="text-[10px] text-slate-400 mt-1">Trabajo: {ot.trabajoRealizado}</p>
              </div>
            ))}
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
              <Fuel className="w-4 h-4" /> Tanque Propio de Combustible
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Stock Actual Gasoil:</span>
              <span className="font-bold text-emerald-400">15,000 Litros</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Consumo Hoy:</span>
              <span className="font-bold text-white">1,240 Litros</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
