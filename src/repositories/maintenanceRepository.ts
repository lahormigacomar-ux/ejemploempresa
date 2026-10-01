import {
  OrdenTrabajo,
  TareaOrdenTrabajo,
  ManoObraOT,
  ConsumoRepuestoOT,
  ServicioExternoOT,
  PlanMantenimiento,
  EquipoPlanMantenimiento,
  EstadoOT,
  TipoMantenimiento,
  CategoriaFalla,
  PrioridadOT,
  CausaRaiz
} from '../types';
import { auditRepository } from './auditRepository';

class MaintenanceRepository {
  private workOrders: Map<string, OrdenTrabajo> = new Map();
  private plans: Map<string, PlanMantenimiento> = new Map();
  private equipmentPlans: Map<string, EquipoPlanMantenimiento[]> = new Map();
  private otSequence: number = 100;

  constructor() {
    this.seedInitialData();
  }

  resetForTesting() {
    this.workOrders.clear();
    this.plans.clear();
    this.equipmentPlans.clear();
    this.otSequence = 100;
    this.seedInitialData();
  }

  private seedInitialData() {
    // 1. Planes Preventivos Base
    const plan1: PlanMantenimiento = {
      id: 'plan-mixer-10k',
      empresaId: 'emp-1',
      codigo: 'PLAN-MIX-10K',
      nombre: 'Service Preventivo 10.000 Km / 500 Hs Mixer',
      tipoEquipoAplicable: 'MIXER',
      frecuenciaKm: 10000,
      frecuenciaHoras: 500,
      frecuenciaMeses: 6,
      umbralAlertaKm: 500,
      umbralAlertaHoras: 25,
      umbralAlertaDias: 15,
      descripcion: 'Cambio de aceite 15W40, filtro de aceite, gasoil, aire, engrase de trompo y rodillos de apoyo.',
      activo: true
    };

    const plan2: PlanMantenimiento = {
      id: 'plan-cargadora-250h',
      empresaId: 'emp-1',
      codigo: 'PLAN-CARG-250H',
      nombre: 'Mantenimiento Preventivo 250 Hs Pala Cargadora Cantera',
      tipoEquipoAplicable: 'CARGADORA',
      frecuenciaHoras: 250,
      umbralAlertaKm: 0,
      umbralAlertaHoras: 20,
      umbralAlertaDias: 10,
      descripcion: 'Engrase de pernos de balde, cambio de aceite hidráulico y revisión de articulación central.',
      activo: true
    };

    this.plans.set(plan1.id, plan1);
    this.plans.set(plan2.id, plan2);

    // Asignación de plan a mixer MIX-12 y CAR-01
    this.equipmentPlans.set('eq-mix-12', [
      {
        id: 'ep-1',
        equipoId: 'eq-mix-12',
        planId: plan1.id,
        plan: plan1,
        ultimoServiceKm: 60000,
        ultimoServiceHoras: 3000,
        ultimoServiceFecha: '2026-06-15',
        proximoServiceKm: 70000,
        proximoServiceHoras: 3500,
        proximoServiceFecha: '2026-12-15',
        estadoAlerta: 'OK',
        activo: true
      }
    ]);

    this.equipmentPlans.set('eq-car-01', [
      {
        id: 'ep-2',
        equipoId: 'eq-car-01',
        planId: plan2.id,
        plan: plan2,
        ultimoServiceKm: 0,
        ultimoServiceHoras: 5400,
        ultimoServiceFecha: '2026-08-10',
        proximoServiceKm: 0,
        proximoServiceHoras: 5650, // Horómetro actual es 5600 -> a 50 hs
        proximoServiceFecha: '2026-11-10',
        estadoAlerta: 'OK',
        activo: true
      }
    ]);

    // 2. OT Inicial Demo (Cerrada)
    const ot1: OrdenTrabajo = {
      id: 'ot-101',
      empresaId: 'emp-1',
      numeroOT: 'OT-000101',
      equipoId: 'eq-mix-12',
      tipoMantenimiento: 'PREVENTIVO',
      categoriaFalla: 'MOTOR',
      prioridad: 'NORMAL',
      estado: 'CERRADA',
      fechaSolicitud: '2026-09-28T08:00:00Z',
      fechaApertura: '2026-09-28T08:30:00Z',
      fechaProgramada: '2026-09-28',
      fechaInicioReal: '2026-09-28T09:00:00Z',
      fechaFinReal: '2026-09-29T16:00:00Z',
      fechaCierre: '2026-09-29T17:00:00Z',
      horasParadaEquipo: 31.5,
      odometroAperturaKm: 68000,
      horometroAperturaHs: 3380,
      odometroCierreKm: 68010,
      horometroCierreHs: 3385,
      fallaReportada: 'Service preventivo programado de 60.000 km y revisión de reductor de tambor',
      diagnostico: 'Desgaste normal de filtros. Rodillos de apoyo en buen estado. Juego en cruceta de transmisión dentro de tolerancia.',
      trabajoRealizado: 'Se reemplazó aceite de motor 15W40, filtro de aceite, filtros de combustible primario y secundario. Engrase integral.',
      causaRaiz: 'DESGASTE_NORMAL',
      responsableTallerId: 'emp-5',
      centroCostoId: 'cc-taller',
      bloqueaEquipo: true,
      costoRepuestos: 195000,
      costoManoObra: 150000,
      costoServiciosTerceros: 0,
      otrosCostos: 0,
      costoTotal: 345000,
      tareas: [
        {
          id: 'tar-1',
          ordenTrabajoId: 'ot-101',
          descripcion: 'Drenaje de cárter y cambio de aceite de motor y filtros',
          mecanicoAsignadoId: 'emp-5',
          horasEstimadas: 3,
          horasReales: 3.5,
          estado: 'COMPLETADA',
          orden: 1
        },
        {
          id: 'tar-2',
          ordenTrabajoId: 'ot-101',
          descripcion: 'Engrase de pista de rodadura de trompo y crucetas',
          mecanicoAsignadoId: 'emp-5',
          horasEstimadas: 2,
          horasReales: 2,
          estado: 'COMPLETADA',
          orden: 2
        }
      ],
      personal: [
        {
          id: 'mo-1',
          ordenTrabajoId: 'ot-101',
          empleadoId: 'emp-5',
          mecanicoNombreSnapshot: 'Sánchez, Roberto',
          fecha: '2026-09-28',
          horasTrabajadas: 5.5,
          tipoTrabajo: 'Mecánica Pesada',
          costoHorarioSnapshot: 27272.72,
          costoTotalLaboral: 150000
        }
      ],
      repuestos: [
        {
          id: 'rep-1',
          ordenTrabajoId: 'ot-101',
          articuloId: 'art-aceite-15w40',
          codigoArticuloSnapshot: 'INS-ACE-01',
          descripcionSnapshot: 'Aceite de Motor 15W40 Mineral Pesado (Balde 20L)',
          cantidad: 2,
          unidadMedida: 'balde',
          costoUnitarioSnapshot: 65000,
          costoTotal: 130000,
          estadoSolicitud: 'CONSUMIDO',
          fecha: '2026-09-28T09:30:00Z'
        },
        {
          id: 'rep-2',
          ordenTrabajoId: 'ot-101',
          articuloId: 'art-fil-ace',
          codigoArticuloSnapshot: 'REP-FIL-01',
          descripcionSnapshot: 'Kit de Filtros de Aceite y Combustible Iveco Tector',
          cantidad: 1,
          unidadMedida: 'kit',
          costoUnitarioSnapshot: 65000,
          costoTotal: 65000,
          estadoSolicitud: 'CONSUMIDO',
          fecha: '2026-09-28T09:30:00Z'
        }
      ],
      serviciosExternos: [],
      createdAt: '2026-09-28T08:30:00Z',
      updatedAt: '2026-09-29T17:00:00Z'
    };

    // 3. OT en Taller para MIX-99 (En Proceso)
    const ot2: OrdenTrabajo = {
      id: 'ot-102',
      empresaId: 'emp-1',
      numeroOT: 'OT-000102',
      equipoId: 'eq-mix-99',
      tipoMantenimiento: 'CORRECTIVO',
      categoriaFalla: 'TRANSMISION',
      prioridad: 'URGENTE',
      estado: 'EN_PROCESO',
      fechaSolicitud: '2026-09-29T14:00:00Z',
      fechaApertura: '2026-09-29T14:30:00Z',
      fechaInicioReal: '2026-09-30T08:00:00Z',
      horasParadaEquipo: 18.0,
      odometroAperturaKm: 114200,
      horometroAperturaHs: 6200,
      fallaReportada: 'Ruido metálico en caja reductora del trompo durante la descarga de hormigón',
      diagnostico: 'Engranaje satélite de reductor ZF fisurado por fatiga de material.',
      trabajoRealizado: 'Desarme completo de reductor planetario y limpieza de viruta.',
      causaRaiz: 'FALLA_COMPONENTE',
      responsableTallerId: 'emp-5',
      centroCostoId: 'cc-taller',
      bloqueaEquipo: true,
      costoRepuestos: 320000,
      costoManoObra: 80000,
      costoServiciosTerceros: 150000,
      otrosCostos: 0,
      costoTotal: 550000,
      tareas: [
        {
          id: 'tar-3',
          ordenTrabajoId: 'ot-102',
          descripcion: 'Desmontaje de reductor y evaluación de rodamientos',
          mecanicoAsignadoId: 'emp-5',
          horasEstimadas: 6,
          horasReales: 4,
          estado: 'EN_PROCESO',
          orden: 1
        }
      ],
      personal: [
        {
          id: 'mo-2',
          ordenTrabajoId: 'ot-102',
          empleadoId: 'emp-5',
          mecanicoNombreSnapshot: 'Sánchez, Roberto',
          fecha: '2026-09-30',
          horasTrabajadas: 4,
          tipoTrabajo: 'Mecánica de Reductores',
          costoHorarioSnapshot: 20000,
          costoTotalLaboral: 80000
        }
      ],
      repuestos: [
        {
          id: 'rep-3',
          ordenTrabajoId: 'ot-102',
          articuloId: 'art-rep-zf',
          codigoArticuloSnapshot: 'REP-RED-01',
          descripcionSnapshot: 'Corona y Piñón Satélite Reductor ZF P3301',
          cantidad: 1,
          unidadMedida: 'juego',
          costoUnitarioSnapshot: 320000,
          costoTotal: 320000,
          estadoSolicitud: 'CONSUMIDO',
          fecha: '2026-09-30T11:00:00Z'
        }
      ],
      serviciosExternos: [
        {
          id: 'se-1',
          ordenTrabajoId: 'ot-102',
          proveedorNombreSnapshot: 'Mecanizados Industriales Quilmes S.A.',
          descripcionServicio: 'Rectificado y bruñido de brida de acople de trompo',
          numeroComprobante: 'FAC-B-0004-9812',
          fecha: '2026-09-30',
          importe: 150000
        }
      ],
      createdAt: '2026-09-29T14:30:00Z',
      updatedAt: '2026-09-30T12:00:00Z'
    };

    this.workOrders.set(ot1.id, ot1);
    this.workOrders.set(ot2.id, ot2);
  }

