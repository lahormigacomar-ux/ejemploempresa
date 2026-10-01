-- =====================================================================
-- MÓDULO 5: COMPRAS / PROVEEDORES
-- Esquema relacional PostgreSQL / Supabase
-- =====================================================================

-- 1. Maestro de Proveedores
CREATE TABLE IF NOT EXISTS comp_proveedores (
    id VARCHAR(50) PRIMARY KEY,
    empresa_id VARCHAR(50) NOT NULL,
    codigo VARCHAR(50) NOT NULL, -- ej: PROV-0010
    razon_social VARCHAR(150) NOT NULL,
    nombre_fantasia VARCHAR(150),
    tipo_documento VARCHAR(20) NOT NULL DEFAULT 'CUIT',
    numero_documento VARCHAR(50) NOT NULL, -- CUIT
    condicion_iva VARCHAR(50) NOT NULL DEFAULT 'RESPONSABLE_INSCRIPTO',
    ingresos_brutos VARCHAR(50),
    
    direccion TEXT NOT NULL,
    localidad VARCHAR(100) NOT NULL,
    provincia VARCHAR(100) NOT NULL,
    pais VARCHAR(100) NOT NULL DEFAULT 'Argentina',
    codigo_postal VARCHAR(20) NOT NULL,
    
    telefono VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL,
    contacto_principal_nombre VARCHAR(100),
    sitio_web VARCHAR(150),
    
    condicion_pago_default VARCHAR(50) NOT NULL DEFAULT 'CUENTA_CORRIENTE',
    dias_pago_default INTEGER NOT NULL DEFAULT 30,
    moneda_default VARCHAR(10) NOT NULL DEFAULT 'ARS',
    monto_credito_maximo NUMERIC(14,2) DEFAULT 0,
    categorias_proveidas TEXT[] DEFAULT '{}',
    tiempo_entrega_dias_estimado INTEGER DEFAULT 3,
    
    estado VARCHAR(30) NOT NULL DEFAULT 'ACTIVO' CHECK (estado IN ('ACTIVO', 'INACTIVO', 'BLOQUEADO')),
    observaciones TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_comp_proveedor_empresa_codigo UNIQUE (empresa_id, codigo)
);

-- 2. Contactos del Proveedor
CREATE TABLE IF NOT EXISTS comp_proveedor_contactos (
    id VARCHAR(50) PRIMARY KEY,
    proveedor_id VARCHAR(50) NOT NULL REFERENCES comp_proveedores(id) ON DELETE CASCADE,
    nombre VARCHAR(100) NOT NULL,
    cargo_sector VARCHAR(100) NOT NULL,
    telefono VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL,
    whatsapp VARCHAR(50),
    es_principal BOOLEAN NOT NULL DEFAULT FALSE,
    activo BOOLEAN NOT NULL DEFAULT TRUE
);

-- 3. Cuentas Bancarias del Proveedor (Datos Sensibles / Permisos Restringidos)
CREATE TABLE IF NOT EXISTS comp_proveedor_cuentas_bancarias (
    id VARCHAR(50) PRIMARY KEY,
    proveedor_id VARCHAR(50) NOT NULL REFERENCES comp_proveedores(id) ON DELETE CASCADE,
    banco VARCHAR(100) NOT NULL,
    tipo_cuenta VARCHAR(50) NOT NULL DEFAULT 'CUENTA_CORRIENTE',
    numero_cuenta VARCHAR(50) NOT NULL,
    cbu VARCHAR(30) NOT NULL,
    alias VARCHAR(50),
    titular VARCHAR(150) NOT NULL,
    cuit_titular VARCHAR(50) NOT NULL,
    moneda VARCHAR(10) NOT NULL DEFAULT 'ARS',
    activa BOOLEAN NOT NULL DEFAULT TRUE
);

-- 4. Documentación del Proveedor
CREATE TABLE IF NOT EXISTS comp_proveedor_documentos (
    id VARCHAR(50) PRIMARY KEY,
    proveedor_id VARCHAR(50) NOT NULL REFERENCES comp_proveedores(id) ON DELETE CASCADE,
    tipo VARCHAR(50) NOT NULL,
    numero VARCHAR(50),
    fecha_emision DATE NOT NULL,
    fecha_vencimiento DATE,
    archivo_url TEXT,
    estado VARCHAR(30) NOT NULL DEFAULT 'vigente',
    observaciones TEXT
);

