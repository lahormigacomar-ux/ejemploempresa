import { CotizacionProveedor } from '../types';

class PurchaseQuotationRepository {
  private quotations: Map<string, CotizacionProveedor> = new Map();
  private sequenceCounters: Map<string, number> = new Map();

  constructor() {
    this.seedInitialData();
  }

  resetForTesting() {
    this.quotations.clear();
    this.sequenceCounters.clear();
    this.seedInitialData();
  }

  private seedInitialData() {
    const defaultQuotations: CotizacionProveedor[] = [
      {
        id: 'cot-001',
        empresaId: 'emp-1',
        numero: 'COT-000001',
        solicitudCompraId: 'sc-001',
        proveedorId: 'prov-cem-01',
        proveedorNombreSnapshot: 'Loma Negra C.I.A.S.A.',
        fechaEmision: '2026-09-26',
        fechaVencimiento: '2026-10-10',
        moneda: 'ARS',
        condicionPago: 'CUENTA_CORRIENTE',
        plazoEntregaDias: 2,
        subtotal: 10800000,
        descuentos: 0,
        impuestos: 2268000,
        total: 13068000,
        estado: 'SELECCIONADA',
        observaciones: 'Cotización cemento granel puesta en planta PC01',
        items: [
          {
            id: 'item-cot-101',
            cotizacionId: 'cot-001',
            solicitudItemId: 'item-sc-101',
            descripcionSnapshot: 'Cemento Portland Normal a Granel (CP40)',
            cantidad: 60,
            precioUnitario: 180000,
            descuentoPct: 0,
            ivaPct: 21.0,
            otrosImpuestos: 0,
            subtotal: 10800000,
            total: 13068000,
            plazoEntregaDias: 2
          }
        ],
        createdAt: '2026-09-26T10:00:00Z',
        updatedAt: '2026-09-26T15:00:00Z'
      }
    ];

    defaultQuotations.forEach(q => this.quotations.set(q.id, q));
    this.sequenceCounters.set('emp-1', 1);
  }

  async getAll(filter?: {
    empresaId?: string;
    solicitudId?: string;
    proveedorId?: string;
    estado?: string;
  }): Promise<CotizacionProveedor[]> {
    let list = Array.from(this.quotations.values());
    if (!filter) return list.sort((a, b) => b.fechaEmision.localeCompare(a.fechaEmision));

    if (filter.empresaId) list = list.filter(q => q.empresaId === filter.empresaId);
    if (filter.solicitudId) list = list.filter(q => q.solicitudCompraId === filter.solicitudId);
    if (filter.proveedorId) list = list.filter(q => q.proveedorId === filter.proveedorId);
    if (filter.estado) list = list.filter(q => q.estado === filter.estado);

    return list.sort((a, b) => b.fechaEmision.localeCompare(a.fechaEmision));
  }

  async getById(id: string): Promise<CotizacionProveedor | null> {
    return this.quotations.get(id) || null;
  }

  async getBySolicitudId(solicitudId: string): Promise<CotizacionProveedor[]> {
    return Array.from(this.quotations.values()).filter(q => q.solicitudCompraId === solicitudId);
  }

  async getNextNumero(empresaId: string = 'emp-1'): Promise<string> {
    const current = this.sequenceCounters.get(empresaId) || 0;
    const next = current + 1;
    this.sequenceCounters.set(empresaId, next);
    return `COT-${next.toString().padStart(6, '0')}`;
  }

  async save(cot: CotizacionProveedor): Promise<CotizacionProveedor> {
    cot.updatedAt = new Date().toISOString();
    this.quotations.set(cot.id, cot);
    return cot;
  }
}

export const purchaseQuotationRepository = new PurchaseQuotationRepository();
