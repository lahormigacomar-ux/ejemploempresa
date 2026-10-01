import { ConteoStock } from '../types';

class StockCountRepository {
  private counts: Map<string, ConteoStock> = new Map();
  private sequenceCounters: Map<string, number> = new Map();

  constructor() {
    this.seedInitialData();
  }

  resetForTesting() {
    this.counts.clear();
    this.sequenceCounters.clear();
    this.seedInitialData();
  }

  private seedInitialData() {
    const defaultCounts: ConteoStock[] = [
      {
        id: 'cnt-001',
        empresaId: 'emp-1',
        numero: 'CNT-000001',
        depositoId: 'dep-central',
        fechaHora: '2026-09-29T18:00:00Z',
        estado: 'BORRADOR',
        responsableEmpleadoId: 'emp-1',
        observaciones: 'Conteo mensual de cierre de septiembre - Rubro Filtros y EPP',
        items: [
          {
            id: 'cnt-item-101',
            conteoId: 'cnt-001',
            articuloId: 'art-rep-filtro-aire',
            descripcionSnapshot: 'Filtro de Aire Primario Heavy Duty para Mixer',
            unidadMedidaSnapshot: 'UNIDAD',
            ubicacionId: 'ub-cent-a1',
            cantidadSistemaSnapshot: 15,
            cantidadContada: 14,
            diferencia: -1,
            costoUnitarioSnapshot: 32000,
            valorDiferencia: -32000
          },
          {
            id: 'cnt-item-102',
            conteoId: 'cnt-001',
            articuloId: 'art-epp-casco',
            descripcionSnapshot: 'Casco de Seguridad Industrial Blanco con Arnés',
            unidadMedidaSnapshot: 'UNIDAD',
            cantidadSistemaSnapshot: 0,
            cantidadContada: 5,
            diferencia: 5,
            costoUnitarioSnapshot: 12000,
            valorDiferencia: 60000
          }
        ],
        createdAt: '2026-09-29T18:00:00Z',
        updatedAt: '2026-09-29T18:00:00Z'
      }
    ];

    defaultCounts.forEach(c => this.counts.set(c.id, c));
    this.sequenceCounters.set('emp-1', 1);
  }

  async getAll(filter?: {
    empresaId?: string;
    depositoId?: string;
    estado?: string;
  }): Promise<ConteoStock[]> {
    let list = Array.from(this.counts.values());
    if (!filter) return list.sort((a, b) => b.fechaHora.localeCompare(a.fechaHora));

    if (filter.empresaId) list = list.filter(c => c.empresaId === filter.empresaId);
    if (filter.depositoId) list = list.filter(c => c.depositoId === filter.depositoId);
    if (filter.estado) list = list.filter(c => c.estado === filter.estado);

    return list.sort((a, b) => b.fechaHora.localeCompare(a.fechaHora));
  }

  async getById(id: string): Promise<ConteoStock | null> {
    return this.counts.get(id) || null;
  }

  async getNextNumero(empresaId: string = 'emp-1'): Promise<string> {
    const current = this.sequenceCounters.get(empresaId) || 0;
    const next = current + 1;
    this.sequenceCounters.set(empresaId, next);
    return `CNT-${next.toString().padStart(6, '0')}`;
  }

  async save(count: ConteoStock): Promise<ConteoStock> {
    count.updatedAt = new Date().toISOString();
    this.counts.set(count.id, count);
    return count;
  }
}

export const stockCountRepository = new StockCountRepository();
