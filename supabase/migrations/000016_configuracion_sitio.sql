-- ==========================================
-- Migración: configuracion_sitio
-- Pares grupo/clave editables desde el panel. Por ahora se usa para la tarifa
-- por hora del salón (estudio / tarifa_hora), que sirve de base para calcular
-- el total de cada reserva.
-- ==========================================

create table configuracion_sitio (
    id             uuid primary key default gen_random_uuid(),
    grupo          varchar not null
                   check (grupo in ('menu','modulos','formularios','contacto','redes','ubicacion','estudio')),
    clave          varchar not null,
    valor          text,
    actualizado_en timestamptz not null default now(),
    unique (grupo, clave)
);

create or replace function public.set_actualizado_en()
returns trigger
language plpgsql
as $$
begin
    new.actualizado_en = now();
    return new;
end;
$$;

create trigger trg_configuracion_actualizado
before update on configuracion_sitio
for each row execute function public.set_actualizado_en();

-- Tarifa por hora del salón. El administrador debe asignarle un valor > 0;
-- mientras esté vacía, nadie puede solicitar reservas.
-- Ejemplo: update configuracion_sitio set valor = '150.00' where grupo = 'estudio' and clave = 'tarifa_hora';
insert into configuracion_sitio (grupo, clave, valor)
values ('estudio', 'tarifa_hora', null)
on conflict (grupo, clave) do nothing;
