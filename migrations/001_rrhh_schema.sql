-- ====================================================================
-- MIGRACIÓN 001: MÓDULO 1 - PERSONAL / RRHH / ASISTENCIA / SUELDOS
-- Base de datos: PostgreSQL / Supabase
-- ====================================================================

-- 1. Maestros y Legajos
CREATE TABLE IF NOT EXISTS rrhh_empleados (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL,
    legajo VARCHAR(20) NOT NULL UNIQUE,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    dni VARCHAR(20) NOT NULL UNIQUE,
    cuil VARCHAR(20) NOT NULL UNIQUE,
    fecha_nacimiento DATE,
    fecha_ingreso DATE NOT NULL,
    fecha_antiguedad_reconocida DATE,
    fecha_egreso DATE,
    motivo_egreso TEXT,
    estado VARCHAR(20) NOT NULL DEFAULT 'ACTIVO' CHECK (estado IN ('ACTIVO', 'LICENCIA', 'VACACIONES', 'SUSPENDIDO', 'BAJA')),
    categoria VARCHAR(100) NOT NULL,
    convenio VARCHAR(100) NOT NULL,
    planta_habitual_id UUID,
    centro_costo_habitual_id UUID,
    banco VARCHAR(100),
    cbu_alias VARCHAR(50),
    telefono VARCHAR(50),
    email VARCHAR(100),
    domicilio TEXT,
    contacto_emergencia TEXT,
    telefono_emergencia VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rrhh_empleado_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empleado_id UUID NOT NULL REFERENCES rrhh_empleados(id) ON DELETE CASCADE,
    rol VARCHAR(50) NOT NULL,
    es_principal BOOLEAN DEFAULT false,
    UNIQUE(empleado_id, rol)
);

CREATE TABLE IF NOT EXISTS rrhh_historial_laboral (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empleado_id UUID NOT NULL REFERENCES rrhh_empleados(id) ON DELETE CASCADE,
    fecha_vigencia_desde DATE NOT NULL,
    fecha_vigencia_hasta DATE,
    sueldo_basico NUMERIC(14,2) NOT NULL,
    categoria VARCHAR(100) NOT NULL,
    puesto VARCHAR(100) NOT NULL,
    centro_costo_id UUID,
    planta_id UUID,
    motivo_cambio TEXT,
    usuario_registro UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rrhh_documentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empleado_id UUID NOT NULL REFERENCES rrhh_empleados(id) ON DELETE CASCADE,
    tipo VARCHAR(50) NOT NULL,
    numero VARCHAR(100),
    fecha_emision DATE,
    fecha_vencimiento DATE,
    bloqueante_operativo BOOLEAN DEFAULT false,
    archivo_url TEXT,
    observaciones TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rrhh_habilitaciones_equipos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empleado_id UUID NOT NULL REFERENCES rrhh_empleados(id) ON DELETE CASCADE,
    equipo_tipo VARCHAR(50) NOT NULL,
    habilitado BOOLEAN DEFAULT true,
    fecha_vencimiento DATE,
    certificado_nro VARCHAR(100),
    UNIQUE(empleado_id, equipo_tipo)
);

-- 2. Asistencia, Turnos y Jornadas
CREATE TABLE IF NOT EXISTS rrhh_turnos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(20) NOT NULL UNIQUE,
    nombre VARCHAR(100) NOT NULL,
    hora_entrada TIME NOT NULL,
    hora_salida TIME NOT NULL,
    cruza_medianoche BOOLEAN DEFAULT false,
    tolerancia_tardanza_min INTEGER DEFAULT 10,
    activo BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS rrhh_fichadas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empleado_id UUID NOT NULL REFERENCES rrhh_empleados(id),
    fecha DATE NOT NULL,
    hora TIME NOT NULL,
    tipo VARCHAR(30) NOT NULL CHECK (tipo IN ('ENTRADA', 'SALIDA', 'INICIO_DESCANSO', 'FIN_DESCANSO')),
    origen VARCHAR(30) DEFAULT 'MANUAL',
    usuario_registro UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rrhh_jornadas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empleado_id UUID NOT NULL REFERENCES rrhh_empleados(id),
    fecha DATE NOT NULL,
    turno_id UUID REFERENCES rrhh_turnos(id),
    horas_presencia NUMERIC(5,2) NOT NULL DEFAULT 0,
    horas_descanso NUMERIC(5,2) NOT NULL DEFAULT 0,
    horas_normales NUMERIC(5,2) NOT NULL DEFAULT 0,
    horas_extra_50 NUMERIC(5,2) NOT NULL DEFAULT 0,
    horas_extra_100 NUMERIC(5,2) NOT NULL DEFAULT 0,
    horas_nocturnas NUMERIC(5,2) NOT NULL DEFAULT 0,
    tardanza_minutos INTEGER DEFAULT 0,
    estado VARCHAR(30) DEFAULT 'CALCULADA' CHECK (estado IN ('CALCULADA', 'REVISADA', 'APROBADA', 'OBSERVADA')),
    UNIQUE(empleado_id, fecha)
);

