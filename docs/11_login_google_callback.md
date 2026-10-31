# Inicio de sesión con Google y ruta de callback

Este documento explica cómo se completa el inicio de sesión con Google en el sitio público,
qué archivo lo resuelve y qué configuración exige Supabase.

## 1. Problema que corrige

El botón **Continuar con Google** de `/login` enviaba a Supabase un `redirectTo` apuntando a
`/auth/callback`, pero esa ruta no existía. Supabase devolvía el código OAuth y el sitio
respondía 404: la sesión nunca se creaba.

## 2. Flujo

1. En `/login`, `handleGoogleLogin` llama a `supabase.auth.signInWithOAuth` con:
   `redirectTo = ${origin}/auth/callback?next=<destino>`.
2. Google autentica y Supabase redirige a `/auth/callback?code=...&next=...`.
3. `frontend/src/app/auth/callback/route.ts` (Route Handler `GET`):
   - valida que `next` sea una ruta interna (`/...`, sin `//`);
   - crea un cliente `@supabase/ssr` con las cookies de la petición;
   - ejecuta `exchangeCodeForSession(code)`;
   - guarda las cookies de sesión en la respuesta y redirige a `next` (o `/resenas`).
4. Si falta el código o el intercambio falla, redirige a `/login?error=oauth` y el formulario
   muestra el aviso.

Las rutas permitidas para `next` salen de `normalizarDestino()` en `login/page.tsx`
(`/renta`, `/resenas` y `/`). El callback vuelve a validar que sea una ruta interna.

## 3. Archivos

| Archivo | Cambio |
| --- | --- |
| `frontend/src/app/auth/callback/route.ts` | Ruta nueva: intercambia el código OAuth por sesión. |
| `frontend/src/app/(site)/login/page.tsx` | `redirectTo` con `?next=`, aviso para `?error=oauth`. |

## 4. Configuración manual en Supabase

En **Authentication → Providers → Google**:

1. Habilitar el proveedor.
2. Cargar `Client ID` y `Client Secret` de Google Cloud.
3. En **Authentication → URL Configuration**, agregar a los redirect URLs:
   - `http://localhost:3000/auth/callback`
   - `https://<dominio-de-produccion>/auth/callback`

Sin ese registro, Supabase rechaza el retorno aunque la ruta exista.

## 5. Cómo probar

1. Abrir `/login` y pulsar **Continuar con Google**.
2. Elegir una cuenta.
3. Debe volver a `/resenas` (o al `next` de origen) con sesión iniciada.
4. Cancelar el consentimiento o provocar un error debe volver a `/login` con el aviso rojo.

## 6. Relación con las cuentas del panel

El callback sirve para el login público de **clientes**. Las cuentas del panel siguen
entrando por `/admin` con correo y contraseña; si una cuenta de `administradores` intenta
entrar por `/login`, se cierra su sesión y se le indica usar `/admin`.

> Pendiente conocido, fuera de este cambio: el enlace de recuperación del panel apunta a
> `/admin/reset-password`, que todavía no existe.
