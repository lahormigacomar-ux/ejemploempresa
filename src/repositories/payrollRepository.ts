import {
  ConceptoLiquidacion,
  ReglaSalarialVersionada,
  Adelanto,
  Prestamo,
  PrestamoCuota,
  LiquidacionSueldo,
  LiquidacionDetalle
} from '../types';
import { auditRepository } from './auditRepository';

class PayrollRepository {
  private reglas: ReglaSalarialVersionada[] = [
    {
      id: 'reg-2026-v1',
      version: '2026.1',
      vigenciaDesde: '2026-01-01',
      vigenciaHasta: '2026-12-31',
      horasBaseMensuales: 176,
      coefCargasPatronales: 0.385, // 38.5% patronal
      coefART: 0.055, // 5.5% ART
      observaciones: 'Vigencia ejercicio 2026'
    }
  ];

  private conceptos: ConceptoLiquidacion[] = [
    {
      id: 'conc-01',
      codigo: '1001',
      nombre: 'Sueldo Básico',
      tipo: 'REMUNERATIVO',
      modoCalculo: 'DIARIO_HORA',
      baseCalculo: 'BASICO',
      vigenciaDesde: '2026-01-01',
      impactaSAC: true,
      impactaVacaciones: true,
      activo: true
    },
    {
      id: 'conc-02',
      codigo: '1005',
      nombre: 'Antigüedad (1% por año)',
      tipo: 'REMUNERATIVO',
      modoCalculo: 'PORCENTAJE',
      porcentaje: 0.01,
      baseCalculo: 'BASICO',
      vigenciaDesde: '2026-01-01',
      impactaSAC: true,
      impactaVacaciones: true,
      activo: true
    },
    {
      id: 'conc-03',
      codigo: '1020',
      nombre: 'Horas Extras 50%',
      tipo: 'REMUNERATIVO',
      modoCalculo: 'FORMULA',
      baseCalculo: 'VALOR_HORA_50',
      vigenciaDesde: '2026-01-01',
      impactaSAC: true,
      impactaVacaciones: true,
      activo: true
    },
    {
      id: 'conc-04',
      codigo: '2001',
      nombre: 'Viático de Movilidad Convenio (No Remun.)',
      tipo: 'NO_REMUNERATIVO',
      modoCalculo: 'FIJO',
      importeFijo: 150000,
      vigenciaDesde: '2026-01-01',
      impactaSAC: false,
      impactaVacaciones: false,
      activo: true
    },
    {
      id: 'conc-05',
      codigo: '3001',
      nombre: 'Jubilación Ley 24.241 (11%)',
      tipo: 'DESCUENTO',
      modoCalculo: 'PORCENTAJE',
      porcentaje: 0.11,
      baseCalculo: 'TOTAL_REMUNERATIVO',
      vigenciaDesde: '2026-01-01',
      impactaSAC: false,
      impactaVacaciones: false,
      activo: true
    },
    {
      id: 'conc-06',
      codigo: '3002',
      nombre: 'Ley 19.032 - INSSJP (3%)',
      tipo: 'DESCUENTO',
      modoCalculo: 'PORCENTAJE',
      porcentaje: 0.03,
      baseCalculo: 'TOTAL_REMUNERATIVO',
      vigenciaDesde: '2026-01-01',
      impactaSAC: false,
      impactaVacaciones: false,
      activo: true
    },
    {
      id: 'conc-07',
      codigo: '3003',
      nombre: 'Obra Social Sindical (3%)',
      tipo: 'DESCUENTO',
      modoCalculo: 'PORCENTAJE',
      porcentaje: 0.03,
      baseCalculo: 'TOTAL_REMUNERATIVO',
      vigenciaDesde: '2026-01-01',
      impactaSAC: false,
      impactaVacaciones: false,
      activo: true
    },
    {
      id: 'conc-08',
      codigo: '3010',
      nombre: 'Cuota Sindical Gremial (2%)',
      tipo: 'DESCUENTO',
      modoCalculo: 'PORCENTAJE',
      porcentaje: 0.02,
      baseCalculo: 'TOTAL_REMUNERATIVO',
      vigenciaDesde: '2026-01-01',
      impactaSAC: false,
      impactaVacaciones: false,
      activo: true
    }
  ];

  private adelantos: Adelanto[] = [
    {
      id: 'ade-1',
      empleadoId: 'emp-1',
      fechaSolicitud: '2026-09-15',
      importe: 150000,
      motivo: 'Adelanto Quincenal',
      estado: 'PAGADO',
      fechaPago: '2026-09-15'
    }
  ];

  private prestamos: Prestamo[] = [
    {
      id: 'pres-1',
      empleadoId: 'emp-3',
      montoTotal: 300000,
      cantidadCuotas: 6,
      importeCuota: 50000,
      fechaInicio: '2026-08-01',
      saldoPendiente: 250000,
      estado: 'ACTIVO',
      cuotas: [
        { id: 'cuo-1', prestamoId: 'pres-1', numeroCuota: 1, importe: 50000, periodoDescuento: '2026-08', estado: 'DESCONTADA' },
        { id: 'cuo-2', prestamoId: 'pres-1', numeroCuota: 2, importe: 50000, periodoDescuento: '2026-09', estado: 'PENDIENTE' },
        { id: 'cuo-3', prestamoId: 'pres-1', numeroCuota: 3, importe: 50000, periodoDescuento: '2026-10', estado: 'PENDIENTE' },
        { id: 'cuo-4', prestamoId: 'pres-1', numeroCuota: 4, importe: 50000, periodoDescuento: '2026-11', estado: 'PENDIENTE' },
        { id: 'cuo-5', prestamoId: 'pres-1', numeroCuota: 5, importe: 50000, periodoDescuento: '2026-12', estado: 'PENDIENTE' },
        { id: 'cuo-6', prestamoId: 'pres-1', numeroCuota: 6, importe: 50000, periodoDescuento: '2027-01', estado: 'PENDIENTE' }
      ]
    }
  ];

