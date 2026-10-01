import {
  Equipo,
  LecturaContador,
  DocumentoEquipo,
  AsignacionPersonalEquipo,
  SeguroEquipo,
  EstadoOperativoEquipo,
  EstadoAdministrativoEquipo
} from '../types';
import { auditRepository } from './auditRepository';

class EquipmentRepository {
  private equipments: Map<string, Equipo> = new Map();
  private counterReadings: Map<string, LecturaContador[]> = new Map();
  private assignments: Map<string, AsignacionPersonalEquipo[]> = new Map();

  constructor() {
    this.seedInitialData();
  }

  resetForTesting() {
    this.equipments.clear();
    this.counterReadings.clear();
    this.assignments.clear();
    this.seedInitialData();
  }

  private seedInitialData() {
    const defaultEquipos: Equipo[] = [
      {
        id: 'eq-mix-12',
        empresaId: 'emp-1',
        codigoInterno: 'MIX-12',
        tipoEquipo: 'MIXER',
        subtipo: 'Camión Hormigonero 8m3',
        marca: 'Iveco',
        modelo: 'Tector 170E28',
        version: 'Ecoline 6x4',
        anio: 2022,
        dominioPatente: 'AB-123-CD',
        numeroChasis: '8A9TEST1234567890',
        numeroMotor: 'MOT-IVE-8941',
        color: 'Blanco / Amarillo Concretera',
        descripcion: 'Mixer 8m3 asignado a logística central hormigón',
        estadoAdministrativo: 'ACTIVO',
        estadoOperativo: 'DISPONIBLE',
        tipoPropiedad: 'PROPIO',
        plantaHabitualId: 'planta-1',
        centroCostoHabitualId: 'cc-transporte',
        ubicacionActualTipo: 'PLANTA',
        ubicacionActualReferencia: 'Planta Central Norte',
        odometroKmActual: 68500,
        horometroHsActual: 3400,
        fechaUltimaLectura: '2026-09-30T10:00:00Z',
        especificaciones: {
          capacidadTamborM3: 8.0,
          capacidadOperativaM3: 8.0,
          marcaTambor: 'Indumix',
          modeloTambor: 'IND-8000',
          tipoCombustible: 'DIESEL',
          capacidadTanqueCombustibleLt: 280,
          cantidadEjes: 3,
          tipoTraccion: '6x4',
          potenciaHp: 280,
          taraKg: 13500
        },
        documentos: [
          {
            id: 'doc-eq-1',
            equipoId: 'eq-mix-12',
            tipoDocumento: 'SEGURO_AUTOMOTOR',
            numero: 'POL-FED-9921',
            entidadEmisora: 'La Segunda Seguros',
            fechaEmision: '2026-01-01',
            fechaVencimiento: '2027-01-01',
            bloqueanteOperativo: true,
            estado: 'vigente'
          },
          {
            id: 'doc-eq-2',
            equipoId: 'eq-mix-12',
            tipoDocumento: 'RTO_VTV',
            numero: 'RTO-2026-88',
            entidadEmisora: 'VTV Norte',
            fechaEmision: '2026-03-10',
            fechaVencimiento: '2027-03-10',
            bloqueanteOperativo: true,
            estado: 'vigente'
          }
        ],
        seguroVigente: {
          id: 'seg-1',
          equipoId: 'eq-mix-12',
          companiaAseguradora: 'La Segunda Seguros',
          numeroPoliza: 'POL-FED-9921',
          tipoCobertura: 'Todo Riesgo Operativo con Franquicia',
          vigenciaDesde: '2026-01-01',
          vigenciaHasta: '2027-01-01',
          sumaAseguradaUsd: 185000,
          activo: true
        },
        operadorAsignadoActual: {
          empleadoId: 'emp-1',
          nombreCompleto: 'Pérez, Juan',
          tipoAsignacion: 'HABITUAL',
          fechaDesde: '2026-01-10'
        },
        // Compatibilidad
        codigo: 'MIX-12',
        tipo: 'mixer',
        dominio: 'AB-123-CD',
        marcaModelo: 'Iveco Tector 170E28 (8m3)',
        kmActual: 68500,
        horometroActual: 3400,
        capacidadM3: 8.0,
        estado: 'disponible',
        centroCostoId: 'cc-transporte'
      },
      {
        id: 'eq-mix-14',
        empresaId: 'emp-1',
        codigoInterno: 'MIX-14',
        tipoEquipo: 'MIXER',
        subtipo: 'Camión Hormigonero 10m3',
        marca: 'Mercedes-Benz',
        modelo: 'Actros 4144',
        version: '8x4 Pesado',
        anio: 2023,
        dominioPatente: 'AF-456-GH',
        numeroChasis: 'WDB9341234567890',
        numeroMotor: 'MOT-MB-4412',
        color: 'Blanco',
        descripcion: 'Mixer 10m3 para grandes coladas de pavimento y losas',
        estadoAdministrativo: 'ACTIVO',
        estadoOperativo: 'DISPONIBLE',
        tipoPropiedad: 'PROPIO',
        plantaHabitualId: 'planta-1',
        centroCostoHabitualId: 'cc-transporte',
        ubicacionActualTipo: 'PLANTA',
        ubicacionActualReferencia: 'Planta Central Norte',
        odometroKmActual: 42100,
        horometroHsActual: 2100,
        fechaUltimaLectura: '2026-09-30T09:00:00Z',
        especificaciones: {
          capacidadTamborM3: 10.0,
          capacidadOperativaM3: 10.0,
          marcaTambor: 'Liebherr',
          modeloTambor: 'HTM-1004',
          tipoCombustible: 'DIESEL',
          capacidadTanqueCombustibleLt: 330,
          cantidadEjes: 4,
          tipoTraccion: '8x4',
          potenciaHp: 440,
          taraKg: 16200
        },
        documentos: [
          {
            id: 'doc-eq-3',
            equipoId: 'eq-mix-14',
            tipoDocumento: 'SEGURO_AUTOMOTOR',
            numero: 'POL-SAN-4412',
            entidadEmisora: 'Sancor Seguros',
            fechaEmision: '2026-01-01',
            fechaVencimiento: '2027-01-01',
            bloqueanteOperativo: true,
            estado: 'vigente'
          }
        ],
        seguroVigente: {
          id: 'seg-2',
          equipoId: 'eq-mix-14',
          companiaAseguradora: 'Sancor Seguros',
          numeroPoliza: 'POL-SAN-4412',
          tipoCobertura: 'Todo Riesgo',
          vigenciaDesde: '2026-01-01',
          vigenciaHasta: '2027-01-01',
          sumaAseguradaUsd: 220000,
          activo: true
        },
        // Compatibilidad
        codigo: 'MIX-14',
        tipo: 'mixer',
        dominio: 'AF-456-GH',
        marcaModelo: 'Mercedes Benz Actros 8x4 (10m3)',
        kmActual: 42100,
        horometroActual: 2100,
        capacidadM3: 10.0,
        estado: 'disponible',
        centroCostoId: 'cc-transporte'
      },
      {
        id: 'eq-car-01',
        empresaId: 'emp-1',
        codigoInterno: 'CAR-01',
        tipoEquipo: 'CARGADORA',
        subtipo: 'Pala Cargadora Frontal de Cantera',
        marca: 'Caterpillar',
        modelo: '950 GC',
        version: 'Cantera Pesada',
        anio: 2021,
        numeroSerie: 'CAT0950GC99214',
        color: 'Amarillo Caterpillar',
        descripcion: 'Cargadora frontal para tolvas de agregados y alimentación de áridos',
        estadoAdministrativo: 'ACTIVO',
        estadoOperativo: 'EN_OPERACION',
        tipoPropiedad: 'PROPIO',
        plantaHabitualId: 'planta-2',
        centroCostoHabitualId: 'cc-aridos',
        ubicacionActualTipo: 'CANTERA',
        ubicacionActualReferencia: 'Cantera San José',
        odometroKmActual: 0,
        horometroHsActual: 5600,
        fechaUltimaLectura: '2026-09-30T08:00:00Z',
        especificaciones: {
          capacidadBaldeM3: 3.3,
          pesoOperativoKg: 18500,
          tipoCombustible: 'DIESEL',
          capacidadTanqueCombustibleLt: 290,
          potenciaHp: 241,
          cantidadEjes: 2,
          tipoTraccion: '4x4 Articulada'
        },
        documentos: [
          {
            id: 'doc-eq-4',
            equipoId: 'eq-car-01',
            tipoDocumento: 'POLIZA_SEGURO',
            numero: 'POL-MAQ-112',
            entidadEmisora: 'Federación Patronal',
            fechaEmision: '2026-01-01',
            fechaVencimiento: '2027-01-01',
            bloqueanteOperativo: true,
            estado: 'vigente'
          }
        ],
        operadorAsignadoActual: {
          empleadoId: 'emp-3',
          nombreCompleto: 'Díaz, Marcos',
          tipoAsignacion: 'HABITUAL',
          fechaDesde: '2025-06-01'
        },
        // Compatibilidad
        codigo: 'CAR-01',
        tipo: 'cargadora',
        dominio: 'MAQ-01',
        marcaModelo: 'Caterpillar 950GC',
        kmActual: 0,
        horometroActual: 5600,
        estado: 'trabajando',
        centroCostoId: 'cc-aridos'
      },
      {
        id: 'eq-bom-03',
        empresaId: 'emp-1',
        codigoInterno: 'BOM-03',
        tipoEquipo: 'BOMBA_HORMIGON',
        subtipo: 'Bomba Pluma Autopropulsada 36m',
        marca: 'Putzmeister',
        modelo: 'BSF 36-4.16 H',
        version: 'Chasis Scania P380',
        anio: 2020,
        dominioPatente: 'AE-789-JK',
        numeroChasis: 'YS2P380123456789',
        color: 'Blanco / Azul',
        descripcion: 'Bomba pluma para bombeo asistido de losas y columnas en altura',
        estadoAdministrativo: 'ACTIVO',
        estadoOperativo: 'DISPONIBLE',
        tipoPropiedad: 'PROPIO',
        plantaHabitualId: 'planta-1',
        centroCostoHabitualId: 'cc-transporte',
        ubicacionActualTipo: 'PLANTA',
        ubicacionActualReferencia: 'Planta Central Norte',
        odometroKmActual: 51200,
        horometroHsActual: 4100,
        fechaUltimaLectura: '2026-09-30T10:00:00Z',
        especificaciones: {
          alcanceVerticalMts: 35.6,
          alcanceHorizontalMts: 31.4,
          caudalMaximoM3Hora: 160,
          tipoCombustible: 'DIESEL',
          capacidadTanqueCombustibleLt: 300,
          cantidadEjes: 3,
          tipoTraccion: '6x4'
        },
        documentos: [
          {
            id: 'doc-eq-5',
            equipoId: 'eq-bom-03',
            tipoDocumento: 'SEGURO_AUTOMOTOR',
            numero: 'POL-BOM-883',
            entidadEmisora: 'Allianz',
            fechaEmision: '2026-01-01',
            fechaVencimiento: '2027-01-01',
            bloqueanteOperativo: true,
            estado: 'vigente'
          }
        ],
        // Compatibilidad
        codigo: 'BOM-03',
        tipo: 'bomba',
        dominio: 'AE-789-JK',
        marcaModelo: 'Putzmeister BSF 36-4',
        kmActual: 51200,
        horometroActual: 4100,
        estado: 'disponible',
        centroCostoId: 'cc-transporte'
      },
      {
        id: 'eq-mix-99',
        empresaId: 'emp-1',
        codigoInterno: 'MIX-99',
        tipoEquipo: 'MIXER',
        subtipo: 'Camión Mixer 8m3 en Reparación Mayor',
        marca: 'Iveco',
        modelo: 'Tector 260E28',
        anio: 2019,
        dominioPatente: 'AD-991-ZZ',
        estadoAdministrativo: 'ACTIVO',
        estadoOperativo: 'EN_TALLER',
        tipoPropiedad: 'PROPIO',
        plantaHabitualId: 'planta-1',
        centroCostoHabitualId: 'cc-transporte',
        ubicacionActualTipo: 'TALLER',
        ubicacionActualReferencia: 'Taller Mecánico Central',
        odometroKmActual: 114200,
        horometroHsActual: 6200,
        especificaciones: {
          capacidadTamborM3: 8.0,
          capacidadOperativaM3: 8.0,
          tipoCombustible: 'DIESEL',
          cantidadEjes: 3
        },
        documentos: [],
        // Compatibilidad
        codigo: 'MIX-99',
        tipo: 'mixer',
        dominio: 'AD-991-ZZ',
        marcaModelo: 'Iveco Tector 260E28 (En Taller)',
        kmActual: 114200,
        horometroActual: 6200,
        capacidadM3: 8.0,
        estado: 'mantenimiento',
        centroCostoId: 'cc-transporte'
      },
      {
        id: 'eq-mix-vencido',
        empresaId: 'emp-1',
        codigoInterno: 'MIX-08',
        tipoEquipo: 'MIXER',
        subtipo: 'Camión Mixer con Seguro Vencido',
        marca: 'Ford',
        modelo: 'Cargo 2629',
        anio: 2018,
        dominioPatente: 'AC-332-PP',
        estadoAdministrativo: 'ACTIVO',
        estadoOperativo: 'DISPONIBLE',
        tipoPropiedad: 'PROPIO',
        centroCostoHabitualId: 'cc-transporte',
        ubicacionActualTipo: 'PLANTA',
        odometroKmActual: 145000,
        horometroHsActual: 7800,
        especificaciones: {
          capacidadTamborM3: 8.0,
          tipoCombustible: 'DIESEL',
          cantidadEjes: 3
        },
        documentos: [
          {
            id: 'doc-venc-1',
            equipoId: 'eq-mix-vencido',
            tipoDocumento: 'SEGURO_AUTOMOTOR',
            numero: 'POL-VENCIDA-1',
            entidadEmisora: 'Seguros Rivadavia',
            fechaEmision: '2025-01-01',
            fechaVencimiento: '2026-08-01', // VENCIDO
            bloqueanteOperativo: true,
            estado: 'vencido'
          }
        ],
        // Compatibilidad
        codigo: 'MIX-08',
        tipo: 'mixer',
        dominio: 'AC-332-PP',
        marcaModelo: 'Ford Cargo 2629 (Seguro Vencido)',
        kmActual: 145000,
        horometroActual: 7800,
        capacidadM3: 8.0,
        estado: 'disponible',
        centroCostoId: 'cc-transporte'
      },
      {
        id: 'eq-cam-05',
        empresaId: 'emp-1',
        codigoInterno: 'CAM-05',
        tipoEquipo: 'CAMIONETA',
        subtipo: 'Pick-Up de Supervisión de Obras',
        marca: 'Toyota',
        modelo: 'Hilux 4x4 DX',
        anio: 2024,
        dominioPatente: 'AG-112-OP',
        estadoAdministrativo: 'ACTIVO',
        estadoOperativo: 'DISPONIBLE',
        tipoPropiedad: 'PROPIO',
        centroCostoHabitualId: 'cc-admin',
        ubicacionActualTipo: 'PLANTA',
        odometroKmActual: 18400,
        horometroHsActual: 0,
        especificaciones: {
          tipoCombustible: 'DIESEL',
          capacidadTanqueCombustibleLt: 80,
          cantidadEjes: 2,
          tipoTraccion: '4x4'
        },
        documentos: [],
        // Compatibilidad
        codigo: 'CAM-05',
        tipo: 'camioneta',
        dominio: 'AG-112-OP',
        marcaModelo: 'Toyota Hilux 4x4',
        kmActual: 18400,
        horometroActual: 0,
        estado: 'disponible',
        centroCostoId: 'cc-admin'
      }
    ];

    defaultEquipos.forEach(eq => {
      this.equipments.set(eq.id, eq);
      // Inicializar lecturas
      this.counterReadings.set(eq.id, [
        {
          id: `lec-${eq.id}-init`,
          equipoId: eq.id,
          fechaHora: '2026-09-01T08:00:00Z',
          tipoContador: eq.odometroKmActual > 0 ? 'ODOMETRO_KM' : 'HOROMETRO_HS',
          valor: eq.odometroKmActual > 0 ? eq.odometroKmActual - 1500 : eq.horometroHsActual - 100,
          origenLectura: 'MANUAL',
          observaciones: 'Lectura inicial de mes'
        },
        {
          id: `lec-${eq.id}-act`,
          equipoId: eq.id,
          fechaHora: '2026-09-30T08:00:00Z',
          tipoContador: eq.odometroKmActual > 0 ? 'ODOMETRO_KM' : 'HOROMETRO_HS',
          valor: eq.odometroKmActual > 0 ? eq.odometroKmActual : eq.horometroHsActual,
          origenLectura: 'MANUAL',
          observaciones: 'Última lectura registrada'
        }
      ]);

      if (eq.operadorAsignadoActual) {
        this.assignments.set(eq.id, [
          {
            id: `asig-${eq.id}-1`,
            equipoId: eq.id,
            empleadoId: eq.operadorAsignadoActual.empleadoId,
            fechaDesde: eq.operadorAsignadoActual.fechaDesde,
            tipoAsignacion: eq.operadorAsignadoActual.tipoAsignacion,
            origen: 'ASIGNACION_PLANILLA',
            estado: 'ACTIVA',
            observaciones: 'Asignación habitual de chofer'
          }
        ]);
      } else {
        this.assignments.set(eq.id, []);
      }
    });
  }