-- 5. Solicitudes de Compra (Requisiciones Internas)
CREATE TABLE IF NOT EXISTS comp_solicitudes (
    id VARCHAR(50) PRIMARY KEY,
    empresa_id VARCHAR(50) NOT NULL,
    numero VARCHAR(50) NOT NULL, -- ej: SC-000001
    fecha_solicitud TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    solicitante_empleado_id VARCHAR(50) NOT NULL, -- FK rrhh_empleados
    sector VARCHAR(50) NOT NULL,
    planta_id VARCHAR(50),
    centro_costo_id VARCHAR(50),
    prioridad VARCHAR(30) NOT NULL DEFAULT 'NORMAL' CHECK (prioridad IN ('BAJA', 'NORMAL', 'ALTA', 'URGENTE', 'CRITICA')),
    motivo TEXT NOT NULL,
    estado VARCHAR(30) NOT NULL DEFAULT 'BORRADOR' CHECK (estado IN ('BORRADOR', 'PENDIENTE_APROBACION', 'APROBADA', 'RECHAZADA', 'EN_COTIZACION', 'ORDENADA', 'PARCIALMENTE_ORDENADA', 'CERRADA', 'CANCELADA')),
    fecha_necesidad DATE,
    origen_modulo VARCHAR(50) NOT NULL DEFAULT 'MANUAL',
    origen_id VARCHAR(50),
    requiere_aprobacion BOOLEAN NOT NULL DEFAULT TRUE,
    aprobador_id VARCHAR(50),
    fecha_aprobacion TIMESTAMPTZ,
    comentario_aprobacion TEXT,
    observaciones TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_comp_solicitud_empresa_numero UNIQUE (empresa_id, numero)
);

-- 6. Items de Solicitud de Compra
CREATE TABLE IF NOT EXISTS comp_solicitud_items (
    id VARCHAR(50) PRIMARY KEY,
    solicitud_id VARCHAR(50) NOT NULL REFERENCES comp_solicitudes(id) ON DELETE CASCADE,
    tipo VARCHAR(30) NOT NULL DEFAULT 'ARTICULO' CHECK (tipo IN ('ARTICULO', 'SERVICIO', 'OTRO')),
    articulo_id VARCHAR(50), -- FK futura a stock_articulos
    descripcion_snapshot TEXT NOT NULL,
    cantidad NUMERIC(12,2) NOT NULL CHECK (cantidad > 0),
    unidad_medida VARCHAR(20) NOT NULL DEFAULT 'UNIDAD',
    centro_costo_id VARCHAR(50),
    equipo_id VARCHAR(50), -- FK flota_equipos
    orden_trabajo_id VARCHAR(50), -- FK mant_ordenes_trabajo
    cantidad_ordenada NUMERIC(12,2) NOT NULL DEFAULT 0,
    cantidad_pendiente NUMERIC(12,2) NOT NULL DEFAULT 0,
    observaciones TEXT
);

-- 7. Cotizaciones de Proveedores (Presupuestos Recibidos)
CREATE TABLE IF NOT EXISTS comp_cotizaciones (
    id VARCHAR(50) PRIMARY KEY,
    empresa_id VARCHAR(50) NOT NULL,
    numero VARCHAR(50) NOT NULL, -- ej: COT-000001
    solicitud_compra_id VARCHAR(50) REFERENCES comp_solicitudes(id),
    proveedor_id VARCHAR(50) NOT NULL REFERENCES comp_proveedores(id),
    proveedor_nombre_snapshot VARCHAR(150) NOT NULL,
    fecha_emision DATE NOT NULL,
    fecha_vencimiento DATE NOT NULL,
    moneda VARCHAR(10) NOT NULL DEFAULT 'ARS',
    condicion_pago VARCHAR(50) NOT NULL DEFAULT 'CUENTA_CORRIENTE',
    plazo_entrega_dias INTEGER DEFAULT 3,
    subtotal NUMERIC(14,2) NOT NULL DEFAULT 0,
    descuentos NUMERIC(14,2) NOT NULL DEFAULT 0,
    impuestos NUMERIC(14,2) NOT NULL DEFAULT 0,
    total NUMERIC(14,2) NOT NULL DEFAULT 0,
    estado VARCHAR(30) NOT NULL DEFAULT 'RECIBIDA' CHECK (estado IN ('BORRADOR', 'RECIBIDA', 'EVALUADA', 'SELECCIONADA', 'DESCARTADA', 'VENCIDA')),
    observaciones TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_comp_cotizacion_empresa_numero UNIQUE (empresa_id, numero)
);

