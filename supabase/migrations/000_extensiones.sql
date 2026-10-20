-- ============================================================================
-- Migración: 000_extensiones
-- Extensiones necesarias para el resto del esquema. pgcrypto proporciona
-- gen_random_uuid(); en Postgres 13+ ya es nativa, pero se mantiene por
-- compatibilidad con entornos locales antiguos.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";