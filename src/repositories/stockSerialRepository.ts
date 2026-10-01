import { SerieStock } from '../types';

class StockSerialRepository {
  private serials: Map<string, SerieStock> = new Map();

  constructor() {
    this.seedInitialData();
  }

  resetForTesting() {
    this.serials.clear();
    this.seedInitialData();
  }

  private seedInitialData() {
    const defaultSerials: SerieStock[] = [
      {
        id: 'ser-neu-101',
        empresaId: 'emp-1',
        articuloId: 'art-neu-295-80',
        numeroSerie: 'BR-295-8849102',
        estado: 'EN_STOCK',
        depositoId: 'dep-central',
        ubicacionId: 'ub-cent-a2',
        observaciones: 'Cubierta Bridgestone M840 295/80 R22.5 nueva',
        createdAt: '2026-09-20T10:00:00Z',
        updatedAt: '2026-09-20T10:00:00Z'
      },
      {
        id: 'ser-neu-102',
        empresaId: 'emp-1',
        articuloId: 'art-neu-295-80',
        numeroSerie: 'BR-295-8849103',
        estado: 'EN_STOCK',
        depositoId: 'dep-central',
        ubicacionId: 'ub-cent-a2',
        observaciones: 'Cubierta Bridgestone M840 295/80 R22.5 nueva',
        createdAt: '2026-09-20T10:00:00Z',
        updatedAt: '2026-09-20T10:00:00Z'
      },
      {
        id: 'ser-alt-001',
        empresaId: 'emp-1',
        articuloId: 'art-rep-alternador',
        numeroSerie: 'BOSCH-24V-991823',
        estado: 'RESERVADA',
        depositoId: 'dep-central',
        observaciones: 'Alternador reservado para OT MIX-12',
        createdAt: '2026-09-22T14:00:00Z',
        updatedAt: '2026-09-29T14:30:00Z'
      }
    ];

    defaultSerials.forEach(s => this.serials.set(s.id, s));
  }

  async getAll(filter?: {
    empresaId?: string;
    articuloId?: string;
    depositoId?: string;
    estado?: string;
  }): Promise<SerieStock[]> {
    let list = Array.from(this.serials.values());
    if (!filter) return list;

    if (filter.empresaId) list = list.filter(s => s.empresaId === filter.empresaId);
    if (filter.articuloId) list = list.filter(s => s.articuloId === filter.articuloId);
    if (filter.depositoId) list = list.filter(s => s.depositoId === filter.depositoId);
    if (filter.estado) list = list.filter(s => s.estado === filter.estado);

    return list;
  }

  async getById(id: string): Promise<SerieStock | null> {
    return this.serials.get(id) || null;
  }

  async getBySerial(empresaId: string, articuloId: string, numeroSerie: string): Promise<SerieStock | null> {
    const list = Array.from(this.serials.values());
    return list.find(s => s.empresaId === empresaId && s.articuloId === articuloId && s.numeroSerie.trim().toUpperCase() === numeroSerie.trim().toUpperCase()) || null;
  }

  async save(serial: SerieStock): Promise<SerieStock> {
    serial.updatedAt = new Date().toISOString();
    this.serials.set(serial.id, serial);
    return serial;
  }
}

export const stockSerialRepository = new StockSerialRepository();
