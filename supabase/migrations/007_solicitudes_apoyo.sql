-- ============================================================================
-- Migración: 007_solicitudes_apoyo_social
-- Datos adicionales para los contactos cuyo origen es APOYO_SOCIAL. Relación
-- 1:1 con contactos.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.solicitudes_apoyo_social (
    contacto_id UUID PRIMARY KEY REFERENCES public.contactos(id) ON DELETE CASCADE,
    tipo_entidad VARCHAR(100) NULL,
    persona_contacto VARCHAR(150) NULL,
    fecha_evento DATE NULL,
    descripcion_apoyo TEXT NULL
);