-- 8. Items de Cotización
CREATE TABLE IF NOT EXISTS comp_cotizacion_items (
    id VARCHAR(50) PRIMARY KEY,
    cotizacion_id VARCHAR(50) NOT NULL REFERENCES comp_cotizaciones(id) ON DELETE CASCADE,
    solicitud_item_id VARCHAR(50) REFERENCES comp_solicitud_items(id),
    articulo_id VARCHAR(50),
    descripcion_snapshot TEXT NOT NULL,
    cantidad NUMERIC(12,2) NOT NULL CHECK (cantidad > 0),
    precio_unitario NUMERIC(12,2) NOT NULL CHECK (precio_unitario >= 0),
    descuento_pct NUMERIC(5,2) NOT NULL DEFAULT 0,
    iva_pct NUMERIC(5,2) NOT NULL DEFAULT 21.0,
    otros_impuestos NUMERIC(12,2) NOT NULL DEFAULT 0,
    subtotal NUMERIC(14,2) NOT NULL DEFAULT 0,
    total NUMERIC(14,2) NOT NULL DEFAULT 0,
    plazo_entrega_dias INTEGER
);

-- 9. Órdenes de Compra (Compromiso Comercial)
CREATE TABLE IF NOT EXISTS comp_ordenes_compra (
    id VARCHAR(50) PRIMARY KEY,
    empresa_id VARCHAR(50) NOT NULL,
    numero VARCHAR(50) NOT NULL, -- ej: OC-000001
    proveedor_id VARCHAR(50) NOT NULL REFERENCES comp_proveedores(id),
    proveedor_nombre_snapshot VARCHAR(150) NOT NULL,
    proveedor_cuit_snapshot VARCHAR(50) NOT NULL,
    solicitud_compra_id VARCHAR(50) REFERENCES comp_solicitudes(id),
    cotizacion_proveedor_id VARCHAR(50) REFERENCES comp_cotizaciones(id),
    fecha_emision TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fecha_entrega_esperada DATE,
    moneda VARCHAR(10) NOT NULL DEFAULT 'ARS',
    tipo_cambio_snapshot NUMERIC(10,4) NOT NULL DEFAULT 1.0,
    condicion_pago VARCHAR(50) NOT NULL DEFAULT 'CUENTA_CORRIENTE',
    planta_entrega_id VARCHAR(50),
    deposito_entrega_id VARCHAR(50),
    centro_costo_id VARCHAR(50),
    estado VARCHAR(30) NOT NULL DEFAULT 'EMITIDA' CHECK (estado IN ('BORRADOR', 'PENDIENTE_APROBACION', 'APROBADA', 'EMITIDA', 'PARCIALMENTE_RECIBIDA', 'RECIBIDA', 'CERRADA', 'CANCELADA')),
    subtotal NUMERIC(14,2) NOT NULL DEFAULT 0,
    descuentos NUMERIC(14,2) NOT NULL DEFAULT 0,
    impuestos NUMERIC(14,2) NOT NULL DEFAULT 0,
    total NUMERIC(14,2) NOT NULL DEFAULT 0,
    observaciones TEXT,
    fecha_cancelacion TIMESTAMPTZ,
    usuario_cancelacion VARCHAR(50),
    motivo_cancelacion TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_comp_orden_empresa_numero UNIQUE (empresa_id, numero)
);

