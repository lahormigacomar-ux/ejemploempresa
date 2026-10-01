import {
  OrdenTrabajo,
  TareaOrdenTrabajo,
  ManoObraOT,
  ConsumoRepuestoOT,
  ServicioExternoOT,
  TipoMantenimiento,
  CategoriaFalla,
  PrioridadOT,
  EstadoOT,
  CausaRaiz
} from '../types';
import { maintenanceRepository } from '../repositories/maintenanceRepository';
import { equipmentRepository } from '../repositories/equipmentRepository';
import { employeeRepository } from '../repositories/employeeRepository';
import { auditRepository } from '../repositories/auditRepository';
import { fleetEventHandler } from './fleetEventHandler';
import { fleetService } from './fleetService';
import { hrEventHandler } from './hrEventHandler';
import { hrDomainService } from './hrDomainService';

export class MaintenanceService {
  async createWorkOrder(params: {
    empresaId?: string;
    equipoId: string;
    tipoMantenimiento: TipoMantenimiento;
    categoriaFalla: CategoriaFalla;
    prioridad: PrioridadOT;
    fallaReportada: string;
    solicitanteId?: string;
    responsableTallerId?: string;
    centroCostoId?: string;
    bloqueaEquipo?: boolean;
    odometroAperturaKm?: number;
    horometroAperturaHs?: number;
  }): Promise<OrdenTrabajo> {
    const equipo = await equipmentRepository.getById(params.equipoId);
    if (!equipo) {
      throw new Error(`Equipo con ID ${params.equipoId} no encontrado`);
    }

    const numeroOT = maintenanceRepository.generateNextOtNumber(params.empresaId || 'emp-1');
    const now = new Date().toISOString();

    const ot: OrdenTrabajo = {
      id: `ot-${Date.now()}`,
      empresaId: params.empresaId || 'emp-1',
      numeroOT,
      equipoId: params.equipoId,
      tipoMantenimiento: params.tipoMantenimiento,
      categoriaFalla: params.categoriaFalla,
      prioridad: params.prioridad,
      estado: 'ABIERTA',
      fechaSolicitud: now,
      fechaApertura: now,
      horasParadaEquipo: 0,
      odometroAperturaKm: params.odometroAperturaKm ?? equipo.odometroKmActual,
      horometroAperturaHs: params.horometroAperturaHs ?? equipo.horometroHsActual,
      fallaReportada: params.fallaReportada,
      solicitanteId: params.solicitanteId,
      responsableTallerId: params.responsableTallerId,
      centroCostoId: params.centroCostoId || 'cc-taller',
      bloqueaEquipo: params.bloqueaEquipo ?? true,
      costoRepuestos: 0,
      costoManoObra: 0,
      costoServiciosTerceros: 0,
      otrosCostos: 0,
      costoTotal: 0,
      tareas: [],
      personal: [],
      repuestos: [],
      serviciosExternos: [],
      createdAt: now,
      updatedAt: now
    };

    await maintenanceRepository.saveWorkOrder(ot);

    await auditRepository.recordAction(
      'mant_ordenes_trabajo',
      ot.id,
      'CREACION_OT',
      null,
      { numeroOT: ot.numeroOT, equipoId: ot.equipoId, tipo: ot.tipoMantenimiento },
      `Apertura de OT ${ot.numeroOT}`
    );

    return ot;
  }

