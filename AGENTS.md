<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# AGENTS.md — Cómo se trabaja en QBusiness Media

Este archivo es la referencia única del proyecto. Aquí está el contexto, la estructura, las
reglas obligatorias y el flujo de trabajo, escritos para que cualquier persona (o cualquier
asistente de programación) pueda entrar y avanzar sin romper nada.

- Para **instalar y levantar** el proyecto: [`README.md`](./README.md).
- Para **decisiones y avances**: [`docs/`](./docs/).
- Para el **detalle del día a día** (ramas, commits, PR, etiquetas y reporte de
  vulnerabilidades): [`.github/CONTRIBUTING.md`](./.github/CONTRIBUTING.md).

Si una regla de este archivo y una costumbre tuya se contradicen, gana este archivo.

---

## 1. Qué es este proyecto

Sitio web corporativo de QBusiness Media (fotografía y video) con cinco módulos:

| Módulo      | Qué hace                                                                              |
| ----------- | ------------------------------------------------------------------------------------- |
| Portafolio  | Galería de fotos y videos (vertical y horizontal) con búsqueda por fecha de publicación |
| Estudio     | Renta del salón: horarios, tarifas, servicios extra, equipo y reservas                |
| Leads       | Formulario de contacto que registra el prospecto y avisa por WhatsApp y correo        |
| Social      | Solicitudes de apoyo audiovisual para fundaciones y bomberos voluntarios              |
| Infra/auth  | Sesión del equipo, base de datos, despliegue y automatización                        |

Problemas que resuelve (de la Carta Responsiva): dependencia de una sola persona, falta de
canal propio de captación, portafolio no consultable, prospectos sin registro, estudio sin
difusión y ausencia de un canal para apoyo social.

---

## 2. Contexto técnico

- **Next.js 16** con App Router, **React 19**, **TypeScript** en modo estricto, **Tailwind 4**.
- **Supabase** como backend: Postgres, Auth, Storage y automatizaciones. No hay otra base de
  datos ni otro servicio de archivos.
- **Resend** para correos y enlaces `wa.me` para WhatsApp (aún sin activar).
- **Docker** (`Dockerfile` + `compose.yml`) como forma alternativa de levantar y entregar.
- **Rutas de importación**: `@/` apunta a `src/`.
- **Salida de Next.js**: `output: "standalone"`, pensado para contenedor.

Decisiones y su porqué: `docs/01-decisiones-tecnicas.md`.

---

## 3. Estructura y dónde tocar

```
src/app/            Páginas y rutas. App Router. Server Components por defecto.
src/components/     Piezas visuales reutilizables. "layout/" chrome del sitio, "ui/" básicos.
src/lib/            Utilidades puras y el cliente de Supabase del navegador.
src/server/
  ├─ supabase/      Tres clientes: navegador, servidor (con sesión) y admin (service role).
  ├─ repositories/  Consultas a la base de datos. Sin lógica de negocio.
  └─ services/      Reglas de negocio: validar una reserva, notificar un lead, calcular precio.
src/types/          Tipos compartidos entre servidor y cliente.
src/proxy.ts        Renueva la sesión en cada petición. Único lugar donde se refrescan cookies.
supabase/migrations/ Archivos .sql numerados. La única forma de cambiar la base de datos.
docs/               Decisiones, avances y manuales de este proyecto.
.github/            Issues, plantillas, etiquetas y automatizaciones.
scripts/setup.mjs   Lo que ejecuta `npm run setup`.
```

Reglas de ubicación:

- Un componente que se usa en más de una página va a `src/components/`.
- Toda consulta a la base de datos va en `src/server/repositories/`, nunca dentro de un
  componente.
- Toda regla de negocio (no se solapan horarios, no se reserva un equipo cancelado, no se
  publica una reseña sin reserva completada) va en `src/server/services/`.
- Nada de lógica de datos dentro de `src/app/`: la página coordina, el repositorio consulta,
  el servicio decide.

---

## 4. Reglas obligatorias

### 4.1 La base de datos solo se cambia con migraciones

- **Prohibido modificar la base de datos en la nube a mano**: nada de editor de tablas,
  nada de editor de SQL en la consola de Supabase, nada de arrastrar columnas desde la
  interfaz, nada de "solo para probar".
- Todo cambio va en un archivo nuevo: `supabase/migrations/0000NN_nombre_corto.sql`, con el
  siguiente número disponible y `UNIQUE`.
- El archivo abre con un comentario que explique **qué hace y por qué** (en español, sin
  acentos en los identificadores, con acentos en los comentarios).
- Una migración ya aplicada **no se edita**. Si está mal, se agrega otra que la corrija.
- El SQL usa nombres en español y `snake_case`, con los mismos sufijos que ya existen
  (`_id`, `_en`, `fecha_hora_inicio`).
- Cambios destructivos (borrar columna o tabla) van en su propio PR, con nota de migración
  en `docs/`.
