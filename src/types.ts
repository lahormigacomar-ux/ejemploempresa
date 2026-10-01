export type UserRole = 'admin' | 'dispatcher' | 'plant_operator' | 'lab' | 'sales' | 'maintenance' | 'client';

export interface Empresa {
  id: string;
  razonSocial: string;
  cuit: string;
  direccion: string;
}

export interface Planta {
  id: string;
  empresaId: string;
  nombre: string;
  codigo: string;
  ubicacion: string;
  capacidadM3Hora: number;
}

export interface CentroCosto {
  id: string;
  codigo: string;
  nombre: string;
  tipo: 'hormigon' | 'aridos' | 'premoldeados' | 'transporte' | 'taller' | 'administracion' | 'planta';
  padreId?: string;
}

// ==========================================
// MÓDULO 1: PERSONAL & RRHH
// ==========================================
export type RolPersonal =
  | 'chofer_mixer'
  | 'chofer_bomba'
  | 'chofer_camion'
  | 'maquinista'
  | 'operador_planta'
  | 'mecanico'
  | 'ayudante_mecanico'
  | 'laboratorista'
  | 'administrativo'
  | 'vendedor'
  | 'compras'
  | 'encargado'
  | 'supervisor'
  | 'sereno'
  | 'otro';

export interface HabilitacionEquipo {
  equipoTipo: string;
  habilitado: boolean;
  fechaVencimiento?: string;
  certificadoNro?: string;
}

export interface DocumentoEmpleado {
  id: string;
  empleadoId: string;
  tipo: 'dni' | 'cuil' | 'licencia' | 'linti' | 'psicofisico' | 'art' | 'capacitacion' | 'contrato' | 'otro';
  numero: string;
  fechaEmision: string;
  fechaVencimiento?: string;
  archivoUrl?: string;
  estado: 'vigente' | 'proximo_vencimiento' | 'vencido';
  bloqueanteOperativo: boolean;
  observaciones?: string;
}

export interface HistorialLaboral {
  id: string;
  empleadoId: string;
  fechaVigenciaDesde: string;
  fechaVigenciaHasta?: string;
  sueldoBasico: number;
  categoria: string;
  puesto: string;
  centroCostoId?: string;
  plantaId?: string;
  motivoCambio: string;
  usuarioRegistro?: string;
  createdAt: string;
}

export interface Empleado {
  id: string;
  empresaId: string;
  legajo: string;
  nombre: string;
  apellido: string;
  dni: string;
  cuil: string;
  fechaNacimiento?: string;
  fechaIngreso: string;
  fechaAntiguedadReconocida?: string;
  fechaEgreso?: string;
  motivoEgreso?: string;
  estado: 'ACTIVO' | 'LICENCIA' | 'VACACIONES' | 'SUSPENDIDO' | 'BAJA';
  categoria: string;
  convenio: string;
  plantaHabitualId?: string;
  centroCostoHabitualId?: string;
  banco?: string;
  cbuAlias?: string;
  telefono?: string;
  email?: string;
  domicilio?: string;
  contactoEmergencia?: string;
  telefonoEmergencia?: string;
  sueldoBasico: number;
  roles: RolPersonal[];
  licenciaConducir?: {
    nro: string;
    categoria: string;
    vencimiento: string;
    lintiVencimiento?: string;
    psicofisicoVencimiento?: string;
  };
  habilitacionesEquipos: HabilitacionEquipo[];
  documentos: DocumentoEmpleado[];
}

export interface TurnoLaboral {
  id: string;
  codigo: string;
  nombre: string;
  horaEntrada: string;
  horaSalida: string;
  cruzaMedianoche: boolean;
  toleranciaTardanzaMin: number;
  activo: boolean;
}

export interface FichadaAsistencia {
  id: string;
  empleadoId: string;
  fecha: string;
  hora: string;
  tipo: 'ENTRADA' | 'SALIDA' | 'INICIO_DESCANSO' | 'FIN_DESCANSO';
  origen: 'MANUAL' | 'RELOJ_BIOMETRICO' | 'APP_CHOFER';
  usuarioRegistro?: string;
  createdAt?: string;
}

