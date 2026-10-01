import {
  Equipo,
  LecturaContador,
  EstadoOperativoEquipo
} from '../types';
import { equipmentRepository } from '../repositories/equipmentRepository';
import { employeeRepository } from '../repositories/employeeRepository';
import { hrAvailabilityService } from './hrAvailabilityService';

/**
 * SERVICIO DE DOMINIO DE FLOTA & MAQUINARIA
 */

export class FleetService {
  async getAllEquipos(): Promise<Equipo[]> {
    return equipmentRepository.getAll();
  }

  async getEquipoById(id: string): Promise<Equipo | null> {
    return equipmentRepository.getById(id);
  }

  async changeStatus(
    equipoId: string,
    nuevoEstado: EstadoOperativoEquipo,
    motivo: string,
    usuario: string = 'admin_flota'
  ): Promise<Equipo> {
    return equipmentRepository.changeOperationalStatus(equipoId, nuevoEstado, motivo, usuario);
  }

  async registerOdometerReading(
    equipoId: string,
    nuevoKm: number,
    origen: 'MANUAL' | 'VIAJE' | 'TALLER' | 'TELEMETRIA' | 'GPS' = 'MANUAL',
    referenciaId?: string,
    usuario?: string
  ): Promise<LecturaContador> {
    return equipmentRepository.addCounterReading(equipoId, 'ODOMETRO_KM', nuevoKm, origen, referenciaId, usuario);
  }

  async registerHourmeterReading(
    equipoId: string,
    nuevasHoras: number,
    origen: 'MANUAL' | 'VIAJE' | 'TALLER' | 'TELEMETRIA' | 'GPS' = 'MANUAL',
    referenciaId?: string,
    usuario?: string
  ): Promise<LecturaContador> {
    return equipmentRepository.addCounterReading(equipoId, 'HOROMETRO_HS', nuevasHoras, origen, referenciaId, usuario);
  }

  async assignOperatorToEquipment(
    equipoId: string,
    empleadoId: string,
    tipoAsignacion: 'HABITUAL' | 'TEMPORAL' | 'RELEVO' = 'HABITUAL',
    motivo: string = 'Asignación de chofer/operador',
    usuario: string = 'admin_flota'
  ) {
    const empleado = await employeeRepository.getById(empleadoId);
    if (!empleado) throw new Error(`Empleado ${empleadoId} no existe`);

    // Validar disponibilidad del empleado en RRHH
    const avail = await hrAvailabilityService.canAssignEmployee(empleadoId, new Date().toISOString());
    if (!avail.disponible && avail.bloqueante) {
      throw new Error(`No se puede asignar el operador: ${avail.motivo}`);
    }

    const nombreCompleto = `${empleado.apellido}, ${empleado.nombre}`;
    return equipmentRepository.assignOperator(equipoId, empleadoId, nombreCompleto, tipoAsignacion, motivo, usuario);
  }
}

export const fleetService = new FleetService();