-- 10. Items de Orden de Compra
CREATE TABLE IF NOT EXISTS comp_orden_items (
    id VARCHAR(50) PRIMARY KEY,
    orden_compra_id VARCHAR(50) NOT NULL REFERENCES comp_ordenes_compra(id) ON DELETE CASCADE,
    solicitud_item_id VARCHAR(50) REFERENCES comp_solicitud_items(id),
    articulo_id VARCHAR(50),
    tipo_combustible_id VARCHAR(50) REFERENCES comb_catalogo_combustibles(id),
    tipo VARCHAR(30) NOT NULL DEFAULT 'ARTICULO' CHECK (tipo IN ('ARTICULO', 'SERVICIO', 'OTRO')),
    descripcion_snapshot TEXT NOT NULL,
    cantidad NUMERIC(12,2) NOT NULL CHECK (cantidad > 0),
    unidad_medida VARCHAR(20) NOT NULL DEFAULT 'UNIDAD',
    precio_unitario_snapshot NUMERIC(12,2) NOT NULL CHECK (precio_unitario_snapshot >= 0),
    descuento_pct_snapshot NUMERIC(5,2) NOT NULL DEFAULT 0,
    iva_pct_snapshot NUMERIC(5,2) NOT NULL DEFAULT 21.0,
    otros_impuestos_snapshot NUMERIC(12,2) NOT NULL DEFAULT 0,
    subtotal NUMERIC(14,2) NOT NULL DEFAULT 0,
    total NUMERIC(14,2) NOT NULL DEFAULT 0,
    cantidad_recibida NUMERIC(12,2) NOT NULL DEFAULT 0,
    cantidad_pendiente NUMERIC(12,2) NOT NULL DEFAULT 0,
    centroCosto_id VARCHAR(50),
    equipo_id VARCHAR(50),
    orden_trabajo_id VARCHAR(50)
);

-- 11. Recepciones de Compra (Ingreso de Mercaderías y Remitos)
CREATE TABLE IF NOT EXISTS comp_recepciones (
    id VARCHAR(50) PRIMARY KEY,
    empresa_id VARCHAR(50) NOT NULL,
    numero VARCHAR(50) NOT NULL, -- ej: REC-000001
    orden_compra_id VARCHAR(50) NOT NULL REFERENCES comp_ordenes_compra(id),
    proveedor_id VARCHAR(50) NOT NULL REFERENCES comp_proveedores(id),
    proveedor_nombre_snapshot VARCHAR(150) NOT NULL,
    fecha_hora TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    numero_remito_proveedor VARCHAR(50),
    planta_id VARCHAR(50),
    deposito_id VARCHAR(50),
    tanque_id VARCHAR(50), -- FK comb_tanques (Integración combustible)
    ingreso_combustible_id VARCHAR(50), -- Legacy header reference
    recibido_por_empleado_id VARCHAR(50) NOT NULL, -- FK rrhh_empleados
    estado VARCHAR(30) NOT NULL DEFAULT 'CONFIRMADA' CHECK (estado IN ('BORRADOR', 'CONFIRMADA', 'ANULADA')),
    observaciones TEXT,
    fecha_anulacion TIMESTAMPTZ,
    usuario_anulacion VARCHAR(50),
    motivo_anulacion TEXT,
    event_id VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_comp_recepcion_empresa_numero UNIQUE (empresa_id, numero)
);

-- 12. Items de Recepción
CREATE TABLE IF NOT EXISTS comp_recepcion_items (
    id VARCHAR(50) PRIMARY KEY,
    recepcion_id VARCHAR(50) NOT NULL REFERENCES comp_recepciones(id) ON DELETE CASCADE,
    orden_compra_item_id VARCHAR(50) NOT NULL REFERENCES comp_orden_items(id),
    articulo_id VARCHAR(50),
    tipo_combustible_id VARCHAR(50) REFERENCES comb_catalogo_combustibles(id),
    ingreso_combustible_id VARCHAR(50) REFERENCES comb_ingresos_tanque(id),
    tipo VARCHAR(30) NOT NULL DEFAULT 'ARTICULO',
    descripcion_snapshot TEXT NOT NULL,
    cantidad_recibida NUMERIC(12,2) NOT NULL CHECK (cantidad_recibida > 0),
    cantidad_aceptada NUMERIC(12,2) NOT NULL CHECK (cantidad_aceptada >= 0),
    cantidad_rechazada NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (cantidad_rechazada >= 0),
    unidad_medida VARCHAR(20) NOT NULL DEFAULT 'UNIDAD',
    motivo_rechazo TEXT
);

