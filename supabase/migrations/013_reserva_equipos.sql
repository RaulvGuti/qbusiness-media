-- ============================================================================
-- Migración: 013_reserva_equipos
-- Tabla puente entre reservas y equipos_extra. El precio_aplicado se guarda al
-- momento de la reserva para no verse afectado por cambios futuros de tarifa.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.reserva_equipos (
    reserva_id UUID NOT NULL REFERENCES public.reservas(id) ON DELETE CASCADE,
    equipo_id UUID NOT NULL REFERENCES public.equipos_extra(id) ON DELETE RESTRICT,
    precio_aplicado DECIMAL(10,2) NOT NULL CHECK (precio_aplicado >= 0),
    PRIMARY KEY (reserva_id, equipo_id)
);