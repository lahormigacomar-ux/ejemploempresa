import { AuditoriaSistema } from '../types';

class AuditRepository {
  private logs: AuditoriaSistema[] = [];

  constructor() {
    this.seedInitialData();
  }

  resetForTesting() {
    this.logs = [];
    this.seedInitialData();
  }

  private seedInitialData() {
    this.logs = [
      {
        id: 'aud-001',
        fechaHora: '2026-09-30T10:15:00Z',
        usuarioNombre: 'admin_central',
        entidad: 'rrhh_empleados',
        registroId: 'emp-1',
        accion: 'ACTUALIZACION_CATEGORIA',
        valorAnterior: { categoria: 'Oficial' },
        valorNuevo: { categoria: 'Oficial Conductor' },
        motivo: 'Reclasificación de puesto por antigüedad y licencia profesional'
      }
    ];
  }

  async getLogs(entidad?: string): Promise<AuditoriaSistema[]> {
    if (entidad) {
      return this.logs.filter(l => l.entidad === entidad);
    }
    return [...this.logs];
  }

  async recordAction(
    entidad: string,
    registroId: string,
    accion: string,
    valorAnterior: any,
    valorNuevo: any,
    motivo?: string,
    usuarioNombre: string = 'sistema_rrhh'
  ): Promise<AuditoriaSistema> {
    const log: AuditoriaSistema = {
      id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      fechaHora: new Date().toISOString(),
      usuarioNombre,
      entidad,
      registroId,
      accion,
      valorAnterior,
      valorNuevo,
      motivo
    };
    this.logs.unshift(log);
    return log;
  }
}

export const auditRepository = new AuditRepository();
