-- ============================================================================
-- Migración: 006_contactos
-- Mensajes entrantes desde el formulario de contacto y desde apoyo social. Es
-- referenciada por solicitudes_apoyo_social y notas_contacto.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.contactos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(150) NOT NULL,
    correo VARCHAR(150) NOT NULL,
    telefono VARCHAR(30) NOT NULL,
    mensaje TEXT NOT NULL,
    origen VARCHAR(50) NOT NULL CHECK (origen IN ('CONTACTANOS', 'APOYO_SOCIAL')),
    estado VARCHAR(50) DEFAULT 'NUEVO',
    created_at TIMESTAMPTZ DEFAULT NOW()
);