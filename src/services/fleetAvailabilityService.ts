import { EquipmentAvailabilityResult } from '../types';
import { equipmentRepository } from '../repositories/equipmentRepository';
import { hrAvailabilityService } from './hrAvailabilityService';

/**
 * SERVICIO CENTRAL DE DISPONIBILIDAD DE FLOTA & MAQUINARIA
 * Evalúa disponibilidad operativa de equipos y validación cruzada con choferes/operadores de RRHH.
 */

export class FleetAvailabilityService {
  /**
   * Consulta si un equipo está en condiciones operativas y legales de ser asignado.
   */
  async canAssignEquipment(
    equipoId: string,
    fechaHoraConsulta: string = new Date().toISOString(),
    requiredCapM3?: number,
    requiredEquipmentType?: string
  ): Promise<EquipmentAvailabilityResult> {
    const equipo = await equipmentRepository.getById(equipoId);
    if (!equipo) {
      return {
        disponible: false,
        bloqueante: true,
        codigoMotivo: 'NO_EXISTE',
        motivo: `Equipo con ID ${equipoId} no encontrado en el maestro de flota.`,
        restricciones: ['NO_EXISTE']
      };
    }

    const restricciones: string[] = [];
    const fechaStr = fechaHoraConsulta.split('T')[0];

    // 1. Estado administrativo
    if (equipo.estadoAdministrativo !== 'ACTIVO') {
      return {
        disponible: false,
        bloqueante: true,
        codigoMotivo: 'INACTIVO_ADMINISTRATIVO',
        motivo: `Equipo en estado administrativo: ${equipo.estadoAdministrativo}`,
        restricciones: [`ADMIN_${equipo.estadoAdministrativo}`]
      };
    }

    // 2. Estado operativo
    if (equipo.estadoOperativo === 'EN_TALLER' || equipo.estadoOperativo === 'MANTENIMIENTO_PROGRAMADO') {
      return {
        disponible: false,
        bloqueante: true,
        codigoMotivo: 'EN_TALLER',
        motivo: `El equipo ${equipo.codigoInterno} se encuentra EN TALLER por mantenimiento.`,
        restricciones: ['EN_TALLER']
      };
    }

    if (equipo.estadoOperativo === 'FUERA_SERVICIO' || equipo.estadoOperativo === 'BAJA') {
      return {
        disponible: false,
        bloqueante: true,
        codigoMotivo: 'FUERA_SERVICIO',
        motivo: `El equipo ${equipo.codigoInterno} está FUERA DE SERVICIO.`,
        restricciones: ['FUERA_SERVICIO']
      };
    }

    if (equipo.estadoOperativo === 'EN_VIAJE' || equipo.estadoOperativo === 'EN_OPERACION' || equipo.estadoOperativo === 'ASIGNADO') {
      restricciones.push('ASIGNACION_EN_CURSO');
      return {
        disponible: false,
        bloqueante: true,
        codigoMotivo: 'ASIGNACION_EN_CURSO',
        motivo: `El equipo ${equipo.codigoInterno} ya se encuentra ${equipo.estadoOperativo} en este momento.`,
        restricciones
      };
    }

    // NOTA ARQUITECTÓNICA: En esta fase el estado RESERVADO actúa como bloqueo general de asignación.
    // La gestión granular de reservas por franja horaria, obra y ventana temporal se resolverá en Módulo 11 (Programación, Despacho y Logística).
    if (equipo.estadoOperativo === 'RESERVADO') {
      restricciones.push('EQUIPO_RESERVADO');
      return {
        disponible: false,
        bloqueante: true,
        codigoMotivo: 'EQUIPO_RESERVADO',
        motivo: `El equipo ${equipo.codigoInterno} se encuentra RESERVADO para otra programación operativa.`,
        restricciones
      };
    }

    // 3. Documentación bloqueante y seguro
    const docVencido = equipo.documentos.find(
      d => d.bloqueanteOperativo && d.fechaVencimiento && d.fechaVencimiento < fechaStr
    );
    if (docVencido) {
      restricciones.push(`DOC_${docVencido.tipoDocumento}_VENCIDO`);
      return {
        disponible: false,
        bloqueante: true,
        codigoMotivo: 'DOC_BLOQUEANTE_VENCIDO',
        motivo: `Documentación bloqueante vencida: ${docVencido.tipoDocumento} (Venció: ${docVencido.fechaVencimiento})`,
        restricciones
      };
    }

    if (equipo.seguroVigente && equipo.seguroVigente.vigenciaHasta < fechaStr) {
      restricciones.push('SEGURO_VENCIDO');
      return {
        disponible: false,
        bloqueante: true,
        codigoMotivo: 'SEGURO_VENCIDO',
        motivo: `Póliza de seguro vencida el ${equipo.seguroVigente.vigenciaHasta}. Bloqueo legal de circulación.`,
        restricciones
      };
    }

    // 4. Tipo de equipo requerido
    if (requiredEquipmentType && equipo.tipoEquipo !== requiredEquipmentType) {
      restricciones.push('TIPO_INCOMPATIBLE');
      return {
        disponible: false,
        bloqueante: true,
        codigoMotivo: 'TIPO_INCOMPATIBLE',
        motivo: `El equipo es de tipo ${equipo.tipoEquipo}, se requería ${requiredEquipmentType}.`,
        restricciones
      };
    }

    // 5. Capacidad requerida (ej. pedido de 9 m3 en mixer de 8 m3)
    if (requiredCapM3 && equipo.especificaciones.capacidadTamborM3) {
      if (equipo.especificaciones.capacidadTamborM3 < requiredCapM3) {
        return {
          disponible: false,
          bloqueante: true,
          codigoMotivo: 'CAPACIDAD_INSUFICIENTE',
          motivo: `Capacidad del mixer (${equipo.especificaciones.capacidadTamborM3} m³) es menor al volumen solicitado (${requiredCapM3} m³).`,
          restricciones: ['CAPACIDAD_INSUFICIENTE']
        };
      }
    }

    return {
      disponible: true,
      bloqueante: false,
      codigoMotivo: 'OK',
      motivo: `Equipo ${equipo.codigoInterno} (${equipo.marca} ${equipo.modelo}) disponible para asignación.`,
      restricciones: []
    };
  }

  /**
   * Validación combinada Chofer + Equipo para Logística / Despacho.
   * Conecta Módulo 1 (RRHH) con Módulo 2 (Flota).
   */
  async canAssignTrip(
    choferId: string,
    equipoId: string,
    fechaHoraConsulta: string = new Date().toISOString(),
    requiredCapM3?: number
  ): Promise<{
    canAssign: boolean;
    motivoBloqueo?: string;
    equipoStatus: EquipmentAvailabilityResult;
    choferStatus: any;
  }> {
    const equipoRes = await this.canAssignEquipment(equipoId, fechaHoraConsulta, requiredCapM3);
    const choferRes = await hrAvailabilityService.canAssignEmployee(choferId, fechaHoraConsulta, 'mixer');

    if (!equipoRes.disponible) {
      return {
        canAssign: false,
        motivoBloqueo: `Bloqueo de Equipo: ${equipoRes.motivo}`,
        equipoStatus: equipoRes,
        choferStatus: choferRes
      };
    }

    if (!choferRes.disponible) {
      return {
        canAssign: false,
        motivoBloqueo: `Bloqueo de Personal: ${choferRes.motivo}`,
        equipoStatus: equipoRes,
        choferStatus: choferRes
      };
    }

    return {
      canAssign: true,
      equipoStatus: equipoRes,
      choferStatus: choferRes
    };
  }
}

export const fleetAvailabilityService = new FleetAvailabilityService();
