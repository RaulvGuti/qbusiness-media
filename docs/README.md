# docs/ — Documentación del proyecto

Este directorio tiene **todo el detalle** que no cabe en el `README.md`: decisiones
técnicas, cambios de base de datos, pasos de despliegue, estado de cada módulo y lo que
el cliente necesita saber para usar el sitio.

## Reglas de esta carpeta

- Un archivo `.md` por tema. El nombre lleva número y guion bajo: `02_reservas_del_estudio.md`.
- El archivo empieza con un título `#` de una línea que describa el tema.
- Si documentaste algo, **agrega el enlace en el índice de abajo**, en el mismo PR.
- Un cambio pequeño (un texto, un color) se explica en el PR y no necesita archivo propio.
- Los diagramas y capturas van en `docs/img/`.

## Índice

| # | Documento | Qué responde |
| --- | --- | --- |
| 01 | [`01-decisiones-tecnicas.md`](./01-decisiones-tecnicas.md) | Por qué Supabase y no Neon, por qué Docker como alternativa, por qué no hay pasarela de pagos todavía y qué tan difícil sería cambiar de base de datos. |
| 02 | `02-base-de-datos.md` | Cómo se aplican las migraciones paso a paso. *(pendiente)* |
| 03 | [`03_migraciones_esquema_v2.md`](./03_migraciones_esquema_v2.md) | La arquitectura final de la base de datos y la secuencia completa de migraciones (000001 → 000035). |
| 04 | [`04-despliegue.md`](./04-despliegue.md) | Cómo se levanta y se publica el sitio, qué variables de entorno se leen en el build y cuáles en runtime, y cómo diagnosticar un build de Docker que falla. |
| 05 | `05-modulos.md` | Qué hace cada pestaña y en qué punto va. *(pendiente)* |
| 06 | `06-manual-cliente.md` | Lo que el cliente debe saber para usar el sitio. *(pendiente)* |
| 07 | [`07_roles_y_permisos.md`](./07_roles_y_permisos.md) | Los roles `admin_principal` y `secretaria`, la matriz de permisos, la migración 000038 y dónde se aplica cada restricción en Supabase y Next.js. |
| 08 | [`08_configuracion_dinamica_sitio.md`](./08_configuracion_dinamica_sitio.md) | Qué textos y enlaces del sitio se editan desde el panel, cómo se guardan, los placeholders y el formato de las listas del footer. |
| 09 | [`09_reservas_con_cuenta.md`](./09_reservas_con_cuenta.md) | Por qué solicitar una reserva del estudio exige una cuenta de cliente, dónde se valida en cliente y servidor, y cómo se relaciona con el login de `/login` y `/admin`. |
| 10 | [`10_cuenta_de_clientes_compartida.md`](./10_cuenta_de_clientes_compartida.md) | La cuenta de cliente compartida por el equipo: qué es, cómo se creó, riesgos, rotación y verificación. |
| 11 | [`11_login_google_callback.md`](./11_login_google_callback.md) | Cómo se completa el inicio de sesión con Google, la ruta `/auth/callback` y la configuración requerida en Supabase. |
| 12 | [`12_recuperacion_contrasena.md`](./12_recuperacion_contrasena.md) | Cómo funciona la recuperación de contraseña de clientes y administradores, la ruta `/auth/confirm`, la pantalla compartida y la configuración de Supabase Auth. |
| 13 | [`13_dashboard_datos_reales.md`](./13_dashboard_datos_reales.md) | De dónde salen los contadores, la actividad reciente y la gráfica semanal del dashboard, y cómo se respetan los permisos del panel. |
| 14 | [`14_correcciones_flujo_portillo.md`](./14_correcciones_flujo_portillo.md) | Correcciones de Apoyo Social, reseñas, destacados del inicio, contactos del panel y el enlace de WhatsApp. |
| 15 | [`15_paquetes_renta_equipo_y_sesiones.md`](./15_paquetes_renta_equipo_y_sesiones.md) | Paquetes de renta (000042), descuento por lealtad, administración y pestaña pública de equipo, salida de Contactos y sesiones separadas de administrador y cliente. |
| 16 | [`16_almacenamiento_cloudflare_r2.md`](./16_almacenamiento_cloudflare_r2.md) | Cómo funciona la subida de la galería a Cloudflare R2, variables de entorno, CORS y compatibilidad con los archivos legacy de Supabase. |

## Trabajo interno en curso

- La restructuración del código (la app se movió a `frontend/`, se unificaron los layouts
  de grupo y se consolidaron los estilos) se sigue en `../restructuracion/`, una **carpeta
  local ignorada por Git**: no se versiona y el enlace solo funciona en la máquina de quien
  la tenga.
