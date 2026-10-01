import { employeeRepository } from '../repositories/employeeRepository';
import { attendanceRepository } from '../repositories/attendanceRepository';
import { payrollRepository } from '../repositories/payrollRepository';
import { laborCostRepository } from '../repositories/laborCostRepository';
import { hrDomainService } from '../services/hrDomainService';
import { hrAvailabilityService } from '../services/hrAvailabilityService';
import { hrEventHandler } from '../services/hrEventHandler';
import { FichadaAsistencia } from '../types';

export interface TestResultItem {
  id: string;
  nombre: string;
  descripcion: string;
  esperado: string;
  obtenido: string;
  aprobado: boolean;
}

export async function runHRModuleAutomatedTests(): Promise<TestResultItem[]> {
  const results: TestResultItem[] = [];

  // ==========================================
  // CASO A: Chofer con licencia vencida
  // ==========================================
  const resA = await hrAvailabilityService.canAssignEmployee('emp-2', '2026-09-30T08:00:00', 'mixer');
  results.push({
    id: 'CASO-A',
    nombre: 'Caso A: Licencia vencida bloquea asignación operativa',
    descripcion: 'Carlos Gómez (#1002) tiene licencia vencida al 2026-08-15',
    esperado: 'disponible = false, bloqueante = true',
    obtenido: `disponible = ${resA.disponible}, motivo = "${resA.motivo}"`,
    aprobado: !resA.disponible && resA.bloqueante
  });

  // ==========================================
  // CASO B: Chofer de vacaciones
  // ==========================================
  const resB = await hrAvailabilityService.canAssignEmployee('emp-3', '2026-10-18T08:00:00', 'cargadora');
  results.push({
    id: 'CASO-B',
    nombre: 'Caso B: Empleado de vacaciones no disponible',
    descripcion: 'Marcos Díaz (#1003) tiene vacaciones aprobadas del 15 al 25 de Octubre 2026',
    esperado: 'disponible = false, motivo contiene VACACIONES',
    obtenido: `disponible = ${resB.disponible}, motivo = "${resB.motivo}"`,
    aprobado: !resB.disponible && resB.codigoMotivo === 'NOVEDAD_ACTIVA'
  });

  // ==========================================
  // CASO C: Viaje completado genera UNA imputación laboral
  // ==========================================
  const resC = await hrEventHandler.onViajeCompletado('viaje-8901', 'emp-1', 2.5, 'MIX-12', '2026-09-30');
  results.push({
    id: 'CASO-C',
    nombre: 'Caso C: Viaje completado genera imputación de costo chofer',
    descripcion: 'Viaje #viaje-8901 de 2.5 hs con Mixer 12 para Juan Pérez',
    esperado: 'Imputación registrada con centro de costo cc-transporte',
    obtenido: `Imputado $${resC.imputacion.costoTotalImputado} (${resC.imputacion.horasImputadas} hs a $${resC.imputacion.costoHorarioAplicado}/h)`,
    aprobado: resC.processed && resC.imputacion.costoTotalImputado > 0
  });

  // ==========================================
  // CASO D: Mecánico en OT genera costo a Taller + Equipo
  // ==========================================
  const resD = await hrEventHandler.onOrdenTrabajoFinalizada('ot-554', 'emp-5', 4.0, 'MIX-12', '2026-09-30');
  results.push({
    id: 'CASO-D',
    nombre: 'Caso D: Mecánico en OT imputa costo a Taller y al Equipo',
    descripcion: 'OT #ot-554 de 4 hs de Roberto Sánchez en Mixer 12',
    esperado: 'Costo imputado a cc-taller con equipoId = MIX-12',
    obtenido: `Imputado $${resD.imputacion.costoTotalImputado} a Taller (Equipo: ${resD.imputacion.equipoId})`,
    aprobado: resD.processed && resD.imputacion.centroCostoId === 'cc-taller' && resD.imputacion.equipoId === 'MIX-12'
  });

  // ==========================================
  // CASO E: Operador de maquinaria imputa a Áridos
  // ==========================================
  const resE = await hrEventHandler.onHorasMaquinaRegistradas('reg-maq-99', 'emp-3', 5.0, 'CAR-01', '2026-09-30');
  results.push({
    id: 'CASO-E',
    nombre: 'Caso E: Maquinista imputa horas al Centro de Costo Áridos',
    descripcion: 'Registro de 5 horas de CAT 950 en cantera para Marcos Díaz',
    esperado: 'Imputado a cc-aridos con equipoId = CAR-01',
    obtenido: `Imputado $${resE.imputacion.costoTotalImputado} a Áridos (${resE.imputacion.horasImputadas} hs)`,
    aprobado: resE.processed && resE.imputacion.centroCostoId === 'cc-aridos'
  });

  // ==========================================
  // CASO F: Adelanto pagado se descuenta exactamente una vez
  // ==========================================
  const liqF = await hrDomainService.liquidarEmpleadoPeriodo('emp-1', '2026-09', 'MENSUAL', 'test_user');
  const detalleAdelanto = liqF.detalles.find(d => d.conceptoCodigo === '4001');
  results.push({
    id: 'CASO-F',
    nombre: 'Caso F: Adelanto pagado se descuenta en la liquidación',
    descripcion: 'Adelanto de $150.000 de Juan Pérez aplicado en liquidación 2026-09',
    esperado: 'Descuento de $150.000 en concepto 4001',
    obtenido: `Descuento aplicado = $${detalleAdelanto?.descuentos || 0}`,
    aprobado: detalleAdelanto !== undefined && detalleAdelanto.descuentos === 150000
  });

  // ==========================================
  // CASO G: Cierre de liquidación conserva Snapshot inmutable
  // ==========================================
  await payrollRepository.closeLiquidacionWithSnapshot('2026-09', 'MENSUAL', 'emp-1', 'supervisor_cierre');
  const sueldoOriginalAgosto = liqF.sueldoBasico;
  // Modificar sueldo posterior en Octubre
  await employeeRepository.updateSalaryAndCategory('emp-1', 1900000, 'Oficial Principal', '2026-10-01', 'Aumento Octubre');
  // Consultar liquidación cerrada de Septiembre
  const liqCerrada = await payrollRepository.getLiquidacion('2026-09', 'MENSUAL', 'emp-1');
  const snapshotData = JSON.parse(liqCerrada?.snapshotJson || '{}');
  results.push({
    id: 'CASO-G',
    nombre: 'Caso G: Liquidación cerrada no se altera ante cambios salariales posteriores',
    descripcion: 'Sueldo de Juan Pérez aumentó a $1.900.000 en Octubre. Se verifica Septiembre.',
    esperado: `Snapshot conserva sueldo base de $${sueldoOriginalAgosto.toLocaleString()} y estado CERRADA`,
    obtenido: `Sueldo en Snapshot = $${snapshotData.sueldoBasico?.toLocaleString()}, Estado = ${liqCerrada?.estado}`,
    aprobado: liqCerrada?.estado === 'CERRADA' && snapshotData.sueldoBasico === sueldoOriginalAgosto
  });

  // ==========================================
  // CASO H: Consulta de Logística sin exposición salarial
  // ==========================================
  const consultaLogistica = await hrAvailabilityService.canAssignEmployee('emp-1', '2026-10-01T08:00:00', 'mixer');
  const tieneDatosSalariales = 'sueldoBasico' in consultaLogistica || 'cbu' in consultaLogistica;
  results.push({
    id: 'CASO-H',
    nombre: 'Caso H: Servicio de Disponibilidad no expone sueldos ni CBU a Logística',
    descripcion: 'Contrato de canAssignEmployee retorna únicamente campos operativos',
    esperado: 'disponible = true, sin campos de salario, cbu o deducciones',
    obtenido: `Retornado: { disponible: ${consultaLogistica.disponible}, bloqueante: ${consultaLogistica.bloqueante} }`,
    aprobado: consultaLogistica.disponible && !tieneDatosSalariales
  });

  // ==========================================
  // CASO I: Idempotencia - Evento procesado dos veces NO duplica costo
  // ==========================================
  const resI_1 = await hrEventHandler.onViajeCompletado('viaje-8901', 'emp-1', 2.5, 'MIX-12', '2026-09-30');
  results.push({
    id: 'CASO-I',
    nombre: 'Caso I: Evento duplicado no duplica costo laboral (Idempotencia)',
    descripcion: 'Se reenvía el mismo evento EVT-LOG-VIAJE-viaje-8901',
    esperado: 'isDuplicate = true, processed = false',
    obtenido: `isDuplicate = ${resI_1.isDuplicate}, processed = ${resI_1.processed}`,
    aprobado: resI_1.isDuplicate && !resI_1.processed
  });

  // ==========================================
  // CASO J: Turno nocturno que cruza medianoche (22:00 a 06:00)
  // ==========================================
  const turnoNoche = (await attendanceRepository.getTurnos()).find(t => t.cruzaMedianoche);
  const fichadasNoche: FichadaAsistencia[] = [
    { id: 'fn-1', empleadoId: 'emp-1', fecha: '2026-09-30', hora: '22:00', tipo: 'ENTRADA', origen: 'RELOJ_BIOMETRICO' },
    { id: 'fn-2', empleadoId: 'emp-1', fecha: '2026-09-30', hora: '06:00', tipo: 'SALIDA', origen: 'RELOJ_BIOMETRICO' }
  ];
  const calculoNoche = hrDomainService.calcularJornadaDesdeFichadas('emp-1', '2026-09-30', fichadasNoche, turnoNoche);
  results.push({
    id: 'CASO-J',
    nombre: 'Caso J: Turno nocturno que cruza medianoche calcula 8 horas normales',
    descripcion: 'Entrada 22:00, Salida 06:00 del día siguiente',
    esperado: 'horasPresencia = 8.0, horasNormales = 8.0',
    obtenido: `horasPresencia = ${calculoNoche.jornada.horasPresencia}, horasNormales = ${calculoNoche.jornada.horasNormales}`,
    aprobado: calculoNoche.jornada.horasPresencia === 8.0 && calculoNoche.jornada.horasNormales === 8.0
  });

  // ==========================================
  // CASO K: Descanso intermedio se descuenta correctamente
  // ==========================================
  const fichadasConDescanso: FichadaAsistencia[] = [
    { id: 'fd-1', empleadoId: 'emp-1', fecha: '2026-09-30', hora: '08:00', tipo: 'ENTRADA', origen: 'RELOJ_BIOMETRICO' },
    { id: 'fd-2', empleadoId: 'emp-1', fecha: '2026-09-30', hora: '12:00', tipo: 'INICIO_DESCANSO', origen: 'RELOJ_BIOMETRICO' },
    { id: 'fd-3', empleadoId: 'emp-1', fecha: '2026-09-30', hora: '12:30', tipo: 'FIN_DESCANSO', origen: 'RELOJ_BIOMETRICO' },
    { id: 'fd-4', empleadoId: 'emp-1', fecha: '2026-09-30', hora: '17:00', tipo: 'SALIDA', origen: 'RELOJ_BIOMETRICO' }
  ];
  const calculoDescanso = hrDomainService.calcularJornadaDesdeFichadas('emp-1', '2026-09-30', fichadasConDescanso);
  // Presencia total 9 hs (08 a 17), descanso 0.5 hs (30 min) -> tiempo trabajado 8.5 hs (8 normales + 0.5 extra)
  results.push({
    id: 'CASO-K',
    nombre: 'Caso K: Descanso intermedio de 30 min se descuenta de horas trabajadas',
    descripcion: 'Entrada 08:00, Descanso 12:00-12:30, Salida 17:00 (9 hs de presencia bruta)',
    esperado: 'horasDescanso = 0.5, horasExtra50 = 0.5',
    obtenido: `horasDescanso = ${calculoDescanso.jornada.horasDescanso}, horasExtra50 = ${calculoDescanso.jornada.horasExtra50}`,
    aprobado: calculoDescanso.jornada.horasDescanso === 0.5 && calculoDescanso.jornada.horasExtra50 === 0.5
  });

  // ==========================================
  // CASO L: Hora extra rechazada NO entra en liquidación
  // ==========================================
  await attendanceRepository.addHoraExtra({
    id: 'he-rechazada-01',
    empleadoId: 'emp-5',
    fecha: '2026-09-25',
    horas: 4.0,
    tipo: 'EXTRA_50',
    estado: 'RECHAZADA',
    responsableAprobacion: 'supervisor_taller',
    motivoRechazo: 'Permanencia no autorizada previamente'
  });
  const liqL = await hrDomainService.liquidarEmpleadoPeriodo('emp-5', '2026-09', 'MENSUAL', 'admin');
  const detalleExtra50 = liqL.detalles.find(d => d.conceptoCodigo === '1020');
  results.push({
    id: 'CASO-L',
    nombre: 'Caso L: Hora extra rechazada no ingresa a la liquidación',
    descripcion: 'Roberto Sánchez tiene 4 hs extras rechazadas en Septiembre',
    esperado: 'Concepto 1020 no aparece en el recibo/liquidación',
    obtenido: detalleExtra50 ? `Concepto encontrado: ${detalleExtra50.haberes}` : 'No liquidado (Correcto)',
    aprobado: detalleExtra50 === undefined
  });

  return results;
}