  async startWorkOrder(otId: string, odometro?: number, horometro?: number, fechaInicioReal?: string): Promise<OrdenTrabajo> {
    const ot = await maintenanceRepository.getWorkOrderById(otId);
    if (!ot) throw new Error(`OT ${otId} no encontrada`);
    if (ot.estado === 'CERRADA' || ot.estado === 'CANCELADA') {
      throw new Error(`No se puede iniciar una OT en estado ${ot.estado}`);
    }

    const estadoAnterior = ot.estado;
    ot.estado = 'EN_PROCESO';
    ot.fechaInicioReal = fechaInicioReal || new Date().toISOString();
    if (odometro !== undefined) ot.odometroAperturaKm = odometro;
    if (horometro !== undefined) ot.horometroAperturaHs = horometro;

    // Si bloquea el equipo, registrar inicio del downtime y cambiar estado del activo a EN_TALLER
    if (ot.bloqueaEquipo) {
      ot.fechaHoraInicioBloqueo = ot.fechaInicioReal;
      const eventId = `EVT-START-${ot.id}-${Date.now()}`;
      await fleetEventHandler.onEquipoEntraTaller(eventId, ot.equipoId, ot.id, ot.fallaReportada);
    } else {
      ot.fechaHoraInicioBloqueo = undefined;
      ot.fechaHoraFinBloqueo = undefined;
      ot.horasParadaEquipo = 0;
    }

    await maintenanceRepository.saveWorkOrder(ot);

    await auditRepository.recordAction(
      'mant_ordenes_trabajo',
      ot.id,
      'INICIO_TRABAJO_OT',
      { estado: estadoAnterior },
      { estado: 'EN_PROCESO', fechaInicioReal: ot.fechaInicioReal },
      `Inicio de trabajos en OT ${ot.numeroOT}`
    );

    return ot;
  }

  async addTask(otId: string, descripcion: string, horasEstimadas: number = 1.0, mecanicoId?: string): Promise<TareaOrdenTrabajo> {
    const ot = await maintenanceRepository.getWorkOrderById(otId);
    if (!ot) throw new Error(`OT ${otId} no encontrada`);
    if (ot.estado === 'CERRADA') throw new Error('No se pueden agregar tareas a una OT cerrada.');

    const tarea: TareaOrdenTrabajo = {
      id: `tar-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      ordenTrabajoId: otId,
      descripcion,
      horasEstimadas,
      horasReales: 0,
      estado: 'PENDIENTE',
      mecanicoAsignadoId: mecanicoId,
      orden: ot.tareas.length + 1
    };

    ot.tareas.push(tarea);
    await maintenanceRepository.saveWorkOrder(ot);
    return tarea;
  }

  async addLabor(
    otId: string,
    empleadoId: string,
    horas: number,
    tipoTrabajo: string = 'Mecánica General',
    tareaId?: string,
    fecha: string = new Date().toISOString().split('T')[0]
  ): Promise<ManoObraOT> {
    const ot = await maintenanceRepository.getWorkOrderById(otId);
    if (!ot) throw new Error(`OT ${otId} no encontrada`);
    if (ot.estado === 'CERRADA') throw new Error('No se puede imputar mano de obra a una OT cerrada.');

    const empleado = await employeeRepository.getById(empleadoId);
    if (!empleado) throw new Error(`Empleado con ID ${empleadoId} no existe`);
    if (empleado.estado !== 'ACTIVO') {
      throw new Error(`El empleado ${empleado.apellido}, ${empleado.nombre} se encuentra inactivo (${empleado.estado})`);
    }

    // Validar rol de taller en RRHH
    const isMechanic = empleado.roles.includes('mecanico') || empleado.roles.includes('ayudante_mecanico');
    if (!isMechanic) {
      throw new Error(`El empleado ${empleado.apellido}, ${empleado.nombre} no posee el rol de mecánico/taller`);
    }

    // Costo horario obtenido directamente del motor salarial de RRHH (sin constantes hardcodeadas)
    const costoHorarioSnapshot = await hrDomainService.getEmployeeHourlyCost(empleadoId, fecha);
    const costoTotalLaboral = Math.round(costoHorarioSnapshot * horas);

    const manoObra: ManoObraOT = {
      id: `mo-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      ordenTrabajoId: otId,
      empleadoId,
      mecanicoNombreSnapshot: `${empleado.apellido}, ${empleado.nombre}`,
      tareaId,
      fecha,
      horasTrabajadas: horas,
      tipoTrabajo,
      costoHorarioSnapshot,
      costoTotalLaboral
    };

    ot.personal.push(manoObra);
    await maintenanceRepository.saveWorkOrder(ot);

    // Generar imputación laboral en el repositorio central de costos (RRHH / Costos) con clave de idempotencia
    const eventId = `EVT-LABOR-OT-${otId}-${manoObra.id}`;
    await hrEventHandler.handleLaborCostEvent({
      eventId,
      fecha,
      empleadoId,
      centroCostoId: ot.centroCostoId || 'cc-taller',
      horas,
      origenModulo: 'TALLER_OT',
      origenId: otId,
      equipoId: ot.equipoId
    });

    return manoObra;
  }

