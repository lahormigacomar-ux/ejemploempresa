import {
  SolicitudCompra,
  SolicitudCompraItem,
  PrioridadSolicitud,
  TipoItemCompra
} from '../types';
import { purchaseRequestRepository } from '../repositories/purchaseRequestRepository';
import { employeeRepository } from '../repositories/employeeRepository';
import { auditRepository } from '../repositories/auditRepository';

export class PurchaseRequestService {
  async createRequest(params: {
    empresaId?: string;
    solicitanteEmpleadoId: string;
    sector: string;
    plantaId?: string;
    centroCostoId?: string;
    prioridad?: PrioridadSolicitud;
    motivo: string;
    fechaNecesidad?: string;
    origenModulo?: 'MANUAL' | 'MANTENIMIENTO' | 'STOCK' | 'COMBUSTIBLE' | 'PRODUCCION' | 'RRHH' | 'OTRO';
    origenId?: string;
    requiereAprobacion?: boolean;
    observaciones?: string;
    items: {
      tipo: TipoItemCompra;
      articuloId?: string;
      descripcion: string;
      cantidad: number;
      unidadMedida: string;
      centroCostoId?: string;
      equipoId?: string;
      ordenTrabajoId?: string;
      observaciones?: string;
    }[];
    usuarioId?: string;
  }): Promise<SolicitudCompra> {
    const empresaId = params.empresaId || 'emp-1';

    // 1. Validar empleado solicitante
    const solicitante = await employeeRepository.getById(params.solicitanteEmpleadoId);
    if (!solicitante) {
      throw new Error(`Empleado solicitante ${params.solicitanteEmpleadoId} no encontrado en RRHH`);
    }
    if (solicitante.estado !== 'ACTIVO') {
      throw new Error(`El solicitante no se encuentra en estado ACTIVO (Estado: ${solicitante.estado})`);
    }

    if (!params.motivo || params.motivo.trim() === '') {
      throw new Error('El motivo de la solicitud de compra es obligatorio');
    }
    if (!params.items || params.items.length === 0) {
      throw new Error('La solicitud de compra debe contener al menos un item');
    }

    for (const item of params.items) {
      if (!item.descripcion || item.descripcion.trim() === '') {
        throw new Error('Todos los items deben tener una descripción válida');
      }
      if (item.cantidad <= 0) {
        throw new Error(`La cantidad del item "${item.descripcion}" debe ser mayor a 0`);
      }
    }

    const id = `sc-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
    const numero = await purchaseRequestRepository.getNextNumero(empresaId);
    const now = new Date().toISOString();
    const requiereAprob = params.requiereAprobacion ?? true;

    const requestItems: SolicitudCompraItem[] = params.items.map((it, idx) => ({
      id: `sc-item-${id}-${idx + 1}`,
      solicitudId: id,
      tipo: it.tipo,
      articuloId: it.articuloId,
      descripcionSnapshot: it.descripcion.trim(),
      cantidad: it.cantidad,
      unidadMedida: it.unidadMedida || 'UNIDAD',
      centroCostoId: it.centroCostoId || params.centroCostoId,
      equipoId: it.equipoId,
      ordenTrabajoId: it.ordenTrabajoId,
      cantidadOrdenada: 0,
      cantidadPendiente: it.cantidad,
      observaciones: it.observaciones
    }));

    const req: SolicitudCompra = {
      id,
      empresaId,
      numero,
      fechaSolicitud: now,
      solicitanteEmpleadoId: params.solicitanteEmpleadoId,
      sector: params.sector,
      plantaId: params.plantaId,
      centroCostoId: params.centroCostoId,
      prioridad: params.prioridad || 'NORMAL',
      motivo: params.motivo.trim(),
      estado: requiereAprob ? 'PENDIENTE_APROBACION' : 'APROBADA',
      fechaNecesidad: params.fechaNecesidad,
      origenModulo: params.origenModulo || 'MANUAL',
      origenId: params.origenId,
      requiereAprobacion: requiereAprob,
      items: requestItems,
      observaciones: params.observaciones,
      createdAt: now,
      updatedAt: now
    };

    await purchaseRequestRepository.save(req);

    await auditRepository.recordAction(
      'comp_solicitudes',
      req.id,
      'CREACION_SOLICITUD_COMPRA',
      null,
      { numero: req.numero, itemsCount: req.items.length, estado: req.estado },
      `Solicitud de compra ${req.numero} creada por ${solicitante.apellido}, ${solicitante.nombre}`,
      params.usuarioId || 'admin_compras'
    );

    return req;
  }

  async approveRequest(
    requestId: string,
    aprobadorId: string,
    comentario?: string,
    usuarioId: string = 'admin_compras'
  ): Promise<SolicitudCompra> {
    const req = await purchaseRequestRepository.getById(requestId);
    if (!req) throw new Error(`Solicitud de compra ${requestId} no encontrada`);

    if (req.estado !== 'PENDIENTE_APROBACION') {
      throw new Error(`La solicitud ${req.numero} no puede ser aprobada en su estado actual (${req.estado})`);
    }

    const aprobador = await employeeRepository.getById(aprobadorId);
    if (!aprobador) {
      throw new Error(`Aprobador ${aprobadorId} no encontrado en RRHH`);
    }
    if (aprobador.estado !== 'ACTIVO') {
      throw new Error(`El aprobador no se encuentra en estado ACTIVO (Estado: ${aprobador.estado})`);
    }

    const now = new Date().toISOString();
    req.estado = 'APROBADA';
    req.aprobadorId = aprobadorId;
    req.fechaAprobacion = now;
    req.comentarioAprobacion = comentario;
    req.updatedAt = now;

    await purchaseRequestRepository.save(req);

    await auditRepository.recordAction(
      'comp_solicitudes',
      req.id,
      'APROBACION_SOLICITUD_COMPRA',
      { estado: 'PENDIENTE_APROBACION' },
      { estado: 'APROBADA', aprobadorId, comentario },
      `Solicitud de compra ${req.numero} APROBADA por ${aprobador.apellido}, ${aprobador.nombre}`,
      usuarioId
    );

    return req;
  }

  async rejectRequest(
    requestId: string,
    aprobadorId: string,
    motivo: string,
    usuarioId: string = 'admin_compras'
  ): Promise<SolicitudCompra> {
    const req = await purchaseRequestRepository.getById(requestId);
    if (!req) throw new Error(`Solicitud de compra ${requestId} no encontrada`);

    if (req.estado !== 'PENDIENTE_APROBACION') {
      throw new Error(`La solicitud ${req.numero} no puede ser rechazada en su estado actual (${req.estado})`);
    }

    if (!motivo || motivo.trim() === '') {
      throw new Error('Debe especificar un motivo formal para el rechazo de la solicitud');
    }

    const now = new Date().toISOString();
    req.estado = 'RECHAZADA';
    req.aprobadorId = aprobadorId;
    req.fechaAprobacion = now;
    req.comentarioAprobacion = motivo;
    req.updatedAt = now;

    await purchaseRequestRepository.save(req);

    await auditRepository.recordAction(
      'comp_solicitudes',
      req.id,
      'RECHAZO_SOLICITUD_COMPRA',
      { estado: 'PENDIENTE_APROBACION' },
      { estado: 'RECHAZADA', aprobadorId, motivo },
      `Solicitud de compra ${req.numero} RECHAZADA: ${motivo}`,
      usuarioId
    );

    return req;
  }
}

export const purchaseRequestService = new PurchaseRequestService();
