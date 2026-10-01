import { CotizacionProveedor, CotizacionProveedorItem, Moneda, CondicionPago } from '../types';
import { purchaseQuotationRepository } from '../repositories/purchaseQuotationRepository';
import { supplierRepository } from '../repositories/supplierRepository';
import { purchaseRequestRepository } from '../repositories/purchaseRequestRepository';
import { auditRepository } from '../repositories/auditRepository';

export class PurchaseQuotationService {
  async createQuotation(params: {
    empresaId?: string;
    solicitudCompraId?: string;
    proveedorId: string;
    fechaEmision?: string;
    fechaVencimiento: string;
    moneda?: Moneda;
    condicionPago?: CondicionPago;
    plazoEntregaDias?: number;
    observaciones?: string;
    items: {
      solicitudItemId?: string;
      articuloId?: string;
      tipoCombustibleId?: string;
      descripcion: string;
      cantidad: number;
      precioUnitario: number;
      descuentoPct?: number;
      ivaPct?: number;
      otrosImpuestos?: number;
      plazoEntregaDias?: number;
    }[];
    usuarioId?: string;
  }): Promise<CotizacionProveedor> {
    const empresaId = params.empresaId || 'emp-1';

    // 1. Validar Proveedor y aislamiento multiempresa
    const prov = await supplierRepository.getById(params.proveedorId);
    if (!prov) throw new Error(`Proveedor ${params.proveedorId} no encontrado`);
    if (prov.empresaId !== empresaId) {
      throw new Error(`Aislamiento multiempresa violado: El proveedor ${prov.razonSocial} pertenece a la empresa ${prov.empresaId} y no a ${empresaId}`);
    }
    if (prov.estado !== 'ACTIVO') {
      throw new Error(`El proveedor ${prov.razonSocial} no se encuentra ACTIVO (Estado: ${prov.estado})`);
    }

    if (params.solicitudCompraId) {
      const req = await purchaseRequestRepository.getById(params.solicitudCompraId);
      if (req && req.empresaId !== empresaId) {
        throw new Error(`Aislamiento multiempresa violado: La solicitud ${req.numero} pertenece a la empresa ${req.empresaId} y no a ${empresaId}`);
      }
    }

    if (!params.items || params.items.length === 0) {
      throw new Error('La cotización debe contener al menos un item cotizado');
    }

    const id = `cot-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
    const numero = await purchaseQuotationRepository.getNextNumero(empresaId);
    const now = new Date().toISOString();

    let subtotalGeneral = 0;
    let descuentosGeneral = 0;
    let impuestosGeneral = 0;

    const quotationItems: CotizacionProveedorItem[] = params.items.map((it, idx) => {
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
        id: `cot-item-${id}-${idx + 1}`,
        cotizacionId: id,
        solicitudItemId: it.solicitudItemId,
        articuloId: it.articuloId,
        tipoCombustibleId: it.tipoCombustibleId,
        descripcionSnapshot: it.descripcion.trim(),
        cantidad: it.cantidad,
        precioUnitario: it.precioUnitario,
        descuentoPct: descPct,
        ivaPct,
        otrosImpuestos: otros,
        subtotal: subtotalNeto,
        total: totalItem,
        plazoEntregaDias: it.plazoEntregaDias ?? params.plazoEntregaDias
      };
    });

    const totalGeneral = Number((subtotalGeneral + impuestosGeneral).toFixed(2));

    const quotation: CotizacionProveedor = {
      id,
      empresaId,
      numero,
      solicitudCompraId: params.solicitudCompraId,
      proveedorId: prov.id,
      proveedorNombreSnapshot: prov.razonSocial,
      fechaEmision: params.fechaEmision || now.split('T')[0],
      fechaVencimiento: params.fechaVencimiento,
      moneda: params.moneda || 'ARS',
      condicionPago: params.condicionPago || prov.condicionPagoDefault || 'CUENTA_CORRIENTE',
      plazoEntregaDias: params.plazoEntregaDias ?? prov.tiempoEntregaDiasEstimado ?? 3,
      subtotal: Number(subtotalGeneral.toFixed(2)),
      descuentos: Number(descuentosGeneral.toFixed(2)),
      impuestos: Number(impuestosGeneral.toFixed(2)),
      total: totalGeneral,
      items: quotationItems,
      estado: 'RECIBIDA',
      observaciones: params.observaciones,
      createdAt: now,
      updatedAt: now
    };

    await purchaseQuotationRepository.save(quotation);

    // Si está vinculada a una solicitud, actualizar estado de la solicitud a EN_COTIZACION si estaba APROBADA
    if (params.solicitudCompraId) {
      const req = await purchaseRequestRepository.getById(params.solicitudCompraId);
      if (req && req.estado === 'APROBADA') {
        req.estado = 'EN_COTIZACION';
        await purchaseRequestRepository.save(req);
      }
    }

    await auditRepository.recordAction(
      'comp_cotizaciones',
      quotation.id,
      'REGISTRO_COTIZACION',
      null,
      { numero: quotation.numero, proveedor: prov.razonSocial, total: quotation.total },
      `Cotización ${quotation.numero} registrada de proveedor ${prov.razonSocial} ($${quotation.total.toLocaleString()})`,
      params.usuarioId || 'admin_compras'
    );

    return quotation;
  }

  async selectQuotation(quotationId: string, usuarioId: string = 'admin_compras'): Promise<CotizacionProveedor> {
    const cot = await purchaseQuotationRepository.getById(quotationId);
    if (!cot) throw new Error(`Cotización ${quotationId} no encontrada`);

    cot.estado = 'SELECCIONADA';
    cot.updatedAt = new Date().toISOString();
    await purchaseQuotationRepository.save(cot);

    // Descartar otras cotizaciones para la misma solicitud
    if (cot.solicitudCompraId) {
      const allForReq = await purchaseQuotationRepository.getBySolicitudId(cot.solicitudCompraId);
      for (const other of allForReq) {
        if (other.id !== cot.id && other.estado === 'RECIBIDA') {
          other.estado = 'DESCARTADA';
          await purchaseQuotationRepository.save(other);
        }
      }
    }

    await auditRepository.recordAction(
      'comp_cotizaciones',
      cot.id,
      'SELECCION_COTIZACION',
      null,
      { cotizacionNumero: cot.numero, proveedor: cot.proveedorNombreSnapshot, total: cot.total },
      `Cotización ${cot.numero} SELECCIONADA como oferta adjudicada`,
      usuarioId
    );

    return cot;
  }
}

export const purchaseQuotationService = new PurchaseQuotationService();