export interface JornadaLaboral {
  id: string;
  empleadoId: string;
  fecha: string;
  turnoId?: string;
  horasPresencia: number;
  horasDescanso: number;
  horasNormales: number;
  horasExtra50: number;
  horasExtra100: number;
  horasNocturnas: number;
  tardanzaMinutos: number;
  estado: 'CALCULADA' | 'REVISADA' | 'APROBADA' | 'OBSERVADA';
}

export interface HoraExtraRegistro {
  id: string;
  jornadaId?: string;
  empleadoId: string;
  fecha: string;
  horas: number;
  tipo: 'EXTRA_50' | 'EXTRA_100' | 'NOCTURNA_EXTRA';
  estado: 'CALCULADA' | 'PENDIENTE_APROBACION' | 'APROBADA' | 'RECHAZADA';
  responsableAprobacion?: string;
  fechaAprobacion?: string;
  motivoRechazo?: string;
}

export interface NovedadPersonal {
  id: string;
  empleadoId: string;
  tipo: 'VACACIONES' | 'LICENCIA_MEDICA' | 'ART_ACCIDENTE' | 'ESTUDIO' | 'SUSPENSION' | 'FRANCO' | 'OTRO';
  fechaDesde: string;
  fechaHasta: string;
  conGoceSueldo: boolean;
  diasTotales: number;
  documentoAdjuntoUrl?: string;
  observaciones?: string;
  estado: 'SOLICITADA' | 'APROBADA' | 'RECHAZADA' | 'TOMADA';
  usuarioAprobacion?: string;
}

export interface Adelanto {
  id: string;
  empleadoId: string;
  fechaSolicitud: string;
  importe: number;
  motivo?: string;
  estado: 'SOLICITADO' | 'APROBADO' | 'PAGADO' | 'DESCONTADO' | 'ANULADO';
  liquidacionId?: string;
  fechaPago?: string;
  usuarioAprobacion?: string;
}

export interface PrestamoCuota {
  id: string;
  prestamoId: string;
  numeroCuota: number;
  importe: number;
  periodoDescuento: string;
  estado: 'PENDIENTE' | 'DESCONTADA' | 'CANCELADA_ANTICIPADA';
  liquidacionId?: string;
}

export interface Prestamo {
  id: string;
  empleadoId: string;
  montoTotal: number;
  cantidadCuotas: number;
  importeCuota: number;
  fechaInicio: string;
  saldoPendiente: number;
  estado: 'SOLICITADO' | 'ACTIVO' | 'CANCELADO' | 'ANULADO';
  cuotas: PrestamoCuota[];
}

export interface ConceptoLiquidacion {
  id: string;
  codigo: string;
  nombre: string;
  tipo: 'REMUNERATIVO' | 'NO_REMUNERATIVO' | 'DESCUENTO' | 'CONTRIBUCION_PATRONAL';
  modoCalculo: 'PORCENTAJE' | 'FIJO' | 'FORMULA' | 'DIARIO_HORA';
  porcentaje?: number;
  importeFijo?: number;
  baseCalculo?: string;
  vigenciaDesde: string;
  vigenciaHasta?: string;
  convenio?: string;
  impactaSAC: boolean;
  impactaVacaciones: boolean;
  activo: boolean;
}

export interface ReglaSalarialVersionada {
  id: string;
  version: string;
  vigenciaDesde: string;
  vigenciaHasta?: string;
  horasBaseMensuales: number;
  coefCargasPatronales: number;
  coefART: number;
  observaciones?: string;
}

export interface LiquidacionDetalle {
  id: string;
  liquidacionId: string;
  conceptoCodigo: string;
  conceptoNombre: string;
  tipo: 'REMUNERATIVO' | 'NO_REMUNERATIVO' | 'DESCUENTO' | 'CONTRIBUCION_PATRONAL';
  cantidad: number;
  unidad: string;
  baseCalculo: number;
  porcentaje: number;
  haberes: number;
  descuentos: number;
  orden: number;
}

