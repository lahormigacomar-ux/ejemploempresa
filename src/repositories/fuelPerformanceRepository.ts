import { ParametroRendimientoEquipo, AlertaCombustible } from '../types';

class FuelPerformanceRepository {
  private parameters: ParametroRendimientoEquipo[] = [];
  private alerts: AlertaCombustible[] = [];

  constructor() {
    this.seedInitialData();
  }

  resetForTesting() {
    this.parameters = [];
    this.alerts = [];
    this.seedInitialData();
  }

  private seedInitialData() {
    this.parameters = [
      {
        id: 'param-mix-default',
        empresaId: 'emp-1',
        tipoEquipo: 'MIXER',
        metrica: 'L_100KM',
        valorObjetivo: 35.0, // 35 L/100 km estándar para Mixer 8m3 cargado
        toleranciaAdvertenciaPct: 15.0, // 15% desvío
        toleranciaCriticaPct: 25.0, // 25% desvío
        vigenciaDesde: '2026-01-01',
        activo: true,
        observaciones: 'Consumo estándar flotas mixer 6x4 y 8x4'
      },
      {
        id: 'param-car-default',
        empresaId: 'emp-1',
        tipoEquipo: 'CARGADORA',
        metrica: 'L_HORA',
        valorObjetivo: 14.0, // 14 L/h estándar para cargadora frontal 2.5 m3
        toleranciaAdvertenciaPct: 15.0,
        toleranciaCriticaPct: 25.0,
        vigenciaDesde: '2026-01-01',
        activo: true,
        observaciones: 'Consumo estándar cargadora frontal en acopio y tolvas'
      },
      {
        id: 'param-cam-default',
        empresaId: 'emp-1',
        tipoEquipo: 'CAMION',
        metrica: 'L_100KM',
        valorObjetivo: 28.0, // 28 L/100 km para batea / volcador
        toleranciaAdvertenciaPct: 10.0,
        toleranciaCriticaPct: 20.0,
        vigenciaDesde: '2026-01-01',
        activo: true,
        observaciones: 'Consumo estándar camión batea áridos'
      },
      {
        id: 'param-bomba-default',
        empresaId: 'emp-1',
        tipoEquipo: 'BOMBA',
        metrica: 'L_HORA',
        valorObjetivo: 22.0, // 22 L/h bomba de pluma
        toleranciaAdvertenciaPct: 15.0,
        toleranciaCriticaPct: 30.0,
        vigenciaDesde: '2026-01-01',
        activo: true,
        observaciones: 'Consumo operativo de bombeo continuo'
      }
    ];

    this.alerts = [
      {
        id: 'alt-demo-01',
        empresaId: 'emp-1',
        tipo: 'TANQUE_BAJO_MINIMO',
        severidad: 'ADVERTENCIA',
        titulo: 'Stock Próximo al Mínimo Operativo',
        descripcion: 'El tanque TQ-PL2-02 (Cantera) se encuentra cerca del umbral de reserva.',
        origenModulo: 'COMBUSTIBLE_TANQUE',
        origenId: 'tq-pl2-cantera-02',
        tanqueId: 'tq-pl2-cantera-02',
        fecha: '2026-09-30T10:30:00Z',
        resuelta: false
      }
    ];
  }

  async getParameters(
    empresaId: string = 'emp-1',
    equipoId?: string,
    tipoEquipo?: string,
    fecha: string = new Date().toISOString().split('T')[0]
  ): Promise<ParametroRendimientoEquipo | null> {
    const activeParams = this.parameters
      .filter(p => {
        if (p.empresaId !== empresaId || !p.activo) return false;
        if (fecha < p.vigenciaDesde) return false;
        if (p.vigenciaHasta && fecha > p.vigenciaHasta) return false;
        return true;
      })
      .sort((a, b) => b.vigenciaDesde.localeCompare(a.vigenciaDesde));

    // 1. Coincidencia específica por equipoId
    if (equipoId) {
      const specific = activeParams.find(p => p.equipoId === equipoId);
      if (specific) return specific;
    }

    // 2. Coincidencia por tipo de equipo
    if (tipoEquipo) {
      const byType = activeParams.find(p => p.tipoEquipo === tipoEquipo);
      if (byType) return byType;
    }

    return null;
  }

  async getAllParameters(empresaId: string = 'emp-1'): Promise<ParametroRendimientoEquipo[]> {
    return this.parameters.filter(p => p.empresaId === empresaId);
  }

  async saveParameter(param: ParametroRendimientoEquipo): Promise<ParametroRendimientoEquipo> {
    const idx = this.parameters.findIndex(p => p.id === param.id);
    if (idx >= 0) {
      this.parameters[idx] = param;
    } else {
      this.parameters.push(param);
    }
    return param;
  }

  async addAlert(alert: AlertaCombustible): Promise<AlertaCombustible> {
    this.alerts.push(alert);
    return alert;
  }

  async getAlerts(empresaId: string = 'emp-1', resuelta?: boolean): Promise<AlertaCombustible[]> {
    return this.alerts.filter(a => {
      if (a.empresaId !== empresaId) return false;
      if (resuelta !== undefined && a.resuelta !== resuelta) return false;
      return true;
    });
  }

  async resolveAlert(alertId: string, usuarioId: string = 'admin'): Promise<AlertaCombustible> {
    const alert = this.alerts.find(a => a.id === alertId);
    if (!alert) throw new Error(`Alerta ${alertId} no encontrada`);
    alert.resuelta = true;
    alert.resueltaPor = usuarioId;
    alert.fechaResolucion = new Date().toISOString();
    return alert;
  }
}

export const fuelPerformanceRepository = new FuelPerformanceRepository();
