import React from 'react';
import { MapPin, Truck, Play, ShieldCheck } from 'lucide-react';
import { Viaje, Equipo } from '../types';

interface LogisticsDispatchViewProps {
  viajes: Viaje[];
  equipos: Equipo[];
}

export const LogisticsDispatchView: React.FC<LogisticsDispatchViewProps> = ({ viajes, equipos }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Programación Diaria & Optimización Logística (OR-Tools)</h2>
          <p className="text-xs text-slate-400">Asignación automática de mixers, choferes, rutas geolocalizadas y seguimiento en tiempo real</p>
        </div>
        <button className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-lg text-xs transition shadow-md flex items-center gap-2">
          <Play className="w-4 h-4" /> Ejecutar Optimizador OR-Tools
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <Truck className="w-4 h-4 text-amber-400" /> Viajes Activos & Estado de Entrega
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase font-semibold">
                <tr>
                  <th className="p-3">Remito</th>
                  <th className="p-3">Mixer</th>
                  <th className="p-3">Obra / Destino</th>
                  <th className="p-3">Volumen</th>
                  <th className="p-3">Salida Planta</th>
                  <th className="p-3">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {viajes.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-800/50">
                    <td className="p-3 font-mono font-bold text-amber-400">{v.remitoNro}</td>
                    <td className="p-3 font-medium text-white">{v.equipoId}</td>
                    <td className="p-3">{v.obraId}</td>
                    <td className="p-3 font-semibold text-white">{v.cantidadM3} m³</td>
                    <td className="p-3">{v.horaSalidaPlanta || 'Pendiente'}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        v.estado === 'cargando' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                        v.estado === 'en_obra' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                        'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      }`}>
                        {v.estado.toUpperCase()}
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
            <MapPin className="w-4 h-4 text-amber-400" /> Simulación de Mapa GPS (Fleet Tracking)
          </h3>
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 h-64 flex flex-col items-center justify-center text-center">
            <MapPin className="w-10 h-10 text-amber-400 animate-bounce mb-2" />
            <span className="text-xs font-bold text-white">Mixer 12 en tránsito hacia Obra Torres</span>
            <p className="text-[11px] text-slate-400 mt-1">Velocidad: 48 km/h | ETA: 14 min</p>
            <div className="mt-4 w-full bg-slate-900 p-2 rounded border border-slate-800 text-[10px] text-emerald-400 flex items-center justify-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Telemetría GPS Conectada
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
