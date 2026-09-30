import React, { useState } from 'react';
import {
  Users,
  DollarSign,
  Calendar,
  FileText,
  ShieldCheck,
  Truck,
  Wrench,
  Clock,
  AlertTriangle,
  CheckCircle,
  Plus,
  Search,
  PieChart,
  BadgeAlert
} from 'lucide-react';
import { Empleado } from '../types';

interface PersonnelViewProps {
  empleados: Empleado[];
}

export const PersonnelView: React.FC<PersonnelViewProps> = ({ empleados }) => {
  const [activeTab, setActiveTab] = useState<'legajos' | 'habilitaciones' | 'asistencia' | 'adelantos' | 'sueldos' | 'costos'>('legajos');
  const [selectedEmpleado, setSelectedEmpleado] = useState<Empleado | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredEmpleados = empleados.filter(
    (e) =>
      e.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.legajo.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Módulo 1: Personal, RRHH, Asistencia, Sueldos & Costos Laborales</h2>
          <p className="text-xs text-slate-400">
            Legajo único, habilitaciones de choferes y maquinistas, fichadas de asistencia, liquidación de sueldos y costos por centro de costo.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" /> Integrado con Logística, Flota y Costos
          </span>
        </div>
      </div>

      {/* Subtabs for HR Module */}
      <div className="flex space-x-2 border-b border-slate-800 pb-3 overflow-x-auto">
        {[
          { id: 'legajos', label: 'Legajos Digitales', icon: <Users className="w-4 h-4" /> },
          { id: 'habilitaciones', label: 'Habilitaciones & Licencias', icon: <Truck className="w-4 h-4" />, alert: true },
          { id: 'asistencia', label: 'Asistencia & Jornadas', icon: <Clock className="w-4 h-4" /> },
          { id: 'adelantos', label: 'Adelantos & Préstamos', icon: <DollarSign className="w-4 h-4" /> },
          { id: 'sueldos', label: 'Liquidación de Sueldos (ARCA)', icon: <FileText className="w-4 h-4" /> },
          { id: 'costos', label: 'Imputación Costo Laboral', icon: <PieChart className="w-4 h-4" /> }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-medium transition whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.alert && (
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
            )}
          </button>
        ))}
      </div>

      {/* TAB 1: LEGAJOS */}
      {activeTab === 'legajos' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="relative w-72">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por legajo o apellido..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <button className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-lg text-xs transition flex items-center gap-2">
              <Plus className="w-4 h-4" /> Nuevo Empleado
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEmpleados.map((emp) => (
              <div
                key={emp.id}
                onClick={() => setSelectedEmpleado(emp)}
                className="bg-slate-900 border border-slate-800 p-5 rounded-xl hover:border-amber-500/50 transition cursor-pointer space-y-3"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-mono font-bold bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded">
                      Legajo #{emp.legajo}
                    </span>
                    <h3 className="text-sm font-bold text-white mt-2">
                      {emp.apellido}, {emp.nombre}
                    </h3>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    emp.estado === 'activo' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400'
                  }`}>
                    {emp.estado.toUpperCase()}
                  </span>
                </div>

                <div className="text-xs text-slate-400 space-y-1">
                  <div><strong>Roles:</strong> {emp.roles.map(r => r.replace('_', ' ')).join(', ')}</div>
                  <div><strong>Categoría:</strong> {emp.categoria}</div>
                  <div><strong>Teléfono:</strong> {emp.telefono}</div>
                  <div><strong>Sueldo Básico:</strong> <span className="text-white font-semibold">${emp.sueldoBasico.toLocaleString()}</span></div>
                </div>

                <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-[11px] text-amber-400 font-medium">
                  <span>Ver Ficha Completa & Habilitaciones</span>
                  <span>→</span>
                </div>
              </div>
            ))}
          </div>

          {/* Modal / Detailed view of selected employee */}
          {selectedEmpleado && (
            <div className="bg-slate-900 border border-amber-500/40 p-6 rounded-xl mt-6 space-y-5 animate-fadeIn">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs bg-amber-500 text-slate-950 font-bold px-2 py-0.5 rounded">
                    Ficha Digital - Legajo #{selectedEmpleado.legajo}
                  </span>
                  <h3 className="text-lg font-extrabold text-white mt-1">
                    {selectedEmpleado.apellido}, {selectedEmpleado.nombre}
                  </h3>
                  <p className="text-xs text-slate-400">CUIL: {selectedEmpleado.cuil} | DNI: {selectedEmpleado.dni}</p>
                </div>
                <button
                  onClick={() => setSelectedEmpleado(null)}
                  className="bg-slate-800 text-slate-300 hover:text-white px-3 py-1 rounded text-xs"
                >
                  Cerrar Ficha
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
                  <div className="font-bold text-amber-400 uppercase tracking-wide">Datos Personales</div>
                  <div><strong>Domicilio:</strong> {selectedEmpleado.domicilio}</div>
                  <div><strong>Email:</strong> {selectedEmpleado.email}</div>
                  <div><strong>Contacto Emergencia:</strong> {selectedEmpleado.contactoEmergencia} ({selectedEmpleado.telefonoEmergencia})</div>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
                  <div className="font-bold text-amber-400 uppercase tracking-wide">Datos Laborales</div>
                  <div><strong>Convenio:</strong> {selectedEmpleado.convenio}</div>
                  <div><strong>Fecha Ingreso:</strong> {selectedEmpleado.fechaIngreso}</div>
                  <div><strong>Centro de Costo:</strong> {selectedEmpleado.centroCostoHabitualId}</div>
                  <div><strong>Banco / CBU:</strong> {selectedEmpleado.banco} ({selectedEmpleado.cbu})</div>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
                  <div className="font-bold text-amber-400 uppercase tracking-wide">Habilitaciones & Equipos</div>
                  {selectedEmpleado.licenciaConducir ? (
                    <div>
                      <div><strong>Licencia Nro:</strong> {selectedEmpleado.licenciaConducir.nro}</div>
                      <div><strong>Categoría:</strong> {selectedEmpleado.licenciaConducir.categoria}</div>
                      <div className="text-amber-400"><strong>Vencimiento:</strong> {selectedEmpleado.licenciaConducir.vencimiento}</div>
                    </div>
                  ) : (
                    <div className="text-slate-400">Sin licencia de conducir registrada.</div>
                  )}
                  <div className="mt-2 pt-2 border-t border-slate-800">
                    <strong>Equipos Habilitados:</strong>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedEmpleado.habilitacionesEquipos.map((h, i) => (
                        <span key={i} className={`px-2 py-0.5 rounded text-[10px] font-bold ${h.habilitado ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                          {h.equipoTipoOrId}: {h.habilitado ? 'Habilitado' : 'No'}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: HABILITACIONES & LICENCIAS */}
      {activeTab === 'habilitaciones' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Truck className="w-4 h-4 text-amber-400" /> Control de Vencimientos, LINTI y Psicofísicos (Semáforo Operativo)
            </h3>
            <span className="text-xs bg-red-500/20 text-red-400 border border-red-500/30 px-3 py-1 rounded font-medium">
              1 Vencimiento Próximo (Bloqueante Logístico)
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase font-semibold">
                <tr>
                  <th className="p-3">Legajo & Empleado</th>
                  <th className="p-3">Rol / Puesto</th>
                  <th className="p-3">Licencia Nro</th>
                  <th className="p-3">Vencimiento Licencia</th>
                  <th className="p-3">Psicofísico / LINTI</th>
                  <th className="p-3">Estado Semáforo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {empleados.map((emp) => {
                  const venc = emp.licenciaConducir?.vencimiento || '2028-01-01';
                  const isProximo = venc === '2026-10-20';
                  return (
                    <tr key={emp.id} className="hover:bg-slate-800/50">
                      <td className="p-3 font-medium text-white">#{emp.legajo} - {emp.apellido}, {emp.nombre}</td>
                      <td className="p-3 capitalize">{emp.roles.join(', ')}</td>
                      <td className="p-3 font-mono">{emp.licenciaConducir?.nro || 'N/A'}</td>
                      <td className="p-3 font-mono text-amber-400">{venc}</td>
                      <td className="p-3">{emp.licenciaConducir ? 'Vigente' : 'N/A'}</td>
                      <td className="p-3">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 w-fit ${
                          isProximo ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}>
                          {isProximo ? <AlertTriangle className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
                          {isProximo ? 'AMARILLO (Vence en 20 días)' : 'VERDE (Vigente)'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: ASISTENCIA & JORNADAS */}
      {activeTab === 'asistencia' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" /> Registro de Fichadas y Cálculo de Jornadas (Normales / Extras)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase font-semibold">
                <tr>
                  <th className="p-3">Fecha</th>
                  <th className="p-3">Empleado</th>
                  <th className="p-3">Entrada Fichada</th>
                  <th className="p-3">Salida Fichada</th>
                  <th className="p-3">Horas Normales</th>
                  <th className="p-3">Horas Extras 50%</th>
                  <th className="p-3">Estado Jornada</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                <tr className="hover:bg-slate-800/50">
                  <td className="p-3 font-mono">2026-10-01</td>
                  <td className="p-3 font-medium text-white">Juan Pérez (Chofer Mixer)</td>
                  <td className="p-3 font-mono text-emerald-400">07:02 hs</td>
                  <td className="p-3 font-mono text-emerald-400">16:15 hs</td>
                  <td className="p-3 font-bold">8.0 h</td>
                  <td className="p-3 text-amber-400 font-bold">1.2 h</td>
                  <td className="p-3"><span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-400 font-bold">APROBADA</span></td>
                </tr>
                <tr className="hover:bg-slate-800/50">
                  <td className="p-3 font-mono">2026-10-01</td>
                  <td className="p-3 font-medium text-white">Carlos Gómez (Chofer Mixer)</td>
                  <td className="p-3 font-mono text-emerald-400">06:55 hs</td>
                  <td className="p-3 font-mono text-emerald-400">17:30 hs</td>
                  <td className="p-3 font-bold">8.0 h</td>
                  <td className="p-3 text-amber-400 font-bold">2.5 h</td>
                  <td className="p-3"><span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-400 font-bold">PENDIENTE APROBACIÓN</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: ADELANTOS & PRÉSTAMOS */}
      {activeTab === 'adelantos' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-amber-400" /> Gestión de Adelantos y Préstamos al Personal
            </h3>
            <button className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1.5 rounded-lg text-xs transition">
              + Registrar Adelanto
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase font-semibold">
                <tr>
                  <th className="p-3">Empleado</th>
                  <th className="p-3">Concepto</th>
                  <th className="p-3">Importe Solicitado</th>
                  <th className="p-3">Cuotas</th>
                  <th className="p-3">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                <tr className="hover:bg-slate-800/50">
                  <td className="p-3 font-medium text-white">Juan Pérez (#1001)</td>
                  <td className="p-3">Adelanto Quincenal</td>
                  <td className="p-3 font-bold text-amber-400">$150,000</td>
                  <td className="p-3">1 / 1</td>
                  <td className="p-3"><span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-400 font-bold">PAGADO (Descuenta próxima liquidación)</span></td>
                </tr>
                <tr className="hover:bg-slate-800/50">
                  <td className="p-3 font-medium text-white">Marcos Díaz (#1003)</td>
                  <td className="p-3">Préstamo Extraordinario</td>
                  <td className="p-3 font-bold text-amber-400">$300,000</td>
                  <td className="p-3">2 / 6 ($50,000/cuota)</td>
                  <td className="p-3"><span className="px-2 py-0.5 rounded text-[10px] bg-blue-500/20 text-blue-400 font-bold">ACTIVO</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: LIQUIDACIÓN DE SUELDOS (ARCA) */}
      {activeTab === 'sueldos' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-400" /> Liquidación de Sueldos y Adaptador ARCA (Libro de Sueldos Digital)
            </h3>
            <button className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1.5 rounded-lg text-xs transition">
              Calcular Período 09/2026
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase font-semibold">
                <tr>
                  <th className="p-3">Legajo y Empleado</th>
                  <th className="p-3">Sueldo Básico</th>
                  <th className="p-3">Remunerativo</th>
                  <th className="p-3">Descuentos Ley</th>
                  <th className="p-3 font-bold text-white">Neto a Cobrar</th>
                  <th className="p-3 font-bold text-amber-400">Costo Empresa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {empleados.map((emp) => {
                  const neto = Math.round(emp.sueldoBasico * 0.80);
                  const costoTotal = Math.round(emp.sueldoBasico * 1.58);
                  return (
                    <tr key={emp.id} className="hover:bg-slate-800/50">
                      <td className="p-3 font-medium text-white">#{emp.legajo} - {emp.apellido}, {emp.nombre}</td>
                      <td className="p-3">${emp.sueldoBasico.toLocaleString()}</td>
                      <td className="p-3">${Math.round(emp.sueldoBasico * 1.15).toLocaleString()}</td>
                      <td className="p-3 text-red-400">-${Math.round(emp.sueldoBasico * 0.20).toLocaleString()}</td>
                      <td className="p-3 font-bold text-white">${neto.toLocaleString()}</td>
                      <td className="p-3 font-extrabold text-amber-400">${costoTotal.toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: IMPUTACIÓN DE COSTO LABORAL */}
      {activeTab === 'costos' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <PieChart className="w-4 h-4 text-amber-400" /> Distribución Automática del Costo Laboral en el ERP
          </h3>
          <p className="text-xs text-slate-300">
            El sistema toma automáticamente las horas de los choferes mediante viajes, los maquinistas mediante horas en equipos, y los mecánicos mediante Órdenes de Trabajo (OT).
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400">Transporte & Logística (Mixers)</span>
              <div className="text-xl font-bold text-white mt-1">$4,850,000</div>
              <p className="text-[10px] text-emerald-400 mt-1">Imputado desde 142 viajes del mes</p>
            </div>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400">Extracción y Áridos</span>
              <div className="text-xl font-bold text-white mt-1">$3,120,000</div>
              <p className="text-[10px] text-emerald-400 mt-1">Imputado desde horas Maquinistas CAT 950</p>
            </div>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400">Taller Mecánico</span>
              <div className="text-xl font-bold text-white mt-1">$1,950,000</div>
              <p className="text-[10px] text-emerald-400 mt-1">Imputado desde Órdenes de Trabajo (OT)</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
