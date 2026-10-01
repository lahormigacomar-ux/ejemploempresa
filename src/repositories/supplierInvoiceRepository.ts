import { FacturaProveedor, TipoComprobanteProveedor } from '../types';

class SupplierInvoiceRepository {
  private invoices: Map<string, FacturaProveedor> = new Map();

  constructor() {
    this.seedInitialData();
  }

  resetForTesting() {
    this.invoices.clear();
    this.seedInitialData();
  }

  private seedInitialData() {
    const defaultInvoices: FacturaProveedor[] = [
      {
        id: 'fac-prov-001',
        empresaId: 'emp-1',
        proveedorId: 'prov-cem-01',
        proveedorNombreSnapshot: 'Loma Negra C.I.A.S.A.',
        proveedorCuitSnapshot: '30-50001234-9',
        tipoComprobante: 'FACTURA_A',
        puntoVenta: 14,
        numeroComprobante: 89124,
        fechaEmision: '2026-09-28',
        fechaVencimiento: '2026-10-28',
        moneda: 'ARS',
        tipoCambioSnapshot: 1.0,
        subtotalNetoGravado: 5400000,
        subtotalNoGravado: 0,
        iva21: 1134000,
        iva105: 0,
        iva27: 0,
        totalIva: 1134000,
        percepcionesIIBB: 162000,
        percepcionesIVA: 0,
        totalComprobante: 6696000,
        ordenCompraId: 'oc-001',
        recepcionCompraId: 'rec-001',
        estado: 'REGISTRADA',
        observaciones: 'Factura parcial por 30 TN recibidas en primer viaje',
        items: [
          {
            id: 'item-fac-101',
            facturaId: 'fac-prov-001',
            ordenCompraItemId: 'item-oc-101',
            descripcion: 'Cemento Portland Normal a Granel (CP40) - 30 TN',
            cantidad: 30,
            precioUnitario: 180000,
            ivaPct: 21.0,
            subtotal: 5400000,
            total: 6534000
          }
        ],
        createdAt: '2026-09-28T16:00:00Z',
        updatedAt: '2026-09-28T16:00:00Z'
      }
    ];

    defaultInvoices.forEach(f => this.invoices.set(f.id, f));
  }

  async getAll(filter?: {
    empresaId?: string;
    proveedorId?: string;
    estado?: string;
    ordenCompraId?: string;
  }): Promise<FacturaProveedor[]> {
    let list = Array.from(this.invoices.values());
    if (!filter) return list.sort((a, b) => b.fechaEmision.localeCompare(a.fechaEmision));

    if (filter.empresaId) list = list.filter(f => f.empresaId === filter.empresaId);
    if (filter.proveedorId) list = list.filter(f => f.proveedorId === filter.proveedorId);
    if (filter.estado) list = list.filter(f => f.estado === filter.estado);
    if (filter.ordenCompraId) list = list.filter(f => f.ordenCompraId === filter.ordenCompraId);

    return list.sort((a, b) => b.fechaEmision.localeCompare(a.fechaEmision));
  }

  async getById(id: string): Promise<FacturaProveedor | null> {
    return this.invoices.get(id) || null;
  }

  async getByFiscalKey(
    empresaId: string,
    proveedorId: string,
    tipoComprobante: TipoComprobanteProveedor,
    puntoVenta: number,
    numeroComprobante: number
  ): Promise<FacturaProveedor | null> {
    const list = Array.from(this.invoices.values());
    return (
      list.find(
        f =>
          f.empresaId === empresaId &&
          f.proveedorId === proveedorId &&
          f.tipoComprobante === tipoComprobante &&
          f.puntoVenta === puntoVenta &&
          f.numeroComprobante === numeroComprobante
      ) || null
    );
  }

  async save(fac: FacturaProveedor): Promise<FacturaProveedor> {
    fac.updatedAt = new Date().toISOString();
    this.invoices.set(fac.id, fac);
    return fac;
  }
}

export const supplierInvoiceRepository = new SupplierInvoiceRepository();
