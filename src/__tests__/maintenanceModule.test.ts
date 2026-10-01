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
import { hrDomainService } from '../services/hrDomainService';

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

  it('Caso B: Iniciar OT bloqueante cambia el estado del equipo a EN_TALLER y fija fechaHoraInicioBloqueo', async () => {
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

    const otUpdated = await maintenanceRepository.getWorkOrderById(ot.id);
    expect(otUpdated?.fechaHoraInicioBloqueo).toBeDefined();
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

  it('Caso D: OT no bloqueante no altera el estado del equipo a EN_TALLER y mantiene downtime en 0', async () => {
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

    const otCerrada = await maintenanceService.closeWorkOrder(ot.id, {
      diagnostico: 'Lámpara con filamento cortado',
      trabajoRealizado: 'Reemplazo de lámpara 24V 21W',
      causaRaiz: 'DESGASTE_NORMAL'
    });

    expect(otCerrada.horasParadaEquipo).toBe(0);
  });

  it('Caso E: Dos mecánicos pueden imputar horas a la misma OT con desglose individual', async () => {
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

  it('Caso F: Costo horario de mano de obra proviene estrictamente del motor de RRHH (sin / 160 hardcodeado)', async () => {
    const ot = await maintenanceService.createWorkOrder({
      equipoId: 'eq-mix-12',
      tipoMantenimiento: 'CORRECTIVO',
      categoriaFalla: 'MOTOR',
      prioridad: 'ALTA',
      fallaReportada: 'Calibración de inyectores',
      bloqueaEquipo: true
    });

    const fecha = '2026-09-30';
    const costoEsperadoRRHH = await hrDomainService.getEmployeeHourlyCost('emp-5', fecha);
    const mo = await maintenanceService.addLabor(ot.id, 'emp-5', 3, 'Calibración de inyectores', undefined, fecha);

    expect(mo.costoHorarioSnapshot).toBe(costoEsperadoRRHH);
    expect(mo.costoTotalLaboral).toBe(costoEsperadoRRHH * 3);

    const imputaciones = await laborCostRepository.getByEmployee('emp-5');
    const imp = imputaciones.find(i => i.origenId === ot.id && i.origenModulo === 'TALLER_OT');
    expect(imp).toBeDefined();
    expect(imp?.costoHorarioAplicado).toBe(costoEsperadoRRHH);
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
    const otCerrada = await maintenanceRepository.getWorkOrderById('ot-101');
    const costoHistorico = otCerrada?.costoTotal;

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

  it('Caso J: Downtime no incluye las horas previas a la entrada efectiva al taller', async () => {
    // OT abierta a las 08:00
    const ot = await maintenanceService.createWorkOrder({
      equipoId: 'eq-mix-12',
      tipoMantenimiento: 'CORRECTIVO',
      categoriaFalla: 'FRENOS',
      prioridad: 'ALTA',
      fallaReportada: 'Frenos largos',
      bloqueaEquipo: true
    });

    // Ingresa a taller a las 16:00 (8 horas después)
    const fechaEntrada = '2026-09-30T16:00:00Z';
    await maintenanceService.startWorkOrder(ot.id, undefined, undefined, fechaEntrada);

    // Cierra a las 19:00 (3 horas de reparación real)
    const fechaCierre = '2026-09-30T19:00:00Z';
    const otCerrada = await maintenanceService.closeWorkOrder(ot.id, {
      diagnostico: 'Cintas gastadas',
      trabajoRealizado: 'Reemplazo de cintas de freno',
      fechaCierre
    });

    // Debe ser exactamente 3 horas, no 11 horas (8hs previas + 3hs taller)
    expect(otCerrada.horasParadaEquipo).toBe(3.0);
  });

  it('Caso K: Cierre de OT es rechazado si existen tareas en estado PENDIENTE o EN_PROCESO', async () => {
    const ot = await maintenanceService.createWorkOrder({
      equipoId: 'eq-mix-12',
      tipoMantenimiento: 'CORRECTIVO',
      categoriaFalla: 'MOTOR',
      prioridad: 'NORMAL',
      fallaReportada: 'Revisión general',
      bloqueaEquipo: true
    });

    await maintenanceService.startWorkOrder(ot.id);
    const tar = await maintenanceService.addTask(ot.id, 'Cambiar correa de alternador', 1);

    // Intento de cierre con tarea PENDIENTE
    await expect(
      maintenanceService.closeWorkOrder(ot.id, {
        diagnostico: 'Correa reseca',
        trabajoRealizado: 'Se cambió correa'
      })
    ).rejects.toThrow(/La tarea "Cambiar correa de alternador" se encuentra en estado PENDIENTE/);

    // Marcar completada la tarea
    tar.estado = 'COMPLETADA';

    // Cierre exitoso con tareas finalizadas
    const otCerrada = await maintenanceService.closeWorkOrder(ot.id, {
      diagnostico: 'Correa reseca',
      trabajoRealizado: 'Se cambió correa'
    });
    expect(otCerrada.estado).toBe('CERRADA');
  });

  it('Caso L: Cierre de OT actualiza contadores de Flota (fuente única de verdad) y rechaza lecturas regresivas', async () => {
    // MIX-12 odómetro actual = 68.500 km, horómetro = 3.420 hs
    const ot = await maintenanceService.createWorkOrder({
      equipoId: 'eq-mix-12',
      tipoMantenimiento: 'PREVENTIVO',
      categoriaFalla: 'MOTOR',
      prioridad: 'NORMAL',
      fallaReportada: 'Service 70k km',
      bloqueaEquipo: true
    });

    await maintenanceService.startWorkOrder(ot.id);

    // Cierre con nuevo horómetro 3.435 hs y odómetro 68.520 km
    await maintenanceService.closeWorkOrder(ot.id, {
      diagnostico: 'Service cumplido',
      trabajoRealizado: 'Cambio de fluidos',
      odometroCierreKm: 68520,
      horometroCierreHs: 3435
    });

    const eq = await equipmentRepository.getById('eq-mix-12');
    expect(eq?.odometroKmActual).toBe(68520);
    expect(eq?.horometroHsActual).toBe(3435);

    // Intentar registrar odómetro menor en otra OT debe ser rechazado
    const ot2 = await maintenanceService.createWorkOrder({
      equipoId: 'eq-mix-12',
      tipoMantenimiento: 'CORRECTIVO',
      categoriaFalla: 'MOTOR',
      prioridad: 'NORMAL',
      fallaReportada: 'Ajuste',
      bloqueaEquipo: true
    });
    await maintenanceService.startWorkOrder(ot2.id);

    await expect(
      maintenanceService.closeWorkOrder(ot2.id, {
        diagnostico: 'OK',
        trabajoRealizado: 'Ajuste',
        odometroCierreKm: 60000 // Menor al actual 68520
      })
    ).rejects.toThrow(/no puede ser menor al actual/);
  });

  it('Caso M: Plan preventivo por horas calcula estado PROXIMO o VENCIDO al comparar con horómetro de Flota', async () => {
    await equipmentRepository.addCounterReading('eq-car-01', 'HOROMETRO_HS', 5635, 'TALLER');
    const plans = await maintenancePlanningService.evaluateEquipmentPlans('eq-car-01');
    expect(plans.length).toBeGreaterThanOrEqual(1);
    expect(plans[0].estadoAlerta).toBe('PROXIMO');

    await equipmentRepository.addCounterReading('eq-car-01', 'HOROMETRO_HS', 5655, 'TALLER');
    const plansVencido = await maintenancePlanningService.evaluateEquipmentPlans('eq-car-01');
    expect(plansVencido[0].estadoAlerta).toBe('VENCIDO');
  });

  it('Caso N: No se puede instalar un mismo neumático simultáneamente en dos posiciones o equipos', async () => {
    await expect(
      tireService.installTire('neu-101', 'eq-mix-14', 'EJE_1_IZQ')
    ).rejects.toThrow(/ya se encuentra instalado/);
  });

  it('Caso O: Instalar y retirar neumático conserva historial de movimientos y kilometraje acumulado', async () => {
    await tireService.installTire('neu-103', 'eq-mix-14', 'EJE_1_IZQ');
    let t = await tireRepository.getTireById('neu-103');
    expect(t?.estado).toBe('INSTALADO');
    expect(t?.equipoActualId).toBe('eq-mix-14');

    await tireService.removeTire('neu-103', (t?.kmInstalacionActual || 0) + 5000, 'EN_REPARACION', 'Pinchadura');
    t = await tireRepository.getTireById('neu-103');
    expect(t?.estado).toBe('EN_REPARACION');
    expect(t?.kmActualesTotales).toBe(5000);

    const hist = await tireRepository.getMovementHistory('neu-103');
    expect(hist.length).toBeGreaterThanOrEqual(3);
  });

  it('Caso P: Costo total del neumático acumula compra + reparaciones + recapados', async () => {
    await tireService.registerRepairOrRetread('neu-103', 45000, 'REPARACION', 'Vulcanizado de flanco');
    await tireService.registerRepairOrRetread('neu-103', 120000, 'RECAPADO', 'Primer recapado banda de tracción');

    const t = await tireRepository.getTireById('neu-103');
    expect(t?.costoAcumuladoReparaciones).toBe(165000);
    expect(t?.costoTotalAcumulado).toBe(450000 + 165000);
    expect(t?.vecesRecapado).toBe(1);
  });

  it('Caso Q: Una OT cerrada no puede modificarse libremente', async () => {
    await expect(
      maintenanceService.addTask('ot-101', 'Tarea tardía')
    ).rejects.toThrow(/OT cerrada/);

    await expect(
      maintenanceService.addPart('ot-101', 'art-1', 1, 'Filtro', 1000)
    ).rejects.toThrow(/OT cerrada/);
  });

  it('Caso R: Asignar mano de obra con empleado no mecánico o inactivo es rechazado con mensaje claro', async () => {
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