  async addPart(
    otId: string,
    articuloId: string,
    cantidad: number,
    descripcion: string,
    costoUnitario: number,
    depositoId?: string,
    codigoArticulo?: string
  ): Promise<ConsumoRepuestoOT> {
    const ot = await maintenanceRepository.getWorkOrderById(otId);
    if (!ot) throw new Error(`OT ${otId} no encontrada`);
    if (ot.estado === 'CERRADA') throw new Error('No se pueden cargar repuestos a una OT cerrada.');

    const repuesto: ConsumoRepuestoOT = {
      id: `rep-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      ordenTrabajoId: otId,
      articuloId,
      codigoArticuloSnapshot: codigoArticulo || articuloId,
      descripcionSnapshot: descripcion,
      cantidad,
      unidadMedida: 'UNIDAD',
      costoUnitarioSnapshot: costoUnitario,
      costoTotal: costoUnitario * cantidad,
      depositoId,
      estadoSolicitud: 'CONSUMIDO',
      fecha: new Date().toISOString()
    };

    ot.repuestos.push(repuesto);
    await maintenanceRepository.saveWorkOrder(ot);

    await auditRepository.recordAction(
      'mant_ot_repuestos',
      repuesto.id,
      'CONSUMO_REPUESTO_OT',
      null,
      { otId, articuloId, cantidad, costoTotal: repuesto.costoTotal },
      `Consumo de ${cantidad} u. de ${descripcion}`
    );

    return repuesto;
  }

  async addExternalService(
    otId: string,
    proveedorNombre: string,
    descripcion: string,
    importe: number,
    numeroComprobante?: string,
    fecha: string = new Date().toISOString().split('T')[0]
  ): Promise<ServicioExternoOT> {
    const ot = await maintenanceRepository.getWorkOrderById(otId);
    if (!ot) throw new Error(`OT ${otId} no encontrada`);
    if (ot.estado === 'CERRADA') throw new Error('No se pueden cargar servicios externos a una OT cerrada.');

    const serv: ServicioExternoOT = {
      id: `se-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      ordenTrabajoId: otId,
      proveedorNombreSnapshot: proveedorNombre,
      descripcionServicio: descripcion,
      numeroComprobante,
      fecha,
      importe
    };

    ot.serviciosExternos.push(serv);
    await maintenanceRepository.saveWorkOrder(ot);
    return serv;
  }

  async changeStatus(otId: string, nuevoEstado: EstadoOT, motivo: string): Promise<OrdenTrabajo> {
    const ot = await maintenanceRepository.getWorkOrderById(otId);
    if (!ot) throw new Error(`OT ${otId} no encontrada`);
    if (ot.estado === 'CERRADA') throw new Error('Una OT cerrada no puede modificarse libremente.');

    const estadoAnterior = ot.estado;
    ot.estado = nuevoEstado;
    await maintenanceRepository.saveWorkOrder(ot);

    await auditRepository.recordAction(
      'mant_ordenes_trabajo',
      ot.id,
      'CAMBIO_ESTADO_OT',
      { estado: estadoAnterior },
      { estado: nuevoEstado },
      motivo
    );

    return ot;
  }

