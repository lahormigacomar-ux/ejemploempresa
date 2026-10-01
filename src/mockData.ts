import {
  Empresa,
  Planta,
  CentroCosto,
  Empleado,
  Equipo,
  Articulo,
  Cliente,
  Pedido,
  Viaje,
  ProduccionHormigon,
  ProbetaLab,
  OrdenMantenimiento,
  Factura
} from './types';

export const mockEmpresa: Empresa = {
  id: 'emp-1',
  razonSocial: 'Concretera del Sur S.A.',
  cuit: '30-71234567-9',
  direccion: 'Av. Circunvalación KM 14.5, Parque Industrial'
};

export const mockPlantas: Planta[] = [
  { id: 'planta-1', empresaId: 'emp-1', nombre: 'Planta Central (Hormigón)', codigo: 'PC01', ubicacion: 'Zona Industrial Norte', capacidadM3Hora: 90 },
  { id: 'planta-2', empresaId: 'emp-1', nombre: 'Planta Cantera Áridos', codigo: 'AC02', ubicacion: 'Cantera San José', capacidadM3Hora: 120 }
];

export const mockCentrosCosto: CentroCosto[] = [
  { id: 'cc-hormigon', codigo: 'CC-100', nombre: 'Producción Hormigón Elaborado', tipo: 'hormigon' },
  { id: 'cc-aridos', codigo: 'CC-200', nombre: 'Extracción y Procesamiento de Áridos', tipo: 'aridos' },
  { id: 'cc-premoldeados', codigo: 'CC-300', nombre: 'Fábrica de Premoldeados', tipo: 'premoldeados' },
  { id: 'cc-transporte', codigo: 'CC-400', nombre: 'Flota y Logística de Mixers', tipo: 'transporte' },
  { id: 'cc-taller', codigo: 'CC-500', nombre: 'Taller Mecánico Central', tipo: 'taller' },
  { id: 'cc-admin', codigo: 'CC-600', nombre: 'Administración y Estructura', tipo: 'administracion' }
];

