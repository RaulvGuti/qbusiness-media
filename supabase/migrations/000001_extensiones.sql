-- ==========================================
-- Migración: extensiones base
-- pgcrypto aporta gen_random_uuid(), usado como clave primaria por defecto
-- en todas las tablas del esquema.
-- ==========================================

create extension if not exists pgcrypto;
