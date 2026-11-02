# Recuperación de contraseña

Este documento explica cómo se recupera la contraseña de una cuenta de cliente o de una
cuenta del panel, qué archivos intervienen y qué configuración manual exige Supabase Auth.

## 1. Problema que corrige

Antes de este cambio, los dos botones de **¿Recuperar contraseña?** enviaban el correo, pero
el enlace no llevaba a ninguna pantalla útil:

- `/login` recibía el enlace y mostraba otra vez el formulario de inicio de sesión. No había
  campos para la contraseña nueva ni una llamada a `updateUser`.
- `/admin` enviaba a `/admin/reset-password`, una ruta que no existía. Además, el proxy
  redirige cualquier `/admin/*` sin sesión a `/admin` y borra los parámetros de la URL, así
  que tampoco bastaba con crear la página dentro del panel.

La recuperación ahora usa una sola pantalla pública, fuera de `/admin`, y una ruta de
confirmación que crea la sesión antes de mostrar el formulario.

## 2. Flujo

1. En `/login` o en `/admin`, el usuario escribe su correo y pulsa **¿Recuperar contraseña?**.
2. El navegador llama a `supabase.auth.resetPasswordForEmail(email, { redirectTo })` con:
   `redirectTo = ${origin}/auth/confirm`.
3. Supabase envía el correo de recuperación. Según la plantilla configurada, el enlace llega
   de una de estas dos formas:
   - **Recomendada:** `/auth/confirm?token_hash=...&type=recovery`.
   - **Por defecto (PKCE):** Supabase valida el enlace y redirige a
     `/auth/confirm?code=...`.
4. `frontend/src/app/auth/confirm/route.ts` valida el enlace:
   - con `token_hash` llama a `verifyOtp({ type: "recovery", token_hash })`;
   - con `code` llama a `exchangeCodeForSession(code, { flowId })` cuando el enlace trae
     `sb_flow_id`;
   - guarda las cookies de sesión en la respuesta;
   - redirige a `/restablecer-password?recuperacion=1`.
5. `frontend/src/app/restablecer-password/page.tsx` comprueba que exista una sesión válida y
   consulta si la cuenta está en `administradores`.
6. El formulario pide la contraseña nueva y su confirmación, exige un mínimo de 8 caracteres
   y llama a `supabase.auth.updateUser({ password })`.
7. Al terminar, cierra todas las sesiones con `signOut({ scope: "global" })` y muestra el
   acceso correcto:
   - administradores: enlace a `/admin`;
   - clientes: enlace a `/login`.

La pantalla nunca muestra el enlace a `/admin` a una cuenta que no esté en
`administradores`.

## 3. Archivos

| Archivo | Cambio |
| --- | --- |
| `frontend/src/app/auth/confirm/route.ts` | Ruta nueva: confirma `token_hash` o `code`, crea la sesión y redirige a la pantalla compartida. |
| `frontend/src/app/restablecer-password/page.tsx` | Pantalla pública nueva: valida la sesión y el rol, y muestra el aviso o el formulario. |
| `frontend/src/app/restablecer-password/FormularioRestablecer.tsx` | Formulario de contraseña nueva, confirmación, `updateUser` y cierre de sesiones. |
| `frontend/src/app/(site)/login/page.tsx` | El enlace de recuperación apunta a `/auth/confirm`. |
| `frontend/src/app/admin/page.tsx` | El enlace de recuperación apunta a `/auth/confirm`. |
| `frontend/src/server/actions/auth.ts` | `recoverPasswordAction` también apunta a `/auth/confirm`. |

No hay migración de base de datos. La contraseña sigue viviendo cifrada en
`auth.users.encrypted_password` y se cambia con `updateUser`, que exige una sesión válida.

## 4. Configuración manual en Supabase

### 4.1 Site URL y redirect URLs

En **Authentication → URL Configuration**:

- **Site URL:** el dominio real del sitio, por ejemplo `https://qbusinessmedia.com`.
- **Redirect URLs:** agregar la ruta de confirmación para cada ambiente:
  - `http://localhost:3000/auth/confirm**`
  - `http://127.0.0.1:3000/auth/confirm**` (si se usa ese host en local)
  - `https://<dominio-de-produccion>/auth/confirm**`

