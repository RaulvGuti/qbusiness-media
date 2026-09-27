# 01 · Decisiones técnicas

Este documento explica **qué se decidió, por qué y cuánto costaría cambiarlo** más adelante.
Nada de lo que está aquí se cambia sin escribir antes un PR y actualizar esta página.

---

## 1. Supabase frente a Neon (u otro Postgres)

**Decisión: Supabase como backend único.**

Lo que nos da Supabase en un solo lugar y en el plan gratuito:

| Necesidad | Con Supabase | Con Neon (solo Postgres) |
| --- | --- | --- |
| Base de datos (Postgres) | Sí | Sí |
| Usuarios con sesión (login) | Sí, listo | No, hay que programarlo o contratar otro servicio |
| Almacenamiento de fotos y videos | Sí, con enlaces y permisos | No |
| Envío de correos | No (usamos Resend) | No |
| Edición visual de tablas | Sí, solo para **leer** | No |
| Costo de arranque | $0 | $0 |

**Por qué Supabase.** El proyecto necesita tres cosas que en Neon serían tres servicios
distintos: base de datos, archivos y usuarios. Con Supabase es un solo proyecto, una sola
cuenta, una sola clave. Para un equipo de siete personas que todavía está empezando, esa
diferencia decide el día a día más que el rendimiento.

**Límites del plan gratuito que hay que tener presentes** (a fecha de hoy, verificar en la
documentación de Supabase porque pueden cambiar):

- Base de datos de hasta 500 MB. El sitio es de contenido, no transaccional: alcanza de sobra.
- Almacenamiento de hasta 1 GB. Es el número que hay que vigilar: los videos pesan. Por eso
  las miniaturas se guardan aparte y el catálogo de equipos de video es lo primero que se
  sube.
- El proyecto se **pausa** si una semana entera no recibe actividad. Por eso existe
  `.github/workflows/cron-keep-alive.yml`, que hace una consulta mínima cada 3 días.
- Suspender el proyecto no borra los datos, pero la app no responde hasta que se reactiva.

**¿Qué tan grave sería cambiar a Neon o a una base de datos de pago más adelante?**

Poco, y por dos decisiones que ya tomamos a propósito:

1. La base de datos se escribe **en SQL estándar**, en archivos versionados
   (`supabase/migrations/*.sql`). Ese SQL corre en cualquier Postgres: Heidi, Neon, una
   máquina propia o el servicio de pago que se elija después. No usamos campos propios de
   Supabase en el esquema.
2. El código no habla SQL crudo con la base de datos: usa el cliente de Supabase, que está
   aislado en **tres archivos** (`src/lib/supabase/client.ts`, `src/server/supabase/server.ts`
   y `src/server/supabase/admin.ts`) y las consultas viven en `src/server/repositories/`.
   Cambiar de backend es reescribir esos archivos, no el sitio completo.

**Riesgos que sí hay que aceptar:** con Neon o con Postgres pago se pierde el
almacenamiento de archivos (habría que contratar otro servicio), la autenticación lista y el
panel de administración. El orden de un cambio futuro sería: (1) base de datos, (2)
archivos, (3) usuarios. Y cada paso es un PR propio, con su documento en `docs/`.

**Alternativas descartadas y por qué:**

- **SQLite en el servidor:** no sirve con varias personas revisando y desplegando a la vez, y obliga a definir contratos de API antes de tenerlos.
- **Firebase / Firestore:** mejor para apps de usuario en tiempo real, no para catálogos, reservas y reportes. Además, su modelo de datos sí obliga a reescribir todo al migrar.
- **Neon:** excelente Postgres, pero deja fuera archivos y usuarios (ver arriba).

---

## 2. Archivos de fotos y videos

**Decisión: Supabase Storage, y el repositorio solo guarda el enlace.**

Reglas:

- Las imágenes y los videos **no se suben a Git** ni a la carpeta `public/`. Se suben a
  Storage y la base de datos guarda la dirección (`url_archivo`, `url_miniatura` en la tabla
  `portafolio`).
- Las políticas de permisos de los buckets se crean **por migración**, igual que el resto.
- El sitio público solo muestra material publicado; lo que está en preparación se marca con
  `es_backstage = true` y no aparece en la galería.
- Para no llenar la cuota de almacenamiento: miniaturas ligeras, un tamaño máximo por
  archivo y videos completos solo cuando el trabajo lo amerita.

---

## 3. Pagos de la renta del estudio

**Decisión: no se conecta ninguna pasarela de pagos en esta etapa.**

Lo que ya está resuelto en el flujo de reserva:

- La reserva guarda `url_comprobante_pago` y pasa por los estados
  `pendiente → confirmada / cancelada / completada`.
- El precio se **congela** (`precio_congelado`) al confirmar, así que un cambio de tarifa no
  altera lo que el cliente ya aceptó.
- El salón es un solo recurso: la base de datos impide dos reservas traslapadas y una
  reserva cancelada libera su horario sin borrarse.

Mientras tanto el cobro es manual (transferencia y comprobante), que es lo que un negocio
pequeño necesita al inicio y no implica costos ni integración.

**Si más adelante se cobra en línea:** se agrega una tabla `pagos` y un estado más en la
tabla `reservas`, se implementa una Server Action que llame a la pasarela elegida y se
documenta en `docs/`. No se toca el resto del módulo, y no hay que reescribir el flujo de
horarios. La pasarela se elige con el cliente cuando se sepa cuántos pagos y de qué monto
se tratan: casi todas cobran una cuota mensual más una comisión por transacción.

---

## 4. Levantar y entregar el proyecto

**Decisión: un solo comando para trabajar; Docker como alternativa, no como obligación.**

- `npm run dev` es la forma normal de trabajar. Quien integrate necesita Node 20.9 o
  superior, nada más.
- `npm run setup` deja el equipo listo la primera vez: plantilla de commit, `.env.local` y
  hooks de revisión.
- `compose.yml` + `Dockerfile` existen para **replicar la entrega**: el sitio se compila
  dentro de una imagen que se levanta con un solo comando, sin que la persona que recibe el
  proyecto tenga que instalar Node ni configurar la base de datos a mano.
- `next.config.ts` usa `output: "standalone"`, que es lo que hace posible esa imagen de
  Docker con pocas dependencias.

---

## 5. Cómo se aplica una migración

Los archivos van en `supabase/migrations/NNNNNN_nombre.sql` y se aplican **después** de
aprobar el PR a `develop`.

Pasos:

1. Crear el archivo con el siguiente número disponible.
2. Escribir el SQL y probarlo en una base de datos de desarrollo (el PostgreSQL de
   `docker compose`, o una base de datos de pruebas en Supabase).
3. Abrir el PR con el archivo incluido y explicar en la descripción qué hace y cómo se
   comprueba.
4. Tras la aprobación, aplicar el SQL en la base de datos de la nube desde el **Editor SQL**
   de la consola de Supabase, copiando el contenido del archivo.
5. Anotar en el PR que se aplicó, con fecha. Eso es el historial del proyecto.

Si más adelante se instala la CLI de Supabase, el paso 4 se reemplaza por
`supabase db push`, pero el archivo sigue siendo la fuente de verdad.
