import { describe, it, expect, beforeEach } from 'vitest';
import { equipmentRepository } from '../repositories/equipmentRepository';
import { employeeRepository } from '../repositories/employeeRepository';
import { attendanceRepository } from '../repositories/attendanceRepository';
import { auditRepository } from '../repositories/auditRepository';
import { fleetAvailabilityService } from '../services/fleetAvailabilityService';
import { fleetService } from '../services/fleetService';
import { fleetEventHandler } from '../services/fleetEventHandler';

describe('MÓDULO 2 — FLOTA Y MAQUINARIA OPERATIVA (SUITE DE INTEGRACIÓN & DISPONIBILIDAD)', () => {
  beforeEach(() => {
    equipmentRepository.resetForTesting();
    employeeRepository.resetForTesting();
    attendanceRepository.resetForTesting();
    fleetEventHandler.resetForTesting();
  });

  it('Caso 1: Equipo DISPONIBLE con documentación vigente es 100% asignable', async () => {
    const res = await fleetAvailabilityService.canAssignEquipment('eq-mix-12', '2026-09-30T08:00:00');
    expect(res.disponible).toBe(true);
    expect(res.bloqueante).toBe(false);
    expect(res.codigoMotivo).toBe('OK');
  });

  it('Caso 2: Equipo EN TALLER queda bloqueado para cualquier asignación', async () => {
    const res = await fleetAvailabilityService.canAssignEquipment('eq-mix-99', '2026-09-30T08:00:00');
    expect(res.disponible).toBe(false);
    expect(res.bloqueante).toBe(true);
    expect(res.codigoMotivo).toBe('EN_TALLER');
  });

  it('Caso 3 (Punto A): Equipo en estado ASIGNADO no puede asignarse nuevamente a otra operación simultánea', async () => {
    await equipmentRepository.changeOperationalStatus('eq-mix-12', 'ASIGNADO', 'Asignado previamente a carga en planta');
    const res = await fleetAvailabilityService.canAssignEquipment('eq-mix-12', '2026-09-30T08:00:00');
    expect(res.disponible).toBe(false);
    expect(res.bloqueante).toBe(true);
    expect(res.codigoMotivo).toBe('ASIGNACION_EN_CURSO');
  });

  it('Caso 4 (Punto B): Equipo en estado RESERVADO no puede asignarse a otra operación incompatible', async () => {
    await equipmentRepository.changeOperationalStatus('eq-mix-12', 'RESERVADO', 'Reservado para colada masiva turno noche');
    const res = await fleetAvailabilityService.canAssignEquipment('eq-mix-12', '2026-09-30T08:00:00');
    expect(res.disponible).toBe(false);
    expect(res.bloqueante).toBe(true);
    expect(res.codigoMotivo).toBe('EQUIPO_RESERVADO');
  });

  it('Caso 5 (Punto C): Empleado disponible + Equipo EN_TALLER -> asignación rechazada en fleetService', async () => {
    // emp-1 (Juan Pérez, disponible) + eq-mix-99 (Mixer en taller)
    await expect(
      fleetService.assignOperatorToEquipment('eq-mix-99', 'emp-1', 'TEMPORAL', 'Intento de asignación a equipo en taller')
    ).rejects.toThrow(/No se puede asignar el equipo.*EN TALLER/);
  });

  it('Caso 6 (Punto D): Empleado bloqueado por RRHH + Equipo disponible -> asignación rechazada en fleetService', async () => {
    // emp-2 (Carlos Gómez, licencia vencida) + eq-mix-12 (Mixer 12 disponible)
    await expect(
      fleetService.assignOperatorToEquipment('eq-mix-12', 'emp-2', 'TEMPORAL', 'Intento de asignación de chofer inhabilitado')
    ).rejects.toThrow(/No se puede asignar el operador.*Licencia de conducir VENCIDA/);
  });

  it('Caso 7 (Punto E): Empleado disponible + Equipo disponible -> asignación aceptada y registrada en historial', async () => {
    // emp-3 (Marcos Díaz, habilitado) + eq-car-01 (Cargadora disponible)
    // Cambiar estado a DISPONIBLE para la prueba
    await equipmentRepository.changeOperationalStatus('eq-car-01', 'DISPONIBLE', 'Listo para turno');
    const asig = await fleetService.assignOperatorToEquipment('eq-car-01', 'emp-3', 'HABITUAL', 'Asignación titular');
    expect(asig.estado).toBe('ACTIVA');
    expect(asig.empleadoId).toBe('emp-3');

    const history = await equipmentRepository.getAssignmentHistory('eq-car-01');
    expect(history.length).toBeGreaterThanOrEqual(1);
    const activa = history.find(h => h.estado === 'ACTIVA');
    expect(activa?.empleadoId).toBe('emp-3');
  });

  it('Caso 8 (Punto F): Evento con mismo eventId procesado dos veces NO duplica efecto (Idempotencia)', async () => {
    const ev1 = await fleetEventHandler.onEquipoEntraTaller('EVT-OT-101', 'eq-mix-12', 'OT-101', 'Rotura de manguera');
    expect(ev1.processed).toBe(true);
    expect(ev1.isDuplicate).toBe(false);

    // Reenvío del mismo eventId
    const ev2 = await fleetEventHandler.onEquipoEntraTaller('EVT-OT-101', 'eq-mix-12', 'OT-101', 'Rotura de manguera');
    expect(ev2.processed).toBe(false);
    expect(ev2.isDuplicate).toBe(true);
  });

  it('Caso 9: Equipo con seguro/documentación vencida queda bloqueado operativamente', async () => {
    // eq-mix-vencido tiene seguro vencido al 2026-08-01
    const res = await fleetAvailabilityService.canAssignEquipment('eq-mix-vencido', '2026-09-30T08:00:00');
    expect(res.disponible).toBe(false);
    expect(res.bloqueante).toBe(true);
    expect(res.codigoMotivo).toBe('DOC_BLOQUEANTE_VENCIDO');
  });

  it('Caso 10: Mixer con capacidad de tambor insuficiente para un volumen requerido es rechazado con explicación clara', async () => {
    // eq-mix-12 tiene tambor de 8 m3. Se solicitan 9.5 m3 en un solo viaje
    const res = await fleetAvailabilityService.canAssignEquipment('eq-mix-12', '2026-09-30T08:00:00', 9.5);
    expect(res.disponible).toBe(false);
    expect(res.codigoMotivo).toBe('CAPACIDAD_INSUFICIENTE');
    expect(res.motivo).toContain('8 m³');
  });

  it('Caso 11: Lectura de odómetro inferior al valor actual es rechazada (No regresión de kilometraje)', async () => {
    // Odómetro actual de eq-mix-12 = 68500
    await expect(
      fleetService.registerOdometerReading('eq-mix-12', 65000, 'MANUAL')
    ).rejects.toThrow(/no puede ser menor al actual/);
  });

  it('Caso 12: Lectura válida de horómetro se registra en el historial inmutable', async () => {
    // Horómetro actual de CAR-01 = 5600
    const lectura = await fleetService.registerHourmeterReading('eq-car-01', 5625, 'TALLER', 'OT-101');
    expect(lectura.valor).toBe(5625);

    const history = await equipmentRepository.getCounterHistory('eq-car-01');
    const ultima = history[history.length - 1];
    expect(ultima.valor).toBe(5625);
    expect(ultima.referenciaOrigenId).toBe('OT-101');
  });

  it('Caso 13: Solicitud con tipo de equipo no coincidente retorna código TIPO_INCOMPATIBLE', async () => {
    // eq-mix-12 es de tipo MIXER. Se consulta si puede utilizarse como CARGADORA
    const res = await fleetAvailabilityService.canAssignEquipment('eq-mix-12', '2026-09-30T08:00:00', undefined, 'CARGADORA');
    expect(res.disponible).toBe(false);
    expect(res.bloqueante).toBe(true);
    expect(res.codigoMotivo).toBe('TIPO_INCOMPATIBLE');
    expect(res.motivo).toContain('se requería CARGADORA');
  });
});
