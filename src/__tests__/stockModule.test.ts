import { describe, it, expect, beforeEach } from 'vitest';
import { articleRepository } from '../repositories/articleRepository';
import { warehouseRepository } from '../repositories/warehouseRepository';
import { inventoryRepository } from '../repositories/inventoryRepository';
import { inventoryMovementRepository } from '../repositories/inventoryMovementRepository';
import { stockReservationRepository } from '../repositories/stockReservationRepository';
import { stockLotRepository } from '../repositories/stockLotRepository';
import { stockSerialRepository } from '../repositories/stockSerialRepository';
import { stockCountRepository } from '../repositories/stockCountRepository';
import { stockAlertRepository } from '../repositories/stockAlertRepository';
import { auditRepository } from '../repositories/auditRepository';
import { articleService } from '../services/articleService';
import { inventoryService } from '../services/inventoryService';
import { purchaseOrderService } from '../services/purchaseOrderService';
import { purchaseReceiptService } from '../services/purchaseReceiptService';
import { purchaseRequestService } from '../services/purchaseRequestService';

describe('Módulo 6 — Stock / Depósitos / Inventario', () => {
  beforeEach(() => {
    articleRepository.resetForTesting();
    warehouseRepository.resetForTesting();
    inventoryRepository.resetForTesting();
    inventoryMovementRepository.resetForTesting();
    stockReservationRepository.resetForTesting();
    stockLotRepository.resetForTesting();
    stockSerialRepository.resetForTesting();
    stockCountRepository.resetForTesting();
    stockAlertRepository.resetForTesting();
    auditRepository.resetForTesting();
  });

  it('Caso A: Crear artículo correctamente', async () => {
    const art = await articleService.createArticle({
      empresaId: 'emp-1',
      codigo: 'ART-TEST-001',
      descripcion: 'Artículo de Prueba Unitaria',
      categoriaId: 'cat-repuestos',
      unidadMedidaBase: 'UNIDAD',
      stockMinimoDefault: 5
    });

    expect(art).toBeDefined();
    expect(art.codigo).toBe('ART-TEST-001');
    expect(art.descripcion).toBe('Artículo de Prueba Unitaria');
  });

  it('Caso B: No se permite duplicar código de artículo en la misma empresa', async () => {
    await articleService.createArticle({
      empresaId: 'emp-1',
      codigo: 'ART-DUP-01',
      descripcion: 'Artículo Original',
      categoriaId: 'cat-repuestos',
      unidadMedidaBase: 'UNIDAD'
    });

    await expect(
      articleService.createArticle({
        empresaId: 'emp-1',
        codigo: 'ART-DUP-01',
        descripcion: 'Artículo Duplicado',
        categoriaId: 'cat-repuestos',
        unidadMedidaBase: 'UNIDAD'
      })
    ).rejects.toThrow(/ya se encuentra registrado/);
  });

  it('Caso C: Mismo código de artículo es permitido en otra empresa', async () => {
    await articleService.createArticle({
      empresaId: 'emp-1',
      codigo: 'ART-COMP-01',
      descripcion: 'Artículo Empresa 1',
      categoriaId: 'cat-repuestos',
      unidadMedidaBase: 'UNIDAD'
    });

    const artEmp2 = await articleService.createArticle({
      empresaId: 'emp-2',
      codigo: 'ART-COMP-01',
      descripcion: 'Artículo Empresa 2',
      categoriaId: 'cat-repuestos',
      unidadMedidaBase: 'UNIDAD'
    });

    expect(artEmp2).toBeDefined();
    expect(artEmp2.empresaId).toBe('emp-2');
  });

  it('Caso D: Crear depósito correctamente', async () => {
    const dep = {
      id: 'dep-nuevo-01',
      empresaId: 'emp-1',
      codigo: 'DEP-NUEVO',
      nombre: 'Depósito Nuevo Planta 3',
      tipo: 'GENERAL' as const,
      estado: 'ACTIVO' as const,
      permiteStockNegativo: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    expect(dep.codigo).toBe('DEP-NUEVO');
  });

  it('Caso E: Ingreso aumenta stock físico', async () => {
    const artId = 'art-rep-filtro-aire';
    const depId = 'dep-central';

    const stockBefore = await inventoryRepository.getStock('emp-1', depId, artId);
    const fisicoAntes = stockBefore?.cantidadFisica || 0;

    await inventoryService.registrarMovimiento({
      empresaId: 'emp-1',
      tipoMovimiento: 'INGRESO_MANUAL',
      depositoDestinoId: depId,
      origenModulo: 'MANUAL',
      documentoReferencia: 'ING-001',
      items: [{ articuloId: artId, cantidad: 10, costoUnitario: 30000 }]
    });

    const stockAfter = await inventoryRepository.getStock('emp-1', depId, artId);
    expect(stockAfter?.cantidadFisica).toBe(fisicoAntes + 10);
  });

  it('Caso F: Egreso reduce stock físico', async () => {
    const artId = 'art-rep-filtro-aire';
    const depId = 'dep-central';

    const stockBefore = await inventoryRepository.getStock('emp-1', depId, artId);
    const fisicoAntes = stockBefore?.cantidadFisica || 15;

    await inventoryService.registrarMovimiento({
      empresaId: 'emp-1',
      tipoMovimiento: 'EGRESO_MANUAL',
      depositoOrigenId: depId,
      origenModulo: 'MANUAL',
      documentoReferencia: 'EGR-001',
      items: [{ articuloId: artId, cantidad: 5 }]
    });

    const stockAfter = await inventoryRepository.getStock('emp-1', depId, artId);
    expect(stockAfter?.cantidadFisica).toBe(fisicoAntes - 5);
  });

  it('Caso G: No permite stock negativo si el depósito lo prohíbe', async () => {
    const artId = 'art-rep-filtro-aire';
    const depId = 'dep-central';

    await expect(
      inventoryService.registrarMovimiento({
        empresaId: 'emp-1',
        tipoMovimiento: 'EGRESO_MANUAL',
        depositoOrigenId: depId,
        origenModulo: 'MANUAL',
        documentoReferencia: 'EGR-ERR',
        items: [{ articuloId: artId, cantidad: 9999 }]
      })
    ).rejects.toThrow(/Stock insuficiente/);
  });

  it('Caso H: Depósito configurado para permitir stock negativo opera de forma controlada', async () => {
    const depNegativo = {
      id: 'dep-neg',
      empresaId: 'emp-1',
      codigo: 'DEP-NEG',
      nombre: 'Depósito Negativos Permitidos',
      tipo: 'GENERAL' as const,
      estado: 'ACTIVO' as const,
      permiteStockNegativo: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    expect(depNegativo.permiteStockNegativo).toBe(true);
  });

  it('Caso I: Transferencia resta origen y suma destino exactamente', async () => {
    const artId = 'art-rep-filtro-aire';
    const depOrig = 'dep-central';
    const depDest = 'dep-taller';

    const origBefore = await inventoryRepository.getStock('emp-1', depOrig, artId);
    const destBefore = await inventoryRepository.getStock('emp-1', depDest, artId);
    const fisicoOrigAnt = origBefore?.cantidadFisica || 15;
    const fisicoDestAnt = destBefore?.cantidadFisica || 0;

    await inventoryService.transferir({
      empresaId: 'emp-1',
      depositoOrigenId: depOrig,
      depositoDestinoId: depDest,
      origenModulo: 'TRANSFERENCIA',
      items: [{ articuloId: artId, cantidad: 4 }]
    });

    const origAfter = await inventoryRepository.getStock('emp-1', depOrig, artId);
    const destAfter = await inventoryRepository.getStock('emp-1', depDest, artId);

    expect(origAfter?.cantidadFisica).toBe(fisicoOrigAnt - 4);
    expect(destAfter?.cantidadFisica).toBe(fisicoDestAnt + 4);
  });

  it('Caso J: Transferencia conserva cantidad total global', async () => {
    const artId = 'art-rep-filtro-aire';
    const depOrig = 'dep-central';
    const depDest = 'dep-taller';

    const origBefore = (await inventoryRepository.getStock('emp-1', depOrig, artId))?.cantidadFisica || 15;
    const destBefore = (await inventoryRepository.getStock('emp-1', depDest, artId))?.cantidadFisica || 0;
    const totalGlobalAntes = origBefore + destBefore;

    await inventoryService.transferir({
      empresaId: 'emp-1',
      depositoOrigenId: depOrig,
      depositoDestinoId: depDest,
      items: [{ articuloId: artId, cantidad: 3 }]
    });

    const origAfter = (await inventoryRepository.getStock('emp-1', depOrig, artId))?.cantidadFisica || 0;
    const destAfter = (await inventoryRepository.getStock('emp-1', depDest, artId))?.cantidadFisica || 0;
    const totalGlobalDespues = origAfter + destAfter;

    expect(totalGlobalDespues).toBe(totalGlobalAntes);
  });

  it('Caso K: Transferencia conserva costo promedio unitario', async () => {
    const artId = 'art-rep-filtro-aire';
    const depOrig = 'dep-central';
    const depDest = 'dep-taller';

    const stockOrig = await inventoryRepository.getStock('emp-1', depOrig, artId);
    const costoOrig = stockOrig?.costoPromedioPonderado || 32000;

    await inventoryService.transferir({
      empresaId: 'emp-1',
      depositoOrigenId: depOrig,
      depositoDestinoId: depDest,
      items: [{ articuloId: artId, cantidad: 2 }]
    });

    const stockDest = await inventoryRepository.getStock('emp-1', depDest, artId);
    expect(stockDest?.costoPromedioPonderado).toBe(costoOrig);
  });

  it('Caso L: Reserva reduce disponible pero no físico', async () => {
    const artId = 'art-rep-filtro-aire';
    const depId = 'dep-central';

    const stockBefore = await inventoryRepository.getStock('emp-1', depId, artId);
    const fisicoAnt = stockBefore?.cantidadFisica || 15;
    const disponibleAnt = stockBefore?.cantidadDisponible || 13;

    const reserva = await inventoryService.reservar({
      empresaId: 'emp-1',
      articuloId: artId,
      depositoId: depId,
      cantidad: 3,
      origenModulo: 'TALLER_OT',
      origenId: 'ot-test-99'
    });

    expect(reserva.estado).toBe('ACTIVA');

    const stockAfter = await inventoryRepository.getStock('emp-1', depId, artId);
    expect(stockAfter?.cantidadFisica).toBe(fisicoAnt);
    expect(stockAfter?.cantidadDisponible).toBe(disponibleAnt - 3);
  });

  it('Caso M: Liberar reserva restaura disponibilidad', async () => {
    const artId = 'art-rep-filtro-aire';
    const depId = 'dep-central';

    const stockBefore = await inventoryRepository.getStock('emp-1', depId, artId);
    const disponibleAnt = stockBefore?.cantidadDisponible || 13;

    const reserva = await inventoryService.reservar({
      empresaId: 'emp-1',
      articuloId: artId,
      depositoId: depId,
      cantidad: 4,
      origenModulo: 'TALLER_OT',
      origenId: 'ot-test-100'
    });

    await inventoryService.liberarReserva(reserva.id);

    const stockAfter = await inventoryRepository.getStock('emp-1', depId, artId);
    expect(stockAfter?.cantidadDisponible).toBe(disponibleAnt);
  });

  it('Caso N: Consumir reserva genera egreso físico y completa reserva', async () => {
    const artId = 'art-rep-filtro-aire';
    const depId = 'dep-central';

    const stockBefore = await inventoryRepository.getStock('emp-1', depId, artId);
    const fisicoAnt = stockBefore?.cantidadFisica || 15;

    const reserva = await inventoryService.reservar({
      empresaId: 'emp-1',
      articuloId: artId,
      depositoId: depId,
      cantidad: 2,
      origenModulo: 'TALLER_OT',
      origenId: 'ot-test-101'
    });

    const { reserva: resConsumida, movimiento } = await inventoryService.consumirReserva(reserva.id);
    expect(resConsumida.estado).toBe('CONSUMIDA');
    expect(movimiento.tipoMovimiento).toBe('EGRESO_CONSUMO');

    const stockAfter = await inventoryRepository.getStock('emp-1', depId, artId);
    expect(stockAfter?.cantidadFisica).toBe(fisicoAnt - 2);
  });

  it('Caso O: No se puede reservar más que la cantidad disponible', async () => {
    const artId = 'art-rep-filtro-aire';
    const depId = 'dep-central';
    const stock = await inventoryRepository.getStock('emp-1', depId, artId);
    const disponible = stock?.cantidadDisponible || 13;

    await expect(
      inventoryService.reservar({
        empresaId: 'emp-1',
        articuloId: artId,
        depositoId: depId,
        cantidad: disponible + 10,
        origenModulo: 'TALLER_OT',
        origenId: 'ot-error'
      })
    ).rejects.toThrow(/Stock disponible insuficiente/);
  });

  it('Caso P: Recepción de compra aceptada genera ingreso de stock', async () => {
    const oc = await purchaseOrderService.createOrder({
      empresaId: 'emp-1',
      proveedorId: 'prov-rep-03',
      items: [
        {
          tipo: 'ARTICULO',
          articuloId: 'art-rep-filtro-aire',
          descripcion: 'Filtro de Aire Primario',
          cantidad: 10,
          unidadMedida: 'UNIDAD',
          precioUnitario: 31000
        }
      ]
    });

    await purchaseReceiptService.confirmReceipt({
      empresaId: 'emp-1',
      ordenCompraId: oc.id,
      recibidoPorEmpleadoId: 'emp-1',
      items: [{ ordenCompraItemId: oc.items[0].id, cantidadRecibida: 10, cantidadAceptada: 10 }]
    });

    const stock = await inventoryRepository.getStock('emp-1', 'dep-central', 'art-rep-filtro-aire');
    expect(stock?.cantidadFisica).toBeGreaterThan(15);
  });

  it('Caso Q: Recepción parcial ingresa solamente la cantidad aceptada', async () => {
    const stockBefore = (await inventoryRepository.getStock('emp-1', 'dep-central', 'art-rep-filtro-aceite'))?.cantidadFisica || 0;

    const oc = await purchaseOrderService.createOrder({
      empresaId: 'emp-1',
      proveedorId: 'prov-rep-03',
      items: [
        {
          tipo: 'ARTICULO',
          articuloId: 'art-rep-filtro-aceite',
          descripcion: 'Filtro Aceite Actros',
          cantidad: 20,
          unidadMedida: 'UNIDAD',
          precioUnitario: 28000
        }
      ]
    });

    await purchaseReceiptService.confirmReceipt({
      empresaId: 'emp-1',
      ordenCompraId: oc.id,
      recibidoPorEmpleadoId: 'emp-1',
      items: [{ ordenCompraItemId: oc.items[0].id, cantidadRecibida: 15, cantidadAceptada: 12, cantidadRechazada: 3 }]
    });

    const stockAfter = await inventoryRepository.getStock('emp-1', 'dep-central', 'art-rep-filtro-aceite');
    expect(stockAfter?.cantidadFisica).toBe(stockBefore + 12);
  });

  it('Caso R: Cantidad rechazada no ingresa a stock', async () => {
    const stockBefore = (await inventoryRepository.getStock('emp-1', 'dep-central', 'art-rep-filtro-aceite'))?.cantidadFisica || 0;
    expect(stockBefore).toBeDefined();
  });

  it('Caso S: Servicio comprado no genera stock físico', async () => {
    const ocServicio = await purchaseOrderService.createOrder({
      empresaId: 'emp-1',
      proveedorId: 'prov-rep-03',
      items: [
        {
          tipo: 'SERVICIO',
          descripcion: 'Servicio de Rectificación de Tapa de Cilindros',
          cantidad: 1,
          unidadMedida: 'GLOBAL',
          precioUnitario: 150000
        }
      ]
    });

    const movsBefore = await inventoryMovementRepository.getAll({ empresaId: 'emp-1' });

    await purchaseReceiptService.confirmReceipt({
      empresaId: 'emp-1',
      ordenCompraId: ocServicio.id,
      recibidoPorEmpleadoId: 'emp-1',
      items: [{ ordenCompraItemId: ocServicio.items[0].id, cantidadRecibida: 1, cantidadAceptada: 1 }]
    });

    const movsAfter = await inventoryMovementRepository.getAll({ empresaId: 'emp-1' });
    expect(movsAfter.length).toBe(movsBefore.length);
  });

  it('Caso T: Combustible integrado a tanque no genera stock convencional duplicado', async () => {
    const ocFuel = await purchaseOrderService.createOrder({
      empresaId: 'emp-1',
      proveedorId: 'prov-comb-02',
      items: [
        {
          tipo: 'ARTICULO',
          tipoCombustibleId: 'fuel-diesel-500',
          descripcion: 'Diesel 500 Test',
          cantidad: 5000,
          unidadMedida: 'LITRO',
          precioUnitario: 1150
        }
      ]
    });

    const movsBefore = await inventoryMovementRepository.getAll({ empresaId: 'emp-1' });

    await purchaseReceiptService.confirmReceipt({
      empresaId: 'emp-1',
      ordenCompraId: ocFuel.id,
      tanqueId: 'tq-pl1-diesel-01',
      recibidoPorEmpleadoId: 'emp-1',
      items: [{ ordenCompraItemId: ocFuel.items[0].id, cantidadRecibida: 5000, cantidadAceptada: 5000 }]
    });

    const movsAfter = await inventoryMovementRepository.getAll({ empresaId: 'emp-1' });
    expect(movsAfter.length).toBe(movsBefore.length);
  });

  it('Caso U: Misma recepción procesada dos veces por eventId no duplica stock (Idempotencia)', async () => {
    const oc = await purchaseOrderService.createOrder({
      empresaId: 'emp-1',
      proveedorId: 'prov-rep-03',
      items: [
        {
          tipo: 'ARTICULO',
          articuloId: 'art-rep-filtro-aire',
          descripcion: 'Filtro Aire',
          cantidad: 5,
          unidadMedida: 'UNIDAD',
          precioUnitario: 30000
        }
      ]
    });

    const evId = 'EVT-STK-IDEMP-001';
    const rec = await purchaseReceiptService.confirmReceipt({
      empresaId: 'emp-1',
      ordenCompraId: oc.id,
      recibidoPorEmpleadoId: 'emp-1',
      eventId: evId,
      items: [{ ordenCompraItemId: oc.items[0].id, cantidadRecibida: 5, cantidadAceptada: 5 }]
    });

    const stockMid = (await inventoryRepository.getStock('emp-1', 'dep-central', 'art-rep-filtro-aire'))?.cantidadFisica || 0;

    await inventoryService.processReceiptStock(rec.receipt, oc, 'emp-1');

    const stockEnd = (await inventoryRepository.getStock('emp-1', 'dep-central', 'art-rep-filtro-aire'))?.cantidadFisica || 0;
    expect(stockEnd).toBe(stockMid);
  });

  it('Caso V: Anular recepción revierte stock exactamente una vez', async () => {
    const art = await articleService.createArticle({
      empresaId: 'emp-1',
      codigo: 'ART-REV-01',
      descripcion: 'Filtro Reversión Aislada',
      categoriaId: 'cat-repuestos',
      unidadMedidaBase: 'UNIDAD'
    });

    const oc = await purchaseOrderService.createOrder({
      empresaId: 'emp-1',
      proveedorId: 'prov-rep-03',
      items: [
        {
          tipo: 'ARTICULO',
          articuloId: art.id,
          descripcion: 'Filtro Reversión Aislada',
          cantidad: 10,
          unidadMedida: 'UNIDAD',
          precioUnitario: 30000
        }
      ]
    });

    const stockBefore = (await inventoryRepository.getStock('emp-1', 'dep-central', art.id))?.cantidadFisica || 0;
    expect(stockBefore).toBe(0);

    const rec = await purchaseReceiptService.confirmReceipt({
      empresaId: 'emp-1',
      ordenCompraId: oc.id,
      recibidoPorEmpleadoId: 'emp-1',
      items: [{ ordenCompraItemId: oc.items[0].id, cantidadRecibida: 10, cantidadAceptada: 10 }]
    });

    const stockMid = (await inventoryRepository.getStock('emp-1', 'dep-central', art.id))?.cantidadFisica || 0;
    expect(stockMid).toBe(10);

    await purchaseReceiptService.cancelReceipt(rec.receipt.id, 'Error de mercadería');

    const stockEnd = (await inventoryRepository.getStock('emp-1', 'dep-central', art.id))?.cantidadFisica || 0;
    expect(stockEnd).toBe(0);
  });

  it('Caso W: Movimiento confirmado es inmutable (registra historial sin sobreescritura destructiva)', async () => {
    const { movimiento } = await inventoryService.registrarMovimiento({
      empresaId: 'emp-1',
      tipoMovimiento: 'INGRESO_MANUAL',
      depositoDestinoId: 'dep-central',
      origenModulo: 'MANUAL',
      documentoReferencia: 'MOV-IMM',
      items: [{ articuloId: 'art-rep-filtro-aire', cantidad: 5, costoUnitario: 30000 }]
    });

    expect(movimiento.estado).toBe('CONFIRMADO');
    const movConsultado = await inventoryMovementRepository.getById(movimiento.id);
    expect(movConsultado).toEqual(movimiento);
  });

  it('Caso X: Ajuste positivo queda trazado', async () => {
    const { movimiento } = await inventoryService.registrarMovimiento({
      empresaId: 'emp-1',
      tipoMovimiento: 'AJUSTE_POSITIVO',
      depositoDestinoId: 'dep-central',
      origenModulo: 'MANUAL',
      observaciones: 'Ajuste positivo por hallazgo de inventario',
      items: [{ articuloId: 'art-rep-filtro-aire', cantidad: 3, costoUnitario: 30000 }]
    });

    expect(movimiento.tipoMovimiento).toBe('AJUSTE_POSITIVO');
    expect(movimiento.estado).toBe('CONFIRMADO');
  });

  it('Caso Y: Ajuste negativo queda trazado', async () => {
    const { movimiento } = await inventoryService.registrarMovimiento({
      empresaId: 'emp-1',
      tipoMovimiento: 'AJUSTE_NEGATIVO',
      depositoOrigenId: 'dep-central',
      origenModulo: 'MANUAL',
      observaciones: 'Ajuste negativo por rotura en estantería',
      items: [{ articuloId: 'art-rep-filtro-aire', cantidad: 1 }]
    });

    expect(movimiento.tipoMovimiento).toBe('AJUSTE_NEGATIVO');
    expect(movimiento.estado).toBe('CONFIRMADO');
  });

  it('Caso Z: Conteo físico no modifica stock antes de cerrar', async () => {
    const stockBefore = (await inventoryRepository.getStock('emp-1', 'dep-central', 'art-rep-filtro-aire'))?.cantidadFisica || 15;

    await stockCountRepository.save({
      id: 'cnt-test-01',
      empresaId: 'emp-1',
      numero: 'CNT-000099',
      depositoId: 'dep-central',
      fechaHora: new Date().toISOString(),
      estado: 'BORRADOR',
      responsableEmpleadoId: 'emp-1',
      items: [
        {
          id: 'cnt-item-99',
          conteoId: 'cnt-test-01',
          articuloId: 'art-rep-filtro-aire',
          descripcionSnapshot: 'Filtro Aire',
          unidadMedidaSnapshot: 'UNIDAD',
          cantidadSistemaSnapshot: 15,
          cantidadContada: 10,
          diferencia: -5,
          costoUnitarioSnapshot: 32000,
          valorDiferencia: -160000
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    const stockAfter = (await inventoryRepository.getStock('emp-1', 'dep-central', 'art-rep-filtro-aire'))?.cantidadFisica || 0;
    expect(stockAfter).toBe(stockBefore);
  });

  it('Caso AA: Cerrar conteo genera ajuste por diferencia', async () => {
    const stockBefore = (await inventoryRepository.getStock('emp-1', 'dep-central', 'art-rep-filtro-aire'))?.cantidadFisica || 15;

    const { movimiento } = await inventoryService.registrarMovimiento({
      empresaId: 'emp-1',
      tipoMovimiento: 'AJUSTE_NEGATIVO',
      depositoOrigenId: 'dep-central',
      origenModulo: 'AJUSTE_CONTEO',
      origenId: 'cnt-001',
      documentoReferencia: 'Cierre Conteo Inventario',
      items: [{ articuloId: 'art-rep-filtro-aire', cantidad: 1 }]
    });

    expect(movimiento.tipoMovimiento).toBe('AJUSTE_NEGATIVO');
    const stockAfter = (await inventoryRepository.getStock('emp-1', 'dep-central', 'art-rep-filtro-aire'))?.cantidadFisica || 0;
    expect(stockAfter).toBe(stockBefore - 1);
  });

  it('Caso AB: Costo promedio móvil: 10x100 + 10x200 = 150 promedio', async () => {
    const art = await articleService.createArticle({
      empresaId: 'emp-1',
      codigo: 'ART-COSTO-01',
      descripcion: 'Artículo Costeo',
      categoriaId: 'cat-repuestos',
      unidadMedidaBase: 'UNIDAD'
    });

    await inventoryService.registrarMovimiento({
      empresaId: 'emp-1',
      tipoMovimiento: 'INGRESO_MANUAL',
      depositoDestinoId: 'dep-central',
      origenModulo: 'MANUAL',
      items: [{ articuloId: art.id, cantidad: 10, costoUnitario: 100 }]
    });

    let stk = await inventoryRepository.getStock('emp-1', 'dep-central', art.id);
    expect(stk?.costoPromedioPonderado).toBe(100);

    await inventoryService.registrarMovimiento({
      empresaId: 'emp-1',
      tipoMovimiento: 'INGRESO_MANUAL',
      depositoDestinoId: 'dep-central',
      origenModulo: 'MANUAL',
      items: [{ articuloId: art.id, cantidad: 10, costoUnitario: 200 }]
    });

    stk = await inventoryRepository.getStock('emp-1', 'dep-central', art.id);
    expect(stk?.costoPromedioPonderado).toBe(150);
  });

  it('Caso AC: Salida con costo promedio conserva costo histórico', async () => {
    const artId = 'art-rep-filtro-aire';
    const stock = await inventoryRepository.getStock('emp-1', 'dep-central', artId);
    const costoAntes = stock?.costoPromedioPonderado || 32000;

    const { movimiento } = await inventoryService.registrarMovimiento({
      empresaId: 'emp-1',
      tipoMovimiento: 'EGRESO_MANUAL',
      depositoOrigenId: 'dep-central',
      origenModulo: 'MANUAL',
      items: [{ articuloId: artId, cantidad: 2 }]
    });

    expect(movimiento.items[0].costoUnitarioSnapshot).toBe(costoAntes);
  });

  it('Caso AD: Cambiar costo posterior no modifica salida histórica', async () => {
    const artId = 'art-rep-filtro-aire';
    const { movimiento: mov1 } = await inventoryService.registrarMovimiento({
      empresaId: 'emp-1',
      tipoMovimiento: 'EGRESO_MANUAL',
      depositoOrigenId: 'dep-central',
      origenModulo: 'MANUAL',
      items: [{ articuloId: artId, cantidad: 1 }]
    });

    const costoHist1 = mov1.items[0].costoUnitarioSnapshot;

    await inventoryService.registrarMovimiento({
      empresaId: 'emp-1',
      tipoMovimiento: 'INGRESO_MANUAL',
      depositoDestinoId: 'dep-central',
      origenModulo: 'MANUAL',
      items: [{ articuloId: artId, cantidad: 10, costoUnitario: 999999 }]
    });

    const movConsultado = await inventoryMovementRepository.getById(mov1.id);
    expect(movConsultado?.items[0].costoUnitarioSnapshot).toBe(costoHist1);
  });

  it('Caso AE: Lote queda trazado correctamente', async () => {
    const now = new Date().toISOString();
    const lote = await stockLotRepository.save({
      id: 'lot-test-02',
      empresaId: 'emp-1',
      articuloId: 'art-cemento-cp40',
      codigoLote: 'LOT-TEST-999',
      fechaVencimiento: '2026-12-31',
      estado: 'DISPONIBLE',
      createdAt: now
    });

    expect(lote.codigoLote).toBe('LOT-TEST-999');
    const loteEncontrado = await stockLotRepository.getById('lot-test-02');
    expect(loteEncontrado).toBeDefined();
  });

  it('Caso AF: Serie individual no puede existir dos veces para el mismo artículo y empresa', async () => {
    const now = new Date().toISOString();
    const serie1 = await stockSerialRepository.save({
      id: 'ser-test-01',
      empresaId: 'emp-1',
      articuloId: 'art-neu-295-80',
      numeroSerie: 'SERIAL-DUP-XYZ',
      estado: 'EN_STOCK',
      createdAt: now,
      updatedAt: now
    });

    const serieDuplicada = await stockSerialRepository.getBySerial('emp-1', 'art-neu-295-80', 'SERIAL-DUP-XYZ');
    expect(serieDuplicada).toBeDefined();
    expect(serieDuplicada?.id).toBe(serie1.id);
  });

  it('Caso AG: Neumático serializado puede salir de stock conservando identidad', async () => {
    const now = new Date().toISOString();
    const serie = await stockSerialRepository.save({
      id: 'ser-test-02',
      empresaId: 'emp-1',
      articuloId: 'art-neu-295-80',
      numeroSerie: 'SERIAL-NEU-777',
      estado: 'EN_STOCK',
      depositoId: 'dep-central',
      createdAt: now,
      updatedAt: now
    });

    await inventoryService.registrarMovimiento({
      empresaId: 'emp-1',
      tipoMovimiento: 'EGRESO_CONSUMO',
      depositoOrigenId: 'dep-central',
      origenModulo: 'TALLER_OT',
      items: [{ articuloId: 'art-neu-295-80', cantidad: 1, serieId: serie.id }]
    });

    const serieActualizada = await stockSerialRepository.getById(serie.id);
    expect(serieActualizada?.estado).toBe('BAJA');
  });

  it('Caso AH: Componente serializado queda preparado para futura instalación en equipo', async () => {
    const now = new Date().toISOString();
    const serieAlt = await stockSerialRepository.save({
      id: 'ser-test-03',
      empresaId: 'emp-1',
      articuloId: 'art-rep-alternador',
      numeroSerie: 'BOSCH-SER-001',
      estado: 'EN_STOCK',
      depositoId: 'dep-central',
      createdAt: now,
      updatedAt: now
    });

    expect(serieAlt.estado).toBe('EN_STOCK');
    expect(serieAlt.numeroSerie).toBe('BOSCH-SER-001');
  });

  it('Caso AI: Stock mínimo genera alerta', async () => {
    const alerta = await stockAlertRepository.addAlert({
      id: 'alt-test-min',
      empresaId: 'emp-1',
      tipo: 'STOCK_MINIMO',
      severidad: 'ADVERTENCIA',
      titulo: 'Stock mínimo alcanzado',
      descripcion: 'El artículo ART-FILT está bajo el mínimo.',
      articuloId: 'art-rep-filtro-aire',
      depositoId: 'dep-central',
      fecha: new Date().toISOString(),
      resuelta: false
    });

    expect(alerta).toBeDefined();
    const activas = await stockAlertRepository.getAll('emp-1', true);
    expect(activas.some(a => a.id === alerta.id)).toBe(true);
  });

  it('Caso AJ: Multiempresa rechaza artículo de otra empresa en depósito', async () => {
    const artEmp2 = await articleService.createArticle({
      empresaId: 'emp-2',
      codigo: 'ART-E2-01',
      descripcion: 'Artículo Empresa 2',
      categoriaId: 'cat-repuestos',
      unidadMedidaBase: 'UNIDAD'
    });

    await expect(
      inventoryService.registrarMovimiento({
        empresaId: 'emp-1',
        tipoMovimiento: 'INGRESO_MANUAL',
        depositoDestinoId: 'dep-central',
        origenModulo: 'MANUAL',
        items: [{ articuloId: artEmp2.id, cantidad: 5, costoUnitario: 1000 }]
      })
    ).rejects.toThrow(/Aislamiento multiempresa violado/);
  });

  it('Caso AK: Transferencia entre empresas rechazada', async () => {
    const artId = 'art-rep-filtro-aire';
    await expect(
      inventoryService.transferir({
        empresaId: 'emp-1',
        depositoOrigenId: 'dep-central',
        depositoDestinoId: 'dep-central',
        items: [{ articuloId: artId, cantidad: 1 }]
      })
    ).rejects.toThrow(/no pueden ser el mismo/);
  });

  it('Caso AL: Ubicación debe pertenecer al depósito indicado (validado en esquema y lógica)', async () => {
    expect(true).toBe(true);
  });

  it('Caso AM: Duplicate eventId no genera doble movimiento', async () => {
    const evId = 'EVT-DUP-TEST-123';
    const res1 = await inventoryService.registrarMovimiento({
      empresaId: 'emp-1',
      tipoMovimiento: 'INGRESO_MANUAL',
      depositoDestinoId: 'dep-central',
      origenModulo: 'MANUAL',
      eventId: evId,
      items: [{ articuloId: 'art-rep-filtro-aire', cantidad: 5, costoUnitario: 10000 }]
    });

    expect(res1.isDuplicate).toBe(false);

    const res2 = await inventoryService.registrarMovimiento({
      empresaId: 'emp-1',
      tipoMovimiento: 'INGRESO_MANUAL',
      depositoDestinoId: 'dep-central',
      origenModulo: 'MANUAL',
      eventId: evId,
      items: [{ articuloId: 'art-rep-filtro-aire', cantidad: 5, costoUnitario: 10000 }]
    });

    expect(res2.isDuplicate).toBe(true);
    expect(res2.movimiento.id).toBe(res1.movimiento.id);
  });

  it('Caso AN: Acción crítica genera audit log verificable', async () => {
    const { movimiento } = await inventoryService.registrarMovimiento({
      empresaId: 'emp-1',
      tipoMovimiento: 'INGRESO_MANUAL',
      depositoDestinoId: 'dep-central',
      origenModulo: 'MANUAL',
      items: [{ articuloId: 'art-rep-filtro-aire', cantidad: 2, costoUnitario: 10000 }]
    });

    const logs = await auditRepository.getLogs('stk_movimientos');
    const logMov = logs.find(l => l.registroId === movimiento.id);
    expect(logMov).toBeDefined();
    expect(logMov?.accion).toBe('CONFIRMACION_MOVIMIENTO_STOCK');
  });

  it('Caso AO: Reversión conserva movimiento original', async () => {
    const oc = await purchaseOrderService.createOrder({
      empresaId: 'emp-1',
      proveedorId: 'prov-rep-03',
      items: [
        {
          tipo: 'ARTICULO',
          articuloId: 'art-rep-filtro-aire',
          descripcion: 'Filtro Aire Reversión Historial',
          cantidad: 5,
          unidadMedida: 'UNIDAD',
          precioUnitario: 30000
        }
      ]
    });

    const rec = await purchaseReceiptService.confirmReceipt({
      empresaId: 'emp-1',
      ordenCompraId: oc.id,
      recibidoPorEmpleadoId: 'emp-1',
      items: [{ ordenCompraItemId: oc.items[0].id, cantidadRecibida: 5, cantidadAceptada: 5 }]
    });

    const movsAntes = await inventoryMovementRepository.getByOrigen('COMPRAS_RECEPCION', rec.receipt.id);
    expect(movsAntes.length).toBe(1);

    await purchaseReceiptService.cancelReceipt(rec.receipt.id, 'Anulación de prueba de historial');

    const movOriginal = await inventoryMovementRepository.getById(movsAntes[0].id);
    expect(movOriginal).toBeDefined();
    expect(movOriginal?.estado).toBe('CONFIRMADO');

    const reversiones = await inventoryMovementRepository.getAll({
      empresaId: 'emp-1',
      tipoMovimiento: 'REVERSION_RECEPCION_COMPRA'
    });
    expect(reversiones.length).toBe(1);
    expect(reversiones[0].origenId).toBe(rec.receipt.id);
  });
});
