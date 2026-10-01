-- ====================================================================
-- MIGRACIÓN 003: MÓDULO 3 - MANTENIMIENTO, TALLER, REPUESTOS Y NEUMÁTICOS
-- Base de datos: PostgreSQL / Supabase
-- Arquitectura: Multiempresa / Multiplanta / Multi-Centro de Costo
-- ====================================================================

-- Documentación de Relaciones Maestras Externas:
-- mant_ordenes_trabajo.empresa_id         -> empresas(id)
-- mant_ordenes_trabajo.equipo_id          -> flota_equipos(id)
-- mant_ordenes_trabajo.responsable_id     -> rrhh_empleados(id)
-- mant_ordenes_trabajo.centro_costo_id    -> centros_costo(id)
-- mant_ot_repuestos.articulo_id           -> stock_articulos(id)
-- mant_ot_personal.empleado_id            -> rrhh_empleados(id)

-- 1. Órdenes de Trabajo (OT)
CREATE TABLE IF NOT EXISTS mant_ordenes_trabajo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL,
    numero_ot VARCHAR(50) NOT NULL,
    equipo_id UUID NOT NULL REFERENCES flota_equipos(id) ON DELETE RESTRICT,
    
    tipo_mantenimiento VARCHAR(30) NOT NULL CHECK (tipo_mantenimiento IN (
        'PREVENTIVO', 'CORRECTIVO', 'EMERGENCIA', 'INSPECCION', 'CAMPAÑA'
    )),
    categoria_falla VARCHAR(50) DEFAULT 'OTRO' CHECK (categoria_falla IN (
        'MOTOR', 'TRANSMISION', 'FRENOS', 'ELECTRICO', 'HIDRAULICO', 
        'NEUMATICOS', 'TAMBOR', 'CHASIS', 'SUSPENSION', 'DIRECCION', 
        'REFRIGERACION', 'COMBUSTIBLE', 'OTRO'
    )),
    prioridad VARCHAR(20) NOT NULL DEFAULT 'NORMAL' CHECK (prioridad IN (
        'BAJA', 'NORMAL', 'ALTA', 'URGENTE', 'CRITICA'
    )),
    estado VARCHAR(30) NOT NULL DEFAULT 'ABIERTA' CHECK (estado IN (
        'BORRADOR', 'ABIERTA', 'DIAGNOSTICO', 'ESPERANDO_REPUESTO', 
        'PROGRAMADA', 'EN_PROCESO', 'PAUSADA', 'TERMINADA', 'CERRADA', 'CANCELADA'
    )),
    
    -- Fechas y Tiempos Operativos
    fecha_solicitud TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fecha_apertura TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fecha_programada DATE,
    fecha_inicio_real TIMESTAMPTZ,
    fecha_fin_real TIMESTAMPTZ,
    fecha_cierre TIMESTAMPTZ,
    fecha_hora_inicio_bloqueo TIMESTAMPTZ,
    fecha_hora_fin_bloqueo TIMESTAMPTZ,
    horas_parada_equipo NUMERIC(8,2) DEFAULT 0,
    
    -- Lecturas de Contadores al Apertura / Cierre
    odometro_apertura_km NUMERIC(12,2) DEFAULT 0,
    horometro_apertura_hs NUMERIC(12,2) DEFAULT 0,
    odometro_cierre_km NUMERIC(12,2),
    horometro_cierre_hs NUMERIC(12,2),
    
    -- Diagnóstico y Reportes Técnicos
    falla_reportada TEXT NOT NULL,
    diagnostico TEXT,
    trabajo_realizado TEXT,
    causa_raiz VARCHAR(50) DEFAULT 'DESGASTE_NORMAL' CHECK (causa_raiz IN (
        'DESGASTE_NORMAL', 'FALTA_MANTENIMIENTO', 'MAL_USO', 'ROTURA_ACCIDENTAL', 
        'FALLA_COMPONENTE', 'CONTAMINACION', 'SOBRECARGA', 'DEFECTO_FABRICA', 'OTRO'
    )),
    observaciones TEXT,
    
    -- Responsables y Asignaciones
    solicitante_id UUID,
    responsable_taller_id UUID,
    centro_costo_id UUID,
    bloquea_equipo BOOLEAN NOT NULL DEFAULT true,
    
    -- Desglose de Costos
    costo_repuestos NUMERIC(14,2) NOT NULL DEFAULT 0,
    costo_mano_obra NUMERIC(14,2) NOT NULL DEFAULT 0,
    costo_servicios_terceros NUMERIC(14,2) NOT NULL DEFAULT 0,
    otros_costos NUMERIC(14,2) NOT NULL DEFAULT 0,
    costo_total NUMERIC(14,2) NOT NULL DEFAULT 0,
    
    usuario_creacion UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT uq_mant_ot_empresa_numero UNIQUE (empresa_id, numero_ot)
);

