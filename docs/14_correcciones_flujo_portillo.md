# Correcciones del flujo público y del panel

Este documento resume las correcciones aplicadas en la rama
`CorreccionesGeneralesPortillo` para los cinco reportes del cliente.

## 1. Enlace de Apoyo Social

- El listado de eventos y la información de `/apoyo` son públicos: se pueden ver sin
  iniciar sesión.
- El formulario de solicitud muestra un aviso con enlace a `/login?next=/apoyo` cuando no
  hay sesión; solo se habilita después de entrar o crear una cuenta.
- `/login` acepta `/apoyo` como destino posterior al inicio de sesión.
- El botón “Entrar” del header conserva el destino cuando la ruta actual es
  `/apoyo`, igual que ya hacía con `/renta` y `/resenas`.

Resultado: una persona puede consultar Apoyo Social sin cuenta; el login solo se pide para
llenar y enviar la solicitud, y al volver se conserva el destino.

## 2. Reseñas y reservas

La regla de negocio no cambió: una reseña de cliente requiere una reserva propia
en estado `completada` y sin reseña previa (RLS de `resenas_clientes`).

Lo que se agregó:

- `/renta` muestra “Mis reservas” al cliente autenticado, con el estado de cada
  reserva y un botón “Dejar reseña” cuando ya está completada.
- Si la reserva todavía no está completada, la misma tarjeta explica que la
  reseña se habilita al completarla.
- `/resenas` explica el motivo exacto del bloqueo: sin reservas, reserva
  pendiente/confirmada, o reseña ya enviada con su estado de moderación.
- Al cambiar el estado de una reserva en el panel se revalidan `/renta` y
  `/resenas`.
- Después de solicitar una reserva, `/renta` refresca los datos del servidor para
  que aparezca en “Mis reservas”.
- La pantalla de moderación del panel ahora obtiene la lista inicial de
  `resenas_clientes` y no de los datos de ejemplo; el panel sigue refrescando por
  el endpoint para mostrar el estado real.

## 3. Destacados del inicio

- La página de inicio dejó de tener tres tarjetas fijas.
- Ahora lee `destacados` y muestra las carpetas publicadas y empresas activas
  elegidas en el panel.
- La portada se resuelve desde `archivos_galeria` para las carpetas y desde el
  bucket `logos` para las empresas.
- Una carpeta del módulo `inicio` puede usarse para subir una imagen concreta:
  se crea en Galería → Inicio, se marca su portada, se publica y se selecciona en
  Destacados. La imagen se verá en el inicio.
- Las carpetas de portafolio enlazan a su detalle; las de otros módulos enlazan
  a la sección correspondiente.

## 4. Contactos del panel

- `QuoteForm` (“Solicitar cotización directa”) ya no simula el envío con un
  temporizador: hace `POST /api/api/contactos` y muestra el error real si falla.
- Los endpoints de contacto y apoyo social ya no guardan en memoria cuando falta
  la llave de servicio o falla la base. Antes respondían “recibido” y el panel no
  veía nada; ahora responden con un error visible.
- El panel de Contactos y el de Apoyo Social muestran un aviso si la consulta
  falla, en vez de mostrar “No hay registros” como si no hubiera datos.
- El correo y el teléfono de cada registro son enlaces `mailto:` y `wa.me`.

### Variable obligatoria

Para que los formularios públicos guarden en Supabase, el servidor necesita
`SUPABASE_SERVICE_ROLE_KEY`:

- En local: `frontend/.env.local`.
- En Docker/producción: el `.env` de la raíz que consume `compose.yml`.
- Nunca debe llevar el prefijo `NEXT_PUBLIC_` ni llegar al navegador.

Sin esa variable los formularios muestran un error y el panel no recibe
registros. Es intencional: ya no se finge un guardado exitoso.

## 5. Enlace de WhatsApp

- El número sigue viniendo de `contacto/whatsapp` en `configuracion_sitio`.
- Al guardar textos se invalida el layout público completo
  (`revalidatePath("/(site)", "layout")`) además de `/` y `/contactanos`.
- El layout público se declara `force-dynamic` para que el header, el footer y el
  inicio lean la configuración vigente en cada petición.

Si el enlace se ve viejo en una pestaña que ya estaba abierta, una recarga la
actualiza; la invalidación cubre las navegaciones nuevas del sitio.

## Verificación

Desde `frontend/`:

```bash
npm run lint
npm run typecheck
npm run build
```
