import {
  Proveedor,
  ProveedorContacto,
  ProveedorCuentaBancaria,
  ProveedorDocumento
} from '../types';

class SupplierRepository {
  private suppliers: Map<string, Proveedor> = new Map();

  constructor() {
    this.seedInitialData();
  }

  resetForTesting() {
    this.suppliers.clear();
    this.seedInitialData();
  }

  private seedInitialData() {
    const defaultSuppliers: Proveedor[] = [
      {
        id: 'prov-cem-01',
        empresaId: 'emp-1',
        codigo: 'PROV-0001',
        razonSocial: 'Loma Negra C.I.A.S.A.',
        nombreFantasia: 'Loma Negra',
        tipoDocumento: 'CUIT',
        numeroDocumento: '30-50001234-9',
        condicionIVA: 'RESPONSABLE_INSCRIPTO',
        ingresosBrutos: '901-123456-7',
        direccion: 'Av. Corrientes 316, Piso 5',
        localidad: 'CABA',
        provincia: 'Buenos Aires',
        pais: 'Argentina',
        codigoPostal: 'C1043AAQ',
        telefono: '+54 11 4319-3000',
        email: 'ventasgranel@lomanegra.com',
        contactoPrincipalNombre: 'Martín Rodríguez',
        sitioWeb: 'https://www.lomanegra.com',
        condicionPagoDefault: 'CUENTA_CORRIENTE',
        diasPagoDefault: 30,
        monedaDefault: 'ARS',
        montoCreditoMaximo: 50000000,
        categoriasProveidas: ['CEMENTO', 'AGREGADOS'],
        tiempoEntregaDiasEstimado: 2,
        estado: 'ACTIVO',
        observaciones: 'Proveedor principal de cemento Portland a granel (CP40 / CPC40)',
        contactos: [
          {
            id: 'cont-cem-1',
            proveedorId: 'prov-cem-01',
            nombre: 'Martín Rodríguez',
            cargoSector: 'Ejecutivo de Cuentas Industriales',
            telefono: '+54 11 4319-3001',
            email: 'mrodriguez@lomanegra.com',
            esPrincipal: true,
            activo: true
          }
        ],
        cuentasBancarias: [
          {
            id: 'cta-cem-1',
            proveedorId: 'prov-cem-01',
            banco: 'Banco Santander',
            tipoCuenta: 'CUENTA_CORRIENTE',
            numeroCuenta: '000-123456/7',
            cbu: '0720000720000001234567',
            alias: 'LOMA.NEGRA.OFICIAL',
            titular: 'Loma Negra C.I.A.S.A.',
            cuitTitular: '30-50001234-9',
            moneda: 'ARS',
            activa: true
          }
        ],
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-09-30T10:00:00Z'
      },
      {
        id: 'prov-comb-02',
        empresaId: 'emp-1',
        codigo: 'PROV-0002',
        razonSocial: 'YPF S.A. - Distribuidor Directo Mayorista',
        nombreFantasia: 'YPF Directo',
        tipoDocumento: 'CUIT',
        numeroDocumento: '30-54668997-9',
        condicionIVA: 'RESPONSABLE_INSCRIPTO',
        ingresosBrutos: '901-546689-9',
        direccion: 'Macacha Güemes 515',
        localidad: 'Puerto Madero',
        provincia: 'CABA',
        pais: 'Argentina',
        codigoPostal: 'C1106BKK',
        telefono: '+54 11 5441-2000',
        email: 'agroindustria@ypf.com',
        contactoPrincipalNombre: 'Gonzalo Varela',
        condicionPagoDefault: 'CUENTA_CORRIENTE',
        diasPagoDefault: 15,
        monedaDefault: 'ARS',
        montoCreditoMaximo: 35000000,
        categoriasProveidas: ['COMBUSTIBLE', 'LUBRICANTES'],
        tiempoEntregaDiasEstimado: 1,
        estado: 'ACTIVO',
        observaciones: 'Abastecimiento de cisternas Diesel 500 e Infinia Diesel a plantas',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-09-30T10:00:00Z'
      },
      {
        id: 'prov-rep-03',
        empresaId: 'emp-1',
        codigo: 'PROV-0003',
        razonSocial: 'Scania Argentina S.A.',
        nombreFantasia: 'Scania Sucursal Norte',
        tipoDocumento: 'CUIT',
        numeroDocumento: '30-58012399-4',
        condicionIVA: 'RESPONSABLE_INSCRIPTO',
        direccion: 'Ruta Panamericana KM 34.5',
        localidad: 'Talar de Pacheco',
        provincia: 'Buenos Aires',
        pais: 'Argentina',
        codigoPostal: 'B1617',
        telefono: '+54 11 4849-5000',
        email: 'repuestos@scania.com.ar',
        condicionPagoDefault: 'CUENTA_CORRIENTE',
        diasPagoDefault: 30,
        monedaDefault: 'ARS',
        montoCreditoMaximo: 15000000,
        categoriasProveidas: ['REPUESTOS', 'SERVICIOS'],
        tiempoEntregaDiasEstimado: 3,
        estado: 'ACTIVO',
        observaciones: 'Repuestos originales, filtros y mantenimiento oficial de camiones mixer',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-09-30T10:00:00Z'
      },
      {
        id: 'prov-serv-04',
        empresaId: 'emp-1',
        codigo: 'PROV-0004',
        razonSocial: 'Taller Hidráulico y Tornería San Martín S.R.L.',
        nombreFantasia: 'Hidráulica San Martín',
        tipoDocumento: 'CUIT',
        numeroDocumento: '30-71239845-2',
        condicionIVA: 'RESPONSABLE_INSCRIPTO',
        direccion: 'Calle Industria 2240',
        localidad: 'San Martín',
        provincia: 'Buenos Aires',
        pais: 'Argentina',
        codigoPostal: 'B1650',
        telefono: '+54 11 4755-1122',
        email: 'taller@hidraulicasanmartin.com.ar',
        condicionPagoDefault: 'TRANSFERENCIA',
        diasPagoDefault: 15,
        monedaDefault: 'ARS',
        montoCreditoMaximo: 5000000,
        categoriasProveidas: ['SERVICIOS', 'REPUESTOS'],
        tiempoEntregaDiasEstimado: 5,
        estado: 'ACTIVO',
        observaciones: 'Reparación de cilindros de tolvas, bombas hidráulicas y soldaduras pesadas',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-09-30T10:00:00Z'
      }
    ];

    defaultSuppliers.forEach(s => this.suppliers.set(s.id, s));
  }

