# 03 — Migraciones y esquema v2 de la base de datos

Este documento describe la **arquitectura final de la base de datos** y la secuencia completa de
migraciones, del `000001` al `000029`. Reemplaza al esquema original de la primera etapa: las
tablas `usuarios`, `portafolio` y `resenas_clientes` cambiaron de forma y hoy la base se apoya
en Supabase Auth y en un modelo de galería por carpetas.

> Regla que no se rompe: **la base de datos solo cambia con migraciones**. Nada desde el panel de
> Supabase. Una migración aplicada no se edita; se corrige con otra. Todo lo de este documento
> salió de `supabase/migrations/`.

---

## 1. Panorama

- **Backend:** Supabase (Postgres + Auth + Storage). No hay otra base de datos.
- **Identidad:** los perfiles (`administradores`, `clientes`) tienen como `id` el mismo `id` de
  `auth.users`. `auth.uid()` identifica a quien inició sesión sin tablas puente.
- **Autorización:** RLS activo en **las 18 tablas** de `public`. Las claves se protegen además
  con `grant`/`revoke` a nivel de columna o tabla donde interesa.
- **Zona horaria del negocio:** `America/Guatemala` (UTC-6, sin horario de verano). Las marcas
  de tiempo se guardan en `timestamptz` y se interpretan en esa zona en las funciones.
- **Precios:** se **congelan** al reservar (`precio_congelado`, `tarifa_hora_aplicada`).

---

## 2. Secuencia de migraciones (000001 → 000029)

| # | Archivo | Qué agrega o cambia |
| --- | --- | --- |
| 001 | `000001_extensiones.sql` | Extensión `pgcrypto` (para `gen_random_uuid`) |
| 002 | `000002_usuarios.sql` | Tabla `usuarios` con roles (`admin`, `colaborador`, `cliente`) **(eliminada en 000021)** |
| 003 | `000003_portafolio.sql` | Tabla `portafolio` (piezas de la galería) **(se migra en 000024)** |
| 004 | `000004_servicios_estudio.sql` | Catálogo `servicios_estudio` |
| 005 | `000005_inventario_equipos.sql` | Catálogo `inventario_equipos` |
| 006 | `000006_reservas.sql` | Tabla `reservas` con exclusión de traslapes |
| 007 | `000007_reserva_servicios.sql` | Servicios incluidos en una reserva (precio congelado) |
| 008 | `000008_reserva_equipos.sql` | Equipos incluidos en una reserva (cantidad y precio) |
| 009 | `000009_resenas_clientes.sql` | Tabla `resenas_clientes` (una por reserva) |
| 010 | `000010_leads_contacto.sql` | Leads del formulario de contacto |
| 011 | `000011_solicitudes_apoyo_social.sql` | Solicitudes de apoyo social |
| 012 | `000012_administradores_clientes.sql` | Reemplaza `usuarios` por `administradores` y `clientes`; crea `es_admin()` |
| 013 | `000013_trigger_auth_nuevo_cliente.sql` | Trigger en `auth.users`: todo registro nuevo nace como cliente |
| 014 | `000014_reasignar_fks_a_administradores.sql` | Reasigna `portafolio`, `leads` y `solicitudes` a `administradores` |
| 015 | `000015_reservas_contacto_y_cliente.sql` | `reservas` gana `cliente_id`, `creado_por` y datos del formulario |
| 016 | `000016_configuracion_sitio.sql` | Tabla `configuracion_sitio` (pares grupo/clave) |
| 017 | `000017_fechas_bloqueadas.sql` | Tabla `fechas_bloqueadas` (vacaciones, mantenimiento) |
| 018 | `000018_validar_disponibilidad.sql` | `intervalos_bloqueados()`, trigger `validar_reserva` y `horarios_ocupados()` |
| 019 | `000019_solicitar_reserva.sql` | Función `solicitar_reserva()`; el precio lo calcula el servidor |
| 020 | `000020_politicas_rls.sql` | RLS en todas las tablas existentes y políticas por rol |
| 021 | `000021_eliminar_usuarios.sql` | `drop table usuarios` (ya no la referencia nadie) |
| 022 | `000022_reservas_backfill_y_limite_pendientes.sql` | Backfill de `creado_por` y límite de pendientes por cliente |
| 023 | `000023_galeria_empresas_carpetas.sql` | `empresas`, `carpetas_galeria`, `archivos_galeria`, `destacados` + RLS |
| 024 | `000024_migrar_portafolio_a_carpetas.sql` | Copia `portafolio` a `carpetas_galeria`/`archivos_galeria` |
| 025 | `000025_contactos_notas_y_campos.sql` | `notas_contacto` y campos nuevos de apoyo social |
| 026 | `000026_resenas_autor_estado_video.sql` | `resenas_clientes`: autor, `estado`, video; reemplaza `publicado` |
| 027 | `000027_storage_buckets.sql` | Buckets `galeria` y `logos` con políticas de Storage |
| 028 | `000028_privilegios_administradores_clientes.sql` | Corrige privilegios de `administradores` y `clientes` |
| 029 | `000029_horario_atencion_y_pago.sql` | Horario de atención configurable, `estado_pago` y UPDATE de reservas por el cliente |

