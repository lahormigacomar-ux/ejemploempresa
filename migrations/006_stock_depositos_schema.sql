-- =====================================================================
-- MÓDULO 6: STOCK / DEPÓSITOS / INVENTARIO
-- Esquema relacional PostgreSQL / Supabase
-- =====================================================================

-- 1. Categorías de Artículos
CREATE TABLE IF NOT EXISTS stk_categorias (
    id VARCHAR(50) PRIMARY KEY,
    empresa_id VARCHAR(50) NOT NULL,
    codigo VARCHAR(50) NOT NULL, -- ej: REPUESTOS, NEUMATICOS, LUBRICANTES, FILTROS, EPP, HERRAMIENTAS, CEMENTO, ADITIVOS, ARIDOS
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    activa BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_stk_categoria_empresa_codigo UNIQUE (empresa_id, codigo)
);

-- 2. Unidades de Medida
CREATE TABLE IF NOT EXISTS stk_unidades_medida (
    id VARCHAR(50) PRIMARY KEY,
    codigo VARCHAR(20) NOT NULL UNIQUE, -- UNIDAD, KG, TN, LITRO, METRO, M2, M3, BOLSA, TAMBOR
    nombre VARCHAR(50) NOT NULL,
    simbolo VARCHAR(10) NOT NULL,
    permite_decimales BOOLEAN NOT NULL DEFAULT FALSE
);

-- 3. Maestro Central de Artículos
CREATE TABLE IF NOT EXISTS stk_articulos (
    id VARCHAR(50) PRIMARY KEY,
    empresa_id VARCHAR(50) NOT NULL,
    codigo VARCHAR(50) NOT NULL, -- ej: ART-FILT-001
    descripcion VARCHAR(200) NOT NULL,
    descripcion_corta VARCHAR(100),
    categoria_id VARCHAR(50) NOT NULL REFERENCES stk_categorias(id),
    subcategoria_id VARCHAR(50),
    unidad_medida_base VARCHAR(20) NOT NULL REFERENCES stk_unidades_medida(codigo),
    estado VARCHAR(20) NOT NULL DEFAULT 'ACTIVO' CHECK (estado IN ('ACTIVO', 'INACTIVO', 'BLOQUEADO')),
    controla_stock BOOLEAN NOT NULL DEFAULT TRUE,
    controla_lote BOOLEAN NOT NULL DEFAULT FALSE,
    controla_serie BOOLEAN NOT NULL DEFAULT FALSE,
    stock_minimo_default NUMERIC(12,2) DEFAULT 0,
    stock_maximo_default NUMERIC(12,2),
    punto_reposicion_default NUMERIC(12,2),
    marca VARCHAR(100),
    modelo VARCHAR(100),
    codigo_barras VARCHAR(50),
    tipo_combustible_id VARCHAR(50), -- FK opcional a comb_catalogo_combustibles
    observaciones TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_stk_articulo_empresa_codigo UNIQUE (empresa_id, codigo)
);

-- 4. Maestro de Depósitos / Almacenes
CREATE TABLE IF NOT EXISTS stk_depositos (
    id VARCHAR(50) PRIMARY KEY,
    empresa_id VARCHAR(50) NOT NULL,
    codigo VARCHAR(50) NOT NULL, -- ej: DEP-CENTRAL, DEP-REPUESTOS, DEP-PLANTA2
    nombre VARCHAR(150) NOT NULL,
    planta_id VARCHAR(50),
    tipo VARCHAR(30) NOT NULL DEFAULT 'GENERAL' CHECK (tipo IN ('GENERAL', 'REPUESTOS', 'MATERIA_PRIMA', 'HERRAMIENTAS', 'EPP', 'PRODUCTO_TERMINADO', 'OTRO')),
    estado VARCHAR(20) NOT NULL DEFAULT 'ACTIVO' CHECK (estado IN ('ACTIVO', 'INACTIVO')),
    permite_stock_negativo BOOLEAN NOT NULL DEFAULT FALSE,
    responsable_empleado_id VARCHAR(50), -- FK rrhh_empleados
    direccion VARCHAR(200),
    observaciones TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_stk_deposito_empresa_codigo UNIQUE (empresa_id, codigo)
);