  private liquidaciones: Map<string, LiquidacionSueldo> = new Map();

  async getReglaVigente(fecha: string): Promise<ReglaSalarialVersionada> {
    const regla = this.reglas.find(r => {
      if (fecha < r.vigenciaDesde) return false;
      if (r.vigenciaHasta && fecha > r.vigenciaHasta) return false;
      return true;
    });
    if (!regla) {
      return this.reglas[0];
    }
    return regla;
  }

  async getConceptosVigentes(fecha: string, convenio?: string): Promise<ConceptoLiquidacion[]> {
    return this.conceptos.filter(c => {
      if (!c.activo) return false;
      if (fecha < c.vigenciaDesde) return false;
      if (c.vigenciaHasta && fecha > c.vigenciaHasta) return false;
      if (convenio && c.convenio && c.convenio !== convenio) return false;
      return true;
    });
  }

  async getAdelantosPendientes(empleadoId: string): Promise<Adelanto[]> {
    return this.adelantos.filter(a => a.empleadoId === empleadoId && a.estado === 'PAGADO');
  }

  async markAdelantoDescontado(adelantoId: string, liquidacionId: string): Promise<void> {
    const ad = this.adelantos.find(a => a.id === adelantoId);
    if (ad) {
      ad.estado = 'DESCONTADO';
      ad.liquidacionId = liquidacionId;
    }
  }

  async getCuotaPrestamoPendiente(empleadoId: string, periodo: string): Promise<PrestamoCuota | null> {
    const prestamo = this.prestamos.find(p => p.empleadoId === empleadoId && p.estado === 'ACTIVO');
    if (!prestamo) return null;
    const cuota = prestamo.cuotas.find(c => c.periodoDescuento === periodo && c.estado === 'PENDIENTE');
    return cuota || null;
  }

  async markCuotaPrestamoDescontada(prestamoId: string, numeroCuota: number, liquidacionId: string): Promise<void> {
    const prestamo = this.prestamos.find(p => p.id === prestamoId);
    if (!prestamo) return;
    const cuota = prestamo.cuotas.find(c => c.numeroCuota === numeroCuota);
    if (cuota && cuota.estado === 'PENDIENTE') {
      cuota.estado = 'DESCONTADA';
      cuota.liquidacionId = liquidacionId;
      prestamo.saldoPendiente -= cuota.importe;
      if (prestamo.saldoPendiente <= 0) {
        prestamo.estado = 'CANCELADO';
      }
    }
  }

  async saveLiquidacion(liq: LiquidacionSueldo): Promise<void> {
    const key = `${liq.periodo}_${liq.tipo}_${liq.empleadoId}`;
    const existente = this.liquidaciones.get(key);
    if (existente && existente.estado === 'CERRADA') {
      throw new Error(`La liquidación ${key} se encuentra CERRADA y no puede ser modificada.`);
    }
    this.liquidaciones.set(key, liq);
  }

  async closeLiquidacionWithSnapshot(
    periodo: string,
    tipo: string,
    empleadoId: string,
    usuarioCierre: string = 'admin'
  ): Promise<LiquidacionSueldo> {
    const key = `${periodo}_${tipo}_${empleadoId}`;
    const liq = this.liquidaciones.get(key);
    if (!liq) throw new Error(`Liquidación ${key} no encontrada para cerrar`);

    // Congelar estado y generar Snapshot JSON inmutable
    liq.estado = 'CERRADA';
    liq.fechaCierre = new Date().toISOString();
    liq.usuarioCierre = usuarioCierre;
    liq.snapshotJson = JSON.stringify({
      ...liq,
      snapshotTimestamp: liq.fechaCierre
    });

    this.liquidaciones.set(key, liq);

    await auditRepository.recordAction(
      'rrhh_liquidaciones',
      liq.id,
      'CIERRE_LIQUIDACION_CONGELADA',
      { estado: 'CALCULADA' },
      { estado: 'CERRADA', totalNeto: liq.netoAPagar, costoEmpresa: liq.costoTotalEmpresa },
      'Cierre mensual definitivo con congelamiento de snapshot histórico',
      usuarioCierre
    );

    return liq;
  }

  async getLiquidacion(periodo: string, tipo: string, empleadoId: string): Promise<LiquidacionSueldo | null> {
    const key = `${periodo}_${tipo}_${empleadoId}`;
    return this.liquidaciones.get(key) || null;
  }

  async getAllLiquidaciones(periodo?: string): Promise<LiquidacionSueldo[]> {
    const all = Array.from(this.liquidaciones.values());
    if (periodo) return all.filter(l => l.periodo === periodo);
    return all;
  }
}

export const payrollRepository = new PayrollRepository();
