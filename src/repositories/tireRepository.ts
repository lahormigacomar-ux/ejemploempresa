import { Neumatico, MovimientoNeumatico, MedicionNeumatico, EstadoNeumatico } from '../types';
import { auditRepository } from './auditRepository';

class TireRepository {
  private tires: Map<string, Neumatico> = new Map();
  private movements: Map<string, MovimientoNeumatico[]> = new Map();
  private measurements: Map<string, MedicionNeumatico[]> = new Map();

  constructor() {
    this.seedInitialData();
  }

  resetForTesting() {
    this.tires.clear();
    this.movements.clear();
    this.measurements.clear();
    this.seedInitialData();
  }

  private seedInitialData() {
    const defaultTires: Neumatico[] = [
      {
        id: 'neu-101',
        empresaId: 'emp-1',
        codigoInterno: 'NEU-101',
        marca: 'Michelin',
        modelo: 'X Works HD D',
        medida: '295/80 R22.5',
        numeroSerie: 'MICH-88492-1',
        dot: '1424',
        estado: 'INSTALADO',
        fechaCompra: '2025-02-10',
        costoCompra: 480000,
        costoAcumuladoReparaciones: 35000,
        costoTotalAcumulado: 515000,
        kmActualesTotales: 28400,
        profundidadDibujoMm: 12.5,
        vecesRecapado: 0,
        equipoActualId: 'eq-mix-12',
        posicionActual: 'EJE_1_IZQ',
        fechaInstalacionActual: '2025-02-15',
        kmInstalacionActual: 40100
      },
      {
        id: 'neu-102',
        empresaId: 'emp-1',
        codigoInterno: 'NEU-102',
        marca: 'Michelin',
        modelo: 'X Works HD D',
        medida: '295/80 R22.5',
        numeroSerie: 'MICH-88492-2',
        dot: '1424',
        estado: 'INSTALADO',
        fechaCompra: '2025-02-10',
        costoCompra: 480000,
        costoAcumuladoReparaciones: 0,
        costoTotalAcumulado: 480000,
        kmActualesTotales: 28400,
        profundidadDibujoMm: 13.0,
        vecesRecapado: 0,
        equipoActualId: 'eq-mix-12',
        posicionActual: 'EJE_1_DER',
        fechaInstalacionActual: '2025-02-15',
        kmInstalacionActual: 40100
      },
      {
        id: 'neu-103',
        empresaId: 'emp-1',
        codigoInterno: 'NEU-103',
        marca: 'Bridgestone',
        modelo: 'M729 EVO',
        medida: '295/80 R22.5',
        numeroSerie: 'BRI-99120-4',
        dot: '4023',
        estado: 'EN_STOCK',
        fechaCompra: '2025-08-01',
        costoCompra: 450000,
        costoAcumuladoReparaciones: 0,
        costoTotalAcumulado: 450000,
        kmActualesTotales: 0,
        profundidadDibujoMm: 16.0,
        vecesRecapado: 0
      },
      {
        id: 'neu-104',
        empresaId: 'emp-1',
        codigoInterno: 'NEU-104',
        marca: 'Pirelli',
        modelo: 'FG:01 II',
        medida: '295/80 R22.5',
        numeroSerie: 'PIR-7711-8',
        dot: '1222',
        estado: 'EN_REPARACION',
        fechaCompra: '2024-03-12',
        costoCompra: 390000,
        costoAcumuladoReparaciones: 85000,
        costoTotalAcumulado: 475000,
        kmActualesTotales: 64000,
        profundidadDibujoMm: 7.2,
        vecesRecapado: 1,
        observaciones: 'Enviado a gomería oficial por desgarro en hombro'
      }
    ];

    defaultTires.forEach(t => {
      this.tires.set(t.id, t);
      this.movements.set(t.id, [
        {
          id: `mov-${t.id}-1`,
          neumaticoId: t.id,
          tipoMovimiento: 'INGRESO_COMPRA',
          fecha: t.fechaCompra,
          kmEquipo: 0,
          costoAsociado: t.costoCompra,
          motivo: 'Ingreso al inventario de neumáticos nuevos'
        }
      ]);
    });
  }

  async getAllTires(): Promise<Neumatico[]> {
    return Array.from(this.tires.values());
  }

  async getTireById(id: string): Promise<Neumatico | null> {
    return this.tires.get(id) || null;
  }

  async getTiresByEquipment(equipoId: string): Promise<Neumatico[]> {
    const list = Array.from(this.tires.values());
    return list.filter(t => t.equipoActualId === equipoId);
  }

