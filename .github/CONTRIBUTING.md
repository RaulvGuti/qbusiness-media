# Guía de contribución — QBusiness Media

Esta guía explica cómo trabaja el equipo en este repositorio: ramas, commits, pull
requests, issues, etiquetas y cómo se reportan problemas de seguridad.

- Las reglas **obligatorias** del proyecto están en [`AGENTS.md`](../AGENTS.md). Si algo de
  esta guía contradice a `AGENTS.md`, gana `AGENTS.md`.
- Instalación y arranque: [`README.md`](../README.md).
- Decisiones y avances: [`docs/`](../docs/README.md).

---

## 1. Antes de empezar

```bash
git clone https://github.com/RaulvGuti/qbusiness-media.git
cd qbusiness-media
git checkout develop
npm install
npm run setup   # plantilla de commits, .env.local y hooks
npm run dev
```

- Node.js 20.9 o superior.
- Los datos de Supabase se piden en el grupo del equipo y van en `.env.local`, que Git
  ignora. Nunca se suben llaves reales al repositorio.
- Cada tarea nace de una incidencia. Si no existe, se crea primero con una de las
  plantillas de `.github/ISSUE_TEMPLATE/`.

---

## 2. Ramas

```
main      (producción)
  ^ PR aprobado, lo promueve el responsable del proyecto
develop   (integración, rama de trabajo del día a día)
  ^ PR requerida
feat/*, fix/*, chore/*  (una por tarea)
```

| Rama      | Propósito              | Protección                                                          |
| --------- | ---------------------- | ------------------------------------------------------------------- |
| `main`    | Producción             | PR aprobado y checks de CI en verde; nunca recibe commits directos |
| `develop` | Integración del equipo | PR aprobado y checks de CI; recibe los merges de las ramas de trabajo |

Ramas de trabajo:

```
feat/<descripcion>     # funcionalidad nueva
fix/<descripcion>      # corrección de error
chore/<descripcion>    # dependencias, configuración, CI, documentación
```

Ejemplos: `feat/estudio-selector-horarios`, `fix/leads-duplicados-formulario`,
`chore/actualizar-dependencias`.

Reglas:

1. La rama nace siempre de `develop`, nunca de `main`.
2. Minúsculas, sin espacios, con guiones.
3. Una rama = una incidencia. Si el trabajo crece, se divide en varias ramas y varios PR.
4. Se borra la rama después del merge.
5. Nada de formato, archivos ajenos al objetivo o "de paso" en el mismo PR.

---

## 3. Commits

Formato: `tipo(ámbito): descripción en imperativo, sin punto final`.

Tipos: `feat`, `fix`, `security`, `refactor`, `perf`, `test`, `docs`, `chore`.

Ámbitos: `infra`, `portafolio`, `estudio`, `leads`, `social`, `auth`, `db`, `deps`.

```
feat(estudio): agregar selector de horarios disponibles
fix(leads): evitar duplicados al enviar el formulario
security: no exponer la service role al bundle del cliente
db: agregar tabla de resenas con una resena por reserva
```

- El cuerpo del mensaje es opcional; explica el **por qué**, no el diff.
- `Closes #123` cierra la incidencia. `BREAKING CHANGE: ...` explica qué se rompe.
- Al hacer commit se abre la plantilla `.gitmessage`; en Windows también sirve
  `git commit -m "..."`.
- Los hooks de `pre-commit` revisan espacios al final, archivos grandes, llaves privadas y
  commits directos en `main`. Con Python: `pip install pre-commit && pre-commit install`.

---

## 4. Pull Requests

Todo PR va a **`develop`**, con la plantilla `.github/pull_request_template.md` y el issue
enlazado con `Closes #X`.

```bash
git push -u origin feat/mi-tarea
```

Antes de abrirlo:

- [ ] `npm run check` pasa (los tres: lint, tipos y build).
- [ ] La descripción dice **si hubo migración nueva** en `supabase/migrations/`.
- [ ] Si el cambio es importante, hay documento en `docs/` con su enlace en `docs/README.md`.
- [ ] No quedan `console.log` con datos de personas ni archivos con credenciales.

Automatizaciones que revisan el PR (ninguna se salta):

| Automatización          | Qué revisa                                                                 |
| ----------------------- | -------------------------------------------------------------------------- |
| `Validar PR`            | Título con formato de commit y archivos prohibidos (`.env`, llaves, dumps) |
| `CI`                    | `lint`, verificación de tipos y `build`; además `npm audit`                 |
| `Etiquetado`            | Etiquetas por rutas tocadas (`.github/labeler.yml`)                          |
| `Build de contenedores` | Solo si el PR toca `Dockerfile`, `compose.yml`, `docker/**` o `package*.json` |

- `Validar PR` avisa cuando el PR pasa de 1500 líneas modificadas: conviene dividirlo.
- `.github/CODEOWNERS` exige revisión del responsable en `.github/`, `compose.yml` y
  `Dockerfile`.
- El merge lo hace el responsable del proyecto con *Squash and merge*, para mantener limpio
  el historial de `develop`.
- La promoción de `develop` a `main` la hace el responsable cuando el entregable está
  listo. `main` nunca recibe commits directos.

---

