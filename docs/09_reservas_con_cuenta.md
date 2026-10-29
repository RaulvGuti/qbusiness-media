# Reservas del estudio con cuenta de cliente

Este documento explica la regla que se aplicó al módulo de Renta de Estudio: **para solicitar
una reserva hace falta una cuenta de cliente registrada y con sesión activa**. Antes el
formulario aceptaba datos sueltos de cualquier visitante.

## 1. La regla

- Un visitante sin sesión puede ver el catálogo, los precios y el calculador, pero no puede
  enviar una solicitud de reserva.
- La interfaz conserva el diseño anterior (commit `5bb7aa8`): el botón siempre dice
  `Solicitar reserva` y no muestra avisos adicionales. La regla se aplica al pulsar y en el
  servidor.
- Al intentar reservar sin sesión se redirige a `/login?registro=1&next=/renta`, que abre el
  formulario en modo registro y, al terminar, vuelve a `/renta`.
- Los datos de contacto del formulario se precargan con el perfil del cliente
  (`nombre_completo`, `correo`, `telefono`) para no pedirlos otra vez.

## 2. Dónde se aplica

| Capa | Archivo | Qué hace |
| --- | --- | --- |
| Página | `frontend/src/app/(site)/renta/page.tsx` | Pide el catálogo y el perfil con `obtenerCatalogoEstudioCliente()` y pasa `cliente` a la vista. |
| Vista | `frontend/src/app/(site)/renta/Vista.tsx` | Si no hay `cliente.id`, el botón lleva al registro en vez de abrir el modal. |
| Modal | `frontend/src/components/estudio/ReservaModal.tsx` | Precarga los datos y no permite enviar sin sesión. |
| Servidor | `frontend/src/server/services/reservas/clients.ts` | `enviarSolicitudReservaCliente()` vuelve a comprobar la sesión y lanza un error si no existe. |
| Repositorio | `frontend/src/server/repositories/estudio.ts` | `obtenerPerfilClienteActual()` lee la fila de `clientes` ligada al `auth.users` de la sesión. |
| Header | `frontend/src/components/layout/SiteHeader.tsx` | Mantiene el ícono de acceso anterior; con sesión activa cierra la sesión al pulsarlo. |

La validación del servidor es la que manda: aunque alguien manipule el cliente, la Server
Action no registra la reserva sin sesión.

## 3. Login de clientes frente a login del panel

- `/login` es el acceso de **clientes** (reseñas, apoyo social y reservas). Si la cuenta
  pertenece a `administradores`, se cierra la sesión local y se le indica usar `/admin`
  (ver `docs/07_roles_y_permisos.md`).
- `/admin` es el único punto de entrada del equipo interno.
- El parámetro `next` de `/login` solo acepta destinos de la lista blanca
  (`/renta`, `/resenas`, `/`); cualquier otro valor cae en `/resenas`.

## 4. Cómo probarlo

1. Sin sesión, entrar a `/renta`: al pulsar `Solicitar reserva` debe llevar a
   `/login?registro=1&next=/renta`.
2. Crear una cuenta desde ese enlace: al terminar, el sitio vuelve a `/renta`.
3. Con sesión de cliente, abrir el modal: nombre, correo y teléfono vienen precargados.
4. Enviar la solicitud: se crea la reserva y el panel la ve en `/admin/reservas`.
5. Intentar enviar la solicitud sin sesión (por ejemplo, desde una pestaña cerrada): la
   Server Action responde con el error de cuenta requerida.

## 5. Notas

- No hay migración nueva: la tabla `clientes` y su vínculo con Auth ya existían
  (`000012`, `000013`).
- El tope de reservas pendientes por cliente sigue en la migración `000022`.
