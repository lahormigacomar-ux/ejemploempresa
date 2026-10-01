import {
  FichadaAsistencia,
  TurnoLaboral,
  JornadaLaboral,
  Empleado,
  ConceptoLiquidacion,
  ReglaSalarialVersionada,
  LiquidacionSueldo,
  LiquidacionDetalle,
  HoraExtraRegistro
} from '../types';
import { employeeRepository } from '../repositories/employeeRepository';
import { attendanceRepository } from '../repositories/attendanceRepository';
import { payrollRepository } from '../repositories/payrollRepository';

/**
 * MOTOR DE DOMINIO DE RRHH Y LIQUIDACIÓN
 * Realiza cálculos dinámicos basados en reglas y conceptos versionados.
 */

export class HRDomainService {
  /**
   * 1. Cálculo de Jornada a partir de Fichadas Múltiples y Descansos
   */
  calcularJornadaDesdeFichadas(
    empleadoId: string,
    fecha: string,
    fichadas: FichadaAsistencia[],
    turno?: TurnoLaboral
  ): { jornada: JornadaLaboral; horasExtraCalculadas: HoraExtraRegistro[] } {
    if (fichadas.length === 0) {
      return {
        jornada: {
          id: `jor-${empleadoId}-${fecha}`,
          empleadoId,
          fecha,
          horasPresencia: 0,
          horasDescanso: 0,
          horasNormales: 0,
          horasExtra50: 0,
          horasExtra100: 0,
          horasNocturnas: 0,
          tardanzaMinutos: 0,
          estado: 'OBSERVADA'
        },
        horasExtraCalculadas: []
      };
    }

    // Ordenar fichadas cronológicamente
    const ordenadas = [...fichadas].sort((a, b) => a.hora.localeCompare(b.hora));

    const entradas = ordenadas.filter(f => f.tipo === 'ENTRADA');
    const salidas = ordenadas.filter(f => f.tipo === 'SALIDA');
    const iniciosDescanso = ordenadas.filter(f => f.tipo === 'INICIO_DESCANSO');
    const finesDescanso = ordenadas.filter(f => f.tipo === 'FIN_DESCANSO');

    if (entradas.length === 0 || salidas.length === 0) {
      return {
        jornada: {
          id: `jor-${empleadoId}-${fecha}`,
          empleadoId,
          fecha,
          horasPresencia: 0,
          horasDescanso: 0,
          horasNormales: 0,
          horasExtra50: 0,
          horasExtra100: 0,
          horasNocturnas: 0,
          tardanzaMinutos: 0,
          estado: 'OBSERVADA'
        },
        horasExtraCalculadas: []
      };
    }

    const primerEntrada = entradas[0];
    const ultimaSalida = salidas[salidas.length - 1];

    const toMinutes = (timeStr: string) => {
      const [h, m] = timeStr.split(':').map(Number);
      return h * 60 + m;
    };

    let minEntrada = toMinutes(primerEntrada.hora);
    let minSalida = toMinutes(ultimaSalida.hora);

    if (turno?.cruzaMedianoche && minSalida < minEntrada) {
      minSalida += 24 * 60; // Cruce de medianoche
    }

    const minPresenciaBruta = Math.max(0, minSalida - minEntrada);

    // Calcular descansos intermedios
    let minDescansoTotal = 0;
    for (let i = 0; i < Math.min(iniciosDescanso.length, finesDescanso.length); i++) {
      const ini = toMinutes(iniciosDescanso[i].hora);
      let fin = toMinutes(finesDescanso[i].hora);
      if (turno?.cruzaMedianoche && fin < ini) fin += 24 * 60;
      minDescansoTotal += Math.max(0, fin - ini);
    }

    const minTrabajadosEfectivos = Math.max(0, minPresenciaBruta - minDescansoTotal);
    const horasEfectivas = Number((minTrabajadosEfectivos / 60).toFixed(2));
    const horasDescanso = Number((minDescansoTotal / 60).toFixed(2));
    const horasPresencia = Number((minPresenciaBruta / 60).toFixed(2));

    // Desglose normal vs extras
    const horasNormales = Math.min(horasEfectivas, 8.0);
    const horasExcedentes = Math.max(0, horasEfectivas - 8.0);

    // Cálculo de tardanza
    let tardanzaMinutos = 0;
    if (turno) {
      const minTurnoEntrada = toMinutes(turno.horaEntrada);
      if (minEntrada > minTurnoEntrada + turno.toleranciaTardanzaMin) {
        tardanzaMinutos = minEntrada - minTurnoEntrada;
      }
    }

    // Cálculo nocturno (entre 21:00 y 06:00)
    let horasNocturnas = 0;
    if (minSalida > toMinutes('21:00') || turno?.cruzaMedianoche) {
      horasNocturnas = Math.min(horasEfectivas, 7.0);
    }

    const jornada: JornadaLaboral = {
      id: `jor-${empleadoId}-${fecha}`,
      empleadoId,
      fecha,
      turnoId: turno?.id,
      horasPresencia,
      horasDescanso,
      horasNormales,
      horasExtra50: horasExcedentes,
      horasExtra100: 0,
      horasNocturnas,
      tardanzaMinutos,
      estado: 'CALCULADA'
    };

    const horasExtraCalculadas: HoraExtraRegistro[] = [];
    if (horasExcedentes > 0) {
      horasExtraCalculadas.push({
        id: `he-${empleadoId}-${fecha}-50`,
        jornadaId: jornada.id,
        empleadoId,
        fecha,
        horas: horasExcedentes,
        tipo: 'EXTRA_50',
        estado: 'PENDIENTE_APROBACION'
      });
    }

    return { jornada, horasExtraCalculadas };
  }

