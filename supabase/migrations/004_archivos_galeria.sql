-- ============================================================================
-- Migración: 004_archivos_galeria
-- Archivos individuales (imagen/video/enlace) que pertenecen a una carpeta de
-- la galería. Depende de carpetas_galeria.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.archivos_galeria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    carpeta_id UUID NOT NULL REFERENCES public.carpetas_galeria(id) ON DELETE CASCADE,
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('IMAGEN', 'VIDEO', 'ENLACE')),
    ruta_storage VARCHAR(500) NULL,
    url_externa VARCHAR(500) NULL,
    nombre_original VARCHAR(255) NULL,
    pie_foto VARCHAR(255) NULL,
    orientacion VARCHAR(50) NULL CHECK (orientacion IN ('VERTICAL', 'HORIZONTAL', 'CUADRADA')),
    ancho_px INT NULL,
    alto_px INT NULL,
    orden INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);