-- ============================================================================
-- Migración: 014_fechas_bloqueadas
-- Rangos de fechas en los que el estudio no está disponible para reservas.
-- Depende de perfiles (creado_por). chk_rango_fechas asegura un rango válido.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.fechas_bloqueadas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    desde DATE NOT NULL,
    hasta DATE NOT NULL,
    motivo VARCHAR(255) NULL,
    creado_por UUID NOT NULL REFERENCES public.perfiles(id) ON DELETE RESTRICT,
    CONSTRAINT chk_rango_fechas CHECK (hasta >= desde)
);