export const mockEmpleados: Empleado[] = [
  {
    id: 'emp-1',
    empresaId: 'emp-1',
    legajo: '1001',
    nombre: 'Juan',
    apellido: 'Pérez',
    dni: '32145678',
    cuil: '20-32145678-9',
    roles: ['chofer_mixer'],
    categoria: 'Oficial Conductor Especializado',
    convenio: 'UOCRA / Choferes Hormigoneras',
    fechaIngreso: '2022-03-10',
    telefono: '+54 9 11 4567-8901',
    email: 'jperez@concretera.com',
    domicilio: 'Av. San Martín 1240, Tigre',
    contactoEmergencia: 'María Gómez (Esposa)',
    telefonoEmergencia: '+54 9 11 4567-8902',
    estado: 'ACTIVO',
    sueldoBasico: 1450000,
    centroCostoHabitualId: 'cc-transporte',
    banco: 'Banco Galicia',
    cbuAlias: '0070085120000012345678',
    licenciaConducir: {
      nro: '32145678',
      categoria: 'E1 / E2 (Articulados y Cargas Peligrosas)',
      vencimiento: '2027-05-12',
      lintiVencimiento: '2027-05-12',
      psicofisicoVencimiento: '2027-05-12'
    },
    habilitacionesEquipos: [
      { equipoTipo: 'mixer', habilitado: true, fechaVencimiento: '2027-05-12' },
      { equipoTipo: 'bomba', habilitado: false }
    ],
    documentos: [
      { id: 'doc-1', empleadoId: 'emp-1', tipo: 'licencia', numero: '32145678', fechaEmision: '2022-05-12', fechaVencimiento: '2027-05-12', estado: 'vigente', bloqueanteOperativo: true },
      { id: 'doc-2', empleadoId: 'emp-1', tipo: 'psicofisico', numero: 'PSI-9921', fechaEmision: '2022-05-12', fechaVencimiento: '2027-05-12', estado: 'vigente', bloqueanteOperativo: true }
    ]
  },
  {
    id: 'emp-2',
    empresaId: 'emp-1',
    legajo: '1002',
    nombre: 'Carlos',
    apellido: 'Gómez',
    dni: '28987654',
    cuil: '20-28987654-3',
    roles: ['chofer_mixer', 'chofer_camion'],
    categoria: 'Oficial Conductor',
    convenio: 'UOCRA / Choferes',
    fechaIngreso: '2020-06-15',
    telefono: '+54 9 11 5544-3322',
    email: 'cgomez@concretera.com',
    domicilio: 'Calle 9 de Julio 450, San Fernando',
    contactoEmergencia: 'Lucía Gómez',
    telefonoEmergencia: '+54 9 11 5544-3399',
    estado: 'ACTIVO',
    sueldoBasico: 1450000,
    centroCostoHabitualId: 'cc-transporte',
    banco: 'Banco Nación',
    cbuAlias: '0110599530000045678912',
    licenciaConducir: {
      nro: '28987654',
      categoria: 'E1',
      vencimiento: '2026-08-15', // Vencida
      lintiVencimiento: '2026-08-15',
      psicofisicoVencimiento: '2026-08-15'
    },
    habilitacionesEquipos: [
      { equipoTipo: 'mixer', habilitado: true, fechaVencimiento: '2026-08-15' }
    ],
    documentos: [
      { id: 'doc-3', empleadoId: 'emp-2', tipo: 'licencia', numero: '28987654', fechaEmision: '2021-08-15', fechaVencimiento: '2026-08-15', estado: 'vencido', bloqueanteOperativo: true }
    ]
  },
  {
    id: 'emp-3',
    empresaId: 'emp-1',
    legajo: '1003',
    nombre: 'Marcos',
    apellido: 'Díaz',
    dni: '25443322',
    cuil: '20-25443322-1',
    roles: ['maquinista'],
    categoria: 'Maquinista Vial Principal',
    convenio: 'UOCRA / Vialidad',
    fechaIngreso: '2019-01-10',
    telefono: '+54 9 11 7788-9900',
    email: 'mdiaz@concretera.com',
    domicilio: 'Ruta 24 KM 5, Benavídez',
    contactoEmergencia: 'Rosa Díaz',
    telefonoEmergencia: '+54 9 11 7788-9911',
    estado: 'ACTIVO',
    sueldoBasico: 1520000,
    centroCostoHabitualId: 'cc-aridos',
    banco: 'Banco Provincia',
    cbuAlias: '0140000703000078912345',
    habilitacionesEquipos: [
      { equipoTipo: 'cargadora', habilitado: true, fechaVencimiento: '2028-01-15' },
      { equipoTipo: 'excavadora', habilitado: true, fechaVencimiento: '2028-01-15' }
    ],
    documentos: [
      { id: 'doc-4', empleadoId: 'emp-3', tipo: 'capacitacion', numero: 'CAP-CAT-01', fechaEmision: '2023-01-15', fechaVencimiento: '2028-01-15', estado: 'vigente', bloqueanteOperativo: false }
    ]
  },
  {
    id: 'emp-5',
    empresaId: 'emp-1',
    legajo: '1005',
    nombre: 'Roberto',
    apellido: 'Sánchez',
    dni: '22111444',
    cuil: '20-22111444-5',
    roles: ['mecanico'],
    categoria: 'Mecánico Especializado Pesados',
    convenio: 'SMATA / Mecánicos',
    fechaIngreso: '2018-05-20',
    telefono: '+54 9 11 9988-7766',
    email: 'rsanchez@concretera.com',
    domicilio: 'Calle Perú 310, Escobar',
    contactoEmergencia: 'Silvia Morales',
    telefonoEmergencia: '+54 9 11 9988-7777',
    estado: 'ACTIVO',
    sueldoBasico: 1750000,
    centroCostoHabitualId: 'cc-taller',
    banco: 'Banco Santander',
    cbuAlias: '0720000720000011223344',
    habilitacionesEquipos: [],
    documentos: []
  }
];

