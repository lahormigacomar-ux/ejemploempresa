import { TurnoLaboral, FichadaAsistencia, JornadaLaboral, HoraExtraRegistro, NovedadPersonal } from '../types';
import { auditRepository } from './auditRepository';

class AttendanceRepository {
  private turnos: TurnoLaboral[] = [
    {
      id: 'tur-manana',
      codigo: 'T-MANANA',
      nombre: 'Planta Turno Mañana',
      horaEntrada: '06:00',
      horaSalida: '14:00',
      cruzaMedianoche: false,
      toleranciaTardanzaMin: 10,
      activo: true
    },
    {
      id: 'tur-tarde',
      codigo: 'T-TARDE',
      nombre: 'Planta Turno Tarde',
      horaEntrada: '14:00',
      horaSalida: '22:00',
      cruzaMedianoche: false,
      toleranciaTardanzaMin: 10,
      activo: true
    },
    {
      id: 'tur-noche',
      codigo: 'T-NOCHE',
      nombre: 'Planta Turno Noche (Cruza Medianoche)',
      horaEntrada: '22:00',
      horaSalida: '06:00',
      cruzaMedianoche: true,
      toleranciaTardanzaMin: 10,
      activo: true
    }
  ];

  private fichadas: FichadaAsistencia[] = [];
  private jornadas: Map<string, JornadaLaboral> = new Map();
  private horasExtra: HoraExtraRegistro[] = [];
  private novedades: NovedadPersonal[] = [
    {
      id: 'nov-vac-1',
      empleadoId: 'emp-3',
      tipo: 'VACACIONES',
      fechaDesde: '2026-10-15',
      fechaHasta: '2026-10-25',
      conGoceSueldo: true,
      diasTotales: 10,
      estado: 'APROBADA'
    }
  ];

  constructor() {
    this.seedPunches();
  }

  resetForTesting() {
    this.fichadas = [];
    this.jornadas.clear();
    this.horasExtra = [];
    this.novedades = [
      {
        id: 'nov-vac-1',
        empleadoId: 'emp-3',
        tipo: 'VACACIONES',
        fechaDesde: '2026-10-15',
        fechaHasta: '2026-10-25',
        conGoceSueldo: true,
        diasTotales: 10,
        estado: 'APROBADA'
      }
    ];
    this.seedPunches();
  }

  private seedPunches() {
    // Fichadas para emp-1 (Juan Pérez) - 06:02 a 16:30 con descanso 12:00 a 12:30
    this.fichadas.push(
      { id: 'f-1', empleadoId: 'emp-1', fecha: '2026-09-30', hora: '06:02', tipo: 'ENTRADA', origen: 'RELOJ_BIOMETRICO' },
      { id: 'f-2', empleadoId: 'emp-1', fecha: '2026-09-30', hora: '12:00', tipo: 'INICIO_DESCANSO', origen: 'RELOJ_BIOMETRICO' },
      { id: 'f-3', empleadoId: 'emp-1', fecha: '2026-09-30', hora: '12:30', tipo: 'FIN_DESCANSO', origen: 'RELOJ_BIOMETRICO' },
      { id: 'f-4', empleadoId: 'emp-1', fecha: '2026-09-30', hora: '16:30', tipo: 'SALIDA', origen: 'RELOJ_BIOMETRICO' }
    );
  }

  async getTurnos(): Promise<TurnoLaboral[]> {
    return [...this.turnos];
  }

  async getTurnoById(id: string): Promise<TurnoLaboral | null> {
    return this.turnos.find(t => t.id === id) || null;
  }

  async getPunches(empleadoId: string, fecha: string): Promise<FichadaAsistencia[]> {
    return this.fichadas.filter(f => f.empleadoId === empleadoId && f.fecha === fecha);
  }

  async savePunch(punch: FichadaAsistencia): Promise<void> {
    this.fichadas.push(punch);
  }

  async saveJornada(jornada: JornadaLaboral): Promise<void> {
    const key = `${jornada.empleadoId}_${jornada.fecha}`;
    this.jornadas.set(key, jornada);
  }

  async getJornada(empleadoId: string, fecha: string): Promise<JornadaLaboral | null> {
    const key = `${empleadoId}_${fecha}`;
    return this.jornadas.get(key) || null;
  }

  async getAllJornadas(): Promise<JornadaLaboral[]> {
    return Array.from(this.jornadas.values());
  }

  async addHoraExtra(he: HoraExtraRegistro): Promise<void> {
    this.horasExtra.push(he);
  }

  async getHorasExtra(empleadoId?: string, estado?: string): Promise<HoraExtraRegistro[]> {
    return this.horasExtra.filter(h => {
      if (empleadoId && h.empleadoId !== empleadoId) return false;
      if (estado && h.estado !== estado) return false;
      return true;
    });
  }

  async updateHoraExtraEstado(
    id: string,
    nuevoEstado: 'APROBADA' | 'RECHAZADA',
    responsableAprobacion: string,
    motivoRechazo?: string
  ): Promise<HoraExtraRegistro> {
    const he = this.horasExtra.find(h => h.id === id);
    if (!he) throw new Error(`Registro de Hora Extra ${id} no encontrado`);

    const estadoAnterior = he.estado;
    he.estado = nuevoEstado;
    he.responsableAprobacion = responsableAprobacion;
    he.fechaAprobacion = new Date().toISOString();
    if (motivoRechazo) he.motivoRechazo = motivoRechazo;

    await auditRepository.recordAction(
      'rrhh_horas_extra',
      id,
      `CAMBIO_ESTADO_HORA_EXTRA_${nuevoEstado}`,
      { estado: estadoAnterior },
      { estado: nuevoEstado, responsable: responsableAprobacion, motivo: motivoRechazo },
      motivoRechazo || 'Aprobación formal de horas extras',
      responsableAprobacion
    );

    return he;
  }

  async getNovedades(empleadoId?: string): Promise<NovedadPersonal[]> {
    if (empleadoId) {
      return this.novedades.filter(n => n.empleadoId === empleadoId);
    }
    return [...this.novedades];
  }

  async addNovedad(novedad: NovedadPersonal): Promise<void> {
    this.novedades.push(novedad);
  }
}

export const attendanceRepository = new AttendanceRepository();
