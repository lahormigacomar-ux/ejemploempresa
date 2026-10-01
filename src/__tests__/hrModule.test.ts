import { describe, it, expect, beforeEach } from 'vitest';
import { employeeRepository } from '../repositories/employeeRepository';
import { attendanceRepository } from '../repositories/attendanceRepository';
import { payrollRepository } from '../repositories/payrollRepository';
import { hrDomainService } from '../services/hrDomainService';
import { hrAvailabilityService } from '../services/hrAvailabilityService';
import { hrEventHandler } from '../services/hrEventHandler';
import { FichadaAsistencia } from '../types';

describe('MÓDULO 1 — PERSONAL / RRHH / ASISTENCIA / SUELDOS (SUITE DE INTEGRACIÓN)', () => {
  it('Caso A: Licencia de conducir vencida bloquea asignación operativa de chofer', async () => {
    // emp-2 tiene licencia vencida al 2026-08-15
    const result = await hrAvailabilityService.canAssignEmployee('emp-2', '2026-09-30T08:00:00', 'mixer');
    expect(result.disponible).toBe(false);
    expect(result.bloqueante).toBe(true);
    expect(result.codigoMotivo).toBe('LICENCIA_CONDUCIR_VENCIDA');
  });

  it('Caso B: Empleado con vacaciones aprobadas figura como NO disponible', async () => {
    // emp-3 tiene vacaciones aprobadas del 15 al 25 de Octubre 2026
    const result = await hrAvailabilityService.canAssignEmployee('emp-3', '2026-10-18T08:00:00', 'cargadora');
    expect(result.disponible).toBe(false);
    expect(result.bloqueante).toBe(true);
    expect(result.codigoMotivo).toBe('NOVEDAD_ACTIVA');
  });

  it('Caso C: Viaje completado genera imputación de costo laboral al centro de transporte', async () => {
    const res = await hrEventHandler.onViajeCompletado('viaje-test-101', 'emp-1', 3.0, 'MIX-12', '2026-09-30');
    expect(res.processed).toBe(true);
    expect(res.isDuplicate).toBe(false);
    expect(res.imputacion.centroCostoId).toBe('cc-transporte');
    expect(res.imputacion.horasImputadas).toBe(3.0);
    expect(res.imputacion.costoTotalImputado).toBeGreaterThan(0);
  });

  it('Caso D: Mecánico en OT imputa costo laboral a Taller y al equipo intervenido', async () => {
    const res = await hrEventHandler.onOrdenTrabajoFinalizada('ot-test-77', 'emp-5', 4.5, 'MIX-12', '2026-09-30');
    expect(res.processed).toBe(true);
    expect(res.imputacion.centroCostoId).toBe('cc-taller');
    expect(res.imputacion.equipoId).toBe('MIX-12');
    expect(res.imputacion.horasImputadas).toBe(4.5);
  });

  it('Caso E: Maquinista en Cantera imputa horas al centro de costo Áridos', async () => {
    const res = await hrEventHandler.onHorasMaquinaRegistradas('maq-test-22', 'emp-3', 6.0, 'CAR-01', '2026-09-30');
    expect(res.processed).toBe(true);
    expect(res.imputacion.centroCostoId).toBe('cc-aridos');
    expect(res.imputacion.equipoId).toBe('CAR-01');
    expect(res.imputacion.horasImputadas).toBe(6.0);
  });

  it('Caso F: Adelanto pagado se descuenta exactamente una vez en la liquidación', async () => {
    const liq = await hrDomainService.liquidarEmpleadoPeriodo('emp-1', '2026-09', 'MENSUAL', 'test_user');
    const detalleAdelanto = liq.detalles.find(d => d.conceptoCodigo === '4001');
    expect(detalleAdelanto).toBeDefined();
    expect(detalleAdelanto?.descuentos).toBe(150000);
  });

  it('Caso G: Liquidación cerrada conserva su snapshot inmutable ante aumentos salariales futuros', async () => {
    const liq = await hrDomainService.liquidarEmpleadoPeriodo('emp-1', '2026-09', 'MENSUAL', 'admin');
    const sueldoSeptiembre = liq.sueldoBasico;
    await payrollRepository.closeLiquidacionWithSnapshot('2026-09', 'MENSUAL', 'emp-1', 'supervisor_cierre');

    // Aumento salarial paritario en Octubre
    await employeeRepository.updateSalaryAndCategory('emp-1', 2100000, 'Oficial Conductor Superior', '2026-10-01', 'Paritaria');

    // Consultar liquidación de Septiembre cerrada
    const liqCerrada = await payrollRepository.getLiquidacion('2026-09', 'MENSUAL', 'emp-1');
    expect(liqCerrada?.estado).toBe('CERRADA');
    const snapshot = JSON.parse(liqCerrada?.snapshotJson || '{}');
    expect(snapshot.sueldoBasico).toBe(sueldoSeptiembre);
    expect(snapshot.sueldoBasico).not.toBe(2100000);
  });

  it('Caso H: Consulta de Logística garantiza privacidad salarial', async () => {
    const disponibilidad = await hrAvailabilityService.canAssignEmployee('emp-1', '2026-10-01T08:00:00', 'mixer');
    expect(disponible(disponibilidad)).toBe(true);
    expect('sueldoBasico' in disponibilidad).toBe(false);
    expect('cbuAlias' in disponibilidad).toBe(false);
    expect('descuentos' in disponibilidad).toBe(false);
  });

  it('Caso I: Idempotencia garantizada - evento procesado dos veces NO duplica costo', async () => {
    const res1 = await hrEventHandler.onViajeCompletado('viaje-idem-999', 'emp-1', 2.0, 'MIX-12', '2026-09-30');
    expect(res1.processed).toBe(true);
    expect(res1.isDuplicate).toBe(false);

    // Reprocesar exactamente el mismo evento
    const res2 = await hrEventHandler.onViajeCompletado('viaje-idem-999', 'emp-1', 2.0, 'MIX-12', '2026-09-30');
    expect(res2.processed).toBe(false);
    expect(res2.isDuplicate).toBe(true);
  });

  it('Caso J: Turno nocturno cruzando medianoche calcula correctamente 8 horas', async () => {
    const turnos = await attendanceRepository.getTurnos();
    const turnoNoche = turnos.find(t => t.cruzaMedianoche);
    const fichadasNoche: FichadaAsistencia[] = [
      { id: 'fn-1', empleadoId: 'emp-1', fecha: '2026-09-30', hora: '22:00', tipo: 'ENTRADA', origen: 'RELOJ_BIOMETRICO' },
      { id: 'fn-2', empleadoId: 'emp-1', fecha: '2026-09-30', hora: '06:00', tipo: 'SALIDA', origen: 'RELOJ_BIOMETRICO' }
    ];
    const { jornada } = hrDomainService.calcularJornadaDesdeFichadas('emp-1', '2026-09-30', fichadasNoche, turnoNoche);
    expect(jornada.horasPresencia).toBe(8.0);
    expect(jornada.horasNormales).toBe(8.0);
    expect(jornada.horasExtra50).toBe(0);
  });

  it('Caso K: Descanso intermedio se descuenta correctamente del tiempo de presencia', async () => {
    const fichadasConDescanso: FichadaAsistencia[] = [
      { id: 'fd-1', empleadoId: 'emp-1', fecha: '2026-09-30', hora: '08:00', tipo: 'ENTRADA', origen: 'RELOJ_BIOMETRICO' },
      { id: 'fd-2', empleadoId: 'emp-1', fecha: '2026-09-30', hora: '12:00', tipo: 'INICIO_DESCANSO', origen: 'RELOJ_BIOMETRICO' },
      { id: 'fd-3', empleadoId: 'emp-1', fecha: '2026-09-30', hora: '12:30', tipo: 'FIN_DESCANSO', origen: 'RELOJ_BIOMETRICO' },
      { id: 'fd-4', empleadoId: 'emp-1', fecha: '2026-09-30', hora: '17:00', tipo: 'SALIDA', origen: 'RELOJ_BIOMETRICO' }
    ];
    const { jornada } = hrDomainService.calcularJornadaDesdeFichadas('emp-1', '2026-09-30', fichadasConDescanso);
    expect(jornada.horasPresencia).toBe(9.0);
    expect(jornada.horasDescanso).toBe(0.5); // 30 min
    expect(jornada.horasNormales).toBe(8.0);
    expect(jornada.horasExtra50).toBe(0.5); // 8.5 hs trabajadas efectivas
  });

  it('Caso L: Hora extra rechazada no ingresa a la liquidación mensual', async () => {
    await attendanceRepository.addHoraExtra({
      id: 'he-rechazada-unit-test',
      empleadoId: 'emp-5',
      fecha: '2026-09-25',
      horas: 5.0,
      tipo: 'EXTRA_50',
      estado: 'RECHAZADA',
      responsableAprobacion: 'supervisor_guardia',
      motivoRechazo: 'No autorizada'
    });
    const liq = await hrDomainService.liquidarEmpleadoPeriodo('emp-5', '2026-09', 'MENSUAL', 'admin');
    const extraRenglon = liq.detalles.find(d => d.conceptoCodigo === '1020');
    expect(extraRenglon).toBeUndefined();
  });
});

function disponible(res: { disponible: boolean }) {
  return res.disponible;
}