export const mockEquipos: Equipo[] = [
  {
    id: 'eq-mix-12',
    empresaId: 'emp-1',
    codigoInterno: 'MIX-12',
    tipoEquipo: 'MIXER',
    subtipo: 'Camión Hormigonero 8m3',
    marca: 'Iveco',
    modelo: 'Tector 170E28',
    anio: 2022,
    dominioPatente: 'AB-123-CD',
    estadoAdministrativo: 'ACTIVO',
    estadoOperativo: 'DISPONIBLE',
    tipoPropiedad: 'PROPIO',
    centroCostoHabitualId: 'cc-transporte',
    ubicacionActualTipo: 'PLANTA',
    odometroKmActual: 68500,
    horometroHsActual: 3400,
    especificaciones: {
      capacidadTamborM3: 8.0,
      capacidadOperativaM3: 8.0,
      tipoCombustible: 'DIESEL',
      cantidadEjes: 3,
      tipoTraccion: '6x4'
    },
    documentos: [],
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
    anio: 2023,
    dominioPatente: 'AF-456-GH',
    estadoAdministrativo: 'ACTIVO',
    estadoOperativo: 'DISPONIBLE',
    tipoPropiedad: 'PROPIO',
    centroCostoHabitualId: 'cc-transporte',
    ubicacionActualTipo: 'PLANTA',
    odometroKmActual: 42100,
    horometroHsActual: 2100,
    especificaciones: {
      capacidadTamborM3: 10.0,
      capacidadOperativaM3: 10.0,
      tipoCombustible: 'DIESEL',
      cantidadEjes: 4,
      tipoTraccion: '8x4'
    },
    documentos: [],
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
    subtipo: 'Pala Cargadora Cantera',
    marca: 'Caterpillar',
    modelo: '950 GC',
    anio: 2021,
    estadoAdministrativo: 'ACTIVO',
    estadoOperativo: 'EN_OPERACION',
    tipoPropiedad: 'PROPIO',
    centroCostoHabitualId: 'cc-aridos',
    ubicacionActualTipo: 'CANTERA',
    odometroKmActual: 0,
    horometroHsActual: 5600,
    especificaciones: {
      capacidadBaldeM3: 3.3,
      pesoOperativoKg: 18500,
      tipoCombustible: 'DIESEL',
      cantidadEjes: 2
    },
    documentos: [],
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
    subtipo: 'Bomba Pluma 36m',
    marca: 'Putzmeister',
    modelo: 'BSF 36-4',
    anio: 2020,
    dominioPatente: 'AE-789-JK',
    estadoAdministrativo: 'ACTIVO',
    estadoOperativo: 'DISPONIBLE',
    tipoPropiedad: 'PROPIO',
    centroCostoHabitualId: 'cc-transporte',
    ubicacionActualTipo: 'PLANTA',
    odometroKmActual: 51200,
    horometroHsActual: 4100,
    especificaciones: {
      alcanceVerticalMts: 35.6,
      tipoCombustible: 'DIESEL',
      cantidadEjes: 3
    },
    documentos: [],
    codigo: 'BOM-03',
    tipo: 'bomba',
    dominio: 'AE-789-JK',
    marcaModelo: 'Putzmeister BSF 36-4',
    kmActual: 51200,
    horometroActual: 4100,
    estado: 'disponible',
    centroCostoId: 'cc-transporte'
  }
];

export const mockArticulos: Articulo[] = [
  { id: 'art-cem', codigo: 'CEM-01', nombre: 'Cemento Portland Normal (CPN 40) - Granel', categoria: 'materia_prima', unidadMedida: 'kg', stockActual: 85000, stockMinimo: 20000, costoUnitario: 145 },
  { id: 'art-arena', codigo: 'ARI-01', nombre: 'Arena Fina de Río Lavada', categoria: 'arido', unidadMedida: 't', stockActual: 1240, stockMinimo: 300, costoUnitario: 12500 },
  { id: 'art-piedra', codigo: 'ARI-02', nombre: 'Piedra Partida 6-20 (Granitica)', categoria: 'arido', unidadMedida: 't', stockActual: 1850, stockMinimo: 400, costoUnitario: 14200 },
  { id: 'art-aditivo', codigo: 'ADI-01', nombre: 'Aditivo Plastificante / Reductor de Agua', categoria: 'materia_prima', unidadMedida: 'lt', stockActual: 3200, stockMinimo: 800, costoUnitario: 890 },
  { id: 'art-gasoil', codigo: 'COM-01', nombre: 'Gasoil Grado 2 (YPF)', categoria: 'combustible', unidadMedida: 'lt', stockActual: 15000, stockMinimo: 4000, costoUnitario: 1180 }
];

