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
    legajo: '1001',
    nombre: 'Juan',
    apellido: 'Pérez',
    dni: '32145678',
    cuil: '20-32145678-9',
    roles: ['chofer_mixer'],
    categoria: 'Oficial Conductor',
    convenio: 'UOCRA / Choferes Hormigoneras',
    fechaIngreso: '2022-03-10',
    telefono: '+54 9 11 4567-8901',
    email: 'jperez@concretera.com',
    domicilio: 'Av. San Martín 1240, Tigre',
    contactoEmergencia: 'María Gómez (Esposa)',
    telefonoEmergencia: '+54 9 11 4567-8902',
    estado: 'activo',
    sueldoBasico: 1450000,
    centroCostoHabitualId: 'cc-transporte',
    banco: 'Banco Galicia',
    cbu: '0070085120000012345678',
    licenciaConducir: {
      nro: '32145678',
      categoria: 'E1 / E2 (Articulados y Cargas Peligrosas)',
      vencimiento: '2027-05-12',
      lintiVencimiento: '2027-05-12',
      psicofisicoVencimiento: '2027-05-12'
    },
    habilitacionesEquipos: [
      { equipoTipoOrId: 'mixer', habilitado: true, fechaVencimiento: '2027-05-12' },
      { equipoTipoOrId: 'bomba', habilitado: false }
    ],
    documentos: [
      { id: 'doc-1', tipo: 'licencia', numero: '32145678', fechaEmision: '2022-05-12', fechaVencimiento: '2027-05-12', estado: 'vigente', bloqueanteOperativo: false },
      { id: 'doc-2', tipo: 'psicofisico', numero: 'PSI-9921', fechaEmision: '2022-05-12', fechaVencimiento: '2027-05-12', estado: 'vigente', bloqueanteOperativo: false },
      { id: 'doc-3', tipo: 'linti', numero: 'LINTI-8831', fechaEmision: '2022-05-12', fechaVencimiento: '2027-05-12', estado: 'vigente', bloqueanteOperativo: true }
    ]
  },
  {
    id: 'emp-2',
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
    contactoEmergencia: 'Lucía Gómez (Hija)',
    telefonoEmergencia: '+54 9 11 5544-3399',
    estado: 'activo',
    sueldoBasico: 1450000,
    centroCostoHabitualId: 'cc-transporte',
    banco: 'Banco Nación',
    cbu: '0110599530000045678912',
    licenciaConducir: {
      nro: '28987654',
      categoria: 'E1',
      vencimiento: '2026-10-20', // Próximo a vencer
      lintiVencimiento: '2026-10-20',
      psicofisicoVencimiento: '2026-10-20'
    },
    habilitacionesEquipos: [
      { equipoTipoOrId: 'mixer', habilitado: true, fechaVencimiento: '2026-10-20' }
    ],
    documentos: [
      { id: 'doc-4', tipo: 'licencia', numero: '28987654', fechaEmision: '2021-10-20', fechaVencimiento: '2026-10-20', estado: 'proximo_vencimiento', bloqueanteOperativo: true }
    ]
  },
  {
    id: 'emp-3',
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
    estado: 'activo',
    sueldoBasico: 1520000,
    centroCostoHabitualId: 'cc-aridos',
    banco: 'Banco Provincia',
    cbu: '0140000703000078912345',
    habilitacionesEquipos: [
      { equipoTipoOrId: 'cargadora', habilitado: true, fechaVencimiento: '2028-01-15' },
      { equipoTipoOrId: 'excavadora', habilitado: true, fechaVencimiento: '2028-01-15' }
    ],
    documentos: [
      { id: 'doc-5', tipo: 'capacitacion', numero: 'CAP-CAT-01', fechaEmision: '2023-01-15', fechaVencimiento: '2028-01-15', estado: 'vigente', bloqueanteOperativo: false }
    ]
  },
  {
    id: 'emp-4',
    legajo: '1004',
    nombre: 'Esteban',
    apellido: 'Quinteros',
    dni: '31222333',
    cuil: '20-31222333-4',
    roles: ['operador_planta'],
    categoria: 'Operador Dosificador Planta',
    convenio: 'UOCRA',
    fechaIngreso: '2021-08-01',
    telefono: '+54 9 11 2233-4455',
    email: 'equinteros@concretera.com',
    domicilio: 'Av. Mitre 890, Campana',
    contactoEmergencia: 'Carla Ruiz',
    telefonoEmergencia: '+54 9 11 2233-4466',
    estado: 'activo',
    sueldoBasico: 1600000,
    centroCostoHabitualId: 'cc-hormigon',
    banco: 'Banco Galicia',
    cbu: '0070085130000098765432',
    habilitacionesEquipos: [],
    documentos: []
  },
  {
    id: 'emp-5',
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
    estado: 'activo',
    sueldoBasico: 1750000,
    centroCostoHabitualId: 'cc-taller',
    banco: 'Banco Santander',
    cbu: '0720000720000011223344',
    habilitacionesEquipos: [],
    documentos: []
  },
  {
    id: 'emp-6',
    legajo: '1006',
    nombre: 'Dra. Ana',
    apellido: 'Martínez',
    dni: '30111222',
    cuil: '27-30111222-6',
    roles: ['laboratorista'],
    categoria: 'Jefa de Laboratorio de Hormigón',
    convenio: 'Fuera de Convenio',
    fechaIngreso: '2017-02-10',
    telefono: '+54 9 11 3322-1100',
    email: 'amartinez@concretera.com',
    domicilio: 'Calle Los Jazmines 500, Pilar',
    contactoEmergencia: 'Juan Martínez',
    telefonoEmergencia: '+54 9 11 3322-1111',
    estado: 'activo',
    sueldoBasico: 1900000,
    centroCostoHabitualId: 'cc-hormigon',
    banco: 'Banco Galicia',
    cbu: '0070085140000055667788',
    habilitacionesEquipos: [],
    documentos: []
  }
];

