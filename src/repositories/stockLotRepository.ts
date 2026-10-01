import { LoteStock } from '../types';

class StockLotRepository {
  private lots: Map<string, LoteStock> = new Map();

  constructor() {
    this.seedInitialData();
  }

  resetForTesting() {
    this.lots.clear();
    this.seedInitialData();
  }

  private seedInitialData() {
    const defaultLots: LoteStock[] = [
      {
        id: 'lot-cem-202609',
        empresaId: 'emp-1',
        articuloId: 'art-cemento-cp40',
        codigoLote: 'LOT-CEM-20260928-A',
        fechaFabricacion: '2026-09-26',
        fechaVencimiento: '2026-12-26',
        proveedorId: 'prov-cem-01',
        estado: 'DISPONIBLE',
        observaciones: 'Lote de Cemento Portland Loma Negra Olavarría',
        createdAt: '2026-09-28T08:30:00Z'
      },
      {
        id: 'lot-adi-202609',
        empresaId: 'emp-1',
        articuloId: 'art-aditivo-plast',
        codigoLote: 'LOT-SIKA-PLAST-991',
        fechaFabricacion: '2026-09-15',
        fechaVencimiento: '2027-09-15',
        proveedorId: 'prov-adi-04',
        estado: 'DISPONIBLE',
        observaciones: 'Aditivo Sika Viscocrete 20 HE',
        createdAt: '2026-09-20T10:00:00Z'
      }
    ];

    defaultLots.forEach(l => this.lots.set(l.id, l));
  }

  async getAll(filter?: {
    empresaId?: string;
    articuloId?: string;
    estado?: string;
  }): Promise<LoteStock[]> {
    let list = Array.from(this.lots.values());
    if (!filter) return list;

    if (filter.empresaId) list = list.filter(l => l.empresaId === filter.empresaId);
    if (filter.articuloId) list = list.filter(l => l.articuloId === filter.articuloId);
    if (filter.estado) list = list.filter(l => l.estado === filter.estado);

    return list;
  }

  async getById(id: string): Promise<LoteStock | null> {
    return this.lots.get(id) || null;
  }

  async getByCode(empresaId: string, articuloId: string, codigoLote: string): Promise<LoteStock | null> {
    const list = Array.from(this.lots.values());
    return list.find(l => l.empresaId === empresaId && l.articuloId === articuloId && l.codigoLote === codigoLote) || null;
  }

  async save(lot: LoteStock): Promise<LoteStock> {
    this.lots.set(lot.id, lot);
    return lot;
  }
}

export const stockLotRepository = new StockLotRepository();
