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
| 03 | `03-despliegue.md` | Cómo se publica y cómo se actualiza el sitio. *(pendiente)* |
| 04 | `04-modulos.md` | Qué hace cada pestaña y en qué punto va. *(pendiente)* |
| 05 | `05-manual-cliente.md` | Lo que el cliente debe saber para usar el sitio. *(pendiente)* |