-- 5. Ubicaciones Físicas Internas en Depósito
CREATE TABLE IF NOT EXISTS stk_ubicaciones (
    id VARCHAR(50) PRIMARY KEY,
    empresa_id VARCHAR(50) NOT NULL,
    deposito_id VARCHAR(50) NOT NULL REFERENCES stk_depositos(id) ON DELETE CASCADE,
    codigo VARCHAR(50) NOT NULL, -- ej: PAS-A-EST-03-N2
    nombre VARCHAR(100) NOT NULL,
    pasillo VARCHAR(20),
    estante VARCHAR(20),
    nivel VARCHAR(20),
    estado VARCHAR(20) NOT NULL DEFAULT 'ACTIVA' CHECK (estado IN ('ACTIVA', 'INACTIVA')),
    observaciones TEXT,
    CONSTRAINT uq_stk_ubicacion_deposito_codigo UNIQUE (deposito_id, codigo)
);

-- 6. Configuración de Stock por Depósito / Artículo
CREATE TABLE IF NOT EXISTS stk_config_stock (
    id VARCHAR(50) PRIMARY KEY,
    empresa_id VARCHAR(50) NOT NULL,
    articulo_id VARCHAR(50) NOT NULL REFERENCES stk_articulos(id) ON DELETE CASCADE,
    deposito_id VARCHAR(50) NOT NULL REFERENCES stk_depositos(id) ON DELETE CASCADE,
    stock_minimo NUMERIC(12,2) NOT NULL DEFAULT 0,
    stock_maximo NUMERIC(12,2),
    punto_reposicion NUMERIC(12,2),
    ubicacion_predeterminada_id VARCHAR(50) REFERENCES stk_ubicaciones(id),
    CONSTRAINT uq_stk_config_articulo_deposito UNIQUE (empresa_id, articulo_id, deposito_id)
);

-- 7. Lotes de Artículos (Aditivos, Cementos, Químicos)
CREATE TABLE IF NOT EXISTS stk_lotes (
    id VARCHAR(50) PRIMARY KEY,
    empresa_id VARCHAR(50) NOT NULL,
    articulo_id VARCHAR(50) NOT NULL REFERENCES stk_articulos(id),
    codigo_lote VARCHAR(50) NOT NULL,
    fecha_fabricacion DATE,
    fecha_vencimiento DATE,
    proveedor_id VARCHAR(50),
    recepcion_compra_id VARCHAR(50),
    estado VARCHAR(20) NOT NULL DEFAULT 'DISPONIBLE' CHECK (estado IN ('DISPONIBLE', 'CUARENTENA', 'VENCIDO', 'AGOTADO')),
    observaciones TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_stk_lote_articulo_codigo UNIQUE (empresa_id, articulo_id, codigo_lote)
);

-- 8. Series de Artículos Individuales (Neumáticos, Alternadores, Motores, Herramientas Mayores)
CREATE TABLE IF NOT EXISTS stk_series (
    id VARCHAR(50) PRIMARY KEY,
    empresa_id VARCHAR(50) NOT NULL,
    articulo_id VARCHAR(50) NOT NULL REFERENCES stk_articulos(id),
    numero_serie VARCHAR(100) NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'EN_STOCK' CHECK (estado IN ('EN_STOCK', 'RESERVADA', 'ENTREGADA', 'INSTALADA', 'BAJA')),
    deposito_id VARCHAR(50) REFERENCES stk_depositos(id),
    ubicacion_id VARCHAR(50) REFERENCES stk_ubicaciones(id),
    equipo_instalado_id VARCHAR(50),
    origen_recepcion_id VARCHAR(50),
    observaciones TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_stk_serie_articulo_numero UNIQUE (empresa_id, articulo_id, numero_serie)
);