  async installTire(
    neumaticoId: string,
    equipoId: string,
    posicion: string,
    kmEquipo: number,
    usuario: string = 'admin_taller'
  ): Promise<Neumatico> {
    const tire = this.tires.get(neumaticoId);
    if (!tire) throw new Error(`Neumático ${neumaticoId} no existe`);

    if (tire.estado === 'INSTALADO' && tire.equipoActualId) {
      throw new Error(`El neumático ${tire.codigoInterno} ya se encuentra instalado en el equipo ${tire.equipoActualId} (${tire.posicionActual})`);
    }

    // Verificar que la posición en ese equipo no esté ya ocupada por otro neumático
    const currentOnPos = Array.from(this.tires.values()).find(
      t => t.equipoActualId === equipoId && t.posicionActual === posicion && t.id !== neumaticoId
    );
    if (currentOnPos) {
      throw new Error(`La posición ${posicion} en el equipo ${equipoId} ya está ocupada por el neumático ${currentOnPos.codigoInterno}`);
    }

    const posAnterior = tire.posicionActual;
    const eqAnterior = tire.equipoActualId;

    tire.estado = 'INSTALADO';
    tire.equipoActualId = equipoId;
    tire.posicionActual = posicion;
    tire.fechaInstalacionActual = new Date().toISOString().split('T')[0];
    tire.kmInstalacionActual = kmEquipo;

    this.tires.set(neumaticoId, tire);

    const mov: MovimientoNeumatico = {
      id: `mov-${Date.now()}`,
      neumaticoId,
      equipoId,
      tipoMovimiento: 'INSTALACION',
      posicionOrigen: posAnterior || 'STOCK',
      posicionDestino: posicion,
      fecha: new Date().toISOString().split('T')[0],
      kmEquipo,
      costoAsociado: 0,
      motivo: `Montaje en equipo ${equipoId} posición ${posicion}`
    };

    const movList = this.movements.get(neumaticoId) || [];
    movList.push(mov);
    this.movements.set(neumaticoId, movList);

    await auditRepository.recordAction(
      'mant_neumaticos',
      neumaticoId,
      'INSTALACION_NEUMATICO',
      { equipoActualId: eqAnterior, posicionActual: posAnterior },
      { equipoActualId: equipoId, posicionActual: posicion, kmInstalacionActual: kmEquipo },
      `Instalación de cubierta en ${posicion}`
    );

    return tire;
  }

  async removeTire(
    neumaticoId: string,
    kmEquipoActual: number,
    nuevoEstado: 'EN_STOCK' | 'EN_REPARACION' | 'RECAPADO' | 'BAJA' = 'EN_STOCK',
    motivo: string = 'Desmonte para rotación/reparación',
    usuario: string = 'admin_taller'
  ): Promise<Neumatico> {
    const tire = this.tires.get(neumaticoId);
    if (!tire) throw new Error(`Neumático ${neumaticoId} no existe`);
    if (tire.estado !== 'INSTALADO') {
      throw new Error(`El neumático ${tire.codigoInterno} no está actualmente instalado.`);
    }

    const kmRecorridosEnTramo = kmEquipoActual - (tire.kmInstalacionActual || kmEquipoActual);
    if (kmRecorridosEnTramo > 0) {
      tire.kmActualesTotales += kmRecorridosEnTramo;
    }

    const eqAnterior = tire.equipoActualId;
    const posAnterior = tire.posicionActual;

    tire.estado = nuevoEstado;
    tire.equipoActualId = undefined;
    tire.posicionActual = undefined;
    tire.fechaInstalacionActual = undefined;
    tire.kmInstalacionActual = undefined;

    this.tires.set(neumaticoId, tire);

    const mov: MovimientoNeumatico = {
      id: `mov-${Date.now()}`,
      neumaticoId,
      equipoId: eqAnterior,
      tipoMovimiento: 'DESMONTE',
      posicionOrigen: posAnterior,
      posicionDestino: nuevoEstado,
      fecha: new Date().toISOString().split('T')[0],
      kmEquipo: kmEquipoActual,
      costoAsociado: 0,
      motivo: `${motivo} (Km tramo: ${kmRecorridosEnTramo})`
    };

    const movList = this.movements.get(neumaticoId) || [];
    movList.push(mov);
    this.movements.set(neumaticoId, movList);

    await auditRepository.recordAction(
      'mant_neumaticos',
      neumaticoId,
      'DESMONTE_NEUMATICO',
      { equipoActualId: eqAnterior, posicionActual: posAnterior },
      { nuevoEstado, kmActualesTotales: tire.kmActualesTotales },
      motivo
    );

    return tire;
  }

  async addMaintenanceCostToTire(
    neumaticoId: string,
    costo: number,
    tipo: 'REPARACION' | 'RECAPADO',
    detalle: string
  ): Promise<Neumatico> {
    const tire = this.tires.get(neumaticoId);
    if (!tire) throw new Error(`Neumático ${neumaticoId} no existe`);

    tire.costoAcumuladoReparaciones += costo;
    tire.costoTotalAcumulado = tire.costoCompra + tire.costoAcumuladoReparaciones;
    if (tipo === 'RECAPADO') {
      tire.vecesRecapado += 1;
      tire.profundidadDibujoMm = 15.0; // Restablece dibujo tras recapado
    }

    this.tires.set(neumaticoId, tire);

    const mov: MovimientoNeumatico = {
      id: `mov-${Date.now()}`,
      neumaticoId,
      tipoMovimiento: tipo === 'RECAPADO' ? 'RETORNO_RECAPADO' : 'RETORNO_REPARACION',
      fecha: new Date().toISOString().split('T')[0],
      kmEquipo: 0,
      costoAsociado: costo,
      motivo: `${tipo}: ${detalle}`
    };

    const movList = this.movements.get(neumaticoId) || [];
    movList.push(mov);
    this.movements.set(neumaticoId, movList);

    return tire;
  }

  async getMovementHistory(neumaticoId: string): Promise<MovimientoNeumatico[]> {
    return this.movements.get(neumaticoId) || [];
  }
}

export const tireRepository = new TireRepository();
