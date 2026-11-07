-- ==========================================
-- Migración: storage_buckets
-- Buckets públicos de lectura (galeria, logos) con escritura solo de
-- administradores. Las rutas se guardan en archivos_galeria.ruta_storage y
-- empresas.logo_ruta.
-- ==========================================

insert into storage.buckets (id, name, public) values ('galeria', 'galeria', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('logos',   'logos',   true) on conflict (id) do nothing;

-- ---------- galeria ----------
create policy "galeria_lectura_publica"
    on storage.objects for select using (bucket_id = 'galeria');

create policy "galeria_insert_admin"
    on storage.objects for insert to authenticated
    with check (bucket_id = 'galeria' and public.es_admin());

create policy "galeria_update_admin"
    on storage.objects for update to authenticated
    using (bucket_id = 'galeria' and public.es_admin())
    with check (bucket_id = 'galeria' and public.es_admin());

create policy "galeria_delete_admin"
    on storage.objects for delete to authenticated
    using (bucket_id = 'galeria' and public.es_admin());

-- ---------- logos ----------
create policy "logos_lectura_publica"
    on storage.objects for select using (bucket_id = 'logos');

create policy "logos_insert_admin"
    on storage.objects for insert to authenticated
    with check (bucket_id = 'logos' and public.es_admin());

create policy "logos_update_admin"
    on storage.objects for update to authenticated
    using (bucket_id = 'logos' and public.es_admin())
    with check (bucket_id = 'logos' and public.es_admin());

create policy "logos_delete_admin"
    on storage.objects for delete to authenticated
    using (bucket_id = 'logos' and public.es_admin());