Las migraciones **028 y 029 son correcciones "sobre" migraciones anteriores**: no se editó ningún
archivo ya creado; se agregó una migración que ajusta lo que estaba mal o faltaba.

---

## 3. Modelo de datos (18 tablas en `public`)

### Identidad y equipo
- **`administradores`** — equipo interno con acceso al panel. `id` = `auth.users.id`. Guarda
  `nombre_completo`, `correo`, `telefono`. La **contraseña no vive aquí** (ver §5). Alta y baja
  solo por administrador; cada quien edita su propio perfil.
- **`clientes`** — personas que reservan y reseñan. `id` = `auth.users.id`. Se crean solas al
  registrarse (trigger de 000013). El cliente edita su nombre y teléfono; el administrador puede
  corregir cualquier campo, incluido el correo.

### Catálogos del estudio
- **`servicios_estudio`** — servicios extra con `precio_por_hora` y `activo`.
- **`inventario_equipos`** — equipos rentables con `cantidad_total`, `precio_por_hora` y `activo`.
- **`configuracion_sitio`** — pares `(grupo, clave)` con `valor` de texto. Se usa para la tarifa
  del salón (`estudio / tarifa_hora`), el límite de pendientes
  (`estudio / max_pendientes_por_cliente`) y el horario de atención
  (`estudio / hora_apertura`, `estudio / hora_cierre`).

### Reserva del salón
- **`reservas`** — una reserva del salón (recurso único). Sin datos de usuario heredados: guarda
  `cliente_id`, `creado_por` y los datos del formulario (`nombre`, `correo`, `telefono`) congelados.
  Estados: `pendiente → confirmada / cancelada / completada`. Pago: `estado_pago` en
  `pendiente / comprobante_subido / pagado / rechazado` y `url_comprobante_pago`.
  **Sin traslape:** restricción de exclusión sobre `tstzrange` que ignora las canceladas, reforzada
  por el trigger `validar_reserva`.
- **`reserva_servicios`** / **`reserva_equipos`** — lo que se sumó a una reserva, con precio
  congelado y cantidad.
- **`fechas_bloqueadas`** — bloqueos del administrador; de día completo u horario puntual.

### Galería y contenido
- **`empresas`** — clientes/marcas con logo.
- **`carpetas_galeria`** — agrupan archivos por módulo (`portafolio`, `backstage`, `estudio`,
  `apoyo_social`); con `estado` `borrador`/`publicado` y `publicada_en` automático.
- **`archivos_galeria`** — fotos, videos o enlaces dentro de una carpeta (con orientación y orden).
- **`destacados`** — carpeta o empresa fijada en una posición del sitio.
- **`resenas_clientes`** — reseñas; una por reserva (cliente) y también creadas por admin. `estado`
  `pendiente / aprobada / rechazada`, con autor, empresa, carpeta y video opcionales.

### Captación
- **`leads_contacto`** — prospectos del formulario de contacto, con estado y notas.
- **`solicitudes_apoyo_social`** — solicitudes de fundaciones/bomberos, con estado, tipo de entidad
  y fecha del evento.
- **`notas_contacto`** — notas internas sobre un lead **o** una solicitud (nunca ambos).

---

## 4. Matriz de RLS (resumen)

| Tabla | `anon` (público) | Cliente (`authenticated`) | Administrador |
| --- | --- | --- | --- |
| `administradores` | — | lee y edita **solo su** perfil | lee todo; inserta y borra; edita el suyo |
| `clientes` | — | lee y edita **su** perfil (nombre/teléfono) | control total (corrige correo, teléfono, etc.) |
| `portafolio` (legado) | lectura si no es backstage | — | control total |
| `servicios_estudio` | lectura de activos | — | control total |
| `inventario_equipos` | lectura de activos | — | control total |
| `reservas` | — | lee **las suyas**; actualiza cancelar/comprobante | control total |
| `reserva_servicios` / `reserva_equipos` | — | lee lo de sus reservas | control total |
| `resenas_clientes` | lectura de **aprobadas** | lee las suyas; inserta en reservas completadas | control total |
| `leads_contacto` | — | — | control total |
| `solicitudes_apoyo_social` | — | — | control total |
| `notas_contacto` | — | — | control total |
| `configuracion_sitio` | lectura | lectura | control total |
| `fechas_bloqueadas` | — | — | control total |
| `empresas` | lectura de activas | — | control total |
| `carpetas_galeria` | lectura de publicadas | — | control total |
| `archivos_galeria` | lectura de carpetas publicadas | — | control total |
| `destacados` | lectura de destinos públicos | — | control total |

