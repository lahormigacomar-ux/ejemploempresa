import { AbastecimientoCombustible } from '../types';

class FuelRepository {
  private supplies: Map<string, AbastecimientoCombustible> = new Map();
  private eventIndex: Map<string, string> = new Map(); // eventId -> supplyId

  constructor() {
    this.seedInitialData();
  }

  resetForTesting() {
    this.supplies.clear();
    this.eventIndex.clear();
    this.seedInitialData();
  }

  private seedInitialData() {
    const defaultSupplies: AbastecimientoCombustible[] = [
      {
        id: 'abs-001',
        empresaId: 'emp-1',
        numeroVale: 'VALE-001001',
        fechaHora: '2026-09-27T07:30:00Z',
        equipoId: 'eq-mix-12',
        empleadoId: 'emp-1',
        tipoCombustibleId: 'fuel-diesel-500',
        origenAbastecimiento: 'TANQUE_INTERNO',
        tanqueId: 'tq-pl1-diesel-01',
        litros: 120,
        precioUnitarioSnapshot: 1150,
        costoTotalSnapshot: 138000,
        odometroKmSnapshot: 68150,
        odometroKmAnteriorSnapshot: 67800,
        kmRecorridosEstimados: 350,
        rendimientoCalculado: 34.29, // 120 / 3.5 = 34.29 L/100km
        metricaRendimiento: 'L_100KM',
        nivelDesvio: 'NORMAL',
        centroCostoId: 'cc-transporte',
        numeroComprobante: 'VAL-001001',
        estado: 'CONFIRMADO',
        createdAt: '2026-09-27T07:30:00Z',
        updatedAt: '2026-09-27T07:30:00Z'
      },
      {
        id: 'abs-002',
        empresaId: 'emp-1',
        numeroVale: 'VALE-001002',
        fechaHora: '2026-09-29T18:00:00Z',
        equipoId: 'eq-mix-12',
        empleadoId: 'emp-1',
        tipoCombustibleId: 'fuel-diesel-500',
        origenAbastecimiento: 'TANQUE_INTERNO',
        tanqueId: 'tq-pl1-diesel-01',
        litros: 125,
        precioUnitarioSnapshot: 1150,
        costoTotalSnapshot: 143750,
        odometroKmSnapshot: 68500,
        odometroKmAnteriorSnapshot: 68150,
        kmRecorridosEstimados: 350,
        rendimientoCalculado: 35.71, // 125 / 3.5 = 35.71 L/100km
        metricaRendimiento: 'L_100KM',
        nivelDesvio: 'NORMAL',
        centroCostoId: 'cc-transporte',
        numeroComprobante: 'VAL-001002',
        estado: 'CONFIRMADO',
        createdAt: '2026-09-29T18:00:00Z',
        updatedAt: '2026-09-29T18:00:00Z'
      },
      {
        id: 'abs-003',
        empresaId: 'emp-1',
        numeroVale: 'VALE-002001',
        fechaHora: '2026-09-28T08:00:00Z',
        equipoId: 'eq-car-01',
        empleadoId: 'emp-3',
        tipoCombustibleId: 'fuel-diesel-500',
        origenAbastecimiento: 'TANQUE_INTERNO',
        tanqueId: 'tq-pl2-cantera-02',
        litros: 140,
        precioUnitarioSnapshot: 1150,
        costoTotalSnapshot: 161000,
        horometroHsSnapshot: 5600,
        horometroHsAnteriorSnapshot: 5590,
        horasTrabajadasEstimadas: 10,
        rendimientoCalculado: 14.0, // 140 / 10 = 14 L/h
        metricaRendimiento: 'L_HORA',
        nivelDesvio: 'NORMAL',
        centroCostoId: 'cc-aridos',
        numeroComprobante: 'VAL-002001',
        estado: 'CONFIRMADO',
        createdAt: '2026-09-28T08:00:00Z',
        updatedAt: '2026-09-28T08:00:00Z'
      }
    ];

    defaultSupplies.forEach(s => {
      this.supplies.set(s.id, s);
      if (s.eventId) this.eventIndex.set(s.eventId, s.id);
    });
  }

  async getAllSupplies(filter?: {
    empresaId?: string;
    equipoId?: string;
    tanqueId?: string;
    estado?: string;
    fechaDesde?: string;
    fechaHasta?: string;
  }): Promise<AbastecimientoCombustible[]> {
    let list = Array.from(this.supplies.values());
    if (!filter) return list.sort((a, b) => b.fechaHora.localeCompare(a.fechaHora));

    if (filter.empresaId) list = list.filter(s => s.empresaId === filter.empresaId);
    if (filter.equipoId) list = list.filter(s => s.equipoId === filter.equipoId);
    if (filter.tanqueId) list = list.filter(s => s.tanqueId === filter.tanqueId);
    if (filter.estado) list = list.filter(s => s.estado === filter.estado);
    if (filter.fechaDesde) list = list.filter(s => s.fechaHora >= filter.fechaDesde!);
    if (filter.fechaHasta) list = list.filter(s => s.fechaHora <= filter.fechaHasta!);

    return list.sort((a, b) => b.fechaHora.localeCompare(a.fechaHora));
  }

  async getSupplyById(id: string): Promise<AbastecimientoCombustible | null> {
    return this.supplies.get(id) || null;
  }

  async getSupplyByEventId(eventId: string): Promise<AbastecimientoCombustible | null> {
    const supplyId = this.eventIndex.get(eventId);
    if (!supplyId) return null;
    return this.supplies.get(supplyId) || null;
  }

  async getLastSupplyForEquipment(
    equipoId: string,
    beforeDate?: string
  ): Promise<AbastecimientoCombustible | null> {
    const equipoSupplies = Array.from(this.supplies.values())
      .filter(s => s.equipoId === equipoId && s.estado === 'CONFIRMADO')
      .filter(s => (beforeDate ? s.fechaHora <= beforeDate : true))
      .sort((a, b) => b.fechaHora.localeCompare(a.fechaHora));

    return equipoSupplies[0] || null;
  }

  async saveSupply(supply: AbastecimientoCombustible): Promise<AbastecimientoCombustible> {
    this.supplies.set(supply.id, { ...supply, updatedAt: new Date().toISOString() });
    if (supply.eventId) {
      this.eventIndex.set(supply.eventId, supply.id);
    }
    return supply;
  }
}

export const fuelRepository = new FuelRepository();
