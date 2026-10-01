import {
  TipoCombustible,
  TanqueCombustible,
  MovimientoTanqueCombustible,
  IngresoTanqueCombustible,
  MedicionTanqueCombustible,
  AjusteTanqueCombustible
} from '../types';

class TankRepository {
  private fuelTypes: TipoCombustible[] = [];
  private tanks: Map<string, TanqueCombustible> = new Map();
  private movements: MovimientoTanqueCombustible[] = [];
  private incomes: IngresoTanqueCombustible[] = [];
  private measurements: MedicionTanqueCombustible[] = [];
  private adjustments: AjusteTanqueCombustible[] = [];

  constructor() {
    this.seedInitialData();
  }

  resetForTesting() {
    this.fuelTypes = [];
    this.tanks.clear();
    this.movements = [];
    this.incomes = [];
    this.measurements = [];
    this.adjustments = [];
    this.seedInitialData();
  }

  private seedInitialData() {
    this.fuelTypes = [
      {
        id: 'fuel-diesel-500',
        empresaId: 'emp-1',
        codigo: 'DIESEL_500',
        nombre: 'Gasoil Grado 2 (Diesel 500 / Ultragasolina)',
        unidadMedida: 'LITRO',
        activo: true,
        precioReferencia: 1150
      },
      {
        id: 'fuel-diesel-prem',
        empresaId: 'emp-1',
        codigo: 'DIESEL_PREMIUM',
        nombre: 'Gasoil Grado 3 (Infinia Diesel / Euro)',
        unidadMedida: 'LITRO',
        activo: true,
        precioReferencia: 1350
      },
      {
        id: 'fuel-nafta-sup',
        empresaId: 'emp-1',
        codigo: 'NAFTA_SUPER',
        nombre: 'Nafta Súper',
        unidadMedida: 'LITRO',
        activo: true,
        precioReferencia: 1100
      },
      {
        id: 'fuel-urea',
        empresaId: 'emp-1',
        codigo: 'UREA_ADBLUE',
        nombre: 'Agente Reductor Urea / Arnox 32 (AdBlue)',
        unidadMedida: 'LITRO',
        activo: true,
        precioReferencia: 850
      }
    ];

    const defaultTanks: TanqueCombustible[] = [
      {
        id: 'tq-pl1-diesel-01',
        empresaId: 'emp-1',
        codigo: 'TQ-PL1-01',
        nombre: 'Tanque Principal Hormigón (Cisterna 15.000 L)',
        tipoCombustibleId: 'fuel-diesel-500',
        capacidadLitros: 15000,
        plantaId: 'planta-1',
        centroCostoId: 'cc-transporte',
        estado: 'ACTIVO',
        stockActualLitros: 8500,
        stockMinimoLitros: 2500,
        permiteStockNegativo: false,
        observaciones: 'Tanque subterráneo con surtidor de alto caudal y telemetría de corte',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-09-30T12:00:00Z'
      },
      {
        id: 'tq-pl2-cantera-02',
        empresaId: 'emp-1',
        codigo: 'TQ-PL2-02',
        nombre: 'Tanque Cantera Áridos (Aéreo 8.000 L)',
        tipoCombustibleId: 'fuel-diesel-500',
        capacidadLitros: 8000,
        plantaId: 'planta-2',
        centroCostoId: 'cc-aridos',
        estado: 'ACTIVO',
        stockActualLitros: 3200,
        stockMinimoLitros: 1500,
        permiteStockNegativo: false,
        observaciones: 'Tanque aéreo móvil para abastecimiento de cargadoras y tolvas',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-09-30T12:00:00Z'
      }
    ];

    defaultTanks.forEach(t => this.tanks.set(t.id, t));

    // Seed movimiento inicial
    this.movements.push({
      id: 'mov-init-01',
      empresaId: 'emp-1',
      tanqueId: 'tq-pl1-diesel-01',
      fechaHora: '2026-09-20T08:00:00Z',
      tipoMovimiento: 'INGRESO',
      litros: 10000,
      origenModulo: 'COMBUSTIBLE_INGRESO',
      origenId: 'ing-init-01',
      costoUnitarioSnapshot: 1150,
      costoTotalSnapshot: 11500000,
      stockAnteriorLitros: 0,
      stockPosteriorLitros: 10000,
      usuarioId: 'usr-admin',
      observaciones: 'Carga inicial de cisterna'
    });
  }