export interface LiquidacionSueldo {
  id: string;
  periodo: string;
  tipo: 'MENSUAL' | 'QUINCENAL' | 'SAC' | 'VACACIONES' | 'FINAL' | 'ESPECIAL';
  empleadoId: string;
  sueldoBasico: number;
  totalRemunerativo: number;
  totalNoRemunerativo: number;
  totalDescuentos: number;
  netoAPagar: number;
  contribucionesPatronales: number;
  costoTotalEmpresa: number;
  estado: 'BORRADOR' | 'CALCULADA' | 'REVISADA' | 'APROBADA' | 'CERRADA' | 'PAGADA' | 'ANULADA';
  fechaCierre?: string;
  usuarioCierre?: string;
  detalles: LiquidacionDetalle[];
  snapshotJson?: string;
}

export interface ImputacionCostoLaboral {
  id: string;
  eventId: string;
  empleadoId: string;
  fecha: string;
  centroCostoId: string;
  origenModulo: 'LOGISTICA_VIAJE' | 'TALLER_OT' | 'ARIDOS_MAQUINARIA' | 'PRODUCCION_PLANTA' | 'MANUAL';
  origenId: string;
  equipoId?: string;
  horasImputadas: number;
  costoHorarioAplicado: number;
  costoTotalImputado: number;
  periodoImputacion: string;
  createdAt: string;
}

export interface AuditoriaSistema {
  id: string;
  fechaHora: string;
  usuarioId?: string;
  usuarioNombre: string;
  entidad: string;
  registroId: string;
  accion: string;
  valorAnterior?: any;
  valorNuevo?: any;
  motivo?: string;
}

export interface AvailabilityResult {
  disponible: boolean;
  bloqueante: boolean;
  codigoMotivo?: 'OK' | 'INACTIVO' | 'LICENCIA_CONDUCIR_VENCIDA' | 'DOC_BLOQUEANTE_VENCIDO' | 'NOVEDAD_ACTIVA' | 'SIN_HABILITACION_EQUIPO' | 'ASIGNACION_CONFLICTIVA';
  motivo?: string;
  restricciones: string[];
}

// ==========================================
// MÓDULO 2: FLOTA Y MAQUINARIA OPERATIVA
// ==========================================

export type TipoEquipo =
  | 'MIXER'
  | 'CAMION'
  | 'BOMBA_HORMIGON'
  | 'CARGADORA'
  | 'EXCAVADORA'
  | 'RETROEXCAVADORA'
  | 'MINICARGADORA'
  | 'AUTOELEVADOR'
  | 'CAMIONETA'
  | 'AUTO'
  | 'SEMIRREMOLQUE'
  | 'GRUPO_ELECTROGENO'
  | 'MAQUINARIA'
  | 'OTRO';

export type EstadoOperativoEquipo =
  | 'DISPONIBLE'
  | 'ASIGNADO'
  | 'EN_OPERACION'
  | 'EN_VIAJE'
  | 'EN_TALLER'
  | 'FUERA_SERVICIO'
  | 'MANTENIMIENTO_PROGRAMADO'
  | 'RESERVADO'
  | 'BAJA';

export type EstadoAdministrativoEquipo =
  | 'ACTIVO'
  | 'EN_PROCESO_ALTA'
  | 'EN_TRAMITE_BAJA'
  | 'BAJA_DEFINITIVA'
  | 'VENDIDO';

export type TipoPropiedadEquipo = 'PROPIO' | 'ALQUILADO' | 'LEASING' | 'TERCERO';

export interface EspecificacionesEquipo {
  pesoVacioKg?: number;
  taraKg?: number;
  capacidadCargaKg?: number;
  capacidadTanqueCombustibleLt?: number;
  tipoCombustible: 'DIESEL' | 'NAFTA' | 'GNC' | 'ELECTRICO' | 'HIBRIDO' | 'OTRO';
  potenciaHp?: number;
  cantidadEjes: number;
  tipoTraccion?: string; // '4x2', '6x4', '8x4', 'Oruga'
  
  // Mixer
  capacidadTamborM3?: number;
  capacidadOperativaM3?: number;
  marcaTambor?: string;
  modeloTambor?: string;

  // Bomba de hormigón
  alcanceVerticalMts?: number;
  alcanceHorizontalMts?: number;
  caudalMaximoM3Hora?: number;

  // Maquinaria Cantera / Áridos
  capacidadBaldeM3?: number;
  pesoOperativoKg?: number;
}