El doble asterisco cubre el parámetro `sb_flow_id` que el SDK agrega al `redirectTo`
cuando usa PKCE. Si la consola no acepta comodines, también sirve la ruta exacta
`/auth/confirm`; en ese caso conviene usar la plantilla con `token_hash`, que no depende
del `redirectTo`.

Sin esa autorización, Supabase puede ignorar el `redirectTo` y mandar el enlace al Site URL,
con lo que se pierde la confirmación.

### 4.2 SMTP

Los correos de recuperación los envía **Supabase Auth**, no la librería `resend` del sitio.
El `RESEND_API_KEY` de la aplicación no configura automáticamente esos correos.

En **Authentication → Emails → SMTP Settings** hay que cargar un servidor propio (por
ejemplo, las credenciales SMTP de Resend) y verificar el remitente. El servicio de correo
incluido por defecto tiene límites y no se recomienda para producción.

### 4.3 Plantilla del correo

La forma más confiable es cambiar el enlace de **Reset Password** para que use `token_hash`:

```html
<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery">
  Restablecer contraseña
</a>
```

Con `token_hash` el enlace funciona aunque el correo se abra en otro navegador o en otro
dispositivo. Se usa `{{ .SiteURL }}` a propósito: el `redirectTo` de PKCE puede llevar
`sb_flow_id`, y no queremos arrastrarlo al enlace directo. Por eso el Site URL debe ser el
dominio correcto.

Si se deja la plantilla por defecto (`{{ .ConfirmationURL }}`), el flujo por `code` sigue
funcionando, pero el enlace debe abrirse en el mismo navegador donde se solicitó la
recuperación, porque PKCE guarda un verificador en ese navegador. Si se abre en otro equipo,
la pantalla muestra **Enlace no válido**.

### 4.4 Mínimo de contraseña

El formulario exige 8 caracteres, pero esa regla vive en el cliente. Si se quiere impedir
también por API, configurar el mínimo de 8 en **Authentication → Providers → Email** (o en
la política de contraseñas del proyecto).

## 5. Seguridad

- La pantalla es pública porque el enlace llega por correo, pero `updateUser` solo cambia la
  contraseña de la cuenta autenticada; no permite tocar otra cuenta.
- La consulta a `administradores` usa el cliente normal con la clave `anon`; RLS solo deja
  ver la fila propia.
- No se usa `service_role` ni se expone ninguna llave privada.
- Después del cambio se cierran las sesiones abiertas. Si el cierre global falla por red, la
  contraseña ya quedó guardada y el siguiente inicio de sesión la valida.
- El endpoint `/auth/confirm` solo redirige a `/restablecer-password`; no acepta un destino
  arbitrario, así que no se puede usar como redirección abierta.

## 6. Cómo probar

1. Configurar SMTP y las redirect URLs en Supabase.
2. Pedir recuperación desde `/login` con una cuenta de cliente.
3. Abrir el enlace en el mismo navegador; si se configuró `token_hash`, probar también en
   otro navegador o dispositivo.
4. Confirmar que la contraseña anterior ya no funciona y que la nueva sí.
5. Repetir desde `/admin` con una cuenta de `administradores` y comprobar que, al terminar,
   el botón de acceso lleva a `/admin` y no a `/login`.
6. Probar un enlace vencido, uno ya usado y uno manipulado: deben mostrar **Enlace no válido**.
7. Probar una contraseña de menos de 8 caracteres y una confirmación distinta.
8. Ejecutar `npm run check` dentro de `frontend/`.

## 7. Diagnóstico rápido

| Síntoma | Causa probable |
| --- | --- |
| No llega el correo | SMTP de Supabase sin configurar, remitente sin verificar o límite de envíos. |
| El enlace vuelve al inicio o a `/login` | Site URL o redirect URL mal configurada en Supabase. |
| “Enlace no válido” al abrirlo en otro equipo | Plantilla por defecto con PKCE; cambiar el correo a `token_hash`. |
| El enlace expiró | El token ya se usó o pasó el tiempo de validez; pedir uno nuevo. |
| La cuenta administrativa termina en `/login` | La consulta a `administradores` no encontró la fila o la cuenta no es del panel. |
