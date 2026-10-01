-- ====================================================================
-- MIGRACIÓN 002: MÓDULO 2 - FLOTA Y MAQUINARIA OPERATIVA
-- Base de datos: PostgreSQL / Supabase
-- Arquitectura: Multiempresa / Multiplanta / Multi-Centro de Costo
-- ====================================================================

-- Documentación de Relaciones Maestras Externas:
-- flota_equipos.empresa_id               -> empresas(id)
-- flota_equipos.planta_habitual_id       -> plantas(id)
-- flota_equipos.centro_costo_habitual_id -> centros_costo(id)
-- flota_asignaciones_personal.empleado_id -> rrhh_empleados(id)

-- 1. Maestro Principal de Equipos y Maquinaria
CREATE TABLE IF NOT EXISTS flota_equipos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL,
    codigo_interno VARCHAR(30) NOT NULL,
    tipo_equipo VARCHAR(50) NOT NULL CHECK (tipo_equipo IN (
        'MIXER', 'CAMION', 'BOMBA_HORMIGON', 'CARGADORA', 'EXCAVADORA', 
        'RETROEXCAVADORA', 'MINICARGADORA', 'AUTOELEVADOR', 'CAMIONETA', 
        'AUTO', 'SEMIRREMOLQUE', 'GRUPO_ELECTROGENO', 'MAQUINARIA', 'OTRO'
    )),
    subtipo VARCHAR(100),
    marca VARCHAR(100) NOT NULL,
    modelo VARCHAR(100) NOT NULL,
    version VARCHAR(100),
    anio INTEGER NOT NULL,
    dominio_patente VARCHAR(30),
    numero_chasis VARCHAR(100),
    numero_motor VARCHAR(100),
    numero_serie VARCHAR(100),
    color VARCHAR(50),
    descripcion TEXT,
    
    -- Estados
    estado_administrativo VARCHAR(30) NOT NULL DEFAULT 'ACTIVO' CHECK (estado_administrativo IN (
        'ACTIVO', 'EN_PROCESO_ALTA', 'EN_TRAMITE_BAJA', 'BAJA_DEFINITIVA', 'VENDIDO'
    )),
    estado_operativo VARCHAR(30) NOT NULL DEFAULT 'DISPONIBLE' CHECK (estado_operativo IN (
        'DISPONIBLE', 'ASIGNADO', 'EN_OPERACION', 'EN_VIAJE', 'EN_TALLER', 
        'FUERA_SERVICIO', 'MANTENIMIENTO_PROGRAMADO', 'RESERVADO', 'BAJA'
    )),
    
    -- Régimen de Propiedad
    tipo_propiedad VARCHAR(30) NOT NULL DEFAULT 'PROPIO' CHECK (tipo_propiedad IN ('PROPIO', 'ALQUILADO', 'LEASING', 'TERCERO')),
    propietario_razon_social VARCHAR(150),
    proveedor_alquiler_id UUID,
    contrato_numero VARCHAR(100),
    costo_mensual_alquiler NUMERIC(14,2) DEFAULT 0,
    
    -- Asignación Geográfica y Costos
    planta_habitual_id UUID,
    centro_costo_habitual_id UUID,
    ubicacion_actual_tipo VARCHAR(30) DEFAULT 'PLANTA' CHECK (ubicacion_actual_tipo IN ('PLANTA', 'OBRA', 'CANTERA', 'TALLER', 'EN_TRANSITO', 'OTRA')),
    ubicacion_actual_referencia VARCHAR(150),
    
    -- Contadores Actuales
    odometro_km_actual NUMERIC(12,2) DEFAULT 0,
    horometro_hs_actual NUMERIC(12,2) DEFAULT 0,
    fecha_ultima_lectura TIMESTAMPTZ,
    
    -- Parámetros de Compra y Depreciación Base
    fecha_adquisicion DATE,
    valor_adquisicion_usd NUMERIC(14,2),
    vida_util_estimada_anios INTEGER,
    
    fecha_alta TIMESTAMPTZ DEFAULT NOW(),
    fecha_baja TIMESTAMPTZ,
    motivo_baja TEXT,
    observaciones TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT uq_flota_equipos_empresa_codigo UNIQUE (empresa_id, codigo_interno)
);