export interface LecturaContador {
  id: string;
  equipoId: string;
  fechaHora: string;
  tipoContador: 'ODOMETRO_KM' | 'HOROMETRO_HS';
  valor: number;
  origenLectura: 'MANUAL' | 'VIAJE' | 'TALLER' | 'TELEMETRIA' | 'GPS' | 'IMPORTACION';
  referenciaOrigenId?: string;
  usuarioRegistro?: string;
  observaciones?: string;
}

export interface DocumentoEquipo {
  id: string;
  equipoId: string;
  tipoDocumento:
    | 'CEDULA_IDENTIFICACION'
    | 'SEGURO_AUTOMOTOR'
    | 'RTO_VTV'
    | 'HABILITACION_SENASA'
    | 'HABILITACION_MUNICIPAL'
    | 'PERMISO_CARGA_PESADA'
    | 'POLIZA_SEGURO'
    | 'CERTIFICADO_CALIBRACION'
    | 'OTRO';
  numero: string;
  entidadEmisora?: string;
  fechaEmision: string;
  fechaVencimiento?: string;
  bloqueanteOperativo: boolean;
  archivoUrl?: string;
  estado: 'vigente' | 'proximo_vencimiento' | 'vencido';
  observaciones?: string;
}

export interface SeguroEquipo {
  id: string;
  equipoId: string;
  companiaAseguradora: string;
  numeroPoliza: string;
  tipoCobertura: string;
  vigenciaDesde: string;
  vigenciaHasta: string;
  sumaAseguradaUsd?: number;
  contactoProductor?: string;
  activo: boolean;
}

export interface AsignacionPersonalEquipo {
  id: string;
  equipoId: string;
  empleadoId: string;
  fechaDesde: string;
  fechaHasta?: string;
  tipoAsignacion: 'HABITUAL' | 'TEMPORAL' | 'RELEVO' | 'PRUEBA';
  origen: string;
  estado: 'ACTIVA' | 'FINALIZADA' | 'CANCELADA';
  observaciones?: string;
}

export interface Equipo {
  id: string;
  empresaId: string;
  codigoInterno: string; // ej: MIX-12
  tipoEquipo: TipoEquipo;
  subtipo?: string;
  marca: string;
  modelo: string;
  version?: string;
  anio: number;
  dominioPatente?: string;
  numeroChasis?: string;
  numeroMotor?: string;
  numeroSerie?: string;
  color?: string;
  descripcion?: string;

  estadoAdministrativo: EstadoAdministrativoEquipo;
  estadoOperativo: EstadoOperativoEquipo;

  tipoPropiedad: TipoPropiedadEquipo;
  propietarioRazonSocial?: string;
  costoMensualAlquiler?: number;

  plantaHabitualId?: string;
  centroCostoHabitualId: string;
  ubicacionActualTipo: 'PLANTA' | 'OBRA' | 'CANTERA' | 'TALLER' | 'EN_TRANSITO' | 'OTRA';
  ubicacionActualReferencia?: string;

  odometroKmActual: number;
  horometroHsActual: number;
  fechaUltimaLectura?: string;

  especificaciones: EspecificacionesEquipo;
  documentos: DocumentoEquipo[];
  seguroVigente?: SeguroEquipo;
  operadorAsignadoActual?: {
    empleadoId: string;
    nombreCompleto: string;
    tipoAsignacion: 'HABITUAL' | 'TEMPORAL' | 'RELEVO';
    fechaDesde: string;
  };

  /**
   * =========================================================================
   * CAMPOS DE COMPATIBILIDAD LEGACY (OBSOLETOS / DEPRECATED)
   * Reservados temporalmente para no romper componentes existentes en transición.
   * El código nuevo de los módulos 2 en adelante DEBE consumir los campos canónicos arriba definidos.
   * =========================================================================
   */
  /** @deprecated Utilizar `codigoInterno` */
  codigo: string;
  /** @deprecated Utilizar `tipoEquipo` */
  tipo: string;
  /** @deprecated Utilizar `dominioPatente` */
  dominio: string;
  /** @deprecated Utilizar `${marca} ${modelo}` */
  marcaModelo: string;
  /** @deprecated Utilizar `odometroKmActual` */
  kmActual: number;
  /** @deprecated Utilizar `horometroHsActual` */
  horometroActual: number;
  /** @deprecated Utilizar `especificaciones.capacidadTamborM3` */
  capacidadM3?: number;
  /** @deprecated Utilizar `estadoOperativo` */
  estado: string;
  /** @deprecated Utilizar `centroCostoHabitualId` */
  centroCostoId: string;
}

