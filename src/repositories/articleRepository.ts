import { Articulo, CategoriaArticulo, UnidadMedidaStock } from '../types';

class ArticleRepository {
  private categories: CategoriaArticulo[] = [];
  private units: UnidadMedidaStock[] = [];
  private articles: Map<string, Articulo> = new Map();

  constructor() {
    this.seedInitialData();
  }

  resetForTesting() {
    this.categories = [];
    this.units = [];
    this.articles.clear();
    this.seedInitialData();
  }

  private seedInitialData() {
    this.units = [
      { id: 'u-un', codigo: 'UNIDAD', nombre: 'Unidad', simbolo: 'u', permiteDecimales: false },
      { id: 'u-kg', codigo: 'KG', nombre: 'Kilogramo', simbolo: 'kg', permiteDecimales: true },
      { id: 'u-tn', codigo: 'TN', nombre: 'Tonelada', simbolo: 'tn', permiteDecimales: true },
      { id: 'u-lt', codigo: 'LITRO', nombre: 'Litro', simbolo: 'lt', permiteDecimales: true },
      { id: 'u-m3', codigo: 'M3', nombre: 'Metro Cúbico', simbolo: 'm³', permiteDecimales: true },
      { id: 'u-bolsa', codigo: 'BOLSA', nombre: 'Bolsa (50 kg)', simbolo: 'bls', permiteDecimales: false },
      { id: 'u-tambor', codigo: 'TAMBOR', nombre: 'Tambor (200 L)', simbolo: 'tmb', permiteDecimales: false }
    ];

    this.categories = [
      { id: 'cat-filtros', empresaId: 'emp-1', codigo: 'FILTROS', nombre: 'Filtros (Aire, Aceite, Combustible)', activa: true },
      { id: 'cat-repuestos', empresaId: 'emp-1', codigo: 'REPUESTOS', nombre: 'Repuestos y Componentes Mecánicos', activa: true },
      { id: 'cat-neumaticos', empresaId: 'emp-1', codigo: 'NEUMATICOS', nombre: 'Neumáticos y Cubiertas', activa: true },
      { id: 'cat-lubricantes', empresaId: 'emp-1', codigo: 'LUBRICANTES', nombre: 'Aceites, Grasas y Fluidos Hidráulicos', activa: true },
      { id: 'cat-epp', empresaId: 'emp-1', codigo: 'EPP', nombre: 'Elementos de Protección Personal', activa: true },
      { id: 'cat-herramientas', empresaId: 'emp-1', codigo: 'HERRAMIENTAS', nombre: 'Herramientas de Taller y Planta', activa: true },
      { id: 'cat-cemento', empresaId: 'emp-1', codigo: 'CEMENTO', nombre: 'Cemento y Materiales Cementicios', activa: true },
      { id: 'cat-aditivos', empresaId: 'emp-1', codigo: 'ADITIVOS', nombre: 'Aditivos Químicos para Hormigón', activa: true },
      { id: 'cat-aridos', empresaId: 'emp-1', codigo: 'ARIDOS', nombre: 'Áridos, Arenas y Piedras', activa: true }
    ];

    const defaultArticles: Articulo[] = [
      {
        id: 'art-rep-filtro-aire',
        empresaId: 'emp-1',
        codigo: 'ART-FILT-AIR-01',
        descripcion: 'Filtro de Aire Primario Heavy Duty para Mixer',
        descripcionCorta: 'Filtro Aire Mixer',
        categoriaId: 'cat-filtros',
        unidadMedidaBase: 'UNIDAD',
        estado: 'ACTIVO',
        controlaStock: true,
        controlaLote: false,
        controlaSerie: false,
        stockMinimoDefault: 5,
        stockMaximoDefault: 30,
        puntoReposicionDefault: 10,
        marca: 'Donaldson',
        modelo: 'P777868',
        nombre: 'Filtro de Aire Primario Mixer',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-09-30T12:00:00Z'
      },
      {
        id: 'art-rep-filtro-aceite',
        empresaId: 'emp-1',
        codigo: 'ART-FILT-OIL-02',
        descripcion: 'Filtro de Aceite Motor Mercedes-Benz Actros',
        descripcionCorta: 'Filtro Aceite Actros',
        categoriaId: 'cat-filtros',
        unidadMedidaBase: 'UNIDAD',
        estado: 'ACTIVO',
        controlaStock: true,
        controlaLote: false,
        controlaSerie: false,
        stockMinimoDefault: 6,
        stockMaximoDefault: 24,
        puntoReposicionDefault: 8,
        marca: 'Mann Filter',
        modelo: 'HU 12140 x',
        nombre: 'Filtro Aceite Actros',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-09-30T12:00:00Z'
      },
      {
        id: 'art-neu-295-80',
        empresaId: 'emp-1',
        codigo: 'ART-NEU-295',
        descripcion: 'Neumático 295/80 R22.5 Direccional / Tracción Toda Posición',
        descripcionCorta: 'Neumático 295/80 R22.5',
        categoriaId: 'cat-neumaticos',
        unidadMedidaBase: 'UNIDAD',
        estado: 'ACTIVO',
        controlaStock: true,
        controlaLote: false,
        controlaSerie: true,
        stockMinimoDefault: 4,
        stockMaximoDefault: 20,
        puntoReposicionDefault: 6,
        marca: 'Bridgestone',
        modelo: 'M840',
        nombre: 'Neumático Bridgestone 295/80',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-09-30T12:00:00Z'
      },
      {
        id: 'art-rep-alternador',
        empresaId: 'emp-1',
        codigo: 'ART-ALT-24V',
        descripcion: 'Alternador 24V 80A Bosch para Camión Mixer',
        descripcionCorta: 'Alternador 24V 80A',
        categoriaId: 'cat-repuestos',
        unidadMedidaBase: 'UNIDAD',
        estado: 'ACTIVO',
        controlaStock: true,
        controlaLote: false,
        controlaSerie: true,
        stockMinimoDefault: 1,
        stockMaximoDefault: 4,
        puntoReposicionDefault: 2,
        marca: 'Bosch',
        modelo: 'NC4 24V',
        nombre: 'Alternador 24V Bosch',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-09-30T12:00:00Z'
      },
      {
        id: 'art-cemento-cp40',
        empresaId: 'emp-1',
        codigo: 'ART-CEM-CP40',
        descripcion: 'Cemento Portland Normal a Granel (CP40)',
        descripcionCorta: 'Cemento CP40 Granel',
        categoriaId: 'cat-cemento',
        unidadMedidaBase: 'TN',
        estado: 'ACTIVO',
        controlaStock: true,
        controlaLote: true,
        controlaSerie: false,
        stockMinimoDefault: 30,
        stockMaximoDefault: 200,
        puntoReposicionDefault: 50,
        nombre: 'Cemento Portland CP40 Granel',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-09-30T12:00:00Z'
      },
      {
        id: 'art-aditivo-plast',
        empresaId: 'emp-1',
        codigo: 'ART-ADI-PLAST-01',
        descripcion: 'Aditivo Superplastificante / Reductor de Agua de Alto Rango',
        descripcionCorta: 'Aditivo Plastificante',
        categoriaId: 'cat-aditivos',
        unidadMedidaBase: 'LITRO',
        estado: 'ACTIVO',
        controlaStock: true,
        controlaLote: true,
        controlaSerie: false,
        stockMinimoDefault: 1000,
        stockMaximoDefault: 5000,
        puntoReposicionDefault: 1500,
        nombre: 'Aditivo Superplastificante',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-09-30T12:00:00Z'
      },
      {
        id: 'art-epp-casco',
        empresaId: 'emp-1',
        codigo: 'ART-EPP-CASCO-BL',
        descripcion: 'Casco de Seguridad Industrial Blanco con Arnés',
        descripcionCorta: 'Casco Blanco',
        categoriaId: 'cat-epp',
        unidadMedidaBase: 'UNIDAD',
        estado: 'ACTIVO',
        controlaStock: true,
        controlaLote: false,
        controlaSerie: false,
        stockMinimoDefault: 5,
        stockMaximoDefault: 30,
        puntoReposicionDefault: 8,
        nombre: 'Casco de Seguridad Blanco',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-09-30T12:00:00Z'
      }
    ];

    defaultArticles.forEach(a => this.articles.set(a.id, a));
  }

