import { ResultadoMatchingCompra, EstadoMatchingCompra } from '../types';
import { purchaseOrderRepository } from '../repositories/purchaseOrderRepository';
import { purchaseReceiptRepository } from '../repositories/purchaseReceiptRepository';
import { supplierInvoiceRepository } from '../repositories/supplierInvoiceRepository';

export class PurchaseMatchingService {
  async evaluateMatching(params: {
    ordenCompraId?: string;
    recepcionCompraId?: string;
    facturaProveedorId?: string;
    toleranciaPrecioPct?: number;
  }): Promise<ResultadoMatchingCompra> {
    const orden = params.ordenCompraId ? await purchaseOrderRepository.getById(params.ordenCompraId) : null;
    const recepcion = params.recepcionCompraId ? await purchaseReceiptRepository.getById(params.recepcionCompraId) : null;
    const factura = params.facturaProveedorId ? await supplierInvoiceRepository.getById(params.facturaProveedorId) : null;

    const detalles: string[] = [];

    if (!orden && factura?.ordenCompraId) {
      // Intentar vincular por la factura
      const linkedOrden = await purchaseOrderRepository.getById(factura.ordenCompraId);
      if (linkedOrden) return this.evaluateMatching({ ...params, ordenCompraId: linkedOrden.id });
    }

    if (!orden) {
      return {
        ordenCompraId: undefined,
        recepcionCompraId: recepcion?.id,
        facturaProveedorId: factura?.id,
        estadoMatching: 'SIN_ORDEN',
        cantidadOrdenada: 0,
        cantidadRecibida: recepcion?.items.reduce((s, it) => s + it.cantidadAceptada, 0) ?? 0,
        cantidadFacturada: factura?.items?.reduce((s, it) => s + it.cantidad, 0) ?? 0,
        montoOrdenado: 0,
        montoFacturado: factura?.totalComprobante ?? 0,
        diferenciaCantidad: 0,
        diferenciaMonto: 0,
        detalles: ['La factura o recepción no cuenta con una Orden de Compra asociada.']
      };
    }

    const cantidadOrdenada = orden.items.reduce((s, it) => s + it.cantidad, 0);
    const montoOrdenado = orden.total;

    // Calcular cantidad total recibida de la OC (a través de todas sus recepciones confirmadas)
    const allReceipts = await purchaseReceiptRepository.getByOrdenId(orden.id);
    const confirmedReceipts = allReceipts.filter(r => r.estado === 'CONFIRMADA');

    let cantidadRecibida = 0;
    for (const r of confirmedReceipts) {
      cantidadRecibida += r.items.reduce((s, it) => s + it.cantidadAceptada, 0);
    }

    if (confirmedReceipts.length === 0) {
      detalles.push('La Orden de Compra aún no registra recepciones de mercadería confirmadas.');
      return {
        ordenCompraId: orden.id,
        recepcionCompraId: undefined,
        facturaProveedorId: factura?.id,
        estadoMatching: 'SIN_RECEPCION',
        cantidadOrdenada,
        cantidadRecibida: 0,
        cantidadFacturada: factura?.items?.reduce((s, it) => s + it.cantidad, 0) ?? 0,
        montoOrdenado,
        montoFacturado: factura?.totalComprobante ?? 0,
        diferenciaCantidad: cantidadOrdenada,
        diferenciaMonto: montoOrdenado,
        detalles
      };
    }

    // Cantidad y monto facturado
    const cantidadFacturada = factura?.items?.reduce((s, it) => s + it.cantidad, 0) ?? cantidadRecibida;
    const montoFacturado = factura?.totalComprobante ?? montoOrdenado;

    // Calcular monto ordenado esperado según los precios de la OC para las cantidades facturadas
    let montoOrdenadoEsperado = montoOrdenado;
    if (factura?.items && factura.items.length > 0 && orden.items.length > 0) {
      let expectedNeto = 0;
      let expectedIva = 0;
      for (const itemFac of factura.items) {
        // Buscar el item correspondiente en la OC
        const ocItem =
          (itemFac.ordenCompraItemId && orden.items.find(it => it.id === itemFac.ordenCompraItemId)) ||
          orden.items[0];

        const precioOC = ocItem ? ocItem.precioUnitarioSnapshot : itemFac.precioUnitario;
        const ivaPct = itemFac.ivaPct ?? ocItem?.ivaPctSnapshot ?? 21.0;
        const itemNeto = itemFac.cantidad * precioOC;
        const itemIva = (itemNeto * ivaPct) / 100;
        expectedNeto += itemNeto;
        expectedIva += itemIva;
      }
      const totalPercepciones = (factura.percepcionesIIBB || 0) + (factura.percepcionesIVA || 0);
      montoOrdenadoEsperado = Number((expectedNeto + expectedIva + totalPercepciones).toFixed(2));
    }

    const diferenciaCantidad = Number((cantidadFacturada - cantidadRecibida).toFixed(2));
    const diferenciaMonto = Number((montoFacturado - montoOrdenadoEsperado).toFixed(2));

    let estadoMatching: EstadoMatchingCompra = 'OK';

    if (diferenciaCantidad !== 0) {
      estadoMatching = 'DIFERENCIA_CANTIDAD';
      detalles.push(
        `Discrepancia en cantidades: Facturado (${cantidadFacturada}) vs Recibido físico (${cantidadRecibida}). Diferencia: ${diferenciaCantidad > 0 ? '+' : ''}${diferenciaCantidad}`
      );
    }

    const tolPct = params.toleranciaPrecioPct ?? 0;
    const maxDifPermitida = (montoOrdenadoEsperado * tolPct) / 100;

    if (Math.abs(diferenciaMonto) > maxDifPermitida && diferenciaMonto !== 0) {
      if (estadoMatching === 'OK') estadoMatching = 'DIFERENCIA_PRECIO';
      detalles.push(
        `Discrepancia en importes: Facturado ($${montoFacturado.toLocaleString()}) vs Ordenado ($${montoOrdenadoEsperado.toLocaleString()}). Diferencia: ${diferenciaMonto > 0 ? '+' : ''}$${diferenciaMonto.toLocaleString()}`
      );
    }

    if (estadoMatching === 'OK') {
      detalles.push('Conciliación perfecta (3-Way Matching): Ordenado, Recibido y Facturado coinciden plenamente.');
    }

    return {
      ordenCompraId: orden.id,
      recepcionCompraId: recepcion?.id || confirmedReceipts[0]?.id,
      facturaProveedorId: factura?.id,
      estadoMatching,
      cantidadOrdenada,
      cantidadRecibida,
      cantidadFacturada,
      montoOrdenado: montoOrdenadoEsperado,
      montoFacturado,
      diferenciaCantidad,
      diferenciaMonto,
      detalles
    };
  }
}

export const purchaseMatchingService = new PurchaseMatchingService();
