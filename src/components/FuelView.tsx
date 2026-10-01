import React, { useState, useEffect } from 'react';
import {
  Fuel,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Plus,
  RefreshCw,
  Search,
  Filter,
  Calendar,
  Layers,
  Truck,
  Droplets,
  DollarSign,
  Gauge,
  ShieldAlert,
  ArrowDownRight,
  ArrowUpRight,
  Ban,
  FileText
} from 'lucide-react';
import {
  AbastecimientoCombustible,
  TanqueCombustible,
  TipoCombustible,
  AlertaCombustible,
  MovimientoTanqueCombustible,
  ParametroRendimientoEquipo,
  OrigenAbastecimiento
} from '../types';
import { fuelRepository } from '../repositories/fuelRepository';
import { tankRepository } from '../repositories/tankRepository';
import { fuelPerformanceRepository } from '../repositories/fuelPerformanceRepository';
import { equipmentRepository } from '../repositories/equipmentRepository';
import { employeeRepository } from '../repositories/employeeRepository';
import { fuelService } from '../services/fuelService';
import { tankService } from '../services/tankService';

export const FuelView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'supplies' | 'tanks' | 'performance' | 'alerts'>('supplies');
  const [supplies, setSupplies] = useState<AbastecimientoCombustible[]>([]);
  const [tanks, setTanks] = useState<TanqueCombustible[]>([]);
  const [fuelTypes, setFuelTypes] = useState<TipoCombustible[]>([]);
  const [alerts, setAlerts] = useState<AlertaCombustible[]>([]);
  const [movements, setMovements] = useState<MovimientoTanqueCombustible[]>([]);
  const [parameters, setParameters] = useState<ParametroRendimientoEquipo[]>([]);
  const [equipments, setEquipments] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOrigen, setFilterOrigen] = useState<string>('TODOS');
  const [filterDesvio, setFilterDesvio] = useState<string>('TODOS');
  const [selectedTanqueId, setSelectedTanqueId] = useState<string>('TODOS');

  // Modales
  const [showSupplyModal, setShowSupplyModal] = useState(false);
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [showMeasurementModal, setShowMeasurementModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedSupplyToCancel, setSelectedSupplyToCancel] = useState<AbastecimientoCombustible | null>(null);
  const [cancelMotivo, setCancelMotivo] = useState('');

  // Form State Abastecimiento
  const [formEquipoId, setFormEquipoId] = useState('');
  const [formEmpleadoId, setFormEmpleadoId] = useState('');
  const [formTipoCombustibleId, setFormTipoCombustibleId] = useState('fuel-diesel-500');
  const [formOrigen, setFormOrigen] = useState<OrigenAbastecimiento>('TANQUE_INTERNO');
  const [formTanqueId, setFormTanqueId] = useState('');
  const [formEstacionNombre, setFormEstacionNombre] = useState('');
  const [formLitros, setFormLitros] = useState<number>(0);
  const [formPrecioUnitario, setFormPrecioUnitario] = useState<number>(1150);
  const [formOdometro, setFormOdometro] = useState<number | undefined>();
  const [formHorometro, setFormHorometro] = useState<number | undefined>();
  const [formVale, setFormVale] = useState('');
  const [formObservaciones, setFormObservaciones] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Form State Ingreso Cisterna
  const [incomeTanqueId, setIncomeTanqueId] = useState('');
  const [incomeLitros, setIncomeLitros] = useState<number>(0);
  const [incomeProveedor, setIncomeProveedor] = useState('YPF Directo Mayorista');
  const [incomePrecio, setIncomePrecio] = useState<number>(1150);
  const [incomeRemito, setIncomeRemito] = useState('');
  const [incomeFactura, setIncomeFactura] = useState('');
  const [incomeError, setIncomeError] = useState<string | null>(null);

  const loadData = async () => {
    const [allSupplies, allTanks, allFuelTypes, allAlerts, allParams, allEqs, allEmps] = await Promise.all([
      fuelRepository.getAllSupplies(),
      tankRepository.getAllTanks(),
      tankRepository.getFuelTypes(),
      fuelPerformanceRepository.getAlerts(),
      fuelPerformanceRepository.getAllParameters(),
      equipmentRepository.getAll(),
      employeeRepository.getAll()
    ]);
    setSupplies(allSupplies);
    setTanks(allTanks);
    setFuelTypes(allFuelTypes);
    setAlerts(allAlerts);
    setParameters(allParams);
    setEquipments(allEqs);
    setEmployees(allEmps);

    if (allTanks.length > 0) {
      setFormTanqueId(allTanks[0].id);
      setIncomeTanqueId(allTanks[0].id);
      const movs = await tankRepository.getTankMovements();
      setMovements(movs);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // KPIs
  const totalLitrosMes = supplies
    .filter(s => s.estado === 'CONFIRMADO')
    .reduce((sum, s) => sum + s.litros, 0);

  const totalCostoMes = supplies
    .filter(s => s.estado === 'CONFIRMADO')
    .reduce((sum, s) => sum + s.costoTotalSnapshot, 0);

  const totalStockTanques = tanks.reduce((sum, t) => sum + t.stockActualLitros, 0);
  const tanquesBajoMinimo = tanks.filter(t => t.stockActualLitros <= t.stockMinimoLitros).length;
  const alertasCriticas = alerts.filter(a => !a.resuelta && a.tipo === 'CONSUMO_CRITICO').length;

  const handleRegisterSupply = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    try {
      await fuelService.registerSupply({
        equipoId: formEquipoId,
        empleadoId: formEmpleadoId || undefined,
        tipoCombustibleId: formTipoCombustibleId,
        origenAbastecimiento: formOrigen,
        tanqueId: formOrigen === 'TANQUE_INTERNO' ? formTanqueId : undefined,
        estacionServicioNombre: formOrigen === 'ESTACION_SERVICIO' ? formEstacionNombre : undefined,
        litros: Number(formLitros),
        precioUnitario: Number(formPrecioUnitario),
        odometroKm: formOdometro ? Number(formOdometro) : undefined,
        horometroHs: formHorometro ? Number(formHorometro) : undefined,
        numeroVale: formVale || undefined,
        observaciones: formObservaciones || undefined
      });
      setShowSupplyModal(false);
      resetSupplyForm();
      await loadData();
    } catch (err: any) {
      setFormError(err.message || 'Error al registrar abastecimiento');
    }
  };

  const handleRegisterIncome = async (e: React.FormEvent) => {
    e.preventDefault();
    setIncomeError(null);
    try {
      await tankService.registerIncome({
        tanqueId: incomeTanqueId,
        litros: Number(incomeLitros),
        proveedorNombre: incomeProveedor,
        precioUnitario: Number(incomePrecio),
        numeroRemito: incomeRemito || undefined,
        numeroFactura: incomeFactura || undefined
      });
      setShowIncomeModal(false);
      await loadData();
    } catch (err: any) {
      setIncomeError(err.message || 'Error al registrar ingreso de cisterna');
    }
  };

  const handleCancelSupply = async () => {
    if (!selectedSupplyToCancel || !cancelMotivo) return;
    try {
      await fuelService.cancelSupply(selectedSupplyToCancel.id, cancelMotivo, 'admin');
      setShowCancelModal(false);
      setSelectedSupplyToCancel(null);
      setCancelMotivo('');
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Error al anular abastecimiento');
    }
  };

  const handleResolveAlert = async (alertId: string) => {
    await fuelPerformanceRepository.resolveAlert(alertId, 'admin');
    await loadData();
  };

  const resetSupplyForm = () => {
    setFormEquipoId('');
    setFormEmpleadoId('');
    setFormLitros(0);
    setFormOdometro(undefined);
    setFormHorometro(undefined);
    setFormVale('');
    setFormObservaciones('');
    setFormError(null);
  };

  // Filtrado de abastecimientos
  const filteredSupplies = supplies.filter(s => {
    const eq = equipments.find(e => e.id === s.equipoId);
    const matchSearch =
      s.numeroVale?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      eq?.codigoInterno?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      eq?.dominioPatente?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.observaciones?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchOrigen = filterOrigen === 'TODOS' || s.origenAbastecimiento === filterOrigen;
    const matchDesvio = filterDesvio === 'TODOS' || s.nivelDesvio === filterDesvio;
    const matchTanque = selectedTanqueId === 'TODOS' || s.tanqueId === selectedTanqueId;

    return matchSearch && matchOrigen && matchDesvio && matchTanque;
  });

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Cabecera Principal */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-amber-500/10 rounded-lg border border-amber-500/30">
              <Fuel className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">
                MÓDULO 4 — COMBUSTIBLE, ABASTECIMIENTOS & RENDIMIENTO
              </h1>
              <p className="text-xs text-slate-400">
                Control de tanques internos, despacho a flota/maquinaria, métricas L/100km y L/h con auditoría
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowIncomeModal(true)}
            className="flex items-center space-x-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition"
          >
            <Droplets className="w-4 h-4 text-cyan-400" />
            <span>Recibir Cisterna</span>
          </button>
          <button
            onClick={() => setShowSupplyModal(true)}
            className="flex items-center space-x-2 px-3 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-semibold shadow-md transition"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Carga</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Operativos */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Litros Despachados</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-lg font-bold text-white">{totalLitrosMes.toLocaleString()} L</span>
            <Fuel className="w-4 h-4 text-amber-400" />
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">Acumulado mes en curso</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Costo Combustible</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-lg font-bold text-emerald-400">${totalCostoMes.toLocaleString()}</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">Valuación a snapshot histórico</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Stock Tanques Propios</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-lg font-bold text-cyan-400">{totalStockTanques.toLocaleString()} L</span>
            <Layers className="w-4 h-4 text-cyan-400" />
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">{tanks.length} tanques operativos</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Tanques Bajo Mínimo</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className={`text-lg font-bold ${tanquesBajoMinimo > 0 ? 'text-rose-400' : 'text-slate-300'}`}>
              {tanquesBajoMinimo}
            </span>
            <AlertTriangle className={`w-4 h-4 ${tanquesBajoMinimo > 0 ? 'text-rose-400' : 'text-slate-500'}`} />
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">Requiere reposición</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Consumos Críticos</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className={`text-lg font-bold ${alertasCriticas > 0 ? 'text-rose-400' : 'text-slate-300'}`}>
              {alertasCriticas}
            </span>
            <ShieldAlert className={`w-4 h-4 ${alertasCriticas > 0 ? 'text-rose-400' : 'text-slate-500'}`} />
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">Desvío &gt; tolerancia máxima</span>
        </div>
      </div>

      {/* Tabs de Navegación del Módulo */}
      <div className="flex border-b border-slate-800 space-x-2">
        <button
          onClick={() => setActiveTab('supplies')}
          className={`px-4 py-2 text-xs font-medium border-b-2 transition flex items-center space-x-2 ${
            activeTab === 'supplies'
              ? 'border-amber-500 text-amber-400 font-semibold bg-amber-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Fuel className="w-4 h-4" />
          <span>Abastecimientos & Cargas ({supplies.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('tanks')}
          className={`px-4 py-2 text-xs font-medium border-b-2 transition flex items-center space-x-2 ${
            activeTab === 'tanks'
              ? 'border-amber-500 text-amber-400 font-semibold bg-amber-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Tanques & Kardex ({tanks.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('performance')}
          className={`px-4 py-2 text-xs font-medium border-b-2 transition flex items-center space-x-2 ${
            activeTab === 'performance'
              ? 'border-amber-500 text-amber-400 font-semibold bg-amber-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Gauge className="w-4 h-4" />
          <span>Rendimiento & Parámetros</span>
        </button>

        <button
          onClick={() => setActiveTab('alerts')}
          className={`px-4 py-2 text-xs font-medium border-b-2 transition flex items-center space-x-2 ${
            activeTab === 'alerts'
              ? 'border-amber-500 text-amber-400 font-semibold bg-amber-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Alertas Operativas ({alerts.filter(a => !a.resuelta).length})</span>
        </button>
      </div>

      {/* TAB 1: ABASTECIMIENTOS */}
      {activeTab === 'supplies' && (
        <div className="space-y-4">
          {/* Barra de Filtros */}
          <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-2 flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por vale, equipo, chofer o ticket..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 w-full focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-1.5">
                <span className="text-slate-400">Origen:</span>
                <select
                  value={filterOrigen}
                  onChange={e => setFilterOrigen(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-slate-200 focus:outline-none"
                >
                  <option value="TODOS">Todos los orígenes</option>
                  <option value="TANQUE_INTERNO">Tanque Interno</option>
                  <option value="ESTACION_SERVICIO">Estación Externa</option>
                </select>
              </div>

              <div className="flex items-center space-x-1.5">
                <span className="text-slate-400">Desvío:</span>
                <select
                  value={filterDesvio}
                  onChange={e => setFilterDesvio(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-slate-200 focus:outline-none"
                >
                  <option value="TODOS">Todos</option>
                  <option value="NORMAL">Normal</option>
                  <option value="ADVERTENCIA">Advertencia</option>
                  <option value="CRITICO">Crítico</option>
                </select>
              </div>
            </div>
          </div>

          {/* Grilla / Tabla Operativa */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800 uppercase text-[10px] tracking-wider font-semibold">
                <tr>
                  <th className="px-3.5 py-3">Fecha / Vale</th>
                  <th className="px-3.5 py-3">Equipo</th>
                  <th className="px-3.5 py-3">Chofer / Operador</th>
                  <th className="px-3.5 py-3">Origen / Tanque</th>
                  <th className="px-3.5 py-3 text-right">Litros</th>
                  <th className="px-3.5 py-3 text-right">Contador (Km/Hs)</th>
                  <th className="px-3.5 py-3 text-right">Costo Total</th>
                  <th className="px-3.5 py-3 text-center">Rendimiento</th>
                  <th className="px-3.5 py-3 text-center">Estado</th>
                  <th className="px-3.5 py-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredSupplies.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-8 text-center text-slate-500">
                      No se encontraron registros de abastecimiento para los filtros seleccionados.
                    </td>
                  </tr>
                ) : (
                  filteredSupplies.map(s => {
                    const eq = equipments.find(e => e.id === s.equipoId);
                    const emp = employees.find(e => e.id === s.empleadoId);
                    const tq = tanks.find(t => t.id === s.tanqueId);

                    return (
                      <tr key={s.id} className="hover:bg-slate-800/30 transition">
                        <td className="px-3.5 py-2.5">
                          <div className="font-semibold text-white">{s.numeroVale || s.id}</div>
                          <div className="text-[10px] text-slate-400">
                            {new Date(s.fechaHora).toLocaleDateString()} {new Date(s.fechaHora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>

                        <td className="px-3.5 py-2.5">
                          <div className="font-semibold text-amber-400">{eq?.codigoInterno || s.equipoId}</div>
                          <div className="text-[10px] text-slate-400">{eq?.dominioPatente || eq?.subtipo}</div>
                        </td>

                        <td className="px-3.5 py-2.5">
                          {emp ? (
                            <div>
                              <div className="text-slate-200">{emp.apellido}, {emp.nombre}</div>
                              <div className="text-[10px] text-slate-400">Leg. {emp.legajo}</div>
                            </div>
                          ) : (
                            <span className="text-slate-500 italic">S/D</span>
                          )}
                        </td>

                        <td className="px-3.5 py-2.5">
                          {s.origenAbastecimiento === 'TANQUE_INTERNO' ? (
                            <div className="flex items-center space-x-1.5">
                              <span className="px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 text-[10px] font-bold">
                                TANQUE
                              </span>
                              <span className="text-slate-300 truncate max-w-[120px]">{tq?.codigo || 'Interno'}</span>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-1.5">
                              <span className="px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800 text-[10px] font-bold">
                                EXTERNO
                              </span>
                              <span className="text-slate-300 truncate max-w-[120px]">{s.estacionServicioNombreSnapshot || 'Estación'}</span>
                            </div>
                          )}
                        </td>

                        <td className="px-3.5 py-2.5 text-right font-bold text-white">
                          {s.litros.toLocaleString()} L
                        </td>

                        <td className="px-3.5 py-2.5 text-right font-mono">
                          {s.odometroKmSnapshot !== undefined && (
                            <div>{s.odometroKmSnapshot.toLocaleString()} km</div>
                          )}
                          {s.horometroHsSnapshot !== undefined && (
                            <div className="text-cyan-400">{s.horometroHsSnapshot.toLocaleString()} hs</div>
                          )}
                        </td>

                        <td className="px-3.5 py-2.5 text-right font-medium text-emerald-400">
                          ${s.costoTotalSnapshot.toLocaleString()}
                        </td>

                        <td className="px-3.5 py-2.5 text-center">
                          {s.rendimientoCalculado ? (
                            <div>
                              <span className="font-bold text-white">{s.rendimientoCalculado}</span>{' '}
                              <span className="text-[10px] text-slate-400">{s.metricaRendimiento}</span>
                              <div>
                                {s.nivelDesvio === 'NORMAL' && (
                                  <span className="inline-block px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                                    NORMAL
                                  </span>
                                )}
                                {s.nivelDesvio === 'ADVERTENCIA' && (
                                  <span className="inline-block px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-950 text-amber-300 border border-amber-800">
                                    DESVÍO +
                                  </span>
                                )}
                                {s.nivelDesvio === 'CRITICO' && (
                                  <span className="inline-block px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-950 text-rose-300 border border-rose-800">
                                    CRÍTICO
                                  </span>
                                )}
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-500 italic text-[10px]">Primer carga</span>
                          )}
                        </td>

                        <td className="px-3.5 py-2.5 text-center">
                          {s.estado === 'CONFIRMADO' ? (
                            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold text-[10px]">
                              CONFIRMADO
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/30 font-bold text-[10px]">
                              ANULADO
                            </span>
                          )}
                        </td>

                        <td className="px-3.5 py-2.5 text-right">
                          {s.estado === 'CONFIRMADO' && (
                            <button
                              onClick={() => {
                                setSelectedSupplyToCancel(s);
                                setShowCancelModal(true);
                              }}
                              title="Anular abastecimiento formalmente"
                              className="text-slate-400 hover:text-rose-400 p-1 transition"
                            >
                              <Ban className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: TANQUES & KARDEX */}
      {activeTab === 'tanks' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tarjetas de Tanques */}
          <div className="lg:col-span-1 space-y-4">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tanques de Almacenamiento</h2>
            {tanks.map(t => {
              const pct = Math.round((t.stockActualLitros / t.capacidadLitros) * 100);
              const isLow = t.stockActualLitros <= t.stockMinimoLitros;
              const isSelected = selectedTanqueId === t.id;

              return (
                <div
                  key={t.id}
                  onClick={() => setSelectedTanqueId(t.id)}
                  className={`p-4 rounded-lg border cursor-pointer transition ${
                    isSelected
                      ? 'bg-slate-800/80 border-amber-500/60 shadow-md'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-white">{t.codigo}</span>
                      <p className="text-[11px] text-slate-400 font-medium">{t.nombre}</p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        isLow
                          ? 'bg-rose-950 text-rose-300 border border-rose-800'
                          : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      }`}
                    >
                      {isLow ? 'BAJO MÍNIMO' : 'NORMAL'}
                    </span>
                  </div>

                  {/* Barra de Nivel de Combustible */}
                  <div className="mt-3">
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-slate-400">Nivel de Stock</span>
                      <span className="font-bold text-white">
                        {t.stockActualLitros.toLocaleString()} / {t.capacidadLitros.toLocaleString()} L ({pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isLow ? 'bg-rose-500' : pct > 70 ? 'bg-cyan-500' : 'bg-amber-500'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-3 flex justify-between text-[10px] text-slate-500 border-t border-slate-800/60 pt-2">
                    <span>Mínimo Operativo: {t.stockMinimoLitros.toLocaleString()} L</span>
                    <span>Planta: {t.plantaId}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Historial de Movimientos de Tanque (Kardex) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Kardex de Movimientos Físicos (Ingresos & Egresos)
              </h2>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800 uppercase text-[10px] tracking-wider font-semibold">
                  <tr>
                    <th className="px-3 py-2.5">Fecha</th>
                    <th className="px-3 py-2.5">Tanque</th>
                    <th className="px-3 py-2.5">Tipo</th>
                    <th className="px-3 py-2.5 text-right">Litros</th>
                    <th className="px-3 py-2.5 text-right">Saldo Posterior</th>
                    <th className="px-3 py-2.5">Detalle / Motivo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {movements.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                        No hay movimientos registrados para este tanque.
                      </td>
                    </tr>
                  ) : (
                    movements.map(m => {
                      const tq = tanks.find(t => t.id === m.tanqueId);
                      const isIngreso = m.tipoMovimiento === 'INGRESO' || m.tipoMovimiento === 'AJUSTE_POSITIVO';

                      return (
                        <tr key={m.id} className="hover:bg-slate-800/30">
                          <td className="px-3 py-2 text-[11px] text-slate-400">
                            {new Date(m.fechaHora).toLocaleDateString()} {new Date(m.fechaHora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="px-3 py-2 font-semibold text-slate-300">{tq?.codigo}</td>
                          <td className="px-3 py-2">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                isIngreso
                                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                  : 'bg-amber-950 text-amber-300 border border-amber-800'
                              }`}
                            >
                              {m.tipoMovimiento}
                            </span>
                          </td>
                          <td className={`px-3 py-2 text-right font-bold ${isIngreso ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {isIngreso ? '+' : '-'}{m.litros.toLocaleString()} L
                          </td>
                          <td className="px-3 py-2 text-right font-mono text-slate-200">
                            {m.stockPosteriorLitros.toLocaleString()} L
                          </td>
                          <td className="px-3 py-2 text-[11px] text-slate-400 truncate max-w-[200px]">
                            {m.observaciones}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: RENDIMIENTO & PARÁMETROS */}
      {activeTab === 'performance' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg">
            <h2 className="text-xs font-bold text-white uppercase tracking-wider mb-2">
              Parámetros de Rendimiento Objetivo y Tolerancia
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              Objetivos de consumo teórico configurados por tipo de equipo para detección automática de desvíos en despachos.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {parameters.map(p => (
                <div key={p.id} className="bg-slate-950 border border-slate-800 p-3 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-400">{p.tipoEquipo || 'GENERAL'}</span>
                    <span className="text-[10px] text-slate-500 font-mono">{p.vigenciaDesde}</span>
                  </div>
                  <div className="mt-2 flex items-baseline justify-between">
                    <span className="text-xl font-bold text-white">{p.valorObjetivo}</span>
                    <span className="text-xs text-slate-400 font-bold">{p.metrica}</span>
                  </div>
                  <div className="mt-2 text-[10px] text-slate-400 border-t border-slate-800/60 pt-2 space-y-1">
                    <div>Advertencia: +{p.toleranciaAdvertenciaPct}%</div>
                    <div>Crítico: +{p.toleranciaCriticaPct}%</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: ALERTAS */}
      {activeTab === 'alerts' && (
        <div className="space-y-4">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Alertas Operativas de Consumo & Tanques
          </h2>

          <div className="space-y-3">
            {alerts.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 p-8 text-center text-slate-500 rounded-lg">
                No hay alertas activas en este momento.
              </div>
            ) : (
              alerts.map(a => (
                <div
                  key={a.id}
                  className={`p-4 rounded-lg border flex items-center justify-between ${
                    a.resuelta
                      ? 'bg-slate-900/40 border-slate-800 opacity-60'
                      : a.tipo === 'CONSUMO_CRITICO' || a.severidad === 'ADVERTENCIA'
                      ? 'bg-rose-950/20 border-rose-800/60'
                      : 'bg-amber-950/20 border-amber-800/60'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <ShieldAlert
                      className={`w-5 h-5 mt-0.5 ${
                        a.resuelta ? 'text-slate-500' : a.tipo === 'CONSUMO_CRITICO' ? 'text-rose-400' : 'text-amber-400'
                      }`}
                    />
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-xs text-white">{a.titulo}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-mono">
                          {a.tipo}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-0.5">{a.descripcion}</p>
                      <span className="text-[10px] text-slate-500 mt-1 block">
                        {new Date(a.fecha).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {!a.resuelta && (
                    <button
                      onClick={() => handleResolveAlert(a.id)}
                      className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded text-xs font-medium transition"
                    >
                      Marcar Resuelta
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* MODAL REGISTRO DE ABASTECIMIENTO */}
      {showSupplyModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-xl w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base flex items-center space-x-2">
                <Fuel className="w-5 h-5 text-amber-400" />
                <span>Registrar Carga de Combustible</span>
              </h3>
              <button onClick={() => setShowSupplyModal(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded text-xs text-rose-300">
                {formError}
              </div>
            )}

            <form onSubmit={handleRegisterSupply} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Equipo / Camión *</label>
                  <select
                    required
                    value={formEquipoId}
                    onChange={e => {
                      setFormEquipoId(e.target.value);
                      const eq = equipments.find(x => x.id === e.target.value);
                      if (eq) {
                        setFormOdometro(eq.odometroKmActual);
                        setFormHorometro(eq.horometroHsActual);
                      }
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-amber-500"
                  >
                    <option value="">Seleccionar Equipo...</option>
                    {equipments.map(e => (
                      <option key={e.id} value={e.id}>
                        {e.codigoInterno} - {e.dominioPatente || e.subtipo} ({e.tipoEquipo})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Chofer / Responsable</label>
                  <select
                    value={formEmpleadoId}
                    onChange={e => setFormEmpleadoId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-amber-500"
                  >
                    <option value="">Seleccionar Personal...</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.apellido}, {emp.nombre} (Leg. {emp.legajo})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Origen del Abastecimiento *</label>
                  <select
                    value={formOrigen}
                    onChange={e => setFormOrigen(e.target.value as OrigenAbastecimiento)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-amber-500"
                  >
                    <option value="TANQUE_INTERNO">Tanque Interno Propio</option>
                    <option value="ESTACION_SERVICIO">Estación de Servicio Externa</option>
                  </select>
                </div>

                {formOrigen === 'TANQUE_INTERNO' ? (
                  <div>
                    <label className="block text-slate-400 mb-1">Tanque de Despacho *</label>
                    <select
                      value={formTanqueId}
                      onChange={e => setFormTanqueId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-amber-500"
                    >
                      {tanks.map(t => (
                        <option key={t.id} value={t.id}>
                          {t.codigo} (Stock: {t.stockActualLitros} L)
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-slate-400 mb-1">Nombre Estación de Servicio</label>
                    <input
                      type="text"
                      placeholder="ej: YPF Acceso Norte"
                      value={formEstacionNombre}
                      onChange={e => setFormEstacionNombre(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Litros Cargados *</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    required
                    value={formLitros || ''}
                    onChange={e => setFormLitros(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-amber-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Odómetro Actual (Km)</label>
                  <input
                    type="number"
                    value={formOdometro ?? ''}
                    onChange={e => setFormOdometro(e.target.value ? parseInt(e.target.value) : undefined)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Horómetro Actual (Hs)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formHorometro ?? ''}
                    onChange={e => setFormHorometro(e.target.value ? parseFloat(e.target.value) : undefined)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none font-mono text-cyan-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Nro de Vale / Comprobante</label>
                  <input
                    type="text"
                    placeholder="ej: VAL-001045"
                    value={formVale}
                    onChange={e => setFormVale(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Precio Unitario ($/L)</label>
                  <input
                    type="number"
                    step="1"
                    value={formPrecioUnitario}
                    onChange={e => setFormPrecioUnitario(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowSupplyModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded font-bold"
                >
                  Confirmar Carga
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL INGRESO DE CISTERNA */}
      {showIncomeModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base flex items-center space-x-2">
                <Droplets className="w-5 h-5 text-cyan-400" />
                <span>Recepción de Cisterna de Combustible</span>
              </h3>
              <button onClick={() => setShowIncomeModal(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            {incomeError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded text-xs text-rose-300">
                {incomeError}
              </div>
            )}

            <form onSubmit={handleRegisterIncome} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Tanque de Destino *</label>
                <select
                  value={incomeTanqueId}
                  onChange={e => setIncomeTanqueId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none"
                >
                  {tanks.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.codigo} - {t.nombre} (Stock actual: {t.stockActualLitros} L / Capacidad: {t.capacidadLitros} L)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Litros Recibidos *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={incomeLitros || ''}
                    onChange={e => setIncomeLitros(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Precio Unitario ($/L) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={incomePrecio}
                    onChange={e => setIncomePrecio(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Proveedor</label>
                  <input
                    type="text"
                    required
                    value={incomeProveedor}
                    onChange={e => setIncomeProveedor(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Nro de Remito</label>
                  <input
                    type="text"
                    placeholder="ej: R-0004-12345"
                    value={incomeRemito}
                    onChange={e => setIncomeRemito(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowIncomeModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded font-bold"
                >
                  Registrar Ingreso
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ANULACIÓN */}
      {showCancelModal && selectedSupplyToCancel && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-rose-400 text-base flex items-center space-x-2">
                <Ban className="w-5 h-5" />
                <span>Anular Abastecimiento</span>
              </h3>
              <button onClick={() => setShowCancelModal(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300">
              ¿Está seguro de anular el vale <strong className="text-white">{selectedSupplyToCancel.numeroVale || selectedSupplyToCancel.id}</strong> ({selectedSupplyToCancel.litros} L)?
              {selectedSupplyToCancel.origenAbastecimiento === 'TANQUE_INTERNO' && (
                <span className="block mt-2 text-cyan-300 bg-cyan-950/40 p-2 rounded border border-cyan-800/40">
                  ℹ️ Esta acción generará automáticamente un movimiento inverso y reintegrará los {selectedSupplyToCancel.litros} L al tanque de origen.
                </span>
              )}
            </p>

            <div>
              <label className="block text-slate-400 text-xs mb-1">Motivo de Anulación *</label>
              <textarea
                required
                rows={2}
                placeholder="Indique el motivo formal para el registro de auditoría..."
                value={cancelMotivo}
                onChange={e => setCancelMotivo(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200 text-xs focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-medium text-xs"
              >
                Volver
              </button>
              <button
                type="button"
                onClick={handleCancelSupply}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded font-bold text-xs"
              >
                Confirmar Anulación
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
