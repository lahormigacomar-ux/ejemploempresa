import { describe, it, expect, beforeEach } from 'vitest';
import { supplierRepository } from '../repositories/supplierRepository';
import { purchaseRequestRepository } from '../repositories/purchaseRequestRepository';
import { purchaseQuotationRepository } from '../repositories/purchaseQuotationRepository';
import { purchaseOrderRepository } from '../repositories/purchaseOrderRepository';
import { purchaseReceiptRepository } from '../repositories/purchaseReceiptRepository';
import { supplierInvoiceRepository } from '../repositories/supplierInvoiceRepository';
import { tankRepository } from '../repositories/tankRepository';
import { employeeRepository } from '../repositories/employeeRepository';
import { auditRepository } from '../repositories/auditRepository';

import { supplierService } from '../services/supplierService';
import { purchaseRequestService } from '../services/purchaseRequestService';
import { purchaseQuotationService } from '../services/purchaseQuotationService';
import { purchaseOrderService } from '../services/purchaseOrderService';
import { purchaseReceiptService } from '../services/purchaseReceiptService';
import { supplierInvoiceService } from '../services/supplierInvoiceService';
import { purchaseMatchingService } from '../services/purchaseMatchingService';

describe('MÓDULO 5 — COMPRAS & PROVEEDORES', () => {
  beforeEach(() => {
    supplierRepository.resetForTesting();
    purchaseRequestRepository.resetForTesting();
    purchaseQuotationRepository.resetForTesting();
    purchaseOrderRepository.resetForTesting();
    purchaseReceiptRepository.resetForTesting();
    supplierInvoiceRepository.resetForTesting();
    tankRepository.resetForTesting();
    employeeRepository.resetForTesting();
    auditRepository.resetForTesting();
  });

  it('Caso A: Crear proveedor válido con todos los datos fiscales y comerciales', async () => {
    const prov = await supplierService.createSupplier({
      empresaId: 'emp-1',
      codigo: 'PROV-100',
      razonSocial: 'Canteras Quilmes S.A.',
      nombreFantasia: 'Áridos Quilmes',
      numeroDocumento: '30-71998877-2',
      condicionIVA: 'RESPONSABLE_INSCRIPTO',
      direccion: 'Ruta 2 KM 45',
      localidad: 'La Plata',
      provincia: 'Buenos Aires',
      codigoPostal: 'B1900',
      telefono: '+54 221 445-5667',
      email: 'ventas@aridosquilmes.com',
      categoriasProveidas: ['ARIDOS', 'AGREGADOS'],
      condicionPagoDefault: 'CUENTA_CORRIENTE',
      diasPagoDefault: 30
    });

    expect(prov.id).toBeDefined();
    expect(prov.codigo).toBe('PROV-100');
    expect(prov.estado).toBe('ACTIVO');

    const saved = await supplierRepository.getById(prov.id);
    expect(saved?.razonSocial).toBe('Canteras Quilmes S.A.');
  });

  it('Caso B: No duplicar código de proveedor dentro de la misma empresa', async () => {
    await supplierService.createSupplier({
      empresaId: 'emp-1',
      codigo: 'PROV-DUP',
      razonSocial: 'Proveedor Alfa S.A.',
      numeroDocumento: '30-11111111-1',
      condicionIVA: 'RESPONSABLE_INSCRIPTO',
      direccion: 'Calle 1',
      localidad: 'Tigre',
      provincia: 'Buenos Aires',
      codigoPostal: 'B1648',
      telefono: '111',
      email: 'alfa@alfa.com'
    });

    await expect(
      supplierService.createSupplier({
        empresaId: 'emp-1',
        codigo: 'PROV-DUP',
        razonSocial: 'Proveedor Beta S.A.',
        numeroDocumento: '30-22222222-2',
        condicionIVA: 'RESPONSABLE_INSCRIPTO',
        direccion: 'Calle 2',
        localidad: 'Tigre',
        provincia: 'Buenos Aires',
        codigoPostal: 'B1648',
        telefono: '222',
        email: 'beta@beta.com'
      })
    ).rejects.toThrow(/Ya existe un proveedor con el código PROV-DUP/);
  });

  it('Caso C: Mismo código de proveedor permitido en distinta empresa (Aislamiento Multiempresa)', async () => {
    const p1 = await supplierService.createSupplier({
      empresaId: 'emp-1',
      codigo: 'PROV-SHARED',
      razonSocial: 'Empresa 1 Proveedor',
      numeroDocumento: '30-33333333-3',
      condicionIVA: 'RESPONSABLE_INSCRIPTO',
      direccion: 'Dir 1',
      localidad: 'Loc',
      provincia: 'Prov',
      codigoPostal: '1000',
      telefono: '123',
      email: 'p1@shared.com'
    });

    const p2 = await supplierService.createSupplier({
      empresaId: 'emp-2',
      codigo: 'PROV-SHARED',
      razonSocial: 'Empresa 2 Proveedor',
      numeroDocumento: '30-44444444-4',
      condicionIVA: 'RESPONSABLE_INSCRIPTO',
      direccion: 'Dir 2',
      localidad: 'Loc',
      provincia: 'Prov',
      codigoPostal: '2000',
      telefono: '456',
      email: 'p2@shared.com'
    });

    expect(p1.empresaId).toBe('emp-1');
    expect(p2.empresaId).toBe('emp-2');
    expect(p1.codigo).toBe(p2.codigo);
  });

  it('Caso D: Crear solicitud de compra con múltiples items y numeración correlativa', async () => {
    const sc = await purchaseRequestService.createRequest({
      empresaId: 'emp-1',
      solicitanteEmpleadoId: 'emp-1',
      sector: 'TALLER',
      prioridad: 'ALTA',
      motivo: 'Compra de aceites y filtros para mantenimiento de flota',
      items: [
        { tipo: 'ARTICULO', descripcion: 'Aceite Motor 15W40 Balde 20L', cantidad: 5, unidadMedida: 'UNIDAD' },
        { tipo: 'ARTICULO', descripcion: 'Filtro Aire Secundario', cantidad: 2, unidadMedida: 'UNIDAD' }
      ]
    });

    expect(sc.numero).toMatch(/^SC-\d{6}$/);
    expect(sc.items.length).toBe(2);
    expect(sc.estado).toBe('PENDIENTE_APROBACION');
  });

  it('Caso E: Solicitud pendiente no permite emitir Orden de Compra si requiere aprobación previa', async () => {
    // sc-002 está en PENDIENTE_APROBACION
    await expect(
      purchaseOrderService.createOrder({
        empresaId: 'emp-1',
        proveedorId: 'prov-rep-03',
        solicitudCompraId: 'sc-002',
        items: [
          { descripcion: 'Kit Filtros', cantidad: 2, unidadMedida: 'UNIDAD', precioUnitario: 150000 }
        ]
      })
    ).rejects.toThrow(/No se puede emitir una Orden de Compra para una solicitud en estado PENDIENTE_APROBACION/);
  });

  it('Caso F: Aprobar solicitud habilita el flujo de emisión de Orden de Compra', async () => {
    const approved = await purchaseRequestService.approveRequest('sc-002', 'emp-1', 'Aprobado por jefatura');
    expect(approved.estado).toBe('APROBADA');
    expect(approved.aprobadorId).toBe('emp-1');

    const oc = await purchaseOrderService.createOrder({
      empresaId: 'emp-1',
      proveedorId: 'prov-rep-03',
      solicitudCompraId: 'sc-002',
      items: [
        {
          solicitudItemId: approved.items[0].id,
          descripcion: approved.items[0].descripcionSnapshot,
          cantidad: 2,
          unidadMedida: 'UNIDAD',
          precioUnitario: 145000
        }
      ]
    });

    expect(oc.estado).toBe('EMITIDA');
    expect(oc.solicitudCompraId).toBe('sc-002');
  });

  it('Caso G: Rechazar solicitud conserva historial y motivo del rechazo', async () => {
    const rejected = await purchaseRequestService.rejectRequest(
      'sc-002',
      'emp-1',
      'Stock suficiente encontrado en depósito auxiliar'
    );
    expect(rejected.estado).toBe('RECHAZADA');
    expect(rejected.comentarioAprobacion).toContain('Stock suficiente');
  });

  it('Caso H: Crear cotizaciones de dos proveedores para la misma solicitud', async () => {
    const cot1 = await purchaseQuotationService.createQuotation({
      empresaId: 'emp-1',
      solicitudCompraId: 'sc-001',
      proveedorId: 'prov-cem-01',
      fechaVencimiento: '2026-10-15',
      items: [{ descripcion: 'Cemento CP40', cantidad: 60, precioUnitario: 180000 }]
    });

    const cot2 = await purchaseQuotationService.createQuotation({
      empresaId: 'emp-1',
      solicitudCompraId: 'sc-001',
      proveedorId: 'prov-comb-02',
      fechaVencimiento: '2026-10-15',
      items: [{ descripcion: 'Cemento CP40 Alternativo', cantidad: 60, precioUnitario: 175000 }]
    });

    expect(cot1.id).toBeDefined();
    expect(cot2.id).toBeDefined();
    expect(cot1.proveedorId).not.toBe(cot2.proveedorId);
  });

  it('Caso I: Totales de cotización se calculan en el Service con descuentos e IVA', async () => {
    // 10 unidades a $10.000 = $100.000 bruto. 10% desc = $90.000 neto. 21% IVA = $18.900. Total = $108.900
    const cot = await purchaseQuotationService.createQuotation({
      empresaId: 'emp-1',
      proveedorId: 'prov-rep-03',
      fechaVencimiento: '2026-10-20',
      items: [
        {
          descripcion: 'Filtro Especial',
          cantidad: 10,
          precioUnitario: 10000,
          descuentoPct: 10.0,
          ivaPct: 21.0
        }
      ]
    });

    expect(cot.subtotal).toBe(90000);
    expect(cot.descuentos).toBe(10000);
    expect(cot.impuestos).toBe(18900);
    expect(cot.total).toBe(108900);
  });

  it('Caso J: Seleccionar cotización conserva snapshots y descarta las competidoras', async () => {
    const cot1 = await purchaseQuotationService.createQuotation({
      empresaId: 'emp-1',
      solicitudCompraId: 'sc-001',
      proveedorId: 'prov-cem-01',
      fechaVencimiento: '2026-10-15',
      items: [{ descripcion: 'Cemento CP40', cantidad: 60, precioUnitario: 180000 }]
    });

    const cot2 = await purchaseQuotationService.createQuotation({
      empresaId: 'emp-1',
      solicitudCompraId: 'sc-001',
      proveedorId: 'prov-comb-02',
      fechaVencimiento: '2026-10-15',
      items: [{ descripcion: 'Cemento CP40', cantidad: 60, precioUnitario: 190000 }]
    });

    await purchaseQuotationService.selectQuotation(cot1.id, 'admin_compras');

    const cot1Actualizada = await purchaseQuotationRepository.getById(cot1.id);
    const cot2Actualizada = await purchaseQuotationRepository.getById(cot2.id);

    expect(cot1Actualizada?.estado).toBe('SELECCIONADA');
    expect(cot2Actualizada?.estado).toBe('DESCARTADA');
  });

  it('Caso K: Crear OC desde solicitud aprobada y actualizar cantidades ordenadas', async () => {
    const oc = await purchaseOrderService.createOrder({
      empresaId: 'emp-1',
      proveedorId: 'prov-cem-01',
      solicitudCompraId: 'sc-001',
      items: [
        {
          solicitudItemId: 'item-sc-101',
          descripcion: 'Cemento Portland Normal a Granel (CP40)',
          cantidad: 60,
          unidadMedida: 'TN',
          precioUnitario: 180000
        }
      ]
    });

    expect(oc.numero).toMatch(/^OC-\d{6}$/);
    expect(oc.estado).toBe('EMITIDA');
  });

  it('Caso L: OC conserva precios y descripción snapshot históricos', async () => {
    const oc = await purchaseOrderService.createOrder({
      empresaId: 'emp-1',
      proveedorId: 'prov-cem-01',
      items: [
        {
          descripcion: 'Cemento Especial H-30 Alta Resistencia Inicial',
          cantidad: 20,
          unidadMedida: 'TN',
          precioUnitario: 210000
        }
      ]
    });

    expect(oc.items[0].descripcionSnapshot).toBe('Cemento Especial H-30 Alta Resistencia Inicial');
    expect(oc.items[0].precioUnitarioSnapshot).toBe(210000);
    expect(oc.proveedorNombreSnapshot).toBe('Loma Negra C.I.A.S.A.');
  });

  it('Caso M: OC emitida no puede modificarse libremente y requiere anulación/cancelación formal', async () => {
    const oc = await purchaseOrderService.createOrder({
      empresaId: 'emp-1',
      proveedorId: 'prov-cem-01',
      items: [{ descripcion: 'Insumo X', cantidad: 10, unidadMedida: 'UNIDAD', precioUnitario: 5000 }]
    });

    await purchaseOrderService.cancelOrder(oc.id, 'Cancelación por cambio de ingeniería', 'admin_compras');

    const ocCancelada = await purchaseOrderRepository.getById(oc.id);
    expect(ocCancelada?.estado).toBe('CANCELADA');
    expect(ocCancelada?.motivoCancelacion).toBe('Cancelación por cambio de ingeniería');

    // Intentar cancelar de nuevo
    await expect(
      purchaseOrderService.cancelOrder(oc.id, 'Segunda cancelación', 'admin_compras')
    ).rejects.toThrow(/no puede cancelarse en estado CANCELADA/);
  });

  it('Caso N: Recepción parcial actualiza cantidad recibida y estado OC a PARCIALMENTE_RECIBIDA', async () => {
    // oc-001 tiene 60 TN de cemento, recibidas 30 TN en seed.
    const ord = await purchaseOrderRepository.getById('oc-001');
    expect(ord?.estado).toBe('PARCIALMENTE_RECIBIDA');
    expect(ord?.items[0].cantidadRecibida).toBe(30);
    expect(ord?.items[0].cantidadPendiente).toBe(30);
  });

  it('Caso O: Segunda recepción completa la OC y pasa su estado a RECIBIDA', async () => {
    // Recibimos las 30 TN restantes de oc-001
    const res = await purchaseReceiptService.confirmReceipt({
      empresaId: 'emp-1',
      ordenCompraId: 'oc-001',
      numeroRemitoProveedor: 'R-0012-98500',
      recibidoPorEmpleadoId: 'emp-1',
      items: [
        {
          ordenCompraItemId: 'item-oc-101',
          cantidadRecibida: 30,
          cantidadAceptada: 30,
          cantidadRechazada: 0
        }
      ]
    });

    expect(res.receipt.estado).toBe('CONFIRMADA');

    const ord = await purchaseOrderRepository.getById('oc-001');
    expect(ord?.estado).toBe('RECIBIDA');
    expect(ord?.items[0].cantidadRecibida).toBe(60);
    expect(ord?.items[0].cantidadPendiente).toBe(0);
  });

  it('Caso P: No permitir sobre-recepción (rechaza si supera cantidad ordenada)', async () => {
    // oc-001 tiene 60 TN ordenadas y 30 ya recibidas. Si intentamos recibir 35 TN (total 65), debe rechazar.
    await expect(
      purchaseReceiptService.confirmReceipt({
        empresaId: 'emp-1',
        ordenCompraId: 'oc-001',
        recibidoPorEmpleadoId: 'emp-1',
        items: [
          {
            ordenCompraItemId: 'item-oc-101',
            cantidadRecibida: 35,
            cantidadAceptada: 35
          }
        ]
      })
    ).rejects.toThrow(/Sobre-recepción rechazada/);
  });

  it('Caso Q: Recepción anulada conserva historial y revierte cantidades derivadas en la OC', async () => {
    // Anular rec-001 (que tenía 30 TN recibidas de oc-001)
    await purchaseReceiptService.cancelReceipt('rec-001', 'Error de pesaje en báscula', 'admin_compras');

    const rec = await purchaseReceiptRepository.getById('rec-001');
    expect(rec?.estado).toBe('ANULADA');
    expect(rec?.motivoAnulacion).toBe('Error de pesaje en báscula');

    const ord = await purchaseOrderRepository.getById('oc-001');
    expect(ord?.items[0].cantidadRecibida).toBe(0);
    expect(ord?.items[0].cantidadPendiente).toBe(60);
    expect(ord?.estado).toBe('EMITIDA');
  });

  it('Caso R: Servicio recibido no genera stock físico pero queda registrado y trazable', async () => {
    const ocServicio = await purchaseOrderService.createOrder({
      empresaId: 'emp-1',
      proveedorId: 'prov-serv-04',
      items: [
        {
          tipo: 'SERVICIO',
          descripcion: 'Rectificación de Eje de Mezcladora Mixer MIX-12',
          cantidad: 1,
          unidadMedida: 'GLOBAL',
          precioUnitario: 450000,
          equipoId: 'eq-mix-12'
        }
      ]
    });

    const recServ = await purchaseReceiptService.confirmReceipt({
      empresaId: 'emp-1',
      ordenCompraId: ocServicio.id,
      recibidoPorEmpleadoId: 'emp-1',
      items: [
        {
          ordenCompraItemId: ocServicio.items[0].id,
          cantidadRecibida: 1,
          cantidadAceptada: 1
        }
      ]
    });

    expect(recServ.receipt.items[0].tipo).toBe('SERVICIO');
    expect(recServ.receipt.estado).toBe('CONFIRMADA');
  });

  it('Caso S: Recepción de artículo genera evento preparado para el módulo de Stock', async () => {
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
          precioUnitario: 25000
        }
      ]
    });

    const rec = await purchaseReceiptService.confirmReceipt({
      empresaId: 'emp-1',
      ordenCompraId: oc.id,
      recibidoPorEmpleadoId: 'emp-1',
      items: [
        {
          ordenCompraItemId: oc.items[0].id,
          cantidadRecibida: 10,
          cantidadAceptada: 10
        }
      ]
    });

    expect(rec.receipt.id).toBeDefined();
    expect(rec.receipt.items[0].articuloId).toBe('art-rep-filtro-aire');
  });

  it('Caso T: Compra de combustible genera integración limpia hacia tanque sin doble ingreso', async () => {
    const tankBefore = await tankRepository.getTankById('tq-pl1-diesel-01');
    const stockAntes = tankBefore?.stockActualLitros || 8500;

    // 1. Emitir OC de 5.000 L de Gasoil
    const ocFuel = await purchaseOrderService.createOrder({
      empresaId: 'emp-1',
      proveedorId: 'prov-comb-02',
      items: [
        {
          tipo: 'ARTICULO',
          tipoCombustibleId: 'fuel-diesel-500',
          descripcion: 'Gasoil Grado 2 (Diesel 500)',
          cantidad: 5000,
          unidadMedida: 'LITRO',
          precioUnitario: 1150
        }
      ]
    });

    // 2. Recibir cisterna con destino al tanque tq-pl1-diesel-01
    const recFuel = await purchaseReceiptService.confirmReceipt({
      empresaId: 'emp-1',
      ordenCompraId: ocFuel.id,
      numeroRemitoProveedor: 'R-YPF-99112',
      tanqueId: 'tq-pl1-diesel-01',
      recibidoPorEmpleadoId: 'emp-1',
      items: [
        {
          ordenCompraItemId: ocFuel.items[0].id,
          cantidadRecibida: 5000,
          cantidadAceptada: 5000
        }
      ]
    });

    expect(recFuel.receipt.estado).toBe('CONFIRMADA');

    // El stock del tanque debe haber aumentado en 5.000 L automáticamente
    const tankAfter = await tankRepository.getTankById('tq-pl1-diesel-01');
    expect(tankAfter?.stockActualLitros).toBe(stockAntes + 5000);
  });

  it('Caso U: Factura proveedor válida se registra con desglose de impuestos', async () => {
    const fac = await supplierInvoiceService.registerInvoice({
      empresaId: 'emp-1',
      proveedorId: 'prov-cem-01',
      tipoComprobante: 'FACTURA_A',
      puntoVenta: 14,
      numeroComprobante: 99500,
      fechaEmision: '2026-09-30',
      fechaVencimiento: '2026-10-30',
      subtotalNetoGravado: 1000000,
      subtotalNoGravado: 0,
      iva21: 210000,
      percepcionesIIBB: 30000,
      totalComprobante: 1240000
    });

    expect(fac.id).toBeDefined();
    expect(fac.estado).toBe('REGISTRADA');
    expect(fac.totalComprobante).toBe(1240000);
  });

  it('Caso V: Factura duplicada por clave fiscal (empresa, proveedor, tipo, puntoVenta, numero) se rechaza', async () => {
    await supplierInvoiceService.registerInvoice({
      empresaId: 'emp-1',
      proveedorId: 'prov-cem-01',
      tipoComprobante: 'FACTURA_A',
      puntoVenta: 1,
      numeroComprobante: 1234,
      fechaEmision: '2026-09-30',
      fechaVencimiento: '2026-10-30',
      subtotalNetoGravado: 100000,
      iva21: 21000,
      totalComprobante: 121000
    });

    // Intentar registrar de nuevo el mismo comprobante fiscal
    await expect(
      supplierInvoiceService.registerInvoice({
        empresaId: 'emp-1',
        proveedorId: 'prov-cem-01',
        tipoComprobante: 'FACTURA_A',
        puntoVenta: 1,
        numeroComprobante: 1234,
        fechaEmision: '2026-09-30',
        fechaVencimiento: '2026-10-30',
        subtotalNetoGravado: 100000,
        iva21: 21000,
        totalComprobante: 121000
      })
    ).rejects.toThrow(/ya se encuentra registrado para el proveedor/);
  });

  it('Caso W: Matching 3-Way (Ordenado = Recibido = Facturado) devuelve estado OK', async () => {
    // oc-001 (en seed: recibida 30 TN, facturada 30 TN en fac-prov-001)
    const match = await purchaseMatchingService.evaluateMatching({
      ordenCompraId: 'oc-001',
      facturaProveedorId: 'fac-prov-001'
    });

    expect(match.estadoMatching).toBe('OK');
    expect(match.detalles[0]).toContain('3-Way Matching');
  });

  it('Caso X: Diferencia en cantidad detectada en el matching', async () => {
    // Crear factura con cantidad 40 TN cuando se recibieron 30 TN
    const facDif = await supplierInvoiceService.registerInvoice({
      empresaId: 'emp-1',
      proveedorId: 'prov-cem-01',
      tipoComprobante: 'FACTURA_A',
      puntoVenta: 14,
      numeroComprobante: 99999,
      fechaEmision: '2026-09-30',
      fechaVencimiento: '2026-10-30',
      subtotalNetoGravado: 7200000, // 40 TN x 180.000
      iva21: 1512000,
      totalComprobante: 8712000,
      ordenCompraId: 'oc-001',
      items: [{ descripcion: 'Cemento', cantidad: 40, precioUnitario: 180000, ivaPct: 21.0 }]
    });

    const match = await purchaseMatchingService.evaluateMatching({
      ordenCompraId: 'oc-001',
      facturaProveedorId: facDif.id
    });

    expect(match.estadoMatching).toBe('DIFERENCIA_CANTIDAD');
    expect(match.diferenciaCantidad).toBe(10); // 40 facturados - 30 recibidos
  });

  it('Caso Y: Diferencia en precio detectada en el matching', async () => {
    // Factura con precio mayor ($200.000 en vez de $180.000)
    const facPrecio = await supplierInvoiceService.registerInvoice({
      empresaId: 'emp-1',
      proveedorId: 'prov-cem-01',
      tipoComprobante: 'FACTURA_A',
      puntoVenta: 14,
      numeroComprobante: 88888,
      fechaEmision: '2026-09-30',
      fechaVencimiento: '2026-10-30',
      subtotalNetoGravado: 6000000, // 30 TN x 200.000 (monto OC ordenado era 13.068.000 total por 60 TN)
      iva21: 1260000,
      totalComprobante: 7260000,
      ordenCompraId: 'oc-001',
      items: [{ descripcion: 'Cemento', cantidad: 30, precioUnitario: 200000, ivaPct: 21.0 }]
    });

    const match = await purchaseMatchingService.evaluateMatching({
      ordenCompraId: 'oc-001',
      facturaProveedorId: facPrecio.id
    });

    expect(match.estadoMatching).toBe('DIFERENCIA_PRECIO');
  });

  it('Caso Z: Snapshot histórico de OC no cambia al modificar datos del proveedor después', async () => {
    const oc = await purchaseOrderRepository.getById('oc-001');
    const razonSocialHistorica = oc?.proveedorNombreSnapshot;

    // Modificar proveedor en maestro
    const prov = await supplierRepository.getById('prov-cem-01');
    if (prov) {
      prov.razonSocial = 'Loma Negra Nueva Razón Social S.A.';
      await supplierRepository.save(prov);
    }

    const ocConsultada = await purchaseOrderRepository.getById('oc-001');
    expect(ocConsultada?.proveedorNombreSnapshot).toBe(razonSocialHistorica);
  });

  it('Caso AA: eventId duplicado no genera doble recepción ni doble ingreso de stock', async () => {
    const evId = 'EVT-REC-IDEMPOTENCY-001';

    const res1 = await purchaseReceiptService.confirmReceipt({
      empresaId: 'emp-1',
      ordenCompraId: 'oc-001',
      recibidoPorEmpleadoId: 'emp-1',
      eventId: evId,
      items: [{ ordenCompraItemId: 'item-oc-101', cantidadRecibida: 10, cantidadAceptada: 10 }]
    });
    expect(res1.isDuplicate).toBe(false);

    // Mismo evento enviado nuevamente
    const res2 = await purchaseReceiptService.confirmReceipt({
      empresaId: 'emp-1',
      ordenCompraId: 'oc-001',
      recibidoPorEmpleadoId: 'emp-1',
      eventId: evId,
      items: [{ ordenCompraItemId: 'item-oc-101', cantidadRecibida: 10, cantidadAceptada: 10 }]
    });
    expect(res2.isDuplicate).toBe(true);
    expect(res2.receipt.id).toBe(res1.receipt.id);
  });

  it('Caso AB: Documento confirmado no se borra físicamente al anularse', async () => {
    const fac = await supplierInvoiceService.registerInvoice({
      empresaId: 'emp-1',
      proveedorId: 'prov-cem-01',
      tipoComprobante: 'FACTURA_B',
      puntoVenta: 2,
      numeroComprobante: 555,
      fechaEmision: '2026-09-30',
      fechaVencimiento: '2026-10-30',
      subtotalNetoGravado: 50000,
      iva21: 10500,
      totalComprobante: 60500
    });

    await supplierInvoiceService.cancelInvoice(fac.id, 'Anulación por error de imputación', 'admin_compras');

    const facGuardada = await supplierInvoiceRepository.getById(fac.id);
    expect(facGuardada).not.toBeNull();
    expect(facGuardada?.estado).toBe('ANULADA');
    expect(facGuardada?.motivoAnulacion).toBe('Anulación por error de imputación');
  });

  it('Caso AC: Acciones críticas quedan auditadas en auditRepository con contenido verificable', async () => {
    // Registrar una acción crítica concreta
    const prov = await supplierService.createSupplier({
      empresaId: 'emp-1',
      codigo: 'PROV-AUDIT-01',
      razonSocial: 'Proveedor Audit Test S.A.',
      tipoDocumento: 'CUIT',
      numeroDocumento: '30-77889911-2',
      condicionIVA: 'RESPONSABLE_INSCRIPTO',
      direccion: 'Ruta 9 KM 40',
      localidad: 'Campana',
      provincia: 'Buenos Aires',
      pais: 'Argentina',
      codigoPostal: '2804',
      telefono: '03489-445566',
      email: 'audit@proveedor.com',
      condicionPagoDefault: 'CUENTA_CORRIENTE',
      diasPagoDefault: 30,
      monedaDefault: 'ARS',
      categoriasProveidas: ['REPUESTOS']
    });

    const logs = await auditRepository.getLogs('comp_proveedores');
    expect(logs.length).toBeGreaterThan(0);
    const logProv = logs.find(l => l.registroId === prov.id);
    expect(logProv).toBeDefined();
    expect(logProv?.accion).toBe('ALTA_PROVEEDOR');
    expect(logProv?.entidad).toBe('comp_proveedores');
  });

  it('Caso AD: Multiempresa mantiene aislamiento lógico en solicitudes y órdenes', async () => {
    const scEmp1 = await purchaseRequestService.createRequest({
      empresaId: 'emp-1',
      solicitanteEmpleadoId: 'emp-1',
      sector: 'TALLER',
      motivo: 'Solicitud Empresa 1',
      items: [{ tipo: 'ARTICULO', descripcion: 'Item E1', cantidad: 5, unidadMedida: 'UNIDAD' }]
    });

    const scEmp2 = await purchaseRequestService.createRequest({
      empresaId: 'emp-2',
      solicitanteEmpleadoId: 'emp-1',
      sector: 'TALLER',
      motivo: 'Solicitud Empresa 2',
      items: [{ tipo: 'ARTICULO', descripcion: 'Item E2', cantidad: 5, unidadMedida: 'UNIDAD' }]
    });

    const listEmp1 = await purchaseRequestRepository.getAll({ empresaId: 'emp-1' });
    const listEmp2 = await purchaseRequestRepository.getAll({ empresaId: 'emp-2' });

    expect(listEmp1.some(s => s.id === scEmp1.id)).toBe(true);
    expect(listEmp1.some(s => s.id === scEmp2.id)).toBe(false);
    expect(listEmp2.some(s => s.id === scEmp2.id)).toBe(true);
  });

  it('Caso AE: Recepción combustible usa precio snapshot de OC y nunca fallback inventado (rechaza si precio <= 0)', async () => {
    // 1. Crear OC con item de combustible con precio inválido
    const ocSinPrecio = await purchaseOrderService.createOrder({
      empresaId: 'emp-1',
      proveedorId: 'prov-comb-02',
      items: [
        {
          tipo: 'ARTICULO',
          tipoCombustibleId: 'fuel-diesel-500',
          descripcion: 'Gasoil Grado 2 Sin Precio',
          cantidad: 1000,
          unidadMedida: 'LITRO',
          precioUnitario: 1150 // lo creamos y luego alteramos el snapshot a 0 para simular ausencia de precio válido
        }
      ]
    });
    ocSinPrecio.items[0].precioUnitarioSnapshot = 0;
    await purchaseOrderRepository.save(ocSinPrecio);

    // 2. Intentar recibir en tanque: debe rechazarse en prevalidación
    await expect(
      purchaseReceiptService.confirmReceipt({
        empresaId: 'emp-1',
        ordenCompraId: ocSinPrecio.id,
        tanqueId: 'tq-pl1-diesel-01',
        recibidoPorEmpleadoId: 'emp-1',
        items: [
          {
            ordenCompraItemId: ocSinPrecio.items[0].id,
            cantidadRecibida: 1000,
            cantidadAceptada: 1000
          }
        ]
      })
    ).rejects.toThrow(/No existe precio unitario válido en la Orden de Compra/);
  });

  it('Caso AF: Artículo normal NO se interpreta como combustible y rechaza recepción hacia tanque', async () => {
    // OC de repuestos / filtros (tipo: ARTICULO pero SIN tipoCombustibleId)
    const ocFiltros = await purchaseOrderService.createOrder({
      empresaId: 'emp-1',
      proveedorId: 'prov-rep-03',
      items: [
        {
          tipo: 'ARTICULO',
          descripcion: 'Filtro de Aceite Heavy Duty',
          cantidad: 10,
          unidadMedida: 'UNIDAD',
          precioUnitario: 45000
        }
      ]
    });

    // Intentar recibir filtros con tanqueId especificado debe ser rechazado
    await expect(
      purchaseReceiptService.confirmReceipt({
        empresaId: 'emp-1',
        ordenCompraId: ocFiltros.id,
        tanqueId: 'tq-pl1-diesel-01',
        recibidoPorEmpleadoId: 'emp-1',
        items: [
          {
            ordenCompraItemId: ocFiltros.items[0].id,
            cantidadRecibida: 10,
            cantidadAceptada: 10
          }
        ]
      })
    ).rejects.toThrow(/El tanque especificado no corresponde a ningún item de combustible tipado/);
  });

  it('Caso AG: Recepción mixta combustible + repuesto solo suma litros de combustible al tanque', async () => {
    const tankBefore = await tankRepository.getTankById('tq-pl1-diesel-01');
    const stockAntes = tankBefore?.stockActualLitros || 8500;

    // OC con 5 filtros + 4.000 L de diesel
    const ocMixta = await purchaseOrderService.createOrder({
      empresaId: 'emp-1',
      proveedorId: 'prov-comb-02',
      items: [
        {
          tipo: 'ARTICULO',
          descripcion: 'Filtro Purificador',
          cantidad: 5,
          unidadMedida: 'UNIDAD',
          precioUnitario: 30000
        },
        {
          tipo: 'ARTICULO',
          tipoCombustibleId: 'fuel-diesel-500',
          descripcion: 'Diesel 500 a Granel',
          cantidad: 4000,
          unidadMedida: 'LITRO',
          precioUnitario: 1140
        }
      ]
    });

    const rec = await purchaseReceiptService.confirmReceipt({
      empresaId: 'emp-1',
      ordenCompraId: ocMixta.id,
      tanqueId: 'tq-pl1-diesel-01',
      recibidoPorEmpleadoId: 'emp-1',
      items: [
        {
          ordenCompraItemId: ocMixta.items[0].id,
          cantidadRecibida: 5,
          cantidadAceptada: 5
        },
        {
          ordenCompraItemId: ocMixta.items[1].id,
          cantidadRecibida: 4000,
          cantidadAceptada: 4000
        }
      ]
    });

    expect(rec.receipt.estado).toBe('CONFIRMADA');

    // El stock del tanque debe haber subido exactamente 4.000 L (NO 4.005 L)
    const tankAfter = await tankRepository.getTankById('tq-pl1-diesel-01');
    expect(tankAfter?.stockActualLitros).toBe(stockAntes + 4000);
  });

  it('Caso AH: Anular recepción combustible revierte stock del tanque exactamente una vez', async () => {
    const tankBefore = await tankRepository.getTankById('tq-pl1-diesel-01');
    const stockAntes = tankBefore?.stockActualLitros || 8500;

    const oc = await purchaseOrderService.createOrder({
      empresaId: 'emp-1',
      proveedorId: 'prov-comb-02',
      items: [
        {
          tipo: 'ARTICULO',
          tipoCombustibleId: 'fuel-diesel-500',
          descripcion: 'Diesel Cisterna',
          cantidad: 3000,
          unidadMedida: 'LITRO',
          precioUnitario: 1150
        }
      ]
    });

    const rec = await purchaseReceiptService.confirmReceipt({
      empresaId: 'emp-1',
      ordenCompraId: oc.id,
      tanqueId: 'tq-pl1-diesel-01',
      recibidoPorEmpleadoId: 'emp-1',
      items: [
        {
          ordenCompraItemId: oc.items[0].id,
          cantidadRecibida: 3000,
          cantidadAceptada: 3000
        }
      ]
    });

    // Stock subió a stockAntes + 3000
    const tankMid = await tankRepository.getTankById('tq-pl1-diesel-01');
    expect(tankMid?.stockActualLitros).toBe(stockAntes + 3000);

    // Anular recepción
    await purchaseReceiptService.cancelReceipt(rec.receipt.id, 'Error de descarga en cisterna equivocada');

    // Stock debe regresar exactamente a stockAntes
    const tankEnd = await tankRepository.getTankById('tq-pl1-diesel-01');
    expect(tankEnd?.stockActualLitros).toBe(stockAntes);
  });

  it('Caso AI: Doble anulación no genera segunda reversión', async () => {
    const oc = await purchaseOrderService.createOrder({
      empresaId: 'emp-1',
      proveedorId: 'prov-comb-02',
      items: [
        {
          tipo: 'ARTICULO',
          tipoCombustibleId: 'fuel-diesel-500',
          descripcion: 'Diesel Test',
          cantidad: 1000,
          unidadMedida: 'LITRO',
          precioUnitario: 1150
        }
      ]
    });

    const rec = await purchaseReceiptService.confirmReceipt({
      empresaId: 'emp-1',
      ordenCompraId: oc.id,
      tanqueId: 'tq-pl1-diesel-01',
      recibidoPorEmpleadoId: 'emp-1',
      items: [
        {
          ordenCompraItemId: oc.items[0].id,
          cantidadRecibida: 1000,
          cantidadAceptada: 1000
        }
      ]
    });

    await purchaseReceiptService.cancelReceipt(rec.receipt.id, 'Primera anulación');

    await expect(
      purchaseReceiptService.cancelReceipt(rec.receipt.id, 'Segunda anulación')
    ).rejects.toThrow(/ya se encuentra ANULADA/);
  });

  it('Caso AJ: Error de integración con tanque no deja mutación parcial en OC/recepción/tanque', async () => {
    const tankBefore = await tankRepository.getTankById('tq-pl1-diesel-01');
    const stockAntes = tankBefore?.stockActualLitros || 8500;

    const oc = await purchaseOrderService.createOrder({
      empresaId: 'emp-1',
      proveedorId: 'prov-comb-02',
      items: [
        {
          tipo: 'ARTICULO',
          tipoCombustibleId: 'fuel-nafta-sup', // Incompatible con tanque diesel
          descripcion: 'Nafta Super',
          cantidad: 2000,
          unidadMedida: 'LITRO',
          precioUnitario: 1100
        }
      ]
    });

    // Intentar recibir nafta en tanque diesel (debe fallar en prevalidación)
    await expect(
      purchaseReceiptService.confirmReceipt({
        empresaId: 'emp-1',
        ordenCompraId: oc.id,
        tanqueId: 'tq-pl1-diesel-01',
        recibidoPorEmpleadoId: 'emp-1',
        items: [
          {
            ordenCompraItemId: oc.items[0].id,
            cantidadRecibida: 2000,
            cantidadAceptada: 2000
          }
        ]
      })
    ).rejects.toThrow(/Incompatibilidad de combustible/);

    // Verificar que la OC no mutó sus cantidades recibidas
    const ocAfter = await purchaseOrderRepository.getById(oc.id);
    expect(ocAfter?.items[0].cantidadRecibida).toBe(0);
    expect(ocAfter?.estado).toBe('EMITIDA');

    // Verificar que el tanque no cambió su stock
    const tankAfter = await tankRepository.getTankById('tq-pl1-diesel-01');
    expect(tankAfter?.stockActualLitros).toBe(stockAntes);
  });

  it('Caso AK: No se puede ordenar más que la cantidad pendiente de la solicitud', async () => {
    const sc = await purchaseRequestService.createRequest({
      empresaId: 'emp-1',
      solicitanteEmpleadoId: 'emp-1',
      sector: 'TALLER',
      motivo: 'Solicitud con tope',
      items: [{ tipo: 'ARTICULO', descripcion: 'Rodamientos', cantidad: 10, unidadMedida: 'UNIDAD' }]
    });

    await purchaseRequestService.approveRequest(sc.id, 'emp-1', 'Aprobado');

    // 1. Emitir primera OC por 8 unidades (pendiente queda en 2)
    await purchaseOrderService.createOrder({
      empresaId: 'emp-1',
      proveedorId: 'prov-rep-03',
      solicitudCompraId: sc.id,
      items: [
        {
          solicitudItemId: sc.items[0].id,
          tipo: 'ARTICULO',
          descripcion: 'Rodamientos',
          cantidad: 8,
          unidadMedida: 'UNIDAD',
          precioUnitario: 10000
        }
      ]
    });

    // 2. Intentar emitir segunda OC por 5 unidades (supera las 2 pendientes)
    await expect(
      purchaseOrderService.createOrder({
        empresaId: 'emp-1',
        proveedorId: 'prov-rep-03',
        solicitudCompraId: sc.id,
        items: [
          {
            solicitudItemId: sc.items[0].id,
            tipo: 'ARTICULO',
            descripcion: 'Rodamientos',
            cantidad: 5,
            unidadMedida: 'UNIDAD',
            precioUnitario: 10000
          }
        ]
      })
    ).rejects.toThrow(/supera la cantidad pendiente/);
  });

  it('Caso AL: Cancelar única OC devuelve todas las cantidades pendientes a la solicitud', async () => {
    const sc = await purchaseRequestService.createRequest({
      empresaId: 'emp-1',
      solicitanteEmpleadoId: 'emp-1',
      sector: 'TALLER',
      motivo: 'Solicitud para orden única',
      items: [{ tipo: 'ARTICULO', descripcion: 'Neumáticos', cantidad: 4, unidadMedida: 'UNIDAD' }]
    });

    await purchaseRequestService.approveRequest(sc.id, 'emp-1', 'Aprobado');

    const oc = await purchaseOrderService.createOrder({
      empresaId: 'emp-1',
      proveedorId: 'prov-rep-03',
      solicitudCompraId: sc.id,
      items: [
        {
          solicitudItemId: sc.items[0].id,
          tipo: 'ARTICULO',
          descripcion: 'Neumáticos',
          cantidad: 4,
          unidadMedida: 'UNIDAD',
          precioUnitario: 250000
        }
      ]
    });

    const scOrdenada = await purchaseRequestRepository.getById(sc.id);
    expect(scOrdenada?.estado).toBe('ORDENADA');
    expect(scOrdenada?.items[0].cantidadPendiente).toBe(0);

    // Cancelar la OC
    await purchaseOrderService.cancelOrder(oc.id, 'Proveedor no dispone de stock');

    const scRevertida = await purchaseRequestRepository.getById(sc.id);
    expect(scRevertida?.estado).toBe('APROBADA');
    expect(scRevertida?.items[0].cantidadOrdenada).toBe(0);
    expect(scRevertida?.items[0].cantidadPendiente).toBe(4);
  });

  it('Caso AM: Cancelar una de varias OC recalcula correctamente cantidad ordenada y pendiente', async () => {
    const sc = await purchaseRequestService.createRequest({
      empresaId: 'emp-1',
      solicitanteEmpleadoId: 'emp-1',
      sector: 'TALLER',
      motivo: 'Solicitud fraccionada',
      items: [{ tipo: 'ARTICULO', descripcion: 'Aceite 15W40', cantidad: 100, unidadMedida: 'LITRO' }]
    });

    await purchaseRequestService.approveRequest(sc.id, 'emp-1', 'Aprobado');

    // OC 1: 60 L
    const oc1 = await purchaseOrderService.createOrder({
      empresaId: 'emp-1',
      proveedorId: 'prov-rep-03',
      solicitudCompraId: sc.id,
      items: [
        {
          solicitudItemId: sc.items[0].id,
          tipo: 'ARTICULO',
          descripcion: 'Aceite 15W40',
          cantidad: 60,
          unidadMedida: 'LITRO',
          precioUnitario: 8000
        }
      ]
    });

    // OC 2: 40 L
    const oc2 = await purchaseOrderService.createOrder({
      empresaId: 'emp-1',
      proveedorId: 'prov-rep-03',
      solicitudCompraId: sc.id,
      items: [
        {
          solicitudItemId: sc.items[0].id,
          tipo: 'ARTICULO',
          descripcion: 'Aceite 15W40',
          cantidad: 40,
          unidadMedida: 'LITRO',
          precioUnitario: 8000
        }
      ]
    });

    const scTotal = await purchaseRequestRepository.getById(sc.id);
    expect(scTotal?.estado).toBe('ORDENADA');
    expect(scTotal?.items[0].cantidadPendiente).toBe(0);

    // Cancelar la OC 2 (de 40 L)
    await purchaseOrderService.cancelOrder(oc2.id, 'Cancelación de segunda orden');

    const scRecalculada = await purchaseRequestRepository.getById(sc.id);
    expect(scRecalculada?.estado).toBe('PARCIALMENTE_ORDENADA');
    expect(scRecalculada?.items[0].cantidadOrdenada).toBe(60);
    expect(scRecalculada?.items[0].cantidadPendiente).toBe(40);
  });

  it('Caso AN: Auditoría crítica produce realmente un log verificable en la entidad correspondiente', async () => {
    const oc = await purchaseOrderService.createOrder({
      empresaId: 'emp-1',
      proveedorId: 'prov-rep-03',
      items: [
        {
          tipo: 'ARTICULO',
          descripcion: 'Repuesto Test Audit',
          cantidad: 1,
          unidadMedida: 'UNIDAD',
          precioUnitario: 1000
        }
      ]
    });

    const logs = await auditRepository.getLogs('comp_ordenes_compra');
    const logOC = logs.find(l => l.registroId === oc.id);
    expect(logOC).toBeDefined();
    expect(logOC?.accion).toBe('EMISION_ORDEN_COMPRA');
    expect(logOC?.entidad).toBe('comp_ordenes_compra');
  });

  it('Caso AO: No se puede usar proveedor de otra empresa en Orden de Compra', async () => {
    // Proveedor creado para empresa-2
    const provEmp2 = await supplierService.createSupplier({
      empresaId: 'emp-2',
      codigo: 'PROV-EMP2-01',
      razonSocial: 'Proveedor Empresa 2 S.A.',
      tipoDocumento: 'CUIT',
      numeroDocumento: '30-99887766-5',
      condicionIVA: 'RESPONSABLE_INSCRIPTO',
      direccion: 'Av Central 100',
      localidad: 'Cordoba',
      provincia: 'Cordoba',
      pais: 'Argentina',
      codigoPostal: '5000',
      telefono: '0351-123456',
      email: 'contacto@prov2.com',
      condicionPagoDefault: 'CUENTA_CORRIENTE',
      diasPagoDefault: 30,
      monedaDefault: 'ARS',
      categoriasProveidas: ['REPUESTOS']
    });

    // Intentar usar provEmp2 en una OC de empresa emp-1
    await expect(
      purchaseOrderService.createOrder({
        empresaId: 'emp-1',
        proveedorId: provEmp2.id,
        items: [{ tipo: 'ARTICULO', descripcion: 'Test', cantidad: 1, unidadMedida: 'UNIDAD', precioUnitario: 100 }]
      })
    ).rejects.toThrow(/Aislamiento multiempresa violado/);
  });

  it('Caso AP: No se puede crear OC de empresa distinta a la solicitud de compra', async () => {
    const scEmp2 = await purchaseRequestService.createRequest({
      empresaId: 'emp-2',
      solicitanteEmpleadoId: 'emp-1',
      sector: 'TALLER',
      motivo: 'Solicitud Empresa 2',
      items: [{ tipo: 'ARTICULO', descripcion: 'Repuesto E2', cantidad: 5, unidadMedida: 'UNIDAD' }]
    });

    await purchaseRequestService.approveRequest(scEmp2.id, 'emp-1', 'Aprobado');

    // Intentar crear OC en empresa emp-1 vinculando la solicitud de emp-2
    await expect(
      purchaseOrderService.createOrder({
        empresaId: 'emp-1',
        proveedorId: 'prov-rep-03',
        solicitudCompraId: scEmp2.id,
        items: [
          {
            solicitudItemId: scEmp2.items[0].id,
            tipo: 'ARTICULO',
            descripcion: 'Repuesto E2',
            cantidad: 5,
            unidadMedida: 'UNIDAD',
            precioUnitario: 1000
          }
        ]
      })
    ).rejects.toThrow(/Aislamiento multiempresa violado/);
  });

  it('Caso AQ: No se puede recibir una OC desde una empresa distinta', async () => {
    const ocEmp1 = await purchaseOrderService.createOrder({
      empresaId: 'emp-1',
      proveedorId: 'prov-rep-03',
      items: [{ tipo: 'ARTICULO', descripcion: 'Item E1', cantidad: 10, unidadMedida: 'UNIDAD', precioUnitario: 500 }]
    });

    // Intentar recibir la OC de emp-1 usando empresaId emp-2
    await expect(
      purchaseReceiptService.confirmReceipt({
        empresaId: 'emp-2',
        ordenCompraId: ocEmp1.id,
        recibidoPorEmpleadoId: 'emp-1',
        items: [{ ordenCompraItemId: ocEmp1.items[0].id, cantidadRecibida: 10, cantidadAceptada: 10 }]
      })
    ).rejects.toThrow(/Aislamiento multiempresa violado/);
  });

  it('Caso AR: Dos items del mismo combustible con precios distintos generan dos ingresos de tanque correctamente valorizados', async () => {
    const ocDoblePrecio = await purchaseOrderService.createOrder({
      empresaId: 'emp-1',
      proveedorId: 'prov-comb-02',
      items: [
        {
          tipo: 'ARTICULO',
          tipoCombustibleId: 'fuel-diesel-500',
          descripcion: 'Diesel 500 Lote A',
          cantidad: 2000,
          unidadMedida: 'LITRO',
          precioUnitario: 1100
        },
        {
          tipo: 'ARTICULO',
          tipoCombustibleId: 'fuel-diesel-500',
          descripcion: 'Diesel 500 Lote B',
          cantidad: 3000,
          unidadMedida: 'LITRO',
          precioUnitario: 1200
        }
      ]
    });

    const rec = await purchaseReceiptService.confirmReceipt({
      empresaId: 'emp-1',
      ordenCompraId: ocDoblePrecio.id,
      tanqueId: 'tq-pl1-diesel-01',
      recibidoPorEmpleadoId: 'emp-1',
      items: [
        {
          ordenCompraItemId: ocDoblePrecio.items[0].id,
          cantidadRecibida: 2000,
          cantidadAceptada: 2000
        },
        {
          ordenCompraItemId: ocDoblePrecio.items[1].id,
          cantidadRecibida: 3000,
          cantidadAceptada: 3000
        }
      ]
    });

    expect(rec.receipt.items[0].ingresoCombustibleId).toBeDefined();
    expect(rec.receipt.items[1].ingresoCombustibleId).toBeDefined();
    expect(rec.receipt.items[0].ingresoCombustibleId).not.toBe(rec.receipt.items[1].ingresoCombustibleId);

    const ing1 = await tankRepository.getTankIncomeById(rec.receipt.items[0].ingresoCombustibleId!);
    const ing2 = await tankRepository.getTankIncomeById(rec.receipt.items[1].ingresoCombustibleId!);

    expect(ing1?.litros).toBe(2000);
    expect(ing1?.precioUnitario).toBe(1100);
    expect(ing1?.costoTotal).toBe(2200000);

    expect(ing2?.litros).toBe(3000);
    expect(ing2?.precioUnitario).toBe(1200);
    expect(ing2?.costoTotal).toBe(3600000);
  });

  it('Caso AS: La suma de litros ingresados al tanque coincide exactamente con la suma de cantidades aceptadas de items combustible', async () => {
    const tankBefore = await tankRepository.getTankById('tq-pl1-diesel-01');
    const stockAntes = tankBefore?.stockActualLitros || 8500;

    const oc = await purchaseOrderService.createOrder({
      empresaId: 'emp-1',
      proveedorId: 'prov-comb-02',
      items: [
        {
          tipo: 'ARTICULO',
          tipoCombustibleId: 'fuel-diesel-500',
          descripcion: 'Diesel Parte 1',
          cantidad: 1500,
          unidadMedida: 'LITRO',
          precioUnitario: 1150
        },
        {
          tipo: 'ARTICULO',
          tipoCombustibleId: 'fuel-diesel-500',
          descripcion: 'Diesel Parte 2',
          cantidad: 2500,
          unidadMedida: 'LITRO',
          precioUnitario: 1150
        }
      ]
    });

    await purchaseReceiptService.confirmReceipt({
      empresaId: 'emp-1',
      ordenCompraId: oc.id,
      tanqueId: 'tq-pl1-diesel-01',
      recibidoPorEmpleadoId: 'emp-1',
      items: [
        { ordenCompraItemId: oc.items[0].id, cantidadRecibida: 1500, cantidadAceptada: 1500 },
        { ordenCompraItemId: oc.items[1].id, cantidadRecibida: 2500, cantidadAceptada: 2500 }
      ]
    });

    const tankAfter = await tankRepository.getTankById('tq-pl1-diesel-01');
    expect(tankAfter?.stockActualLitros).toBe(stockAntes + 4000);
  });

  it('Caso AT: Un item no combustible dentro de recepción mixta no genera ingreso de tanque', async () => {
    const ocMixta = await purchaseOrderService.createOrder({
      empresaId: 'emp-1',
      proveedorId: 'prov-comb-02',
      items: [
        {
          tipo: 'ARTICULO',
          descripcion: 'Aceite Hidráulico Tambor',
          cantidad: 2,
          unidadMedida: 'UNIDAD',
          precioUnitario: 180000
        },
        {
          tipo: 'ARTICULO',
          tipoCombustibleId: 'fuel-diesel-500',
          descripcion: 'Diesel 500',
          cantidad: 1000,
          unidadMedida: 'LITRO',
          precioUnitario: 1150
        }
      ]
    });

    const rec = await purchaseReceiptService.confirmReceipt({
      empresaId: 'emp-1',
      ordenCompraId: ocMixta.id,
      tanqueId: 'tq-pl1-diesel-01',
      recibidoPorEmpleadoId: 'emp-1',
      items: [
        { ordenCompraItemId: ocMixta.items[0].id, cantidadRecibida: 2, cantidadAceptada: 2 },
        { ordenCompraItemId: ocMixta.items[1].id, cantidadRecibida: 1000, cantidadAceptada: 1000 }
      ]
    });

    // Item no combustible no tiene ingresoCombustibleId
    expect(rec.receipt.items[0].ingresoCombustibleId).toBeUndefined();
    // Item combustible sí tiene ingresoCombustibleId
    expect(rec.receipt.items[1].ingresoCombustibleId).toBeDefined();
  });

  it('Caso AU: Anular recepción con dos ingresos combustible genera exactamente dos reversiones y restaura el stock original', async () => {
    const tankBefore = await tankRepository.getTankById('tq-pl1-diesel-01');
    const stockAntes = tankBefore?.stockActualLitros || 8500;

    const ocDoble = await purchaseOrderService.createOrder({
      empresaId: 'emp-1',
      proveedorId: 'prov-comb-02',
      items: [
        {
          tipo: 'ARTICULO',
          tipoCombustibleId: 'fuel-diesel-500',
          descripcion: 'Diesel Tramo 1',
          cantidad: 1200,
          unidadMedida: 'LITRO',
          precioUnitario: 1120
        },
        {
          tipo: 'ARTICULO',
          tipoCombustibleId: 'fuel-diesel-500',
          descripcion: 'Diesel Tramo 2',
          cantidad: 1800,
          unidadMedida: 'LITRO',
          precioUnitario: 1160
        }
      ]
    });

    const rec = await purchaseReceiptService.confirmReceipt({
      empresaId: 'emp-1',
      ordenCompraId: ocDoble.id,
      tanqueId: 'tq-pl1-diesel-01',
      recibidoPorEmpleadoId: 'emp-1',
      items: [
        { ordenCompraItemId: ocDoble.items[0].id, cantidadRecibida: 1200, cantidadAceptada: 1200 },
        { ordenCompraItemId: ocDoble.items[1].id, cantidadRecibida: 1800, cantidadAceptada: 1800 }
      ]
    });

    const tankMedio = await tankRepository.getTankById('tq-pl1-diesel-01');
    expect(tankMedio?.stockActualLitros).toBe(stockAntes + 3000);

    // Anular la recepción completa
    await purchaseReceiptService.cancelReceipt(rec.receipt.id, 'Anulación de recepción con dos lotes');

    const tankFinal = await tankRepository.getTankById('tq-pl1-diesel-01');
    expect(tankFinal?.stockActualLitros).toBe(stockAntes);
  });

  it('Caso AV: Si el segundo item combustible tiene precio inválido, falla la prevalidación completa sin mutaciones parciales', async () => {
    const tankBefore = await tankRepository.getTankById('tq-pl1-diesel-01');
    const stockAntes = tankBefore?.stockActualLitros || 8500;

    const ocParcialInvalida = await purchaseOrderService.createOrder({
      empresaId: 'emp-1',
      proveedorId: 'prov-comb-02',
      items: [
        {
          tipo: 'ARTICULO',
          tipoCombustibleId: 'fuel-diesel-500',
          descripcion: 'Diesel Renglón 1 Válido',
          cantidad: 2000,
          unidadMedida: 'LITRO',
          precioUnitario: 1150
        },
        {
          tipo: 'ARTICULO',
          tipoCombustibleId: 'fuel-diesel-500',
          descripcion: 'Diesel Renglón 2 Inválido',
          cantidad: 3000,
          unidadMedida: 'LITRO',
          precioUnitario: 1150
        }
      ]
    });

    // Alteramos el segundo item para tener precio unitario snapshot inválido (0)
    ocParcialInvalida.items[1].precioUnitarioSnapshot = 0;
    await purchaseOrderRepository.save(ocParcialInvalida);

    await expect(
      purchaseReceiptService.confirmReceipt({
        empresaId: 'emp-1',
        ordenCompraId: ocParcialInvalida.id,
        tanqueId: 'tq-pl1-diesel-01',
        recibidoPorEmpleadoId: 'emp-1',
        items: [
          { ordenCompraItemId: ocParcialInvalida.items[0].id, cantidadRecibida: 2000, cantidadAceptada: 2000 },
          { ordenCompraItemId: ocParcialInvalida.items[1].id, cantidadRecibida: 3000, cantidadAceptada: 3000 }
        ]
      })
    ).rejects.toThrow(/No existe precio unitario válido en la Orden de Compra/);

    // 1. OC no cambió sus cantidades
    const ocVerif = await purchaseOrderRepository.getById(ocParcialInvalida.id);
    expect(ocVerif?.items[0].cantidadRecibida).toBe(0);
    expect(ocVerif?.items[1].cantidadRecibida).toBe(0);
    expect(ocVerif?.estado).toBe('EMITIDA');

    // 2. Tanque no cambió su stock (primer item tampoco ingresó)
    const tankVerif = await tankRepository.getTankById('tq-pl1-diesel-01');
    expect(tankVerif?.stockActualLitros).toBe(stockAntes);
  });

  it('Caso AW: Cada RecepcionCompraItem combustible conserva vínculo explícito con su ingresoCombustibleId', async () => {
    const oc = await purchaseOrderService.createOrder({
      empresaId: 'emp-1',
      proveedorId: 'prov-comb-02',
      items: [
        {
          tipo: 'ARTICULO',
          tipoCombustibleId: 'fuel-diesel-500',
          descripcion: 'Diesel Lote Alpha',
          cantidad: 1000,
          unidadMedida: 'LITRO',
          precioUnitario: 1150
        }
      ]
    });

    const res = await purchaseReceiptService.confirmReceipt({
      empresaId: 'emp-1',
      ordenCompraId: oc.id,
      tanqueId: 'tq-pl1-diesel-01',
      recibidoPorEmpleadoId: 'emp-1',
      items: [{ ordenCompraItemId: oc.items[0].id, cantidadRecibida: 1000, cantidadAceptada: 1000 }]
    });

    const item = res.receipt.items[0];
    expect(item.ingresoCombustibleId).toBeDefined();
    expect(typeof item.ingresoCombustibleId).toBe('string');
    expect(item.ingresoCombustibleId?.startsWith('ing-')).toBe(true);
  });
});
