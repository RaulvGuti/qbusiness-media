-- ==========================================
-- Migración: trigger_auth_nuevo_cliente
-- Todo registro nuevo en Supabase Auth se crea como cliente. Los
-- administradores se agregan a mano (ver 000012). Así nadie puede darse acceso
-- de admin registrándose.
-- ==========================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    insert into public.clientes (id, nombre_completo, correo, telefono)
    values (
        new.id,
        coalesce(
            nullif(new.raw_user_meta_data->>'nombre_completo', ''),
            split_part(new.email, '@', 1)
        ),
        new.email,
        nullif(new.raw_user_meta_data->>'telefono', '')
    )
    on conflict do nothing;
    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();
