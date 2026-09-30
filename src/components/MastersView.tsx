import React, { useState } from 'react';
import { Layers, Building2, MapPin, Users, Truck, Briefcase } from 'lucide-react';
import { Planta, CentroCosto, Empleado, Equipo, Cliente } from '../types';

interface MastersViewProps {
  plantas: Planta[];
  centrosCosto: CentroCosto[];
  empleados: Empleado[];
  equipos: Equipo[];
  clientes: Cliente[];
}

export const MastersView: React.FC<MastersViewProps> = ({
  plantas,
  centrosCosto,
  empleados,
  equipos,
  clientes
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'plantas' | 'centros' | 'empleados' | 'equipos' | 'clientes'>('plantas');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Maestros & Centros de Costo</h2>
          <p className="text-xs text-slate-400">Estructura unificada de entidades maestras compartidas por todo el ERP</p>
        </div>
      </div>

      {/* Subtabs */}
      <div className="flex space-x-2 border-b border-slate-800 pb-3">
        {[
          { id: 'plantas', label: 'Plantas & Sucursales', icon: <Building2 className="w-4 h-4" /> },
          { id: 'centros', label: 'Centros de Costo', icon: <Layers className="w-4 h-4" /> },
          { id: 'empleados', label: 'Personal (Legajos)', icon: <Users className="w-4 h-4" /> },
          { id: 'equipos', label: 'Flota & Maquinaria', icon: <Truck className="w-4 h-4" /> },
          { id: 'clientes', label: 'Clientes & Obras', icon: <Briefcase className="w-4 h-4" /> }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as any)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-medium transition ${
              activeSubTab === tab.id
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        {activeSubTab === 'plantas' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white">Plantas Elaboradoras Registradas</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {plantas.map((p) => (
                <div key={p.id} className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex justify-between items-center">
                  <div>
                    <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded font-bold">{p.codigo}</span>
                    <h4 className="text-sm font-bold text-white mt-2">{p.nombre}</h4>
                    <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-amber-400" /> {p.ubicacion}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400">Capacidad Teórica:</span>
                    <div className="text-sm font-bold text-emerald-400">{p.capacidadM3Hora} m³/h</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSubTab === 'centros' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white">Estructura Jerárquica de Centros de Costo</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase font-semibold">
                  <tr>
                    <th className="p-3">Código</th>
                    <th className="p-3">Denominación Centro de Costo</th>
                    <th className="p-3">Tipo Operativo</th>
                    <th className="p-3">Imputación Automática</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {centrosCosto.map((cc) => (
                    <tr key={cc.id} className="hover:bg-slate-800/50">
                      <td className="p-3 font-mono text-amber-400 font-bold">{cc.codigo}</td>
                      <td className="p-3 font-medium text-white">{cc.nombre}</td>
                      <td className="p-3 capitalize">{cc.tipo}</td>
                      <td className="p-3 text-emerald-400 font-semibold">Habilitado (Activo)</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeSubTab === 'empleados' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white">Maestro Único de Personal (Choferes, Maquinistas, Laboratorio)</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase font-semibold">
                  <tr>
                    <th className="p-3">Legajo</th>
                    <th className="p-3">Apellidos y Nombres</th>
                    <th className="p-3">CUIL</th>
                    <th className="p-3">Puesto / Rol</th>
                    <th className="p-3">Categoría</th>
                    <th className="p-3">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {empleados.map((emp) => (
                    <tr key={emp.id} className="hover:bg-slate-800/50">
                      <td className="p-3 font-mono font-bold text-amber-400">{emp.legajo}</td>
                      <td className="p-3 font-medium text-white">{emp.apellido}, {emp.nombre}</td>
                      <td className="p-3 font-mono">{emp.cuil}</td>
                      <td className="p-3 capitalize">{emp.roles.map(r => r.replace('_', ' ')).join(', ')}</td>
                      <td className="p-3">{emp.categoria}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          {emp.estado.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeSubTab === 'equipos' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white">Flota de Equipos, Mixers y Maquinaria</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase font-semibold">
                  <tr>
                    <th className="p-3">Código</th>
                    <th className="p-3">Tipo</th>
                    <th className="p-3">Dominio / Serie</th>
                    <th className="p-3">Marca y Modelo</th>
                    <th className="p-3">Km / Horómetro</th>
                    <th className="p-3">Estado Operativo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {equipos.map((eq) => (
                    <tr key={eq.id} className="hover:bg-slate-800/50">
                      <td className="p-3 font-mono font-bold text-amber-400">{eq.codigo}</td>
                      <td className="p-3 capitalize">{eq.tipo}</td>
                      <td className="p-3 font-mono">{eq.dominio}</td>
                      <td className="p-3 font-medium text-white">{eq.marcaModelo} ({eq.anio})</td>
                      <td className="p-3">{eq.kmActual > 0 ? `${eq.kmActual.toLocaleString()} km` : `${eq.horometroActual} hs`}</td>
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
        )}

        {activeSubTab === 'clientes' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white">Clientes & Múltiples Obras Vinculadas</h3>
            <div className="space-y-3">
              {clientes.map((c) => (
                <div key={c.id} className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-sm font-bold text-white">{c.razonSocial}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">CUIT: {c.cuit} | Límite Crédito: ${c.limiteCredito.toLocaleString()}</p>
                    </div>
                    <span className="text-xs font-bold text-amber-400">Saldo Cta. Cte: ${c.saldoActual.toLocaleString()}</span>
                  </div>
                  <div className="mt-3 border-t border-slate-800 pt-3">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase">Obras Registradas:</span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                      {c.obras.map((o) => (
                        <div key={o.id} className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 text-xs">
                          <div className="font-semibold text-white">{o.nombre}</div>
                          <div className="text-slate-400 text-[11px] mt-0.5">{o.direccion} ({o.distanciaKm} km)</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
