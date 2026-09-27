# QBusiness Media — Sitio web corporativo

Plataforma web de **QBusiness Media**: portafolio de trabajo, captación de clientes,
solicitudes de apoyo social y renta del estudio, todo en un solo sitio.

Este documento explica **qué construimos, por qué, cómo se levanta el proyecto en tu
computadora y cómo trabajamos dentro del equipo**. Si eres nuevo, sigue los pasos en
orden y en 10 minutos vas a tener el proyecto corriendo.

- Las reglas obligatorias para trabajar aquí están en [`AGENTS.md`](./AGENTS.md).
- Las decisiones importantes y el avance del proyecto viven en [`docs/`](./docs/).

---

## 1. Contexto del proyecto

### 1.1 Definición del problema

A través de la entrevista y la Carta Responsiva se detectaron las siguientes
problemáticas críticas:

- **Dependencia operativa total en una sola persona.** Todo el flujo comercial,
  administrativo y de contacto recae exclusivamente en el propietario, sin apoyo de un
  sistema.
- **Falta de un canal digital propio de captación.** No existe un sitio web corporativo;
  la captación depende exclusivamente de recomendaciones.
- **Ausencia de un portafolio accesible y centralizado.** Los prospectos no pueden
  consultar de forma autónoma trabajos anteriores, fotos del estudio ni casos de éxito.
- **Pérdida de trazabilidad de prospectos.** Las solicitudes que llegan por teléfono no
  quedan registradas, lo que impide dar seguimiento a clientes indecisos.
- **Subutilización de la locación/estudio.** Al no existir difusión clara del espacio, se
  pierden oportunidades de renta.
- **Proceso manual para causas sociales.** No hay un canal ordenado para que fundaciones
  (ej. bomberos voluntarios) soliciten apoyo audiovisual.

### 1.2 Objetivos del proyecto

**General:** desarrollar una plataforma web corporativa que permita a QBusiness Media dar
a conocer su portafolio de trabajo, profesionalizar la gestión de contactos y consolidar su
identidad de marca en un entorno digital.

**Específicos:**

1. Exhibir el portafolio de trabajo (fotografía y video, tanto vertical como horizontal)
   sin perder formato ni calidad.
2. Centralizar toda la navegación dentro de una sola página mediante *tabs*, evitando la
   apertura excesiva de enlaces externos.
3. Automatizar y registrar la captación inicial de clientes a través de un formulario de
   contacto, evitando la pérdida de información que ocurre actualmente.
4. Habilitar un canal formal y diferenciado para que fundaciones soliciten apoyo social,
   capturando los datos de la entidad solicitante.
5. Difundir la locación de estudio como espacio disponible para renta (fotografía, podcast,
   producción de contenido).
6. Permitir que la plataforma escale junto con el crecimiento futuro de la empresa.

### 1.3 Módulos del sitio

Todo vive en una sola página con pestañas, en este orden:

| Pestaña      | Qué resuelve                                                              | Módulo Git |
| ------------ | ------------------------------------------------------------------------- | ---------- |
| **Inicio**   | Presenta la marca, el portafolio destacado y el llamado a la acción.        | `portafolio` |
| **Portafolio** | Galería de fotos y videos (vertical y horizontal) con **búsqueda por fecha**. | `portafolio` |
| **Estudio**  | Renta del salón: horarios, tarifas, servicios y equipo extra.             | `estudio` |
| **Contacto** | Formulario que guarda el lead y avisa por WhatsApp y correo.              | `leads` |
| **Social**   | Solicitudes de apoyo audiovisual para fundaciones y bomberos.              | `social` |
| **Acceso**   | Ingreso del equipo para administrar lo anterior.                            | `auth` |

---

## 2. Decisiones técnicas (y por qué)