CREATE TABLE IF NOT EXISTS rrhh_horas_extra (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    jornada_id UUID REFERENCES rrhh_jornadas(id),
    empleado_id UUID NOT NULL REFERENCES rrhh_empleados(id),
    fecha DATE NOT NULL,
    horas NUMERIC(5,2) NOT NULL,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('EXTRA_50', 'EXTRA_100', 'NOCTURNA_EXTRA')),
    estado VARCHAR(30) DEFAULT 'PENDIENTE_APROBACION' CHECK (estado IN ('CALCULADA', 'PENDIENTE_APROBACION', 'APROBADA', 'RECHAZADA')),
    responsable_aprobacion UUID,
    fecha_aprobacion TIMESTAMPTZ,
    motivo_rechazo TEXT
);

-- 3. Novedades, Vacaciones y Licencias
CREATE TABLE IF NOT EXISTS rrhh_novedades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empleado_id UUID NOT NULL REFERENCES rrhh_empleados(id),
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('VACACIONES', 'LICENCIA_MEDICA', 'ART_ACCIDENTE', 'ESTUDIO', 'SUSPENSION', 'FRANCO', 'OTRO')),
    fecha_desde DATE NOT NULL,
    fecha_hasta DATE NOT NULL,
    con_goce_sueldo BOOLEAN DEFAULT true,
    dias_totales INTEGER NOT NULL,
    documento_adjunto_url TEXT,
    observaciones TEXT,
    estado VARCHAR(30) DEFAULT 'SOLICITADA' CHECK (estado IN ('SOLICITADA', 'APROBADA', 'RECHAZADA', 'TOMADA')),
    usuario_aprobacion UUID
);

-- 4. Adelantos y Préstamos
CREATE TABLE IF NOT EXISTS rrhh_adelantos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empleado_id UUID NOT NULL REFERENCES rrhh_empleados(id),
    fecha_solicitud DATE NOT NULL,
    importe NUMERIC(12,2) NOT NULL,
    motivo TEXT,
    estado VARCHAR(30) DEFAULT 'SOLICITADO' CHECK (estado IN ('SOLICITADO', 'APROBADO', 'PAGADO', 'DESCONTADO', 'ANULADO')),
    liquidacion_id UUID,
    fecha_pago DATE,
    usuario_aprobacion UUID
);

CREATE TABLE IF NOT EXISTS rrhh_prestamos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empleado_id UUID NOT NULL REFERENCES rrhh_empleados(id),
    monto_total NUMERIC(12,2) NOT NULL,
    cantidad_cuotas INTEGER NOT NULL,
    importe_cuota NUMERIC(12,2) NOT NULL,
    fecha_inicio DATE NOT NULL,
    saldo_pendiente NUMERIC(12,2) NOT NULL,
    estado VARCHAR(30) DEFAULT 'ACTIVO' CHECK (estado IN ('SOLICITADO', 'ACTIVO', 'CANCELADO', 'ANULADO'))
);

CREATE TABLE IF NOT EXISTS rrhh_prestamos_cuotas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prestamo_id UUID NOT NULL REFERENCES rrhh_prestamos(id) ON DELETE CASCADE,
    numero_cuota INTEGER NOT NULL,
    importe NUMERIC(12,2) NOT NULL,
    periodo_descuento VARCHAR(7) NOT NULL,
    estado VARCHAR(30) DEFAULT 'PENDIENTE' CHECK (estado IN ('PENDIENTE', 'DESCONTADA', 'CANCELADA_ANTICIPADA')),
    liquidacion_id UUID
);

