import {
  TanqueCombustible,
  MovimientoTanqueCombustible,
  IngresoTanqueCombustible,
  MedicionTanqueCombustible,
  AjusteTanqueCombustible,
  MetodoMedicionTanque
} from '../types';
import { tankRepository } from '../repositories/tankRepository';
import { fuelPerformanceRepository } from '../repositories/fuelPerformanceRepository';
import { auditRepository } from '../repositories/auditRepository';

export class TankService {
  async registerIncome(params: {
    tanqueId: string;
    litros: number;
    proveedorNombre: string;
    proveedorId?: string;
    precioUnitario: number;
    numeroRemito?: string;
    numeroFactura?: string;
    usuarioId?: string;
    observaciones?: string;
    fechaHora?: string;
  }): Promise<IngresoTanqueCombustible> {
    const tank = await tankRepository.getTankById(params.tanqueId);
    if (!tank) throw new Error(`Tanque ${params.tanqueId} no encontrado`);
    if (params.litros <= 0) throw new Error('La cantidad de litros ingresados debe ser mayor a 0');

    const now = params.fechaHora || new Date().toISOString();
    const costoTotal = Number((params.litros * params.precioUnitario).toFixed(2));

    const income: IngresoTanqueCombustible = {
      id: `ing-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      empresaId: tank.empresaId,
      tanqueId: tank.id,
      fechaHora: now,
      litros: params.litros,
      proveedorId: params.proveedorId,
      proveedorNombreSnapshot: params.proveedorNombre,
      numeroRemito: params.numeroRemito,
      numeroFactura: params.numeroFactura,
      precioUnitario: params.precioUnitario,
      costoTotal,
      usuarioId: params.usuarioId,
      observaciones: params.observaciones,
      createdAt: now
    };

    await tankRepository.addTankIncome(income);

    const mov: MovimientoTanqueCombustible = {
      id: `mov-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      empresaId: tank.empresaId,
      tanqueId: tank.id,
      fechaHora: now,
      tipoMovimiento: 'INGRESO',
      litros: params.litros,
      origenModulo: 'COMBUSTIBLE_INGRESO',
      origenId: income.id,
      costoUnitarioSnapshot: params.precioUnitario,
      costoTotalSnapshot: costoTotal,
      stockAnteriorLitros: tank.stockActualLitros,
      stockPosteriorLitros: tank.stockActualLitros + params.litros,
      usuarioId: params.usuarioId,
      observaciones: `Recepción cisterna ${params.proveedorNombre} - Remito: ${params.numeroRemito || 'S/N'}`
    };

    await tankRepository.addTankMovement(mov);

    await auditRepository.recordAction(
      'comb_tanques',
      tank.id,
      'INGRESO_COMBUSTIBLE_CISTERNA',
      { stockAnterior: mov.stockAnteriorLitros },
      { stockPosterior: mov.stockPosteriorLitros, litros: params.litros, costoTotal },
      `Ingreso de ${params.litros} L en tanque ${tank.codigo} desde ${params.proveedorNombre}`
    );

    return income;
  }