  async getAll(): Promise<Equipo[]> {
    return Array.from(this.equipments.values());
  }

  async getById(id: string): Promise<Equipo | null> {
    return this.equipments.get(id) || null;
  }

  async getByCodigo(codigoInterno: string): Promise<Equipo | null> {
    const list = Array.from(this.equipments.values());
    return list.find(e => e.codigoInterno === codigoInterno || e.codigo === codigoInterno) || null;
  }

  async changeOperationalStatus(
    equipoId: string,
    nuevoEstado: EstadoOperativoEquipo,
    motivo: string,
    usuarioNombre: string = 'sistema_flota'
  ): Promise<Equipo> {
    const eq = this.equipments.get(equipoId);
    if (!eq) throw new Error(`Equipo ${equipoId} no encontrado`);

    const estadoAnterior = eq.estadoOperativo;
    eq.estadoOperativo = nuevoEstado;
    eq.estado = nuevoEstado.toLowerCase(); // compatibilidad
    this.equipments.set(equipoId, eq);

    await auditRepository.recordAction(
      'flota_equipos',
      equipoId,
      'CAMBIO_ESTADO_OPERATIVO',
      { estadoOperativo: estadoAnterior },
      { estadoOperativo: nuevoEstado },
      motivo,
      usuarioNombre
    );

    return eq;
  }

