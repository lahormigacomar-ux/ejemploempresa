import { 
  MovimientoStock, 
  MovimientoStockItem, 
  StockExistencia, 
  ReservaStock, 
  ConteoStock, 
  AlertaStock, 
  RecepcionCompra, 
  OrdenCompra,
  TipoMovimientoStock
} from '../types';
import { inventoryRepository } from '../repositories/inventoryRepository';
import { inventoryMovementRepository } from '../repositories/inventoryMovementRepository';
import { warehouseRepository } from '../repositories/warehouseRepository';
import { articleRepository } from '../repositories/articleRepository';
import { stockReservationRepository } from '../repositories/stockReservationRepository';
import { stockLotRepository } from '../repositories/stockLotRepository';
import { stockSerialRepository } from '../repositories/stockSerialRepository';
import { stockCountRepository } from '../repositories/stockCountRepository';
import { stockAlertRepository } from '../repositories/stockAlertRepository';
import { auditRepository } from '../repositories/auditRepository';

export class InventoryService {
  async registrarMovimiento(params: {
    empresaId: string;
    tipoMovimiento: TipoMovimientoStock;
    depositoOrigenId?: string;
    depositoDestinoId?: string;
    origenModulo: string;
    origenId?: string;
    documentoReferencia?: string;
    observaciones?: string;
    usuarioId?: string;
    eventId?: string;
    items: {
      articuloId: string;
      cantidad: number;
      ubicacionOrigenId?: string;
      ubicacionDestinoId?: string;
      loteId?: string;
      serieId?: string;
      costoUnitario?: number;
      centroCostoId?: string;
      equipoId?: string;
      ordenTrabajoId?: string;
    }[];
  }): Promise<{ movimiento: MovimientoStock; isDuplicate: boolean }> {
    const empresaId = params.empresaId;
    if (!empresaId || typeof empresaId !== 'string' || empresaId.trim() === '') {
      throw new Error('empresaId es obligatorio para operaciones de stock');
    }
    const usuarioId = params.usuarioId || 'admin_stock';

    // 1. Idempotencia multiempresa (empresaId + eventId)
    if (params.eventId) {
      const existingMov = await inventoryMovementRepository.getByEventId(empresaId, params.eventId);
      if (existingMov) {
        return { movimiento: existingMov, isDuplicate: true };
      }
    }

    if (!params.items || params.items.length === 0) {
      throw new Error('El movimiento de stock debe contener al menos un item');
    }

    // Validar depósitos
    let depOrigen = null;
    if (params.depositoOrigenId) {
      depOrigen = await warehouseRepository.getById(params.depositoOrigenId);
      if (!depOrigen) throw new Error(`Depósito origen ${params.depositoOrigenId} no encontrado`);
      if (depOrigen.empresaId !== empresaId) throw new Error('Aislamiento multiempresa violado en depósito origen');
      if (depOrigen.estado !== 'ACTIVO') throw new Error(`Depósito origen ${depOrigen.nombre} no se encuentra activo`);
    }

    let depDestino = null;
    if (params.depositoDestinoId) {
      depDestino = await warehouseRepository.getById(params.depositoDestinoId);
      if (!depDestino) throw new Error(`Depósito destino ${params.depositoDestinoId} no encontrado`);
      if (depDestino.empresaId !== empresaId) throw new Error('Aislamiento multiempresa violado en depósito destino');
      if (depDestino.estado !== 'ACTIVO') throw new Error(`Depósito destino ${depDestino.nombre} no se encuentra activo`);
    }

    // ==========================================
    // PREVALIDACIÓN REAL ATÓMICA DE TODOS LOS ITEMS
    // (Ningún stock o registro cambia si falla algún item)
    // ==========================================
    const prevalidatedItems: {
      articuloId: string;
      cantidad: number;
      costoUnitario: number;
      ubicacionOrigenId?: string;
      ubicacionDestinoId?: string;
      loteId?: string;
      serieId?: string;
      centroCostoId?: string;
      equipoId?: string;
      ordenTrabajoId?: string;
      descripcion: string;
      unidadMedida: string;
    }[] = [];

    for (let i = 0; i < params.items.length; i++) {
      const it = params.items[i];
      if (it.cantidad <= 0) {
        throw new Error(`La cantidad del item ${i + 1} debe ser mayor a cero`);
      }

      // Prohibido auto-crear artículos: debe existir en el maestro
      const articulo = await articleRepository.getById(it.articuloId);
      if (!articulo) {
        throw new Error(`Artículo ${it.articuloId} no encontrado en el maestro de artículos`);
      }
      if (articulo.empresaId !== empresaId) {
        throw new Error(`Aislamiento multiempresa violado: El artículo ${articulo.codigo} pertenece a otra empresa`);
      }
      if (articulo.estado === 'BLOQUEADO' || articulo.estado === 'INACTIVO') {
        throw new Error(`El artículo ${articulo.codigo} se encuentra ${articulo.estado}`);
      }

      // Validar ubicaciones internas pertenecen al depósito correspondiente
      if (it.ubicacionOrigenId) {
        const loc = await warehouseRepository.getLocationById(it.ubicacionOrigenId);
        if (!loc || loc.depositoId !== params.depositoOrigenId) {
          throw new Error(`La ubicación de origen no pertenece al depósito de origen indicado`);
        }
      }
      if (it.ubicacionDestinoId) {
        const loc = await warehouseRepository.getLocationById(it.ubicacionDestinoId);
        if (!loc || loc.depositoId !== params.depositoDestinoId) {
          throw new Error(`La ubicación de destino no pertenece al depósito de destino indicado`);
        }
      }

      // Validar series si el artículo controla serie
      if (articulo.controlaSerie) {
        if (!it.serieId) {
          throw new Error(`El artículo ${articulo.codigo} (serializado) requiere especificar número de serie`);
        }
        const serieObj = await stockSerialRepository.getById(it.serieId);
        if (!serieObj) {
          throw new Error(`Serie ${it.serieId} no encontrada`);
        }
        if (serieObj.empresaId !== empresaId || serieObj.articuloId !== articulo.id) {
          throw new Error(`La serie ${serieObj.numeroSerie} no corresponde al artículo o empresa`);
        }
        if (params.depositoOrigenId && (serieObj.estado !== 'EN_STOCK' || serieObj.depositoId !== params.depositoOrigenId)) {
          throw new Error(`La serie ${serieObj.numeroSerie} no se encuentra disponible (EN_STOCK) en el depósito de origen`);
        }
      }

      // Validar stock disponible para egresos / transferencias / ajustes negativos (respetando reservas)
      const esEgresoOTransferencia = ['EGRESO_CONSUMO', 'EGRESO_MANUAL', 'TRANSFERENCIA', 'AJUSTE_NEGATIVO'].includes(params.tipoMovimiento);
      if (esEgresoOTransferencia && params.depositoOrigenId) {
        const stockOrigen = await inventoryRepository.getStock(empresaId, params.depositoOrigenId, it.articuloId, it.loteId);
        const fisico = stockOrigen?.cantidadFisica || 0;
        const reservado = stockOrigen?.cantidadReservada || 0;
        const disponible = fisico - reservado;

        const permiteNegativo = depOrigen?.permiteStockNegativo || false;
        if (!permiteNegativo && disponible < it.cantidad) {
          throw new Error(`Stock disponible insuficiente para artículo ${articulo.codigo}. Disponible: ${disponible}, Solicitado: ${it.cantidad} (Físico: ${fisico}, Reservado: ${reservado})`);
        }
      }

      // Resolver costo unitario sin usar `|| 0` para valores válidos (usar `??`)
      let costoUnit = it.costoUnitario;
      if (costoUnit === undefined || costoUnit === null) {
        const depRef = params.depositoOrigenId || params.depositoDestinoId;
        if (depRef) {
          const stkRef = await inventoryRepository.getStock(empresaId, depRef, it.articuloId, it.loteId);
          costoUnit = stkRef?.costoPromedioPonderado ?? 0;
        } else {
          costoUnit = 0;
        }
      }

      prevalidatedItems.push({
        articuloId: it.articuloId,
        cantidad: it.cantidad,
        costoUnitario: costoUnit,
        ubicacionOrigenId: it.ubicacionOrigenId,
        ubicacionDestinoId: it.ubicacionDestinoId,
        loteId: it.loteId,
        serieId: it.serieId,
        centroCostoId: it.centroCostoId,
        equipoId: it.equipoId,
        ordenTrabajoId: it.ordenTrabajoId,
        descripcion: articulo.descripcion,
        unidadMedida: articulo.unidadMedidaBase
      });
    }

    // ==========================================
    // FASE DE EJECUCIÓN (Mutación atómica confirmada)
    // ==========================================
    const movId = `mov-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
    const numero = await inventoryMovementRepository.getNextNumero(empresaId);
    const fechaHora = new Date().toISOString();

    const movimientoItems: MovimientoStockItem[] = prevalidatedItems.map((pre, index) => ({
      id: `mov-item-${movId}-${index + 1}`,
      movimientoId: movId,
      articuloId: pre.articuloId,
      descripcionSnapshot: pre.descripcion,
      unidadMedidaSnapshot: pre.unidadMedida,
      cantidad: pre.cantidad,
      depositoOrigenId: params.depositoOrigenId,
      ubicacionOrigenId: pre.ubicacionOrigenId,
      depositoDestinoId: params.depositoDestinoId,
      ubicacionDestinoId: pre.ubicacionDestinoId,
      loteId: pre.loteId,
      serieId: pre.serieId,
      costoUnitarioSnapshot: pre.costoUnitario,
      costoTotalSnapshot: Number((pre.cantidad * pre.costoUnitario).toFixed(2)),
      centroCostoId: pre.centroCostoId,
      equipoId: pre.equipoId,
      ordenTrabajoId: pre.ordenTrabajoId
    }));

    for (const mit of movimientoItems) {
      const esIngreso = ['INGRESO_COMPRA', 'INGRESO_MANUAL', 'DEVOLUCION', 'AJUSTE_POSITIVO', 'CONTEO_FISICO', 'PRODUCCION_INGRESO', 'DEVOLUCION_CLIENTE'].includes(params.tipoMovimiento);
      const esEgreso = ['EGRESO_CONSUMO', 'EGRESO_MANUAL', 'AJUSTE_NEGATIVO', 'PRODUCCION_CONSUMO', 'VENTA', 'REVERSION_RECEPCION_COMPRA'].includes(params.tipoMovimiento);
      const esTransferencia = params.tipoMovimiento === 'TRANSFERENCIA';

      if (esIngreso || (esTransferencia && params.depositoDestinoId)) {
        const depDestId = params.depositoDestinoId!;
        let stockDestino = await inventoryRepository.getStock(empresaId, depDestId, mit.articuloId, mit.loteId);
        if (!stockDestino) {
          stockDestino = {
            id: `stk-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
            empresaId,
            depositoId: depDestId,
            ubicacionId: mit.ubicacionDestinoId,
            articuloId: mit.articuloId,
            loteId: mit.loteId,
            cantidadFisica: 0,
            cantidadReservada: 0,
            cantidadDisponible: 0,
            costoPromedioPonderado: mit.costoUnitarioSnapshot,
            valorTotalStock: 0,
            updatedAt: fechaHora
          };
        }

        const fisicaAnt = stockDestino.cantidadFisica;
        const costoAnt = stockDestino.costoPromedioPonderado;
        const nuevaFisica = fisicaAnt + mit.cantidad;

        let nuevoCosto = costoAnt;
        if (nuevaFisica > 0) {
          if (esTransferencia) {
            nuevoCosto = costoAnt > 0 ? costoAnt : mit.costoUnitarioSnapshot;
          } else {
            nuevoCosto = Number((((fisicaAnt * costoAnt) + (mit.cantidad * mit.costoUnitarioSnapshot)) / nuevaFisica).toFixed(4));
          }
        }

        stockDestino.cantidadFisica = nuevaFisica;
        stockDestino.costoPromedioPonderado = nuevoCosto;
        await inventoryRepository.saveStock(stockDestino);
      }

      if (esEgreso || (esTransferencia && params.depositoOrigenId)) {
        const depOrigId = params.depositoOrigenId!;
        const stockOrigen = await inventoryRepository.getStock(empresaId, depOrigId, mit.articuloId, mit.loteId);
        if (stockOrigen) {
          stockOrigen.cantidadFisica = Number((stockOrigen.cantidadFisica - mit.cantidad).toFixed(4));
          await inventoryRepository.saveStock(stockOrigen);
        }
      }

      if (mit.serieId) {
        const serieObj = await stockSerialRepository.getById(mit.serieId);
        if (serieObj) {
          if (esIngreso) {
            serieObj.estado = 'EN_STOCK';
            serieObj.depositoId = params.depositoDestinoId;
            serieObj.ubicacionId = mit.ubicacionDestinoId;
          } else if (esEgreso) {
            serieObj.estado = 'BAJA';
          } else if (esTransferencia) {
            serieObj.depositoId = params.depositoDestinoId;
            serieObj.ubicacionId = mit.ubicacionDestinoId;
          }
          await stockSerialRepository.save(serieObj);
        }
      }
    }

    const movimiento: MovimientoStock = {
      id: movId,
      empresaId,
      numero,
      fechaHora,
      tipoMovimiento: params.tipoMovimiento,
      depositoOrigenId: params.depositoOrigenId,
      depositoDestinoId: params.depositoDestinoId,
      origenModulo: params.origenModulo,
      origenId: params.origenId,
      documentoReferencia: params.documentoReferencia,
      estado: 'CONFIRMADO',
      observaciones: params.observaciones,
      usuarioId,
      eventId: params.eventId,
      items: movimientoItems,
      createdAt: fechaHora,
      updatedAt: fechaHora
    };

    await inventoryMovementRepository.save(movimiento);

    await auditRepository.recordAction(
      'stk_movimientos',
      movimiento.id,
      'CONFIRMACION_MOVIMIENTO_STOCK',
      null,
      { numero: movimiento.numero, tipo: movimiento.tipoMovimiento, itemsCount: movimientoItems.length },
      `Movimiento de stock ${movimiento.numero} (${movimiento.tipoMovimiento}) CONFIRMADO`,
      usuarioId
    );

    return { movimiento, isDuplicate: false };
  }

  async transferir(params: {
    empresaId: string;
    depositoOrigenId: string;
    depositoDestinoId: string;
    origenModulo?: string;
    origenId?: string;
    documentoReferencia?: string;
    observaciones?: string;
    usuarioId?: string;
    eventId?: string;
    items: {
      articuloId: string;
      cantidad: number;
      ubicacionOrigenId?: string;
      ubicacionDestinoId?: string;
      loteId?: string;
    }[];
  }): Promise<MovimientoStock> {
    const empresaId = params.empresaId;
    if (!empresaId) throw new Error('empresaId es obligatorio para transferencias');

    if (params.depositoOrigenId === params.depositoDestinoId) {
      throw new Error('El depósito origen y destino no pueden ser el mismo en una transferencia');
    }

    const itemsWithCost = await Promise.all(
      params.items.map(async it => {
        const stk = await inventoryRepository.getStock(empresaId, params.depositoOrigenId, it.articuloId, it.loteId);
        return {
          ...it,
          costoUnitario: stk?.costoPromedioPonderado ?? 0
        };
      })
    );

    const res = await this.registrarMovimiento({
      empresaId,
      tipoMovimiento: 'TRANSFERENCIA',
      depositoOrigenId: params.depositoOrigenId,
      depositoDestinoId: params.depositoDestinoId,
      origenModulo: params.origenModulo || 'TRANSFERENCIA',
      origenId: params.origenId,
      documentoReferencia: params.documentoReferencia,
      observaciones: params.observaciones,
      usuarioId: params.usuarioId,
      eventId: params.eventId,
      items: itemsWithCost
    });

    return res.movimiento;
  }

  async reservar(params: {
    empresaId: string;
    articuloId: string;
    depositoId: string;
    ubicacionId?: string;
    cantidad: number;
    origenModulo: string;
    origenId: string;
    motivo?: string;
    usuarioId?: string;
  }): Promise<ReservaStock> {
    const empresaId = params.empresaId;
    if (!empresaId) throw new Error('empresaId es obligatorio para reservas');
    if (params.cantidad <= 0) throw new Error('La cantidad a reservar debe ser mayor a cero');

    const stock = await inventoryRepository.getStock(empresaId, params.depositoId, params.articuloId);
    const fisico = stock?.cantidadFisica || 0;
    const reservado = stock?.cantidadReservada || 0;
    const disponible = fisico - reservado;

    if (disponible < params.cantidad) {
      throw new Error(`Stock disponible insuficiente para reservar. Disponible: ${disponible}, Solicitado: ${params.cantidad}`);
    }

    if (stock) {
      stock.cantidadReservada = Number((stock.cantidadReservada + params.cantidad).toFixed(4));
      await inventoryRepository.saveStock(stock);
    }

    const reservaId = `res-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
    const now = new Date().toISOString();

    const reserva: ReservaStock = {
      id: reservaId,
      empresaId,
      articuloId: params.articuloId,
      depositoId: params.depositoId,
      ubicacionId: params.ubicacionId,
      cantidad: params.cantidad,
      origenModulo: params.origenModulo,
      origenId: params.origenId,
      estado: 'ACTIVA',
      fechaReserva: now,
      usuarioId: params.usuarioId || 'admin_stock',
      motivo: params.motivo,
      createdAt: now,
      updatedAt: now
    };

    await stockReservationRepository.save(reserva);
    return reserva;
  }

  async liberarReserva(reservaId: string, usuarioId: string = 'admin_stock'): Promise<ReservaStock> {
    const reserva = await stockReservationRepository.getById(reservaId);
    if (!reserva) throw new Error(`Reserva ${reservaId} no encontrada`);
    if (reserva.estado !== 'ACTIVA') throw new Error(`La reserva se encuentra en estado ${reserva.estado}`);

    const stock = await inventoryRepository.getStock(reserva.empresaId, reserva.depositoId, reserva.articuloId);
    if (stock) {
      stock.cantidadReservada = Number((Math.max(0, stock.cantidadReservada - reserva.cantidad)).toFixed(4));
      await inventoryRepository.saveStock(stock);
    }

    reserva.estado = 'LIBERADA';
    reserva.updatedAt = new Date().toISOString();
    await stockReservationRepository.save(reserva);
    return reserva;
  }

  async consumirReserva(reservaId: string, usuarioId: string = 'admin_stock'): Promise<{ reserva: ReservaStock; movimiento: MovimientoStock }> {
    const reserva = await stockReservationRepository.getById(reservaId);
    if (!reserva) throw new Error(`Reserva ${reservaId} no encontrada`);
    if (reserva.estado !== 'ACTIVA') throw new Error(`La reserva ${reservaId} no se encuentra activa`);

    // 1. Validar físico suficiente para consumir la reserva
    const stock = await inventoryRepository.getStock(reserva.empresaId, reserva.depositoId, reserva.articuloId);
    const fisico = stock?.cantidadFisica || 0;
    if (fisico < reserva.cantidad) {
      throw new Error(`Stock físico insuficiente (${fisico}) para consumir la reserva de ${reserva.cantidad}`);
    }

    // 2. Reducir cantidad reservada y física
    if (stock) {
      stock.cantidadReservada = Number((Math.max(0, stock.cantidadReservada - reserva.cantidad)).toFixed(4));
      await inventoryRepository.saveStock(stock);
    }

    // 3. Generar egreso físico
    const { movimiento } = await this.registrarMovimiento({
      empresaId: reserva.empresaId,
      tipoMovimiento: 'EGRESO_CONSUMO',
      depositoOrigenId: reserva.depositoId,
      origenModulo: reserva.origenModulo,
      origenId: reserva.origenId,
      documentoReferencia: `Consumo de reserva ${reserva.id}`,
      observaciones: `Consumo físico por reserva ${reserva.id} (${reserva.motivo || ''})`,
      usuarioId,
      items: [
        {
          articuloId: reserva.articuloId,
          cantidad: reserva.cantidad,
          ubicacionOrigenId: reserva.ubicacionId
        }
      ]
    });

    reserva.estado = 'CONSUMIDA';
    reserva.movimientoConsumoId = movimiento.id;
    reserva.updatedAt = new Date().toISOString();
    await stockReservationRepository.save(reserva);

    return { reserva, movimiento };
  }

  async processReceiptStock(receipt: RecepcionCompra, oc: OrdenCompra, usuarioId: string = 'admin_stock'): Promise<MovimientoStock | null> {
    const itemsFisicosToProcess = receipt.items.filter(it => it.tipo === 'ARTICULO' && !it.tipoCombustibleId && it.cantidadAceptada > 0);
    if (itemsFisicosToProcess.length === 0) {
      return null;
    }

    const depositoId = receipt.depositoId || oc.depositoEntregaId || 'dep-central';
    const itemsMov: { articuloId: string; cantidad: number; depositoDestinoId: string; costoUnitario: number }[] = [];

    for (const it of itemsFisicosToProcess) {
      const ocItem = oc.items.find(x => x.id === it.ordenCompraItemId);
      const artId = it.articuloId || ocItem?.articuloId;
      if (!artId) {
        throw new Error(`Item de recepción ${it.id} no está vinculado al maestro de artículos`);
      }

      const articuloObj = await articleRepository.getById(artId);
      if (!articuloObj) {
        throw new Error(`Artículo ${artId} no encontrado en el maestro de artículos`);
      }
      if (articuloObj.empresaId !== receipt.empresaId) {
        throw new Error(`Aislamiento multiempresa violado: El artículo ${articuloObj.codigo} no pertenece a la empresa de la recepción`);
      }

      const precio = ocItem?.precioUnitarioSnapshot;
      if (precio === undefined || precio === null || isNaN(precio) || precio < 0) {
        throw new Error(`Costo unitario inválido o ausente en la Orden de Compra para el artículo ${articuloObj.codigo}`);
      }

      itemsMov.push({
        articuloId: artId,
        cantidad: it.cantidadAceptada,
        depositoDestinoId: depositoId,
        costoUnitario: precio
      });
    }

    const { movimiento } = await this.registrarMovimiento({
      empresaId: receipt.empresaId,
      tipoMovimiento: 'INGRESO_COMPRA',
      depositoDestinoId: depositoId,
      origenModulo: 'COMPRAS_RECEPCION',
      origenId: receipt.id,
      documentoReferencia: `Remito ${receipt.numeroRemitoProveedor || receipt.numero} (OC ${oc.numero})`,
      observaciones: `Ingreso automático por recepción de compra ${receipt.numero}`,
      usuarioId,
      eventId: receipt.eventId ? `stk-rec-${receipt.eventId}` : undefined,
      items: itemsMov
    });

    return movimiento;
  }

  async cancelReceiptStock(receipt: RecepcionCompra, motivo: string, usuarioId: string = 'admin_stock'): Promise<MovimientoStock | null> {
    const existingMovs = await inventoryMovementRepository.getByOrigen('COMPRAS_RECEPCION', receipt.id);
    const movOriginal = existingMovs.find(m => m.tipoMovimiento === 'INGRESO_COMPRA' && m.estado === 'CONFIRMADO');
    if (!movOriginal) {
      return null;
    }

    const existingReversions = await inventoryMovementRepository.getAll({
      empresaId: receipt.empresaId,
      tipoMovimiento: 'REVERSION_RECEPCION_COMPRA'
    });
    const alreadyReverted = existingReversions.some(r => r.origenId === receipt.id);
    if (alreadyReverted) {
      throw new Error(`La recepción ${receipt.numero} ya posee un movimiento de reversión de stock registrado`);
    }

    const itemsRev = movOriginal.items.map(it => ({
      articuloId: it.articuloId,
      cantidad: it.cantidad,
      depositoOrigenId: it.depositoDestinoId,
      costoUnitario: it.costoUnitarioSnapshot
    }));

    const { movimiento } = await this.registrarMovimiento({
      empresaId: receipt.empresaId,
      tipoMovimiento: 'REVERSION_RECEPCION_COMPRA',
      depositoOrigenId: movOriginal.depositoDestinoId,
      origenModulo: 'ANULACION_RECEPCION',
      origenId: receipt.id,
      documentoReferencia: `Anulación Recepción ${receipt.numero}`,
      observaciones: `Reversión de stock por anulación de recepción de compra ${receipt.numero}: ${motivo}`,
      usuarioId,
      eventId: receipt.eventId ? `stk-rev-${receipt.eventId}` : undefined,
      items: itemsRev
    });

    return movimiento;
  }
}

export const inventoryService = new InventoryService();
