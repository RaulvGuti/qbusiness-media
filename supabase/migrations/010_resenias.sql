-- ============================================================================
-- Migración: 010_reseñas
-- Reseñas de visitantes o del administrador. Pueden vincularse opcionalmente a
-- una carpeta de la galería (carpeta_id).
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.resenas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    autor VARCHAR(150) NOT NULL,
    empresa_autor VARCHAR(150) NULL,
    texto TEXT NOT NULL,
    calificacion SMALLINT NOT NULL CHECK (calificacion BETWEEN 1 AND 5),
    estado VARCHAR(50) DEFAULT 'PENDIENTE',
    carpeta_id UUID NULL REFERENCES public.carpetas_galeria(id) ON DELETE SET NULL,
    video_url VARCHAR(500) NULL,
    video_proporcion VARCHAR(20) NULL CHECK (video_proporcion IN ('16-9', '9-16')),
    origen VARCHAR(50) NOT NULL CHECK (origen IN ('VISITANTE', 'ADMIN')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);