- Las políticas de seguridad de filas (RLS) y los buckets de Storage también se crean por
  migración, nunca desde el panel.
- La migración se aplica al ambiente de la nube **después** de aprobar el PR a `develop`.

### 4.2 Todo cambio entra por Pull Request a `develop`

- Se trabaja en una rama por tarea, nacida de `develop`: `feat/...`, `fix/...`, `chore/...`.
- Nunca se hace commit directo en `develop` ni en `main`. `main` solo recibe merges de
  `develop`.
- El PR usa la plantilla de `.github/pull_request_template.md` y dice explícitamente si hubo
  migraciones nuevas.
- Dos automatizaciones son bloqueantes: título con formato de commit y cero archivos con
  credenciales. Además corren `lint`, verificación de tipos y `build`.
- `.github/`, `compose.yml`, `Dockerfile` y migraciones requieren revisión del responsable
  definido en `.github/CODEOWNERS`.
- El detalle operativo (nombres de rama, plantillas de incidencia, catálogo de etiquetas y
  checklist de PR) está en [`.github/CONTRIBUTING.md`](./.github/CONTRIBUTING.md).

### 4.3 Todo cambio importante se documenta en `docs/`

- Un archivo `.md` por tema, en la raíz, numerado: `docs/03_...` con la extensión `.md`.
- `docs/README.md` es el índice: hay que agregar ahí el enlace del documento nuevo.
- Obligatorio documentar: decisiones técnicas, cambios de base de datos, pasos de
  despliegue, cambios de alcance o de reglas del proyecto, y lo que el cliente debe saber
  para usar el sitio.
- Un ajuste de texto o de estilo se explica en el PR; no necesita documento propio.

### 4.4 Secretos

- `SUPABASE_SERVICE_ROLE_KEY` es una contraseña. Nunca al navegador, nunca a un Client
  Component, nunca a Git, nunca a un canal de chat.
- Las variables con prefijo `NEXT_PUBLIC_` viajan al navegador: ahí solo va la URL y la
  clave pública (`anon`).
- Los valores reales viven en `.env.local`, que Git ignora. `.env.example` sí se versiona y
  solo lleva valores de ejemplo.
- Si una llave se filtra: se revoca en Supabase, se genera otra, se avisa al equipo y se
  documenta en `docs/`.
- Para reportar una vulnerabilidad **sin abrir un issue público**, seguir el procedimiento
  de [`.github/CONTRIBUTING.md`](./.github/CONTRIBUTING.md) (sección "Seguridad").

### 4.5 Consultas y datos sensibles

- Toda lectura o escritura de datos va del lado del servidor (Server Components, Server
  Actions o Route Handlers). Los Client Components piden datos, no los consultan.
- El cliente de `src/lib/supabase/client.ts` usa la clave pública y está sujeto a RLS. El
  cliente admin de `src/server/supabase/admin.ts` se reserva para servidor y salta RLS:
  usarlo solo con justificación.
- Los datos de un cliente (nombre, teléfono, correo) no se exponen en listados públicos ni
  se registran en la consola del navegador.
- Nada de `console.log` con datos de personas. Los errores se reportan con un identificador,
  no con la información del solicitante.

### 4.6 Next.js

- La versión instalada es la 16 y cambia respecto a lo conocido. Antes de escribir código de
  Next.js, leer la guía correspondiente en `node_modules/next/dist/docs/`.
- La renovación de sesión vive en `src/proxy.ts`. No reimplementarla en otro lado ni borrar
  ese archivo.
- Imágenes y videos del portafolio van por el servicio de archivos de Supabase; no se
  versionan en `public/` ni se suben al repositorio.

---

## 5. Commits

Formato: `tipo(ámbito): descripción en imperativo, sin punto final`.

| Tipo      | Cuándo                                                |
| --------- | ----------------------------------------------------- |
| `feat`    | Funcionalidad nueva                                    |
| `fix`     | Corrección de error                                    |
| `security`| Cierra una vulnerabilidad o exposición de datos        |
| `refactor`| Reorganiza sin cambiar comportamiento                  |
| `perf`    | Mejora de rendimiento                                  |
| `test`    | Pruebas nuevas                                        |
| `docs`    | Documentación                                          |
| `chore`   | Dependencias y configuración                          |

| Ámbito        | Módulo                                        |
| ------------- | --------------------------------------------- |
| `infra`       | Docker, CI/CD, `.github`, configuración        |
| `portafolio`  | Galería de fotos y videos                      |
| `estudio`     | Renta del salón, reservas, servicios, equipo  |
| `leads`       | Captación comercial y notificaciones          |
| `social`      | Solicitudes de apoyo social                    |
| `auth`        | Sesión, roles y proxy                          |
| `db`          | Migraciones y esquema de la base de datos     |
| `deps`        | Dependencias del proyecto                      |

Ejemplos:

```
feat(estudio): agregar selector de horarios disponibles
fix(leads): evitar duplicados al enviar el formulario
security: no exponer la service role al bundle del cliente
db: agregar tabla de resenas con una resena por reserva
```

