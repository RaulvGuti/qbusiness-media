
-- Seguimiento administrativo de contactos, apoyo social y reseñas

ALTER TABLE public.leads_contacto
  ADD COLUMN IF NOT EXISTS empresa varchar,
  ADD COLUMN IF NOT EXISTS tipo_servicio varchar,
  ADD COLUMN IF NOT EXISTS presupuesto varchar,
  ADD COLUMN IF NOT EXISTS notas_admin text,
  ADD COLUMN IF NOT EXISTS actualizado_en timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.leads_contacto
  DROP CONSTRAINT IF EXISTS leads_contacto_estado_check;

ALTER TABLE public.leads_contacto
  ADD CONSTRAINT leads_contacto_estado_check
  CHECK (estado IN (
    'nuevo', 'contactado', 'cotizado',
    'en_proceso', 'cerrado', 'descartado'
  ));

ALTER TABLE public.solicitudes_apoyo_social
  ADD COLUMN IF NOT EXISTS tipo_organizacion varchar,
  ADD COLUMN IF NOT EXISTS cargo_contacto varchar,
  ADD COLUMN IF NOT EXISTS ubicacion varchar,
  ADD COLUMN IF NOT EXISTS objetivo_apoyo text,
  ADD COLUMN IF NOT EXISTS fecha_tentativa date,
  ADD COLUMN IF NOT EXISTS publico_beneficiario text,
  ADD COLUMN IF NOT EXISTS alcance_solicitado varchar,
  ADD COLUMN IF NOT EXISTS presupuesto_propio varchar,
  ADD COLUMN IF NOT EXISTS comentarios text,
  ADD COLUMN IF NOT EXISTS notas_admin text,
  ADD COLUMN IF NOT EXISTS actualizado_en timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.solicitudes_apoyo_social
  DROP CONSTRAINT IF EXISTS solicitudes_apoyo_social_estado_check;

ALTER TABLE public.solicitudes_apoyo_social
  ADD CONSTRAINT solicitudes_apoyo_social_estado_check
  CHECK (estado IN (
    'nueva', 'en_revision', 'aprobada',
    'rechazada', 'completada'
  ));

ALTER TABLE public.resenas_clientes
  ADD COLUMN IF NOT EXISTS notas_admin text,
  ADD COLUMN IF NOT EXISTS revisado_por_id uuid
    REFERENCES public.usuarios(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS revisado_en timestamptz;

-- Historial de acciones administrativas
CREATE TABLE IF NOT EXISTS public.seguimiento_administrativo (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entidad varchar NOT NULL CHECK (
    entidad IN ('contacto', 'apoyo_social', 'resena')
  ),
  entidad_id uuid NOT NULL,
  accion varchar NOT NULL CHECK (
    accion IN ('nota', 'cambio_estado', 'revision')
  ),
  estado_anterior varchar,
  estado_nuevo varchar,
  nota text,
  creado_por_id uuid REFERENCES public.usuarios(id)
    ON DELETE SET NULL,
  creado_en timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_seguimiento_entidad
  ON public.seguimiento_administrativo (entidad, entidad_id);

CREATE INDEX IF NOT EXISTS idx_apoyo_social_estado
  ON public.solicitudes_apoyo_social (estado);

CREATE INDEX IF NOT EXISTS idx_leads_creado_en
  ON public.leads_contacto (creado_en DESC);

CREATE INDEX IF NOT EXISTS idx_resenas_creado_en
  ON public.resenas_clientes (creado_en DESC);
