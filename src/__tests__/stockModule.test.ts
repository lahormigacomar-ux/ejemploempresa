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
import { purchaseOrderRepository } from '../repositories/purchaseOrderRepository';
import { articleService } from '../services/articleService';
import { inventoryService } from '../services/inventoryService';
import { purchaseOrderService } from '../services/purchaseOrderService';
import { purchaseReceiptService } from '../services/purchaseReceiptService';
import { purchaseRequestService } from '../services/purchaseRequestService';

describe('Módulo 6 — Stock / Depósitos / Inventario (Revisión Externa)', () => {
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

  it('Caso AP: Artículo inexistente no se autocrea y rechaza la operación', async () => {
    const articuloInexistenteId = 'art-inexistente-999';
    await expect(
      inventoryService.registrarMovimiento({
        empresaId: 'emp-1',
        tipoMovimiento: 'INGRESO_MANUAL',
        depositoDestinoId: 'dep-central',
        origenModulo: 'MANUAL',
        items: [{ articuloId: articuloInexistenteId, cantidad: 10, costoUnitario: 1000 }]
      })
    ).rejects.toThrow(/no encontrado en el maestro de artículos/);

    const artCheck = await articleRepository.getById(articuloInexistenteId);
    expect(artCheck).toBeNull();
  });

  it('Caso AQ: Egreso normal respeta stock reservado (disponible vs físico)', async () => {
    const art = await articleService.createArticle({
      empresaId: 'emp-1',
      codigo: 'ART-AQ-01',
      descripcion: 'Artículo Test AQ',
      categoriaId: 'cat-repuestos',
      unidadMedidaBase: 'UNIDAD'
    });
    const depId = 'dep-central';

    // Ingresar 100 físicos (0 reservados, 100 disponibles)
    await inventoryService.registrarMovimiento({
      empresaId: 'emp-1',
      tipoMovimiento: 'INGRESO_MANUAL',
      depositoDestinoId: depId,
      origenModulo: 'MANUAL',
      items: [{ articuloId: art.id, cantidad: 100, costoUnitario: 1000 }]
    });

    // Reservar 80 unidades (disponible = 20)
    await inventoryService.reservar({
      empresaId: 'emp-1',
      articuloId: art.id,
      depositoId: depId,
      cantidad: 80,
      origenModulo: 'TALLER_OT',
      origenId: 'ot-aq'
    });

    const stockMedio = await inventoryRepository.getStock('emp-1', depId, art.id);
    expect(stockMedio?.cantidadFisica).toBe(100);
    expect(stockMedio?.cantidadReservada).toBe(80);
    expect(stockMedio?.cantidadDisponible).toBe(20);

    // Intentar egreso manual por 50 unidades (supera los 20 disponibles)
    await expect(
      inventoryService.registrarMovimiento({
        empresaId: 'emp-1',
        tipoMovimiento: 'EGRESO_MANUAL',
        depositoOrigenId: depId,
        origenModulo: 'MANUAL',
        items: [{ articuloId: art.id, cantidad: 50 }]
      })
    ).rejects.toThrow(/Stock disponible insuficiente/);

    // Verificar que stock físico, reservado y disponible no cambiaron
    const stockFin = await inventoryRepository.getStock('emp-1', depId, art.id);
    expect(stockFin?.cantidadFisica).toBe(100);
    expect(stockFin?.cantidadReservada).toBe(80);
    expect(stockFin?.cantidadDisponible).toBe(20);
  });

  it('Caso AR: Transferencia respeta stock reservado', async () => {
    const art = await articleService.createArticle({
      empresaId: 'emp-1',
      codigo: 'ART-AR-01',
      descripcion: 'Artículo Test AR',
      categoriaId: 'cat-repuestos',
      unidadMedidaBase: 'UNIDAD'
    });
    const depOrig = 'dep-central';

    await inventoryService.registrarMovimiento({
      empresaId: 'emp-1',
      tipoMovimiento: 'INGRESO_MANUAL',
      depositoDestinoId: depOrig,
      origenModulo: 'MANUAL',
      items: [{ articuloId: art.id, cantidad: 100, costoUnitario: 1000 }]
    });

    await inventoryService.reservar({
      empresaId: 'emp-1',
      articuloId: art.id,
      depositoId: depOrig,
      cantidad: 80,
      origenModulo: 'TALLER_OT',
      origenId: 'ot-ar'
    });

    // Intentar transferir 50 unidades (supera disponible de 20)
    await expect(
      inventoryService.transferir({
        empresaId: 'emp-1',
        depositoOrigenId: depOrig,
        depositoDestinoId: 'dep-taller',
        items: [{ articuloId: art.id, cantidad: 50 }]
      })
    ).rejects.toThrow(/Stock disponible insuficiente/);
  });

  it('Caso AS: Recepción de compra sin articuloId vinculado no inventa art-default y rechaza', async () => {
    const oc = await purchaseOrderService.createOrder({
      empresaId: 'emp-1',
      proveedorId: 'prov-rep-03',
      items: [
        {
          tipo: 'ARTICULO',
          descripcion: 'Item sin ID de artículo',
          cantidad: 10,
          unidadMedida: 'UNIDAD',
          precioUnitario: 5000
        }
      ]
    });

    await expect(
      purchaseReceiptService.confirmReceipt({
        empresaId: 'emp-1',
        ordenCompraId: oc.id,
        recibidoPorEmpleadoId: 'emp-1',
        items: [{ ordenCompraItemId: oc.items[0].id, cantidadRecibida: 10, cantidadAceptada: 10 }]
      })
    ).rejects.toThrow(/no está vinculado al maestro de artículos/);
  });

  it('Caso AT: Artículo de otra empresa es rechazado en recepción de compras', async () => {
    const artEmp2 = await articleService.createArticle({
      empresaId: 'emp-2',
      codigo: 'ART-E2-X',
      descripcion: 'Artículo Empresa 2',
      categoriaId: 'cat-repuestos',
      unidadMedidaBase: 'UNIDAD'
    });

    const oc = await purchaseOrderService.createOrder({
      empresaId: 'emp-1',
      proveedorId: 'prov-rep-03',
      items: [
        {
          tipo: 'ARTICULO',
          articuloId: artEmp2.id,
          descripcion: 'Artículo Empresa 2',
          cantidad: 5,
          unidadMedida: 'UNIDAD',
          precioUnitario: 1000
        }
      ]
    });

    await expect(
      purchaseReceiptService.confirmReceipt({
        empresaId: 'emp-1',
        ordenCompraId: oc.id,
        recibidoPorEmpleadoId: 'emp-1',
        items: [{ ordenCompraItemId: oc.items[0].id, cantidadRecibida: 5, cantidadAceptada: 5 }]
      })
    ).rejects.toThrow(/Aislamiento multiempresa violado/);
  });

  it('Caso AU: Costo de compra inválido o ausente no muta stock', async () => {
    const oc = await purchaseOrderService.createOrder({
      empresaId: 'emp-1',
      proveedorId: 'prov-rep-03',
      items: [
        {
          tipo: 'ARTICULO',
          articuloId: 'art-rep-filtro-aire',
          descripcion: 'Filtro Sin Precio',
          cantidad: 10,
          unidadMedida: 'UNIDAD',
          precioUnitario: 1000
        }
      ]
    });

    oc.items[0].precioUnitarioSnapshot = -50;
    await purchaseOrderRepository.save(oc);

    await expect(
      purchaseReceiptService.confirmReceipt({
        empresaId: 'emp-1',
        ordenCompraId: oc.id,
        recibidoPorEmpleadoId: 'emp-1',
        items: [{ ordenCompraItemId: oc.items[0].id, cantidadRecibida: 10, cantidadAceptada: 10 }]
      })
    ).rejects.toThrow(/Costo unitario inválido o ausente/);
  });

  it('Caso AV: Movimiento multi-item falla atómicamente antes de mutar si un item es inválido', async () => {
    const artId = 'art-rep-filtro-aire';
    const stockBefore = (await inventoryRepository.getStock('emp-1', 'dep-central', artId))?.cantidadFisica || 15;

    await expect(
      inventoryService.registrarMovimiento({
        empresaId: 'emp-1',
        tipoMovimiento: 'INGRESO_MANUAL',
        depositoDestinoId: 'dep-central',
        origenModulo: 'MANUAL',
        items: [
          { articuloId: artId, cantidad: 5, costoUnitario: 10000 },
          { articuloId: 'art-no-existe-999', cantidad: 5, costoUnitario: 10000 }
        ]
      })
    ).rejects.toThrow(/no encontrado en el maestro de artículos/);

    const stockAfter = (await inventoryRepository.getStock('emp-1', 'dep-central', artId))?.cantidadFisica || 0;
    expect(stockAfter).toBe(stockBefore);
  });

  it('Caso AW: Artículo controlaSerie egresa conservando serieId en movimiento', async () => {
    const now = new Date().toISOString();
    const serie = await stockSerialRepository.save({
      id: 'ser-aw-01',
      empresaId: 'emp-1',
      articuloId: 'art-neu-295-80',
      numeroSerie: 'SERIAL-AW-999',
      estado: 'EN_STOCK',
      depositoId: 'dep-central',
      createdAt: now,
      updatedAt: now
    });

    const { movimiento } = await inventoryService.registrarMovimiento({
      empresaId: 'emp-1',
      tipoMovimiento: 'EGRESO_CONSUMO',
      depositoOrigenId: 'dep-central',
      origenModulo: 'TALLER_OT',
      items: [{ articuloId: 'art-neu-295-80', cantidad: 1, serieId: serie.id }]
    });

    expect(movimiento.items[0].serieId).toBe(serie.id);
    const serieFin = await stockSerialRepository.getById(serie.id);
    expect(serieFin?.estado).toBe('BAJA');
  });

  it('Caso AX: Serie no disponible (o de otro depósito) no puede egresar', async () => {
    const now = new Date().toISOString();
    const serie = await stockSerialRepository.save({
      id: 'ser-ax-01',
      empresaId: 'emp-1',
      articuloId: 'art-neu-295-80',
      numeroSerie: 'SERIAL-AX-888',
      estado: 'EN_STOCK',
      depositoId: 'dep-taller',
      createdAt: now,
      updatedAt: now
    });

    await expect(
      inventoryService.registrarMovimiento({
        empresaId: 'emp-1',
        tipoMovimiento: 'EGRESO_CONSUMO',
        depositoOrigenId: 'dep-central',
        origenModulo: 'TALLER_OT',
        items: [{ articuloId: 'art-neu-295-80', cantidad: 1, serieId: serie.id }]
      })
    ).rejects.toThrow(/no se encuentra disponible/);
  });

  it('Caso AY: eventId es contextual por empresa (empresa A y B no colisionan)', async () => {
    const evId = 'EVT-SHARED-001';

    const res1 = await inventoryService.registrarMovimiento({
      empresaId: 'emp-1',
      tipoMovimiento: 'INGRESO_MANUAL',
      depositoDestinoId: 'dep-central',
      origenModulo: 'MANUAL',
      eventId: evId,
      items: [{ articuloId: 'art-rep-filtro-aire', cantidad: 5, costoUnitario: 10000 }]
    });
    expect(res1.isDuplicate).toBe(false);

    // Crear depósito para empresa 2
    const depEmp2 = await warehouseRepository.save({
      id: 'dep-emp2-01',
      empresaId: 'emp-2',
      codigo: 'DEP-E2',
      nombre: 'Depósito Empresa 2',
      tipo: 'GENERAL',
      estado: 'ACTIVO',
      permiteStockNegativo: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    const artEmp2 = await articleService.createArticle({
      empresaId: 'emp-2',
      codigo: 'ART-E2-AY',
      descripcion: 'Artículo E2',
      categoriaId: 'cat-repuestos',
      unidadMedidaBase: 'UNIDAD'
    });

    const res2 = await inventoryService.registrarMovimiento({
      empresaId: 'emp-2',
      tipoMovimiento: 'INGRESO_MANUAL',
      depositoDestinoId: depEmp2.id,
      origenModulo: 'MANUAL',
      eventId: evId,
      items: [{ articuloId: artEmp2.id, cantidad: 3, costoUnitario: 10000 }]
    });
    expect(res2.isDuplicate).toBe(false);
    expect(res2.movimiento.id).not.toBe(res1.movimiento.id);
  });

  it('Caso AZ: Transferencia preserva y recalcula costo correctamente entre depósitos', async () => {
    const artId = 'art-rep-filtro-aire';
    const depOrig = 'dep-central';
    const depDest = 'dep-taller';

    const stockOrigBefore = await inventoryRepository.getStock('emp-1', depOrig, artId);
    const costoOrig = stockOrigBefore?.costoPromedioPonderado || 32000;

    await inventoryService.transferir({
      empresaId: 'emp-1',
      depositoOrigenId: depOrig,
      depositoDestinoId: depDest,
      items: [{ articuloId: artId, cantidad: 5 }]
    });

    const stockDestAfter = await inventoryRepository.getStock('emp-1', depDest, artId);
    expect(stockDestAfter?.costoPromedioPonderado).toBe(costoOrig);
  });
});