  async registerMeasurement(params: {
    tanqueId: string;
    litrosMedidos: number;
    metodo: MetodoMedicionTanque;
    usuarioId?: string;
    observaciones?: string;
    fechaHora?: string;
  }): Promise<MedicionTanqueCombustible> {
    const tank = await tankRepository.getTankById(params.tanqueId);
    if (!tank) throw new Error(`Tanque ${params.tanqueId} no encontrado`);

    const now = params.fechaHora || new Date().toISOString();
    const stockSistemaMomento = tank.stockActualLitros;
    const diferenciaLitros = Number((params.litrosMedidos - stockSistemaMomento).toFixed(2));

    const measurement: MedicionTanqueCombustible = {
      id: `med-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      empresaId: tank.empresaId,
      tanqueId: tank.id,
      fechaHora: now,
      litrosMedidos: params.litrosMedidos,
      metodo: params.metodo,
      stockSistemaMomento,
      diferenciaLitros,
      usuarioId: params.usuarioId,
      observaciones: params.observaciones
    };

    await tankRepository.addTankMeasurement(measurement);

    // Si la diferencia supera el 3% de la capacidad del tanque, registrar alerta informativa/advertencia
    const umbralAlertaLitros = tank.capacidadLitros * 0.03;
    if (Math.abs(diferenciaLitros) > umbralAlertaLitros) {
      await fuelPerformanceRepository.addAlert({
        id: `alt-dif-${measurement.id}`,
        empresaId: tank.empresaId,
        tipo: 'DIFERENCIA_INVENTARIO',
        severidad: 'ADVERTENCIA',
        titulo: `Diferencia de Inventario en Tanque ${tank.codigo}`,
        descripcion: `Medición física arrojó ${params.litrosMedidos} L vs ${stockSistemaMomento} L teóricos (Diferencia: ${diferenciaLitros > 0 ? '+' : ''}${diferenciaLitros} L).`,
        origenModulo: 'COMBUSTIBLE_MEDICION',
        origenId: measurement.id,
        tanqueId: tank.id,
        fecha: now,
        resuelta: false
      });
    }

    return measurement;
  }

  async registerAdjustment(params: {
    tanqueId: string;
    stockMedido: number;
    motivo: string;
    usuarioId: string;
    fechaHora?: string;
  }): Promise<AjusteTanqueCombustible> {
    const tank = await tankRepository.getTankById(params.tanqueId);
    if (!tank) throw new Error(`Tanque ${params.tanqueId} no encontrado`);
    if (!params.motivo || params.motivo.trim() === '') {
      throw new Error('El motivo del ajuste de inventario es obligatorio');
    }

    const now = params.fechaHora || new Date().toISOString();
    const stockSistemaAntes = tank.stockActualLitros;
    const diferenciaLitros = Number((params.stockMedido - stockSistemaAntes).toFixed(2));

    if (diferenciaLitros === 0) {
      throw new Error('El stock medido coincide exactamente con el stock del sistema. No se requiere ajuste.');
    }

    const tipoAjuste = diferenciaLitros > 0 ? 'POSITIVO' : 'NEGATIVO';
    const litrosMovimiento = Math.abs(diferenciaLitros);

    const mov: MovimientoTanqueCombustible = {
      id: `mov-adj-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      empresaId: tank.empresaId,
      tanqueId: tank.id,
      fechaHora: now,
      tipoMovimiento: tipoAjuste === 'POSITIVO' ? 'AJUSTE_POSITIVO' : 'AJUSTE_NEGATIVO',
      litros: litrosMovimiento,
      origenModulo: 'COMBUSTIBLE_AJUSTE',
      origenId: `adj-${Date.now()}`,
      stockAnteriorLitros: stockSistemaAntes,
      stockPosteriorLitros: params.stockMedido,
      usuarioId: params.usuarioId,
      observaciones: `Ajuste de inventario físico: ${params.motivo}`
    };

    await tankRepository.addTankMovement(mov);

    const adjustment: AjusteTanqueCombustible = {
      id: mov.origenId,
      empresaId: tank.empresaId,
      tanqueId: tank.id,
      fechaHora: now,
      stockSistemaAntes,
      stockMedido: params.stockMedido,
      diferenciaLitros,
      tipoAjuste,
      motivo: params.motivo,
      usuarioId: params.usuarioId,
      movimientoTanqueId: mov.id,
      createdAt: now
    };

    await tankRepository.addTankAdjustment(adjustment);

    await auditRepository.recordAction(
      'comb_tanques',
      tank.id,
      'AJUSTE_INVENTARIO_TANQUE',
      { stockSistemaAntes },
      { stockMedido: params.stockMedido, diferenciaLitros, tipoAjuste, motivo: params.motivo },
      `Ajuste de stock en tanque ${tank.codigo} de ${stockSistemaAntes} L a ${params.stockMedido} L`,
      params.usuarioId
    );

    return adjustment;
  }

  async checkTankAlerts(tanqueId: string): Promise<void> {
    const tank = await tankRepository.getTankById(tanqueId);
    if (!tank) return;

    if (tank.stockActualLitros <= tank.stockMinimoLitros) {
      await fuelPerformanceRepository.addAlert({
        id: `alt-min-${tank.id}-${Date.now()}`,
        empresaId: tank.empresaId,
        tipo: 'TANQUE_BAJO_MINIMO',
        severidad: 'ADVERTENCIA',
        titulo: `Tanque ${tank.codigo} Bajo Stock Mínimo`,
        descripcion: `Stock actual (${tank.stockActualLitros} L) está por debajo o igual al mínimo operativo (${tank.stockMinimoLitros} L).`,
        origenModulo: 'COMBUSTIBLE_TANQUE',
        origenId: tank.id,
        tanqueId: tank.id,
        fecha: new Date().toISOString(),
        resuelta: false
      });
    }
  }
}

export const tankService = new TankService();