-- 5. Configuración de Conceptos y Reglas Versionadas
CREATE TABLE IF NOT EXISTS rrhh_conceptos_liquidacion (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(20) NOT NULL UNIQUE,
    nombre VARCHAR(100) NOT NULL,
    tipo VARCHAR(30) NOT NULL CHECK (tipo IN ('REMUNERATIVO', 'NO_REMUNERATIVO', 'DESCUENTO', 'CONTRIBUCION_PATRONAL')),
    modo_calculo VARCHAR(30) NOT NULL CHECK (modo_calculo IN ('PORCENTAJE', 'FIJO', 'FORMULA', 'DIARIO_HORA')),
    porcentaje NUMERIC(6,4) DEFAULT 0,
    importe_fijo NUMERIC(12,2) DEFAULT 0,
    base_calculo VARCHAR(50) DEFAULT 'BASICO',
    vigencia_desde DATE NOT NULL,
    vigencia_hasta DATE,
    convenio VARCHAR(100),
    impacta_sac BOOLEAN DEFAULT true,
    impacta_vacaciones BOOLEAN DEFAULT true,
    activo BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS rrhh_reglas_salariales_versiones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version VARCHAR(20) NOT NULL,
    vigencia_desde DATE NOT NULL,
    vigencia_hasta DATE,
    horas_base_mensuales NUMERIC(5,2) DEFAULT 176,
    coef_cargas_patronales NUMERIC(6,4) NOT NULL,
    coef_art NUMERIC(6,4) NOT NULL,
    observaciones TEXT
);

-- 6. Liquidaciones, Snapshots y Pagos
CREATE TABLE IF NOT EXISTS rrhh_liquidaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    periodo VARCHAR(7) NOT NULL,
    tipo VARCHAR(30) NOT NULL CHECK (tipo IN ('MENSUAL', 'QUINCENAL', 'SAC', 'VACACIONES', 'FINAL', 'ESPECIAL')),
    empleado_id UUID NOT NULL REFERENCES rrhh_empleados(id),
    sueldo_basico NUMERIC(14,2) NOT NULL,
    total_remunerativo NUMERIC(14,2) NOT NULL,
    total_no_remunerativo NUMERIC(14,2) NOT NULL,
    total_descuentos NUMERIC(14,2) NOT NULL,
    neto_a_pagar NUMERIC(14,2) NOT NULL,
    contribuciones_patronales NUMERIC(14,2) NOT NULL,
    costo_total_empresa NUMERIC(14,2) NOT NULL,
    estado VARCHAR(30) DEFAULT 'BORRADOR' CHECK (estado IN ('BORRADOR', 'CALCULADA', 'REVISADA', 'APROBADA', 'CERRADA', 'PAGADA', 'ANULADA')),
    fecha_cierre TIMESTAMPTZ,
    usuario_cierre UUID,
    UNIQUE(periodo, tipo, empleado_id)
);

CREATE TABLE IF NOT EXISTS rrhh_liquidacion_detalles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    liquidacion_id UUID NOT NULL REFERENCES rrhh_liquidaciones(id) ON DELETE CASCADE,
    concepto_codigo VARCHAR(20) NOT NULL,
    concepto_nombre VARCHAR(100) NOT NULL,
    tipo VARCHAR(30) NOT NULL,
    cantidad NUMERIC(8,2) DEFAULT 1,
    unidad VARCHAR(20) DEFAULT 'UN',
    base_calculo NUMERIC(14,2) DEFAULT 0,
    porcentaje NUMERIC(6,4) DEFAULT 0,
    haberes NUMERIC(14,2) DEFAULT 0,
    descuentos NUMERIC(14,2) DEFAULT 0,
    orden INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS rrhh_liquidacion_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    liquidacion_id UUID NOT NULL UNIQUE REFERENCES rrhh_liquidaciones(id),
    snapshot_json JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Imputación Laboral Idempotente
CREATE TABLE IF NOT EXISTS rrhh_imputaciones_costo_laboral (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id VARCHAR(100) NOT NULL UNIQUE,
    empleado_id UUID NOT NULL REFERENCES rrhh_empleados(id),
    fecha DATE NOT NULL,
    centro_costo_id UUID NOT NULL,
    origen_modulo VARCHAR(30) NOT NULL CHECK (origen_modulo IN ('LOGISTICA_VIAJE', 'TALLER_OT', 'ARIDOS_MAQUINARIA', 'PRODUCCION_PLANTA', 'MANUAL')),
    origen_id VARCHAR(100) NOT NULL,
    equipo_id UUID,
    horas_imputadas NUMERIC(6,2) NOT NULL,
    costo_horario_aplicado NUMERIC(12,2) NOT NULL,
    costo_total_imputado NUMERIC(14,2) NOT NULL,
    periodo_imputacion VARCHAR(7) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Auditoría del Sistema
CREATE TABLE IF NOT EXISTS auditoria_sistema (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fecha_hora TIMESTAMPTZ DEFAULT NOW(),
    usuario_id UUID,
    usuario_nombre VARCHAR(100),
    entidad VARCHAR(50) NOT NULL,
    registro_id VARCHAR(100) NOT NULL,
    accion VARCHAR(50) NOT NULL,
    valor_anterior JSONB,
    valor_nuevo JSONB,
    motivo TEXT
);