| Tema | Decisión | Razón |
| --- | --- | --- |
| Base de datos | **Supabase** (Postgres en la nube) | Gratis, y en un solo lugar da base de datos, usuarios con sesión, almacenamiento de fotos/videos y automatizaciones. Neon solo da base de datos: tendríamos que pagar o programar lo demás. |
| Archivos (fotos/videos) | **Supabase Storage** | Entrega las imágenes y videos con enlace directo, sin llenar el repositorio de Git. |
| Sesión de los usuarios | **Supabase Auth** con cookies | El equipo entra con correo y clave; el sitio público no necesita registro. |
| Correos de notificación | **Resend** (gratis hasta 3.000/mes) | Llegada real a correo, con aviso de "se envió". |
| Aviso por WhatsApp | Enlace `wa.me` | Sin contrato con Twilio: se abre el chat con el número de la empresa. |
| Pagos en línea | **No se conecta ninguna pasarela todavía** | El flujo de reserva ya contempla comprobante de pago y aprobación manual. Si más adelante se cobra en línea, se agrega sin rehacer la base de datos. Ver `docs/01-decisiones-tecnicas.md`. |
| Desarrollo local | **Un comando** (`npm run dev`) con `docker compose` como alternativa | Quien entrega el proyecto no debe depender de Docker ni de instalar la base de datos a mano. |

> Detalle de por qué Supabase y no Neon, y qué tan grave sería cambiar después:
> [`docs/01-decisiones-tecnicas.md`](./docs/01-decisiones-tecnicas.md).

---

## 3. Levantar el proyecto desde cero

### 3.1 Requisitos (una sola vez)

- **Node.js 20.9 o superior** → <https://nodejs.org> (verifica con `node -v`)
- **Git** → <https://git-scm.com/downloads> (verifica con `git --version`)

No necesitas instalar Docker ni PostgreSQL para trabajar en el día a día. Docker es
opcional (sección 3.5).

### 3.2 Código

```bash
git clone https://github.com/RaulvGuti/qbusiness-media.git
cd qbusiness-media
git checkout develop
npm install
```

Ojo: se trabaja en la rama **`develop`**, no en `main`. `main` es la versión ya publicada
y nadie hace commits ahí.

### 3.3 Configurar el proyecto

```bash
npm run setup
```

Este comando hace todo lo necesario:

1. Revisa que tu versión de Node sea suficiente.
2. Activa la plantilla de mensajes de commit (`.gitmessage`).
3. Crea tu archivo personal `.env.local` a partir de `.env.example`.
4. Intenta instalar los hooks que revisan el commit antes de aceptarlo.

Los hooks (paso 4) necesitan Python. Si no lo tienes, el comando avisa y sigue: puedes
trabajar sin ellos, pero conviene instalarlos para que Git rechace solos los archivos con
llaves privadas y los commits directos en `main`:

```bash
pip install pre-commit
pre-commit install
```

### 3.4 Conectar la base de datos

El sitio usa el proyecto de Supabase del equipo. Pide en el grupo de WhatsApp del equipo
estos tres datos y ponlos en tu `.env.local`:

| Variable | Dónde se saca |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API → *anon public* |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API → *service_role* (**privada**) |

> Las tres empiezan con `https://` y con `eyJ...`. La `service_role` es una contraseña:
> nunca se sube a Git ni se manda por WhatsApp. Si se filtra, se revoca en Supabase y se
> genera una nueva.

### 3.5 Levantar el sitio

```bash
git clone https://github.com/RaulvGuti/qbusiness-media.git
cd qbusiness-media
git checkout develop
npm install
```

Ojo: se trabaja en la rama **`develop`**, no en `main`. `main` es la versión ya publicada
y nadie hace commits ahí.

### 3.3 Configurar el proyecto

```bash
npm run setup
```

Este comando hace todo lo necesario:

1. Revisa que tu versión de Node sea suficiente.
2. Activa la plantilla de mensajes de commit (`.gitmessage`).
3. Crea tu archivo personal `.env.local` a partir de `.env.example`.
4. Intenta instalar los hooks que revisan el commit antes de aceptarlo.

Los hooks (paso 4) necesitan Python. Si no lo tienes, el comando avisa y sigue: puedes
trabajar sin ellos, pero conviene instalarlos para que Git rechace solos los archivos con
llaves privadas y los commits directos en `main`:

```bash
pip install pre-commit
pre-commit install
```

### 3.4 Conectar la base de datos

El sitio usa el proyecto de Supabase del equipo. Pide en el grupo de WhatsApp del equipo
estos tres datos y ponlos en tu `.env.local`:

| Variable | Dónde se saca |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API → *anon public* |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API → *service_role* (**privada**) |

> Las tres empiezan con `https://` y con `eyJ...`. La `service_role` es una contraseña:
> nunca se sube a Git ni se manda por WhatsApp. Si se filtra, se revoca en Supabase y se
> genera una nueva.

### 3.5 Levantar el sitio

