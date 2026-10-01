import { Empleado, HistorialLaboral, DocumentoEmpleado, HabilitacionEquipo } from '../types';
import { auditRepository } from './auditRepository';

class EmployeeRepository {
  private employees: Map<string, Empleado> = new Map();
  private history: Map<string, HistorialLaboral[]> = new Map();

  constructor() {
    this.seedInitialData();
  }

  resetForTesting() {
    this.employees.clear();
    this.history.clear();
    this.seedInitialData();
  }

  private seedInitialData() {
    const defaultEmployees: Empleado[] = [
      {
        id: 'emp-1',
        empresaId: 'emp-1',
        legajo: '1001',
        nombre: 'Juan',
        apellido: 'Pérez',
        dni: '32145678',
        cuil: '20-32145678-9',
        fechaIngreso: '2022-03-10',
        estado: 'ACTIVO',
        categoria: 'Oficial Conductor Especializado',
        convenio: 'UOCRA / Choferes Hormigoneras',
        plantaHabitualId: 'planta-1',
        centroCostoHabitualId: 'cc-transporte',
        banco: 'Banco Galicia',
        cbuAlias: '0070085120000012345678',
        telefono: '+54 9 11 4567-8901',
        email: 'jperez@concretera.com',
        domicilio: 'Av. San Martín 1240, Tigre',
        contactoEmergencia: 'María Gómez (Esposa)',
        telefonoEmergencia: '+54 9 11 4567-8902',
        sueldoBasico: 1450000,
        roles: ['chofer_mixer'],
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
          {
            id: 'doc-1',
            empleadoId: 'emp-1',
            tipo: 'licencia',
            numero: '32145678',
            fechaEmision: '2022-05-12',
            fechaVencimiento: '2027-05-12',
            estado: 'vigente',
            bloqueanteOperativo: true
          },
          {
            id: 'doc-2',
            empleadoId: 'emp-1',
            tipo: 'psicofisico',
            numero: 'PSI-9921',
            fechaEmision: '2022-05-12',
            fechaVencimiento: '2027-05-12',
            estado: 'vigente',
            bloqueanteOperativo: true
          }
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
        fechaIngreso: '2020-06-15',
        estado: 'ACTIVO',
        categoria: 'Oficial Conductor',
        convenio: 'UOCRA / Choferes',
        plantaHabitualId: 'planta-1',
        centroCostoHabitualId: 'cc-transporte',
        banco: 'Banco Nación',
        cbuAlias: '0110599530000045678912',
        telefono: '+54 9 11 5544-3322',
        email: 'cgomez@concretera.com',
        domicilio: 'Calle 9 de Julio 450, San Fernando',
        contactoEmergencia: 'Lucía Gómez',
        telefonoEmergencia: '+54 9 11 5544-3399',
        sueldoBasico: 1450000,
        roles: ['chofer_mixer', 'chofer_camion'],
        licenciaConducir: {
          nro: '28987654',
          categoria: 'E1',
          vencimiento: '2026-08-15', // VENCIDA para pruebas de bloqueo
          lintiVencimiento: '2026-08-15',
          psicofisicoVencimiento: '2026-08-15'
        },
        habilitacionesEquipos: [
          { equipoTipo: 'mixer', habilitado: true, fechaVencimiento: '2026-08-15' }
        ],
        documentos: [
          {
            id: 'doc-3',
            empleadoId: 'emp-2',
            tipo: 'licencia',
            numero: '28987654',
            fechaEmision: '2021-08-15',
            fechaVencimiento: '2026-08-15',
            estado: 'vencido',
            bloqueanteOperativo: true
          }
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
        fechaIngreso: '2019-01-10',
        estado: 'ACTIVO',
        categoria: 'Maquinista Vial Principal',
        convenio: 'UOCRA / Vialidad',
        plantaHabitualId: 'planta-2',
        centroCostoHabitualId: 'cc-aridos',
        banco: 'Banco Provincia',
        cbuAlias: '0140000703000078912345',
        telefono: '+54 9 11 7788-9900',
        email: 'mdiaz@concretera.com',
        domicilio: 'Ruta 24 KM 5, Benavídez',
        contactoEmergencia: 'Rosa Díaz',
        telefonoEmergencia: '+54 9 11 7788-9911',
        sueldoBasico: 1520000,
        roles: ['maquinista'],
        habilitacionesEquipos: [
          { equipoTipo: 'cargadora', habilitado: true, fechaVencimiento: '2028-01-15' },
          { equipoTipo: 'excavadora', habilitado: true, fechaVencimiento: '2028-01-15' }
        ],
        documentos: [
          {
            id: 'doc-4',
            empleadoId: 'emp-3',
            tipo: 'capacitacion',
            numero: 'CAP-CAT-950',
            fechaEmision: '2023-01-15',
            fechaVencimiento: '2028-01-15',
            estado: 'vigente',
            bloqueanteOperativo: false
          }
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
        fechaIngreso: '2018-05-20',
        estado: 'ACTIVO',
        categoria: 'Mecánico Especializado Pesados',
        convenio: 'SMATA / Mecánicos',
        plantaHabitualId: 'planta-1',
        centroCostoHabitualId: 'cc-taller',
        banco: 'Banco Santander',
        cbuAlias: '0720000720000011223344',
        telefono: '+54 9 11 9988-7766',
        email: 'rsanchez@concretera.com',
        domicilio: 'Calle Perú 310, Escobar',
        contactoEmergencia: 'Silvia Morales',
        telefonoEmergencia: '+54 9 11 9988-7777',
        sueldoBasico: 1750000,
        roles: ['mecanico'],
        habilitacionesEquipos: [],
        documentos: []
      }
    ];

    defaultEmployees.forEach(emp => {
      this.employees.set(emp.id, emp);
      this.history.set(emp.id, [
        {
          id: `hist-${emp.id}-1`,
          empleadoId: emp.id,
          fechaVigenciaDesde: '2026-01-01',
          sueldoBasico: emp.sueldoBasico,
          categoria: emp.categoria,
          puesto: emp.roles.join(', '),
          centroCostoId: emp.centroCostoHabitualId,
          motivoCambio: 'Ajuste paritario inicial',
          createdAt: '2026-01-01T00:00:00Z'
        }
      ]);
    });
  }

  async getAll(): Promise<Empleado[]> {
    return Array.from(this.employees.values());
  }

  async getById(id: string): Promise<Empleado | null> {
    return this.employees.get(id) || null;
  }

  async getHistory(empleadoId: string): Promise<HistorialLaboral[]> {
    return this.history.get(empleadoId) || [];
  }

  async updateSalaryAndCategory(
    empleadoId: string,
    nuevoSueldo: number,
    nuevaCategoria: string,
    fechaVigencia: string,
    motivo: string,
    usuarioNombre: string = 'admin'
  ): Promise<Empleado> {
    const emp = this.employees.get(empleadoId);
    if (!emp) throw new Error(`Empleado con ID ${empleadoId} no encontrado`);

    const valorAnterior = { sueldo: emp.sueldoBasico, categoria: emp.categoria };
    
    // Registrar en historial sin sobrescribir el pasado
    const hist = this.history.get(empleadoId) || [];
    hist.push({
      id: `hist-${empleadoId}-${Date.now()}`,
      empleadoId,
      fechaVigenciaDesde: fechaVigencia,
      sueldoBasico: nuevoSueldo,
      categoria: nuevaCategoria,
      puesto: emp.roles.join(', '),
      centroCostoId: emp.centroCostoHabitualId,
      motivoCambio: motivo,
      createdAt: new Date().toISOString()
    });
    this.history.set(empleadoId, hist);

    // Actualizar empleado
    emp.sueldoBasico = nuevoSueldo;
    emp.categoria = nuevaCategoria;
    this.employees.set(empleadoId, emp);

    // Auditoría
    await auditRepository.recordAction(
      'rrhh_empleados',
      empleadoId,
      'MODIFICACION_SALARIO_CATEGORIA',
      valorAnterior,
      { sueldo: nuevoSueldo, categoria: nuevaCategoria },
      motivo,
      usuarioNombre
    );

    return emp;
  }

  async getHistoricalSalary(empleadoId: string, fecha: string): Promise<number> {
    const hist = this.history.get(empleadoId) || [];
    // Filtrar historias cuya fechaVigenciaDesde <= fecha y ordenar descendente
    const applicable = hist
      .filter(h => h.fechaVigenciaDesde <= fecha)
      .sort((a, b) => b.fechaVigenciaDesde.localeCompare(a.fechaVigenciaDesde));

    if (applicable.length > 0) {
      return applicable[0].sueldoBasico;
    }
    const emp = this.employees.get(empleadoId);
    return emp ? emp.sueldoBasico : 0;
  }
}

export const employeeRepository = new EmployeeRepository();
