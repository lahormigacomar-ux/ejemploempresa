import {
  OrdenCompra,
  OrdenCompraItem,
  Moneda,
  CondicionPago,
  TipoItemCompra
} from '../types';
import { purchaseOrderRepository } from '../repositories/purchaseOrderRepository';
import { supplierRepository } from '../repositories/supplierRepository';
import { purchaseRequestRepository } from '../repositories/purchaseRequestRepository';
import { auditRepository } from '../repositories/auditRepository';

export class PurchaseOrderService {
  async createOrder(params: {
    empresaId?: string;
    proveedorId: string;
    solicitudCompraId?: string;
    cotizacionProveedorId?: string;
    fechaEntregaEsperada?: string;
    moneda?: Moneda;
    tipoCambio?: number;
    condicionPago?: CondicionPago;
    plantaEntregaId?: string;
    depositoEntregaId?: string;
    centroCostoId?: string;
    observaciones?: string;
    items: {
      solicitudItemId?: string;
      articuloId?: string;
      tipo?: TipoItemCompra;
      descripcion: string;
      cantidad: number;
      unidadMedida: string;
      precioUnitario: number;
      descuentoPct?: number;
      ivaPct?: number;
      otrosImpuestos?: number;
      centroCostoId?: string;
      equipoId?: string;
      ordenTrabajoId?: string;
    }[];
    usuarioId?: string;
  }): Promise<OrdenCompra> {
    const empresaId = params.empresaId || 'emp-1';

    // 1. Validar Proveedor
    const prov = await supplierRepository.getById(params.proveedorId);
    if (!prov) throw new Error(`Proveedor ${params.proveedorId} no encontrado`);
    if (prov.estado !== 'ACTIVO') {
      throw new Error(`El proveedor ${prov.razonSocial} no se encuentra ACTIVO (Estado: ${prov.estado})`);
    }

    // 2. Si viene de una Solicitud de Compra, validar estado
    let solicitud = null;
    if (params.solicitudCompraId) {
      solicitud = await purchaseRequestRepository.getById(params.solicitudCompraId);
      if (!solicitud) throw new Error(`Solicitud de compra ${params.solicitudCompraId} no encontrada`);
      if (solicitud.requiereAprobacion && solicitud.estado !== 'APROBADA' && solicitud.estado !== 'EN_COTIZACION' && solicitud.estado !== 'PARCIALMENTE_ORDENADA') {
        throw new Error(`No se puede emitir una Orden de Compra para una solicitud en estado ${solicitud.estado} (Requiere APROBADA)`);
      }
    }

    if (!params.items || params.items.length === 0) {
      throw new Error('La Orden de Compra debe contener al menos un item');
    }

    const id = `oc-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
    const numero = await purchaseOrderRepository.getNextNumero(empresaId);
    const now = new Date().toISOString();

    let subtotalGeneral = 0;
    let descuentosGeneral = 0;
    let impuestosGeneral = 0;

    const orderItems: OrdenCompraItem[] = params.items.map((it, idx) => {
      const descPct = it.descuentoPct ?? 0;
      const ivaPct = it.ivaPct ?? 21.0;
      const otros = it.otrosImpuestos ?? 0;

      const baseBruta = it.cantidad * it.precioUnitario;
      const montoDescuento = Number((baseBruta * (descPct / 100)).toFixed(2));
      const subtotalNeto = Number((baseBruta - montoDescuento).toFixed(2));
      const montoIva = Number((subtotalNeto * (ivaPct / 100)).toFixed(2));
      const totalItem = Number((subtotalNeto + montoIva + otros).toFixed(2));

      subtotalGeneral += subtotalNeto;
      descuentosGeneral += montoDescuento;
      impuestosGeneral += (montoIva + otros);

      return {
        id: `oc-item-${id}-${idx + 1}`,
        ordenCompraId: id,
        solicitudItemId: it.solicitudItemId,
        articuloId: it.articuloId,
        tipo: it.tipo || 'ARTICULO',
        descripcionSnapshot: it.descripcion.trim(),
        cantidad: it.cantidad,
        unidadMedida: it.unidadMedida || 'UNIDAD',
        precioUnitarioSnapshot: it.precioUnitario,
        descuentoPctSnapshot: descPct,
        ivaPctSnapshot: ivaPct,
        otrosImpuestosSnapshot: otros,
        subtotal: subtotalNeto,
        total: totalItem,
        cantidadRecibida: 0,
        cantidadPendiente: it.cantidad,
        centroCostoId: it.centroCostoId || params.centroCostoId,
        equipoId: it.equipoId,
        ordenTrabajoId: it.ordenTrabajoId
      };
    });

    const totalGeneral = Number((subtotalGeneral + impuestosGeneral).toFixed(2));

    const order: OrdenCompra = {
      id,
      empresaId,
      numero,
      proveedorId: prov.id,
      proveedorNombreSnapshot: prov.razonSocial,
      proveedorCuitSnapshot: prov.numeroDocumento,
      solicitudCompraId: params.solicitudCompraId,
      cotizacionProveedorId: params.cotizacionProveedorId,
      fechaEmision: now,
      fechaEntregaEsperada: params.fechaEntregaEsperada,
      moneda: params.moneda || 'ARS',
      tipoCambioSnapshot: params.tipoCambio ?? 1.0,
      condicionPago: params.condicionPago || prov.condicionPagoDefault || 'CUENTA_CORRIENTE',
      plantaEntregaId: params.plantaEntregaId,
      depositoEntregaId: params.depositoEntregaId,
      centroCostoId: params.centroCostoId,
      estado: 'EMITIDA',
      subtotal: Number(subtotalGeneral.toFixed(2)),
      descuentos: Number(descuentosGeneral.toFixed(2)),
      impuestos: Number(impuestosGeneral.toFixed(2)),
      total: totalGeneral,
      items: orderItems,
      observaciones: params.observaciones,
      createdAt: now,
      updatedAt: now
    };

    await purchaseOrderRepository.save(order);

    // Si viene de solicitud, actualizar cantidades ordenadas en la solicitud
    if (solicitud) {
      let todosItemsCompletos = true;
      for (const it of order.items) {
        if (it.solicitudItemId) {
          const reqItem = solicitud.items.find(x => x.id === it.solicitudItemId);
          if (reqItem) {
            reqItem.cantidadOrdenada += it.cantidad;
            reqItem.cantidadPendiente = Math.max(0, reqItem.cantidad - reqItem.cantidadOrdenada);
          }
        }
      }
      for (const reqIt of solicitud.items) {
        if (reqIt.cantidadPendiente > 0) {
          todosItemsCompletos = false;
        }
      }
      solicitud.estado = todosItemsCompletos ? 'ORDENADA' : 'PARCIALMENTE_ORDENADA';
      await purchaseRequestRepository.save(solicitud);
    }

    await auditRepository.recordAction(
      'comp_ordenes_compra',
      order.id,
      'EMISION_ORDEN_COMPRA',
      null,
      { numero: order.numero, proveedor: prov.razonSocial, total: order.total },
      `Orden de Compra ${order.numero} EMITIDA a ${prov.razonSocial} ($${order.total.toLocaleString()})`,
      params.usuarioId || 'admin_compras'
    );

    return order;
  }

  async cancelOrder(
    orderId: string,
    motivo: string,
    usuarioId: string = 'admin_compras'
  ): Promise<OrdenCompra> {
    const ord = await purchaseOrderRepository.getById(orderId);
    if (!ord) throw new Error(`Orden de compra ${orderId} no encontrada`);

    if (ord.estado === 'RECIBIDA' || ord.estado === 'CANCELADA' || ord.estado === 'CERRADA') {
      throw new Error(`La Orden de Compra ${ord.numero} no puede cancelarse en estado ${ord.estado}`);
    }

    if (!motivo || motivo.trim() === '') {
      throw new Error('Debe especificar un motivo formal para la cancelación de la Orden de Compra');
    }

    const now = new Date().toISOString();
    ord.estado = 'CANCELADA';
    ord.fechaCancelacion = now;
    ord.usuarioCancelacion = usuarioId;
    ord.motivoCancelacion = motivo;
    ord.updatedAt = now;

    await purchaseOrderRepository.save(ord);

    await auditRepository.recordAction(
      'comp_ordenes_compra',
      ord.id,
      'CANCELACION_ORDEN_COMPRA',
      { estado: 'EMITIDA' },
      { estado: 'CANCELADA', motivo },
      `Orden de Compra ${ord.numero} CANCELADA: ${motivo}`,
      usuarioId
    );

    return ord;
  }
}

export const purchaseOrderService = new PurchaseOrderService();