export const mockEquipos: Equipo[] = [
  { id: 'eq-1', codigo: 'MIX-12', tipo: 'mixer', dominio: 'AB-123-CD', marcaModelo: 'Iveco Tector 170E28 (8m3)', anio: 2022, capacidadM3: 8, kmActual: 68500, horometroActual: 3400, estado: 'trabajando', centroCostoId: 'cc-transporte' },
  { id: 'eq-2', codigo: 'MIX-14', tipo: 'mixer', dominio: 'AF-456-GH', marcaModelo: 'Mercedes Benz Actros 8x4 (10m3)', anio: 2023, capacidadM3: 10, kmActual: 42100, horometroActual: 2100, estado: 'disponible', centroCostoId: 'cc-transporte' },
  { id: 'eq-3', codigo: 'CAR-01', tipo: 'cargadora', dominio: 'MAQ-01', marcaModelo: 'Caterpillar 950GC', anio: 2021, kmActual: 0, horometroActual: 5600, estado: 'trabajando', centroCostoId: 'cc-aridos' },
  { id: 'eq-4', codigo: 'BOM-03', tipo: 'bomba', dominio: 'AE-789-JK', marcaModelo: 'Putzmeister BSF 36-4', anio: 2020, kmActual: 51200, horometroActual: 4100, estado: 'disponible', centroCostoId: 'cc-transporte' }
];

export const mockArticulos: Articulo[] = [
  { id: 'art-cem', codigo: 'CEM-01', nombre: 'Cemento Portland Normal (CPN 40) - Bolsón/Granel', categoria: 'materia_prima', unidadMedida: 'kg', stockActual: 85000, stockMinimo: 20000, costoUnitario: 145 },
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
  },
  {
    id: 'cli-3',
    razonSocial: 'Corralón de Materiales San Cayetano (Tercero)',
    cuit: '30-55443322-1',
    condicionIva: 'Responsable Inscripto',
    limiteCredito: 15000000,
    saldoActual: 2100000,
    obras: [
      { id: 'obra-4', clienteId: 'cli-3', nombre: 'Obras Varias Zona Oeste (Canal Tercero)', direccion: 'Ruta 8 KM 42', lat: -34.5200, lng: -58.8900, distanciaKm: 31.0, contacto: 'Ventas Corralón (11-6677-8899)' }
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
  },
  {
    id: 'ped-3',
    codigo: 'PED-8944',
    clienteId: 'cli-2',
    obraId: 'obra-3',
    productoId: 'H21 - Pavimentos y Bases',
    cantidadM3: 35,
    precioUnitario: 115000,
    estado: 'aprobado',
    fechaProgramada: '2026-10-02',
    horario: '09:00',
    bombaRequerida: false,
    canalVenta: 'directo'
  },
  {
    id: 'ped-4',
    codigo: 'PED-8945',
    clienteId: 'cli-3',
    obraId: 'obra-4',
    productoId: 'H30 - Bombeable (Asistido)',
    cantidadM3: 16,
    precioUnitario: 142000,
    estado: 'pendiente_aprobacion',
    fechaProgramada: '2026-10-02',
    horario: '14:00',
    bombaRequerida: true,
    canalVenta: 'corralon',
    terceroNombre: 'Corralón San Cayetano',
    comisionPorcentaje: 5.0
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
  },
  {
    id: 'viaje-2',
    pedidoId: 'ped-1',
    clienteId: 'cli-1',
    obraId: 'obra-1',
    plantaId: 'planta-1',
    equipoId: 'eq-2',
    choferId: 'emp-2',
    cantidadM3: 8,
    estado: 'cargando',
    horaSalidaPlanta: undefined,
    remitoNro: '0001-00049282',
    gpsLat: -34.6037,
    gpsLng: -58.3816
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
  },
  {
    id: 'prob-2',
    produccionId: 'prod-1',
    codigoMuestra: 'MUE-2026-982',
    fechaMoldeo: '2026-09-24',
    edadDiasDestino: 7,
    fechaRoturaPrevista: '2026-10-01',
    resistenciaEsperadaMpa: 21.0,
    resistenciaRealMpa: 22.1,
    estado: 'rota',
    resultado: 'aprobado'
  },
  {
    id: 'prob-3',
    produccionId: 'prod-1',
    codigoMuestra: 'MUE-2026-995',
    fechaMoldeo: '2026-09-17',
    edadDiasDestino: 14,
    fechaRoturaPrevista: '2026-10-01',
    resistenciaEsperadaMpa: 28.0,
    estado: 'pendiente',
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
    remitoNros: ['0001-00049100', '0001-00049105']
  },
  {
    id: 'fac-2',
    nroFactura: '0001-00012480',
    clienteId: 'cli-2',
    fecha: '2026-09-10',
    vencimiento: '2026-10-10',
    subtotal: 3719008,
    iva: 781000,
    total: 4500000,
    estado: 'emitida',
    remitoNros: ['0001-00049080']
  }
];
