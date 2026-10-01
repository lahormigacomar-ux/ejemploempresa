import { AvailabilityResult } from '../types';
import { employeeRepository } from '../repositories/employeeRepository';
import { attendanceRepository } from '../repositories/attendanceRepository';

/**
 * SERVICIO CENTRAL DE DISPONIBILIDAD OPERATIVA (PARA LOGÍSTICA, TALLER Y OPERACIONES)
 * Garantiza privacidad: NO expone datos salariales, CBU ni deducciones a despachantes.
 */

export class HRAvailabilityService {
  /**
   * Consulta si un empleado está disponible para una asignación en fecha/hora específica.
   */
  async canAssignEmployee(
    empleadoId: string,
    fechaHoraConsulta: string, // ISO o 'YYYY-MM-DDTHH:mm:ss'
    requiredEquipmentType?: string,
    conflictingTripIds: string[] = []
  ): Promise<AvailabilityResult> {
    const empleado = await employeeRepository.getById(empleadoId);
    if (!empleado) {
      return {
        disponible: false,
        bloqueante: true,
        codigoMotivo: 'INACTIVO',
        motivo: 'Empleado no encontrado en el sistema',
        restricciones: ['NO_EXISTE']
      };
    }

    const restricciones: string[] = [];

    // 1. Estado del empleado
    if (empleado.estado !== 'ACTIVO') {
      return {
        disponible: false,
        bloqueante: true,
        codigoMotivo: 'INACTIVO',
        motivo: `Empleado en estado ${empleado.estado}`,
        restricciones: [`ESTADO_${empleado.estado}`]
      };
    }

    const fechaStr = fechaHoraConsulta.split('T')[0];

    // 2. Licencia de conducir vencida (Bloqueo absoluto para choferes)
    if (empleado.licenciaConducir) {
      if (empleado.licenciaConducir.vencimiento < fechaStr) {
        restricciones.push('LICENCIA_CONDUCIR_VENCIDA');
        return {
          disponible: false,
          bloqueante: true,
          codigoMotivo: 'LICENCIA_CONDUCIR_VENCIDA',
          motivo: `Licencia de conducir VENCIDA (${empleado.licenciaConducir.vencimiento}). Bloqueo operativo estricto.`,
          restricciones
        };
      }
    }

    // 3. Documentos bloqueantes vencidos (ej. Psicofísico o LINTI)
    const docBloqueanteVencido = empleado.documentos.find(
      d => d.bloqueanteOperativo && d.fechaVencimiento && d.fechaVencimiento < fechaStr
    );
    if (docBloqueanteVencido) {
      restricciones.push(`DOC_BLOQUEANTE_${docBloqueanteVencido.tipo.toUpperCase()}_VENCIDO`);
      return {
        disponible: false,
        bloqueante: true,
        codigoMotivo: 'DOC_BLOQUEANTE_VENCIDO',
        motivo: `Documento bloqueante ${docBloqueanteVencido.tipo.toUpperCase()} vencido (${docBloqueanteVencido.fechaVencimiento})`,
        restricciones
      };
    }

    // 4. Novedades activas (Vacaciones, Licencia médica, ART)
    const novedades = await attendanceRepository.getNovedades(empleadoId);
    const novedadActiva = novedades.find(
      n => n.estado === 'APROBADA' && fechaStr >= n.fechaDesde && fechaStr <= n.fechaHasta
    );
    if (novedadActiva) {
      restricciones.push(`NOVEDAD_${novedadActiva.tipo}`);
      return {
        disponible: false,
        bloqueante: true,
        codigoMotivo: 'NOVEDAD_ACTIVA',
        motivo: `No disponible por ${novedadActiva.tipo} (Desde ${novedadActiva.fechaDesde} hasta ${novedadActiva.fechaHasta})`,
        restricciones
      };
    }

    // 5. Habilitación para el tipo de equipo requerido
    if (requiredEquipmentType) {
      const hab = empleado.habilitacionesEquipos.find(h => h.equipoTipo === requiredEquipmentType);
      if (!hab || !hab.habilitado) {
        restricciones.push(`SIN_HABILITACION_${requiredEquipmentType.toUpperCase()}`);
        return {
          disponible: false,
          bloqueante: true,
          codigoMotivo: 'SIN_HABILITACION_EQUIPO',
          motivo: `El empleado no posee habilitación autorizada para operar: ${requiredEquipmentType}`,
          restricciones
        };
      }
      if (hab.fechaVencimiento && hab.fechaVencimiento < fechaStr) {
        restricciones.push(`HABILITACION_${requiredEquipmentType.toUpperCase()}_VENCIDA`);
        return {
          disponible: false,
          bloqueante: true,
          codigoMotivo: 'SIN_HABILITACION_EQUIPO',
          motivo: `Certificación para ${requiredEquipmentType} vencida el ${hab.fechaVencimiento}`,
          restricciones
        };
      }
    }

    // 6. Conflicto de asignación operativa existente
    if (conflictingTripIds.length > 0) {
      restricciones.push('ASIGNACION_EN_CURSO');
      return {
        disponible: false,
        bloqueante: true,
        codigoMotivo: 'ASIGNACION_CONFLICTIVA',
        motivo: `El chofer ya tiene asignado el viaje #${conflictingTripIds.join(', ')} en este horario.`,
        restricciones
      };
    }

    return {
      disponible: true,
      bloqueante: false,
      codigoMotivo: 'OK',
      motivo: 'Disponible para asignación operativa',
      restricciones: []
    };
  }
}

export const hrAvailabilityService = new HRAvailabilityService();
