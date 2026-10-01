import { RecepcionCompra, RecepcionCompraItem } from '../types';
import { purchaseReceiptRepository } from '../repositories/purchaseReceiptRepository';
import { purchaseOrderRepository } from '../repositories/purchaseOrderRepository';
import { employeeRepository } from '../repositories/employeeRepository';
import { tankRepository } from '../repositories/tankRepository';
import { tankService } from './tankService';
import { auditRepository } from '../repositories/auditRepository';

export class PurchaseReceiptService {
  async confirmReceipt(params: {
    empresaId?: string;
    ordenCompraId: string;
    numeroRemitoProveedor?: string;
    plantaId?: string;
    depositoId?: string;
    tanqueId?: string; // Para recepciones de combustible integradas a tanques
    recibidoPorEmpleadoId: string;
    observaciones?: string;
    fechaHora?: string;
    eventId?: string;
    items: {
      ordenCompraItemId: string;
      cantidadRecibida: number;
      cantidadAceptada: number;
      cantidadRechazada?: number;
      motivoRechazo?: string;
    }[];
    usuarioId?: string;
  }): Promise<{ receipt: RecepcionCompra; isDuplicate: boolean }> {
    const empresaId = params.empresaId || 'emp-1';
    const now = params.fechaHora || new Date().toISOString();

    // 0. Idempotencia técnica por eventId
    if (params.eventId) {
      const existing = await purchaseReceiptRepository.getByEventId(params.eventId);
      if (existing) {
        return { receipt: existing, isDuplicate: true };
      }
    }

    // =========================================================================
    // 1. FASE DE PRE-VALIDACIÓN ESTRICTA (Sin mutaciones de estado)
    // =========================================================================
    const ord = await purchaseOrderRepository.getById(params.ordenCompraId);
    if (!ord) throw new Error(`Orden de compra ${params.ordenCompraId} no encontrada`);

    if (ord.estado === 'CANCELADA' || ord.estado === 'BORRADOR' || ord.estado === 'CERRADA') {
      throw new Error(`No se puede recibir mercadería de una Orden de Compra en estado ${ord.estado}`);
    }

    const receptor = await employeeRepository.getById(params.recibidoPorEmpleadoId);
    if (!receptor) {
      throw new Error(`Empleado receptor ${params.recibidoPorEmpleadoId} no encontrado en RRHH`);
    }
    if (receptor.estado !== 'ACTIVO') {
      throw new Error(`El empleado receptor no se encuentra en estado ACTIVO (Estado: ${receptor.estado})`);
    }

    if (!params.items || params.items.length === 0) {
      throw new Error('La recepción debe contener al menos un item');
    }

    // Pre-validar cada item y control estricto de no sobre-recepción
    for (const it of params.items) {
      const ocItem = ord.items.find(x => x.id === it.ordenCompraItemId);
      if (!ocItem) {
        throw new Error(`Item ${it.ordenCompraItemId} no pertenece a la Orden de Compra ${ord.numero}`);
      }

      if (it.cantidadRecibida <= 0) {
        throw new Error(`La cantidad recibida para "${ocItem.descripcionSnapshot}" debe ser mayor a 0`);
      }

      const rechazada = it.cantidadRechazada ?? 0;
      if (it.cantidadAceptada + rechazada !== it.cantidadRecibida) {
        throw new Error(
          `Inconsistencia en cantidades del item "${ocItem.descripcionSnapshot}": Aceptada (${it.cantidadAceptada}) + Rechazada (${rechazada}) debe ser igual a Recibida (${it.cantidadRecibida})`
        );
      }

      // Regla de NO SOBRE-RECEPCIÓN
      const totalRecibidoAcumulado = ocItem.cantidadRecibida + it.cantidadAceptada;
      if (totalRecibidoAcumulado > ocItem.cantidad) {
        throw new Error(
          `Sobre-recepción rechazada: La cantidad aceptada acumulada (${totalRecibidoAcumulado} ${ocItem.unidadMedida}) supera la cantidad ordenada (${ocItem.cantidad} ${ocItem.unidadMedida}) para el item "${ocItem.descripcionSnapshot}"`
        );
      }
    }

    // Si tiene tanqueId, prevalidar que el tanque exista y esté ACTIVO
    if (params.tanqueId) {
      const tank = await tankRepository.getTankById(params.tanqueId);
      if (!tank) throw new Error(`Tanque ${params.tanqueId} no encontrado`);
      if (tank.estado !== 'ACTIVO') throw new Error(`El tanque ${tank.codigo} no está ACTIVO`);
    }

    // =========================================================================
    // 2. FASE DE EJECUCIÓN ATÓMICA
    // =========================================================================
    const receiptId = `rec-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
    const numero = await purchaseReceiptRepository.getNextNumero(empresaId);

    const receiptItems: RecepcionCompraItem[] = [];

    for (const it of params.items) {
      const ocItem = ord.items.find(x => x.id === it.ordenCompraItemId)!;
      const rechazada = it.cantidadRechazada ?? 0;

      ocItem.cantidadRecibida += it.cantidadAceptada;
      ocItem.cantidadPendiente = Math.max(0, ocItem.cantidad - ocItem.cantidadRecibida);

      receiptItems.push({
        id: `rec-item-${receiptId}-${receiptItems.length + 1}`,
        recepcionId: receiptId,
        ordenCompraItemId: ocItem.id,
        articuloId: ocItem.articuloId,
        tipo: ocItem.tipo,
        descripcionSnapshot: ocItem.descripcionSnapshot,
        cantidadRecibida: it.cantidadRecibida,
        cantidadAceptada: it.cantidadAceptada,
        cantidadRechazada: rechazada,
        unidadMedida: ocItem.unidadMedida,
        motivoRechazo: it.motivoRechazo
      });
    }

    // Evaluar si la OC quedó completamente recibida o parcial
    let allCompleted = true;
    for (const ocIt of ord.items) {
      if (ocIt.cantidadPendiente > 0) {
        allCompleted = false;
      }
    }
    ord.estado = allCompleted ? 'RECIBIDA' : 'PARCIALMENTE_RECIBIDA';
    await purchaseOrderRepository.save(ord);

    const receipt: RecepcionCompra = {
      id: receiptId,
      empresaId,
      numero,
      ordenCompraId: ord.id,
      proveedorId: ord.proveedorId,
      proveedorNombreSnapshot: ord.proveedorNombreSnapshot,
      fechaHora: now,
      numeroRemitoProveedor: params.numeroRemitoProveedor,
      plantaId: params.plantaId || ord.plantaEntregaId,
      depositoId: params.depositoId || ord.depositoEntregaId,
      tanqueId: params.tanqueId,
      recibidoPorEmpleadoId: params.recibidoPorEmpleadoId,
      estado: 'CONFIRMADA',
      items: receiptItems,
      observaciones: params.observaciones,
      eventId: params.eventId,
      createdAt: now,
      updatedAt: now
    };

    await purchaseReceiptRepository.save(receipt);

    // Integración limpia con Módulo 4: Si es una compra de combustible que entra a tanque
    if (params.tanqueId) {
      const totalLitrosCombustible = receiptItems.reduce((sum, it) => sum + it.cantidadAceptada, 0);
      const fuelItemOC = ord.items.find(x => x.tipo === 'ARTICULO' || x.unidadMedida === 'LITRO');
      const precioUnitario = fuelItemOC?.precioUnitarioSnapshot ?? 1150;

      await tankService.registerIncome({
        tanqueId: params.tanqueId,
        litros: totalLitrosCombustible,
        proveedorNombre: ord.proveedorNombreSnapshot,
        proveedorId: ord.proveedorId,
        precioUnitario,
        numeroRemito: params.numeroRemitoProveedor,
        usuarioId: params.usuarioId,
        observaciones: `Recepción de compra ${receipt.numero} (OC ${ord.numero})`
      });
    }

    await auditRepository.recordAction(
      'comp_recepciones',
      receipt.id,
      'CONFIRMACION_RECEPCION_COMPRA',
      null,
      {
        numero: receipt.numero,
        ordenCompra: ord.numero,
        proveedor: ord.proveedorNombreSnapshot,
        estadoOC: ord.estado
      },
      `Recepción de compra ${receipt.numero} CONFIRMADA (OC ${ord.numero}) - Remito: ${params.numeroRemitoProveedor || 'S/N'}`,
      params.usuarioId || 'admin_compras'
    );

    return { receipt, isDuplicate: false };
  }

  async cancelReceipt(
    receiptId: string,
    motivo: string,
    usuarioId: string = 'admin_compras'
  ): Promise<RecepcionCompra> {
    const rec = await purchaseReceiptRepository.getById(receiptId);
    if (!rec) throw new Error(`Recepción ${receiptId} no encontrada`);
    if (rec.estado === 'ANULADA') throw new Error('La recepción ya se encuentra ANULADA');

    if (!motivo || motivo.trim() === '') {
      throw new Error('Debe especificar un motivo formal para la anulación de la recepción');
    }

    const ord = await purchaseOrderRepository.getById(rec.ordenCompraId);
    if (ord) {
      // Revertir cantidades recibidas en la OC
      for (const recItem of rec.items) {
        const ocItem = ord.items.find(x => x.id === recItem.ordenCompraItemId);
        if (ocItem) {
          ocItem.cantidadRecibida = Math.max(0, ocItem.cantidadRecibida - recItem.cantidadAceptada);
          ocItem.cantidadPendiente = ocItem.cantidad - ocItem.cantidadRecibida;
        }
      }

      let tieneRecibidos = false;
      for (const ocIt of ord.items) {
        if (ocIt.cantidadRecibida > 0) tieneRecibidos = true;
      }
      ord.estado = tieneRecibidos ? 'PARCIALMENTE_RECIBIDA' : 'EMITIDA';
      await purchaseOrderRepository.save(ord);
    }

    const now = new Date().toISOString();
    rec.estado = 'ANULADA';
    rec.fechaAnulacion = now;
    rec.usuarioAnulacion = usuarioId;
    rec.motivoAnulacion = motivo;
    rec.updatedAt = now;

    await purchaseReceiptRepository.save(rec);

    await auditRepository.recordAction(
      'comp_recepciones',
      rec.id,
      'ANULACION_RECEPCION_COMPRA',
      { estado: 'CONFIRMADA' },
      { estado: 'ANULADA', motivo },
      `Recepción ${rec.numero} ANULADA: ${motivo}`,
      usuarioId
    );

    return rec;
  }
}

export const purchaseReceiptService = new PurchaseReceiptService();
