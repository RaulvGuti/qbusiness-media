# 13 — Dashboard con datos reales

El dashboard del panel (`/admin/dashboard`) muestra la actividad administrativa del sitio.
Antes leía de los repositorios con datos ficticios y pintaba una gráfica semanal decorativa;
ahora consulta Supabase con la sesión del equipo.

## Fuentes de datos

No hay migración nueva. Se reutiliza la migración `000036_dashboard_resumen_y_actividad.sql`:

| Dato | Origen |
| --- | --- |
| Reseñas pendientes | `dashboard_resumen().resenas_pendientes` (`resenas_clientes.estado = 'pendiente'`) |
| Mensajes nuevos | `dashboard_resumen().mensajes_nuevos` (`leads_contacto.estado = 'nuevo'`) |
| Reservas pendientes | `dashboard_resumen().reservas_pendientes` (`reservas.estado = 'pendiente'`) |
| Apoyo social nuevo | `dashboard_resumen().apoyo_social_nuevo` (`solicitudes_apoyo_social.estado = 'nueva'`) |
| Comprobantes por revisar | `dashboard_resumen().pagos_por_revisar` (reservas activas con `estado_pago = 'comprobante_subido'`) |
| Actividad reciente | `actividad_reciente(6)` de contactos, apoyo social, reseñas y reservas |
| Actividad de la semana | Conteo de `creado_en` en las cuatro tablas, de lunes a domingo en hora de Guatemala |

La tarjeta **Comprobantes por revisar** cuenta comprobantes que el cliente subió para validar
su pago; el sitio no procesa pagos en línea ni cobra con tarjeta.

## Implementación

- `frontend/src/server/repositories/dashboard.ts`: consulta las RPC y calcula la semana.
  Recibe el cliente autenticado de `exigirStaffPanel()`, así que cada consulta corre con la
  sesión real y las políticas RLS se aplican.
- `frontend/src/app/admin/(panel)/dashboard/page.tsx`: pinta los contadores, la actividad y
  la gráfica. La página es dinámica (`force-dynamic`) para no reutilizar datos viejos.
- `frontend/src/app/admin/(panel)/dashboard/page.module.css`: la cuadrícula de tarjetas se
  adapta a cinco elementos.

Si una consulta falla, el dashboard muestra ceros o una lista vacía y registra solo el
código de error; nunca imprime nombres, correos ni teléfonos.

## Permisos

`dashboard_resumen()` y `actividad_reciente()` exigen pertenencia al equipo (`es_admin()`).
Los dos roles del panel (`admin_principal` y `secretaria`) pueden ver el dashboard; los
accesos rápidos siguen filtrándose con `frontend/src/lib/permisos.ts`.

## Cómo probarlo

1. Inicia sesión en `/admin` con una cuenta del equipo y abre `/admin/dashboard`.
2. Compara los contadores con las pantallas de contactos, apoyo social, reseñas y reservas.
3. Crea o cambia el estado de un registro y recarga el dashboard: el contador y la actividad
   deben reflejarlo.
4. Sin sesión, `/admin/dashboard` debe redirigir a `/admin`.
5. Desde `frontend/`, ejecuta `npm run check`.