## 5. Incidencias y etiquetas

Plantillas disponibles (la incidencia en blanco está deshabilitada):

| Plantilla                   | Para qué sirve                                | Etiqueta por defecto   |
| --------------------------- | --------------------------------------------- | ---------------------- |
| `01-bug.yml`                | Fallo o comportamiento inesperado             | `type:bug`             |
| `02-feature.yml`            | Funcionalidad nueva, con criterios de aceptación | `type:feature`       |
| `03-deuda-tecnica.yml`      | Refactor, rendimiento o mantenimiento          | `type:refactor`        |
| `04-seguridad.yml`          | Vulnerabilidad o exposición de datos          | `type:security`        |
| `05-docs.yml`               | Corrección o ampliación de documentación       | `type:docs`            |

El título de la incidencia ya viene con el formato del commit: `fix(alcance):`,
`feat(alcance):`, `refactor(alcance):`, `security(alcance):`, `docs(alcance):`.

Etiquetas (`.github/labels.yml` es la fuente de verdad y `node .github/sync-labels.cjs` las
sincroniza con el repositorio):

| Grupo      | Valores                                                                                                       |
| ---------- | ------------------------------------------------------------------------------------------------------------- |
| Tipo       | `type:feature`, `type:bug`, `type:security`, `type:refactor`, `type:perf`, `type:test`, `type:docs`, `type:chore` |
| Módulo     | `module:portafolio`, `module:estudio`, `module:leads`, `module:social`, `module:infra`                          |
| Prioridad  | `priority:critica`, `priority:alta`, `priority:media`, `priority:baja`                                          |
| Estado     | `status:bloqueado`, `status:necesita-decision`, `status:en-progreso`, `status:duplicada`, `status:no-se-hara`  |
| Otros      | `epic`, `dependencies`, `breaking-change`                                                                       |

- Una tarea por persona a la vez; se toma escribiendo `@nombre` en un comentario.
- Dependabot abre sus PR con `type:chore` y `dependencies` (y `module:infra` en Actions y
  Docker), agrupados por tipo de dependencia.

---

## 6. Reglas que no se negocian

Resumen; el detalle y el porqué están en `AGENTS.md`.

1. **La base de datos solo cambia con migraciones.** Nada de panel de Supabase ni de
   editor de SQL. Archivo nuevo en `supabase/migrations/0000NN_nombre.sql`, con el siguiente
   número, y una migración ya aplicada no se edita: se corrige con otra.
2. **Los secretos no se versionan.** `SUPABASE_SERVICE_ROLE_KEY` nunca sale del servidor.
   Al navegador solo viajan `NEXT_PUBLIC_` con la URL y la clave `anon`.
3. **Los datos se consultan en el servidor.** Server Components, Server Actions o Route
   Handlers. Los Client Components piden datos, no los consultan. Sin `console.log` con
   datos de clientes.
4. **Fotos y videos no van al repositorio.** Viven en Supabase Storage.
5. **Nada se borra para limpiar.** Los catálogos se desactivan con `activo = false` y se
   conserva el historial.
6. **Nada se da por terminado sin `npm run check` en verde.**

---

## 7. Seguridad

### Reportar una vulnerabilidad

**No abras un issue público** para una vulnerabilidad sin corregir. Escribe al correo de
seguridad del proyecto (`seguridad@qbusinessmedia.com`, o al responsable técnico; confirmar
la dirección vigente con quien aparezca en `.github/CODEOWNERS`).

Incluye en el reporte:

- Descripción del vector de fallo o del riesgo observado.
- Pasos ordenados para reproducirlo, **sin credenciales ni datos reales de clientes**.
- Módulo afectado (`module:leads`, `module:estudio`, base de datos o almacenamiento).

Compromisos del equipo: acuse de recibo en 48 a 72 horas hábiles, triaje del impacto en un
máximo de 5 días hábiles y resolución según la gravedad.

Si el hallazgo ya está corregido en una rama, se abre el PR con la plantilla
`04-seguridad.yml` y el título `security(ámbito): ...`.

### Al revisar código

- Los permisos se validan en las políticas RLS de Supabase, no solo en la interfaz.
- Nada de `service_role`, contraseñas de base de datos ni tokens de producción en el
  bundle del cliente.
- Las consultas se construyen con el cliente de Supabase, sin SQL concatenado a mano, y
  las entradas se validan con esquemas (`zod`) o tipado estricto.
- Los datos devueltos al cliente se sanitizan; los listados públicos no muestran datos de
  clientes.
- Si una llave se filtra: se revoca en Supabase, se genera otra, se avisa al equipo y se
  documenta en `docs/`.

---

## 8. Dudas

| Tema                                   | Quién                                          |
| -------------------------------------- | ---------------------------------------------- |
| Revisión de código e infraestructura   | Responsable definido en `.github/CODEOWNERS`  |
| Base de datos y migraciones             | Equipo de infraestructura (`module:infra`)    |
| Decisiones de producto, tarifas, textos | Propietario de QBusiness Media                 |
| Dudas del equipo                        | Grupo de WhatsApp del proyecto                 |

Cuando algo no esté claro, **pregunta antes de inventar**: preguntar sale más barato que
rehacer un módulo completo.
