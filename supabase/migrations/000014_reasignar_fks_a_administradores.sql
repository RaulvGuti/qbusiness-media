-- ==========================================
-- Migración: reasignar_fks_a_administradores
-- portafolio, leads_contacto y solicitudes_apoyo_social apuntaban a
-- `usuarios`. Quien publica o gestiona siempre es del equipo interno, así que
-- ahora apuntan a `administradores`.
--
-- Primero se traduce cada id viejo al id de Auth cruzando por correo.
-- En portafolio, si queda alguna fila sin traducir, la migración falla al
-- crear la FK (a propósito: no se pierde la autoría en silencio). En leads y
-- solicitudes, lo que no se pueda traducir queda en null, igual que el
-- `on delete set null` que ya tenían.
-- ==========================================

-- portafolio.usuario_id
alter table portafolio drop constraint if exists portafolio_usuario_id_fkey;

update portafolio p
set usuario_id = a.id
from usuarios u
join administradores a on lower(a.correo) = lower(u.correo)
where p.usuario_id = u.id;

alter table portafolio
    add constraint portafolio_usuario_id_fkey
    foreign key (usuario_id) references administradores(id) on delete restrict;

-- leads_contacto.gestionado_por_id
alter table leads_contacto drop constraint if exists leads_contacto_gestionado_por_id_fkey;

update leads_contacto l
set gestionado_por_id = a.id
from usuarios u
join administradores a on lower(a.correo) = lower(u.correo)
where l.gestionado_por_id = u.id;

update leads_contacto
set gestionado_por_id = null
where gestionado_por_id is not null
  and gestionado_por_id not in (select id from administradores);

alter table leads_contacto
    add constraint leads_contacto_gestionado_por_id_fkey
    foreign key (gestionado_por_id) references administradores(id) on delete set null;

-- solicitudes_apoyo_social.gestionado_por_id
alter table solicitudes_apoyo_social drop constraint if exists solicitudes_apoyo_social_gestionado_por_id_fkey;

update solicitudes_apoyo_social s
set gestionado_por_id = a.id
from usuarios u
join administradores a on lower(a.correo) = lower(u.correo)
where s.gestionado_por_id = u.id;

update solicitudes_apoyo_social
set gestionado_por_id = null
where gestionado_por_id is not null
  and gestionado_por_id not in (select id from administradores);

alter table solicitudes_apoyo_social
    add constraint solicitudes_apoyo_social_gestionado_por_id_fkey
    foreign key (gestionado_por_id) references administradores(id) on delete set null;