Notas:

- Los formularios públicos (`leads`, `apoyo social`) **no insertan desde el navegador**: lo hace el
  servidor con la service role, que no pasa por RLS.
- El cliente **no inserta** en `reservas` directamente: usa `solicitar_reserva()` para que el
  precio lo calcule el servidor.
- `configuracion_sitio` es de lectura pública (`using (true)`): no debe guardar secretos.

---

## 5. Autenticación y contraseñas

- La contraseña se guarda **cifrada en `auth.users.encrypted_password`**, una tabla a la que
  `anon` y `authenticated` **no tienen ningún privilegio**. El equipo no la ve ni la guarda en
  `administradores`/`clientes`.
- **Cambio de contraseña propio:** por el SDK de Supabase Auth (`updateUser`), que exige la sesión
  y valida la contraseña actual. Es el único camino soportado, y aplica igual a administradores y
  clientes.
- **Reset de otro usuario:** con el service role (`auth.admin.updateUserById`), solo desde el
  servidor. Nunca desde el navegador.
- **Correo de acceso:** se cambia desde Auth, no desde las tablas de perfil. Por eso el trigger de
  `000028` bloquea que un usuario autenticado edite `correo` en su propio perfil de administrador.
- No se pusieron triggers sobre `auth.users` para contraseñas: interferirían con los flujos de
  GoTrue (registro, recuperación, reautenticación).

---

## 6. Disparadores y funciones destacadas

- `set_actualizado_en()` — mantiene `actualizado_en` al actualizar (`configuracion_sitio`,
  `carpetas_galeria`).
- `set_publicada_en()` — fija o limpia `publicada_en` según el `estado` de la carpeta.
- `es_admin()` — ¿el usuario actual es administrador? Base de casi todas las políticas.
- `carpeta_publicada(uuid)` — ayuda para RLS de archivos y destacados.
- `handle_new_user()` — crea el registro en `clientes` al registrarse en Auth.
- `intervalos_bloqueados()` — convierte `fechas_bloqueadas` en intervalos concretos.
- `validar_reserva()` — rechaza reservas traslapadas o bloqueadas (solo pendiente/confirmada).
- `validar_horario_atencion()` — rechaza reservas fuera del horario configurado (000029).
- `limitar_pendientes_por_cliente()` — tope de solicitudes pendientes por cliente (000022).
- `administradores_guardar_perfil()` / `clientes_guardar_perfil()` — limitan qué columnas puede
  tocar cada perfil desde su cuenta (000028).
- `reservas_update_cliente()` — acota la edición del cliente sobre su reserva a cancelar o subir
  comprobante (000029).
- `solicitar_reserva(...)` — crea la reserva con precio calculado en el servidor.
- `horarios_ocupados(...)` — lo que el sitio público consulta para pintar el calendario; devuelve
  solo horarios y tipo (`RESERVA`/`BLOQUEO`), sin datos personales.

---

## 7. Storage

Dos buckets **públicos de lectura**, escritura solo de administradores:

- **`galeria`** — las rutas se guardan en `archivos_galeria.ruta_storage`.
- **`logos`** — la ruta se guarda en `empresas.logo_ruta`.

Las políticas de `storage.objects` replican `es_admin()` para insert/update/delete.

---

## 8. Cómo aplicar las migraciones

Ambiente local (para probar de cero):

```bash
supabase start
supabase db reset        # aplica 000001 → 000029 sobre una base limpia
```

Remoto (proyecto enlazado en la nube), **después de aprobar el PR a `develop`**:

```bash
supabase db push         # sube solo las migraciones nuevas
```

Reglas: nunca se edita una migración ya aplicada; los cambios destructivos van en su propio PR;
las políticas RLS y los buckets también se crean por migración.

---

## 9. Boltletos de tiempo y pendientes

- **Reservas migradas (000015/000022):** las previas a `000022` quedaron con `tarifa_hora_aplicada`
  en `null` y no se les puede deducir la tarifa real; las nuevas la guardan.
- **`portafolio` (legado):** la tabla no se borró en `000023/000024`. Cuando el frontend lea de
  `carpetas_galeria`, se elimina con una migración propia (`drop table portafolio;`).
- **Historial de estados:** todavía no existe una tabla de historial de cambios de estado de
  reservas y leads; llegará como migración cuando el panel lo necesite.