-- 2. Especificaciones Técnicas Detalladas
CREATE TABLE IF NOT EXISTS flota_especificaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    equipo_id UUID NOT NULL UNIQUE REFERENCES flota_equipos(id) ON DELETE CASCADE,
    
    -- Pesos y Capacidades Generales
    peso_vacio_kg NUMERIC(10,2),
    tara_kg NUMERIC(10,2),
    capacidad_carga_kg NUMERIC(10,2),
    capacidad_tanque_combustible_lt NUMERIC(8,2),
    tipo_combustible VARCHAR(30) DEFAULT 'DIESEL' CHECK (tipo_combustible IN ('DIESEL', 'NAFTA', 'GNC', 'ELECTRICO', 'HIBRIDO', 'OTRO')),
    potencia_hp NUMERIC(8,2),
    cantidad_ejes INTEGER DEFAULT 2,
    tipo_traccion VARCHAR(50), -- '4x2', '6x4', '8x4', 'Oruga', etc.
    
    -- Específico para Mixer
    capacidad_tambor_m3 NUMERIC(5,2),
    capacidad_operativa_m3 NUMERIC(5,2),
    marca_tambor VARCHAR(100),
    modelo_tambor VARCHAR(100),
    
    -- Específico para Bomba de Hormigón
    alcance_vertical_mts NUMERIC(6,2),
    alcance_horizontal_mts NUMERIC(6,2),
    caudal_maximo_m3_hora NUMERIC(6,2),
    
    -- Específico para Maquinaria de Cantera / Áridos
    capacidad_balde_m3 NUMERIC(5,2),
    peso_operativo_kg NUMERIC(10,2)
);

-- 3. Historial Inmutable de Lecturas de Odómetro y Horómetro
CREATE TABLE IF NOT EXISTS flota_lecturas_contadores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    equipo_id UUID NOT NULL REFERENCES flota_equipos(id) ON DELETE CASCADE,
    fecha_hora TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    tipo_contador VARCHAR(30) NOT NULL CHECK (tipo_contador IN ('ODOMETRO_KM', 'HOROMETRO_HS')),
    valor NUMERIC(12,2) NOT NULL,
    origen_lectura VARCHAR(30) NOT NULL CHECK (origen_lectura IN ('MANUAL', 'VIAJE', 'TALLER', 'TELEMETRIA', 'GPS', 'IMPORTACION')),
    referencia_origen_id VARCHAR(100), -- ej. id del viaje o de la OT
    usuario_registro UUID,
    observaciones TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Documentación y Semáforo de Vencimientos
CREATE TABLE IF NOT EXISTS flota_documentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    equipo_id UUID NOT NULL REFERENCES flota_equipos(id) ON DELETE CASCADE,
    tipo_documento VARCHAR(50) NOT NULL CHECK (tipo_documento IN (
        'CEDULA_IDENTIFICACION', 'SEGURO_AUTOMOTOR', 'RTO_VTV', 
        'HABILITACION_SENASA', 'HABILITACION_MUNICIPAL', 'PERMISO_CARGA_PESADA', 
        'POLIZA_SEGURO', 'CERTIFICADO_CALIBRACION', 'OTRO'
    )),
    numero VARCHAR(100),
    entidad_emisora VARCHAR(100),
    fecha_emision DATE,
    fecha_vencimiento DATE,
    bloqueante_operativo BOOLEAN DEFAULT false,
    archivo_url TEXT,
    observaciones TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Pólizas de Seguro Específicas
CREATE TABLE IF NOT EXISTS flota_seguros (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    equipo_id UUID NOT NULL REFERENCES flota_equipos(id) ON DELETE CASCADE,
    compania_aseguradora VARCHAR(100) NOT NULL,
    numero_poliza VARCHAR(100) NOT NULL,
    tipo_cobertura VARCHAR(100) NOT NULL, -- 'Responsabilidad Civil', 'Todo Riesgo', 'Terceros Completo'
    vigencia_desde DATE NOT NULL,
    vigencia_hasta DATE NOT NULL,
    suma_asegurada_usd NUMERIC(14,2),
    contacto_productor TEXT,
    archivo_poliza_url TEXT,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Historial de Asignaciones de Operadores/Choferes a Equipos
CREATE TABLE IF NOT EXISTS flota_asignaciones_personal (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    equipo_id UUID NOT NULL REFERENCES flota_equipos(id) ON DELETE CASCADE,
    empleado_id UUID NOT NULL, -- Referencia a rrhh_empleados(id)
    fecha_desde TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fecha_hasta TIMESTAMPTZ,
    tipo_asignacion VARCHAR(30) NOT NULL DEFAULT 'HABITUAL' CHECK (tipo_asignacion IN ('HABITUAL', 'TEMPORAL', 'RELEVO', 'PRUEBA')),
    origen VARCHAR(50) DEFAULT 'ASIGNACION_MANUAL',
    estado VARCHAR(30) NOT NULL DEFAULT 'ACTIVA' CHECK (estado IN ('ACTIVA', 'FINALIZADA', 'CANCELADA')),
    observaciones TEXT,
    usuario_registro UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