export interface EquipmentAvailabilityResult {
  disponible: boolean;
  bloqueante: boolean;
  codigoMotivo?: 'OK' | 'FUERA_SERVICIO' | 'EN_TALLER' | 'DOC_BLOQUEANTE_VENCIDO' | 'SEGURO_VENCIDO' | 'ASIGNACION_EN_CURSO' | 'EQUIPO_RESERVADO' | 'TIPO_INCOMPATIBLE' | 'CAPACIDAD_INSUFICIENTE' | 'NO_EXISTE' | 'INACTIVO_ADMINISTRATIVO';
  motivo?: string;
  restricciones: string[];
}

// ==========================================
// OTROS MÓDULOS DEL ERP
// ==========================================
export interface Articulo {
  id: string;
  codigo: string;
  nombre: string;
  categoria: 'materia_prima' | 'repuesto' | 'combustible' | 'insumo' | 'producto_terminado' | 'premoldeado' | 'arido';
  unidadMedida: 'kg' | 't' | 'lt' | 'm3' | 'u' | 'hs';
  stockActual: number;
  stockMinimo: number;
  costoUnitario: number;
}

export interface Cliente {
  id: string;
  razonSocial: string;
  cuit: string;
  condicionIva: string;
  limiteCredito: number;
  saldoActual: number;
  obras: Obra[];
}

export interface Obra {
  id: string;
  clienteId: string;
  nombre: string;
  direccion: string;
  lat: number;
  lng: number;
  distanciaKm: number;
  contacto: string;
}

export interface Pedido {
  id: string;
  codigo: string;
  clienteId: string;
  obraId: string;
  productoId: string;
  cantidadM3: number;
  precioUnitario: number;
  estado: 'borrador' | 'pendiente_aprobacion' | 'aprobado' | 'programado' | 'en_ejecucion' | 'completado' | 'cancelado';
  fechaProgramada: string;
  horario: string;
  bombaRequerida: boolean;
  canalVenta: 'directo' | 'corralon' | 'tercero';
  terceroNombre?: string;
  comisionPorcentaje?: number;
}

export interface Viaje {
  id: string;
  pedidoId: string;
  clienteId: string;
  obraId: string;
  plantaId: string;
  equipoId: string;
  choferId: string;
  cantidadM3: number;
  estado: 'pendiente' | 'asignado' | 'cargando' | 'en_viaje' | 'en_obra' | 'descargando' | 'regresando' | 'entregado';
  horaSalidaPlanta?: string;
  horaLlegadaObra?: string;
  horaRegreso?: string;
  remitoNro: string;
  gpsLat: number;
  gpsLng: number;
}

export interface ProduccionHormigon {
  id: string;
  viajeId?: string;
  plantaId: string;
  formulaId: string;
  m3Producidos: number;
  cementoTeoricoKg: number;
  cementoRealKg: number;
  arenaTeoricoKg: number;
  arenaRealKg: number;
  piedraTeoricoKg: number;
  piedraRealKg: number;
  aditivoTeoricoLt: number;
  aditivoRealLt: number;
  aguaRealLt: number;
  fechaHora: string;
}

export interface ProbetaLab {
  id: string;
  produccionId: string;
  codigoMuestra: string;
  fechaMoldeo: string;
  edadDiasDestino: 7 | 14 | 28;
  fechaRoturaPrevista: string;
  resistenciaEsperadaMpa: number;
  resistenciaRealMpa?: number;
  estado: 'pendiente' | 'rota' | 'vencida';
  resultado: 'aprobado' | 'observado' | 'rechazado';
}

// ==========================================
// MÓDULO 3: MANTENIMIENTO, TALLER & NEUMÁTICOS
// ==========================================

export type TipoMantenimiento = 'PREVENTIVO' | 'CORRECTIVO' | 'EMERGENCIA' | 'INSPECCION' | 'CAMPAÑA';