  async getAllCategories(empresaId: string = 'emp-1'): Promise<CategoriaArticulo[]> {
    return this.categories.filter(c => c.empresaId === empresaId && c.activa);
  }

  async getCategoryById(id: string): Promise<CategoriaArticulo | null> {
    return this.categories.find(c => c.id === id) || null;
  }

  async saveCategory(cat: CategoriaArticulo): Promise<CategoriaArticulo> {
    const idx = this.categories.findIndex(c => c.id === cat.id);
    if (idx >= 0) this.categories[idx] = cat;
    else this.categories.push(cat);
    return cat;
  }

  async getAllUnits(): Promise<UnidadMedidaStock[]> {
    return [...this.units];
  }

  async getAll(filter?: {
    empresaId?: string;
    categoriaId?: string;
    estado?: string;
    search?: string;
  }): Promise<Articulo[]> {
    let list = Array.from(this.articles.values());
    if (!filter) return list.sort((a, b) => a.codigo.localeCompare(b.codigo));

    if (filter.empresaId) list = list.filter(a => a.empresaId === filter.empresaId);
    if (filter.categoriaId) list = list.filter(a => a.categoriaId === filter.categoriaId);
    if (filter.estado) list = list.filter(a => a.estado === filter.estado);
    if (filter.search) {
      const q = filter.search.toLowerCase();
      list = list.filter(
        a =>
          a.codigo.toLowerCase().includes(q) ||
          a.descripcion.toLowerCase().includes(q) ||
          (a.marca && a.marca.toLowerCase().includes(q))
      );
    }

    return list.sort((a, b) => a.codigo.localeCompare(b.codigo));
  }

  async getById(id: string): Promise<Articulo | null> {
    return this.articles.get(id) || null;
  }

  async getByCode(empresaId: string, codigo: string): Promise<Articulo | null> {
    const list = Array.from(this.articles.values());
    return list.find(a => a.empresaId === empresaId && a.codigo.toUpperCase() === codigo.toUpperCase()) || null;
  }

  async save(art: Articulo): Promise<Articulo> {
    art.updatedAt = new Date().toISOString();
    this.articles.set(art.id, art);
    return art;
  }
}

export const articleRepository = new ArticleRepository();
