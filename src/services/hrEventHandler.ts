import { ImputacionCostoLaboral } from '../types';
import { employeeRepository } from '../repositories/employeeRepository';
import { payrollRepository } from '../repositories/payrollRepository';
import { laborCostRepository } from '../repositories/laborCostRepository';

/**
 * MANEJADOR DE EVENTOS DE DOMINIO CON GARANTÍA DE IDEMPOTENCIA
 * Conecta Logística, Taller, Áridos y Producción con el costo laboral real.
 */

export interface DomainEventPayload {
  eventId: string; // Clave única de idempotencia
  fecha: string; // 'YYYY-MM-DD'
  empleadoId: string;
  centroCostoId: string;
  horas: number;
  origenModulo: 'LOGISTICA_VIAJE' | 'TALLER_OT' | 'ARIDOS_MAQUINARIA' | 'PRODUCCION_PLANTA' | 'MANUAL';
  origenId: string;
  equipoId?: string;
}

export class HREventHandler {
  /**
   * Procesa la imputación laboral de un evento garantizando idempotencia.
   */
  async handleLaborCostEvent(payload: DomainEventPayload): Promise<{
    processed: boolean;
    imputacion: ImputacionCostoLaboral;
    isDuplicate: boolean;
  }> {
    const empleado = await employeeRepository.getById(payload.empleadoId);
    if (!empleado) {
      throw new Error(`No se puede imputar costo: Empleado ${payload.empleadoId} no existe`);
    }

    const periodo = payload.fecha.substring(0, 7); // 'YYYY-MM'
    const reglaVigente = await payrollRepository.getReglaVigente(payload.fecha);
    const sueldoHistorico = await employeeRepository.getHistoricalSalary(payload.empleadoId, payload.fecha);

    // Costo mensual empresa = sueldo básico * (1 + coefCargasPatronales + coefART)
    const costoEmpresaMensual = Math.round(
      sueldoHistorico * (1 + reglaVigente.coefCargasPatronales + reglaVigente.coefART)
    );
    const costoHorario = Math.round(costoEmpresaMensual / reglaVigente.horasBaseMensuales);
    const costoTotal = Math.round(costoHorario * payload.horas);

    const imputacion: ImputacionCostoLaboral = {
      id: `imp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      eventId: payload.eventId,
      empleadoId: payload.empleadoId,
      fecha: payload.fecha,
      centroCostoId: payload.centroCostoId,
      origenModulo: payload.origenModulo,
      origenId: payload.origenId,
      equipoId: payload.equipoId,
      horasImputadas: payload.horas,
      costoHorarioAplicado: costoHorario,
      costoTotalImputado: costoTotal,
      periodoImputacion: periodo,
      createdAt: new Date().toISOString()
    };

    const result = await laborCostRepository.saveAllocation(imputacion);

    return {
      processed: result.saved,
      imputacion: result.allocation,
      isDuplicate: result.isDuplicate
    };
  }

  // Evento específico: Viaje completado desde Logística
  async onViajeCompletado(viajeId: string, choferId: string, horasViaje: number, mixerId: string, fecha: string) {
    return this.handleLaborCostEvent({
      eventId: `EVT-LOG-VIAJE-${viajeId}`,
      fecha,
      empleadoId: choferId,
      centroCostoId: 'cc-transporte',
      horas: horasViaje,
      origenModulo: 'LOGISTICA_VIAJE',
      origenId: viajeId,
      equipoId: mixerId
    });
  }

  // Evento específico: OT Finalizada desde Taller
  async onOrdenTrabajoFinalizada(otId: string, mecanicoId: string, horasManoObra: number, equipoReparadoId: string, fecha: string) {
    return this.handleLaborCostEvent({
      eventId: `EVT-MNT-OT-${otId}`,
      fecha,
      empleadoId: mecanicoId,
      centroCostoId: 'cc-taller',
      horas: horasManoObra,
      origenModulo: 'TALLER_OT',
      origenId: otId,
      equipoId: equipoReparadoId
    });
  }

  // Evento específico: Horas máquina registradas en Áridos
  async onHorasMaquinaRegistradas(registroId: string, maquinistaId: string, horas: number, cargadoraId: string, fecha: string) {
    return this.handleLaborCostEvent({
      eventId: `EVT-ARI-MAQ-${registroId}`,
      fecha,
      empleadoId: maquinistaId,
      centroCostoId: 'cc-aridos',
      horas,
      origenModulo: 'ARIDOS_MAQUINARIA',
      origenId: registroId,
      equipoId: cargadoraId
    });
  }
}

export const hrEventHandler = new HREventHandler();
