import { EquipoPlanMantenimiento } from '../types';
import { maintenanceRepository } from '../repositories/maintenanceRepository';
import { equipmentRepository } from '../repositories/equipmentRepository';

export class MaintenancePlanningService {
  async evaluateEquipmentPlans(equipoId: string): Promise<EquipoPlanMantenimiento[]> {
    const equipo = await equipmentRepository.getById(equipoId);
    if (!equipo) return [];

    const assignedPlans = await maintenanceRepository.getPlansByEquipment(equipoId);
    const results: EquipoPlanMantenimiento[] = [];

    for (const ep of assignedPlans) {
      const updated = await maintenanceRepository.updateEquipmentPlanStatus(
        equipoId,
        ep.planId,
        equipo.odometroKmActual,
        equipo.horometroHsActual
      );
      if (updated) results.push(updated);
    }

    return results;
  }
}

export const maintenancePlanningService = new MaintenancePlanningService();