```bash
npm run dev
```

Abre <http://localhost:3000>. Listo.

Opción alternativa con contenedores (útil para replicar cómo se entrega al cliente):

```bash
docker compose up -d
```

### 3.6 Pasos completos, en una lista

```bash
git clone https://github.com/RaulvGuti/qbusiness-media.git
cd qbusiness-media
git checkout develop
npm install
npm run setup
npm run dev
```

Abre <http://localhost:3000>. Listo.

Opción alternativa con contenedores (útil para replicar cómo se entrega al cliente):

```bash
docker compose up -d
```

### 3.6 Pasos completos, en una lista

```bash
git clone https://github.com/RaulvGuti/qbusiness-media.git
cd qbusiness-media
git checkout develop
npm install
npm run setup
npm run dev
```

---

## 4. Estructura del proyecto

```
qbusiness-media/
├─ src/
│  ├─ app/                 # Páginas y rutas del sitio (App Router)
│  ├─ components/          # Piezas visuales reutilizables (layout/, ui/)
│  ├─ lib/                 # Utilidades y cliente de Supabase para el navegador
│  ├─ server/              # Lo que solo corre en el servidor
│  │  ├─ supabase/         # Clientes de Supabase (navegador / servidor / admin)
│  │  ├─ repositories/     # Consultas a la base de datos
│  │  └─ services/         # Reglas de negocio (reservas, leads, notificaciones)
│  ├─ types/               # Tipos de datos compartidos
│  └─ proxy.ts             # Renueva la sesión en cada petición
├─ supabase/migrations/    # Archivos .sql: la base de datos se cambia solo aquí
├─ docs/                   # Decisiones y avances del proyecto
├─ .github/                # Issues, plantillas de PR, etiquetas y automatizaciones
├─ scripts/setup.mjs       # El comando `npm run setup`
├─ compose.yml             # Sitio + PostgreSQL en contenedores
└─ Dockerfile              # Cómo se construye la imagen del sitio
```

Regla fácil de recordar: **lo que el visitante ve va en `src/app` y `src/components`; lo
que habla con la base de datos va en `src/server`.**

---

## 5. Cómo trabajamos en el equipo

El detalle completo —ramas, commits, checklist de PR, catálogo de etiquetas y cómo reportar
una vulnerabilidad— está en [`.github/CONTRIBUTING.md`](./.github/CONTRIBUTING.md).

### 5.1 Ramas

- `develop` → la rama de trabajo del día a día. **Todo lo entra aquí.**
- `main` → la versión publicada. Solo recibe merges de `develop`.

Cada persona trabaja en su propia rama, que nace de `develop`:

```bash
git checkout develop
git pull
git checkout -b feat/mi-tarea
```

Al terminar:

```bash
git push -u origin feat/mi-tarea
```

Y en GitHub se abre un **Pull Request de `feat/mi-tarea` hacia `develop`**. Nunca se hace
commit directo en `develop` ni en `main`.

### 5.2 Mensajes de commit

Al hacer commit se abre la plantilla `.gitmessage`. El formato es:

```
tipo(ámbito): qué cambias
```

Tipos: `feat`, `fix`, `security`, `refactor`, `perf`, `test`, `docs`, `chore`.
Ámbitos: `infra`, `portafolio`, `estudio`, `leads`, `social`, `auth`, `db`, `deps`.

```bash
feat(estudio): agregar selector de horarios disponibles
fix(portafolio): mostrar verticales con su proporción real
docs(leads): explicar cómo revisar los leads nuevos
```

### 5.3 Pull Requests

- Todos los PRs van a **`develop`**.
- El título del PR sigue el mismo formato del commit.
- La descripción usa la plantilla de `.github/pull_request_template.md`: qué resuelve, cómo
  se prueba y si hubo cambios de base de datos.
- Dos automatizaciones revisan cada PR: una valida el formato del título y que no subas
  archivos con contraseñas; la otra pone las etiquetas según las carpetas que tocaste.
- `.github/CODEOWNERS` marca qué revisar siempre con el líder del proyecto.

### 5.4 Tareas (issues)

Las plantillas están en `.github/ISSUE_TEMPLATE`: error, funcionalidad, deuda técnica,
seguridad y documentación. Una tarea por persona a la vez; se toma escribiendo
`@nombre` en un comentario.

### 5.5 La base de datos solo se cambia con migraciones

