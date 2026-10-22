# Despliegue: cómo se publica y cómo se actualiza el sitio

Este documento explica las dos formas de levantar QBusiness Media, **dónde se leen las
variables de entorno** y qué hay que tener en cuenta al construir la imagen de Docker.
Es la referencia para publicar el sitio y para diagnosticar un build que falla.

---

## 1. Las dos formas de levantar el sitio

| Forma | Para qué sirve | Dónde vive la configuración |
| --- | --- | --- |
| Desarrollo local (`npm run dev`) | Trabajar en el código | `frontend/.env.local` |
| Contenedores (`docker compose up -d`) | Replicar cómo se entrega al cliente | `.env` en la **raíz** del repo |

Next.js lee los archivos de entorno desde la carpeta donde vive `next.config.ts`, es decir
`frontend/`. **Docker Compose, en cambio, interpola sus variables desde el `.env` de la
raíz del repositorio.** Son dos archivos distintos con el mismo contenido, y por eso
`npm run setup` crea los dos.

```
frontend/.env.local   -> lo lee Next.js (npm run dev, npm run build)
.env (raíz)           -> lo lee docker compose (build y runtime)
```

> El `.env` de la raíz está en `.gitignore`. No se versiona, y no debe versionarse: ahí
> van los valores reales de Supabase.

---

## 2. Variables de entorno: cuándo se leen

Este es el punto que más confunde, y la causa de varios fallos de build.

| Variable | Cuándo se lee | Dónde |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | **En el build** | Se incrusta en el bundle del navegador |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **En el build** | Se incrusta en el bundle del navegador |
| `SUPABASE_SERVICE_ROLE_KEY` | En runtime | Solo en el servidor, nunca en el navegador |
| `DATABASE_URL` | En runtime | Solo la base de datos local de `compose.yml` |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | En runtime | Sitio público |
| `NEXT_PUBLIC_SITE_URL` | En runtime | Solo para enlaces de recuperación de contraseña |

### Por qué `NEXT_PUBLIC_*` son especiales

Las variables `NEXT_PUBLIC_*` se **reemplazan por su valor durante el build**. No se leen
en tiempo de ejecución. Consecuencia práctica:

> Definir `NEXT_PUBLIC_SUPABASE_URL` en el `environment:` de `compose.yml` **no cambia
> nada** del bundle del navegador que ya se compiló. Si el build corrió sin la variable,
> el bundle quedó con una cadena vacía y el login no conecta con Supabase, aunque el
> contenedor sí tenga la variable puesta.

Por eso el `Dockerfile` las recibe como **argumentos de build** (`build.args` en
`compose.yml`) y no solo como variables de entorno del contenedor.

Las dos variables `NEXT_PUBLIC_*` de Supabase son **públicas**: la URL del proyecto y la
clave `anon`, que está sujeta a las políticas RLS. Pasarlas como argumento de build no
expone ningún secreto. La `SUPABASE_SERVICE_ROLE_KEY` sí es privada y **nunca** debe
entrar en un `ARG` ni en un `ENV` de la etapa de build.

### Valores por defecto

Si las variables no llegan al build, el `Dockerfile` usa valores de ejemplo y avisa por
stderr:

```
AVISO: NEXT_PUBLIC_SUPABASE_URL no llego al build.
       La imagen usara un proyecto de ejemplo y el login no funcionara.
```

La imagen compila igual, pero **el login contra Supabase no va a funcionar** hasta
recompilar con los valores reales.

---

## 3. Desarrollo local

```bash
cd frontend
npm install
npm run setup   # crea frontend/.env.local y el .env de la raíz
npm run dev
```

`npm run setup` copia `frontend/.env.example` a los dos archivos. **Hay que reemplazar los
valores de ejemplo** por los reales de Supabase (Project Settings → API):

| Variable | De dónde sale |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | *anon public* |
| `SUPABASE_SERVICE_ROLE_KEY` | *service_role* (privada) |

Verificación antes de entregar cualquier trabajo:

```bash
cd frontend
npm run check   # lint + tipos + build
```

---

## 4. Contenedores

### Construir y levantar

```bash
# El .env de la raíz debe tener los valores reales de Supabase
docker compose build
docker compose up -d
```

El sitio queda en <http://localhost:3000> y PostgreSQL local en el puerto 5432.

Para parar:

```bash
docker compose down          # conserva los datos
docker compose down -v       # borra también el volumen de PostgreSQL
```

### Ojo: reconstruir la imagen

Si se cambian las variables `NEXT_PUBLIC_*`, **hay que reconstruir la imagen**, no solo
reiniciar el contenedor:

```bash
docker compose build --no-cache web
docker compose up -d
```

`docker compose up -d` por sí solo **no** recompila: reutiliza la imagen anterior con el
bundle viejo.

### Comprobar que la imagen quedó bien

```bash
docker compose config | grep -A3 "args:"     # los valores que llegan al build
docker compose logs web                      # el aviso "AVISO:" aparece aqui si faltan
```

---

## 5. Diagnóstico: el build de Docker falla

Síntoma:

```
failed to solve: process "/bin/sh -c npm run build" did not complete successfully: exit code: 1
```

**Causa más frecuente (ya corregida):** las variables `NEXT_PUBLIC_*` no existían
durante el build y `@supabase/ssr` lanzaba
`Your project's URL and API key are required to create a Supabase client!` al importar el
cliente del navegador.

Hoy el cliente de Supabase del navegador se crea **al usarlo, no al importar el módulo**
(`frontend/src/lib/supabase/client.ts`), así que el build ya no depende de que existan
esas variables. Aun así, hay que pasarlas como `build.args` para que el bundle apunte al
proyecto correcto.

**Cómo diagnosticar:** reproducir el build sin las variables y leer el error completo.

```bash
# En una copia de frontend/ sin .env.local
cd frontend
npm run build
```

Si aparece un error de Supabase, es que faltan las variables del entorno. Si aparece
otro error, es un problema de código y se lee igual en el log del build de Docker.

### Ojo: `.env.local` nunca entra en la imagen

`.dockerignore` excluye `**/.env.local`. Es intencional: el archivo local de cada
desarrollador (con claves reales) no debe quedar dentro de la imagen. Por eso la imagen
depende de los `build.args`, y no de un archivo de entorno copiado.

---

## 6. Lo que valida la CI

| Workflow | Qué hace |
| --- | --- |
| `ci.yml` | `lint`, tipos y `build` de Next.js. Usa valores de ejemplo para Supabase. |
| `build.yml` | `docker compose build`: valida que la imagen se construye. |
| `validar-pr.yml` | Formato del título del PR y archivos con credenciales. |

El workflow `build.yml` crea un `.env` temporal en la raíz a partir de
`frontend/.env.example` antes de construir. Como los valores de ejemplo son una URL
válida, la imagen compila: lo que se valida en la CI es que el `Dockerfile` funciona, no
que la imagen apunte al proyecto real.

---

## 7. Resumen de lo que hay que revisar antes de publicar

1. `frontend/.env.local` y el `.env` de la raíz tienen los valores reales de Supabase.
2. `cd frontend && npm run check` pasa.
3. Si se cambió una variable `NEXT_PUBLIC_*`, la imagen se **reconstruyó**.
4. La `SUPABASE_SERVICE_ROLE_KEY` nunca se metió en un `ARG`/`ENV` de build ni en un
   archivo versionado.
