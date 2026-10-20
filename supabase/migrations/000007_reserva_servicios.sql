-- ==========================================
-- Migración: reserva_servicios
-- Puente N:N entre reservas y servicios_estudio. El precio se congela al
-- confirmar la reserva para que un cambio de tarifa posterior no altere lo
-- que el cliente ya aceptó.
-- ==========================================

create table reserva_servicios (
    reserva_id       uuid not null references reservas(id) on delete cascade,
    servicio_id      uuid not null references servicios_estudio(id) on delete restrict,
    precio_congelado decimal(10,2) not null check (precio_congelado >= 0),
    primary key (reserva_id, servicio_id)
);
