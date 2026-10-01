import { StockExistencia, ConfiguracionStockArticuloDeposito } from '../types';

class InventoryRepository {
  private stockMap: Map<string, StockExistencia> = new Map(); // key: `${empresaId}_${depositoId}_${articuloId}_${loteId || 'NONE'}`
  private configs: Map<string, ConfiguracionStockArticuloDeposito> = new Map();

  constructor() {
    this.seedInitialData();
  }

  resetForTesting() {
    this.stockMap.clear();
    this.configs.clear();
    this.seedInitialData();
  }

  private buildKey(empresaId: string, depositoId: string, articuloId: string, loteId?: string): string {
    return `${empresaId}_${depositoId}_${articuloId}_${loteId || 'NONE'}`;
  }

  private seedInitialData() {
    const defaultStock: StockExistencia[] = [
      {
        id: 'stk-001',
        empresaId: 'emp-1',
        depositoId: 'dep-central',
        ubicacionId: 'ub-cent-a1',
        articuloId: 'art-rep-filtro-aire',
        cantidadFisica: 15,
        cantidadReservada: 2,
        cantidadDisponible: 13,
        costoPromedioPonderado: 32000,
        valorTotalStock: 480000,
        updatedAt: '2026-09-30T12:00:00Z'
      },
      {
        id: 'stk-002',
        empresaId: 'emp-1',
        depositoId: 'dep-taller',
        ubicacionId: 'ub-tall-r1',
        articuloId: 'art-rep-filtro-aceite',
        cantidadFisica: 12,
        cantidadReservada: 0,
        cantidadDisponible: 12,
        costoPromedioPonderado: 28500,
        valorTotalStock: 342000,
        updatedAt: '2026-09-30T12:00:00Z'
      },
      {
        id: 'stk-003',
        empresaId: 'emp-1',
        depositoId: 'dep-central',
        articuloId: 'art-neu-295-80',
        cantidadFisica: 8,
        cantidadReservada: 0,
        cantidadDisponible: 8,
        costoPromedioPonderado: 380000,
        valorTotalStock: 3040000,
        updatedAt: '2026-09-30T12:00:00Z'
      },
      {
        id: 'stk-004',
        empresaId: 'emp-1',
        depositoId: 'dep-central',
        articuloId: 'art-rep-alternador',
        cantidadFisica: 2,
        cantidadReservada: 1,
        cantidadDisponible: 1,
        costoPromedioPonderado: 195000,
        valorTotalStock: 390000,
        updatedAt: '2026-09-30T12:00:00Z'
      },
      {
        id: 'stk-005',
        empresaId: 'emp-1',
        depositoId: 'dep-central',
        articuloId: 'art-cemento-cp40',
        loteId: 'lot-cem-202609',
        cantidadFisica: 60,
        cantidadReservada: 0,
        cantidadDisponible: 60,
        costoPromedioPonderado: 180000,
        valorTotalStock: 10800000,
        updatedAt: '2026-09-30T12:00:00Z'
      }
    ];

    defaultStock.forEach(s => {
      const key = this.buildKey(s.empresaId, s.depositoId, s.articuloId, s.loteId);
      this.stockMap.set(key, s);
    });
  }

  async getAllStock(filter?: {
    empresaId?: string;
    depositoId?: string;
    articuloId?: string;
  }): Promise<StockExistencia[]> {
    let list = Array.from(this.stockMap.values());
    if (!filter) return list;

    if (filter.empresaId) list = list.filter(s => s.empresaId === filter.empresaId);
    if (filter.depositoId) list = list.filter(s => s.depositoId === filter.depositoId);
    if (filter.articuloId) list = list.filter(s => s.articuloId === filter.articuloId);

    return list;
  }

  async getStock(empresaId: string, depositoId: string, articuloId: string, loteId?: string): Promise<StockExistencia | null> {
    const key = this.buildKey(empresaId, depositoId, articuloId, loteId);
    return this.stockMap.get(key) || null;
  }

  async saveStock(stock: StockExistencia): Promise<StockExistencia> {
    stock.cantidadDisponible = Number((stock.cantidadFisica - stock.cantidadReservada).toFixed(4));
    stock.valorTotalStock = Number((stock.cantidadFisica * stock.costoPromedioPonderado).toFixed(2));
    stock.updatedAt = new Date().toISOString();
    const key = this.buildKey(stock.empresaId, stock.depositoId, stock.articuloId, stock.loteId);
    this.stockMap.set(key, stock);
    return stock;
  }

  async getStockConfig(empresaId: string, depositoId: string, articuloId: string): Promise<ConfiguracionStockArticuloDeposito | null> {
    const key = `${empresaId}_${depositoId}_${articuloId}`;
    return this.configs.get(key) || null;
  }

  async saveStockConfig(config: ConfiguracionStockArticuloDeposito): Promise<ConfiguracionStockArticuloDeposito> {
    const key = `${config.empresaId}_${config.depositoId}_${config.articuloId}`;
    this.configs.set(key, config);
    return config;
  }
}

export const inventoryRepository = new InventoryRepository();
