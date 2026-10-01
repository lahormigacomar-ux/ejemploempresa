import { ReservaStock } from '../types';

class StockReservationRepository {
  private reservations: Map<string, ReservaStock> = new Map();

  constructor() {
    this.seedInitialData();
  }

  resetForTesting() {
    this.reservations.clear();
    this.seedInitialData();
  }

  private seedInitialData() {
    const defaultReservations: ReservaStock[] = [
      {
        id: 'res-001',
        empresaId: 'emp-1',
        articuloId: 'art-rep-filtro-aire',
        depositoId: 'dep-central',
        ubicacionId: 'ub-cent-a1',
        cantidad: 2,
        origenModulo: 'TALLER_OT',
        origenId: 'ot-demo-01',
        estado: 'ACTIVA',
        fechaReserva: '2026-09-28T10:00:00Z',
        usuarioId: 'usr-mecanico',
        motivo: 'Reserva para Service Preventivo 500h Cargadora CAR-01',
        createdAt: '2026-09-28T10:00:00Z',
        updatedAt: '2026-09-28T10:00:00Z'
      },
      {
        id: 'res-002',
        empresaId: 'emp-1',
        articuloId: 'art-rep-alternador',
        depositoId: 'dep-central',
        cantidad: 1,
        origenModulo: 'TALLER_OT',
        origenId: 'ot-demo-02',
        estado: 'ACTIVA',
        fechaReserva: '2026-09-29T14:30:00Z',
        usuarioId: 'usr-mecanico',
        motivo: 'Reserva para recambio de alternador en MIX-12',
        createdAt: '2026-09-29T14:30:00Z',
        updatedAt: '2026-09-29T14:30:00Z'
      }
    ];

    defaultReservations.forEach(r => this.reservations.set(r.id, r));
  }

  async getAll(filter?: {
    empresaId?: string;
    articuloId?: string;
    depositoId?: string;
    estado?: string;
    origenModulo?: string;
    origenId?: string;
  }): Promise<ReservaStock[]> {
    let list = Array.from(this.reservations.values());
    if (!filter) return list.sort((a, b) => b.fechaReserva.localeCompare(a.fechaReserva));

    if (filter.empresaId) list = list.filter(r => r.empresaId === filter.empresaId);
    if (filter.articuloId) list = list.filter(r => r.articuloId === filter.articuloId);
    if (filter.depositoId) list = list.filter(r => r.depositoId === filter.depositoId);
    if (filter.estado) list = list.filter(r => r.estado === filter.estado);
    if (filter.origenModulo) list = list.filter(r => r.origenModulo === filter.origenModulo);
    if (filter.origenId) list = list.filter(r => r.origenId === filter.origenId);

    return list.sort((a, b) => b.fechaReserva.localeCompare(a.fechaReserva));
  }

  async getById(id: string): Promise<ReservaStock | null> {
    return this.reservations.get(id) || null;
  }

  async getActiveReservations(empresaId: string, depositoId: string, articuloId: string): Promise<ReservaStock[]> {
    return Array.from(this.reservations.values()).filter(
      r =>
        r.empresaId === empresaId &&
        r.depositoId === depositoId &&
        r.articuloId === articuloId &&
        r.estado === 'ACTIVA'
    );
  }

  async save(res: ReservaStock): Promise<ReservaStock> {
    res.updatedAt = new Date().toISOString();
    this.reservations.set(res.id, res);
    return res;
  }
}

export const stockReservationRepository = new StockReservationRepository();
