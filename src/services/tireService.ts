import { Neumatico } from '../types';
import { tireRepository } from '../repositories/tireRepository';
import { equipmentRepository } from '../repositories/equipmentRepository';

export class TireService {
  async getAllTires(): Promise<Neumatico[]> {
    return tireRepository.getAllTires();
  }

  async getTiresByEquipment(equipoId: string): Promise<Neumatico[]> {
    return tireRepository.getTiresByEquipment(equipoId);
  }

  async installTire(neumaticoId: string, equipoId: string, posicion: string): Promise<Neumatico> {
    const eq = await equipmentRepository.getById(equipoId);
    if (!eq) throw new Error(`Equipo ${equipoId} no existe`);

    return tireRepository.installTire(neumaticoId, equipoId, posicion, eq.odometroKmActual);
  }

  async removeTire(
    neumaticoId: string,
    kmEquipoActual?: number,
    nuevoEstado: 'EN_STOCK' | 'EN_REPARACION' | 'RECAPADO' | 'BAJA' = 'EN_STOCK',
    motivo: string = 'Desmonte de neumático'
  ): Promise<Neumatico> {
    const tire = await tireRepository.getTireById(neumaticoId);
    if (!tire) throw new Error(`Neumático ${neumaticoId} no existe`);

    let km = kmEquipoActual;
    if (km === undefined && tire.equipoActualId) {
      const eq = await equipmentRepository.getById(tire.equipoActualId);
      if (eq) km = eq.odometroKmActual;
    }

    return tireRepository.removeTire(neumaticoId, km || 0, nuevoEstado, motivo);
  }

  async registerRepairOrRetread(
    neumaticoId: string,
    costo: number,
    tipo: 'REPARACION' | 'RECAPADO',
    detalle: string
  ): Promise<Neumatico> {
    return tireRepository.addMaintenanceCostToTire(neumaticoId, costo, tipo, detalle);
  }
}

export const tireService = new TireService();
