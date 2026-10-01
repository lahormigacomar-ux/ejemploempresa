import { OrdenCompra } from '../types';

class PurchaseOrderRepository {
  private orders: Map<string, OrdenCompra> = new Map();
  private sequenceCounters: Map<string, number> = new Map();

  constructor() {
    this.seedInitialData();
  }

  resetForTesting() {
    this.orders.clear();
    this.sequenceCounters.clear();
    this.seedInitialData();
  }

  private seedInitialData() {
    const defaultOrders: OrdenCompra[] = [
      {
        id: 'oc-001',
        empresaId: 'emp-1',
        numero: 'OC-000001',
        proveedorId: 'prov-cem-01',
        proveedorNombreSnapshot: 'Loma Negra C.I.A.S.A.',
        proveedorCuitSnapshot: '30-50001234-9',
        solicitudCompraId: 'sc-001',
        cotizacionProveedorId: 'cot-001',
        fechaEmision: '2026-09-27T08:30:00Z',
        fechaEntregaEsperada: '2026-10-02',
        moneda: 'ARS',
        tipoCambioSnapshot: 1.0,
        condicionPago: 'CUENTA_CORRIENTE',
        plantaEntregaId: 'planta-1',
        centroCostoId: 'cc-hormigon',
        estado: 'PARCIALMENTE_RECIBIDA',
        subtotal: 10800000,
        descuentos: 0,
        impuestos: 2268000,
        total: 13068000,
        observaciones: 'Entrega en 2 viajes de tolva presurizada de 30 TN c/u',
        items: [
          {
            id: 'item-oc-101',
            ordenCompraId: 'oc-001',
            solicitudItemId: 'item-sc-101',
            articuloId: 'art-cemento-cp40',
            tipo: 'ARTICULO',
            descripcionSnapshot: 'Cemento Portland Normal a Granel (CP40)',
            cantidad: 60,
            unidadMedida: 'TN',
            precioUnitarioSnapshot: 180000,
            descuentoPctSnapshot: 0,
            ivaPctSnapshot: 21.0,
            otrosImpuestosSnapshot: 0,
            subtotal: 10800000,
            total: 13068000,
            cantidadRecibida: 30,
            cantidadPendiente: 30,
            centroCostoId: 'cc-hormigon'
          }
        ],
        createdAt: '2026-09-27T08:30:00Z',
        updatedAt: '2026-09-28T14:00:00Z'
      }
    ];

    defaultOrders.forEach(o => this.orders.set(o.id, o));
    this.sequenceCounters.set('emp-1', 1);
  }

  async getAll(filter?: {
    empresaId?: string;
    proveedorId?: string;
    estado?: string;
    fechaDesde?: string;
    fechaHasta?: string;
  }): Promise<OrdenCompra[]> {
    let list = Array.from(this.orders.values());
    if (!filter) return list.sort((a, b) => b.fechaEmision.localeCompare(a.fechaEmision));

    if (filter.empresaId) list = list.filter(o => o.empresaId === filter.empresaId);
    if (filter.proveedorId) list = list.filter(o => o.proveedorId === filter.proveedorId);
    if (filter.estado) list = list.filter(o => o.estado === filter.estado);
    if (filter.fechaDesde) list = list.filter(o => o.fechaEmision >= filter.fechaDesde!);
    if (filter.fechaHasta) list = list.filter(o => o.fechaEmision <= filter.fechaHasta!);

    return list.sort((a, b) => b.fechaEmision.localeCompare(a.fechaEmision));
  }

  async getById(id: string): Promise<OrdenCompra | null> {
    return this.orders.get(id) || null;
  }

  async getByNumero(empresaId: string, numero: string): Promise<OrdenCompra | null> {
    const list = Array.from(this.orders.values());
    return list.find(o => o.empresaId === empresaId && o.numero === numero) || null;
  }

  async getNextNumero(empresaId: string = 'emp-1'): Promise<string> {
    const current = this.sequenceCounters.get(empresaId) || 0;
    const next = current + 1;
    this.sequenceCounters.set(empresaId, next);
    return `OC-${next.toString().padStart(6, '0')}`;
  }

  async save(ord: OrdenCompra): Promise<OrdenCompra> {
    ord.updatedAt = new Date().toISOString();
    this.orders.set(ord.id, ord);
    return ord;
  }
}

export const purchaseOrderRepository = new PurchaseOrderRepository();
