# Roles y permisos del panel administrativo

Este documento explica cómo se separan las cuentas del equipo interno en dos roles, qué
puede hacer cada uno y dónde se aplica esa separación: base de datos, servidor de Next.js
y menú del panel.

## 1. Los dos roles

La columna `administradores.rol` (migración `000038`) acepta dos valores:

| Rol | Para quién | Alcance |
| --- | --- | --- |
| `admin_principal` | Dirección / responsable del sitio | Acceso total: operación, galería, textos y configuración, destacados, tarifas, equipo y cuentas. |
| `secretaria` | Apoyo administrativo | Operación del día a día: contactos, apoyo social, reseñas y reservas. Sin contenido, tarifas, configuración ni cuentas. |

Reglas de asignación:

- Las cuentas que ya existían al aplicar `000038` quedaron como `admin_principal` para no
  quitarle acceso a nadie.
- Las cuentas nuevas nacen como `secretaria` (mínimo privilegio) salvo que el formulario
  indique `admin_principal`.
- Debe existir **al menos un** `admin_principal`: la base de datos impide degradar o quitar
  al último.
- Una persona no puede quitarse su propio acceso al panel.
- El único punto de entrada para las cuentas administrativas es `/admin`. El login público
  `/login` es solo para clientes: si una cuenta de `administradores` intenta iniciar sesión
  allí, se cierra su sesión y solo se muestra un aviso de que no hay acceso administrativo
  desde el login de usuarios, sin revelar la ruta del panel.

## 2. Matriz de permisos

| Módulo | `admin_principal` | `secretaria` |
| --- | --- | --- |
| Dashboard | Sí | Sí |
| Contactos (leads) | Sí | Sí |
| Apoyo social | Sí | Sí |
| Reseñas (moderación) | Sí | Sí |
| Reservas del estudio y bloqueos | Sí | Sí |
| Perfil propio | Sí | Sí |
| Galería (empresas, carpetas, archivos) | Sí | No |
| Destacados del inicio | Sí | No |
| Textos y configuración del sitio | Sí | No |
| Tarifas de servicios y equipos | Sí | No |
| Gestión de cuentas del equipo | Sí | No |
| Buckets `galeria` y `logos` (escritura) | Sí | No |

La matriz vive en un solo archivo del frontend: `frontend/src/lib/permisos.ts`. El menú, los
accesos rápidos del dashboard y los guards de página leen de ahí.

## 3. Qué hace la migración `000038`

Archivo: `supabase/migrations/000038_roles_y_permisos_administrativos.sql`.

1. **Columna de rol** en `administradores`, con `CHECK` y valor por defecto `secretaria`.
2. **Funciones de apoyo**:
   - `es_staff()`: la persona pertenece al equipo.
   - `rol_actual()`: devuelve `admin_principal` o `secretaria`.
   - `es_admin_principal()`: la persona es administradora principal.
   - `es_admin()` conserva su significado histórico (“es del equipo”) para no romper las
     políticas y funciones anteriores.
3. **RLS por rol**:
   - `administradores`: cada quien ve su fila; solo el principal ve al resto y puede dar de
     alta o de baja cuentas.
   - `portafolio`, `servicios_estudio`, `inventario_equipos`, `configuracion_sitio`,
     `empresas`, `carpetas_galeria`, `archivos_galeria` y `destacados`: escritura solo del
     principal.
   - Contactos, apoyo social, reseñas, reservas, servicios de una reserva y bloqueos del
     calendario siguen disponibles para todo el equipo.
   - Storage: lectura pública de `galeria` y `logos`; escritura solo del principal.
4. **Trigger `exigir_admin_principal()`** en las tablas de galería. Las RPC de galería
   (`crear_carpeta_galeria`, `agregar_archivo_galeria`, `reordenar_archivos`,
   `eliminar_archivo_galeria`, `guardar_destacados`, `definir_portada`, etc.) son
   `security definer` y saltan RLS; este trigger vuelve a comprobar el rol antes de escribir.
   La consola SQL y el service role (`auth.uid()` nulo) no se limitan.
5. **Trigger de perfil**: `administradores_guardar_perfil` ahora también bloquea cualquier
   cambio de `rol` que no venga de un administrador principal. Así una secretaria no puede
   ascenderse sola editando su fila.
6. **RPC de gestión**:
   - `crear_administrador(correo, rol default 'secretaria')`: da acceso a una cuenta que ya
     existe en Supabase Auth. La firma anterior de un solo argumento se elimina para evitar
     ambigüedad.
   - `cambiar_rol_administrador(id, rol)`: cambia el rol y protege al último principal.
   - `quitar_administrador(id)`: quita el acceso al panel sin borrar la cuenta de Auth ni la
     ficha de `clientes`.

## 4. Cómo aplicar la migración