export type CategoriaFalla =
  | 'MOTOR'
  | 'TRANSMISION'
  | 'FRENOS'
  | 'ELECTRICO'
  | 'HIDRAULICO'
  | 'NEUMATICOS'
  | 'TAMBOR'
  | 'CHASIS'
  | 'SUSPENSION'
  | 'DIRECCION'
  | 'REFRIGERACION'
  | 'COMBUSTIBLE'
  | 'OTRO';

export type PrioridadOT = 'BAJA' | 'NORMAL' | 'ALTA' | 'URGENTE' | 'CRITICA';

export type EstadoOT =
  | 'BORRADOR'
  | 'ABIERTA'
  | 'DIAGNOSTICO'
  | 'ESPERANDO_REPUESTO'
  | 'PROGRAMADA'
  | 'EN_PROCESO'
  | 'PAUSADA'
  | 'TERMINADA'
  | 'CERRADA'
  | 'CANCELADA';

export type CausaRaiz =
  | 'DESGASTE_NORMAL'
  | 'FALTA_MANTENIMIENTO'
  | 'MAL_USO'
  | 'ROTURA_ACCIDENTAL'
  | 'FALLA_COMPONENTE'
  | 'CONTAMINACION'
  | 'SOBRECARGA'
  | 'DEFECTO_FABRICA'
  | 'OTRO';

export interface TareaOrdenTrabajo {
  id: string;
  ordenTrabajoId: string;
  descripcion: string;
  mecanicoAsignadoId?: string;
  horasEstimadas: number;
  horasReales: number;
  estado: 'PENDIENTE' | 'EN_PROCESO' | 'COMPLETADA' | 'CANCELADA';
  orden: number;
  observaciones?: string;
}

export interface ManoObraOT {
  id: string;
  ordenTrabajoId: string;
  empleadoId: string;
  mecanicoNombreSnapshot?: string;
  tareaId?: string;
  fecha: string;
  horaInicio?: string;
  horaFin?: string;
  horasTrabajadas: number;
  tipoTrabajo: string;
  costoHorarioSnapshot: number;
  costoTotalLaboral: number;
  observaciones?: string;
}

export interface ConsumoRepuestoOT {
  id: string;
  ordenTrabajoId: string;
  articuloId: string;
  codigoArticuloSnapshot?: string;
  descripcionSnapshot: string;
  cantidad: number;
  unidadMedida: string;
  costoUnitarioSnapshot: number;
  costoTotal: number;
  depositoId?: string;
  estadoSolicitud: 'SOLICITADO' | 'RESERVADO' | 'ENTREGADO' | 'CONSUMIDO' | 'DEVUELTO' | 'CANCELADO';
  fecha: string;
  usuarioRegistro?: string;
}

export interface ServicioExternoOT {
  id: string;
  ordenTrabajoId: string;
  proveedorId?: string;
  proveedorNombreSnapshot: string;
  descripcionServicio: string;
  numeroComprobante?: string;
  fecha: string;
  importe: number;
  observaciones?: string;
}

export interface ChecklistItem {
  id: string;
  checklistId: string;
  itemNombre: string;
  estado: 'OK' | 'OBSERVADO' | 'REQUIERE_REPARACION' | 'NO_APLICA';
  observacion?: string;
  tareaGeneradaId?: string;
}

export interface ChecklistMantenimiento {
  id: string;
  ordenTrabajoId: string;
  titulo: string;
  fechaInspeccion: string;
  inspectorId?: string;
  resultadoGeneral: 'APROBADO' | 'CON_OBSERVACIONES' | 'RECHAZADO';
  observaciones?: string;
  items: ChecklistItem[];
}

export interface OrdenTrabajo {
  id: string;
  empresaId: string;
  numeroOT: string; // ej: OT-000101
  equipoId: string; // FK -> flota_equipos(id)
  tipoMantenimiento: TipoMantenimiento;
  categoriaFalla: CategoriaFalla;
  prioridad: PrioridadOT;
  estado: EstadoOT;

  fechaSolicitud: string;
  fechaApertura: string;
  fechaProgramada?: string;
  fechaInicioReal?: string;
  fechaFinReal?: string;
  fechaCierre?: string;
  horasParadaEquipo: number;

