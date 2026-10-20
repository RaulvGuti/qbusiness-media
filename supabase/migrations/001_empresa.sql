-- ============================================================================
-- Migración: 001_empresas
-- Catálogo de empresas/clientes del negocio. Es referenciada por
-- carpetas_galeria (empresa_id) y destacados (empresa_id).
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.empresas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(150) UNIQUE NOT NULL,
    logo_ruta VARCHAR(500) NULL,
    descripcion TEXT NULL,
    activa BOOLEAN DEFAULT TRUE
);