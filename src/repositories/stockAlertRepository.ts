import { AlertaStock } from '../types';

class StockAlertRepository {
  private alerts: AlertaStock[] = [];

  constructor() {
    this.seedInitialData();
  }

  resetForTesting() {
    this.alerts = [];
    this.seedInitialData();
  }

  private seedInitialData() {
    this.alerts = [
      {
        id: 'alt-stk-001',
        empresaId: 'emp-1',
        tipo: 'PUNTO_REPOSICION',
        severidad: 'ADVERTENCIA',
        titulo: 'Stock en Punto de Reposición: Alternador 24V',
        descripcion: 'El artículo Alternador 24V 80A Bosch (ART-ALT-24V) en Depósito Central posee 1 unidad disponible (Punto reposición: 2 unidades).',
        articuloId: 'art-rep-alternador',
        depositoId: 'dep-central',
        fecha: '2026-09-29T15:00:00Z',
        resuelta: false
      }
    ];
  }

  async getAll(empresaId: string = 'emp-1', soloActivas: boolean = true): Promise<AlertaStock[]> {
    let list = this.alerts.filter(a => a.empresaId === empresaId);
    if (soloActivas) {
      list = list.filter(a => !a.resuelta);
    }
    return list.sort((a, b) => b.fecha.localeCompare(a.fecha));
  }

  async addAlert(alert: AlertaStock): Promise<AlertaStock> {
    this.alerts.push(alert);
    return alert;
  }

  async resolveAlert(id: string, usuarioId: string = 'admin'): Promise<AlertaStock | null> {
    const alert = this.alerts.find(a => a.id === id);
    if (!alert) return null;
    alert.resuelta = true;
    alert.resueltaPor = usuarioId;
    alert.fechaResolucion = new Date().toISOString();
    return alert;
  }
}

export const stockAlertRepository = new StockAlertRepository();
