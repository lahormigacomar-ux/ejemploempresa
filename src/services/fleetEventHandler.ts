import { equipmentRepository } from '../repositories/equipmentRepository';
import { auditRepository } from '../repositories/auditRepository';

/**
 * MANEJADOR DE EVENTOS DE FLOTA CON IDEMPOTENCIA
 */

export class FleetEventHandler {
  private processedEvents: Set<string> = new Set();

  resetForTesting() {
    this.processedEvents.clear();
  }

  async onEquipoEntraTaller(eventId: string, equipoId: string, ordenTrabajoId: string, motivo: string) {
    if (this.processedEvents.has(eventId)) {
      return { processed: false, isDuplicate: true };
    }

    this.processedEvents.add(eventId);
    await equipmentRepository.changeOperationalStatus(equipoId, 'EN_TALLER', `Ingreso a taller por OT #${ordenTrabajoId}: ${motivo}`);

    await auditRepository.recordAction(
      'flota_eventos',
      eventId,
      'EVENTO_EQUIPO_ENTRA_TALLER',
      null,
      { equipoId, ordenTrabajoId, motivo },
      'Evento emitido desde Taller / Mantenimiento'
    );

    return { processed: true, isDuplicate: false };
  }

  async onEquipoSaleTaller(eventId: string, equipoId: string, ordenTrabajoId: string) {
    if (this.processedEvents.has(eventId)) {
      return { processed: false, isDuplicate: true };
    }

    this.processedEvents.add(eventId);
    await equipmentRepository.changeOperationalStatus(equipoId, 'DISPONIBLE', `Salida de taller / OT #${ordenTrabajoId} cerrada`);

    return { processed: true, isDuplicate: false };
  }
}

export const fleetEventHandler = new FleetEventHandler();