**Esta es la regla más importante del proyecto.**

- La base de datos en la nube **no se modifica a mano**. Ni desde el editor de tablas, ni
  desde el editor de SQL de la consola de Supabase, ni desde Prisma Studio.
- Todo cambio de base de datos se escribe como un archivo nuevo en
  `supabase/migrations/`, con el siguiente número: `000012_lo_que_sea.sql`.
- Ese archivo se aplica en la base de datos **abriendo un PR a `develop`**, se revisa junto
  con el código y se aplica después de aprobarse.
- Las migraciones ya aplicadas **no se editan**: se agrega una nueva que las corrija.
- Cada archivo nuevo empieza con un comentario que explique qué hace y por qué.

Así todos los ambientes (tu computadora, el de pruebas, el del cliente) terminan con la
misma base de datos, y siempre se puede saber quién cambió qué y cuándo.

### 5.6 Documentación

- Todo cambio importante se documenta en **`docs/`**, en la raíz del repositorio.
- Convenciones: un archivo `.md` por tema, numerado y con una línea de título clara
  (`docs/02-reservas-del-estudio.md`).
- `docs/README.md` funciona como índice: si documentaste algo, agrega el enlace ahí.
- El resumen de un PR puede ser suficiente para un ajuste pequeño; si el cambio afecta
  cómo se trabaja, cómo se despliega, la base de datos o el alcance del proyecto, el
  documento en `docs/` es obligatorio.

### 5.7 Antes de entregar cualquier trabajo

```bash
npm run check
```

Ese comando revisa el estilo del código, los tipos y que el proyecto compile. Los tres
tienen que pasar. GitHub también lo revisa solo, pero es más molesto descubrirlo aquí.

---

## 6. Comandos más usados

| Comando | Para qué sirve |
| --- | --- |
| `npm run dev` | Levanta el sitio en <http://localhost:3000> |
| `npm run setup` | Configura el equipo la primera vez (plantilla de commit, `.env.local`, hooks) |
| `npm run lint` | Revisa el estilo del código |
| `npm run typecheck` | Revisa los tipos |
| `npm run build` | Compila como se compila para entregar |
| `npm run check` | Los tres anteriores, en un solo comando |
| `docker compose up -d` | Levanta el sitio y una base de datos PostgreSQL en contenedores |
| `docker compose down` | Apaga los contenedores |

---

## 7. Problemas frecuentes

**`node -v` marca una versión menor a 20.9.**
Instala Node 20.9 o superior y vuelve a correr `npm install`.

**La página abre pero no carga fotos ni datos.**
Faltan las variables de Supabase en `.env.local`. Revisa la sección 3.4 y reinicia con
`npm run dev`.

**Aviso de que falta una variable de entorno.**
El archivo se llama `.env.local` y debe estar en la raíz del proyecto. Se crea solo con
`npm run setup`.

**`git` pide usuario y correo al primer commit.**
```bash
git config --local user.name "Tu Nombre"
git config --local user.email "tu-correo@ejemplo.com"
```

**El editor se abre con la plantilla de commit y no sé qué poner.**
Borra las líneas que empiezan con `#` y escribe una sola línea con el formato
`tipo(ámbito): qué cambias`. Ejemplos en la sección 5.2.

**Traigo cambios que no míos.**
```bash
git status
git stash
git checkout develop && git pull
```

**Quiero descartar cambios locales.**
```bash
git restore src/app/page.tsx
```

**`npm install` termina con algún aviso raro.**
Los hooks de `pre-commit` no se instalan solos si no tienes Python: es un aviso, no un
error, y el proyecto funciona igual. Para activarlos:

```bash
pip install pre-commit
pre-commit install
```

**¿Cómo sé si mi rama está al día antes de empezar?**
```bash
git checkout develop
git pull
git checkout -b feat/mi-tarea
```

---

## 8. Contacto y responsables

| Tema | Quién |
| --- | --- |
| Revisión final de código e infraestructura | Responsable definido en `.github/CODEOWNERS` |
| Base de datos y migraciones | Equipo de infraestructura (`module:infra`) |
| Decisiones de producto, tarifas y textos | Propietario de QBusiness Media |
| Dudas del equipo | Grupo de WhatsApp del proyecto |

Cuando algo no esté claro, **pregunta antes de inventar**. Es más barato preguntar que
rehacer un módulo completo.
