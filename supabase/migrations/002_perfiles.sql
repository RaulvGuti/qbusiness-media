-- ============================================================================
-- Migración: 002_perfiles
-- Relación 1:1 con auth.users. Define el perfil de administración y es
-- referenciada por notas_contacto (autor_id) y fechas_bloqueadas (creado_por).
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.perfiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nombre_completo VARCHAR(150) NOT NULL,
    correo_electronico VARCHAR(150) UNIQUE NOT NULL,
    rol VARCHAR(50) DEFAULT 'ADMIN',
    created_at TIMESTAMPTZ DEFAULT NOW()
);