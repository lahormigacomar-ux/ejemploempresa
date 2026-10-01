import { Articulo, EstadoArticuloStock } from '../types';
import { articleRepository } from '../repositories/articleRepository';
import { auditRepository } from '../repositories/auditRepository';

export class ArticleService {
  async createArticle(params: {
    empresaId?: string;
    codigo: string;
    descripcion: string;
    descripcionCorta?: string;
    categoriaId: string;
    subcategoriaId?: string;
    unidadMedidaBase: string;
    controlaStock?: boolean;
    controlaLote?: boolean;
    controlaSerie?: boolean;
    stockMinimoDefault?: number;
    stockMaximoDefault?: number;
    puntoReposicionDefault?: number;
    marca?: string;
    modelo?: string;
    codigoBarras?: string;
    tipoCombustibleId?: string;
    observaciones?: string;
    usuarioId?: string;
  }): Promise<Articulo> {
    const empresaId = params.empresaId || 'emp-1';

    if (!params.codigo || params.codigo.trim() === '') {
      throw new Error('El código del artículo es obligatorio');
    }
    if (!params.descripcion || params.descripcion.trim() === '') {
      throw new Error('La descripción del artículo es obligatoria');
    }
    if (!params.categoriaId) {
      throw new Error('Debe asignar una categoría al artículo');
    }

    const cat = await articleRepository.getCategoryById(params.categoriaId);
    if (!cat) {
      throw new Error(`Categoría con ID ${params.categoriaId} no encontrada`);
    }
    if (cat.empresaId !== empresaId && cat.empresaId !== 'emp-1') {
      throw new Error(`Aislamiento multiempresa violado: La categoría ${cat.nombre} pertenece a la empresa ${cat.empresaId} y no a ${empresaId}`);
    }

    // Validar unicidad contextual: (empresaId, codigo)
    const existing = await articleRepository.getByCode(empresaId, params.codigo.trim());
    if (existing) {
      throw new Error(`El código de artículo ${params.codigo.trim()} ya se encuentra registrado para la empresa`);
    }

    const id = `art-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
    const now = new Date().toISOString();

    const article: Articulo = {
      id,
      empresaId,
      codigo: params.codigo.trim().toUpperCase(),
      descripcion: params.descripcion.trim(),
      descripcionCorta: params.descripcionCorta?.trim(),
      categoriaId: params.categoriaId,
      subcategoriaId: params.subcategoriaId,
      unidadMedidaBase: params.unidadMedidaBase.toUpperCase(),
      estado: 'ACTIVO',
      controlaStock: params.controlaStock ?? true,
      controlaLote: params.controlaLote ?? false,
      controlaSerie: params.controlaSerie ?? false,
      stockMinimoDefault: params.stockMinimoDefault ?? 0,
      stockMaximoDefault: params.stockMaximoDefault,
      puntoReposicionDefault: params.puntoReposicionDefault,
      marca: params.marca?.trim(),
      modelo: params.modelo?.trim(),
      codigoBarras: params.codigoBarras?.trim(),
      tipoCombustibleId: params.tipoCombustibleId,
      observaciones: params.observaciones,
      nombre: params.descripcion.trim(), // Compatibilidad
      createdAt: now,
      updatedAt: now
    };

    await articleRepository.save(article);

    await auditRepository.recordAction(
      'stk_articulos',
      article.id,
      'ALTA_ARTICULO',
      null,
      { codigo: article.codigo, descripcion: article.descripcion, categoria: cat.nombre },
      `Alta de artículo [${article.codigo}] ${article.descripcion}`,
      params.usuarioId || 'admin_stock'
    );

    return article;
  }

  async updateStatus(
    articleId: string,
    nuevoEstado: EstadoArticuloStock,
    usuarioId: string = 'admin_stock'
  ): Promise<Articulo> {
    const art = await articleRepository.getById(articleId);
    if (!art) throw new Error(`Artículo ${articleId} no encontrado`);

    const estadoAnterior = art.estado;
    art.estado = nuevoEstado;
    await articleRepository.save(art);

    await auditRepository.recordAction(
      'stk_articulos',
      art.id,
      'CAMBIO_ESTADO_ARTICULO',
      { estado: estadoAnterior },
      { estado: nuevoEstado },
      `Cambio de estado del artículo [${art.codigo}] a ${nuevoEstado}`,
      usuarioId
    );

    return art;
  }
}

export const articleService = new ArticleService();
