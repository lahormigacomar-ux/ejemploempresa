import React, { useState, useEffect } from 'react';
import {
  Users,
  DollarSign,
  Clock,
  FileText,
  Truck,
  PieChart,
  Search,
  Plus,
  CheckCircle,
  AlertTriangle,
  Play,
  RotateCw,
  Shield,
  FileSpreadsheet,
  AlertCircle
} from 'lucide-react';
import { Empleado, LiquidacionSueldo, HoraExtraRegistro, ImputacionCostoLaboral } from '../types';
import { employeeRepository } from '../repositories/employeeRepository';
import { attendanceRepository } from '../repositories/attendanceRepository';
import { payrollRepository } from '../repositories/payrollRepository';
import { laborCostRepository } from '../repositories/laborCostRepository';
import { hrDomainService } from '../services/hrDomainService';
import { hrAvailabilityService } from '../services/hrAvailabilityService';
import { exportarLibroSueldosDigitalStub } from '../services/arcaAdapterStub';
import { runHRModuleAutomatedTests, TestResultItem } from '../tests/hrModuleTests';

export const PersonnelView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'legajos' | 'habilitaciones' | 'asistencia' | 'horas_extra' | 'sueldos' | 'costos' | 'arca' | 'tests'>('legajos');
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [selectedEmpleado, setSelectedEmpleado] = useState<Empleado | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [liquidaciones, setLiquidaciones] = useState<LiquidacionSueldo[]>([]);
  const [selectedLiquidacion, setSelectedLiquidacion] = useState<LiquidacionSueldo | null>(null);
  const [horasExtras, setHorasExtras] = useState<HoraExtraRegistro[]>([]);
  const [imputaciones, setImputaciones] = useState<ImputacionCostoLaboral[]>([]);
  const [testResults, setTestResults] = useState<TestResultItem[]>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [availabilityMap, setAvailabilityMap] = useState<Record<string, { disponible: boolean; motivo?: string }>>({});

  // Carga asíncrona desde repositorios
  const loadData = async () => {
    const emps = await employeeRepository.getAll();
    setEmpleados(emps);

    // Calcular disponibilidades en tiempo real
    const availMap: Record<string, { disponible: boolean; motivo?: string }> = {};
    for (const e of emps) {
      const res = await hrAvailabilityService.canAssignEmployee(e.id, '2026-09-30T08:00:00');
      availMap[e.id] = { disponible: res.disponible, motivo: res.motivo };
    }
    setAvailabilityMap(availMap);

    const liqs = await payrollRepository.getAllLiquidaciones('2026-09');
    setLiquidaciones(liqs);

    const hes = await attendanceRepository.getHorasExtra();
    setHorasExtras(hes);

    const imps = await laborCostRepository.getAll();
    setImputaciones(imps);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleEjecutarTests = async () => {
    setIsRunningTests(true);
    const results = await runHRModuleAutomatedTests();
    setTestResults(results);
    setIsRunningTests(false);
    await loadData();
  };

  const handleLiquidarPeriodo = async () => {
    for (const emp of empleados) {
      await hrDomainService.liquidarEmpleadoPeriodo(emp.id, '2026-09', 'MENSUAL', 'admin');
    }
    await loadData();
  };

  const handleCerrarLiquidacion = async (empId: string) => {
    await payrollRepository.closeLiquidacionWithSnapshot('2026-09', 'MENSUAL', empId, 'supervisor_admin');
    await loadData();
  };

  const handleAprobarHoraExtra = async (id: string, nuevoEstado: 'APROBADA' | 'RECHAZADA') => {
    await attendanceRepository.updateHoraExtraEstado(id, nuevoEstado, 'supervisor_guardia');
    await loadData();
  };

  const filteredEmpleados = empleados.filter(
    (e) =>
      e.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.legajo.includes(searchTerm)
  );

  const arcaStub = exportarLibroSueldosDigitalStub('2026-09');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Módulo 1: Personal, RRHH, Asistencia, Sueldos & Costos</h2>
          <p className="text-xs text-slate-400">
            Arquitectura persistente basada en PostgreSQL/Supabase, motor por conceptos y contratos de disponibilidad operativa.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="bg-slate-800 text-slate-300 border border-slate-700 px-3 py-1 rounded-lg text-xs font-mono flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-amber-400" /> Esquema 001_rrhh_schema.sql
          </span>
        </div>
      </div>

      {/* Subtabs */}
      <div className="flex space-x-2 border-b border-slate-800 pb-3 overflow-x-auto">
        {[
          { id: 'legajos', label: 'Legajos & Historial', icon: <Users className="w-4 h-4" /> },
          { id: 'habilitaciones', label: 'Habilitaciones & Semáforo', icon: <Truck className="w-4 h-4" /> },
          { id: 'asistencia', label: 'Asistencia & Turnos', icon: <Clock className="w-4 h-4" /> },
          { id: 'horas_extra', label: 'Workflow Horas Extra', icon: <FileSpreadsheet className="w-4 h-4" /> },
          { id: 'sueldos', label: 'Liquidación & Snapshots', icon: <DollarSign className="w-4 h-4" /> },
          { id: 'costos', label: 'Imputaciones Laborales', icon: <PieChart className="w-4 h-4" /> },
          { id: 'arca', label: 'ARCA / LSD (Stub)', icon: <FileText className="w-4 h-4" /> },
          { id: 'tests', label: 'Suite Automatizada (A–L)', icon: <Play className="w-4 h-4 text-amber-400" /> }
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
                placeholder="Buscar por legajo, apellido o DNI..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <button className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-lg text-xs transition flex items-center gap-2">
              <Plus className="w-4 h-4" /> Alta de Empleado
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEmpleados.map((emp) => {
              const avail = availabilityMap[emp.id] || { disponible: true };
              return (
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
                      <p className="text-[11px] text-slate-400">DNI: {emp.dni} | CUIL: {emp.cuil}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      avail.disponible ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'
                    }`}>
                      {avail.disponible ? 'DISPONIBLE' : 'BLOQUEADO'}
                    </span>
                  </div>

                  <div className="text-xs text-slate-400 space-y-1">
                    <div><strong>Roles:</strong> {emp.roles.join(', ')}</div>
                    <div><strong>Convenio:</strong> {emp.convenio}</div>
                    <div><strong>Sueldo Básico:</strong> <span className="text-white font-semibold">${emp.sueldoBasico.toLocaleString()}</span></div>
                    {!avail.disponible && (
                      <div className="text-red-400 text-[11px] pt-1">⚠️ {avail.motivo}</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: HABILITACIONES & LICENCIAS */}
      {activeTab === 'habilitaciones' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Truck className="w-4 h-4 text-amber-400" /> Semáforo de Vencimientos & Habilitaciones por Equipo
            </h3>
            <span className="text-xs bg-slate-800 text-slate-300 px-3 py-1 rounded border border-slate-700">
              Validación activa para Logística
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase font-semibold">
                <tr>
                  <th className="p-3">Empleado</th>
                  <th className="p-3">Licencia Nro</th>
                  <th className="p-3">Categoría</th>
                  <th className="p-3">Vencimiento Licencia</th>
                  <th className="p-3">Equipos Autorizados</th>
                  <th className="p-3">Estado Semáforo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {empleados.map((emp) => {
                  const venc = emp.licenciaConducir?.vencimiento;
                  const isVencida = venc ? venc < '2026-09-30' : false;
                  return (
                    <tr key={emp.id} className="hover:bg-slate-800/50">
                      <td className="p-3 font-medium text-white">#{emp.legajo} - {emp.apellido}, {emp.nombre}</td>
                      <td className="p-3 font-mono">{emp.licenciaConducir?.nro || 'No requerida'}</td>
                      <td className="p-3">{emp.licenciaConducir?.categoria || 'N/A'}</td>
                      <td className="p-3 font-mono text-amber-400">{venc || '-'}</td>
                      <td className="p-3">
                        {emp.habilitacionesEquipos.map(h => (
                          <span key={h.equipoTipo} className={`inline-block mr-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${h.habilitado ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                            {h.equipoTipo.toUpperCase()}
                          </span>
                        ))}
                      </td>
                      <td className="p-3">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 w-fit ${
                          isVencida ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}>
                          {isVencida ? <AlertTriangle className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
                          {isVencida ? 'ROJO (Vencida - Bloqueo Asignación)' : 'VERDE (Vigente)'}
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

      {/* TAB 4: WORKFLOW HORAS EXTRA */}
      {activeTab === 'horas_extra' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-amber-400" /> Workflow de Aprobación de Horas Extras
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Solo las horas en estado APROBADA ingresan automáticamente a la liquidación mensual.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase font-semibold">
                <tr>
                  <th className="p-3">ID Registro</th>
                  <th className="p-3">Empleado</th>
                  <th className="p-3">Fecha</th>
                  <th className="p-3">Horas</th>
                  <th className="p-3">Tipo</th>
                  <th className="p-3">Estado</th>
                  <th className="p-3">Acciones de Aprobación</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {horasExtras.map((he) => (
                  <tr key={he.id} className="hover:bg-slate-800/50">
                    <td className="p-3 font-mono text-amber-400">{he.id}</td>
                    <td className="p-3 font-medium text-white">{he.empleadoId}</td>
                    <td className="p-3 font-mono">{he.fecha}</td>
                    <td className="p-3 font-bold text-white">{he.horas} hs</td>
                    <td className="p-3">{he.tipo}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        he.estado === 'APROBADA' ? 'bg-emerald-500/20 text-emerald-400' :
                        he.estado === 'RECHAZADA' ? 'bg-red-500/20 text-red-400' :
                        'bg-amber-500/20 text-amber-400'
                      }`}>
                        {he.estado}
                      </span>
                    </td>
                    <td className="p-3">
                      {he.estado === 'PENDIENTE_APROBACION' && (
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleAprobarHoraExtra(he.id, 'APROBADA')}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1 rounded text-[11px] font-bold"
                          >
                            Aprobar
                          </button>
                          <button
                            onClick={() => handleAprobarHoraExtra(he.id, 'RECHAZADA')}
                            className="bg-red-600 hover:bg-red-500 text-white px-2.5 py-1 rounded text-[11px] font-bold"
                          >
                            Rechazar
                          </button>
                        </div>
                      )}
                      {he.estado !== 'PENDIENTE_APROBACION' && (
                        <span className="text-slate-500 text-[11px]">Procesado por {he.responsableAprobacion || 'sistema'}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: LIQUIDACIÓN DE SUELDOS & SNAPSHOTS */}
      {activeTab === 'sueldos' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-amber-400" /> Liquidaciones Período 2026-09 (Motor por Conceptos)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Evaluación dinámica de conceptos y congelamiento inmutable mediante Snapshots JSON.
                </p>
              </div>
              <button
                onClick={handleLiquidarPeriodo}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-lg text-xs transition flex items-center gap-2"
              >
                <RotateCw className="w-3.5 h-3.5" /> Calcular Período 2026-09
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase font-semibold">
                  <tr>
                    <th className="p-3">Empleado</th>
                    <th className="p-3">Básico</th>
                    <th className="p-3">Remunerativo</th>
                    <th className="p-3">No Remunerativo</th>
                    <th className="p-3">Descuentos</th>
                    <th className="p-3 font-bold text-white">Neto a Cobrar</th>
                    <th className="p-3 font-bold text-amber-400">Costo Empresa</th>
                    <th className="p-3">Estado</th>
                    <th className="p-3">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {liquidaciones.map((liq) => {
                    const emp = empleados.find(e => e.id === liq.empleadoId);
                    return (
                      <tr key={liq.id} className="hover:bg-slate-800/50">
                        <td className="p-3 font-medium text-white">#{emp?.legajo} - {emp?.apellido}, {emp?.nombre}</td>
                        <td className="p-3">${liq.sueldoBasico.toLocaleString()}</td>
                        <td className="p-3">${liq.totalRemunerativo.toLocaleString()}</td>
                        <td className="p-3">${liq.totalNoRemunerativo.toLocaleString()}</td>
                        <td className="p-3 text-red-400">-${liq.totalDescuentos.toLocaleString()}</td>
                        <td className="p-3 font-bold text-white">${liq.netoAPagar.toLocaleString()}</td>
                        <td className="p-3 font-extrabold text-amber-400">${liq.costoTotalEmpresa.toLocaleString()}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            liq.estado === 'CERRADA' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-blue-500/20 text-blue-300'
                          }`}>
                            {liq.estado}
                          </span>
                        </td>
                        <td className="p-3 flex items-center space-x-2">
                          <button
                            onClick={() => setSelectedLiquidacion(liq)}
                            className="bg-slate-800 hover:bg-slate-700 text-amber-300 px-2.5 py-1 rounded text-[11px]"
                          >
                            Ver Renglones
                          </button>
                          {liq.estado !== 'CERRADA' && (
                            <button
                              onClick={() => handleCerrarLiquidacion(liq.empleadoId)}
                              className="bg-purple-700 hover:bg-purple-600 text-white px-2.5 py-1 rounded text-[11px] font-bold"
                            >
                              Cerrar Snapshot
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Modal / Vista de renglones detallados */}
          {selectedLiquidacion && (
            <div className="bg-slate-900 border border-amber-500/40 p-5 rounded-xl space-y-4 animate-fadeIn">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <h4 className="text-sm font-bold text-amber-400">
                  Recibo Detallado por Conceptos: Liquidación #{selectedLiquidacion.id} ({selectedLiquidacion.periodo})
                </h4>
                <button
                  onClick={() => setSelectedLiquidacion(null)}
                  className="bg-slate-800 text-slate-300 hover:text-white px-2.5 py-1 rounded text-xs"
                >
                  Cerrar Detalle
                </button>
              </div>

              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase font-semibold">
                  <tr>
                    <th className="p-2.5">Código</th>
                    <th className="p-2.5">Concepto</th>
                    <th className="p-2.5">Tipo</th>
                    <th className="p-2.5">Cantidad</th>
                    <th className="p-2.5 text-right">Haberes</th>
                    <th className="p-2.5 text-right">Descuentos</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {selectedLiquidacion.detalles.map((d, i) => (
                    <tr key={i}>
                      <td className="p-2.5 font-mono text-amber-400">{d.conceptoCodigo}</td>
                      <td className="p-2.5 font-medium text-white">{d.conceptoNombre}</td>
                      <td className="p-2.5 text-[11px]">{d.tipo}</td>
                      <td className="p-2.5">{d.cantidad} {d.unidad}</td>
                      <td className="p-2.5 text-right font-mono text-emerald-400">{d.haberes > 0 ? `$${d.haberes.toLocaleString()}` : '-'}</td>
                      <td className="p-2.5 text-right font-mono text-red-400">{d.descuentos > 0 ? `-$${d.descuentos.toLocaleString()}` : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 6: IMPUTACIONES LABORALES */}
      {activeTab === 'costos' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <PieChart className="w-4 h-4 text-amber-400" /> Registro Transaccional de Imputaciones de Costo Laboral (Idempotente)
          </h3>
          <p className="text-xs text-slate-300">
            Cada viaje de logística, orden de trabajo de taller o turno de cargadora genera una imputación persistida con clave de idempotencia única.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase font-semibold">
                <tr>
                  <th className="p-3">Clave Evento (Idempotencia)</th>
                  <th className="p-3">Módulo Origen</th>
                  <th className="p-3">ID Origen</th>
                  <th className="p-3">Centro Costo</th>
                  <th className="p-3">Horas</th>
                  <th className="p-3">Costo Horario Real</th>
                  <th className="p-3 font-bold text-amber-400">Total Imputado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {imputaciones.map((imp) => (
                  <tr key={imp.id} className="hover:bg-slate-800/50">
                    <td className="p-3 font-mono text-amber-400">{imp.eventId}</td>
                    <td className="p-3">{imp.origenModulo}</td>
                    <td className="p-3 font-mono">{imp.origenId}</td>
                    <td className="p-3 font-bold text-white">{imp.centroCostoId}</td>
                    <td className="p-3">{imp.horasImputadas} hs</td>
                    <td className="p-3">${imp.costoHorarioAplicado.toLocaleString()}/h</td>
                    <td className="p-3 font-bold text-amber-400">${imp.costoTotalImputado.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 7: ARCA / LSD STUB */}
      {activeTab === 'arca' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-400" /> Integración ARCA / Libro de Sueldos Digital (RG AFIP 3781)
            </h3>
            <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 px-3 py-1 rounded text-xs font-bold">
              ESTADO: {arcaStub.estado}
            </span>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs space-y-2">
            <div className="flex items-center gap-2 text-amber-400 font-semibold">
              <AlertCircle className="w-4 h-4" /> Especificación Técnica de la Integración Fiscal:
            </div>
            <p className="text-slate-300">{arcaStub.mensaje}</p>
            <div className="pt-2 text-slate-400">
              Conceptos del ERP actualmente mapeados con la tabla paramétrica de AFIP: <strong className="text-white">{arcaStub.conceptosMapeados} conceptos</strong>.
            </div>
          </div>
        </div>
      )}

      {/* TAB 8: TESTS AUTOMATIZADOS CASOS A-L */}
      {activeTab === 'tests' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2">
                <Play className="w-4 h-4" /> Suite Automatizada de Pruebas de Integración (Casos A a L)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Ejecuta de forma secuencial las 12 pruebas unitarias y de integración del módulo de RRHH.
              </p>
            </div>
            <button
              onClick={handleEjecutarTests}
              disabled={isRunningTests}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-lg text-xs transition flex items-center gap-2"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isRunningTests ? 'animate-spin' : ''}`} />
              {isRunningTests ? 'Ejecutando Suite...' : 'Correr Tests Ahora'}
            </button>
          </div>

          <div className="space-y-2.5">
            {testResults.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs bg-slate-950 rounded-xl border border-slate-800">
                Haga clic en &quot;Correr Tests Ahora&quot; para ejecutar las pruebas automáticas A–L.
              </div>
            ) : (
              testResults.map((t) => (
                <div key={t.id} className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 flex justify-between items-start text-xs">
                  <div>
                    <span className="font-bold text-white">{t.nombre}</span>
                    <div className="text-slate-400 text-[11px] mt-0.5">{t.descripcion}</div>
                    <div className="text-slate-500 text-[10px] mt-1 font-mono">Esperado: {t.esperado}</div>
                    <div className="text-slate-300 text-[10px] font-mono">Obtenido: {t.obtenido}</div>
                  </div>
                  <span className={`px-2.5 py-1 rounded text-[10px] font-bold ${t.aprobado ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400'}`}>
                    {t.aprobado ? 'APROBADO (PASS)' : 'FALLIDO (FAIL)'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB ASISTENCIA & TURNOS */}
      {activeTab === 'asistencia' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" /> Configuración de Turnos y Procesamiento de Fichadas
          </h3>
          <p className="text-xs text-slate-300">
            Soporta turnos rotativos, cruce de medianoche (ej. 22:00 a 06:00), deducción de descansos intermedios y cálculo de horas nocturnas.
          </p>
        </div>
      )}
    </div>
  );
};