  async addCounterReading(
    equipoId: string,
    tipoContador: 'ODOMETRO_KM' | 'HOROMETRO_HS',
    nuevoValor: number,
    origen: 'MANUAL' | 'VIAJE' | 'TALLER' | 'COMBUSTIBLE' | 'TELEMETRIA' | 'GPS' | 'IMPORTACION' = 'MANUAL',
    referenciaOrigenId?: string,
    usuarioRegistro?: string
  ): Promise<LecturaContador> {
    const eq = this.equipments.get(equipoId);
    if (!eq) throw new Error(`Equipo ${equipoId} no encontrado`);

    const valorActual = tipoContador === 'ODOMETRO_KM' ? eq.odometroKmActual : eq.horometroHsActual;
    if (nuevoValor < valorActual) {
      throw new Error(`Lectura no válida: El nuevo valor (${nuevoValor}) no puede ser menor al actual (${valorActual})`);
    }

    const lectura: LecturaContador = {
      id: `lec-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      equipoId,
      fechaHora: new Date().toISOString(),
      tipoContador,
      valor: nuevoValor,
      origenLectura: origen,
      referenciaOrigenId,
      usuarioRegistro
    };

    const history = this.counterReadings.get(equipoId) || [];
    history.push(lectura);
    this.counterReadings.set(equipoId, history);

    // Actualizar valor en el maestro
    if (tipoContador === 'ODOMETRO_KM') {
      eq.odometroKmActual = nuevoValor;
      eq.kmActual = nuevoValor;
    } else {
      eq.horometroHsActual = nuevoValor;
      eq.horometroActual = nuevoValor;
    }
    eq.fechaUltimaLectura = lectura.fechaHora;
    this.equipments.set(equipoId, eq);

    await auditRepository.recordAction(
      'flota_lecturas_contadores',
      lectura.id,
      `ACTUALIZACION_${tipoContador}`,
      { valorAnterior: valorActual },
      { nuevoValor, origen, referenciaOrigenId },
      `Actualización de contador ${tipoContador}`
    );

    return lectura;
  }

  async getCounterHistory(equipoId: string): Promise<LecturaContador[]> {
    return this.counterReadings.get(equipoId) || [];
  }

  async assignOperator(
    equipoId: string,
    empleadoId: string,
    nombreCompleto: string,
    tipoAsignacion: 'HABITUAL' | 'TEMPORAL' | 'RELEVO' = 'HABITUAL',
    motivo: string = 'Asignación operativa',
    usuarioRegistro: string = 'admin'
  ): Promise<AsignacionPersonalEquipo> {
    const eq = this.equipments.get(equipoId);
    if (!eq) throw new Error(`Equipo ${equipoId} no encontrado`);

    const history = this.assignments.get(equipoId) || [];
    // Finalizar asignación activa previa
    history.forEach(a => {
      if (a.estado === 'ACTIVA') {
        a.estado = 'FINALIZADA';
        a.fechaHasta = new Date().toISOString();
      }
    });

    const nuevaAsignacion: AsignacionPersonalEquipo = {
      id: `asig-${Date.now()}`,
      equipoId,
      empleadoId,
      fechaDesde: new Date().toISOString(),
      tipoAsignacion,
      origen: 'ASIGNACION_ERP',
      estado: 'ACTIVA',
      observaciones: motivo
    };

    history.push(nuevaAsignacion);
    this.assignments.set(equipoId, history);

    eq.operadorAsignadoActual = {
      empleadoId,
      nombreCompleto,
      tipoAsignacion,
      fechaDesde: nuevaAsignacion.fechaDesde
    };
    this.equipments.set(equipoId, eq);

    await auditRepository.recordAction(
      'flota_asignaciones_personal',
      nuevaAsignacion.id,
      'ASIGNACION_OPERADOR_EQUIPO',
      null,
      { equipoId, empleadoId, tipoAsignacion },
      motivo,
      usuarioRegistro
    );

    return nuevaAsignacion;
  }

  async getAssignmentHistory(equipoId: string): Promise<AsignacionPersonalEquipo[]> {
    return this.assignments.get(equipoId) || [];
  }
}

export const equipmentRepository = new EquipmentRepository();
