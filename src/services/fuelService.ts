import {
  AbastecimientoCombustible,
  OrigenAbastecimiento,
  MovimientoTanqueCombustible
} from '../types';
import { fuelRepository } from '../repositories/fuelRepository';
import { tankRepository } from '../repositories/tankRepository';
import { equipmentRepository } from '../repositories/equipmentRepository';
import { employeeRepository } from '../repositories/employeeRepository';
import { fuelPerformanceRepository } from '../repositories/fuelPerformanceRepository';
import { auditRepository } from '../repositories/auditRepository';
import { fleetService } from './fleetService';
import { fuelPerformanceService } from './fuelPerformanceService';
import { tankService } from './tankService';

export class FuelService {
  /**
   * Registra un abastecimiento de combustible con prevalidación atómica contra Flota y Tanques
   */
  async registerSupply(params: {
    empresaId?: string;
    equipoId: string;
    empleadoId?: string;
    tipoCombustibleId: string;
    origenAbastecimiento: OrigenAbastecimiento;
    tanqueId?: string;
    estacionServicioNombre?: string;
    proveedorNombre?: string;
    litros: number;
    precioUnitario?: number;
    odometroKm?: number;
    horometroHs?: number;
    tanqueEquipoLleno?: boolean;
    centroCostoId?: string;
    numeroVale?: string;
    numeroComprobante?: string;
    numeroTicket?: string;
    fotoTicketUrl?: string;
    observaciones?: string;
    fechaHora?: string;
    viajeId?: string;
    actividadId?: string;
    eventId?: string;
    usuarioId?: string;
  }): Promise<{ supply: AbastecimientoCombustible; isDuplicate: boolean }> {
    const empresaId = params.empresaId || 'emp-1';
    const now = params.fechaHora || new Date().toISOString();

    // 0. Control de Idempotencia Técnica por EventId / Key
    if (params.eventId) {
      const existing = await fuelRepository.getSupplyByEventId(params.eventId);
      if (existing) {
        return { supply: existing, isDuplicate: true };
      }
    }

    // =========================================================================
    // 1. FASE DE PRE-VALIDACIÓN ESTRICTA (Previene mutaciones parciales de estado)
    // =========================================================================
    if (params.litros <= 0) {
      throw new Error('La cantidad de litros a cargar debe ser estrictamente mayor a 0');
    }

    // A. Validar Equipo en Flota
    const equipo = await equipmentRepository.getById(params.equipoId);
    if (!equipo) {
      throw new Error(`Equipo con ID ${params.equipoId} no encontrado en el maestro de Flota`);
    }
    if (equipo.estadoAdministrativo === 'BAJA_DEFINITIVA' || equipo.estadoOperativo === 'BAJA') {
      throw new Error(`El equipo ${equipo.codigoInterno} (${equipo.dominioPatente || 'S/D'}) se encuentra dado de BAJA`);
    }

    // B. Validar Tipo de Combustible y Precio de Referencia
    const fuelType = await tankRepository.getFuelTypeById(params.tipoCombustibleId);
    if (!fuelType || !fuelType.activo) {
      throw new Error(`Tipo de combustible ${params.tipoCombustibleId} no válido o inactivo`);
    }

    // Precio monetario explícito o de referencia (SIN fallback inventado)
    const precioUnitario = params.precioUnitario ?? fuelType.precioReferencia;
    if (precioUnitario === undefined || precioUnitario === null || precioUnitario <= 0 || isNaN(precioUnitario)) {
      throw new Error('No existe precio de combustible disponible para valorizar el abastecimiento.');
    }

    // C. Validar Origen y Tanque Interno
    let tankObj = null;
    if (params.origenAbastecimiento === 'TANQUE_INTERNO') {
      if (!params.tanqueId) {
        throw new Error('Debe especificar el tanque interno de origen');
      }
      tankObj = await tankRepository.getTankById(params.tanqueId);
      if (!tankObj) {
        throw new Error(`Tanque interno ${params.tanqueId} no encontrado`);
      }
      if (tankObj.estado !== 'ACTIVO') {
        throw new Error(`El tanque ${tankObj.codigo} no está operativo (Estado: ${tankObj.estado})`);
      }
      if (tankObj.tipoCombustibleId !== params.tipoCombustibleId) {
        throw new Error(
          `Incompatibilidad de combustible: El tanque ${tankObj.codigo} contiene ${tankObj.tipoCombustibleId} y la carga solicita ${params.tipoCombustibleId}`
        );
      }
      if (!tankObj.permiteStockNegativo && tankObj.stockActualLitros < params.litros) {
        throw new Error(
          `Stock insuficiente en tanque ${tankObj.codigo}: Disponible ${tankObj.stockActualLitros} L, solicitado ${params.litros} L`
        );
      }
    }

    // D. Validar Empleado en RRHH (Verificar existencia y estado ACTIVO)
    if (params.empleadoId) {
      const emp = await employeeRepository.getById(params.empleadoId);
      if (!emp) {
        throw new Error(`Empleado con ID ${params.empleadoId} no encontrado en RRHH`);
      }
      if (emp.estado !== 'ACTIVO') {
        throw new Error(`El empleado asignado no se encuentra en estado ACTIVO (Estado actual: ${emp.estado})`);
      }
    }

    // E. Pre-validar Contadores de Flota (Evitar que odómetro pase y horómetro falle o viceversa)
    if (params.odometroKm !== undefined) {
      if (params.odometroKm < equipo.odometroKmActual) {
        throw new Error(
          `Lectura regresiva rechazada: Odómetro ingresado (${params.odometroKm} km) no puede ser menor al actual (${equipo.odometroKmActual} km)`
        );
      }
    }
    if (params.horometroHs !== undefined) {
      if (params.horometroHs < equipo.horometroHsActual) {
        throw new Error(
          `Lectura regresiva rechazada: Horómetro ingresado (${params.horometroHs} hs) no puede ser menor al actual (${equipo.horometroHsActual} hs)`
        );
      }
    }

    // F. Detección Contextual de Posible Duplicado de Ticket / Comprobante Manual (Sin mutación en prevalidación)
    let duplicateComprobanteRef: AbastecimientoCombustible | null = null;
    const comprobanteToCheck = params.numeroComprobante || params.numeroTicket;
    if (comprobanteToCheck) {
      const allExisting = await fuelRepository.getAllSupplies({ empresaId });
      const found = allExisting.find(s => {
        if (s.estado === 'ANULADO') return false;
        const sameDoc = s.numeroComprobante === comprobanteToCheck || s.numeroTicket === comprobanteToCheck;
        if (!sameDoc) return false;
        if (s.origenAbastecimiento !== params.origenAbastecimiento) return false;
        if (params.origenAbastecimiento === 'ESTACION_SERVICIO') {
          return s.estacionServicioNombreSnapshot === params.estacionServicioNombre;
        }
        if (params.origenAbastecimiento === 'TANQUE_INTERNO') {
          return s.tanqueId === params.tanqueId;
        }
        return true;
      });
      if (found) {
        duplicateComprobanteRef = found;
      }
    }

    // =========================================================================
    // 2. FASE DE EJECUCIÓN ATÓMICA
    // Nota arquitectónica: En PostgreSQL/Supabase físico se ejecutará con BEGIN ... COMMIT
    // =========================================================================
    const supplyId = `abs-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
    const costoTotal = Number((params.litros * precioUnitario).toFixed(2));

    // 1. Actualizar contadores en el maestro de Flota (Fuente única de verdad)
    if (params.odometroKm !== undefined) {
      await fleetService.registerOdometerReading(equipo.id, params.odometroKm, 'COMBUSTIBLE', supplyId);
    }
    if (params.horometroHs !== undefined) {
      await fleetService.registerHourmeterReading(equipo.id, params.horometroHs, 'COMBUSTIBLE', supplyId);
    }

    // 2. Si proviene de tanque interno, generar egreso y descontar stock
    if (params.origenAbastecimiento === 'TANQUE_INTERNO' && tankObj) {
      const mov: MovimientoTanqueCombustible = {
        id: `mov-egr-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        empresaId,
        tanqueId: tankObj.id,
        fechaHora: now,
        tipoMovimiento: 'EGRESO',
        litros: params.litros,
        origenModulo: 'COMBUSTIBLE_ABASTECIMIENTO',
        origenId: supplyId,
        costoUnitarioSnapshot: precioUnitario,
        costoTotalSnapshot: costoTotal,
        stockAnteriorLitros: tankObj.stockActualLitros,
        stockPosteriorLitros: tankObj.stockActualLitros - params.litros,
        usuarioId: params.usuarioId,
        observaciones: `Abastecimiento a ${equipo.codigoInterno}`,
        eventId: params.eventId
      };
      await tankRepository.addTankMovement(mov);
      await tankService.checkTankAlerts(tankObj.id);
    }

    // 3. Obtener abastecimiento anterior para cálculo de rendimiento
    const lastSupply = await fuelRepository.getLastSupplyForEquipment(equipo.id, now);

    const odometroAnterior = lastSupply?.odometroKmSnapshot ?? (params.odometroKm ? equipo.odometroKmActual : undefined);
    const horometroAnterior = lastSupply?.horometroHsSnapshot ?? (params.horometroHs ? equipo.horometroHsActual : undefined);

    let kmRecorridos: number | undefined;
    let horasTrabajadas: number | undefined;

    if (params.odometroKm !== undefined && odometroAnterior !== undefined && params.odometroKm > odometroAnterior) {
      kmRecorridos = params.odometroKm - odometroAnterior;
    }
    if (params.horometroHs !== undefined && horometroAnterior !== undefined && params.horometroHs > horometroAnterior) {
      horasTrabajadas = params.horometroHs - horometroAnterior;
    }

    // 4. Evaluar Rendimiento y Metodología (Lleno-a-Lleno vs Estimado entre cargas)
    const evalResult = await fuelPerformanceService.evaluateSupplyPerformance(
      equipo.id,
      params.litros,
      now,
      params.odometroKm,
      odometroAnterior,
      params.horometroHs,
      horometroAnterior,
      params.tanqueEquipoLleno ?? false,
      lastSupply?.tanqueEquipoLleno ?? false
    );

    const supply: AbastecimientoCombustible = {
      id: supplyId,
      empresaId,
      numeroVale: params.numeroVale || `VAL-${Date.now().toString().slice(-6)}`,
      fechaHora: now,
      equipoId: equipo.id,
      empleadoId: params.empleadoId,
      tipoCombustibleId: params.tipoCombustibleId,
      origenAbastecimiento: params.origenAbastecimiento,
      tanqueId: params.tanqueId,
      estacionServicioNombreSnapshot: params.estacionServicioNombre,
      proveedorNombreSnapshot: params.proveedorNombre,
      litros: params.litros,
      precioUnitarioSnapshot: precioUnitario,
      costoTotalSnapshot: costoTotal,
      odometroKmSnapshot: params.odometroKm,
      horometroHsSnapshot: params.horometroHs,
      odometroKmAnteriorSnapshot: odometroAnterior,
      horometroHsAnteriorSnapshot: horometroAnterior,
      kmRecorridosEstimados: kmRecorridos,
      horasTrabajadasEstimadas: horasTrabajadas,
      tanqueEquipoLleno: params.tanqueEquipoLleno ?? false,
      metodoCalculoConsumo: evalResult.metodoCalculoConsumo,
      rendimientoCalculado: evalResult.rendimientoCalculado,
      metricaRendimiento: evalResult.metricaRendimiento,
      nivelDesvio: evalResult.nivelDesvio,
      centroCostoId: params.centroCostoId || equipo.centroCostoHabitualId || 'cc-transporte',
      numeroComprobante: params.numeroComprobante,
      numeroTicket: params.numeroTicket,
      fotoTicketUrl: params.fotoTicketUrl,
      observaciones: params.observaciones,
      estado: 'CONFIRMADO',
      viajeId: params.viajeId,
      actividadId: params.actividadId,
      eventId: params.eventId,
      createdAt: now,
      updatedAt: now
    };

    await fuelRepository.saveSupply(supply);

    // 5. Generar alerta si se detectó un comprobante duplicado (apuntando al NUEVO abastecimiento como origenId)
    if (duplicateComprobanteRef) {
      await fuelPerformanceRepository.addAlert({
        id: `alt-dup-comp-${supply.id}`,
        empresaId,
        tipo: 'COMPROBANTE_DUPLICADO',
        severidad: 'ADVERTENCIA',
        titulo: `Posible Comprobante Duplicado: ${comprobanteToCheck}`,
        descripcion: `El comprobante ${comprobanteToCheck} coincide con el abastecimiento previo ${duplicateComprobanteRef.numeroVale || duplicateComprobanteRef.id}.`,
        origenModulo: 'COMBUSTIBLE_ABASTECIMIENTO',
        origenId: supply.id,
        equipoId: equipo.id,
        fecha: now,
        resuelta: false
      });
    }

    // 6. Generar alerta si el consumo arrojó desvío CRITICO o ADVERTENCIA
    if (evalResult.nivelDesvio === 'CRITICO' || evalResult.nivelDesvio === 'ADVERTENCIA') {
      await fuelPerformanceRepository.addAlert({
        id: `alt-perf-${supply.id}`,
        empresaId,
        tipo: evalResult.nivelDesvio === 'CRITICO' ? 'CONSUMO_CRITICO' : 'CONSUMO_ADVERTENCIA',
        severidad: evalResult.nivelDesvio === 'CRITICO' ? 'ADVERTENCIA' : 'INFORMATIVA',
        titulo: `Desvío de Consumo ${evalResult.nivelDesvio} en ${equipo.codigoInterno}`,
        descripcion: `${evalResult.observacionRendimiento}. Rendimiento: ${evalResult.rendimientoCalculado} ${evalResult.metricaRendimiento}.`,
        origenModulo: 'COMBUSTIBLE_ABASTECIMIENTO',
        origenId: supply.id,
        equipoId: equipo.id,
        fecha: now,
        resuelta: false
      });
    }

    // 7. Auditoría
    await auditRepository.recordAction(
      'comb_abastecimientos',
      supply.id,
      'REGISTRO_ABASTECIMIENTO',
      null,
      {
        equipo: equipo.codigoInterno,
        litros: params.litros,
        costoTotal,
        origen: params.origenAbastecimiento,
        metodoCalculo: evalResult.metodoCalculoConsumo,
        rendimiento: evalResult.rendimientoCalculado,
        desvio: evalResult.nivelDesvio
      },
      `Abastecimiento de ${params.litros} L a ${equipo.codigoInterno} ($${costoTotal.toLocaleString()})`,
      params.usuarioId
    );

    return { supply, isDuplicate: false };
  }

  /**
   * Anulación formal de un abastecimiento de combustible con restauración de stock si provino de tanque interno
   */
  async cancelSupply(
    supplyId: string,
    motivo: string,
    usuarioId: string = 'admin'
  ): Promise<AbastecimientoCombustible> {
    const supply = await fuelRepository.getSupplyById(supplyId);
    if (!supply) throw new Error(`Abastecimiento ${supplyId} no encontrado`);
    if (supply.estado === 'ANULADO') throw new Error('El abastecimiento ya se encuentra ANULADO');

    if (!motivo || motivo.trim() === '') {
      throw new Error('Debe especificar un motivo formal para la anulación del abastecimiento');
    }

    const now = new Date().toISOString();
    supply.estado = 'ANULADO';
    supply.fechaAnulacion = now;
    supply.usuarioAnulacion = usuarioId;
    supply.motivoAnulacion = motivo;
    supply.updatedAt = now;

    // Si provino de tanque interno, revertir el egreso sumando el stock mediante movimiento inverso
    if (supply.origenAbastecimiento === 'TANQUE_INTERNO' && supply.tanqueId) {
      const tank = await tankRepository.getTankById(supply.tanqueId);
      if (tank) {
        const mov: MovimientoTanqueCombustible = {
          id: `mov-rev-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
          empresaId: supply.empresaId,
          tanqueId: tank.id,
          fechaHora: now,
          tipoMovimiento: 'INGRESO',
          litros: supply.litros,
          origenModulo: 'ANULACION_ABASTECIMIENTO',
          origenId: supply.id,
          costoUnitarioSnapshot: supply.precioUnitarioSnapshot,
          costoTotalSnapshot: supply.costoTotalSnapshot,
          stockAnteriorLitros: tank.stockActualLitros,
          stockPosteriorLitros: tank.stockActualLitros + supply.litros,
          usuarioId,
          observaciones: `Reversión por anulación de vale ${supply.numeroVale || supply.id}: ${motivo}`
        };
        await tankRepository.addTankMovement(mov);
      }
    }

    await fuelRepository.saveSupply(supply);

    await auditRepository.recordAction(
      'comb_abastecimientos',
      supply.id,
      'ANULACION_ABASTECIMIENTO',
      { estado: 'CONFIRMADO' },
      { estado: 'ANULADO', motivo, usuarioAnulacion: usuarioId },
      `Anulación de abastecimiento ${supply.numeroVale || supply.id}: ${motivo}`,
      usuarioId
    );

    return supply;
  }
}

export const fuelService = new FuelService();
