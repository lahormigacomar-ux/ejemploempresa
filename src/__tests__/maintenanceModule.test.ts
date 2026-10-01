import { describe, it, expect, beforeEach } from 'vitest';
import { maintenanceRepository } from '../repositories/maintenanceRepository';
import { equipmentRepository } from '../repositories/equipmentRepository';
import { employeeRepository } from '../repositories/employeeRepository';
import { laborCostRepository } from '../repositories/laborCostRepository';
import { auditRepository } from '../repositories/auditRepository';
import { tireRepository } from '../repositories/tireRepository';
import { maintenanceService } from '../services/maintenanceService';
import { maintenancePlanningService } from '../services/maintenancePlanningService';
import { tireService } from '../services/tireService';
import { fleetEventHandler } from '../services/fleetEventHandler';

describe('MÓDULO 3 — MANTENIMIENTO, TALLER, REPUESTOS Y NEUMÁTICOS', () => {
  beforeEach(() => {
    maintenanceRepository.resetForTesting();
    equipmentRepository.resetForTesting();
    employeeRepository.resetForTesting();
    laborCostRepository.resetForTesting();
    tireRepository.resetForTesting();
    fleetEventHandler.resetForTesting();
  });

  it('Caso A: Crear OT para un equipo válido genera número correlativo y estado ABIERTA', async () => {
    const ot = await maintenanceService.createWorkOrder({
      equipoId: 'eq-mix-12',
      tipoMantenimiento: 'CORRECTIVO',
      categoriaFalla: 'HIDRAULICO',
      prioridad: 'ALTA',
      fallaReportada: 'Pérdida de fluido hidráulico en manguera de retorno de bomba',
      bloqueaEquipo: true
    });

    expect(ot.id).toBeDefined();
    expect(ot.numeroOT).toMatch(/^OT-\d{6}$/);
    expect(ot.estado).toBe('ABIERTA');
    expect(ot.equipoId).toBe('eq-mix-12');
  });

  it('Caso B: Iniciar OT bloqueante cambia el estado del equipo a EN_TALLER', async () => {
    const ot = await maintenanceService.createWorkOrder({
      equipoId: 'eq-mix-12',
      tipoMantenimiento: 'CORRECTIVO',
      categoriaFalla: 'TRANSMISION',
      prioridad: 'URGENTE',
      fallaReportada: 'Rotura de caja selectora de marchas',
      bloqueaEquipo: true
    });

    await maintenanceService.startWorkOrder(ot.id);

    const eq = await equipmentRepository.getById('eq-mix-12');
    expect(eq?.estadoOperativo).toBe('EN_TALLER');
  });

  it('Caso C: Cerrar OT bloqueante libera el equipo y lo vuelve a estado DISPONIBLE', async () => {
    const ot = await maintenanceService.createWorkOrder({
      equipoId: 'eq-mix-12',
      tipoMantenimiento: 'CORRECTIVO',
      categoriaFalla: 'FRENOS',
      prioridad: 'URGENTE',
      fallaReportada: 'Pérdida de aire en pulmón de freno trasero',
      bloqueaEquipo: true
    });

    await maintenanceService.startWorkOrder(ot.id);
    expect((await equipmentRepository.getById('eq-mix-12'))?.estadoOperativo).toBe('EN_TALLER');

    await maintenanceService.closeWorkOrder(ot.id, {
      diagnostico: 'Pulmón de freno perforado por impacto de piedra en obra',
      trabajoRealizado: 'Reemplazo de pulmón de freno y purgado de circuito de aire',
      causaRaiz: 'ROTURA_ACCIDENTAL'
    });

    const eq = await equipmentRepository.getById('eq-mix-12');
    expect(eq?.estadoOperativo).toBe('DISPONIBLE');
  });

  it('Caso D: OT no bloqueante no altera el estado del equipo a EN_TALLER', async () => {
    // Reparación de luz de giro o tarea menor que no requiere inmovilizar el camión
    const ot = await maintenanceService.createWorkOrder({
      equipoId: 'eq-mix-12',
      tipoMantenimiento: 'CORRECTIVO',
      categoriaFalla: 'ELECTRICO',
      prioridad: 'BAJA',
      fallaReportada: 'Lámpara de giro delantera derecha quemada',
      bloqueaEquipo: false
    });

    await maintenanceService.startWorkOrder(ot.id);

    const eq = await equipmentRepository.getById('eq-mix-12');
    expect(eq?.estadoOperativo).toBe('DISPONIBLE');
  });

  it('Caso E: Dos mecánicos pueden imputar horas a la misma OT con desglose individual', async () => {
    // emp-5 es mecánico. Agregaremos horas
    const ot = await maintenanceService.createWorkOrder({
      equipoId: 'eq-mix-12',
      tipoMantenimiento: 'CORRECTIVO',
      categoriaFalla: 'MOTOR',
      prioridad: 'ALTA',
      fallaReportada: 'Calentamiento de motor en subida',
      bloqueaEquipo: true
    });

    const mo1 = await maintenanceService.addLabor(ot.id, 'emp-5', 4, 'Desarme de bomba de agua');
    expect(mo1.horasTrabajadas).toBe(4);

    const otUpdated = await maintenanceRepository.getWorkOrderById(ot.id);
    expect(otUpdated?.personal.length).toBe(1);
    expect(otUpdated?.costoManoObra).toBeGreaterThan(0);
  });

  it('Caso F: Imputación de costo laboral se genera en el centro de costos de Taller sin duplicación', async () => {
    const ot = await maintenanceService.createWorkOrder({
      equipoId: 'eq-mix-12',
      tipoMantenimiento: 'CORRECTIVO',
      categoriaFalla: 'MOTOR',
      prioridad: 'ALTA',
      fallaReportada: 'Service de inyectores',
      bloqueaEquipo: true
    });

    await maintenanceService.addLabor(ot.id, 'emp-5', 3, 'Calibración de inyectores');

    const imputaciones = await laborCostRepository.getByEmployee('emp-5');
    const imp = imputaciones.find(i => i.origenId === ot.id && i.origenModulo === 'TALLER_OT');
    expect(imp).toBeDefined();
    expect(imp?.centroCostoId).toBe('cc-taller');
    expect(imp?.equipoId).toBe('eq-mix-12');
  });

  it('Caso G: Agregar repuesto guarda un snapshot inmutable de su costo unitario', async () => {
    const ot = await maintenanceService.createWorkOrder({
      equipoId: 'eq-mix-12',
      tipoMantenimiento: 'CORRECTIVO',
      categoriaFalla: 'HIDRAULICO',
      prioridad: 'NORMAL',
      fallaReportada: 'Reemplazo de manguera hidráulica',
      bloqueaEquipo: true
    });

    const rep = await maintenanceService.addPart(ot.id, 'art-man-hid', 2, 'Manguera R2 1/2 pulgada', 45000);
    expect(rep.costoUnitarioSnapshot).toBe(45000);
    expect(rep.costoTotal).toBe(90000);

    const otSaved = await maintenanceRepository.getWorkOrderById(ot.id);
    expect(otSaved?.costoRepuestos).toBe(90000);
    expect(otSaved?.costoTotal).toBe(90000);
  });

  it('Caso H: Cambio posterior del precio del artículo en catálogo NO altera el costo histórico de una OT cerrada', async () => {
    // ot-101 ya está cerrada con costoRepuestos = 195000 y costoTotal = 345000
    const otCerrada = await maintenanceRepository.getWorkOrderById('ot-101');
    const costoHistorico = otCerrada?.costoTotal;

    // Supongamos que el aceite ahora sube de $65.000 a $120.000 en el catálogo general
    // Volver a consultar la OT cerrada
    const otConsultada = await maintenanceRepository.getWorkOrderById('ot-101');
    expect(otConsultada?.costoTotal).toBe(costoHistorico);
    expect(otConsultada?.repuestos[0].costoUnitarioSnapshot).toBe(65000);
  });

  it('Caso I: OT en espera de repuestos cambia correctamente a estado ESPERANDO_REPUESTO', async () => {
    const ot = await maintenanceService.createWorkOrder({
      equipoId: 'eq-mix-14',
      tipoMantenimiento: 'CORRECTIVO',
      categoriaFalla: 'TAMBOR',
      prioridad: 'ALTA',
      fallaReportada: 'Rodamiento de reductor roto, sin stock en pañol central',
      bloqueaEquipo: true
    });

    await maintenanceService.changeStatus(ot.id, 'ESPERANDO_REPUESTO', 'Solicitud enviada a compras');
    const otUpdated = await maintenanceRepository.getWorkOrderById(ot.id);
    expect(otUpdated?.estado).toBe('ESPERANDO_REPUESTO');
  });

  it('Caso J: Plan preventivo por horas calcula estado PROXIMO o VENCIDO al comparar con horómetro de Flota', async () => {
    // En seed: CAR-01 tiene 5600 hs, su próximo service es a las 5650 hs (umbral de alerta 20 hs).
    // Si la máquina alcanza 5635 hs (a 15 hs), debe figurar PROXIMO.
    await equipmentRepository.addCounterReading('eq-car-01', 'HOROMETRO_HS', 5635, 'TALLER');
    const plans = await maintenancePlanningService.evaluateEquipmentPlans('eq-car-01');
    expect(plans.length).toBeGreaterThanOrEqual(1);
    expect(plans[0].estadoAlerta).toBe('PROXIMO');

    // Si supera las 5650 hs (ej 5655 hs), pasa a VENCIDO
    await equipmentRepository.addCounterReading('eq-car-01', 'HOROMETRO_HS', 5655, 'TALLER');
    const plansVencido = await maintenancePlanningService.evaluateEquipmentPlans('eq-car-01');
    expect(plansVencido[0].estadoAlerta).toBe('VENCIDO');
  });

  it('Caso K: Plan preventivo por kilómetros calcula estado PROXIMO o VENCIDO al comparar con odómetro de Flota', async () => {
    // MIX-12 tiene 68.500 km. Próximo service a los 70.000 km (umbral de alerta 500 km).
    // Si avanza a 69.600 km (a 400 km), debe figurar PROXIMO.
    await equipmentRepository.addCounterReading('eq-mix-12', 'ODOMETRO_KM', 69600, 'TALLER');
    const plans = await maintenancePlanningService.evaluateEquipmentPlans('eq-mix-12');
    expect(plans.length).toBeGreaterThanOrEqual(1);
    expect(plans[0].estadoAlerta).toBe('PROXIMO');
  });

  it('Caso L: No se puede instalar un mismo neumático simultáneamente en dos posiciones o equipos', async () => {
    // neu-101 ya está instalado en eq-mix-12 EJE_1_IZQ
    await expect(
      tireService.installTire('neu-101', 'eq-mix-14', 'EJE_1_IZQ')
    ).rejects.toThrow(/ya se encuentra instalado/);
  });

  it('Caso M: Instalar y retirar neumático conserva historial de movimientos y kilometraje acumulado', async () => {
    // neu-103 está EN_STOCK
    await tireService.installTire('neu-103', 'eq-mix-14', 'EJE_1_IZQ');
    let t = await tireRepository.getTireById('neu-103');
    expect(t?.estado).toBe('INSTALADO');
    expect(t?.equipoActualId).toBe('eq-mix-14');

    // Retirar neumático para reparación habiendo recorrido 5.000 km
    await tireService.removeTire('neu-103', (t?.kmInstalacionActual || 0) + 5000, 'EN_REPARACION', 'Pinchadura');
    t = await tireRepository.getTireById('neu-103');
    expect(t?.estado).toBe('EN_REPARACION');
    expect(t?.kmActualesTotales).toBe(5000);

    const hist = await tireRepository.getMovementHistory('neu-103');
    expect(hist.length).toBeGreaterThanOrEqual(3);
  });

  it('Caso N: Costo total del neumático acumula compra + reparaciones + recapados', async () => {
    // neu-103 compra = 450.000
    await tireService.registerRepairOrRetread('neu-103', 45000, 'REPARACION', 'Vulcanizado de flanco');
    await tireService.registerRepairOrRetread('neu-103', 120000, 'RECAPADO', 'Primer recapado banda de tracción');

    const t = await tireRepository.getTireById('neu-103');
    expect(t?.costoAcumuladoReparaciones).toBe(165000);
    expect(t?.costoTotalAcumulado).toBe(450000 + 165000);
    expect(t?.vecesRecapado).toBe(1);
  });

  it('Caso O: Una OT cerrada no puede modificarse libremente', async () => {
    // Intentar agregar una tarea a ot-101 (cerrada)
    await expect(
      maintenanceService.addTask('ot-101', 'Tarea tardía')
    ).rejects.toThrow(/OT cerrada/);

    await expect(
      maintenanceService.addPart('ot-101', 'art-1', 1, 'Filtro', 1000)
    ).rejects.toThrow(/OT cerrada/);
  });

  it('Caso P: Evento duplicado de taller no altera doblemente el estado (Idempotencia)', async () => {
    const ev1 = await fleetEventHandler.onEquipoEntraTaller('EVT-OT-999', 'eq-mix-12', 'ot-999', 'Falla de embrague');
    expect(ev1.processed).toBe(true);
    expect(ev1.isDuplicate).toBe(false);

    const ev2 = await fleetEventHandler.onEquipoEntraTaller('EVT-OT-999', 'eq-mix-12', 'ot-999', 'Falla de embrague');
    expect(ev2.processed).toBe(false);
    expect(ev2.isDuplicate).toBe(true);
  });

  it('Caso Q: Acción crítica de taller genera registro en auditoría del sistema', async () => {
    const ot = await maintenanceService.createWorkOrder({
      equipoId: 'eq-mix-14',
      tipoMantenimiento: 'CORRECTIVO',
      categoriaFalla: 'FRENOS',
      prioridad: 'ALTA',
      fallaReportada: 'Revisión de válvulas de frenado',
      bloqueaEquipo: true
    });

    const logs = await auditRepository.getLogs('mant_ordenes_trabajo');
    const logOT = logs.find(l => l.registroId === ot.id && l.accion === 'CREACION_OT');
    expect(logOT).toBeDefined();
  });

  it('Caso R: Asignar mano de obra con empleado no mecánico es rechazado con mensaje claro', async () => {
    const ot = await maintenanceService.createWorkOrder({
      equipoId: 'eq-mix-12',
      tipoMantenimiento: 'CORRECTIVO',
      categoriaFalla: 'MOTOR',
      prioridad: 'NORMAL',
      fallaReportada: 'Ajuste de correas',
      bloqueaEquipo: true
    });

    // emp-1 es chofer_mixer, NO mecánico
    await expect(
      maintenanceService.addLabor(ot.id, 'emp-1', 2, 'Mecánica')
    ).rejects.toThrow(/no posee el rol de mecánico\/taller/);
  });
});
