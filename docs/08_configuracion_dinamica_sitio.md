# Configuración dinámica del sitio

Este documento explica cómo el panel **Textos y configuración del sitio** controla los
textos y enlaces del sitio público, qué claves existen y cómo agregar una nueva sin tocar
las migraciones ya aplicadas.

## Qué se hizo

- La migración [`000039_configuracion_textos_sitio.sql`](../supabase/migrations/000039_configuracion_textos_sitio.sql)
  amplía los grupos permitidos de `configuracion_sitio` con `general` y `sobre`, y deja
  valores iniciales para todo el contenido que antes estaba escrito en los componentes.
- `frontend/src/lib/config-sitio.ts` es la fuente única del catálogo: pestañas, etiquetas,
  tipos de campo, valores por defecto, parseo de listas, interpolación de placeholders y
  validación.
- `frontend/src/server/repositories/configuracion.ts` lee y escribe la tabla real. Si no hay
  credenciales de Supabase, usa los datos mock para que el panel siga funcionando en local.
- `frontend/src/server/actions/configuracion.ts` guarda los cambios con la sesión del
  administrador (nunca con `service_role`). RLS vuelve a exigir `admin_principal`.
- El layout público carga la configuración una vez por petición con `cache()` y la pasa a
  header, modal, footer, home y contacto. El nav principal del header sigue hardcodeado por
  decisión de diseño.

## Claves y dónde se usan

| Grupo | Clave | Uso |
| --- | --- | --- |
| `general` | `hero_subtitulo` | Subtítulo del hero; admite `{director}` y `{slogan}`. |
| `general` | `director_nombre` | Nombre del director en hero, modal y copyright. |
| `general` | `slogan` | Eslogan en footer y modal. |
| `general` | `descripcion_footer` | Descripción del pie de página. |
| `general` | `hero_stat_1_numero` / `hero_stat_1_label` | Primera métrica del hero. |
| `general` | `hero_stat_2_numero` / `hero_stat_2_label` | Segunda métrica del hero. |
| `general` | `hero_stat_3_numero` / `hero_stat_3_label` | Tercera métrica del hero. |
| `general` | `header_cta_whatsapp` | Texto del botón de WhatsApp del header. |
| `general` | `header_sobre` | Texto del botón “Sobre nosotros”. |
| `general` | `footer_servicios` | Servicios del footer, uno por línea. |
| `general` | `footer_navegacion` | Enlaces del footer, una línea por enlace. |
| `sobre` | `sobre_nosotros_titulo` | Título del modal. |
| `sobre` | `sobre_nosotros_parrafo_1` | Primer párrafo; admite placeholders. |
| `sobre` | `sobre_nosotros_parrafo_2` | Segundo párrafo; admite placeholders. |
| `sobre` | `stat_1_numero` / `stat_1_label` | Primera métrica del modal. |
| `sobre` | `stat_2_numero` / `stat_2_label` | Segunda métrica del modal. |
| `sobre` | `stat_3_numero` / `stat_3_label` | Tercera métrica del modal. |
| `contacto` | `correo` | Correo en footer y página de contacto. |
| `contacto` | `whatsapp` | Número visible y base del enlace `wa.me`. |
| `redes` | `instagram`, `youtube`, `tiktok` | Enlaces de redes del footer y la home. |
| `ubicacion` | `direccion` | Dirección en footer, home, contacto y mapa. |
| `ubicacion` | `link_google_maps` | Enlace del botón “Abrir en Google Maps”. |
| `menu` | `whatsapp_cta` | Mensaje que se envía al abrir WhatsApp. |
| `estudio` | `tarifa_hora`, `hora_apertura`, `hora_cierre`, `max_pendientes_por_cliente` | Parámetros de renta; se editan en la misma pantalla. |

## Placeholders

En `hero_subtitulo`, `sobre_nosotros_parrafo_1` y `sobre_nosotros_parrafo_2` se puede
escribir:

- `{director}`: se reemplaza por `general/director_nombre`.
- `{slogan}`: se reemplaza por `general/slogan`.

En el modal, los placeholders conservan el énfasis visual (director en negrita y eslogan en
color terracota). Si el administrador borra el placeholder, el texto se muestra tal cual.

## Formato de las listas

- `general/footer_servicios`: un servicio por línea.
- `general/footer_navegacion`: una línea por enlace con el formato `Texto | /ruta`. La ruta
  debe empezar con `/` o ser una URL `https://`. Las URLs externas se abren en otra pestaña.

## Flujo de guardado

1. El formulario del panel envía solo los campos modificados a la Server Action.
2. La acción valida que el usuario sea `admin_principal` y que cada `(grupo, clave)` exista
   en el catálogo. También valida correo, URL, teléfono, hora, números y listas.
3. El repositorio hace un `upsert` por lote en `configuracion_sitio` con
   `onConflict: "grupo,clave"`.
4. La acción invalida `/` y `/admin/textos` con `revalidatePath`.
5. El sitio público vuelve a leer la configuración y aplica los valores.

## Seguridad

- La lectura de `configuracion_sitio` es pública por RLS.
- La escritura es exclusiva de `admin_principal`; la Server Action usa el cliente de
  servidor con la sesión del usuario, no el cliente admin.
- La `service_role` no se usa en esta pantalla.
- Los valores se guardan como texto; la validación de formato ocurre en la Server Action y
  el catálogo es la lista blanca de claves permitidas.

## Fallback y modo local

- `CONFIG_DEFECTOS` contiene los valores iniciales. Si una fila no existe o está en `null`,
  el sitio usa el default; una cadena vacía sí se respeta.
- Sin `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY` reales, el repositorio usa
  `configuracionMock` y el formulario puede guardar en memoria durante la sesión.
- `obtenerConfiguracionSitio()` captura errores de lectura y devuelve los defaults para que
  una caída de la tabla no tumbe el sitio público.

## Cómo agregar un campo nuevo

1. Crear una migración nueva con el siguiente número y sembrar el valor por defecto. No
   editar una migración ya aplicada.
2. Agregar la clave al grupo correspondiente en `PESTANAS` de `frontend/src/lib/config-sitio.ts`
   con su `defecto`, etiqueta y tipo.
3. Agregar la propiedad a `ConfiguracionSitio` en `frontend/src/types/config.ts` y mapearla en
   `construirConfiguracionSitio()`.
4. Consumirla desde el componente que la muestra.
5. Verificar con `npm run lint`, `npm run typecheck` y `npm run build` desde `frontend/`.
