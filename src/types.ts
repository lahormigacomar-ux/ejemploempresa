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
  equipoTipoOrId: string; // e.g. 'mixer', 'cargadora', 'bomba'
  habilitado: boolean;
  fechaVencimiento?: string;
}

export interface DocumentoEmpleado {
  id: string;
  tipo: 'dni' | 'cuil' | 'licencia' | 'linti' | 'psicofisico' | 'art' | 'capacitacion' | 'contrato' | 'otro';
  numero: string;
  fechaEmision: string;
  fechaVencimiento: string;
  archivoUrl?: string;
  estado: 'vigente' | 'proximo_vencimiento' | 'vencido';
  bloqueanteOperativo: boolean;
}

export interface Empleado {
  id: string;
  legajo: string;
  nombre: string;
  apellido: string;
  dni: string;
  cuil: string;
  roles: RolPersonal[];
  categoria: string;
  convenio: string;
  fechaIngreso: string;
  telefono: string;
  email: string;
  domicilio: string;
  contactoEmergencia: string;
  telefonoEmergencia: string;
  estado: 'activo' | 'licencia' | 'vacaciones' | 'suspendido' | 'baja';
  sueldoBasico: number;
  centroCostoHabitualId: string;
  banco: string;
  cbu: string;
  // Habilitaciones específicas
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

export interface FichadaAsistencia {
  id: string;
  empleadoId: string;
  fecha: string;
  tipo: 'entrada' | 'salida' | 'inicio_descanso' | 'fin_descanso';
  hora: string;
  origen: 'manual' | 'fichador' | 'app';
  usuarioRegistro: string;
}

export interface JornadaLaboral {
  id: string;
  empleadoId: string;
  fecha: string;
  horasPresencia: number;
  horasNormales: number;
  horasExtra50: number;
  horasExtra100: number;
  tardanzaMinutos: number;
  estado: 'calculada' | 'aprobada' | 'observada';
}

export interface NovedadPersonal {
  id: string;
  empleadoId: string;
  tipo: 'ausencia' | 'enfermedad' | 'accidente' | 'vacaciones' | 'licencia' | 'tardanza' | 'premio' | 'descuento';
  desde: string;
  hasta: string;
  observaciones: string;
  estado: 'solicitada' | 'aprobada' | 'rechazada';
}

export interface AdelantoPrestamo {
  id: string;
  empleadoId: string;
  tipo: 'adelanto' | 'prestamo';
  importeTotal: number;
  cuotasTotal: number;
  cuotaActual: number;
  importeCuota: number;
  fecha: string;
  estado: 'solicitado' | 'aprobado' | 'pagado' | 'descontado' | 'anulado';
}

export interface ConceptoLiquidacion {
  id: string;
  codigo: string;
  nombre: string;
  tipo: 'remunerativo' | 'no_remunerativo' | 'descuento' | 'aporte' | 'contribucion';
  formulaCalculo?: string;
}

export interface LiquidacionSueldo {
  id: string;
  periodo: string; // '2026-09'
  empleadoId: string;
  sueldoBasico: number;
  totalRemunerativo: number;
  totalNoRemunerativo: number;
  totalDescuentos: number;
  netoAPagar: number;
  contribucionesPatronales: number;
  costoTotalEmpresa: number;
  estado: 'borrador' | 'calculada' | 'aprobada' | 'cerrada' | 'pagada';
}

export interface ImputacionCostoLaboral {
  id: string;
  empleadoId: string;
  fecha: string;
  centroCostoId: string;
  equipoId?: string;
  viajeId?: string;
  ordenTrabajoId?: string;
  horasImputadas: number;
  costoHorario: number;
  costoTotalImputado: number;
}

export interface Equipo {
  id: string;
  codigo: string;
  tipo: 'mixer' | 'camion' | 'bomba' | 'cargadora' | 'excavadora' | 'grupo_electrogeno' | 'otro';
  dominio: string;
  marcaModelo: string;
  anio: number;
  capacidadM3?: number;
  kmActual: number;
  horometroActual: number;
  estado: 'disponible' | 'trabajando' | 'mantenimiento' | 'fuera_servicio';
  centroCostoId: string;
}

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

