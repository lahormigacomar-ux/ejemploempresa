import React, { useState, useEffect } from 'react';
import {
  Truck,
  Wrench,
  Fuel,
  ShieldAlert,
  Search,
  Plus,
  Filter,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
  User,
  Gauge,
  FileText,
  Shield,
  Layers,
  Activity,
  ArrowRight,
  X
} from 'lucide-react';
import { Equipo, EstadoOperativoEquipo, TipoEquipo, LecturaContador } from '../types';
import { equipmentRepository } from '../repositories/equipmentRepository';
import { fleetService } from '../services/fleetService';
import { fleetAvailabilityService } from '../services/fleetAvailabilityService';

export const FleetView: React.FC = () => {
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [selectedEquipo, setSelectedEquipo] = useState<Equipo | null>(null);
  const [activeDrawerTab, setActiveDrawerTab] = useState<'general' | 'tecnica' | 'documentos' | 'contadores' | 'asignaciones' | 'costos'>('general');
  const [searchTerm, setSearchTerm] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState<string>('TODOS');
  const [estadoFiltro, setEstadoFiltro] = useState<string>('TODOS');
  const [counterHistory, setCounterHistory] = useState<LecturaContador[]>([]);
  const [nuevoKmInput, setNuevoKmInput] = useState<string>('');
  const [errorLectura, setErrorLectura] = useState<string | null>(null);

  const loadEquipos = async () => {
    const list = await equipmentRepository.getAll();
    setEquipos(list);
    if (selectedEquipo) {
      const updated = await equipmentRepository.getById(selectedEquipo.id);
      setSelectedEquipo(updated);
      if (updated) {
        const hist = await equipmentRepository.getCounterHistory(updated.id);
        setCounterHistory(hist);
      }
    }
  };

  useEffect(() => {
    loadEquipos();
  }, []);

  const handleSelectEquipo = async (eq: Equipo) => {
    setSelectedEquipo(eq);
    const hist = await equipmentRepository.getCounterHistory(eq.id);
    setCounterHistory(hist);
    setNuevoKmInput('');
    setErrorLectura(null);
  };

  const handleCambiarEstado = async (nuevoEstado: EstadoOperativoEquipo) => {
    if (!selectedEquipo) return;
    await fleetService.changeStatus(selectedEquipo.id, nuevoEstado, 'Cambio manual desde panel de flota');
    await loadEquipos();
  };

  const handleRegistrarLectura = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEquipo || !nuevoKmInput) return;
    setErrorLectura(null);
    try {
      const val = parseFloat(nuevoKmInput);
      if (selectedEquipo.odometroKmActual > 0) {
        await fleetService.registerOdometerReading(selectedEquipo.id, val, 'MANUAL');
      } else {
        await fleetService.registerHourmeterReading(selectedEquipo.id, val, 'MANUAL');
      }
      setNuevoKmInput('');
      await loadEquipos();
    } catch (err: any) {
      setErrorLectura(err.message || 'Error al registrar lectura');
    }
  };

  const filteredEquipos = equipos.filter((eq) => {
    const matchesSearch =
      eq.codigoInterno.toLowerCase().includes(searchTerm.toLowerCase()) ||
      eq.marca.toLowerCase().includes(searchTerm.toLowerCase()) ||
      eq.modelo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (eq.dominioPatente && eq.dominioPatente.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesTipo = tipoFiltro === 'TODOS' || eq.tipoEquipo === tipoFiltro;
    const matchesEstado = estadoFiltro === 'TODOS' || eq.estadoOperativo === estadoFiltro;

    return matchesSearch && matchesTipo && matchesEstado;
  });

  // KPIs compactos
  const totalEquipos = equipos.length;
  const disponibles = equipos.filter((e) => e.estadoOperativo === 'DISPONIBLE').length;
  const enOperacion = equipos.filter((e) => e.estadoOperativo === 'EN_OPERACION' || e.estadoOperativo === 'EN_VIAJE').length;
  const enTaller = equipos.filter((e) => e.estadoOperativo === 'EN_TALLER' || e.estadoOperativo === 'MANTENIMIENTO_PROGRAMADO').length;
  const fueraServicio = equipos.filter((e) => e.estadoOperativo === 'FUERA_SERVICIO').length;
  const conDocVencida = equipos.filter((e) =>
    e.documentos.some((d) => d.estado === 'vencido' || (d.fechaVencimiento && d.fechaVencimiento < '2026-09-30'))
  ).length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Módulo 2: Flota, Maquinaria & Activos Operativos</h2>
          <p className="text-xs text-slate-400">
            Maestro central de mixers, bombas, maquinaria de cantera y rodados con seguimiento de odómetro, horómetro y disponibilidad.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="bg-slate-800 text-slate-300 border border-slate-700 px-3 py-1 rounded-lg text-xs font-mono flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-amber-400" /> Esquema 002_flota_maquinaria_schema.sql
          </span>
        </div>
      </div>

      {/* KPI Bar Compacto */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
          <span className="text-[11px] font-semibold text-slate-400 uppercase">Total Flota</span>
          <div className="text-xl font-black text-white mt-0.5">{totalEquipos}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
          <span className="text-[11px] font-semibold text-emerald-400 uppercase flex items-center gap-1">
            <CheckCircle className="w-3 h-3" /> Disponibles
          </span>
          <div className="text-xl font-black text-emerald-400 mt-0.5">{disponibles}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
          <span className="text-[11px] font-semibold text-blue-400 uppercase flex items-center gap-1">
            <Activity className="w-3 h-3" /> Operando / Viaje
          </span>
          <div className="text-xl font-black text-blue-400 mt-0.5">{enOperacion}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
          <span className="text-[11px] font-semibold text-amber-400 uppercase flex items-center gap-1">
            <Wrench className="w-3 h-3" /> En Taller / Service
          </span>
          <div className="text-xl font-black text-amber-400 mt-0.5">{enTaller}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
          <span className="text-[11px] font-semibold text-red-400 uppercase flex items-center gap-1">
            <XCircle className="w-3 h-3" /> Fuera de Servicio
          </span>
          <div className="text-xl font-black text-red-400 mt-0.5">{fueraServicio}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
          <span className="text-[11px] font-semibold text-orange-400 uppercase flex items-center gap-1">
            <ShieldAlert className="w-3 h-3" /> Alerta Documentos
          </span>
          <div className="text-xl font-black text-orange-400 mt-0.5">{conDocVencida}</div>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3 flex-1 min-w-[280px]">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por código (ej. MIX-12), marca, modelo o patente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <select
            value={tipoFiltro}
            onChange={(e) => setTipoFiltro(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-amber-500"
          >
            <option value="TODOS">Todos los Tipos</option>
            <option value="MIXER">Mixers</option>
            <option value="BOMBA_HORMIGON">Bombas</option>
            <option value="CARGADORA">Cargadoras</option>
            <option value="CAMIONETA">Camionetas</option>
            <option value="CAMION">Camiones</option>
          </select>

          <select
            value={estadoFiltro}
            onChange={(e) => setEstadoFiltro(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-amber-500"
          >
            <option value="TODOS">Todos los Estados</option>
            <option value="DISPONIBLE">Disponible</option>
            <option value="EN_OPERACION">En Operación</option>
            <option value="EN_VIAJE">En Viaje</option>
            <option value="EN_TALLER">En Taller</option>
            <option value="FUERA_SERVICIO">Fuera de Servicio</option>
          </select>
        </div>
      </div>

      {/* Grilla / Master Table & Detail Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
        {/* Tabla Principal */}
        <div className={`bg-slate-900 border border-slate-800 rounded-xl overflow-hidden ${selectedEquipo ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800">
                <tr>
                  <th className="p-3">Código</th>
                  <th className="p-3">Tipo / Subtipo</th>
                  <th className="p-3">Marca y Modelo</th>
                  <th className="p-3">Patente / Serie</th>
                  <th className="p-3">Odómetro / Horómetro</th>
                  <th className="p-3">Operador Habitual</th>
                  <th className="p-3">Estado Operativo</th>
                  <th className="p-3 text-center">Docs</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-300">
                {filteredEquipos.map((eq) => {
                  const isSelected = selectedEquipo?.id === eq.id;
                  const hasDocAlert = eq.documentos.some(
                    (d) => d.estado === 'vencido' || (d.fechaVencimiento && d.fechaVencimiento < '2026-09-30')
                  );

                  return (
                    <tr
                      key={eq.id}
                      onClick={() => handleSelectEquipo(eq)}
                      className={`hover:bg-slate-800/60 cursor-pointer transition ${
                        isSelected ? 'bg-amber-500/10 border-l-4 border-amber-500' : ''
                      }`}
                    >
                      <td className="p-3 font-mono font-bold text-amber-400 whitespace-nowrap">{eq.codigoInterno}</td>
                      <td className="p-3">
                        <span className="font-semibold text-white block">{eq.tipoEquipo}</span>
                        <span className="text-[11px] text-slate-400">{eq.subtipo || '-'}</span>
                      </td>
                      <td className="p-3">
                        <div className="font-medium text-slate-200">{eq.marca} {eq.modelo}</div>
                        <div className="text-[11px] text-slate-400">Año {eq.anio}</div>
                      </td>
                      <td className="p-3 font-mono">{eq.dominioPatente || eq.numeroSerie || 'S/D'}</td>
                      <td className="p-3 font-mono">
                        {eq.odometroKmActual > 0 ? (
                          <span className="text-white font-semibold">{eq.odometroKmActual.toLocaleString()} km</span>
                        ) : (
                          <span className="text-white font-semibold">{eq.horometroHsActual.toLocaleString()} hs</span>
                        )}
                      </td>
                      <td className="p-3">
                        {eq.operadorAsignadoActual ? (
                          <span className="flex items-center gap-1 text-slate-200">
                            <User className="w-3 h-3 text-amber-400" /> {eq.operadorAsignadoActual.nombreCompleto}
                          </span>
                        ) : (
                          <span className="text-slate-500 italic">Sin asignar</span>
                        )}
                      </td>
                      <td className="p-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                          eq.estadoOperativo === 'DISPONIBLE' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                          eq.estadoOperativo === 'EN_OPERACION' || eq.estadoOperativo === 'EN_VIAJE' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                          eq.estadoOperativo === 'EN_TALLER' || eq.estadoOperativo === 'MANTENIMIENTO_PROGRAMADO' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                          'bg-red-500/20 text-red-400 border border-red-500/30'
                        }`}>
                          {eq.estadoOperativo}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        {hasDocAlert ? (
                          <span className="text-red-400 font-bold" title="Documento vencido">⚠️</span>
                        ) : (
                          <span className="text-emerald-400 font-bold" title="Al día">✓</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Ficha / Drawer Lateral del Equipo Seleccionado */}
        {selectedEquipo && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 animate-fadeIn">
            {/* Cabecera Ficha */}
            <div className="flex justify-between items-start border-b border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded">
                    {selectedEquipo.codigoInterno}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    selectedEquipo.estadoOperativo === 'DISPONIBLE' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                    'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  }`}>
                    {selectedEquipo.estadoOperativo}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white mt-1">
                  {selectedEquipo.marca} {selectedEquipo.modelo} ({selectedEquipo.anio})
                </h3>
                <p className="text-xs text-slate-400 font-mono">Patente: {selectedEquipo.dominioPatente || 'N/A'}</p>
              </div>

              <button
                onClick={() => setSelectedEquipo(null)}
                className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Subtabs de la Ficha */}
            <div className="flex space-x-1 border-b border-slate-800 pb-2 overflow-x-auto text-[11px]">
              {[
                { id: 'general', label: 'General' },
                { id: 'tecnica', label: 'Técnica' },
                { id: 'documentos', label: 'Documentos' },
                { id: 'contadores', label: 'Contadores' },
                { id: 'asignaciones', label: 'Operador' },
                { id: 'costos', label: 'Costos' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveDrawerTab(tab.id as any)}
                  className={`px-2.5 py-1 rounded font-medium transition ${
                    activeDrawerTab === tab.id
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* TAB GENERAL */}
            {activeDrawerTab === 'general' && (
              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-2 text-slate-300">
                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-slate-500 text-[10px] uppercase block">Tipo Propiedad</span>
                    <span className="font-semibold text-white">{selectedEquipo.tipoPropiedad}</span>
                  </div>
                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-slate-500 text-[10px] uppercase block">Ubicación Actual</span>
                    <span className="font-semibold text-white">{selectedEquipo.ubicacionActualTipo}</span>
                  </div>
                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-slate-500 text-[10px] uppercase block">Centro de Costo</span>
                    <span className="font-semibold text-white">{selectedEquipo.centroCostoHabitualId}</span>
                  </div>
                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-slate-500 text-[10px] uppercase block">Estado Admin.</span>
                    <span className="font-semibold text-white">{selectedEquipo.estadoAdministrativo}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 space-y-2">
                  <span className="text-[11px] font-bold text-slate-300 block">Cambiar Estado Operativo:</span>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      onClick={() => handleCambiarEstado('DISPONIBLE')}
                      className="bg-slate-950 hover:bg-emerald-950/40 text-emerald-400 border border-emerald-500/30 py-1.5 rounded text-[11px] font-bold"
                    >
                      Disponible
                    </button>
                    <button
                      onClick={() => handleCambiarEstado('EN_TALLER')}
                      className="bg-slate-950 hover:bg-amber-950/40 text-amber-400 border border-amber-500/30 py-1.5 rounded text-[11px] font-bold"
                    >
                      A Taller
                    </button>
                    <button
                      onClick={() => handleCambiarEstado('FUERA_SERVICIO')}
                      className="bg-slate-950 hover:bg-red-950/40 text-red-400 border border-red-500/30 py-1.5 rounded text-[11px] font-bold"
                    >
                      Fuera Servicio
                    </button>
                    <button
                      onClick={() => handleCambiarEstado('EN_VIAJE')}
                      className="bg-slate-950 hover:bg-blue-950/40 text-blue-400 border border-blue-500/30 py-1.5 rounded text-[11px] font-bold"
                    >
                      En Viaje
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB TÉCNICA */}
            {activeDrawerTab === 'tecnica' && (
              <div className="space-y-2.5 text-xs text-slate-300">
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Combustible:</span>
                    <span className="font-bold text-white">{selectedEquipo.especificaciones.tipoCombustible} ({selectedEquipo.especificaciones.capacidadTanqueCombustibleLt || 0} Lt)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Tracción / Ejes:</span>
                    <span className="font-bold text-white">{selectedEquipo.especificaciones.tipoTraccion || 'N/A'} ({selectedEquipo.especificaciones.cantidadEjes} ejes)</span>
                  </div>
                  {selectedEquipo.especificaciones.potenciaHp && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Potencia:</span>
                      <span className="font-bold text-white">{selectedEquipo.especificaciones.potenciaHp} HP</span>
                    </div>
                  )}
                  {selectedEquipo.especificaciones.capacidadTamborM3 && (
                    <div className="flex justify-between text-amber-400 font-semibold">
                      <span>Capacidad Tambor:</span>
                      <span>{selectedEquipo.especificaciones.capacidadTamborM3} m³</span>
                    </div>
                  )}
                  {selectedEquipo.especificaciones.alcanceVerticalMts && (
                    <div className="flex justify-between text-blue-400 font-semibold">
                      <span>Alcance Pluma:</span>
                      <span>{selectedEquipo.especificaciones.alcanceVerticalMts} mts</span>
                    </div>
                  )}
                  {selectedEquipo.especificaciones.capacidadBaldeM3 && (
                    <div className="flex justify-between text-emerald-400 font-semibold">
                      <span>Capacidad Balde:</span>
                      <span>{selectedEquipo.especificaciones.capacidadBaldeM3} m³</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB DOCUMENTOS */}
            {activeDrawerTab === 'documentos' && (
              <div className="space-y-3 text-xs">
                {selectedEquipo.seguroVigente && (
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-white flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-amber-400" /> Póliza de Seguro
                      </span>
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-bold">
                        {selectedEquipo.seguroVigente.activo ? 'VIGENTE' : 'VENCIDO'}
                      </span>
                    </div>
                    <div className="text-slate-400 text-[11px]">{selectedEquipo.seguroVigente.companiaAseguradora} - #{selectedEquipo.seguroVigente.numeroPoliza}</div>
                    <div className="text-slate-400 text-[11px]">Vigencia: {selectedEquipo.seguroVigente.vigenciaDesde} al {selectedEquipo.seguroVigente.vigenciaHasta}</div>
                  </div>
                )}

                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-slate-300 block">Documentación Registrada:</span>
                  {selectedEquipo.documentos.map((doc) => (
                    <div key={doc.id} className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex justify-between items-center text-xs">
                      <div>
                        <div className="font-bold text-white">{doc.tipoDocumento}</div>
                        <div className="text-[10px] text-slate-400">Nro: {doc.numero} | Vence: {doc.fechaVencimiento || 'Sin vencimiento'}</div>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        doc.estado === 'vencido' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-emerald-500/20 text-emerald-400'
                      }`}>
                        {doc.estado.toUpperCase()}
                      </span>
                    </div>
                  ))}
                  {selectedEquipo.documentos.length === 0 && (
                    <div className="text-slate-500 text-xs italic">Sin documentos adjuntos.</div>
                  )}
                </div>
              </div>
            )}

            {/* TAB CONTADORES */}
            {activeDrawerTab === 'contadores' && (
              <div className="space-y-4 text-xs">
                <form onSubmit={handleRegistrarLectura} className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2">
                  <span className="font-bold text-white block">
                    Actualizar {selectedEquipo.odometroKmActual > 0 ? 'Odómetro (Km)' : 'Horómetro (Hs)'}
                  </span>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder={`Valor mayor a ${selectedEquipo.odometroKmActual || selectedEquipo.horometroHsActual}...`}
                      value={nuevoKmInput}
                      onChange={(e) => setNuevoKmInput(e.target.value)}
                      className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white flex-1 focus:outline-none focus:border-amber-500"
                    />
                    <button
                      type="submit"
                      className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1 rounded text-xs"
                    >
                      Guardar
                    </button>
                  </div>
                  {errorLectura && <div className="text-red-400 text-[11px]">⚠️ {errorLectura}</div>}
                </form>

                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase block">Historial de Lecturas</span>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {counterHistory.map((lec) => (
                      <div key={lec.id} className="bg-slate-950 p-2 rounded border border-slate-800 flex justify-between items-center text-[11px]">
                        <div>
                          <span className="font-mono font-bold text-white">{lec.valor.toLocaleString()} {lec.tipoContador === 'ODOMETRO_KM' ? 'km' : 'hs'}</span>
                          <span className="text-slate-500 text-[10px] block">{lec.fechaHora.split('T')[0]} ({lec.origenLectura})</span>
                        </div>
                        {lec.referenciaOrigenId && (
                          <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">
                            {lec.referenciaOrigenId}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB ASIGNACIONES */}
            {activeDrawerTab === 'asignaciones' && (
              <div className="space-y-3 text-xs text-slate-300">
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
                  <span className="text-slate-500 text-[10px] uppercase block">Operador / Chofer Asignado Actual</span>
                  {selectedEquipo.operadorAsignadoActual ? (
                    <div>
                      <div className="text-sm font-bold text-white flex items-center gap-1.5">
                        <User className="w-4 h-4 text-amber-400" /> {selectedEquipo.operadorAsignadoActual.nombreCompleto}
                      </div>
                      <div className="text-slate-400 text-[11px] mt-0.5">
                        Tipo: {selectedEquipo.operadorAsignadoActual.tipoAsignacion} | Desde: {selectedEquipo.operadorAsignadoActual.fechaDesde}
                      </div>
                    </div>
                  ) : (
                    <div className="text-slate-500 italic">No tiene chofer habitual asignado.</div>
                  )}
                </div>
              </div>
            )}

            {/* TAB COSTOS */}
            {activeDrawerTab === 'costos' && (
              <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 text-xs space-y-2 text-slate-300">
                <div className="font-bold text-amber-400 flex items-center gap-1.5">
                  <Layers className="w-4 h-4" /> Centro de Costos & Base Contable
                </div>
                <p className="text-slate-400 text-[11px]">
                  Imputado a: <strong className="text-white">{selectedEquipo.centroCostoHabitualId}</strong>
                </p>
                <div className="pt-2 text-slate-500 text-[10px] italic border-t border-slate-800">
                  El cálculo de costo real por km y por m³ transportado se completará al conectar los módulos de Mantenimiento, Combustible y Costos.
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