  odometroAperturaKm: number;
  horometroAperturaHs: number;
  odometroCierreKm?: number;
  horometroCierreHs?: number;

  fallaReportada: string;
  diagnostico?: string;
  trabajoRealizado?: string;
  causaRaiz?: CausaRaiz;
  observaciones?: string;

  solicitanteId?: string;
  responsableTallerId?: string;
  centroCostoId: string;
  bloqueaEquipo: boolean;

  costoRepuestos: number;
  costoManoObra: number;
  costoServiciosTerceros: number;
  otrosCostos: number;
  costoTotal: number;

  tareas: TareaOrdenTrabajo[];
  personal: ManoObraOT[];
  repuestos: ConsumoRepuestoOT[];
  serviciosExternos: ServicioExternoOT[];
  checklist?: ChecklistMantenimiento;

  usuarioCreacion?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PlanMantenimiento {
  id: string;
  empresaId: string;
  codigo: string;
  nombre: string;
  tipoEquipoAplicable?: string;
  frecuenciaKm?: number;
  frecuenciaHoras?: number;
  frecuenciaMeses?: number;
  umbralAlertaKm: number;
  umbralAlertaHoras: number;
  umbralAlertaDias: number;
  descripcion?: string;
  activo: boolean;
}

export interface EquipoPlanMantenimiento {
  id: string;
  equipoId: string;
  planId: string;
  plan?: PlanMantenimiento;
  ultimoServiceKm: number;
  ultimoServiceHoras: number;
  ultimoServiceFecha?: string;
  proximoServiceKm?: number;
  proximoServiceHoras?: number;
  proximoServiceFecha?: string;
  estadoAlerta: 'OK' | 'PROXIMO' | 'VENCIDO';
  activo: boolean;
}

export type EstadoNeumatico = 'EN_STOCK' | 'INSTALADO' | 'EN_REPARACION' | 'RECAPADO' | 'BAJA';

export interface Neumatico {
  id: string;
  empresaId: string;
  codigoInterno: string; // ej: NEU-102
  marca: string;
  modelo: string;
  medida: string;
  numeroSerie?: string;
  dot?: string;
  estado: EstadoNeumatico;
  fechaCompra: string;
  costoCompra: number;
  costoAcumuladoReparaciones: number;
  costoTotalAcumulado: number;
  kmActualesTotales: number;
  profundidadDibujoMm: number;
  vecesRecapado: number;
  proveedorId?: string;

  equipoActualId?: string;
  posicionActual?: string;
  fechaInstalacionActual?: string;
  kmInstalacionActual?: number;
  observaciones?: string;
}

export interface MovimientoNeumatico {
  id: string;
  neumaticoId: string;
  equipoId?: string;
  tipoMovimiento:
    | 'INGRESO_COMPRA'
    | 'INSTALACION'
    | 'ROTACION'
    | 'DESMONTE'
    | 'ENVIO_REPARACION'
    | 'RETORNO_REPARACION'
    | 'ENVIO_RECAPADO'
    | 'RETORNO_RECAPADO'
    | 'BAJA';
  posicionOrigen?: string;
  posicionDestino?: string;
  fecha: string;
  kmEquipo: number;
  costoAsociado: number;
  motivo?: string;
  usuarioRegistro?: string;
}

export interface MedicionNeumatico {
  id: string;
  neumaticoId: string;
  fecha: string;
  kmLectura: number;
  presionPsi?: number;
  profundidadDibujoMm: number;
  desgasteIrregular: boolean;
  observaciones?: string;
  inspectorId?: string;
}

// Compatibilidad Legacy
export interface OrdenMantenimiento {
  id: string;
  equipoId: string;
  tipo: 'preventivo' | 'correctivo' | 'emergencia';
  fallaReportada: string;
  trabajoRealizado?: string;
  mecanicoId: string;
  costoTotal: number;
  estado: 'abierta' | 'en_proceso' | 'cerrada';
  fechaApertura: string;
  fechaCierre?: string;
}

export interface Factura {
  id: string;
  nroFactura: string;
  clienteId: string;
  fecha: string;
  vencimiento: string;
  subtotal: number;
  iva: number;
  total: number;
  estado: 'emitida' | 'pagada' | 'vencida' | 'anulada';
  remitoNros: string[];
}
