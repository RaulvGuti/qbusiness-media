-- ============================================================================
-- Migración: 005_destacados
-- Elementos destacados del sitio, referenciando una carpeta de galería o una
-- empresa. La posición es única para controlar el orden de aparición.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.destacados (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    carpeta_id UUID NULL REFERENCES public.carpetas_galeria(id) ON DELETE CASCADE,
    empresa_id UUID NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    posicion INT UNIQUE NOT NULL
);