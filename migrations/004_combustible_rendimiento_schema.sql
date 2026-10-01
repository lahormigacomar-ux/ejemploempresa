-- =====================================================================
-- MÓDULO 4: COMBUSTIBLE Y RENDIMIENTO
-- Esquema relacional PostgreSQL / Supabase
-- =====================================================================

-- 1. Catálogo Configurable de Tipos de Combustible
CREATE TABLE IF NOT EXISTS comb_tipos_combustible (
    id VARCHAR(50) PRIMARY KEY,
    empresa_id VARCHAR(50) NOT NULL,
    codigo VARCHAR(50) NOT NULL, -- ej: DIESEL_500, DIESEL_PREMIUM, NAFTA_SUPER, UREA
    nombre VARCHAR(100) NOT NULL,
    unidad_medida VARCHAR(20) NOT NULL DEFAULT 'LITRO',
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    precio_referencia NUMERIC(12,2) DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_comb_tipo_empresa_codigo UNIQUE (empresa_id, codigo)
);

-- 2. Tanques Internos de Combustible
CREATE TABLE IF NOT EXISTS comb_tanques (
    id VARCHAR(50) PRIMARY KEY,
    empresa_id VARCHAR(50) NOT NULL,
    codigo VARCHAR(50) NOT NULL, -- ej: TQ-PL1-01
    nombre VARCHAR(100) NOT NULL,
    tipo_combustible_id VARCHAR(50) NOT NULL REFERENCES comb_tipos_combustible(id),
    capacidad_litros NUMERIC(12,2) NOT NULL CHECK (capacidad_litros > 0),
    planta_id VARCHAR(50),
    deposito_id VARCHAR(50),
    centro_costo_id VARCHAR(50),
    estado VARCHAR(30) NOT NULL DEFAULT 'ACTIVO' CHECK (estado IN ('ACTIVO', 'INACTIVO', 'MANTENIMIENTO')),
    stock_actual_litros NUMERIC(12,2) NOT NULL DEFAULT 0,
    stock_minimo_litros NUMERIC(12,2) NOT NULL DEFAULT 0,
    permite_stock_negativo BOOLEAN NOT NULL DEFAULT FALSE,
    observaciones TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_comb_tanque_empresa_codigo UNIQUE (empresa_id, codigo)
);

-- 3. Movimientos Físicos del Tanque (Kardex / Auditoría de Stock)
CREATE TABLE IF NOT EXISTS comb_movimientos_tanque (
    id VARCHAR(50) PRIMARY KEY,
    empresa_id VARCHAR(50) NOT NULL,
    tanque_id VARCHAR(50) NOT NULL REFERENCES comb_tanques(id),
    fecha_hora TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    tipo_movimiento VARCHAR(30) NOT NULL CHECK (tipo_movimiento IN ('INGRESO', 'EGRESO', 'AJUSTE_POSITIVO', 'AJUSTE_NEGATIVO')),
    litros NUMERIC(12,2) NOT NULL CHECK (litros > 0),
    origen_modulo VARCHAR(50) NOT NULL, -- 'COMBUSTIBLE_ABASTECIMIENTO', 'COMBUSTIBLE_INGRESO', 'COMBUSTIBLE_AJUSTE', 'ANULACION_ABASTECIMIENTO'
    origen_id VARCHAR(50) NOT NULL,
    costo_unitario_snapshot NUMERIC(12,2),
    costo_total_snapshot NUMERIC(14,2),
    stock_anterior_litros NUMERIC(12,2) NOT NULL,
    stock_posterior_litros NUMERIC(12,2) NOT NULL,
    usuario_id VARCHAR(50),
    observaciones TEXT,
    event_id VARCHAR(100)
);