  /**
   * 2. Motor de Liquidación de Sueldos por Conceptos Dinámicos
   */
  async liquidarEmpleadoPeriodo(
    empleadoId: string,
    periodo: string, // 'YYYY-MM'
    tipoLiquidacion: 'MENSUAL' | 'QUINCENAL' | 'SAC' | 'VACACIONES' | 'FINAL' | 'ESPECIAL' = 'MENSUAL',
    usuarioLiquidador: string = 'admin'
  ): Promise<LiquidacionSueldo> {
    const empleado = await employeeRepository.getById(empleadoId);
    if (!empleado) throw new Error(`Empleado ${empleadoId} no encontrado`);

    const fechaReferencia = `${periodo}-01`;
    const reglaVigente = await payrollRepository.getReglaVigente(fechaReferencia);
    const conceptosVigentes = await payrollRepository.getConceptosVigentes(fechaReferencia, empleado.convenio);

    // Obtener sueldo básico histórico aplicable al período
    const sueldoBasico = await employeeRepository.getHistoricalSalary(empleadoId, `${periodo}-28`);

    // Calcular antigüedad
    const anioIngreso = parseInt(empleado.fechaIngreso.split('-')[0], 10);
    const anioLiquidacion = parseInt(periodo.split('-')[0], 10);
    const aniosAntiguedad = Math.max(0, anioLiquidacion - anioIngreso);

    // Obtener horas extras aprobadas en el período
    const horasExtrasAprobadas = await attendanceRepository.getHorasExtra(empleadoId, 'APROBADA');
    const horasExtraPeriodo = horasExtrasAprobadas
      .filter(h => h.fecha.startsWith(periodo))
      .reduce((sum, h) => sum + h.horas, 0);

    const valorHoraNormal = sueldoBasico / reglaVigente.horasBaseMensuales;
    const valorHoraExtra50 = valorHoraNormal * 1.5;

    const detalles: LiquidacionDetalle[] = [];
    let totalRemunerativo = 0;
    let totalNoRemunerativo = 0;
    let totalDescuentos = 0;
    let orden = 1;

    // 1. Evaluar conceptos remunerativos
    for (const c of conceptosVigentes.filter(c => c.tipo === 'REMUNERATIVO')) {
      let haberes = 0;
      let cantidad = 1;
      let unidad = 'UN';
      let baseCalculo = sueldoBasico;
      let porcentaje = c.porcentaje || 0;

      if (c.codigo === '1001') {
        // Sueldo básico mensual
        haberes = sueldoBasico;
        cantidad = 30;
        unidad = 'DÍAS';
      } else if (c.codigo === '1005') {
        // Antigüedad
        cantidad = aniosAntiguedad;
        unidad = 'AÑOS';
        haberes = Math.round(sueldoBasico * (porcentaje * aniosAntiguedad));
      } else if (c.codigo === '1020') {
        // Horas extras 50%
        if (horasExtraPeriodo > 0) {
          cantidad = horasExtraPeriodo;
          unidad = 'HS';
          baseCalculo = valorHoraExtra50;
          haberes = Math.round(horasExtraPeriodo * valorHoraExtra50);
        } else {
          continue; // No agregar renglón si no hay extras aprobadas
        }
      }

      totalRemunerativo += haberes;
      detalles.push({
        id: `det-${orden}`,
        liquidacionId: '',
        conceptoCodigo: c.codigo,
        conceptoNombre: c.nombre,
        tipo: 'REMUNERATIVO',
        cantidad,
        unidad,
        baseCalculo,
        porcentaje,
        haberes,
        descuentos: 0,
        orden: orden++
      });
    }

    // 2. Evaluar conceptos no remunerativos
    for (const c of conceptosVigentes.filter(c => c.tipo === 'NO_REMUNERATIVO')) {
      let haberes = 0;
      if (c.modoCalculo === 'FIJO') {
        haberes = c.importeFijo || 0;
      }
      totalNoRemunerativo += haberes;
      detalles.push({
        id: `det-${orden}`,
        liquidacionId: '',
        conceptoCodigo: c.codigo,
        conceptoNombre: c.nombre,
        tipo: 'NO_REMUNERATIVO',
        cantidad: 1,
        unidad: 'UN',
        baseCalculo: haberes,
        porcentaje: 0,
        haberes,
        descuentos: 0,
        orden: orden++
      });
    }

    // 3. Evaluar descuentos de ley sobre total remunerativo
    for (const c of conceptosVigentes.filter(c => c.tipo === 'DESCUENTO')) {
      let descuento = 0;
      if (c.modoCalculo === 'PORCENTAJE') {
        descuento = Math.round(totalRemunerativo * (c.porcentaje || 0));
      }
      totalDescuentos += descuento;
      detalles.push({
        id: `det-${orden}`,
        liquidacionId: '',
        conceptoCodigo: c.codigo,
        conceptoNombre: c.nombre,
        tipo: 'DESCUENTO',
        cantidad: 1,
        unidad: 'UN',
        baseCalculo: totalRemunerativo,
        porcentaje: c.porcentaje || 0,
        haberes: 0,
        descuentos: descuento,
        orden: orden++
      });
    }

    // 4. Evaluar adelantos pendientes
    const adelantos = await payrollRepository.getAdelantosPendientes(empleadoId);
    for (const ad of adelantos) {
      totalDescuentos += ad.importe;
      detalles.push({
        id: `det-${orden}`,
        liquidacionId: '',
        conceptoCodigo: '4001',
        conceptoNombre: `Descuento Adelanto (${ad.motivo || 'Quincena'})`,
        tipo: 'DESCUENTO',
        cantidad: 1,
        unidad: 'UN',
        baseCalculo: ad.importe,
        porcentaje: 0,
        haberes: 0,
        descuentos: ad.importe,
        orden: orden++
      });
    }

    // 5. Evaluar cuota de préstamo del período
    const cuotaPrestamo = await payrollRepository.getCuotaPrestamoPendiente(empleadoId, periodo);
    if (cuotaPrestamo) {
      totalDescuentos += cuotaPrestamo.importe;
      detalles.push({
        id: `det-${orden}`,
        liquidacionId: '',
        conceptoCodigo: '4002',
        conceptoNombre: `Cuota Préstamo #${cuotaPrestamo.numeroCuota}`,
        tipo: 'DESCUENTO',
        cantidad: 1,
        unidad: 'CUOTA',
        baseCalculo: cuotaPrestamo.importe,
        porcentaje: 0,
        haberes: 0,
        descuentos: cuotaPrestamo.importe,
        orden: orden++
      });
    }

    const netoAPagar = totalRemunerativo + totalNoRemunerativo - totalDescuentos;

    // Calcular contribuciones patronales y ART
    const contribucionesPatronales = Math.round(
      totalRemunerativo * reglaVigente.coefCargasPatronales + totalRemunerativo * reglaVigente.coefART
    );
    const costoTotalEmpresa = totalRemunerativo + totalNoRemunerativo + contribucionesPatronales;

    const liquidacion: LiquidacionSueldo = {
      id: `liq-${periodo}-${tipoLiquidacion}-${empleadoId}`,
      periodo,
      tipo: tipoLiquidacion,
      empleadoId,
      sueldoBasico,
      totalRemunerativo,
      totalNoRemunerativo,
      totalDescuentos,
      netoAPagar,
      contribucionesPatronales,
      costoTotalEmpresa,
      estado: 'CALCULADA',
      detalles
    };

    // Vincular id a los detalles
    liquidacion.detalles.forEach(d => (d.liquidacionId = liquidacion.id));

    await payrollRepository.saveLiquidacion(liquidacion);
    return liquidacion;
  }

  /**
   * 3. Contrato de Costo Horario Empresa para Módulos de Operaciones (Taller, Logística, Áridos)
   * Devuelve el costo real por hora considerando sueldo histórico, cargas patronales y ART vigentes.
   */
  async getEmployeeHourlyCost(empleadoId: string, fecha: string): Promise<number> {
    const empleado = await employeeRepository.getById(empleadoId);
    if (!empleado) throw new Error(`Empleado ${empleadoId} no encontrado`);

    const reglaVigente = await payrollRepository.getReglaVigente(fecha);
    const sueldoHistorico = await employeeRepository.getHistoricalSalary(empleadoId, fecha);

    // Costo total empresa = sueldo * (1 + cargas patronales + ART)
    const costoEmpresaMensual = Math.round(
      sueldoHistorico * (1 + reglaVigente.coefCargasPatronales + reglaVigente.coefART)
    );

    const costoHorario = Math.round(costoEmpresaMensual / reglaVigente.horasBaseMensuales);
    return costoHorario;
  }
}

export const hrDomainService = new HRDomainService();
