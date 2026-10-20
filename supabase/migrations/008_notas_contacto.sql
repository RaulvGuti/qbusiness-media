-- ============================================================================
-- Migración: 008_notas_contacto
-- Notas internas asociadas a un contacto, escritas por un usuario del panel
-- administrativo. Depende de contactos y perfiles.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.notas_contacto (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contacto_id UUID NOT NULL REFERENCES public.contactos(id) ON DELETE CASCADE,
    autor_id UUID NOT NULL REFERENCES public.perfiles(id) ON DELETE RESTRICT,
    texto TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);