-- 4. Ingresos de Combustible al Tanque (Recepción de Cisternas / Proveedores)
CREATE TABLE IF NOT EXISTS comb_ingresos_tanque (
    id VARCHAR(50) PRIMARY KEY,
    empresa_id VARCHAR(50) NOT NULL,
    tanque_id VARCHAR(50) NOT NULL REFERENCES comb_tanques(id),
    fecha_hora TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    litros NUMERIC(12,2) NOT NULL CHECK (litros > 0),
    proveedor_id VARCHAR(50), -- FK futura a compras_proveedores(id)
    proveedor_nombre_snapshot VARCHAR(150) NOT NULL,
    numero_remito VARCHAR(50),
    numero_factura VARCHAR(50),
    precio_unitario NUMERIC(12,2) NOT NULL CHECK (precio_unitario >= 0),
    costo_total NUMERIC(14,2) NOT NULL CHECK (costo_total >= 0),
    usuario_id VARCHAR(50),
    observaciones TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Abastecimientos de Combustible a Equipos (Despacho / Consumo)
CREATE TABLE IF NOT EXISTS comb_abastecimientos (
    id VARCHAR(50) PRIMARY KEY,
    empresa_id VARCHAR(50) NOT NULL,
    numero_vale VARCHAR(50),
    fecha_hora TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    equipo_id VARCHAR(50) NOT NULL, -- FK futura a flota_equipos(id)
    empleado_id VARCHAR(50), -- FK futura a rrhh_empleados(id)
    tipo_combustible_id VARCHAR(50) NOT NULL REFERENCES comb_tipos_combustible(id),
    origen_abastecimiento VARCHAR(30) NOT NULL CHECK (origen_abastecimiento IN ('TANQUE_INTERNO', 'ESTACION_SERVICIO', 'PROVEEDOR_DIRECTO', 'OTRO')),
    tanque_id VARCHAR(50) REFERENCES comb_tanques(id),
    estacion_servicio_nombre_snapshot VARCHAR(150),
    proveedor_nombre_snapshot VARCHAR(150),
    litros NUMERIC(12,2) NOT NULL CHECK (litros > 0),
    precio_unitario_snapshot NUMERIC(12,2) NOT NULL CHECK (precio_unitario_snapshot >= 0),
    costo_total_snapshot NUMERIC(14,2) NOT NULL CHECK (costo_total_snapshot >= 0),
    
    -- Contadores Odómetro / Horómetro
    odometro_km_snapshot NUMERIC(12,2),
    horometro_hs_snapshot NUMERIC(12,2),
    odometro_km_anterior_snapshot NUMERIC(12,2),
    horometro_hs_anterior_snapshot NUMERIC(12,2),
    km_recorridos_estimados NUMERIC(12,2),
    horas_trabajadas_estimadas NUMERIC(12,2),
    
    -- Rendimiento & Desvío
    rendimiento_calculado NUMERIC(10,2),
    metrica_rendimiento VARCHAR(30) CHECK (metrica_rendimiento IN ('KM_L', 'L_100KM', 'L_HORA', 'L_VIAJE', 'L_M3', 'L_TONELADA', 'L_CICLO')),
    nivel_desvio VARCHAR(30) DEFAULT 'SIN_REFERENCIA' CHECK (nivel_desvio IN ('NORMAL', 'ADVERTENCIA', 'CRITICO', 'SIN_REFERENCIA', 'SIN_DATOS')),
    
    centro_costo_id VARCHAR(50),
    numero_comprobante VARCHAR(50),
    numero_ticket VARCHAR(50),
    foto_ticket_url TEXT,
    observaciones TEXT,
    
    estado VARCHAR(30) NOT NULL DEFAULT 'CONFIRMADO' CHECK (estado IN ('BORRADOR', 'CONFIRMADO', 'ANULADO')),
    fecha_anulacion TIMESTAMPTZ,
    usuario_anulacion VARCHAR(50),
    motivo_anulacion TEXT,
    
    viaje_id VARCHAR(50), -- FK futura a logistica_viajes(id)
    actividad_id VARCHAR(50),
    event_id VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Mediciones Físicas de Tanque (Aforo / Varillado)
CREATE TABLE IF NOT EXISTS comb_mediciones_tanque (
    id VARCHAR(50) PRIMARY KEY,
    empresa_id VARCHAR(50) NOT NULL,
    tanque_id VARCHAR(50) NOT NULL REFERENCES comb_tanques(id),
    fecha_hora TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    litros_medidos NUMERIC(12,2) NOT NULL CHECK (litros_medidos >= 0),
    metodo VARCHAR(30) NOT NULL CHECK (metodo IN ('MANUAL', 'VARILLA', 'MEDIDOR', 'SENSOR')),
    stock_sistema_momento NUMERIC(12,2) NOT NULL,
    diferencia_litros NUMERIC(12,2) NOT NULL,
    usuario_id VARCHAR(50),
    observaciones TEXT
);

-- 7. Ajustes de Inventario de Tanque (Reconciliación)
CREATE TABLE IF NOT EXISTS comb_ajustes_tanque (
    id VARCHAR(50) PRIMARY KEY,
    empresa_id VARCHAR(50) NOT NULL,
    tanque_id VARCHAR(50) NOT NULL REFERENCES comb_tanques(id),
    fecha_hora TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    stock_sistema_antes NUMERIC(12,2) NOT NULL,
    stock_medido NUMERIC(12,2) NOT NULL,
    diferencia_litros NUMERIC(12,2) NOT NULL,
    tipo_ajuste VARCHAR(20) NOT NULL CHECK (tipo_ajuste IN ('POSITIVO', 'NEGATIVO')),
    motivo TEXT NOT NULL,
    usuario_id VARCHAR(50) NOT NULL,
    movimiento_tanque_id VARCHAR(50) REFERENCES comb_movimientos_tanque(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Parámetros y Objetivos de Rendimiento (Históricos Versionados)
CREATE TABLE IF NOT EXISTS comb_parametros_rendimiento (
    id VARCHAR(50) PRIMARY KEY,
    empresa_id VARCHAR(50) NOT NULL,
    equipo_id VARCHAR(50), -- FK futura a flota_equipos(id)
    tipo_equipo VARCHAR(50), -- 'MIXER', 'CARGADORA', 'CAMION', 'BOMBA', etc.
    metrica VARCHAR(30) NOT NULL CHECK (metrica IN ('KM_L', 'L_100KM', 'L_HORA', 'L_VIAJE', 'L_M3', 'L_TONELADA', 'L_CICLO')),
    valor_objetivo NUMERIC(10,2) NOT NULL CHECK (valor_objetivo > 0),
    tolerancia_advertencia_pct NUMERIC(5,2) NOT NULL DEFAULT 10.0,
    tolerancia_critica_pct NUMERIC(5,2) NOT NULL DEFAULT 20.0,
    vigencia_desde DATE NOT NULL,
    vigencia_hasta DATE,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    observaciones TEXT
);

-- 9. Alertas Operativas de Combustible
CREATE TABLE IF NOT EXISTS comb_alertas (
    id VARCHAR(50) PRIMARY KEY,
    empresa_id VARCHAR(50) NOT NULL,
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN (
        'CONSUMO_CRITICO', 'CONSUMO_ADVERTENCIA', 'TANQUE_BAJO_MINIMO', 
        'DIFERENCIA_INVENTARIO', 'CARGA_DUPLICADA', 'LECTURA_INVALIDA', 
        'EQUIPO_NO_HABILITADO', 'COMPROBANTE_DUPLICADO'
    )),
    severidad VARCHAR(20) NOT NULL CHECK (severidad IN ('INFORMATIVA', 'ADVERTENCIA', 'BLOQUEANTE')),
    titulo VARCHAR(150) NOT NULL,
    descripcion TEXT NOT NULL,
    origen_modulo VARCHAR(50) NOT NULL,
    origen_id VARCHAR(50) NOT NULL,
    equipo_id VARCHAR(50),
    tanque_id VARCHAR(50),
    fecha TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resuelta BOOLEAN NOT NULL DEFAULT FALSE,
    resuelta_por VARCHAR(50),
    fecha_resolucion TIMESTAMPTZ
);

-- 10. Control de Eventos Procesados (Idempotencia)
CREATE TABLE IF NOT EXISTS comb_eventos_procesados (
    event_id VARCHAR(100) PRIMARY KEY,
    tipo_evento VARCHAR(100) NOT NULL,
    procesado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    origen_id VARCHAR(50),
    payload JSONB
);

-- =====================================================================
-- ÍNDICES ESTRATÉGICOS
-- =====================================================================
CREATE INDEX IF NOT EXISTS idx_comb_tanques_empresa ON comb_tanques(empresa_id, estado);
CREATE INDEX IF NOT EXISTS idx_comb_movimientos_tanque ON comb_movimientos_tanque(tanque_id, fecha_hora DESC);
CREATE INDEX IF NOT EXISTS idx_comb_abastecimientos_equipo ON comb_abastecimientos(equipo_id, fecha_hora DESC);
CREATE INDEX IF NOT EXISTS idx_comb_abastecimientos_empresa_fecha ON comb_abastecimientos(empresa_id, fecha_hora DESC);
CREATE INDEX IF NOT EXISTS idx_comb_abastecimientos_tanque ON comb_abastecimientos(tanque_id, fecha_hora DESC);
CREATE INDEX IF NOT EXISTS idx_comb_abastecimientos_event_id ON comb_abastecimientos(event_id);
CREATE INDEX IF NOT EXISTS idx_comb_parametros_lookup ON comb_parametros_rendimiento(empresa_id, equipo_id, tipo_equipo, vigencia_desde);
CREATE INDEX IF NOT EXISTS idx_comb_alertas_activas ON comb_alertas(empresa_id, resuelta, severidad);
