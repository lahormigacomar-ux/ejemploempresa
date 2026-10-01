import { SolicitudCompra, SolicitudCompraItem } from '../types';

class PurchaseRequestRepository {
  private requests: Map<string, SolicitudCompra> = new Map();
  private sequenceCounters: Map<string, number> = new Map();

  constructor() {
    this.seedInitialData();
  }

  resetForTesting() {
    this.requests.clear();
    this.sequenceCounters.clear();
    this.seedInitialData();
  }

  private seedInitialData() {
    const defaultRequests: SolicitudCompra[] = [
      {
        id: 'sc-001',
        empresaId: 'emp-1',
        numero: 'SC-000001',
        fechaSolicitud: '2026-09-25T09:00:00Z',
        solicitanteEmpleadoId: 'emp-1',
        sector: 'PLANTA_HORMIGON',
        plantaId: 'planta-1',
        centroCostoId: 'cc-hormigon',
        prioridad: 'ALTA',
        motivo: 'Reposición mensual de Cemento Portland a granel para silos de Planta Central',
        estado: 'APROBADA',
        fechaNecesidad: '2026-10-02',
        origenModulo: 'MANUAL',
        requiereAprobacion: true,
        aprobadorId: 'emp-1',
        fechaAprobacion: '2026-09-25T14:00:00Z',
        comentarioAprobacion: 'Aprobado según proyección de producción de 3.000 m3',
        items: [
          {
            id: 'item-sc-101',
            solicitudId: 'sc-001',
            tipo: 'ARTICULO',
            articuloId: 'art-cemento-cp40',
            descripcionSnapshot: 'Cemento Portland Normal a Granel (CP40)',
            cantidad: 60,
            unidadMedida: 'TN',
            centroCostoId: 'cc-hormigon',
            cantidadOrdenada: 0,
            cantidadPendiente: 60
          }
        ],
        createdAt: '2026-09-25T09:00:00Z',
        updatedAt: '2026-09-25T14:00:00Z'
      },
      {
        id: 'sc-002',
        empresaId: 'emp-1',
        numero: 'SC-000002',
        fechaSolicitud: '2026-09-28T11:30:00Z',
        solicitanteEmpleadoId: 'emp-4',
        sector: 'TALLER',
        plantaId: 'planta-1',
        centroCostoId: 'cc-taller',
        prioridad: 'URGENTE',
        motivo: 'Juego de filtros y correas para Service Preventivo 500h de Cargadora CAR-01',
        estado: 'PENDIENTE_APROBACION',
        fechaNecesidad: '2026-10-01',
        origenModulo: 'MANTENIMIENTO',
        origenId: 'ot-demo-01',
        requiereAprobacion: true,
        items: [
          {
            id: 'item-sc-201',
            solicitudId: 'sc-002',
            tipo: 'ARTICULO',
            articuloId: 'art-filtro-aceite-cat',
            descripcionSnapshot: 'Kit Filtros de Aceite y Combustible Caterpillar 950GC',
            cantidad: 2,
            unidadMedida: 'UNIDAD',
            equipoId: 'eq-car-01',
            ordenTrabajoId: 'ot-demo-01',
            centroCostoId: 'cc-aridos',
            cantidadOrdenada: 0,
            cantidadPendiente: 2
          }
        ],
        createdAt: '2026-09-28T11:30:00Z',
        updatedAt: '2026-09-28T11:30:00Z'
      }
    ];

    defaultRequests.forEach(r => this.requests.set(r.id, r));
    this.sequenceCounters.set('emp-1', 2);
  }

  async getAll(filter?: {
    empresaId?: string;
    estado?: string;
    prioridad?: string;
    solicitanteId?: string;
    sector?: string;
  }): Promise<SolicitudCompra[]> {
    let list = Array.from(this.requests.values());
    if (!filter) return list.sort((a, b) => b.fechaSolicitud.localeCompare(a.fechaSolicitud));

    if (filter.empresaId) list = list.filter(r => r.empresaId === filter.empresaId);
    if (filter.estado) list = list.filter(r => r.estado === filter.estado);
    if (filter.prioridad) list = list.filter(r => r.prioridad === filter.prioridad);
    if (filter.solicitanteId) list = list.filter(r => r.solicitanteEmpleadoId === filter.solicitanteId);
    if (filter.sector) list = list.filter(r => r.sector === filter.sector);

    return list.sort((a, b) => b.fechaSolicitud.localeCompare(a.fechaSolicitud));
  }

  async getById(id: string): Promise<SolicitudCompra | null> {
    return this.requests.get(id) || null;
  }

  async getByNumero(empresaId: string, numero: string): Promise<SolicitudCompra | null> {
    const list = Array.from(this.requests.values());
    return list.find(r => r.empresaId === empresaId && r.numero === numero) || null;
  }

  async getNextNumero(empresaId: string = 'emp-1'): Promise<string> {
    const current = this.sequenceCounters.get(empresaId) || 0;
    const next = current + 1;
    this.sequenceCounters.set(empresaId, next);
    return `SC-${next.toString().padStart(6, '0')}`;
  }

  async save(req: SolicitudCompra): Promise<SolicitudCompra> {
    req.updatedAt = new Date().toISOString();
    this.requests.set(req.id, req);
    return req;
  }
}

export const purchaseRequestRepository = new PurchaseRequestRepository();