  generateNextOtNumber(empresaId: string = 'emp-1'): string {
    this.otSequence += 1;
    const pad = this.otSequence.toString().padStart(6, '0');
    return `OT-${pad}`;
  }

  async getAllWorkOrders(): Promise<OrdenTrabajo[]> {
    return Array.from(this.workOrders.values());
  }

  async getWorkOrderById(id: string): Promise<OrdenTrabajo | null> {
    return this.workOrders.get(id) || null;
  }

  async getWorkOrdersByEquipment(equipoId: string): Promise<OrdenTrabajo[]> {
    const list = Array.from(this.workOrders.values());
    return list.filter(ot => ot.equipoId === equipoId);
  }

  async saveWorkOrder(ot: OrdenTrabajo): Promise<OrdenTrabajo> {
    // Recalcular costo total de manera consistente
    ot.costoRepuestos = ot.repuestos.reduce((acc, r) => acc + r.costoTotal, 0);
    ot.costoManoObra = ot.personal.reduce((acc, p) => acc + p.costoTotalLaboral, 0);
    ot.costoServiciosTerceros = ot.serviciosExternos.reduce((acc, s) => acc + s.importe, 0);
    ot.costoTotal = ot.costoRepuestos + ot.costoManoObra + ot.costoServiciosTerceros + (ot.otrosCostos || 0);
    ot.updatedAt = new Date().toISOString();

    this.workOrders.set(ot.id, ot);
    return ot;
  }

