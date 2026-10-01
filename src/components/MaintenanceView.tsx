import React, { useState, useEffect } from 'react';
import {
  Wrench,
  Truck,
  Layers,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Plus,
  Search,
  Filter,
  User,
  Package,
  FileText,
  DollarSign,
  Activity,
  Disc,
  Calendar,
  X,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import {
  OrdenTrabajo,
  Equipo,
  PlanMantenimiento,
  EquipoPlanMantenimiento,
  Neumatico,
  EstadoOT,
  PrioridadOT,
  TipoMantenimiento,
  CategoriaFalla,
  CausaRaiz
} from '../types';
import { maintenanceRepository } from '../repositories/maintenanceRepository';
import { equipmentRepository } from '../repositories/equipmentRepository';
import { employeeRepository } from '../repositories/employeeRepository';
import { tireRepository } from '../repositories/tireRepository';
import { maintenanceService } from '../services/maintenanceService';
import { maintenancePlanningService } from '../services/maintenancePlanningService';

export const MaintenanceView: React.FC = () => {
  const [activeMainTab, setActiveMainTab] = useState<'ots' | 'preventivos' | 'neumaticos'>('ots');
  const [workOrders, setWorkOrders] = useState<OrdenTrabajo[]>([]);
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [selectedOT, setSelectedOT] = useState<OrdenTrabajo | null>(null);
  const [activeOtDrawerTab, setActiveOtDrawerTab] = useState<'resumen' | 'tareas' | 'mano_obra' | 'repuestos' | 'terceros' | 'costos'>('resumen');
  const [preventiveList, setPreventiveList] = useState<{ equipo: Equipo; planes: EquipoPlanMantenimiento[] }[]>([]);
  const [tiresList, setTiresList] = useState<Neumatico[]>([]);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFilter, setEstadoFilter] = useState<string>('TODOS');
  const [tipoFilter, setTipoFilter] = useState<string>('TODOS');
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');

  // Modal / Formulario Nueva OT
  const [showNewOtModal, setShowNewOtModal] = useState(false);
  const [newOtEquipoId, setNewOtEquipoId] = useState('');
  const [newOtTipo, setNewOtTipo] = useState<TipoMantenimiento>('CORRECTIVO');
  const [newOtCategoria, setNewOtCategoria] = useState<CategoriaFalla>('MOTOR');
  const [newOtPrioridad, setNewOtPrioridad] = useState<PrioridadOT>('ALTA');
  const [newOtFalla, setNewOtFalla] = useState('');
  const [newOtBloquea, setNewOtBloquea] = useState(true);

  // Formulario Cierre OT
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [closeDiagnostico, setCloseDiagnostico] = useState('');
  const [closeTrabajo, setCloseTrabajo] = useState('');
  const [closeCausa, setCloseCausa] = useState<CausaRaiz>('DESGASTE_NORMAL');

  const loadData = async () => {
    const ots = await maintenanceRepository.getAllWorkOrders();
    const eqs = await equipmentRepository.getAll();
    const tires = await tireRepository.getAllTires();

    setWorkOrders(ots);
    setEquipos(eqs);
    setTiresList(tires);

    // Cargar preventivos por equipo
    const prevData = [];
    for (const eq of eqs) {
      const ep = await maintenancePlanningService.evaluateEquipmentPlans(eq.id);
      if (ep.length > 0) {
        prevData.push({ equipo: eq, planes: ep });
      }
    }
    setPreventiveList(prevData);

    if (selectedOT) {
      const updated = await maintenanceRepository.getWorkOrderById(selectedOT.id);
      setSelectedOT(updated);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateOT = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOtEquipoId || !newOtFalla) return;

    await maintenanceService.createWorkOrder({
      equipoId: newOtEquipoId,
      tipoMantenimiento: newOtTipo,
      categoriaFalla: newOtCategoria,
      prioridad: newOtPrioridad,
      fallaReportada: newOtFalla,
      bloqueaEquipo: newOtBloquea
    });

    setShowNewOtModal(false);
    setNewOtFalla('');
    await loadData();
  };

  const handleStartOT = async (otId: string) => {
    await maintenanceService.startWorkOrder(otId);
    await loadData();
  };

  const handleCloseOT = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOT || !closeTrabajo) return;

    await maintenanceService.closeWorkOrder(selectedOT.id, {
      diagnostico: closeDiagnostico,
      trabajoRealizado: closeTrabajo,
      causaRaiz: closeCausa
    });

    setShowCloseModal(false);
    setCloseTrabajo('');
    setCloseDiagnostico('');
    await loadData();
  };

  // KPIs
  const totalOts = workOrders.length;
  const otsAbiertas = workOrders.filter(o => o.estado === 'ABIERTA' || o.estado === 'DIAGNOSTICO').length;
  const otsEnProceso = workOrders.filter(o => o.estado === 'EN_PROCESO').length;
  const otsEsperandoRepuesto = workOrders.filter(o => o.estado === 'ESPERANDO_REPUESTO').length;
  const preventivosVencidos = preventiveList.reduce(
    (acc, p) => acc + p.planes.filter(pl => pl.estadoAlerta === 'VENCIDO').length,
    0
  );
  const neumaticosReparacion = tiresList.filter(t => t.estado === 'EN_REPARACION' || t.estado === 'RECAPADO').length;

  const filteredOts = workOrders.filter(ot => {
    const eq = equipos.find(e => e.id === ot.equipoId);
    const eqCod = eq?.codigoInterno || ot.equipoId;
    const matchesSearch =
      ot.numeroOT.toLowerCase().includes(searchTerm.toLowerCase()) ||
      eqCod.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ot.fallaReportada.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesEstado = estadoFilter === 'TODOS' || ot.estado === estadoFilter;
    const matchesTipo = tipoFilter === 'TODOS' || ot.tipoMantenimiento === tipoFilter;

    return matchesSearch && matchesEstado && matchesTipo;
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Módulo 3: Mantenimiento, Taller, Repuestos & Neumáticos</h2>
          <p className="text-xs text-slate-400">
            Control de Órdenes de Trabajo (OT), downtime de equipos, mano de obra, repuestos con precio snapshot, planes preventivos y cubiertas.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowNewOtModal(true)}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition"
          >
            <Plus className="w-4 h-4" /> Nueva Orden de Trabajo
          </button>
        </div>
      </div>

      {/* KPI Bar Compacto */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
          <span className="text-[11px] font-semibold text-slate-400 uppercase">Total OTs</span>
          <div className="text-xl font-black text-white mt-0.5">{totalOts}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
          <span className="text-[11px] font-semibold text-amber-400 uppercase flex items-center gap-1">
            <Clock className="w-3 h-3" /> Abiertas / Diagnóstico
          </span>
          <div className="text-xl font-black text-amber-400 mt-0.5">{otsAbiertas}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
          <span className="text-[11px] font-semibold text-blue-400 uppercase flex items-center gap-1">
            <Wrench className="w-3 h-3" /> En Reparación
          </span>
          <div className="text-xl font-black text-blue-400 mt-0.5">{otsEnProceso}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
          <span className="text-[11px] font-semibold text-orange-400 uppercase flex items-center gap-1">
            <Package className="w-3 h-3" /> Espera Repuestos
          </span>
          <div className="text-xl font-black text-orange-400 mt-0.5">{otsEsperandoRepuesto}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
          <span className="text-[11px] font-semibold text-red-400 uppercase flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> Preventivos Vencidos
          </span>
          <div className="text-xl font-black text-red-400 mt-0.5">{preventivosVencidos}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
          <span className="text-[11px] font-semibold text-purple-400 uppercase flex items-center gap-1">
            <Disc className="w-3 h-3" /> Neumáticos en Taller
          </span>
          <div className="text-xl font-black text-purple-400 mt-0.5">{neumaticosReparacion}</div>
        </div>
      </div>

      {/* Main Tabs (OTs / Preventivos / Neumáticos) */}
      <div className="flex border-b border-slate-800 space-x-4">
        {[
          { id: 'ots', label: 'Órdenes de Trabajo (OT)', icon: <Wrench className="w-4 h-4" /> },
          { id: 'preventivos', label: 'Planes Preventivos & Semáforo', icon: <Calendar className="w-4 h-4" /> },
          { id: 'neumaticos', label: 'Gestión de Neumáticos', icon: <Disc className="w-4 h-4" /> }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveMainTab(tab.id as any)}
            className={`pb-3 text-xs font-bold flex items-center gap-2 border-b-2 transition ${
              activeMainTab === tab.id
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* VISTA 1: ÓRDENES DE TRABAJO */}
      {activeMainTab === 'ots' && (
        <div className="space-y-4">
          {/* Barra de Filtros */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-3 flex-1 min-w-[280px]">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar por número OT, código de equipo o falla reportada..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <select
                value={estadoFilter}
                onChange={e => setEstadoFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-amber-500"
              >
                <option value="TODOS">Todos los Estados</option>
                <option value="ABIERTA">Abierta</option>
                <option value="EN_PROCESO">En Proceso</option>
                <option value="ESPERANDO_REPUESTO">Esperando Repuesto</option>
                <option value="CERRADA">Cerrada</option>
              </select>

              <select
                value={tipoFilter}
                onChange={e => setTipoFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-amber-500"
              >
                <option value="TODOS">Todos los Tipos</option>
                <option value="CORRECTIVO">Correctivo</option>
                <option value="PREVENTIVO">Preventivo</option>
                <option value="EMERGENCIA">Emergencia</option>
              </select>

              <div className="bg-slate-950 p-0.5 rounded-lg border border-slate-800 flex">
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-2.5 py-1 text-xs rounded font-medium ${
                    viewMode === 'table' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400'
                  }`}
                >
                  Tabla
                </button>
                <button
                  onClick={() => setViewMode('kanban')}
                  className={`px-2.5 py-1 text-xs rounded font-medium ${
                    viewMode === 'kanban' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400'
                  }`}
                >
                  Kanban
                </button>
              </div>
            </div>
          </div>

          {/* Grilla / Master Table & Detail Panel */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
            {/* Tabla Principal */}
            <div className={`bg-slate-900 border border-slate-800 rounded-xl overflow-hidden ${selectedOT ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800">
                    <tr>
                      <th className="p-3">Nº OT</th>
                      <th className="p-3">Equipo</th>
                      <th className="p-3">Tipo / Falla</th>
                      <th className="p-3">Prioridad</th>
                      <th className="p-3">Estado</th>
                      <th className="p-3">Downtime</th>
                      <th className="p-3 text-right">Costo Total</th>
                      <th className="p-3 text-center">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 text-slate-300">
                    {filteredOts.map(ot => {
                      const isSelected = selectedOT?.id === ot.id;
                      const eq = equipos.find(e => e.id === ot.equipoId);

                      return (
                        <tr
                          key={ot.id}
                          onClick={() => setSelectedOT(ot)}
                          className={`hover:bg-slate-800/60 cursor-pointer transition ${
                            isSelected ? 'bg-amber-500/10 border-l-4 border-amber-500' : ''
                          }`}
                        >
                          <td className="p-3 font-mono font-bold text-amber-400 whitespace-nowrap">{ot.numeroOT}</td>
                          <td className="p-3">
                            <span className="font-mono font-bold text-white block">{eq?.codigoInterno || ot.equipoId}</span>
                            <span className="text-[10px] text-slate-400">{eq ? `${eq.marca} ${eq.modelo}` : '-'}</span>
                          </td>
                          <td className="p-3 max-w-xs">
                            <span className="font-bold text-slate-200 block">{ot.tipoMantenimiento} ({ot.categoriaFalla})</span>
                            <span className="text-[11px] text-slate-400 truncate block">{ot.fallaReportada}</span>
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              ot.prioridad === 'CRITICA' || ot.prioridad === 'URGENTE' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                              ot.prioridad === 'ALTA' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                              'bg-slate-800 text-slate-300'
                            }`}>
                              {ot.prioridad}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                              ot.estado === 'CERRADA' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                              ot.estado === 'EN_PROCESO' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                              ot.estado === 'ESPERANDO_REPUESTO' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                              'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            }`}>
                              {ot.estado}
                            </span>
                          </td>
                          <td className="p-3 font-mono text-slate-300">
                            {ot.horasParadaEquipo > 0 ? `${ot.horasParadaEquipo} hs` : '-'}
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-emerald-400">
                            ${ot.costoTotal.toLocaleString()}
                          </td>
                          <td className="p-3 text-center">
                            {ot.estado === 'ABIERTA' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStartOT(ot.id);
                                }}
                                className="bg-blue-600 hover:bg-blue-500 text-white px-2 py-1 rounded text-[10px] font-bold"
                              >
                                Iniciar
                              </button>
                            )}
                            {ot.estado === 'EN_PROCESO' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedOT(ot);
                                  setShowCloseModal(true);
                                }}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white px-2 py-1 rounded text-[10px] font-bold"
                              >
                                Cerrar
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

            {/* Ficha / Drawer Lateral de la OT */}
            {selectedOT && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 animate-fadeIn">
                <div className="flex justify-between items-start border-b border-slate-800 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded">
                        {selectedOT.numeroOT}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        selectedOT.estado === 'CERRADA' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        {selectedOT.estado}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-white mt-1">
                      Equipo: {equipos.find(e => e.id === selectedOT.equipoId)?.codigoInterno || selectedOT.equipoId}
                    </h3>
                    <p className="text-xs text-slate-400">{selectedOT.tipoMantenimiento} - {selectedOT.categoriaFalla}</p>
                  </div>
                  <button onClick={() => setSelectedOT(null)} className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Subtabs de la OT */}
                <div className="flex space-x-1 border-b border-slate-800 pb-2 overflow-x-auto text-[11px]">
                  {[
                    { id: 'resumen', label: 'Resumen' },
                    { id: 'tareas', label: 'Tareas' },
                    { id: 'mano_obra', label: 'Mano de Obra' },
                    { id: 'repuestos', label: 'Repuestos' },
                    { id: 'terceros', label: 'Terceros' },
                    { id: 'costos', label: 'Costos' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveOtDrawerTab(tab.id as any)}
                      className={`px-2.5 py-1 rounded font-medium transition ${
                        activeOtDrawerTab === tab.id
                          ? 'bg-amber-500 text-slate-950 font-bold'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* TAB RESUMEN */}
                {activeOtDrawerTab === 'resumen' && (
                  <div className="space-y-3 text-xs text-slate-300">
                    <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
                      <span className="text-slate-500 text-[10px] uppercase font-bold block">Falla Reportada</span>
                      <p className="text-white font-medium">{selectedOT.fallaReportada}</p>
                    </div>

                    {selectedOT.diagnostico && (
                      <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
                        <span className="text-slate-500 text-[10px] uppercase font-bold block">Diagnóstico Técnico</span>
                        <p className="text-slate-200">{selectedOT.diagnostico}</p>
                      </div>
                    )}

                    {selectedOT.trabajoRealizado && (
                      <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
                        <span className="text-slate-500 text-[10px] uppercase font-bold block">Trabajo Realizado</span>
                        <p className="text-slate-200">{selectedOT.trabajoRealizado}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                        <span className="text-slate-500 text-[10px] uppercase block">Odómetro Apertura</span>
                        <span className="font-mono font-bold text-white">{selectedOT.odometroAperturaKm.toLocaleString()} km</span>
                      </div>
                      <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                        <span className="text-slate-500 text-[10px] uppercase block">Horómetro Apertura</span>
                        <span className="font-mono font-bold text-white">{selectedOT.horometroAperturaHs.toLocaleString()} hs</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB TAREAS */}
                {activeOtDrawerTab === 'tareas' && (
                  <div className="space-y-2 text-xs">
                    {selectedOT.tareas.map(tar => (
                      <div key={tar.id} className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex justify-between items-center">
                        <div>
                          <div className="font-semibold text-white">{tar.descripcion}</div>
                          <div className="text-[10px] text-slate-400">Estimado: {tar.horasEstimadas} hs | Real: {tar.horasReales} hs</div>
                        </div>
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-bold">
                          {tar.estado}
                        </span>
                      </div>
                    ))}
                    {selectedOT.tareas.length === 0 && <div className="text-slate-500 italic">Sin tareas detalladas.</div>}
                  </div>
                )}

                {/* TAB MANO DE OBRA */}
                {activeOtDrawerTab === 'mano_obra' && (
                  <div className="space-y-2 text-xs">
                    {selectedOT.personal.map(mo => (
                      <div key={mo.id} className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex justify-between items-center">
                        <div>
                          <div className="font-bold text-white flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-amber-400" /> {mo.mecanicoNombreSnapshot || mo.empleadoId}
                          </div>
                          <div className="text-[10px] text-slate-400">{mo.tipoTrabajo} ({mo.horasTrabajadas} hs @ ${mo.costoHorarioSnapshot.toLocaleString()}/h)</div>
                        </div>
                        <span className="font-mono font-bold text-emerald-400">
                          ${mo.costoTotalLaboral.toLocaleString()}
                        </span>
                      </div>
                    ))}
                    {selectedOT.personal.length === 0 && <div className="text-slate-500 italic">Sin horas de mecánicos imputadas.</div>}
                  </div>
                )}

                {/* TAB REPUESTOS */}
                {activeOtDrawerTab === 'repuestos' && (
                  <div className="space-y-2 text-xs">
                    {selectedOT.repuestos.map(rep => (
                      <div key={rep.id} className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex justify-between items-center">
                        <div>
                          <div className="font-semibold text-white">{rep.descripcionSnapshot}</div>
                          <div className="text-[10px] text-slate-400">{rep.cantidad} {rep.unidadMedida} x ${rep.costoUnitarioSnapshot.toLocaleString()} (Snapshot)</div>
                        </div>
                        <span className="font-mono font-bold text-emerald-400">
                          ${rep.costoTotal.toLocaleString()}
                        </span>
                      </div>
                    ))}
                    {selectedOT.repuestos.length === 0 && <div className="text-slate-500 italic">Sin repuestos consumidos.</div>}
                  </div>
                )}

                {/* TAB TERCEROS */}
                {activeOtDrawerTab === 'terceros' && (
                  <div className="space-y-2 text-xs">
                    {selectedOT.serviciosExternos.map(se => (
                      <div key={se.id} className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex justify-between items-center">
                        <div>
                          <div className="font-semibold text-white">{se.proveedorNombreSnapshot}</div>
                          <div className="text-[10px] text-slate-400">{se.descripcionServicio} ({se.numeroComprobante || 'S/Comprobante'})</div>
                        </div>
                        <span className="font-mono font-bold text-emerald-400">
                          ${se.importe.toLocaleString()}
                        </span>
                      </div>
                    ))}
                    {selectedOT.serviciosExternos.length === 0 && <div className="text-slate-500 italic">Sin servicios de terceros.</div>}
                  </div>
                )}

                {/* TAB COSTOS */}
                {activeOtDrawerTab === 'costos' && (
                  <div className="space-y-2.5 text-xs">
                    <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2">
                      <div className="flex justify-between text-slate-300">
                        <span>Repuestos & Insumos:</span>
                        <span className="font-mono font-bold text-white">${selectedOT.costoRepuestos.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span>Mano de Obra Taller:</span>
                        <span className="font-mono font-bold text-white">${selectedOT.costoManoObra.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span>Servicios de Terceros:</span>
                        <span className="font-mono font-bold text-white">${selectedOT.costoServiciosTerceros.toLocaleString()}</span>
                      </div>
                      <div className="border-t border-slate-800 pt-2 flex justify-between font-bold text-amber-400 text-sm">
                        <span>Costo Total OT:</span>
                        <span className="font-mono text-emerald-400">${selectedOT.costoTotal.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* VISTA 2: PLANES PREVENTIVOS */}
      {activeMainTab === 'preventivos' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Calendar className="w-4 h-4 text-amber-400" /> Semáforo de Mantenimientos Preventivos por Horas / Km
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800">
                <tr>
                  <th className="p-3">Equipo</th>
                  <th className="p-3">Plan Preventivo</th>
                  <th className="p-3">Km / Horas Actuales</th>
                  <th className="p-3">Último Service</th>
                  <th className="p-3">Próximo Service</th>
                  <th className="p-3">Estado Semáforo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {preventiveList.map(({ equipo, planes }) =>
                  planes.map(pl => (
                    <tr key={pl.id} className="hover:bg-slate-800/50">
                      <td className="p-3 font-mono font-bold text-amber-400">{equipo.codigoInterno}</td>
                      <td className="p-3">
                        <span className="font-semibold text-white block">{pl.plan?.nombre}</span>
                        <span className="text-[10px] text-slate-400">{pl.plan?.descripcion}</span>
                      </td>
                      <td className="p-3 font-mono">
                        {equipo.odometroKmActual > 0 ? `${equipo.odometroKmActual.toLocaleString()} km` : `${equipo.horometroHsActual.toLocaleString()} hs`}
                      </td>
                      <td className="p-3 text-[11px] text-slate-400">
                        {pl.ultimoServiceKm > 0 ? `${pl.ultimoServiceKm.toLocaleString()} km` : `${pl.ultimoServiceHoras} hs`} ({pl.ultimoServiceFecha || 'S/D'})
                      </td>
                      <td className="p-3 font-mono font-bold text-white">
                        {pl.proximoServiceKm ? `${pl.proximoServiceKm.toLocaleString()} km` : `${pl.proximoServiceHoras} hs`}
                      </td>
                      <td className="p-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          pl.estadoAlerta === 'VENCIDO' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                          pl.estadoAlerta === 'PROXIMO' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                          'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}>
                          {pl.estadoAlerta}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VISTA 3: NEUMÁTICOS */}
      {activeMainTab === 'neumaticos' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Disc className="w-4 h-4 text-purple-400" /> Inventario & Seguimiento Individual de Cubiertas
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800">
                <tr>
                  <th className="p-3">Código</th>
                  <th className="p-3">Marca / Modelo</th>
                  <th className="p-3">Medida / DOT</th>
                  <th className="p-3">Ubicación Actual</th>
                  <th className="p-3">Profundidad Dibujo</th>
                  <th className="p-3">Km Totales</th>
                  <th className="p-3 text-right">Costo Acumulado</th>
                  <th className="p-3">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {tiresList.map(t => (
                  <tr key={t.id} className="hover:bg-slate-800/50">
                    <td className="p-3 font-mono font-bold text-amber-400">{t.codigoInterno}</td>
                    <td className="p-3 font-semibold text-white">{t.marca} {t.modelo}</td>
                    <td className="p-3 font-mono">{t.medida} (DOT {t.dot || 'N/A'})</td>
                    <td className="p-3">
                      {t.equipoActualId ? (
                        <span className="text-white font-mono font-bold">
                          {equipos.find(e => e.id === t.equipoActualId)?.codigoInterno || t.equipoActualId} ({t.posicionActual})
                        </span>
                      ) : (
                        <span className="text-slate-500 italic">En Pañol / Stock</span>
                      )}
                    </td>
                    <td className="p-3 font-mono font-bold text-slate-200">{t.profundidadDibujoMm} mm</td>
                    <td className="p-3 font-mono">{t.kmActualesTotales.toLocaleString()} km</td>
                    <td className="p-3 text-right font-mono font-bold text-emerald-400">
                      ${t.costoTotalAcumulado.toLocaleString()}
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        t.estado === 'INSTALADO' ? 'bg-emerald-500/20 text-emerald-400' :
                        t.estado === 'EN_REPARACION' ? 'bg-red-500/20 text-red-400' :
                        'bg-slate-800 text-slate-300'
                      }`}>
                        {t.estado}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL NUEVA OT */}
      {showNewOtModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form onSubmit={handleCreateOT} className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-5 space-y-4 text-xs">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Wrench className="w-4 h-4 text-amber-400" /> Nueva Orden de Trabajo de Taller
              </h3>
              <button type="button" onClick={() => setShowNewOtModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-slate-400 block mb-1">Equipo a Intervenir *</label>
                <select
                  value={newOtEquipoId}
                  onChange={e => setNewOtEquipoId(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="">Seleccione equipo...</option>
                  {equipos.map(eq => (
                    <option key={eq.id} value={eq.id}>
                      {eq.codigoInterno} - {eq.marca} {eq.modelo} ({eq.tipoEquipo})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-slate-400 block mb-1">Tipo</label>
                  <select
                    value={newOtTipo}
                    onChange={e => setNewOtTipo(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-2 text-white"
                  >
                    <option value="CORRECTIVO">Correctivo</option>
                    <option value="PREVENTIVO">Preventivo</option>
                    <option value="EMERGENCIA">Emergencia</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Categoría</label>
                  <select
                    value={newOtCategoria}
                    onChange={e => setNewOtCategoria(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-2 text-white"
                  >
                    <option value="MOTOR">Motor</option>
                    <option value="TRANSMISION">Transmisión</option>
                    <option value="FRENOS">Frenos</option>
                    <option value="HIDRAULICO">Hidráulico</option>
                    <option value="TAMBOR">Tambor</option>
                    <option value="ELECTRICO">Eléctrico</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Prioridad</label>
                  <select
                    value={newOtPrioridad}
                    onChange={e => setNewOtPrioridad(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-2 text-white"
                  >
                    <option value="BAJA">Baja</option>
                    <option value="NORMAL">Normal</option>
                    <option value="ALTA">Alta</option>
                    <option value="URGENTE">Urgente</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Falla Reportada / Motivo de Ingreso *</label>
                <textarea
                  value={newOtFalla}
                  onChange={e => setNewOtFalla(e.target.value)}
                  required
                  rows={3}
                  placeholder="Describa el síntoma, ruido o motivo de la intervención..."
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="bloqueaEq"
                  checked={newOtBloquea}
                  onChange={e => setNewOtBloquea(e.target.checked)}
                  className="rounded border-slate-800 bg-slate-950 text-amber-500"
                />
                <label htmlFor="bloqueaEq" className="text-slate-300 text-xs">
                  Bloquear equipo operativamente (Pasa a estado EN_TALLER)
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowNewOtModal(false)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-3 py-1.5 rounded"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-1.5 rounded"
              >
                Abrir OT
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL CIERRE OT */}
      {showCloseModal && selectedOT && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form onSubmit={handleCloseOT} className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-5 space-y-4 text-xs">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" /> Cierre Técnico de Orden de Trabajo #{selectedOT.numeroOT}
              </h3>
              <button type="button" onClick={() => setShowCloseModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-slate-400 block mb-1">Diagnóstico Final</label>
                <input
                  type="text"
                  value={closeDiagnostico}
                  onChange={e => setCloseDiagnostico(e.target.value)}
                  placeholder="Diagnóstico técnico constatado..."
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Trabajo Realizado *</label>
                <textarea
                  value={closeTrabajo}
                  onChange={e => setCloseTrabajo(e.target.value)}
                  required
                  rows={3}
                  placeholder="Detalle de trabajos, reparaciones, ajustes y pruebas realizadas..."
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Causa Raíz</label>
                <select
                  value={closeCausa}
                  onChange={e => setCloseCausa(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-2 text-white"
                >
                  <option value="DESGASTE_NORMAL">Desgaste Normal</option>
                  <option value="ROTURA_ACCIDENTAL">Rotura Accidental</option>
                  <option value="FALTA_MANTENIMIENTO">Falta de Mantenimiento</option>
                  <option value="MAL_USO">Mal Uso / Operación Indebida</option>
                  <option value="FALLA_COMPONENTE">Falla de Componente / Repuesto</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowCloseModal(false)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-3 py-1.5 rounded"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-1.5 rounded"
              >
                Confirmar y Cerrar OT
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
