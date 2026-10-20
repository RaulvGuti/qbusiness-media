-- ============================================================================
-- Migración: 011_equipos_extra
-- Catálogo de equipos adicionales que pueden añadirse a una reserva. Es
-- referenciada por reserva_equipos.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.equipos_extra (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(100) UNIQUE NOT NULL,
    precio DECIMAL(10,2) NOT NULL CHECK (precio >= 0),
    activo BOOLEAN DEFAULT TRUE
);