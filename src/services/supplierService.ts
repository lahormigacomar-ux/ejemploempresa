import { Proveedor, EstadoProveedor } from '../types';
import { supplierRepository } from '../repositories/supplierRepository';
import { auditRepository } from '../repositories/auditRepository';

export class SupplierService {
  async createSupplier(params: {
    empresaId?: string;
    codigo: string;
    razonSocial: string;
    nombreFantasia?: string;
    tipoDocumento?: 'CUIT' | 'DNI' | 'PASAPORTE' | 'EXTERIOR';
    numeroDocumento: string;
    condicionIVA: any;
    ingresosBrutos?: string;
    direccion: string;
    localidad: string;
    provincia: string;
    pais?: string;
    codigoPostal: string;
    telefono: string;
    email: string;
    contactoPrincipalNombre?: string;
    sitioWeb?: string;
    condicionPagoDefault?: any;
    diasPagoDefault?: number;
    monedaDefault?: any;
    montoCreditoMaximo?: number;
    categoriasProveidas?: string[];
    tiempoEntregaDiasEstimado?: number;
    observaciones?: string;
    usuarioId?: string;
  }): Promise<Proveedor> {
    const empresaId = params.empresaId || 'emp-1';

    if (!params.codigo || params.codigo.trim() === '') {
      throw new Error('El código de proveedor es obligatorio');
    }
    if (!params.razonSocial || params.razonSocial.trim() === '') {
      throw new Error('La razón social del proveedor es obligatoria');
    }
    if (!params.numeroDocumento || params.numeroDocumento.trim() === '') {
      throw new Error('El número de documento / CUIT es obligatorio');
    }

    // Validar unicidad contextual de código por empresa
    const existingCodigo = await supplierRepository.getByCodigo(empresaId, params.codigo);
    if (existingCodigo) {
      throw new Error(`Ya existe un proveedor con el código ${params.codigo} en esta empresa`);
    }

    const id = `prov-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
    const now = new Date().toISOString();

    const prov: Proveedor = {
      id,
      empresaId,
      codigo: params.codigo.toUpperCase().trim(),
      razonSocial: params.razonSocial.trim(),
      nombreFantasia: params.nombreFantasia?.trim(),
      tipoDocumento: params.tipoDocumento || 'CUIT',
      numeroDocumento: params.numeroDocumento.trim(),
      condicionIVA: params.condicionIVA || 'RESPONSABLE_INSCRIPTO',
      ingresosBrutos: params.ingresosBrutos?.trim(),
      direccion: params.direccion.trim(),
      localidad: params.localidad.trim(),
      provincia: params.provincia.trim(),
      pais: params.pais || 'Argentina',
      codigoPostal: params.codigoPostal.trim(),
      telefono: params.telefono.trim(),
      email: params.email.trim(),
      contactoPrincipalNombre: params.contactoPrincipalNombre?.trim(),
      sitioWeb: params.sitioWeb?.trim(),
      condicionPagoDefault: params.condicionPagoDefault || 'CUENTA_CORRIENTE',
      diasPagoDefault: params.diasPagoDefault ?? 30,
      monedaDefault: params.monedaDefault || 'ARS',
      montoCreditoMaximo: params.montoCreditoMaximo ?? 0,
      categoriasProveidas: params.categoriasProveidas || ['GENERAL'],
      tiempoEntregaDiasEstimado: params.tiempoEntregaDiasEstimado ?? 3,
      estado: 'ACTIVO',
      observaciones: params.observaciones,
      createdAt: now,
      updatedAt: now
    };

    await supplierRepository.save(prov);

    await auditRepository.recordAction(
      'comp_proveedores',
      prov.id,
      'ALTA_PROVEEDOR',
      null,
      { codigo: prov.codigo, razonSocial: prov.razonSocial, cuit: prov.numeroDocumento },
      `Alta de proveedor ${prov.codigo} - ${prov.razonSocial}`,
      params.usuarioId || 'admin_compras'
    );

    return prov;
  }

  async changeStatus(
    id: string,
    nuevoEstado: EstadoProveedor,
    motivo: string,
    usuarioId: string = 'admin_compras'
  ): Promise<Proveedor> {
    const prov = await supplierRepository.getById(id);
    if (!prov) throw new Error(`Proveedor ${id} no encontrado`);

    const estadoAnterior = prov.estado;
    prov.estado = nuevoEstado;
    await supplierRepository.save(prov);

    await auditRepository.recordAction(
      'comp_proveedores',
      prov.id,
      'CAMBIO_ESTADO_PROVEEDOR',
      { estado: estadoAnterior },
      { estado: nuevoEstado, motivo },
      `Cambio de estado de proveedor ${prov.codigo} a ${nuevoEstado}: ${motivo}`,
      usuarioId
    );

    return prov;
  }
}

export const supplierService = new SupplierService();
