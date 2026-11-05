# 15 — Paquetes de renta, equipo y sesiones separadas

Este documento cubre cinco cambios que entran juntos: los paquetes de renta del estudio,
el descuento por lealtad, la administración y pestaña pública de renta de equipo, la salida
de Contactos del panel y la separación de las sesiones de administrador y cliente.

## 1. Paquetes de renta (migración `000042`)

La renta del salón deja de cobrarse por hora suelta. Ahora se vende en paquetes cerrados
con nombre, horas y precio:

- Tabla `public.paquetes_estudio`: `nombre` único, `horas` (> 0 y ≤ 24), `precio` (≥ 0),
  `activo` y `orden`.
- `reservas` guarda el paquete **congelado** al solicitar: `paquete_id`, `paquete_nombre`,
  `paquete_horas`, `paquete_precio`, `descuento_lealtad` y `descuento_monto`. Cambiar el
  catálogo no altera una reserva ya aceptada.
- La fila histórica `estudio / tarifa_hora` se conserva por compatibilidad, pero ya no se
  usa para cobrar ni aparece en el panel. **Sin un paquete activo no se puede reservar.**

### Cómo se calcula el total

```text
total = precio_final_del_paquete
      + (Σ servicios_por_hora + Σ equipos_por_hora × cantidad) × horas_del_paquete
```

La hora de fin la deriva el servidor a partir de las horas del paquete. El navegador solo
muestra un estimado; el cálculo definitivo ocurre en `solicitar_reserva()`.

La RPC cambió de firma y ya **no recibe `p_hora_fin`**:

```sql
solicitar_reserva(
  p_nombre, p_correo, p_telefono, p_fecha, p_hora_inicio,
  p_paquete_id, p_notas, p_servicios, p_equipos
)
```

## 2. Descuento por lealtad

- Se aplica **solo al precio del paquete**, no a servicios ni equipos.
- Requiere que el cliente tenga **5 o más reservas en estado `completada`** antes de la
  nueva solicitud.
- El descuento es del **25%** y se mantiene en las reservas siguientes mientras el historial
  siga cumpliendo.
- La regla vive en dos lugares que deben coincidir:
  - `frontend/src/lib/estudio-paquetes.ts` (`descuentoLealtad`) para el estimado del
    navegador.
  - La función `solicitar_reserva()` para el valor definitivo.

## 3. Administración de paquetes

En **Admin → Textos y configuración → Renta de Estudio** aparece el editor *Paquetes de
renta*. Permite:

- Crear un paquete con nombre, horas, precio, orden y estado.
- Editar los campos de un paquete existente.
- Activar o desactivar sin borrar el historial.

Solo el `admin_principal` puede modificarlos (`requireAdminPrincipal()` y RLS). La migración
`000042` **no siembra paquetes**: el administrador debe crear el primero antes de abrir las
reservas.

## 4. Renta de equipo

- La administración del inventario vive dentro de **Textos y configuración → Renta de
  Estudio**, junto a los paquetes. No hay una sección separada en el menú.
- Solo el `admin_principal` puede modificarlo, porque la pantalla y las acciones siguen
  protegidas por `requireAdminPrincipal()` y RLS.
- Desde ahí se crean, editan y activan/desactivan equipos de `inventario_equipos`.
- El sitio público tiene una pestaña **“Renta de equipo”** dentro de `/renta`. Usa el mismo
  formulario y el mismo paquete obligatorio; la diferencia es que prioriza el catálogo de
  equipos y oculta los servicios del salón.
- Un equipo inactivo no aparece ni se puede reservar, pero se conserva para el historial.
- Las acciones están en `frontend/src/server/services/equipos/admin.ts` y revalidan
  `/admin/textos` y `/renta`.

## 5. Contactos fuera del panel

- Se eliminó la página `frontend/src/app/admin/(panel)/contactos`, su entrada del menú, su
  acceso rápido y su permiso.
- El dashboard ya no muestra el contador “Mensajes nuevos” ni la actividad de contactos.
- **Los leads y sus notas se conservan en la base de datos** y los endpoints internos siguen
  existiendo; solo se retiró la sección del panel.
- La página pública `/contactanos` no se tocó.

## 6. Sesiones separadas: administrador y cliente

Antes ambas sesiones compartían la cookie normal de `@supabase/ssr`. Ahora:

| Ámbito | Cookie |
| --- | --- |
| Sitio público / cliente | Cookie normal de `@supabase/ssr` (`sb-<ref>-auth-token`) |
| Panel administrativo | `qb-admin-auth-token` |

Consecuencias:

- Cerrar sesión en el panel **no cierra** la sesión pública, y viceversa.
- Un administrador puede probar el sitio como cliente sin perder su sesión de trabajo.
- El login del panel (`/admin`) usa `obtenerSupabaseAdmin()`; el login público usa
  `obtenerSupabase()`.
- El servidor tiene dos clientes: `createSupabaseServerClient()` y
  `createSupabaseStaffClient()`. Las consultas del panel usan el segundo.
- `frontend/src/proxy.ts` refresca las dos cookies en cada petición.
- Todos los cierres de sesión usan `signOut({ scope: 'local' })` para no revocar el refresh
  token del otro ámbito.
- La recuperación de contraseña del panel viaja con `?ambito=admin` y `/auth/confirm` guarda
  la sesión temporal en `qb-admin-auth-token`.

Archivos principales: `frontend/src/lib/auth-cookies.ts`,
`frontend/src/server/supabase/server.ts`, `frontend/src/lib/supabase/client.ts` y
`frontend/src/proxy.ts`.

## 7. Cómo aplicar y verificar

1. Aprobar el PR a `develop`.
2. Aplicar `supabase/migrations/000042_paquetes_y_descuento_lealtad.sql` como migración.
3. Entrar como `admin_principal` a **Textos y configuración → Renta de Estudio** y crear al
   menos un paquete activo.
4. Revisar en `/renta`:
   - La pestaña Estudio muestra los paquetes.
   - La pestaña Equipo muestra el inventario activo.
   - Sin paquetes, el botón de reserva queda bloqueado.
5. Crear un equipo en **Textos y configuración → Renta de Estudio**, desactivarlo y
   comprobar que desaparece del sitio público.
6. Con una cuenta con 5 reservas completadas, confirmar que el paquete muestra el 25% de
   descuento y que el total del servidor coincide.
7. Verificar que el menú del panel ya no tiene Contactos y que `/admin/contactos` devuelve
   404.
8. Iniciar sesión en `/admin` y en `/login` con cuentas distintas; cerrar una y comprobar que
   la otra sigue activa.
9. Ejecutar `npm run check` dentro de `frontend/`.
