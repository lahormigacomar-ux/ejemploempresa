import { RecepcionCompra } from '../types';

class PurchaseReceiptRepository {
  private receipts: Map<string, RecepcionCompra> = new Map();
  private eventIndex: Map<string, string> = new Map(); // eventId -> receiptId
  private sequenceCounters: Map<string, number> = new Map();

  constructor() {
    this.seedInitialData();
  }

  resetForTesting() {
    this.receipts.clear();
    this.eventIndex.clear();
    this.sequenceCounters.clear();
    this.seedInitialData();
  }

  private seedInitialData() {
    const defaultReceipts: RecepcionCompra[] = [
      {
        id: 'rec-001',
        empresaId: 'emp-1',
        numero: 'REC-000001',
        ordenCompraId: 'oc-001',
        proveedorId: 'prov-cem-01',
        proveedorNombreSnapshot: 'Loma Negra C.I.A.S.A.',
        fechaHora: '2026-09-28T14:00:00Z',
        numeroRemitoProveedor: 'R-0012-98412',
        plantaId: 'planta-1',
        recibidoPorEmpleadoId: 'emp-1',
        estado: 'CONFIRMADA',
        observaciones: 'Primer viaje tolva 30 TN ingresada a Silo 1. Calidad OK.',
        items: [
          {
            id: 'item-rec-101',
            recepcionId: 'rec-001',
            ordenCompraItemId: 'item-oc-101',
            articuloId: 'art-cemento-cp40',
            tipo: 'ARTICULO',
            descripcionSnapshot: 'Cemento Portland Normal a Granel (CP40)',
            cantidadRecibida: 30,
            cantidadAceptada: 30,
            cantidadRechazada: 0,
            unidadMedida: 'TN'
          }
        ],
        createdAt: '2026-09-28T14:00:00Z',
        updatedAt: '2026-09-28T14:00:00Z'
      }
    ];

    defaultReceipts.forEach(r => {
      this.receipts.set(r.id, r);
      if (r.eventId) this.eventIndex.set(r.eventId, r.id);
    });
    this.sequenceCounters.set('emp-1', 1);
  }

  async getAll(filter?: {
    empresaId?: string;
    ordenCompraId?: string;
    proveedorId?: string;
    estado?: string;
  }): Promise<RecepcionCompra[]> {
    let list = Array.from(this.receipts.values());
    if (!filter) return list.sort((a, b) => b.fechaHora.localeCompare(a.fechaHora));

    if (filter.empresaId) list = list.filter(r => r.empresaId === filter.empresaId);
    if (filter.ordenCompraId) list = list.filter(r => r.ordenCompraId === filter.ordenCompraId);
    if (filter.proveedorId) list = list.filter(r => r.proveedorId === filter.proveedorId);
    if (filter.estado) list = list.filter(r => r.estado === filter.estado);

    return list.sort((a, b) => b.fechaHora.localeCompare(a.fechaHora));
  }

  async getById(id: string): Promise<RecepcionCompra | null> {
    return this.receipts.get(id) || null;
  }

  async getByEventId(eventId: string): Promise<RecepcionCompra | null> {
    const id = this.eventIndex.get(eventId);
    if (!id) return null;
    return this.receipts.get(id) || null;
  }

  async getByOrdenId(ordenCompraId: string): Promise<RecepcionCompra[]> {
    return Array.from(this.receipts.values()).filter(r => r.ordenCompraId === ordenCompraId);
  }

  async getNextNumero(empresaId: string = 'emp-1'): Promise<string> {
    const current = this.sequenceCounters.get(empresaId) || 0;
    const next = current + 1;
    this.sequenceCounters.set(empresaId, next);
    return `REC-${next.toString().padStart(6, '0')}`;
  }

  async save(rec: RecepcionCompra): Promise<RecepcionCompra> {
    rec.updatedAt = new Date().toISOString();
    this.receipts.set(rec.id, rec);
    if (rec.eventId) {
      this.eventIndex.set(rec.eventId, rec.id);
    }
    return rec;
  }
}

export const purchaseReceiptRepository = new PurchaseReceiptRepository();