export const mockClientes: Cliente[] = [
  {
    id: 'cli-1',
    razonSocial: 'Constructora Austral S.A.',
    cuit: '30-68999888-1',
    condicionIva: 'Responsable Inscripto',
    limiteCredito: 45000000,
    saldoActual: 12400000,
    obras: [
      { id: 'obra-1', clienteId: 'cli-1', nombre: 'Torres del Parque (Edificio 18 pisos)', direccion: 'Av. Libertador 4500', lat: -34.6037, lng: -58.3816, distanciaKm: 12.5, contacto: 'Ing. Mendez (11-4455-6677)' },
      { id: 'obra-2', clienteId: 'cli-1', nombre: 'Centro Comercial Boulevard', direccion: 'Ruta Panamericana KM 38', lat: -34.4522, lng: -58.7891, distanciaKm: 28.0, contacto: 'Arq. Roldán (11-9988-7766)' }
    ]
  },
  {
    id: 'cli-2',
    razonSocial: 'Desarrollos Urbanos del Plata SRL',
    cuit: '30-71122334-9',
    condicionIva: 'Responsable Inscripto',
    limiteCredito: 25000000,
    saldoActual: 4500000,
    obras: [
      { id: 'obra-3', clienteId: 'cli-2', nombre: 'Complejo Las Acacias (Bº Cerrado)', direccion: 'Camino de los Remeros Lote 45', lat: -34.4121, lng: -58.6123, distanciaKm: 19.0, contacto: 'Sr. Benítez (11-2233-4455)' }
    ]
  }
];

export const mockPedidos: Pedido[] = [
  {
    id: 'ped-1',
    codigo: 'PED-8942',
    clienteId: 'cli-1',
    obraId: 'obra-1',
    productoId: 'H30 - Bombeable (Asistido)',
    cantidadM3: 42,
    precioUnitario: 145000,
    estado: 'programado',
    fechaProgramada: '2026-10-01',
    horario: '08:30',
    bombaRequerida: true,
    canalVenta: 'directo'
  },
  {
    id: 'ped-2',
    codigo: 'PED-8943',
    clienteId: 'cli-1',
    obraId: 'obra-2',
    productoId: 'H25 - H. Elaborado Tradicional',
    cantidadM3: 28,
    precioUnitario: 128000,
    estado: 'en_ejecucion',
    fechaProgramada: '2026-10-01',
    horario: '10:00',
    bombaRequerida: false,
    canalVenta: 'directo'
  }
];

export const mockViajes: Viaje[] = [
  {
    id: 'viaje-1',
    pedidoId: 'ped-2',
    clienteId: 'cli-1',
    obraId: 'obra-2',
    plantaId: 'planta-1',
    equipoId: 'eq-1',
    choferId: 'emp-1',
    cantidadM3: 8,
    estado: 'en_obra',
    horaSalidaPlanta: '09:45',
    horaLlegadaObra: '10:25',
    remitoNro: '0001-00049281',
    gpsLat: -34.4522,
    gpsLng: -58.7891
  }
];

export const mockProduccion: ProduccionHormigon[] = [
  {
    id: 'prod-1',
    viajeId: 'viaje-1',
    plantaId: 'planta-1',
    formulaId: 'FOR-H25-V2',
    m3Producidos: 8,
    cementoTeoricoKg: 2400,
    cementoRealKg: 2415,
    arenaTeoricoKg: 6200,
    arenaRealKg: 6180,
    piedraTeoricoKg: 7800,
    piedraRealKg: 7820,
    aditivoTeoricoLt: 20,
    aditivoRealLt: 19.8,
    aguaRealLt: 142,
    fechaHora: '2026-10-01 09:30'
  }
];

export const mockProbetas: ProbetaLab[] = [
  {
    id: 'prob-1',
    produccionId: 'prod-1',
    codigoMuestra: 'MUE-2026-981',
    fechaMoldeo: '2026-09-03',
    edadDiasDestino: 28,
    fechaRoturaPrevista: '2026-10-01',
    resistenciaEsperadaMpa: 25.0,
    resistenciaRealMpa: 27.4,
    estado: 'rota',
    resultado: 'aprobado'
  }
];

export const mockOrdenesMantenimiento: OrdenMantenimiento[] = [
  {
    id: 'ot-101',
    equipoId: 'eq-1',
    tipo: 'preventivo',
    fallaReportada: 'Service 60.000 km y cambio de filtros hidráulicos',
    trabajoRealizado: 'Se reemplazó aceite de motor 15W40, filtros de gasoil, aire y revisión de trompo.',
    mecanicoId: 'emp-5',
    costoTotal: 345000,
    estado: 'cerrada',
    fechaApertura: '2026-09-28',
    fechaCierre: '2026-09-29'
  }
];

export const mockFacturas: Factura[] = [
  {
    id: 'fac-1',
    nroFactura: '0001-00012492',
    clienteId: 'cli-1',
    fecha: '2026-09-20',
    vencimiento: '2026-10-20',
    subtotal: 8200000,
    iva: 1722000,
    total: 9922000,
    estado: 'emitida',
    remitoNros: ['0001-00049100']
  }
];
