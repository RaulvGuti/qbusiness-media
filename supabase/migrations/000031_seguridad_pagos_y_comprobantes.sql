-- ==========================================
-- Migración: seguridad_pagos_y_comprobantes
-- Corrección sobre 000029 sin editarla (migración sobre migración).
--
-- Problema: reservas_update_cliente() deja al cliente cambiar libremente
-- estado_pago y url_comprobante_pago, así que un cliente podía marcar su propia
-- reserva como 'pagado'. Además, la lista de columnas vedadas era una lista
-- negra: cualquier columna nueva quedaba editable sin querer.
--
-- Ahora:
--   * lista BLANCA: el cliente solo puede tocar estado, estado_pago y
--     url_comprobante_pago (cualquier otra columna, presente o futura, se bloquea)
--   * estado: solo cancelar, desde pendiente o confirmada (igual que antes)
--   * pago: solo puede pasar a 'comprobante_subido' adjuntando el comprobante,
--     mientras la reserva esté activa y el pago no esté ya confirmado.
--     'pagado' y 'rechazado' los fija únicamente un administrador.
--   * el comprobante debe quedar dentro de la carpeta del cliente
--     (<auth.uid()>/<archivo>), no en una URL o carpeta ajena.
-- Además crea el bucket PRIVADO 'comprobantes' (000027 solo creó galeria y
-- logos): cada cliente sube y lee dentro de su carpeta <auth.uid()>/..., el
-- administrador accede a todo. En url_comprobante_pago se guarda la ruta del
-- objeto (<uid>/<archivo>) y se genera una URL firmada para mostrarlo.
--
-- El trigger trg_reservas_update_cliente (000029) se conserva: apunta por
-- nombre a esta función y create or replace le aplica el cambio.
-- ==========================================

create or replace function public.reservas_update_cliente()
returns trigger
language plpgsql
as $$
begin
    -- consola SQL / service role y administradores no se limitan
    if auth.uid() is null or public.es_admin() then
        return new;
    end if;

    -- lista blanca de columnas editables por el cliente
    if (to_jsonb(new) - array['estado', 'estado_pago', 'url_comprobante_pago'])
       is distinct from
       (to_jsonb(old) - array['estado', 'estado_pago', 'url_comprobante_pago']) then
        raise exception 'Solo puedes cancelar tu reserva o subir tu comprobante de pago.';
    end if;

    if new.estado is distinct from old.estado then
        if new.estado <> 'cancelada' then
            raise exception 'Desde tu cuenta solo puedes cancelar tu reserva.';
        end if;
        if old.estado not in ('pendiente', 'confirmada') then
            raise exception 'Una reserva en estado % ya no se puede cancelar.', old.estado;
        end if;
    end if;

    if new.estado_pago is distinct from old.estado_pago
       or new.url_comprobante_pago is distinct from old.url_comprobante_pago then

        if old.estado not in ('pendiente', 'confirmada')
           or new.estado not in ('pendiente', 'confirmada') then
            raise exception 'Esta reserva ya no admite comprobante de pago.';
        end if;
        if old.estado_pago = 'pagado' then
            raise exception 'El pago de esta reserva ya fue confirmado.';
        end if;
        if new.estado_pago <> 'comprobante_subido'
           or new.url_comprobante_pago is null
           or btrim(new.url_comprobante_pago) = '' then
            raise exception 'Solo puedes marcar tu pago como "comprobante subido" adjuntando el comprobante.';
        end if;
        if new.url_comprobante_pago not like auth.uid()::text || '/%' then
            raise exception 'El comprobante debe guardarse dentro de tu carpeta (<uid>/<archivo>).';
        end if;
    end if;

    return new;
end;
$$;

-- ---------- bucket privado de comprobantes ----------

insert into storage.buckets (id, name, public)
values ('comprobantes', 'comprobantes', false)
on conflict (id) do nothing;

create policy "comprobantes_insert_propio"
    on storage.objects for insert to authenticated
    with check (
        bucket_id = 'comprobantes'
        and ((storage.foldername(name))[1] = auth.uid()::text or public.es_admin())
    );

create policy "comprobantes_select_propio"
    on storage.objects for select to authenticated
    using (
        bucket_id = 'comprobantes'
        and ((storage.foldername(name))[1] = auth.uid()::text or public.es_admin())
    );

create policy "comprobantes_update_propio"
    on storage.objects for update to authenticated
    using (
        bucket_id = 'comprobantes'
        and ((storage.foldername(name))[1] = auth.uid()::text or public.es_admin())
    )
    with check (
        bucket_id = 'comprobantes'
        and ((storage.foldername(name))[1] = auth.uid()::text or public.es_admin())
    );

create policy "comprobantes_delete_admin"
    on storage.objects for delete to authenticated
    using (bucket_id = 'comprobantes' and public.es_admin());
