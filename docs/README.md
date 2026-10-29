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

## Trabajo interno en curso

- La restructuración del código (la app se movió a `frontend/`, se unificaron los layouts
  de grupo y se consolidaron los estilos) se sigue en `../restructuracion/`, una **carpeta
  local ignorada por Git**: no se versiona y el enlace solo funciona en la máquina de quien
  la tenga.
