import { Deposito, UbicacionDeposito } from '../types';

class WarehouseRepository {
  private warehouses: Map<string, Deposito> = new Map();
  private locations: Map<string, UbicacionDeposito> = new Map();

  constructor() {
    this.seedInitialData();
  }

  resetForTesting() {
    this.warehouses.clear();
    this.locations.clear();
    this.seedInitialData();
  }

  private seedInitialData() {
    const defaultWarehouses: Deposito[] = [
      {
        id: 'dep-central',
        empresaId: 'emp-1',
        codigo: 'DEP-CENTRAL',
        nombre: 'Depósito Central Planta Tigre',
        plantaId: 'planta-1',
        tipo: 'GENERAL',
        estado: 'ACTIVO',
        permiteStockNegativo: false,
        direccion: 'Parque Industrial Tigre Nave 4',
        observaciones: 'Depósito principal de insumos, materiales y repuestos de alta rotación',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-09-30T12:00:00Z'
      },
      {
        id: 'dep-taller',
        empresaId: 'emp-1',
        codigo: 'DEP-TALLER',
        nombre: 'Depósito Pañol de Taller Mecánico',
        plantaId: 'planta-1',
        tipo: 'REPUESTOS',
        estado: 'ACTIVO',
        permiteStockNegativo: false,
        observaciones: 'Pañol cerrado para repuestos críticos, filtros, correas y herramientas',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-09-30T12:00:00Z'
      },
      {
        id: 'dep-cantera',
        empresaId: 'emp-1',
        codigo: 'DEP-CANTERA',
        nombre: 'Depósito Auxiliar Cantera San José',
        plantaId: 'planta-2',
        tipo: 'MATERIA_PRIMA',
        estado: 'ACTIVO',
        permiteStockNegativo: false,
        observaciones: 'Acopio de áridos y repuestos de maquinaria pesada',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-09-30T12:00:00Z'
      }
    ];

    defaultWarehouses.forEach(w => this.warehouses.set(w.id, w));

    const defaultLocations: UbicacionDeposito[] = [
      {
        id: 'ub-cent-a1',
        empresaId: 'emp-1',
        depositoId: 'dep-central',
        codigo: 'PAS-A-EST-01',
        nombre: 'Pasillo A - Estantería 1',
        pasillo: 'A',
        estante: '01',
        nivel: '1',
        estado: 'ACTIVA'
      },
      {
        id: 'ub-cent-a2',
        empresaId: 'emp-1',
        depositoId: 'dep-central',
        codigo: 'PAS-A-EST-02',
        nombre: 'Pasillo A - Estantería 2',
        pasillo: 'A',
        estante: '02',
        nivel: '2',
        estado: 'ACTIVA'
      },
      {
        id: 'ub-tall-r1',
        empresaId: 'emp-1',
        depositoId: 'dep-taller',
        codigo: 'EST-REP-01',
        nombre: 'Estante Repuestos Motor',
        pasillo: 'P1',
        estante: '01',
        nivel: '1',
        estado: 'ACTIVA'
      }
    ];

    defaultLocations.forEach(l => this.locations.set(l.id, l));
  }

  async getAll(filter?: {
    empresaId?: string;
    tipo?: string;
    estado?: string;
    plantaId?: string;
  }): Promise<Deposito[]> {
    let list = Array.from(this.warehouses.values());
    if (!filter) return list.sort((a, b) => a.codigo.localeCompare(b.codigo));

    if (filter.empresaId) list = list.filter(w => w.empresaId === filter.empresaId);
    if (filter.tipo) list = list.filter(w => w.tipo === filter.tipo);
    if (filter.estado) list = list.filter(w => w.estado === filter.estado);
    if (filter.plantaId) list = list.filter(w => w.plantaId === filter.plantaId);

    return list.sort((a, b) => a.codigo.localeCompare(b.codigo));
  }

  async getById(id: string): Promise<Deposito | null> {
    return this.warehouses.get(id) || null;
  }

  async getByCode(empresaId: string, codigo: string): Promise<Deposito | null> {
    const list = Array.from(this.warehouses.values());
    return list.find(w => w.empresaId === empresaId && w.codigo.toUpperCase() === codigo.toUpperCase()) || null;
  }

  async save(dep: Deposito): Promise<Deposito> {
    dep.updatedAt = new Date().toISOString();
    this.warehouses.set(dep.id, dep);
    return dep;
  }

  async getLocationsByWarehouse(depositoId: string): Promise<UbicacionDeposito[]> {
    return Array.from(this.locations.values()).filter(l => l.depositoId === depositoId);
  }

  async getLocationById(id: string): Promise<UbicacionDeposito | null> {
    return this.locations.get(id) || null;
  }

  async saveLocation(loc: UbicacionDeposito): Promise<UbicacionDeposito> {
    this.locations.set(loc.id, loc);
    return loc;
  }
}

export const warehouseRepository = new WarehouseRepository();
