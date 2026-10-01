import {
  FacturaProveedor,
  TipoComprobanteProveedor,
  Moneda,
  FacturaProveedorItem
} from '../types';
import { supplierInvoiceRepository } from '../repositories/supplierInvoiceRepository';
import { supplierRepository } from '../repositories/supplierRepository';
import { purchaseOrderRepository } from '../repositories/purchaseOrderRepository';
import { auditRepository } from '../repositories/auditRepository';

export class SupplierInvoiceService {
  async registerInvoice(params: {
    empresaId?: string;
    proveedorId: string;
    tipoComprobante: TipoComprobanteProveedor;
    puntoVenta: number;
    numeroComprobante: number;
    fechaEmision: string;
    fechaVencimiento: string;
    moneda?: Moneda;
    tipoCambio?: number;
    subtotalNetoGravado: number;
    subtotalNoGravado?: number;
    iva21?: number;
    iva105?: number;
    iva27?: number;
    percepcionesIIBB?: number;
    percepcionesIVA?: number;
    totalComprobante: number;
    ordenCompraId?: string;
    recepcionCompraId?: string;
    observaciones?: string;
    items?: {
      ordenCompraItemId?: string;
      descripcion: string;
      cantidad: number;
      precioUnitario: number;
      ivaPct: number;
    }[];
    usuarioId?: string;
  }): Promise<FacturaProveedor> {
    const empresaId = params.empresaId || 'emp-1';

    // 1. Validar Proveedor
    const prov = await supplierRepository.getById(params.proveedorId);
    if (!prov) throw new Error(`Proveedor ${params.proveedorId} no encontrado`);
    if (prov.empresaId !== empresaId) {
      throw new Error(`Aislamiento multiempresa violado: El proveedor ${prov.razonSocial} pertenece a la empresa ${prov.empresaId} y no a ${empresaId}`);
    }

    if (params.ordenCompraId) {
      const oc = await purchaseOrderRepository.getById(params.ordenCompraId);
      if (oc && oc.empresaId !== empresaId) {
        throw new Error(`Aislamiento multiempresa violado: La Orden de Compra ${oc.numero} pertenece a la empresa ${oc.empresaId} y no a ${empresaId}`);
      }
    }

    if (params.puntoVenta <= 0 || params.numeroComprobante <= 0) {
      throw new Error('El punto de venta y número de comprobante deben ser números positivos válidos');
    }

    // 2. Control Estricto de Unicidad Fiscal por Proveedor
    const existing = await supplierInvoiceRepository.getByFiscalKey(
      empresaId,
      params.proveedorId,
      params.tipoComprobante,
      params.puntoVenta,
      params.numeroComprobante
    );
    if (existing && existing.estado !== 'ANULADA') {
      throw new Error(
        `El comprobante fiscal ${params.tipoComprobante} ${params.puntoVenta.toString().padStart(4, '0')}-${params.numeroComprobante.toString().padStart(8, '0')} ya se encuentra registrado para el proveedor ${prov.razonSocial}`
      );
    }

    const subNoGravado = params.subtotalNoGravado ?? 0;
    const iva21 = params.iva21 ?? 0;
    const iva105 = params.iva105 ?? 0;
    const iva27 = params.iva27 ?? 0;
    const totalIva = Number((iva21 + iva105 + iva27).toFixed(2));
    const percIIBB = params.percepcionesIIBB ?? 0;
    const percIVA = params.percepcionesIVA ?? 0;

    const totalCalculado = Number(
      (params.subtotalNetoGravado + subNoGravado + totalIva + percIIBB + percIVA).toFixed(2)
    );

    if (Math.abs(totalCalculado - params.totalComprobante) > 0.05) {
      throw new Error(
        `Inconsistencia aritmética en la factura: La suma de netos e impuestos ($${totalCalculado}) no coincide con el total informado ($${params.totalComprobante})`
      );
    }

    const id = `fac-prov-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
    const now = new Date().toISOString();

    const invoiceItems: FacturaProveedorItem[] | undefined = params.items?.map((it, idx) => {
      const sub = Number((it.cantidad * it.precioUnitario).toFixed(2));
      const tot = Number((sub * (1 + it.ivaPct / 100)).toFixed(2));
      return {
        id: `fac-item-${id}-${idx + 1}`,
        facturaId: id,
        ordenCompraItemId: it.ordenCompraItemId,
        descripcion: it.descripcion,
        cantidad: it.cantidad,
        precioUnitario: it.precioUnitario,
        ivaPct: it.ivaPct,
        subtotal: sub,
        total: tot
      };
    });

    const invoice: FacturaProveedor = {
      id,
      empresaId,
      proveedorId: prov.id,
      proveedorNombreSnapshot: prov.razonSocial,
      proveedorCuitSnapshot: prov.numeroDocumento,
      tipoComprobante: params.tipoComprobante,
      puntoVenta: params.puntoVenta,
      numeroComprobante: params.numeroComprobante,
      fechaEmision: params.fechaEmision,
      fechaVencimiento: params.fechaVencimiento,
      moneda: params.moneda || 'ARS',
      tipoCambioSnapshot: params.tipoCambio ?? 1.0,
      subtotalNetoGravado: params.subtotalNetoGravado,
      subtotalNoGravado: subNoGravado,
      iva21,
      iva105,
      iva27,
      totalIva,
      percepcionesIIBB: percIIBB,
      percepcionesIVA: percIVA,
      totalComprobante: params.totalComprobante,
      ordenCompraId: params.ordenCompraId,
      recepcionCompraId: params.recepcionCompraId,
      items: invoiceItems,
      estado: 'REGISTRADA',
      observaciones: params.observaciones,
      createdAt: now,
      updatedAt: now
    };

    await supplierInvoiceRepository.save(invoice);

    await auditRepository.recordAction(
      'comp_facturas_proveedor',
      invoice.id,
      'REGISTRO_FACTURA_PROVEEDOR',
      null,
      {
        proveedor: prov.razonSocial,
        comprobante: `${invoice.tipoComprobante} ${invoice.puntoVenta}-${invoice.numeroComprobante}`,
        total: invoice.totalComprobante
      },
      `Factura ${invoice.tipoComprobante} ${invoice.puntoVenta}-${invoice.numeroComprobante} de ${prov.razonSocial} registrada ($${invoice.totalComprobante.toLocaleString()})`,
      params.usuarioId || 'admin_compras'
    );

    return invoice;
  }

  async cancelInvoice(
    invoiceId: string,
    motivo: string,
    usuarioId: string = 'admin_compras'
  ): Promise<FacturaProveedor> {
    const inv = await supplierInvoiceRepository.getById(invoiceId);
    if (!inv) throw new Error(`Factura ${invoiceId} no encontrada`);
    if (inv.estado === 'ANULADA') throw new Error('La factura ya se encuentra ANULADA');

    if (!motivo || motivo.trim() === '') {
      throw new Error('Debe especificar un motivo formal para la anulación de la factura');
    }

    const now = new Date().toISOString();
    inv.estado = 'ANULADA';
    inv.fechaAnulacion = now;
    inv.usuarioAnulacion = usuarioId;
    inv.motivoAnulacion = motivo;
    inv.updatedAt = now;

    await supplierInvoiceRepository.save(inv);

    await auditRepository.recordAction(
      'comp_facturas_proveedor',
      inv.id,
      'ANULACION_FACTURA_PROVEEDOR',
      { estado: 'REGISTRADA' },
      { estado: 'ANULADA', motivo },
      `Factura ${inv.tipoComprobante} ${inv.puntoVenta}-${inv.numeroComprobante} ANULADA: ${motivo}`,
      usuarioId
    );

    return inv;
  }
}

export const supplierInvoiceService = new SupplierInvoiceService();