1. Aprobado el PR a `develop`, aplicar `000038` en el proyecto de Supabase **como
   migración** (nunca desde el editor de tablas).
2. Verificar que exista al menos una cuenta con `rol = 'admin_principal'`.
3. Si hace falta crear el primer principal a mano (consola SQL):

   ```sql
   insert into public.administradores (id, nombre_completo, correo, rol)
   select
     id,
     coalesce(nullif(raw_user_meta_data->>'nombre_completo', ''), split_part(email, '@', 1)),
     email,
     'admin_principal'
   from auth.users
   where lower(email) = 'admin@tucorreo.com';
   ```

4. Para dar acceso a una cuenta que ya existe en **Authentication > Users**:

   ```sql
   select public.crear_administrador('secretaria@tucorreo.com', 'secretaria');
   ```

## 5. Cómo se aplica en Next.js

- **`frontend/src/lib/permisos.ts`**: etiquetas, matriz y secciones del menú.
- **`frontend/src/server/auth/require-admin.ts`**: valida sesión de Supabase y fila en
  `administradores`, y devuelve el perfil con su rol. `requireAdminPrincipal()` añade la
  exigencia de rol.
- **`frontend/src/server/auth/panel.ts`**: guards de render. `exigirStaffPanel()` manda al
  login si no hay sesión; `exigirAdminPrincipalPanel()` manda al dashboard con aviso si el
  rol no alcanza.
- **`frontend/src/app/admin/(panel)/layout.tsx`**: valida sesión y equipo antes de renderizar
  cualquier pantalla del panel.
- **Páginas exclusivas** (`galeria`, `textos`, `destacados`): llaman a
  `exigirAdminPrincipalPanel()` antes de consultar datos.
- **`AdminHeader`**: filtra el menú según el rol, muestra el nombre y la etiqueta del rol, y
  cierra la sesión con un Server Action real.
- **Perfil** (`/admin/perfil`): lee la fila real del usuario conectado. El principal ve además
  el equipo, puede crear cuentas, cambiar roles y quitar accesos; la secretaria ve su cuenta,
  su rol y el resumen de lo que puede hacer.
- **`frontend/src/app/(site)/login/page.tsx`**: login público solo para clientes. Después de
  autenticar, comprueba si la cuenta está en `administradores`; si lo está, cierra la sesión
  local y solo muestra el aviso de que no hay acceso administrativo desde ese login.
- **`frontend/src/proxy.ts`**: si no hay sesión válida, redirige `/admin/*` a `/admin` antes de
  renderizar. No decide permisos: eso queda en el layout y en cada página, que sí consultan
  la base de datos.
- **`frontend/src/server/services/admin-seguimiento.ts`**: dejó de usar el service role sin
  sesión. Ahora exige personal autenticado y consulta con la sesión del usuario, de modo que
  la RLS también aplica. Ya no devuelve datos ficticios cuando falla la base de datos.

## 6. Qué revisar al probar

1. Con una cuenta `secretaria`:
   - El menú no muestra Galería, Textos ni Destacados.
   - Entrar directo a `/admin/galeria`, `/admin/textos` o `/admin/destacados` redirige al
     dashboard con el aviso de permiso.
   - `/admin/perfil` muestra “Secretaría” y no muestra la gestión de equipo.
   - Puede cambiar el estado de un contacto y moderar una reseña.
   - No puede escribir en la galería ni en `configuracion_sitio` (RLS y trigger lo impiden).
2. Con una cuenta `admin_principal`:
   - Ve el equipo, crea una cuenta nueva con rol Secretaría y recibe el mensaje de éxito.
   - Puede cambiar el rol de otra cuenta.
   - No puede quitarse su propio acceso ni dejar el sistema sin principal.
   - Si intenta entrar por `/login`, se cierra su sesión y solo ve el aviso de que no hay
     acceso administrativo desde el login de usuarios.
3. Un cliente entra por `/login` y llega a `/resenas`.
4. Sin sesión:
   - `/admin/dashboard` redirige a `/admin`.
   - Los endpoints `GET /api/api/contactos` y `GET/PATCH /api/api/solicitudes-apoyo`
     responden `401` en lugar de devolver datos de prueba.
5. Cerrar sesión desde el botón del header vuelve a `/admin` y ya no permite entrar al panel.

## 7. Reglas para el futuro

- Cualquier módulo nuevo debe declarar su permiso en `permisos.ts` y su política RLS en una
  migración nueva.
- No cambiar roles desde el panel de Supabase a mano: usar la vista de perfil o las RPC.
- No usar el cliente `service_role` para leer datos del panel: la sesión del usuario ya
  alcanza y la RLS debe aplicar.
- Si se agrega un RPC `security definer` que escriba en tablas exclusivas del principal,
  agregar el trigger `exigir_admin_principal()` o validar el rol dentro de la función.
