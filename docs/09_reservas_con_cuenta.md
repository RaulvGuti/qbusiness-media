# Reservas del estudio con cuenta de cliente

Este documento explica la regla que se aplicó al módulo de Renta de Estudio: **para solicitar
una reserva hace falta una cuenta de cliente registrada y con sesión activa**. Antes el
formulario aceptaba datos sueltos de cualquier visitante.

## 1. La regla

- Un visitante sin sesión puede ver el catálogo, los precios y el calculador, pero no puede
  enviar una solicitud de reserva.
- El botón de reserva cambia de texto según la sesión: `Solicitar reserva` cuando hay cuenta
  de cliente y `Regístrate para reservar` cuando no la hay.
- Al intentar reservar sin sesión se redirige a `/login?registro=1&next=/renta`, que abre el
  formulario en modo registro y, al terminar, vuelve a `/renta`.
- Los datos de contacto del formulario se precargan con el perfil del cliente
  (`nombre_completo`, `correo`, `telefono`) para no pedirlos otra vez.
- La tarifa del salón se toma de `configuracion_sitio` (`estudio / tarifa_hora`). Si está
  vacía, nula o en cero, la reserva se bloquea tanto en la vista como en la RPC; no hay un
  precio de respaldo escondido en el código.

## 2. Dónde se aplica

| Capa | Archivo | Qué hace |
| --- | --- | --- |
| Página | `src/app/(site)/renta/page.tsx` | Pide el catálogo y el perfil con `obtenerCatalogoEstudioCliente()` y pasa `cliente` a la vista. |
| Vista | `src/app/(site)/renta/Vista.tsx` | Si no hay `cliente.id`, el botón lleva al registro en vez de abrir el modal. |
| Modal | `src/components/estudio/ReservaModal.tsx` | Muestra el bloqueo "Cuenta requerida para reservar" y no permite enviar. |
| Servidor | `src/server/services/reservas/clients.ts` | `enviarSolicitudReservaCliente()` vuelve a comprobar la sesión y lanza un error si no existe. |
| Repositorio | `src/server/repositories/estudio.ts` | `obtenerPerfilClienteActual()` lee la fila de `clientes` ligada al `auth.users` de la sesión; si aún no existe, arma el perfil desde Auth sin escribir en la base. La fila se crea al reservar con `solicitar_reserva()`. |
| Header | `src/components/layout/SiteHeader.tsx` | Recibe `sesionActiva` desde el layout y muestra `Entrar` o `Salir`. |

La validación del servidor es la que manda: aunque alguien manipule el cliente, la Server
Action no registra la reserva sin sesión.

## 3. Login de clientes frente a login del panel

- `/login` es el acceso de **clientes** (reseñas, apoyo social y reservas). Si la cuenta
  pertenece a `administradores`, se cierra la sesión local y se le indica usar `/admin`
  (ver `docs/07_roles_y_permisos.md`).
- `/admin` es el único punto de entrada del equipo interno.
- El parámetro `next` de `/login` solo acepta destinos de la lista blanca
  (`/renta`, `/resenas`, `/apoyo`, `/`); cualquier otro valor cae en `/resenas`.

## 4. Cómo probarlo

1. Sin sesión, entrar a `/renta`: el botón debe decir `Regístrate para reservar` y llevar a
   `/login?registro=1&next=/renta`.
2. Crear una cuenta desde ese enlace: al terminar, el sitio vuelve a `/renta`.
3. Con sesión de cliente, abrir el modal: nombre, correo y teléfono vienen precargados.
4. Enviar la solicitud: se crea la reserva y el panel la ve en `/admin/reservas`.
5. Intentar enviar la solicitud sin sesión (por ejemplo, desde una pestaña cerrada): la
   Server Action responde con el error de cuenta requerida.
6. Vaciar `estudio / tarifa_hora` desde el panel: el botón de reserva se deshabilita y, si se
   fuerza la RPC, responde con el error de tarifa no configurada.

## 5. Notas

- La tabla `clientes` y su vínculo con Auth ya existían (`000012`, `000013`).
- La migración `000040_estudio_tarifa_y_clientes_reserva.sql` ya está aplicada: dejó el valor
  inicial de `estudio / tarifa_hora` en `500`, sincronizó cuentas previas de `auth.users` hacia
  `clientes` y respaldó el perfil en `solicitar_reserva()`.
- La migración `000041_estudio_tarifa_estricta.sql` reemplaza `solicitar_reserva()` para que la
  tarifa sea obligatoria: si el administrador la deja vacía, nula o en cero, la reserva se
  rechaza en lugar de usar `500` como respaldo oculto.
- En la vista de `/renta` se mantiene un perfil optimista desde la sesión del navegador para no
  mostrar `Regístrate para reservar` justo después de iniciar sesión. El servidor sigue siendo
  la autoridad: sin sesión válida, la Server Action y la RPC rechazan la reserva.
- El servidor ya no escribe `clientes` ni `tarifa_hora` con `service_role` desde el repositorio:
  la sincronización del perfil ocurre en la RPC y el valor de la tarifa lo administra el panel.
- El tope de reservas pendientes por cliente sigue en la migración `000022`.
- Orden de despliegue: aplicar `000041` antes de desplegar esta versión del frontend.