  async getAll(empresaId: string = 'emp-1', estado?: string): Promise<Proveedor[]> {
    let list = Array.from(this.suppliers.values()).filter(s => s.empresaId === empresaId);
    if (estado) list = list.filter(s => s.estado === estado);
    return list.sort((a, b) => a.razonSocial.localeCompare(b.razonSocial));
  }

  async getById(id: string): Promise<Proveedor | null> {
    return this.suppliers.get(id) || null;
  }

  async getByCodigo(empresaId: string, codigo: string): Promise<Proveedor | null> {
    const list = Array.from(this.suppliers.values());
    return list.find(s => s.empresaId === empresaId && s.codigo.toLowerCase() === codigo.toLowerCase()) || null;
  }

  async getByNumeroDocumento(empresaId: string, doc: string): Promise<Proveedor | null> {
    const list = Array.from(this.suppliers.values());
    const cleanDoc = doc.replace(/\D/g, '');
    return (
      list.find(
        s => s.empresaId === empresaId && s.numeroDocumento.replace(/\D/g, '') === cleanDoc
      ) || null
    );
  }

  async save(prov: Proveedor): Promise<Proveedor> {
    prov.updatedAt = new Date().toISOString();
    this.suppliers.set(prov.id, prov);
    return prov;
  }
}

export const supplierRepository = new SupplierRepository();