  // Planes Preventivos
  async getAllPlans(): Promise<PlanMantenimiento[]> {
    return Array.from(this.plans.values());
  }

  async getPlansByEquipment(equipoId: string): Promise<EquipoPlanMantenimiento[]> {
    return this.equipmentPlans.get(equipoId) || [];
  }

  async assignPlanToEquipment(equipoPlan: EquipoPlanMantenimiento): Promise<EquipoPlanMantenimiento> {
    const list = this.equipmentPlans.get(equipoPlan.equipoId) || [];
    list.push(equipoPlan);
    this.equipmentPlans.set(equipoPlan.equipoId, list);
    return equipoPlan;
  }

  async updateEquipmentPlanStatus(equipoId: string, planId: string, currentKm: number, currentHs: number): Promise<EquipoPlanMantenimiento | null> {
    const list = this.equipmentPlans.get(equipoId) || [];
    const item = list.find(p => p.planId === planId);
    if (!item || !item.plan) return null;

    const plan = item.plan;
    let alerta: 'OK' | 'PROXIMO' | 'VENCIDO' = 'OK';

    if (plan.frecuenciaHoras && item.proximoServiceHoras) {
      const diffHs = item.proximoServiceHoras - currentHs;
      if (diffHs <= 0) {
        alerta = 'VENCIDO';
      } else if (diffHs <= plan.umbralAlertaHoras) {
        alerta = 'PROXIMO';
      }
    }

    if (plan.frecuenciaKm && item.proximoServiceKm && alerta !== 'VENCIDO') {
      const diffKm = item.proximoServiceKm - currentKm;
      if (diffKm <= 0) {
        alerta = 'VENCIDO';
      } else if (diffKm <= plan.umbralAlertaKm) {
        alerta = 'PROXIMO';
      }
    }

    item.estadoAlerta = alerta;
    return item;
  }
}

export const maintenanceRepository = new MaintenanceRepository();
