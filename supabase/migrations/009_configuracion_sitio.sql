-- ============================================================================
-- Migración: 009_configuracion_sitio
-- Pares clave/valor agrupados por sección para configuración dinámica del
-- sitio. La combinación (grupo, clave) es única.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.configuracion_sitio (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grupo VARCHAR(50) NOT NULL,
    clave VARCHAR(80) NOT NULL,
    valor TEXT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (grupo, clave)
);