-- 2. Tareas de la Orden de Trabajo
CREATE TABLE IF NOT EXISTS mant_ot_tareas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    orden_trabajo_id UUID NOT NULL REFERENCES mant_ordenes_trabajo(id) ON DELETE CASCADE,
    descripcion TEXT NOT NULL,
    mecanico_asignado_id UUID,
    horas_estimadas NUMERIC(6,2) DEFAULT 1.0,
    horas_reales NUMERIC(6,2) DEFAULT 0,
    estado VARCHAR(30) NOT NULL DEFAULT 'PENDIENTE' CHECK (estado IN ('PENDIENTE', 'EN_PROCESO', 'COMPLETADA', 'CANCELADA')),
    orden INTEGER DEFAULT 1,
    observaciones TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Mano de Obra y Horas de Mecánicos en la OT
CREATE TABLE IF NOT EXISTS mant_ot_personal (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    orden_trabajo_id UUID NOT NULL REFERENCES mant_ordenes_trabajo(id) ON DELETE CASCADE,
    empleado_id UUID NOT NULL, -- Referencia a rrhh_empleados(id)
    tarea_id UUID REFERENCES mant_ot_tareas(id) ON DELETE SET NULL,
    fecha DATE NOT NULL,
    hora_inicio TIME,
    hora_fin TIME,
    horas_trabajadas NUMERIC(6,2) NOT NULL,
    tipo_trabajo VARCHAR(50) DEFAULT 'MECANICA_GENERAL',
    costo_horario_snapshot NUMERIC(12,2) NOT NULL DEFAULT 0,
    costo_total_laboral NUMERIC(14,2) NOT NULL DEFAULT 0,
    imputacion_costo_id UUID, -- Referencia a rrhh_imputaciones_costo_laboral(id)
    observaciones TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Repuestos e Insumos Consumidos en la OT
CREATE TABLE IF NOT EXISTS mant_ot_repuestos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    orden_trabajo_id UUID NOT NULL REFERENCES mant_ordenes_trabajo(id) ON DELETE CASCADE,
    articulo_id UUID NOT NULL, -- Referencia a stock_articulos(id)
    codigo_articulo_snapshot VARCHAR(50),
    descripcion_snapshot VARCHAR(150) NOT NULL,
    cantidad NUMERIC(10,2) NOT NULL,
    unidad_medida VARCHAR(20) NOT NULL DEFAULT 'UNIDAD',
    costo_unitario_snapshot NUMERIC(14,2) NOT NULL,
    costo_total NUMERIC(14,2) NOT NULL,
    deposito_id UUID,
    estado_solicitud VARCHAR(30) NOT NULL DEFAULT 'CONSUMIDO' CHECK (estado_solicitud IN (
        'SOLICITADO', 'RESERVADO', 'ENTREGADO', 'CONSUMIDO', 'DEVUELTO', 'CANCELADO'
    )),
    fecha TIMESTAMPTZ DEFAULT NOW(),
    usuario_registro UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Servicios Externos de Terceros en la OT
CREATE TABLE IF NOT EXISTS mant_ot_servicios_externos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    orden_trabajo_id UUID NOT NULL REFERENCES mant_ordenes_trabajo(id) ON DELETE CASCADE,
    proveedor_id UUID,
    proveedor_nombre_snapshot VARCHAR(150) NOT NULL,
    descripcion_servicio TEXT NOT NULL,
    numero_comprobante VARCHAR(100),
    fecha DATE NOT NULL,
    importe NUMERIC(14,2) NOT NULL,
    observaciones TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Planes de Mantenimiento Preventivo
CREATE TABLE IF NOT EXISTS mant_planes_mantenimiento (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL,
    codigo VARCHAR(30) NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    tipo_equipo_aplicable VARCHAR(50), -- MIXER, CARGADORA, etc. (NULL = genérico)
    frecuencia_km INTEGER,
    frecuencia_horas INTEGER,
    frecuencia_meses INTEGER,
    umbral_alerta_km INTEGER DEFAULT 500,
    umbral_alerta_horas INTEGER DEFAULT 25,
    umbral_alerta_dias INTEGER DEFAULT 15,
    descripcion TEXT,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT uq_mant_planes_empresa_codigo UNIQUE (empresa_id, codigo)
);

-- 7. Asignación de Planes Preventivos a Equipos Específicos
CREATE TABLE IF NOT EXISTS mant_equipo_planes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    equipo_id UUID NOT NULL REFERENCES flota_equipos(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES mant_planes_mantenimiento(id) ON DELETE CASCADE,
    
    ultimo_service_km NUMERIC(12,2) DEFAULT 0,
    ultimo_service_horas NUMERIC(12,2) DEFAULT 0,
    ultimo_service_fecha DATE,
    
    proximo_service_km NUMERIC(12,2),
    proximo_service_horas NUMERIC(12,2),
    proximo_service_fecha DATE,
    
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Checklists de Inspección y Mantenimiento
CREATE TABLE IF NOT EXISTS mant_checklists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    orden_trabajo_id UUID NOT NULL REFERENCES mant_ordenes_trabajo(id) ON DELETE CASCADE,
    titulo VARCHAR(150) NOT NULL,
    fecha_inspeccion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    inspector_id UUID,
    resultado_general VARCHAR(30) DEFAULT 'APROBADO' CHECK (resultado_general IN ('APROBADO', 'CON_OBSERVACIONES', 'RECHAZADO')),
    observaciones TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mant_checklist_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    checklist_id UUID NOT NULL REFERENCES mant_checklists(id) ON DELETE CASCADE,
    item_nombre VARCHAR(150) NOT NULL,
    estado VARCHAR(30) NOT NULL DEFAULT 'OK' CHECK (estado IN ('OK', 'OBSERVADO', 'REQUIERE_REPARACION', 'NO_APLICA')),
    observacion TEXT,
    tarea_generada_id UUID REFERENCES mant_ot_tareas(id) ON DELETE SET NULL
);

-- 9. Maestro de Neumáticos
CREATE TABLE IF NOT EXISTS mant_neumaticos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL,
    codigo_interno VARCHAR(30) NOT NULL,
    marca VARCHAR(100) NOT NULL,
    modelo VARCHAR(100) NOT NULL,
    medida VARCHAR(50) NOT NULL, -- ej: 295/80 R22.5
    numero_serie VARCHAR(100),
    dot VARCHAR(30),
    estado VARCHAR(30) NOT NULL DEFAULT 'EN_STOCK' CHECK (estado IN (
        'EN_STOCK', 'INSTALADO', 'EN_REPARACION', 'RECAPADO', 'BAJA'
    )),
    fecha_compra DATE,
    costo_compra NUMERIC(14,2) NOT NULL DEFAULT 0,
    costo_acumulado_reparaciones NUMERIC(14,2) NOT NULL DEFAULT 0,
    costo_total_acumulado NUMERIC(14,2) NOT NULL DEFAULT 0,
    km_actuales_totales NUMERIC(12,2) DEFAULT 0,
    profundidad_dibujo_mm NUMERIC(4,2) DEFAULT 16.0,
    veces_recapado INTEGER DEFAULT 0,
    proveedor_id UUID,
    
    -- Equipo y posición actual (cuando está instalado)
    equipo_actual_id UUID REFERENCES flota_equipos(id) ON DELETE SET NULL,
    posicion_actual VARCHAR(50),
    fecha_instalacion_actual DATE,
    km_instalacion_actual NUMERIC(12,2),
    
    observaciones TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT uq_mant_neumaticos_empresa_codigo UNIQUE (empresa_id, codigo_interno)
);