-- 9. Proyección / Snapshot de Existencias Físicas y Valorizadas
CREATE TABLE IF NOT EXISTS stk_existencias (
    id VARCHAR(50) PRIMARY KEY,
    empresa_id VARCHAR(50) NOT NULL,
    deposito_id VARCHAR(50) NOT NULL REFERENCES stk_depositos(id),
    ubicacion_id VARCHAR(50) REFERENCES stk_ubicaciones(id),
    articulo_id VARCHAR(50) NOT NULL REFERENCES stk_articulos(id),
    lote_id VARCHAR(50) REFERENCES stk_lotes(id),
    cantidad_fisica NUMERIC(14,4) NOT NULL DEFAULT 0,
    cantidad_reservada NUMERIC(14,4) NOT NULL DEFAULT 0,
    cantidad_disponible NUMERIC(14,4) GENERATED ALWAYS AS (cantidad_fisica - cantidad_reservada) STORED,
    costo_promedio_ponderado NUMERIC(14,4) NOT NULL DEFAULT 0,
    valor_total_stock NUMERIC(16,2) NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Movimientos de Stock (Encabezado Inmutable)
CREATE TABLE IF NOT EXISTS stk_movimientos (
    id VARCHAR(50) PRIMARY KEY,
    empresa_id VARCHAR(50) NOT NULL,
    numero VARCHAR(50) NOT NULL, -- ej: MOV-000001
    fecha_hora TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    tipo_movimiento VARCHAR(30) NOT NULL CHECK (tipo_movimiento IN (
        'INGRESO_COMPRA', 'INGRESO_MANUAL', 'DEVOLUCION', 'TRANSFERENCIA',
        'EGRESO_CONSUMO', 'EGRESO_MANUAL', 'AJUSTE_POSITIVO', 'AJUSTE_NEGATIVO',
        'CONTEO_FISICO', 'PRODUCCION_CONSUMO', 'PRODUCCION_INGRESO', 'VENTA',
        'DEVOLUCION_CLIENTE', 'REVERSION_RECEPCION_COMPRA'
    )),
    deposito_origen_id VARCHAR(50) REFERENCES stk_depositos(id),
    deposito_destino_id VARCHAR(50) REFERENCES stk_depositos(id),
    origen_modulo VARCHAR(30) NOT NULL, -- 'MANUAL', 'COMPRAS_RECEPCION', 'TALLER_OT', 'AJUSTE_CONTEO', 'PRODUCCION', 'TRANSFERENCIA', 'ANULACION_RECEPCION'
    origen_id VARCHAR(50),
    documento_referencia VARCHAR(100),
    estado VARCHAR(20) NOT NULL DEFAULT 'CONFIRMADO' CHECK (estado IN ('BORRADOR', 'CONFIRMADO', 'ANULADO')),
    observaciones TEXT,
    usuario_id VARCHAR(50),
    event_id VARCHAR(100),
    fecha_anulacion TIMESTAMPTZ,
    usuario_anulacion VARCHAR(50),
    motivo_anulacion TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_stk_movimiento_empresa_numero UNIQUE (empresa_id, numero)
);

-- 11. Items de Movimiento de Stock
CREATE TABLE IF NOT EXISTS stk_movimiento_items (
    id VARCHAR(50) PRIMARY KEY,
    movimiento_id VARCHAR(50) NOT NULL REFERENCES stk_movimientos(id) ON DELETE CASCADE,
    articulo_id VARCHAR(50) NOT NULL REFERENCES stk_articulos(id),
    descripcion_snapshot VARCHAR(200) NOT NULL,
    unidad_medida_snapshot VARCHAR(20) NOT NULL,
    cantidad NUMERIC(14,4) NOT NULL CHECK (cantidad > 0),
    deposito_origen_id VARCHAR(50) REFERENCES stk_depositos(id),
    ubicacion_origen_id VARCHAR(50) REFERENCES stk_ubicaciones(id),
    deposito_destino_id VARCHAR(50) REFERENCES stk_depositos(id),
    ubicacion_destino_id VARCHAR(50) REFERENCES stk_ubicaciones(id),
    lote_id VARCHAR(50) REFERENCES stk_lotes(id),
    codigo_lote_snapshot VARCHAR(50),
    serie_id VARCHAR(50) REFERENCES stk_series(id),
    numero_serie_snapshot VARCHAR(100),
    costo_unitario_snapshot NUMERIC(14,4) NOT NULL DEFAULT 0,
    costo_total_snapshot NUMERIC(16,2) NOT NULL DEFAULT 0,
    centro_costo_id VARCHAR(50),
    equipo_id VARCHAR(50),
    orden_trabajo_id VARCHAR(50)
);

-- 12. Reservas de Stock (Compromiso de Stock sin Egreso Físico Inmediato)
CREATE TABLE IF NOT EXISTS stk_reservas (
    id VARCHAR(50) PRIMARY KEY,
    empresa_id VARCHAR(50) NOT NULL,
    articulo_id VARCHAR(50) NOT NULL REFERENCES stk_articulos(id),
    deposito_id VARCHAR(50) NOT NULL REFERENCES stk_depositos(id),
    ubicacion_id VARCHAR(50) REFERENCES stk_ubicaciones(id),
    cantidad NUMERIC(14,4) NOT NULL CHECK (cantidad > 0),
    origen_modulo VARCHAR(30) NOT NULL, -- 'TALLER_OT', 'PRODUCCION', 'VENTAS', 'MANUAL'
    origen_id VARCHAR(50) NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'ACTIVA' CHECK (estado IN ('ACTIVA', 'CONSUMIDA', 'LIBERADA', 'CANCELADA')),
    fecha_reserva TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fecha_vencimiento TIMESTAMPTZ,
    usuario_id VARCHAR(50),
    motivo TEXT,
    movimiento_consumo_id VARCHAR(50) REFERENCES stk_movimientos(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. Conteos Físicos de Inventario
CREATE TABLE IF NOT EXISTS stk_conteos (
    id VARCHAR(50) PRIMARY KEY,
    empresa_id VARCHAR(50) NOT NULL,
    numero VARCHAR(50) NOT NULL, -- ej: CNT-000001
    deposito_id VARCHAR(50) NOT NULL REFERENCES stk_depositos(id),
    fecha_hora TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    estado VARCHAR(20) NOT NULL DEFAULT 'BORRADOR' CHECK (estado IN ('BORRADOR', 'EN_PROCESO', 'CERRADO', 'ANULADO')),
    responsable_empleado_id VARCHAR(50),
    observaciones TEXT,
    movimiento_ajuste_id VARCHAR(50) REFERENCES stk_movimientos(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_stk_conteo_empresa_numero UNIQUE (empresa_id, numero)
);

-- 14. Items de Conteo Físico
CREATE TABLE IF NOT EXISTS stk_conteo_items (
    id VARCHAR(50) PRIMARY KEY,
    conteo_id VARCHAR(50) NOT NULL REFERENCES stk_conteos(id) ON DELETE CASCADE,
    articulo_id VARCHAR(50) NOT NULL REFERENCES stk_articulos(id),
    descripcion_snapshot VARCHAR(200) NOT NULL,
    unidad_medida_snapshot VARCHAR(20) NOT NULL,
    ubicacion_id VARCHAR(50) REFERENCES stk_ubicaciones(id),
    cantidad_sistema_snapshot NUMERIC(14,4) NOT NULL DEFAULT 0,
    cantidad_contada NUMERIC(14,4) NOT NULL DEFAULT 0,
    diferencia NUMERIC(14,4) NOT NULL DEFAULT 0,
    costo_unitario_snapshot NUMERIC(14,4) NOT NULL DEFAULT 0,
    valor_diferencia NUMERIC(16,2) NOT NULL DEFAULT 0
);

-- 15. Alertas de Stock y Reposición
CREATE TABLE IF NOT EXISTS stk_alertas (
    id VARCHAR(50) PRIMARY KEY,
    empresa_id VARCHAR(50) NOT NULL,
    tipo VARCHAR(40) NOT NULL CHECK (tipo IN (
        'STOCK_MINIMO', 'PUNTO_REPOSICION', 'LOTE_PROXIMO_VENCIMIENTO',
        'LOTE_VENCIDO', 'DIFERENCIA_CONTEO', 'INTENTO_STOCK_NEGATIVO'
    )),
    severidad VARCHAR(20) NOT NULL CHECK (severidad IN ('INFORMATIVA', 'ADVERTENCIA', 'BLOQUEANTE')),
    titulo VARCHAR(150) NOT NULL,
    descripcion TEXT NOT NULL,
    articulo_id VARCHAR(50) REFERENCES stk_articulos(id),
    deposito_id VARCHAR(50) REFERENCES stk_depositos(id),
    lote_id VARCHAR(50) REFERENCES stk_lotes(id),
    fecha TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resuelta BOOLEAN NOT NULL DEFAULT FALSE,
    resuelta_por VARCHAR(50),
    fecha_resolucion TIMESTAMPTZ
);

-- 16. Idempotencia y Trazabilidad Concurrente de Eventos
CREATE TABLE IF NOT EXISTS stk_eventos_procesados (
    id VARCHAR(50) PRIMARY KEY,
    empresa_id VARCHAR(50) NOT NULL,
    event_id VARCHAR(100) NOT NULL,
    origen_modulo VARCHAR(50) NOT NULL,
    movimiento_id VARCHAR(50) NOT NULL REFERENCES stk_movimientos(id),
    procesado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_stk_event_empresa UNIQUE (empresa_id, event_id)
);

-- =====================================================================
-- ÍNDICES DE RENDIMIENTO Y UNICIDAD
-- =====================================================================
CREATE INDEX IF NOT EXISTS idx_stk_articulos_empresa_categoria ON stk_articulos(empresa_id, categoria_id);
CREATE INDEX IF NOT EXISTS idx_stk_depositos_empresa_tipo ON stk_depositos(empresa_id, tipo);
CREATE INDEX IF NOT EXISTS idx_stk_existencias_busqueda ON stk_existencias(empresa_id, deposito_id, articulo_id);
CREATE INDEX IF NOT EXISTS idx_stk_movimientos_filtro ON stk_movimientos(empresa_id, tipo_movimiento, fecha_hora);
CREATE INDEX IF NOT EXISTS idx_stk_movimientos_origen ON stk_movimientos(origen_modulo, origen_id);
CREATE INDEX IF NOT EXISTS idx_stk_mov_items_articulo ON stk_movimiento_items(articulo_id, movimiento_id);
CREATE INDEX IF NOT EXISTS idx_stk_reservas_articulo_deposito ON stk_reservas(empresa_id, articulo_id, deposito_id, estado);
CREATE INDEX IF NOT EXISTS idx_stk_lotes_vencimiento ON stk_lotes(articulo_id, fecha_vencimiento);
CREATE INDEX IF NOT EXISTS idx_stk_series_articulo ON stk_series(articulo_id, estado);
CREATE INDEX IF NOT EXISTS idx_stk_alertas_empresa_activas ON stk_alertas(empresa_id, resuelta, fecha);

CREATE UNIQUE INDEX IF NOT EXISTS uq_stk_movimientos_event_id 
ON stk_movimientos (empresa_id, event_id) 
WHERE event_id IS NOT NULL;