-- 13. Facturas y Comprobantes de Proveedores
CREATE TABLE IF NOT EXISTS comp_facturas_proveedor (
    id VARCHAR(50) PRIMARY KEY,
    empresa_id VARCHAR(50) NOT NULL,
    proveedor_id VARCHAR(50) NOT NULL REFERENCES comp_proveedores(id),
    proveedor_nombre_snapshot VARCHAR(150) NOT NULL,
    proveedor_cuit_snapshot VARCHAR(50) NOT NULL,
    tipo_comprobante VARCHAR(30) NOT NULL CHECK (tipo_comprobante IN ('FACTURA_A', 'FACTURA_B', 'FACTURA_C', 'FACTURA_M', 'NOTA_DEBITO_A', 'NOTA_CREDITO_A', 'REMITO', 'TICKET_FISCAL', 'OTRO')),
    punto_venta INTEGER NOT NULL CHECK (punto_venta > 0),
    numero_comprobante INTEGER NOT NULL CHECK (numero_comprobante > 0),
    fecha_emision DATE NOT NULL,
    fecha_vencimiento DATE NOT NULL,
    moneda VARCHAR(10) NOT NULL DEFAULT 'ARS',
    tipo_cambio_snapshot NUMERIC(10,4) NOT NULL DEFAULT 1.0,
    subtotal_neto_gravado NUMERIC(14,2) NOT NULL DEFAULT 0,
    subtotal_no_gravado NUMERIC(14,2) NOT NULL DEFAULT 0,
    iva_21 NUMERIC(14,2) NOT NULL DEFAULT 0,
    iva_105 NUMERIC(14,2) NOT NULL DEFAULT 0,
    iva_27 NUMERIC(14,2) NOT NULL DEFAULT 0,
    total_iva NUMERIC(14,2) NOT NULL DEFAULT 0,
    percepciones_iibb NUMERIC(14,2) NOT NULL DEFAULT 0,
    percepciones_iva NUMERIC(14,2) NOT NULL DEFAULT 0,
    total_comprobante NUMERIC(14,2) NOT NULL DEFAULT 0,
    orden_compra_id VARCHAR(50) REFERENCES comp_ordenes_compra(id),
    recepcion_compra_id VARCHAR(50) REFERENCES comp_recepciones(id),
    estado VARCHAR(30) NOT NULL DEFAULT 'REGISTRADA' CHECK (estado IN ('BORRADOR', 'REGISTRADA', 'ANULADA')),
    observaciones TEXT,
    fecha_anulacion TIMESTAMPTZ,
    usuario_anulacion VARCHAR(50),
    motivo_anulacion TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Restricción estricta de unicidad fiscal por proveedor y comprobante
    CONSTRAINT uq_comp_factura_proveedor_fiscal UNIQUE (empresa_id, proveedor_id, tipo_comprobante, punto_venta, numero_comprobante)
);

-- 14. Eventos Procesados de Compras (Idempotencia)
CREATE TABLE IF NOT EXISTS comp_eventos_procesados (
    event_id VARCHAR(100) PRIMARY KEY,
    tipo_evento VARCHAR(100) NOT NULL,
    procesado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    origen_id VARCHAR(50),
    payload JSONB
);

-- =====================================================================
-- ÍNDICES ESTRATÉGICOS & IDEMPOTENCIA
-- =====================================================================
CREATE INDEX IF NOT EXISTS idx_comp_proveedores_empresa_estado ON comp_proveedores(empresa_id, estado);
CREATE INDEX IF NOT EXISTS idx_comp_solicitudes_empresa_estado ON comp_solicitudes(empresa_id, estado, fecha_solicitud DESC);
CREATE INDEX IF NOT EXISTS idx_comp_ordenes_empresa_proveedor ON comp_ordenes_compra(empresa_id, proveedor_id, fecha_emision DESC);
CREATE INDEX IF NOT EXISTS idx_comp_recepciones_orden ON comp_recepciones(orden_compra_id, fecha_hora DESC);
CREATE INDEX IF NOT EXISTS idx_comp_facturas_lookup ON comp_facturas_proveedor(empresa_id, proveedor_id, fecha_emision DESC);
CREATE UNIQUE INDEX IF NOT EXISTS uq_comp_recepciones_empresa_event ON comp_recepciones(empresa_id, event_id) WHERE event_id IS NOT NULL;