-- 10. Historial de Movimientos de Neumáticos
CREATE TABLE IF NOT EXISTS mant_movimientos_neumaticos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    neumatico_id UUID NOT NULL REFERENCES mant_neumaticos(id) ON DELETE CASCADE,
    equipo_id UUID REFERENCES flota_equipos(id) ON DELETE SET NULL,
    tipo_movimiento VARCHAR(30) NOT NULL CHECK (tipo_movimiento IN (
        'INGRESO_COMPRA', 'INSTALACION', 'ROTACION', 'DESMONTE', 
        'ENVIO_REPARACION', 'RETORNO_REPARACION', 'ENVIO_RECAPADO', 'RETORNO_RECAPADO', 'BAJA'
    )),
    posicion_origen VARCHAR(50),
    posicion_destino VARCHAR(50),
    fecha DATE NOT NULL,
    km_equipo NUMERIC(12,2) DEFAULT 0,
    costo_asociado NUMERIC(14,2) DEFAULT 0,
    motivo TEXT,
    usuario_registro UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Mediciones de Profundidad y Presión de Neumáticos
CREATE TABLE IF NOT EXISTS mant_mediciones_neumaticos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    neumatico_id UUID NOT NULL REFERENCES mant_neumaticos(id) ON DELETE CASCADE,
    fecha DATE NOT NULL,
    km_lectura NUMERIC(12,2) DEFAULT 0,
    presion_psi NUMERIC(5,1),
    profundidad_dibujo_mm NUMERIC(4,2) NOT NULL,
    desgaste_irregular BOOLEAN DEFAULT false,
    observaciones TEXT,
    inspector_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Registro e Idempotencia de Eventos de Taller y Mantenimiento
CREATE TABLE IF NOT EXISTS mant_eventos_procesados (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL,
    event_id VARCHAR(100) NOT NULL UNIQUE,
    tipo_evento VARCHAR(50) NOT NULL,
    orden_trabajo_id UUID REFERENCES mant_ordenes_trabajo(id) ON DELETE SET NULL,
    equipo_id UUID REFERENCES flota_equipos(id) ON DELETE SET NULL,
    fecha_hora TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    estado VARCHAR(30) NOT NULL DEFAULT 'PROCESADO' CHECK (estado IN ('PROCESADO', 'DUPLICADO', 'ERROR')),
    error_mensaje TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
