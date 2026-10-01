import { MovimientoStock } from '../types';

class InventoryMovementRepository {
  private movements: Map<string, MovimientoStock> = new Map();
  private sequenceCounters: Map<string, number> = new Map();
  private eventIndex: Map<string, string> = new Map(); // eventId -> movementId

  constructor() {
    this.seedInitialData();
  }

  resetForTesting() {
    this.movements.clear();
    this.sequenceCounters.clear();
    this.eventIndex.clear();
    this.seedInitialData();
  }

  private seedInitialData() {
    const defaultMovements: MovimientoStock[] = [
      {
        id: 'mov-init-101',
        empresaId: 'emp-1',
        numero: 'MOV-000001',
        fechaHora: '2026-09-25T08:00:00Z',
        tipoMovimiento: 'INGRESO_COMPRA',
        depositoDestinoId: 'dep-central',
        origenModulo: 'COMPRAS_RECEPCION',
        origenId: 'rec-init-01',
        documentoReferencia: 'REC-000001',
        estado: 'CONFIRMADO',
        observaciones: 'Ingreso inicial por recepción de filtros de aire',
        usuarioId: 'usr-compras',
        items: [
          {
            id: 'mov-item-101',
            movimientoId: 'mov-init-101',
            articuloId: 'art-rep-filtro-aire',
            descripcionSnapshot: 'Filtro de Aire Primario Heavy Duty para Mixer',
            unidadMedidaSnapshot: 'UNIDAD',
            cantidad: 15,
            depositoDestinoId: 'dep-central',
            ubicacionDestinoId: 'ub-cent-a1',
            costoUnitarioSnapshot: 32000,
            costoTotalSnapshot: 480000
          }
        ],
        createdAt: '2026-09-25T08:00:00Z',
        updatedAt: '2026-09-25T08:00:00Z'
      }
    ];

    defaultMovements.forEach(m => {
      this.movements.set(m.id, m);
      if (m.eventId) this.eventIndex.set(m.eventId, m.id);
    });
    this.sequenceCounters.set('emp-1', 1);
  }

  async getAll(filter?: {
    empresaId?: string;
    tipoMovimiento?: string;
    depositoId?: string;
    articuloId?: string;
    estado?: string;
    fechaDesde?: string;
    fechaHasta?: string;
  }): Promise<MovimientoStock[]> {
    let list = Array.from(this.movements.values());
    if (!filter) return list.sort((a, b) => b.fechaHora.localeCompare(a.fechaHora));

    if (filter.empresaId) list = list.filter(m => m.empresaId === filter.empresaId);
    if (filter.tipoMovimiento) list = list.filter(m => m.tipoMovimiento === filter.tipoMovimiento);
    if (filter.depositoId) {
      list = list.filter(m => m.depositoOrigenId === filter.depositoId || m.depositoDestinoId === filter.depositoId);
    }
    if (filter.articuloId) {
      list = list.filter(m => m.items.some(it => it.articuloId === filter.articuloId));
    }
    if (filter.estado) list = list.filter(m => m.estado === filter.estado);
    if (filter.fechaDesde) list = list.filter(m => m.fechaHora >= filter.fechaDesde!);
    if (filter.fechaHasta) list = list.filter(m => m.fechaHora <= filter.fechaHasta!);

    return list.sort((a, b) => b.fechaHora.localeCompare(a.fechaHora));
  }

  async getById(id: string): Promise<MovimientoStock | null> {
    return this.movements.get(id) || null;
  }

  async getByEventId(empresaId: string, eventId: string): Promise<MovimientoStock | null> {
    const list = Array.from(this.movements.values());
    return list.find(m => m.empresaId === empresaId && m.eventId === eventId) || null;
  }

  async getByOrigen(origenModulo: string, origenId: string): Promise<MovimientoStock[]> {
    return Array.from(this.movements.values()).filter(
      m => m.origenModulo === origenModulo && m.origenId === origenId && m.estado !== 'ANULADO'
    );
  }

  async getNextNumero(empresaId: string = 'emp-1'): Promise<string> {
    const current = this.sequenceCounters.get(empresaId) || 0;
    const next = current + 1;
    this.sequenceCounters.set(empresaId, next);
    return `MOV-${next.toString().padStart(6, '0')}`;
  }

  async save(mov: MovimientoStock): Promise<MovimientoStock> {
    mov.updatedAt = new Date().toISOString();
    this.movements.set(mov.id, mov);
    if (mov.eventId) {
      this.eventIndex.set(mov.eventId, mov.id);
    }
    return mov;
  }
}

export const inventoryMovementRepository = new InventoryMovementRepository();