El mensaje se puede escribir con `git commit` (se abre la plantilla `.gitmessage` en Linux y
macOS) o directamente en `git commit -m "..."` en Windows. Los hooks revisan espacios al
final, archivos grandes, llaves privadas y commits directos en `main`.

---

## 6. Comandos de verificación

```bash
npm run lint        # estilo del código
npm run typecheck   # tipos
npm run build       # compila como se entrega
npm run check       # los tres, en orden
```

Antes de dar por terminado un trabajo deben pasar los tres. Si algo falla y no es culpa del
cambio, se documenta en el PR; no se salta la verificación.

---

## 7. Flujo de una tarea, de principio a fin

1. Buscar o crear la tarea en las incidencias de GitHub (`.github/ISSUE_TEMPLATE`).
2. Actualizar `develop` y crear la rama: `git checkout -b feat/mi-tarea`.
3. Leer `node_modules/next/dist/docs/` si el trabajo toca Next.js.
4. Escribir código y, si hay base de datos, la migración nueva en `supabase/migrations/`.
5. Documentar en `docs/` si el cambio es importante, y agregar el enlace al índice.
6. Verificar: `npm run check`.
7. Commit con el formato del punto 5.
8. Subir la rama y abrir el PR a `develop`, llenando la plantilla.
9. Resolver los comentarios de revisión y responder preguntas de los compañeros.

---

## 8. Base de datos: estado actual

Migraciones existentes (`supabase/migrations/`):

| Archivo | Contenido |
| --- | --- |
| `000001_extensiones.sql` | `pgcrypto` para los identificadores únicos |
| `000002_usuarios.sql` | Identidad y roles (`admin`, `colaborador`, `cliente`) |
| `000003_portafolio.sql` | Piezas de la galería, con orientación, fecha y material en preparación |
| `000004_servicios_estudio.sql` | Servicios extra con tarifa por hora |
| `000005_inventario_equipos.sql` | Equipos rentables, con existencia y tarifa |
| `000006_reservas.sql` | Reserva del salón, sin traslape de horarios |
| `000007_reserva_servicios.sql` | Servicios incluidos en una reserva, con precio congelado |
| `000008_reserva_equipos.sql` | Equipos incluidos en una reserva, con cantidad y precio congelado |
| `000009_resenas_clientes.sql` | Una reseña por reserva, con moderación |
| `000010_leads_contacto.sql` | Solicitudes del formulario de contacto y su estado |
| `000011_solicitudes_apoyo_social.sql` | Solicitudes de apoyo de fundaciones y su estado |

Decisiones ya tomadas que hay que respetar:

- Las tarifas se **congelan** al confirmar la reserva (`precio_congelado`): cambiar el
  precio del catálogo no altera lo que el cliente ya aceptó.
- El salón es un solo recurso: `reservas` impide horarios traslapados y una reserva
  cancelada libera su espacio sin borrarse.
- Nada se borra para "limpiar": los catálogos se desactivan con `activo = false` y así se
  conserva el historial.

Pendiente, que debe llegar como migración (nunca desde el panel): RLS de todas las tablas,
buckets de Storage con sus políticas, tabla de `horarios_disponibles` y el historial de
cambios de estado de reservas y leads.

---

## 9. Lo que no se hace

- Modificar la base de datos en la nube sin migración.
- Commit directo en `develop` o `main`.
- Subir `.env`, `.env.local`, llaves, certificados o respaldos de base de datos. La
  automatización del PR lo bloquea, pero también lo hace el hook local.
- Exponer la `service_role` o una contraseña de base de datos en el navegador.
- Meter fotos o videos de trabajo en el repositorio: van a Supabase Storage.
- Poner datos de clientes en la consola del navegador o en los logs.
- Cambiar el stack (base de datos, framework, autenticación) sin una decisión escrita en
  `docs/`.
- Reescribir un archivo ya aprobado sin avisar en el PR. Se prefiere un PR nuevo.
- Dar por terminado algo sin que `npm run check` pase.

---

## 10. Referencias

| Tema | Dónde |
| --- | --- |
| Instalación y arranque | [`README.md`](./README.md) |
| Decisiones técnicas | [`docs/01-decisiones-tecnicas.md`](./docs/01-decisiones-tecnicas.md) |
| Índice de documentación | [`docs/README.md`](./docs/README.md) |
| Guía de contribución y seguridad | [`.github/CONTRIBUTING.md`](./.github/CONTRIBUTING.md) |
| Reglas de commits | [`.gitmessage`](./.gitmessage) |
| Plantilla de PR | [`.github/pull_request_template.md`](./.github/pull_request_template.md) |
| Etiquetas disponibles | [`.github/labels.yml`](./.github/labels.yml) |
| Quién revisa qué | [`.github/CODEOWNERS`](./.github/CODEOWNERS) |
| Guías de Next.js 16 | `node_modules/next/dist/docs/` |
