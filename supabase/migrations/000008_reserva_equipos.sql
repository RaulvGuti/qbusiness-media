-- ==========================================
-- Migración: reserva_equipos
-- Puente N:N entre reservas e inventario_equipos. A diferencia de los
-- servicios, aquí se rented N unidades del mismo equipo, por eso se guarda
-- `cantidad_rentada`. El precio se congela igual que en reserva_servicios.
-- ==========================================

create table reserva_equipos (
    reserva_id        uuid not null references reservas(id) on delete cascade,
    equipo_id         uuid not null references inventario_equipos(id) on delete restrict,
    cantidad_rentada  int not null check (cantidad_rentada > 0),
    precio_congelado  decimal(10,2) not null check (precio_congelado >= 0),
    primary key (reserva_id, equipo_id)
);
