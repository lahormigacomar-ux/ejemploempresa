import { describe, it, expect, beforeEach } from 'vitest';
import { tankRepository } from '../repositories/tankRepository';
import { fuelRepository } from '../repositories/fuelRepository';
import { fuelPerformanceRepository } from '../repositories/fuelPerformanceRepository';
import { equipmentRepository } from '../repositories/equipmentRepository';
import { employeeRepository } from '../repositories/employeeRepository';
import { auditRepository } from '../repositories/auditRepository';
import { fuelService } from '../services/fuelService';
import { tankService } from '../services/tankService';
import { fuelPerformanceService } from '../services/fuelPerformanceService';

describe('MÓDULO 4 — COMBUSTIBLE Y RENDIMIENTO', () => {
  beforeEach(() => {
    tankRepository.resetForTesting();
    fuelRepository.resetForTesting();
    fuelPerformanceRepository.resetForTesting();
    equipmentRepository.resetForTesting();
    employeeRepository.resetForTesting();
    auditRepository.resetForTesting();
  });

  it('Caso A: Registrar ingreso al tanque aumenta stock y genera movimiento de kardex', async () => {
    const tankBefore = await tankRepository.getTankById('tq-pl1-diesel-01');
    const stockAntes = tankBefore?.stockActualLitros || 0; // 8500 L

    const income = await tankService.registerIncome({
      tanqueId: 'tq-pl1-diesel-01',
      litros: 5000,
      proveedorNombre: 'YPF Directo Mayorista',
      precioUnitario: 1120,
      numeroRemito: 'R-0004-98211',
      usuarioId: 'usr-compras'
    });

    expect(income.id).toBeDefined();
    expect(income.litros).toBe(5000);
    expect(income.costoTotal).toBe(5600000);

    const tankAfter = await tankRepository.getTankById('tq-pl1-diesel-01');
    expect(tankAfter?.stockActualLitros).toBe(stockAntes + 5000);

    const movs = await tankRepository.getTankMovements('tq-pl1-diesel-01');
    const lastMov = movs[movs.length - 1];
    expect(lastMov.tipoMovimiento).toBe('INGRESO');
    expect(lastMov.litros).toBe(5000);
  });

  it('Caso B: Abastecimiento desde tanque interno descuenta stock automáticamente', async () => {
    const tankBefore = await tankRepository.getTankById('tq-pl1-diesel-01');
    const stockAntes = tankBefore?.stockActualLitros || 0;

    const res = await fuelService.registerSupply({
      equipoId: 'eq-mix-12',
      empleadoId: 'emp-1',
      tipoCombustibleId: 'fuel-diesel-500',
      origenAbastecimiento: 'TANQUE_INTERNO',
      tanqueId: 'tq-pl1-diesel-01',
      litros: 150,
      odometroKm: 68600
    });

    expect(res.supply.id).toBeDefined();
    expect(res.supply.litros).toBe(150);

    const tankAfter = await tankRepository.getTankById('tq-pl1-diesel-01');
    expect(tankAfter?.stockActualLitros).toBe(stockAntes - 150);
  });

  it('Caso C: No permite cargar más litros que stock disponible cuando política no permite negativo', async () => {
    // Tanque Cantera tiene 3200 L
    await expect(
      fuelService.registerSupply({
        equipoId: 'eq-car-01',
        tipoCombustibleId: 'fuel-diesel-500',
        origenAbastecimiento: 'TANQUE_INTERNO',
        tanqueId: 'tq-pl2-cantera-02',
        litros: 4000, // Supera stock disponible
        horometroHs: 5620
      })
    ).rejects.toThrow(/Stock insuficiente en tanque/);
  });

  it('Caso D: Abastecimiento externo no modifica el stock de tanques internos', async () => {
    const tankBefore = await tankRepository.getTankById('tq-pl1-diesel-01');
    const stockAntes = tankBefore?.stockActualLitros;

    const res = await fuelService.registerSupply({
      equipoId: 'eq-mix-14',
      empleadoId: 'emp-2',
      tipoCombustibleId: 'fuel-diesel-500',
      origenAbastecimiento: 'ESTACION_SERVICIO',
      estacionServicioNombre: 'Axion Energy Ruta 9',
      litros: 90,
      precioUnitario: 1250,
      odometroKm: 42300,
      numeroTicket: 'TKT-99124'
    });

    expect(res.supply.estado).toBe('CONFIRMADO');
    const tankAfter = await tankRepository.getTankById('tq-pl1-diesel-01');
    expect(tankAfter?.stockActualLitros).toBe(stockAntes);
  });

  it('Caso E: Odómetro válido se registra en Flota mediante fleetService', async () => {
    // MIX-12 odómetro actual = 68.500 km
    await fuelService.registerSupply({
      equipoId: 'eq-mix-12',
      tipoCombustibleId: 'fuel-diesel-500',
      origenAbastecimiento: 'TANQUE_INTERNO',
      tanqueId: 'tq-pl1-diesel-01',
      litros: 100,
      odometroKm: 68750
    });

    const eq = await equipmentRepository.getById('eq-mix-12');
    expect(eq?.odometroKmActual).toBe(68750);
  });

  it('Caso F: Odómetro regresivo rechaza el abastecimiento', async () => {
    // MIX-12 odómetro actual = 68.500 km
    await expect(
      fuelService.registerSupply({
        equipoId: 'eq-mix-12',
        tipoCombustibleId: 'fuel-diesel-500',
        origenAbastecimiento: 'TANQUE_INTERNO',
        tanqueId: 'tq-pl1-diesel-01',
        litros: 80,
        odometroKm: 65000 // Menor al actual
      })
    ).rejects.toThrow(/Lectura regresiva rechazada/);
  });

  it('Caso G: Horómetro regresivo rechaza el abastecimiento', async () => {
    // CAR-01 horómetro actual = 5.600 hs
    await expect(
      fuelService.registerSupply({
        equipoId: 'eq-car-01',
        tipoCombustibleId: 'fuel-diesel-500',
        origenAbastecimiento: 'TANQUE_INTERNO',
        tanqueId: 'tq-pl2-cantera-02',
        litros: 100,
        horometroHs: 5400 // Menor a 5600
      })
    ).rejects.toThrow(/Lectura regresiva rechazada/);
  });

  it('Caso H: Odómetro válido + horómetro regresivo inválido no produce mutación parcial en Flota ni Tanque', async () => {
    const tankBefore = await tankRepository.getTankById('tq-pl1-diesel-01');
    const stockAntes = tankBefore?.stockActualLitros;
    const eqBefore = await equipmentRepository.getById('eq-mix-12');
    const odoAntes = eqBefore?.odometroKmActual;
    const horoAntes = eqBefore?.horometroHsActual;

    await expect(
      fuelService.registerSupply({
        equipoId: 'eq-mix-12',
        tipoCombustibleId: 'fuel-diesel-500',
        origenAbastecimiento: 'TANQUE_INTERNO',
        tanqueId: 'tq-pl1-diesel-01',
        litros: 100,
        odometroKm: 68800, // Válido (> 68500)
        horometroHs: 2000 // Inválido regresivo (< 3400)
      })
    ).rejects.toThrow(/Lectura regresiva rechazada/);

    // Verificar que NADA mutó en Flota ni en el Tanque
    const eqAfter = await equipmentRepository.getById('eq-mix-12');
    expect(eqAfter?.odometroKmActual).toBe(odoAntes);
    expect(eqAfter?.horometroHsActual).toBe(horoAntes);

    const tankAfter = await tankRepository.getTankById('tq-pl1-diesel-01');
    expect(tankAfter?.stockActualLitros).toBe(stockAntes);
  });

  it('Caso I: IdempotencyKey duplicada no genera doble carga ni doble descuento de stock', async () => {
    const tankBefore = await tankRepository.getTankById('tq-pl1-diesel-01');
    const stockAntes = tankBefore?.stockActualLitros || 0;

    const res1 = await fuelService.registerSupply({
      equipoId: 'eq-mix-12',
      tipoCombustibleId: 'fuel-diesel-500',
      origenAbastecimiento: 'TANQUE_INTERNO',
      tanqueId: 'tq-pl1-diesel-01',
      litros: 100,
      odometroKm: 68700,
      eventId: 'EVT-FUEL-TEL-001'
    });

    expect(res1.isDuplicate).toBe(false);

    // Mismo evento enviado nuevamente
    const res2 = await fuelService.registerSupply({
      equipoId: 'eq-mix-12',
      tipoCombustibleId: 'fuel-diesel-500',
      origenAbastecimiento: 'TANQUE_INTERNO',
      tanqueId: 'tq-pl1-diesel-01',
      litros: 100,
      odometroKm: 68700,
      eventId: 'EVT-FUEL-TEL-001'
    });

    expect(res2.isDuplicate).toBe(true);
    expect(res2.supply.id).toBe(res1.supply.id);

    // Stock debe haberse descontado una sola vez
    const tankAfter = await tankRepository.getTankById('tq-pl1-diesel-01');
    expect(tankAfter?.stockActualLitros).toBe(stockAntes - 100);
  });

  it('Caso J: Anular carga interna genera movimiento inverso y restaura stock del tanque', async () => {
    const supplyRes = await fuelService.registerSupply({
      equipoId: 'eq-mix-12',
      tipoCombustibleId: 'fuel-diesel-500',
      origenAbastecimiento: 'TANQUE_INTERNO',
      tanqueId: 'tq-pl1-diesel-01',
      litros: 200,
      odometroKm: 68700
    });

    const tankDuring = await tankRepository.getTankById('tq-pl1-diesel-01');
    const stockDuring = tankDuring?.stockActualLitros || 0;

    // Anulación formal
    await fuelService.cancelSupply(supplyRes.supply.id, 'Error de carga en vale manual', 'usr-auditor');

    const tankRestored = await tankRepository.getTankById('tq-pl1-diesel-01');
    expect(tankRestored?.stockActualLitros).toBe(stockDuring + 200);

    const movs = await tankRepository.getTankMovements('tq-pl1-diesel-01');
    const revMov = movs[movs.length - 1];
    expect(revMov.origenModulo).toBe('ANULACION_ABASTECIMIENTO');
    expect(revMov.litros).toBe(200);
  });

  it('Caso K: Carga anulada permanece en historial con estado ANULADO y datos de trazabilidad', async () => {
    const supplyRes = await fuelService.registerSupply({
      equipoId: 'eq-mix-14',
      tipoCombustibleId: 'fuel-diesel-500',
      origenAbastecimiento: 'ESTACION_SERVICIO',
      litros: 50,
      precioUnitario: 1200,
      odometroKm: 42350
    });

    await fuelService.cancelSupply(supplyRes.supply.id, 'Ticket duplicado', 'usr-encargado');

    const saved = await fuelRepository.getSupplyById(supplyRes.supply.id);
    expect(saved?.estado).toBe('ANULADO');
    expect(saved?.usuarioAnulacion).toBe('usr-encargado');
    expect(saved?.motivoAnulacion).toBe('Ticket duplicado');
    expect(saved?.fechaAnulacion).toBeDefined();
  });

  it('Caso L: Snapshot de precio histórico no cambia al actualizar catálogo general', async () => {
    // abs-001 seed tiene precioUnitarioSnapshot: 1150 y costoTotalSnapshot: 138000
    const histSupply = await fuelRepository.getSupplyById('abs-001');
    const precioHistorico = histSupply?.precioUnitarioSnapshot;
    const costoHistorico = histSupply?.costoTotalSnapshot;

    // Supongamos que el precio en catálogo sube a $1.800
    const fuelType = await tankRepository.getFuelTypeById('fuel-diesel-500');
    if (fuelType) fuelType.precioReferencia = 1800;

    const histSupplyConsultado = await fuelRepository.getSupplyById('abs-001');
    expect(histSupplyConsultado?.precioUnitarioSnapshot).toBe(precioHistorico);
    expect(histSupplyConsultado?.costoTotalSnapshot).toBe(costoHistorico);
  });

  it('Caso M: Vehículo calcula L/100km correctamente a partir del odómetro anterior', async () => {
    // MIX-12: última carga en seed fue a los 68.500 km.
    // Cargamos a los 68.900 km (400 km recorridos) con 140 L.
    // Consumo esperado = (140 / 400) * 100 = 35.0 L/100km
    const res = await fuelService.registerSupply({
      equipoId: 'eq-mix-12',
      tipoCombustibleId: 'fuel-diesel-500',
      origenAbastecimiento: 'TANQUE_INTERNO',
      tanqueId: 'tq-pl1-diesel-01',
      litros: 140,
      odometroKm: 68900
    });

    expect(res.supply.kmRecorridosEstimados).toBe(400);
    expect(res.supply.metricaRendimiento).toBe('L_100KM');
    expect(res.supply.rendimientoCalculado).toBe(35.0);
    expect(res.supply.nivelDesvio).toBe('NORMAL');
  });

  it('Caso N: Maquinaria calcula L/h correctamente a partir del horómetro anterior', async () => {
    // CAR-01: última carga en seed fue a las 5.600 hs.
    // Cargamos a las 5.610 hs (10 hs trabajadas) con 140 L.
    // Consumo esperado = 140 / 10 = 14.0 L/h
    const res = await fuelService.registerSupply({
      equipoId: 'eq-car-01',
      tipoCombustibleId: 'fuel-diesel-500',
      origenAbastecimiento: 'TANQUE_INTERNO',
      tanqueId: 'tq-pl2-cantera-02',
      litros: 140,
      horometroHs: 5610
    });

    expect(res.supply.horasTrabajadasEstimadas).toBe(10);
    expect(res.supply.metricaRendimiento).toBe('L_HORA');
    expect(res.supply.rendimientoCalculado).toBe(14.0);
    expect(res.supply.nivelDesvio).toBe('NORMAL');
  });

  it('Caso O: Parámetro vigente se selecciona por fecha del abastecimiento', async () => {
    // Creamos un parámetro para 2027 con objetivo más exigente
    await fuelPerformanceRepository.saveParameter({
      id: 'param-mix-2027',
      empresaId: 'emp-1',
      tipoEquipo: 'MIXER',
      metrica: 'L_100KM',
      valorObjetivo: 30.0,
      toleranciaAdvertenciaPct: 10.0,
      toleranciaCriticaPct: 20.0,
      vigenciaDesde: '2027-01-01',
      activo: true
    });

    // Consulta en 2026 -> debe traer objetivo 35
    const param2026 = await fuelPerformanceRepository.getParameters('emp-1', undefined, 'MIXER', '2026-09-30');
    expect(param2026?.valorObjetivo).toBe(35.0);

    // Consulta en 2027 -> debe traer objetivo 30
    const param2027 = await fuelPerformanceRepository.getParameters('emp-1', undefined, 'MIXER', '2027-02-15');
    expect(param2027?.valorObjetivo).toBe(30.0);
  });

  it('Caso P: Desvío NORMAL cuando el consumo está dentro de la tolerancia', async () => {
    // Objetivo 35 L/100km, tolerancia 15% (hasta 40.25 L/100km es NORMAL)
    // 100 km recorridos con 36 L = 36 L/100km -> NORMAL
    const evalRes = await fuelPerformanceService.evaluateSupplyPerformance(
      'eq-mix-12',
      36,
      '2026-09-30',
      68600,
      68500
    );

    expect(evalRes.nivelDesvio).toBe('NORMAL');
    expect(evalRes.rendimientoCalculado).toBe(36);
  });

  it('Caso Q: Desvío ADVERTENCIA cuando supera tolerancia advertencia pero no crítica', async () => {
    // Objetivo 35 L/100km. +15% advertencia (40.25 L), +25% crítica (43.75 L).
    // 100 km recorridos con 42 L = 42 L/100km -> ADVERTENCIA (+20% sobre 35)
    const evalRes = await fuelPerformanceService.evaluateSupplyPerformance(
      'eq-mix-12',
      42,
      '2026-09-30',
      68600,
      68500
    );

    expect(evalRes.nivelDesvio).toBe('ADVERTENCIA');
    expect(evalRes.rendimientoCalculado).toBe(42);
  });

  it('Caso R: Desvío CRITICO genera alerta cuando supera la tolerancia crítica', async () => {
    // Objetivo 35 L/100km. 100 km recorridos con 50 L = 50 L/100km (+42.8% sobre objetivo) -> CRITICO
    const res = await fuelService.registerSupply({
      equipoId: 'eq-mix-12',
      tipoCombustibleId: 'fuel-diesel-500',
      origenAbastecimiento: 'TANQUE_INTERNO',
      tanqueId: 'tq-pl1-diesel-01',
      litros: 50,
      odometroKm: 68600 // 100 km recorridos
    });

    expect(res.supply.nivelDesvio).toBe('CRITICO');

    const alerts = await fuelPerformanceRepository.getAlerts('emp-1', false);
    const alertCritica = alerts.find(a => a.tipo === 'CONSUMO_CRITICO' && a.equipoId === 'eq-mix-12');
    expect(alertCritica).toBeDefined();
  });

  it('Caso S: Medición física de tanque no modifica el stock silenciosamente', async () => {
    const tankBefore = await tankRepository.getTankById('tq-pl1-diesel-01');
    const stockAntes = tankBefore?.stockActualLitros || 8500;

    // Medición con varilla da 8.420 L (-80 L respecto al sistema)
    const med = await tankService.registerMeasurement({
      tanqueId: 'tq-pl1-diesel-01',
      litrosMedidos: 8420,
      metodo: 'VARILLA',
      usuarioId: 'usr-playa',
      observaciones: 'Varillado de fin de turno'
    });

    expect(med.diferenciaLitros).toBe(-80);

    // El stock del tanque NO debe haber cambiado silenciosamente
    const tankAfter = await tankRepository.getTankById('tq-pl1-diesel-01');
    expect(tankAfter?.stockActualLitros).toBe(stockAntes);
  });

  it('Caso T: Ajuste de inventario genera movimiento de ajuste y queda auditado', async () => {
    const tankBefore = await tankRepository.getTankById('tq-pl1-diesel-01');
    const stockAntes = tankBefore?.stockActualLitros || 8500;

    const adj = await tankService.registerAdjustment({
      tanqueId: 'tq-pl1-diesel-01',
      stockMedido: 8420,
      motivo: 'Ajuste mensual por merma y calibración de aforo',
      usuarioId: 'usr-gerente'
    });

    expect(adj.diferenciaLitros).toBe(-80);
    expect(adj.tipoAjuste).toBe('NEGATIVO');

    const tankAfter = await tankRepository.getTankById('tq-pl1-diesel-01');
    expect(tankAfter?.stockActualLitros).toBe(8420);

    const logs = await auditRepository.getLogs('comb_tanques');
    const logAdj = logs.find(l => l.accion === 'AJUSTE_INVENTARIO_TANQUE');
    expect(logAdj).toBeDefined();
  });

  it('Caso U: Tanque bajo mínimo operativo genera alerta en el sistema', async () => {
    // Tanque Cantera tiene stockMinimo = 1500 L.
    // Reducimos stock mediante ajuste a 1200 L.
    await tankService.registerAdjustment({
      tanqueId: 'tq-pl2-cantera-02',
      stockMedido: 1200,
      motivo: 'Consumo no registrado previo a reconciliación',
      usuarioId: 'usr-admin'
    });

    await tankService.checkTankAlerts('tq-pl2-cantera-02');

    const alerts = await fuelPerformanceRepository.getAlerts('emp-1', false);
    const minAlert = alerts.find(a => a.tipo === 'TANQUE_BAJO_MINIMO' && a.tanqueId === 'tq-pl2-cantera-02');
    expect(minAlert).toBeDefined();
  });

  it('Caso V: Equipo en estado BAJA rechaza el abastecimiento', async () => {
    // Dar de baja equipo eq-mix-14
    const mix = await equipmentRepository.getById('eq-mix-14');
    if (mix) mix.estadoAdministrativo = 'BAJA_DEFINITIVA';

    await expect(
      fuelService.registerSupply({
        equipoId: 'eq-mix-14',
        tipoCombustibleId: 'fuel-diesel-500',
        origenAbastecimiento: 'TANQUE_INTERNO',
        tanqueId: 'tq-pl1-diesel-01',
        litros: 100,
        odometroKm: 43000
      })
    ).rejects.toThrow(/se encuentra dado de BAJA/);
  });

  it('Caso W: Tipo de combustible incompatible con el tanque rechaza la operación', async () => {
    // Tanque es fuel-diesel-500. Intentar cargar fuel-nafta-sup desde este tanque.
    await expect(
      fuelService.registerSupply({
        equipoId: 'eq-mix-12',
        tipoCombustibleId: 'fuel-nafta-sup',
        origenAbastecimiento: 'TANQUE_INTERNO',
        tanqueId: 'tq-pl1-diesel-01',
        litros: 50
      })
    ).rejects.toThrow(/Incompatibilidad de combustible/);
  });

  it('Caso X: Evento procesado duplicado se detecta sin generar doble carga ni movimientos', async () => {
    const evId = 'EVT-TEST-IDEMPOTENCY-999';
    const res1 = await fuelService.registerSupply({
      equipoId: 'eq-mix-12',
      tipoCombustibleId: 'fuel-diesel-500',
      origenAbastecimiento: 'TANQUE_INTERNO',
      tanqueId: 'tq-pl1-diesel-01',
      litros: 80,
      odometroKm: 68650,
      eventId: evId
    });
    expect(res1.isDuplicate).toBe(false);

    const res2 = await fuelService.registerSupply({
      equipoId: 'eq-mix-12',
      tipoCombustibleId: 'fuel-diesel-500',
      origenAbastecimiento: 'TANQUE_INTERNO',
      tanqueId: 'tq-pl1-diesel-01',
      litros: 80,
      odometroKm: 68650,
      eventId: evId
    });
    expect(res2.isDuplicate).toBe(true);
    expect(res2.supply.id).toBe(res1.supply.id);
  });
});
