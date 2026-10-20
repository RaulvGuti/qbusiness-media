-- ============================================================================
-- Migración: 012_reservas
-- Reservas del estudio. Es referenciada por reserva_equipos. La validación
-- chk_horas_reserva asegura que hora_fin sea posterior a hora_inicio.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.reservas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(150) NOT NULL,
    correo VARCHAR(150) NOT NULL,
    telefono VARCHAR(30) NOT NULL,
    fecha DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    tarifa_hora_aplicada DECIMAL(10,2) NOT NULL CHECK (tarifa_hora_aplicada >= 0),
    total DECIMAL(10,2) NOT NULL CHECK (total >= 0),
    estado VARCHAR(50) DEFAULT 'PENDIENTE',
    notas_cliente TEXT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT chk_horas_reserva CHECK (hora_fin > hora_inicio)
);