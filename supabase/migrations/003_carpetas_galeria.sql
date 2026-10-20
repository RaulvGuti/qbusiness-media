-- ============================================================================
-- Migración: 003_carpetas_galeria
-- Agrupador de contenido multimedia por módulo del sitio. Es referenciada por
-- archivos_galeria, destacados y resenas.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.carpetas_galeria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    modulo VARCHAR(50) NOT NULL CHECK (modulo IN ('PORTAFOLIO', 'BACKSTAGE', 'ESTUDIO', 'APOYO_SOCIAL')),
    nombre VARCHAR(150) NOT NULL,
    etiqueta VARCHAR(50) NULL,
    descripcion TEXT NULL,
    filtro VARCHAR(50) NULL,
    categoria VARCHAR(50) NULL,
    equipo_usado VARCHAR(255) NULL,
    lugar VARCHAR(150) NULL,
    empresa_id UUID NULL REFERENCES public.empresas(id) ON DELETE SET NULL,
    estado VARCHAR(50) DEFAULT 'BORRADOR',
    publicada_en TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);