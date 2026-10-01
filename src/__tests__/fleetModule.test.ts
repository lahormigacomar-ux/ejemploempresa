import { describe, it, expect, beforeEach } from 'vitest';
import { equipmentRepository } from '../repositories/equipmentRepository';
import { employeeRepository } from '../repositories/employeeRepository';
import { attendanceRepository } from '../repositories/attendanceRepository';
import { auditRepository } from '../repositories/auditRepository';
import { fleetAvailabilityService } from '../services/fleetAvailabilityService';
import { fleetService } from '../services/fleetService';
import { fleetEventHandler } from '../services/fleetEventHandler';

describe('MÓDULO 2 — FLOTA Y MAQUINARIA OPERATIVA (SUITE DE INTEGRACIÓN)', () => {
  beforeEach(() => {
    equipmentRepository.resetForTesting();
    employeeRepository.resetForTesting();
    attendanceRepository.resetForTesting();
  });

  it('Caso A: Equipo DISPONIBLE con documentación vigente es 100% asignable', async () => {
    const res = await fleetAvailabilityService.canAssignEquipment('eq-mix-12', '2026-09-30T08:00:00');
    expect(res.disponible).toBe(true);
    expect(res.bloqueante).toBe(false);
    expect(res.codigoMotivo).toBe('OK');
  });

  it('Caso B: Equipo EN TALLER queda bloqueado para cualquier asignación', async () => {
    const res = await fleetAvailabilityService.canAssignEquipment('eq-mix-99', '2026-09-30T08:00:00');
    expect(res.disponible).toBe(false);
    expect(res.bloqueante).toBe(true);
    expect(res.codigoMotivo).toBe('EN_TALLER');
  });

  it('Caso C: Equipo con seguro/documentación vencida queda bloqueado operativamente', async () => {
    // eq-mix-vencido tiene seguro vencido al 2026-08-01
    const res = await fleetAvailabilityService.canAssignEquipment('eq-mix-vencido', '2026-09-30T08:00:00');
    expect(res.disponible).toBe(false);
    expect(res.bloqueante).toBe(true);
    expect(res.codigoMotivo).toBe('DOC_BLOQUEANTE_VENCIDO');
  });

  it('Caso D: Equipo ya asignado o en viaje no puede ser reasignado simultáneamente', async () => {
    await equipmentRepository.changeOperationalStatus('eq-mix-12', 'EN_VIAJE', 'Asignado a Viaje #8942');
    const res = await fleetAvailabilityService.canAssignEquipment('eq-mix-12', '2026-09-30T08:00:00');
    expect(res.disponible).toBe(false);
    expect(res.codigoMotivo).toBe('ASIGNACION_EN_CURSO');
  });

  it('Caso E: Mixer con capacidad de tambor insuficiente para un volumen requerido es rechazado con explicación clara', async () => {
    // eq-mix-12 tiene tambor de 8 m3. Se solicitan 9.5 m3 en un solo viaje
    const res = await fleetAvailabilityService.canAssignEquipment('eq-mix-12', '2026-09-30T08:00:00', 9.5);
    expect(res.disponible).toBe(false);
    expect(res.codigoMotivo).toBe('CAPACIDAD_INSUFICIENTE');
    expect(res.motivo).toContain('8 m³');
  });

  it('Caso F: Lectura de odómetro inferior al valor actual es rechazada (No regresión de kilometraje)', async () => {
    // Odómetro actual de eq-mix-12 = 68500
    await expect(
      fleetService.registerOdometerReading('eq-mix-12', 65000, 'MANUAL')
    ).rejects.toThrow(/no puede ser menor al actual/);
  });

  it('Caso G: Lectura válida de horómetro se registra en el historial inmutable', async () => {
    // Horómetro actual de CAR-01 = 5600
    const lectura = await fleetService.registerHourmeterReading('eq-car-01', 5625, 'TALLER', 'OT-101');
    expect(lectura.valor).toBe(5625);

    const history = await equipmentRepository.getCounterHistory('eq-car-01');
    const ultima = history[history.length - 1];
    expect(ultima.valor).toBe(5625);
    expect(ultima.referenciaOrigenId).toBe('OT-101');
  });

  it('Caso H: Validación combinada Chofer + Mixer para viaje asigna exitosamente cuando ambos están habilitados', async () => {
    // emp-1 (Juan Pérez, licencia vigente) + eq-mix-12 (Mixer 12, disponible)
    const tripVal = await fleetAvailabilityService.canAssignTrip('emp-1', 'eq-mix-12', '2026-09-30T08:00:00', 7.5);
    expect(tripVal.canAssign).toBe(true);
    expect(tripVal.equipoStatus.disponible).toBe(true);
    expect(tripVal.choferStatus.disponible).toBe(true);
  });

  it('Caso I: Chofer bloqueado en RRHH impide la asignación del viaje aunque el Mixer esté disponible', async () => {
    // emp-2 (Carlos Gómez, licencia vencida) + eq-mix-12 (Mixer 12, disponible)
    const tripVal = await fleetAvailabilityService.canAssignTrip('emp-2', 'eq-mix-12', '2026-09-30T08:00:00', 7.5);
    expect(tripVal.canAssign).toBe(false);
    expect(tripVal.motivoBloqueo).toContain('Bloqueo de Personal');
    expect(tripVal.choferStatus.disponible).toBe(false);
    expect(tripVal.equipoStatus.disponible).toBe(true);
  });

  it('Caso J: Evento duplicado de Taller no altera doblemente el estado (Idempotencia)', async () => {
    const ev1 = await fleetEventHandler.onEquipoEntraTaller('EVT-OT-99', 'eq-mix-12', 'OT-99', 'Rotura de reductor');
    expect(ev1.processed).toBe(true);
    expect(ev1.isDuplicate).toBe(false);

    // Reenvío del mismo evento
    const ev2 = await fleetEventHandler.onEquipoEntraTaller('EVT-OT-99', 'eq-mix-12', 'OT-99', 'Rotura de reductor');
    expect(ev2.processed).toBe(false);
    expect(ev2.isDuplicate).toBe(true);
  });

  it('Caso K: Cambio de estado operativo genera registro auditable en el sistema', async () => {
    await fleetService.changeStatus('eq-mix-14', 'MANTENIMIENTO_PROGRAMADO', 'Service de 50.000 km', 'jefe_taller');
    const logs = await auditRepository.getLogs('flota_equipos');
    const logCambio = logs.find(l => l.registroId === 'eq-mix-14' && l.accion === 'CAMBIO_ESTADO_OPERATIVO');
    expect(logCambio).toBeDefined();
    expect(logCambio?.valorNuevo.estadoOperativo).toBe('MANTENIMIENTO_PROGRAMADO');
  });

  it('Caso L: Asignación de operador conserva historial y finaliza la anterior', async () => {
    // Reasignar de Juan Pérez (emp-1) a Marcos Díaz (emp-3)
    await fleetService.assignOperatorToEquipment('eq-mix-12', 'emp-3', 'RELEVO', 'Relevo por guardia');
    const history = await equipmentRepository.getAssignmentHistory('eq-mix-12');
    expect(history.length).toBe(2);
    expect(history[0].estado).toBe('FINALIZADA');
    expect(history[1].estado).toBe('ACTIVA');
    expect(history[1].empleadoId).toBe('emp-3');
  });
});
