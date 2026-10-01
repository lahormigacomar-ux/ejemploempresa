import { ImputacionCostoLaboral } from '../types';
import { auditRepository } from './auditRepository';

class LaborCostRepository {
  private allocations: Map<string, ImputacionCostoLaboral> = new Map(); // key = eventId

  resetForTesting() {
    this.allocations.clear();
  }

  async saveAllocation(allocation: ImputacionCostoLaboral): Promise<{ saved: boolean; allocation: ImputacionCostoLaboral; isDuplicate: boolean }> {
    if (this.allocations.has(allocation.eventId)) {
      // Garantía de Idempotencia: Ya fue procesado, no duplicar costo
      return {
        saved: false,
        allocation: this.allocations.get(allocation.eventId)!,
        isDuplicate: true
      };
    }

    this.allocations.set(allocation.eventId, allocation);

    await auditRepository.recordAction(
      'rrhh_imputaciones_costo_laboral',
      allocation.id,
      'IMPUTACION_COSTO_LABORAL_REGISTRADA',
      null,
      {
        eventId: allocation.eventId,
        empleadoId: allocation.empleadoId,
        centroCostoId: allocation.centroCostoId,
        horas: allocation.horasImputadas,
        costoTotal: allocation.costoTotalImputado,
        origen: `${allocation.origenModulo} (#${allocation.origenId})`
      },
      `Imputación automática de costo laboral desde ${allocation.origenModulo}`
    );

    return {
      saved: true,
      allocation,
      isDuplicate: false
    };
  }

  async getAllocationsByCentroCosto(centroCostoId?: string, periodo?: string): Promise<ImputacionCostoLaboral[]> {
    const list = Array.from(this.allocations.values());
    return list.filter(a => {
      if (centroCostoId && a.centroCostoId !== centroCostoId) return false;
      if (periodo && a.periodoImputacion !== periodo) return false;
      return true;
    });
  }

  async getAllocationsBySource(origenModulo: string, origenId: string): Promise<ImputacionCostoLaboral[]> {
    return Array.from(this.allocations.values()).filter(
      a => a.origenModulo === origenModulo && a.origenId === origenId
    );
  }

  async getAll(): Promise<ImputacionCostoLaboral[]> {
    return Array.from(this.allocations.values());
  }
}

export const laborCostRepository = new LaborCostRepository();
