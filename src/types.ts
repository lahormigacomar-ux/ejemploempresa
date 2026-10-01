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

  // Compatibilidad con módulos existentes
  codigo: string;
  tipo: string;
  dominio: string;
  marcaModelo: string;
  kmActual: number;
  horometroActual: number;
  capacidadM3?: number;
  estado: string;
  centroCostoId: string;
}

export interface EquipmentAvailabilityResult {
  disponible: boolean;
  bloqueante: boolean;
  codigoMotivo?: 'OK' | 'FUERA_SERVICIO' | 'EN_TALLER' | 'DOC_BLOQUEANTE_VENCIDO' | 'SEGURO_VENCIDO' | 'ASIGNACION_EN_CURSO' | 'CAPACIDAD_INSUFICIENTE' | 'NO_EXISTE' | 'INACTIVO_ADMINISTRATIVO';
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
