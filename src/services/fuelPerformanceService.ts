import {
  MetricaRendimiento,
  NivelDesvioRendimiento,
  ParametroRendimientoEquipo,
  MetodoCalculoConsumo
} from '../types';
import { fuelPerformanceRepository } from '../repositories/fuelPerformanceRepository';
import { equipmentRepository } from '../repositories/equipmentRepository';

export interface EvaluacionRendimientoResult {
  rendimientoCalculado?: number;
  metricaRendimiento?: MetricaRendimiento;
  metodoCalculoConsumo: MetodoCalculoConsumo;
  nivelDesvio: NivelDesvioRendimiento;
  valorObjetivo?: number;
  porcentajeDesvio?: number;
  observacionRendimiento?: string;
}

export class FuelPerformanceService {
  /**
   * Calcula el rendimiento operativo entre el abastecimiento actual y el anterior inmediato
   */
  async evaluateSupplyPerformance(
    equipoId: string,
    litros: number,
    fecha: string,
    odometroActual?: number,
    odometroAnterior?: number,
    horometroActual?: number,
    horometroAnterior?: number,
    tanqueActualLleno: boolean = false,
    tanqueAnteriorLleno: boolean = false
  ): Promise<EvaluacionRendimientoResult> {
    const equipo = await equipmentRepository.getById(equipoId);
    if (!equipo) {
      return {
        metodoCalculoConsumo: 'SIN_DETERMINAR',
        nivelDesvio: 'SIN_REFERENCIA',
        observacionRendimiento: 'Equipo no encontrado'
      };
    }

    const param = await fuelPerformanceRepository.getParameters(
      equipo.empresaId || 'emp-1',
      equipoId,
      equipo.tipoEquipo,
      fecha.split('T')[0]
    );

    const metodoCalculo: MetodoCalculoConsumo =
      tanqueActualLleno && tanqueAnteriorLleno ? 'LLENO_A_LLENO' : 'ESTIMADO_ENTRE_CARGAS';

    // 1. Caso Vehículos / Mixers por Kilometraje (L_100KM o KM_L)
    if (odometroActual !== undefined && odometroAnterior !== undefined) {
      const distanciaKm = odometroActual - odometroAnterior;
      if (distanciaKm <= 0 || litros <= 0) {
        return {
          metodoCalculoConsumo: 'SIN_DETERMINAR',
          nivelDesvio: 'SIN_DATOS',
          observacionRendimiento: 'Distancia o litros insuficientes para estimar consumo'
        };
      }

      const metrica: MetricaRendimiento = param?.metrica || 'L_100KM';
      let rendimiento = 0;

      if (metrica === 'L_100KM') {
        rendimiento = Number(((litros / distanciaKm) * 100).toFixed(2));
      } else if (metrica === 'KM_L') {
        rendimiento = Number((distanciaKm / litros).toFixed(2));
      }

      const desvio = this.calculateDeviation(rendimiento, metrica, param);
      const sufijoMetodo =
        metodoCalculo === 'LLENO_A_LLENO'
          ? ' (Metodología Lleno-a-Lleno)'
          : ' (Estimación consumo entre cargas)';

      return {
        rendimientoCalculado: rendimiento,
        metricaRendimiento: metrica,
        metodoCalculoConsumo: metodoCalculo,
        nivelDesvio: desvio.nivel,
        valorObjetivo: param?.valorObjetivo,
        porcentajeDesvio: desvio.porcentajeDesvio,
        observacionRendimiento: `${desvio.motivo}${sufijoMetodo}`
      };
    }

    // 2. Caso Maquinaria / Cargadoras / Bombas por Horas (L_HORA)
    if (horometroActual !== undefined && horometroAnterior !== undefined) {
      const horasTrabajadas = horometroActual - horometroAnterior;
      if (horasTrabajadas <= 0 || litros <= 0) {
        return {
          metodoCalculoConsumo: 'SIN_DETERMINAR',
          nivelDesvio: 'SIN_DATOS',
          observacionRendimiento: 'Horas u operativas insuficientes para estimar consumo'
        };
      }

      const metrica: MetricaRendimiento = 'L_HORA';
      const rendimiento = Number((litros / horasTrabajadas).toFixed(2));

      const desvio = this.calculateDeviation(rendimiento, metrica, param);
      const sufijoMetodo =
        metodoCalculo === 'LLENO_A_LLENO'
          ? ' (Metodología Lleno-a-Lleno)'
          : ' (Estimación consumo entre cargas)';

      return {
        rendimientoCalculado: rendimiento,
        metricaRendimiento: metrica,
        metodoCalculoConsumo: metodoCalculo,
        nivelDesvio: desvio.nivel,
        valorObjetivo: param?.valorObjetivo,
        porcentajeDesvio: desvio.porcentajeDesvio,
        observacionRendimiento: `${desvio.motivo}${sufijoMetodo}`
      };
    }

    return {
      metodoCalculoConsumo: 'SIN_DETERMINAR',
      nivelDesvio: 'SIN_DATOS',
      observacionRendimiento: 'No se cuenta con odómetro/horómetro anterior para estimar rendimiento'
    };
  }

  private calculateDeviation(
    consumoReal: number,
    metrica: MetricaRendimiento,
    param: ParametroRendimientoEquipo | null
  ): { nivel: NivelDesvioRendimiento; porcentajeDesvio: number; motivo: string } {
    if (!param) {
      return {
        nivel: 'SIN_REFERENCIA',
        porcentajeDesvio: 0,
        motivo: 'Sin parámetro objetivo configurado para este tipo de equipo/período'
      };
    }

    const obj = param.valorObjetivo;
    let pctDesvio = 0;

    if (metrica === 'L_100KM' || metrica === 'L_HORA') {
      // Mayor valor implica mayor consumo (peor rendimiento)
      pctDesvio = Number((((consumoReal - obj) / obj) * 100).toFixed(2));
    } else if (metrica === 'KM_L') {
      // Menor valor implica menor rendimiento (peor)
      pctDesvio = Number((((obj - consumoReal) / obj) * 100).toFixed(2));
    }

    if (pctDesvio <= 0 || pctDesvio <= param.toleranciaAdvertenciaPct) {
      return {
        nivel: 'NORMAL',
        porcentajeDesvio: Math.max(0, pctDesvio),
        motivo: `Consumo dentro de parámetros normales (Objetivo: ${obj} ${metrica})`
      };
    }

    if (pctDesvio <= param.toleranciaCriticaPct) {
      return {
        nivel: 'ADVERTENCIA',
        porcentajeDesvio: pctDesvio,
        motivo: `Consumo con desvío moderado (+${pctDesvio}% sobre objetivo de ${obj} ${metrica})`
      };
    }

    return {
      nivel: 'CRITICO',
      porcentajeDesvio: pctDesvio,
      motivo: `Consumo anormal crítico (+${pctDesvio}% sobre objetivo de ${obj} ${metrica})`
    };
  }
}

export const fuelPerformanceService = new FuelPerformanceService();