  async closeWorkOrder(
    otId: string,
    params: {
      diagnostico: string;
      trabajoRealizado: string;
      causaRaiz?: CausaRaiz;
      odometroCierreKm?: number;
      horometroCierreHs?: number;
      fechaCierre?: string;
      usuario?: string;
    }
  ): Promise<OrdenTrabajo> {
    const ot = await maintenanceRepository.getWorkOrderById(otId);
    if (!ot) throw new Error(`OT ${otId} no encontrada`);
    if (ot.estado === 'CERRADA') throw new Error('La OT ya se encuentra cerrada.');

    if (!params.diagnostico || params.diagnostico.trim() === '') {
      throw new Error('El diagnóstico técnico es obligatorio para cerrar la OT.');
    }

    if (!params.trabajoRealizado || params.trabajoRealizado.trim() === '') {
      throw new Error('El trabajo realizado es obligatorio para cerrar la OT.');
    }

    // Validar tareas: Ninguna tarea puede quedar PENDIENTE o EN_PROCESO
    const pendingTask = ot.tareas.find(t => t.estado === 'PENDIENTE' || t.estado === 'EN_PROCESO');
    if (pendingTask) {
      throw new Error(
        `No se puede cerrar la OT: La tarea "${pendingTask.descripcion}" se encuentra en estado ${pendingTask.estado}. Debe completarse o cancelarse previamente.`
      );
    }

    // Actualizar contadores en Flota (Fuente única de verdad de Flota)
    if (params.odometroCierreKm !== undefined) {
      await fleetService.registerOdometerReading(ot.equipoId, params.odometroCierreKm, 'TALLER', ot.id);
      ot.odometroCierreKm = params.odometroCierreKm;
    }
    if (params.horometroCierreHs !== undefined) {
      await fleetService.registerHourmeterReading(ot.equipoId, params.horometroCierreHs, 'TALLER', ot.id);
      ot.horometroCierreHs = params.horometroCierreHs;
    }

    ot.diagnostico = params.diagnostico;
    ot.trabajoRealizado = params.trabajoRealizado;
    ot.causaRaiz = params.causaRaiz || 'DESGASTE_NORMAL';
    ot.estado = 'CERRADA';
    ot.fechaFinReal = params.fechaCierre || new Date().toISOString();
    ot.fechaCierre = params.fechaCierre || new Date().toISOString();

    // Cálculo de Downtime (Horas de parada):
    // Únicamente si la OT bloqueó el equipo y registró fechaHoraInicioBloqueo.
    if (ot.bloqueaEquipo && ot.fechaHoraInicioBloqueo) {
      ot.fechaHoraFinBloqueo = ot.fechaCierre;
      const startMs = new Date(ot.fechaHoraInicioBloqueo).getTime();
      const endMs = new Date(ot.fechaHoraFinBloqueo).getTime();
      ot.horasParadaEquipo = Math.max(0, Math.round(((endMs - startMs) / (1000 * 60 * 60)) * 10) / 10);
    } else {
      ot.horasParadaEquipo = 0;
    }

    // Recalcular y persistir
    await maintenanceRepository.saveWorkOrder(ot);

    // Si bloqueó el equipo, liberarlo a DISPONIBLE mediante evento
    if (ot.bloqueaEquipo) {
      const eventId = `EVT-CLOSE-${ot.id}-${Date.now()}`;
      await fleetEventHandler.onEquipoSaleTaller(eventId, ot.equipoId, ot.id);
    }

    await auditRepository.recordAction(
      'mant_ordenes_trabajo',
      ot.id,
      'CIERRE_OT',
      { estado: 'EN_PROCESO' },
      { estado: 'CERRADA', costoTotal: ot.costoTotal, horasParada: ot.horasParadaEquipo },
      `Cierre final de OT ${ot.numeroOT} con costo total $${ot.costoTotal.toLocaleString()}`
    );

    return ot;
  }
}

export const maintenanceService = new MaintenanceService();