  async getFuelTypes(empresaId: string = 'emp-1'): Promise<TipoCombustible[]> {
    return this.fuelTypes.filter(f => f.empresaId === empresaId && f.activo);
  }

  async getFuelTypeById(id: string): Promise<TipoCombustible | null> {
    return this.fuelTypes.find(f => f.id === id) || null;
  }

  async getAllTanks(empresaId: string = 'emp-1'): Promise<TanqueCombustible[]> {
    return Array.from(this.tanks.values()).filter(t => t.empresaId === empresaId);
  }

  async getTankById(id: string): Promise<TanqueCombustible | null> {
    return this.tanks.get(id) || null;
  }

  async saveTank(tank: TanqueCombustible): Promise<TanqueCombustible> {
    this.tanks.set(tank.id, { ...tank, updatedAt: new Date().toISOString() });
    return tank;
  }

  async addTankMovement(mov: MovimientoTanqueCombustible): Promise<MovimientoTanqueCombustible> {
    const tank = this.tanks.get(mov.tanqueId);
    if (!tank) throw new Error(`Tanque ${mov.tanqueId} no encontrado`);

    mov.stockAnteriorLitros = tank.stockActualLitros;

    if (mov.tipoMovimiento === 'INGRESO' || mov.tipoMovimiento === 'AJUSTE_POSITIVO') {
      tank.stockActualLitros += mov.litros;
    } else if (mov.tipoMovimiento === 'EGRESO' || mov.tipoMovimiento === 'AJUSTE_NEGATIVO') {
      if (!tank.permiteStockNegativo && tank.stockActualLitros < mov.litros) {
        throw new Error(
          `Stock insuficiente en el tanque ${tank.codigo}: Disponible ${tank.stockActualLitros} L, requerido ${mov.litros} L`
        );
      }
      tank.stockActualLitros -= mov.litros;
    }

    mov.stockPosteriorLitros = tank.stockActualLitros;
    tank.updatedAt = new Date().toISOString();

    this.tanks.set(tank.id, tank);
    this.movements.push(mov);
    return mov;
  }

  async addTankIncome(income: IngresoTanqueCombustible): Promise<IngresoTanqueCombustible> {
    this.incomes.push(income);
    return income;
  }

  async getTankMovements(tanqueId?: string): Promise<MovimientoTanqueCombustible[]> {
    if (tanqueId) {
      return this.movements.filter(m => m.tanqueId === tanqueId);
    }
    return [...this.movements];
  }

  async getTankIncomes(tanqueId?: string): Promise<IngresoTanqueCombustible[]> {
    if (tanqueId) {
      return this.incomes.filter(i => i.tanqueId === tanqueId);
    }
    return [...this.incomes];
  }

  async addTankMeasurement(measurement: MedicionTanqueCombustible): Promise<MedicionTanqueCombustible> {
    this.measurements.push(measurement);
    return measurement;
  }

  async getTankMeasurements(tanqueId?: string): Promise<MedicionTanqueCombustible[]> {
    if (tanqueId) {
      return this.measurements.filter(m => m.tanqueId === tanqueId);
    }
    return [...this.measurements];
  }

  async addTankAdjustment(adj: AjusteTanqueCombustible): Promise<AjusteTanqueCombustible> {
    this.adjustments.push(adj);
    return adj;
  }

  async getTankAdjustments(tanqueId?: string): Promise<AjusteTanqueCombustible[]> {
    if (tanqueId) {
      return this.adjustments.filter(a => a.tanqueId === tanqueId);
    }
    return [...this.adjustments];
  }
}

export const tankRepository = new TankRepository();
