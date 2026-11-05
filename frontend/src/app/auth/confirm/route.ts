import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_SESION_ADMIN } from "@/lib/auth-cookies";

export const dynamic = "force-dynamic";

const DESTINO_RECUPERACION = "/restablecer-contrasena";

function esAmbitoAdmin(params: URLSearchParams) {
  return params.get("ambito") === "admin";
}

function respuestaDeError(request: NextRequest, ambitoAdmin: boolean) {
  const url = new URL(`${DESTINO_RECUPERACION}?error=enlace`, request.nextUrl.origin);
  if (ambitoAdmin) url.searchParams.set("ambito", "admin");

  const respuesta = NextResponse.redirect(url);
  respuesta.headers.set("Cache-Control", "no-store");
  return respuesta;
}

/**
 * Confirma el enlace de recuperación de contraseña y deja la sesión lista.
 *
 * Admite los dos formatos que puede usar Supabase Auth:
 *
 * - `token_hash` + `type=recovery`: el recomendado, porque el token viaja en
 *   el enlace y funciona aunque el correo se abra en otro navegador.
 * - `code`: el flujo PKCE por defecto. Funciona si el enlace se abre en el
 *   mismo navegador donde se solicitó la recuperación.
 *
 * `ambito=admin` indica que la recuperación se pidió desde el panel. En ese
 * caso la sesión temporal se guarda en `qb-admin-auth-token` y no en la cookie
 * pública, para no mezclar ambas sesiones.
 *
 * Después de validar, redirige a la pantalla compartida de clientes y
 * administradores. No se permite ningún otro destino para evitar redirecciones
 * abiertas desde este endpoint.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const tokenHash = params.get("token_hash");
  const code = params.get("code");
  const tipo = params.get("type");
  const flujoPkce = params.get("sb_flow_id");
  const errorSupabase = params.get("error") || params.get("error_code");
  const ambitoAdmin = esAmbitoAdmin(params);

  if (errorSupabase || (!tokenHash && !code)) {
    return respuestaDeError(request, ambitoAdmin);
  }

  if (tipo && tipo !== "recovery") {
    return respuestaDeError(request, ambitoAdmin);
  }

  const urlDestino = new URL(
    `${DESTINO_RECUPERACION}?recuperacion=1`,
    request.nextUrl.origin,
  );
  if (ambitoAdmin) urlDestino.searchParams.set("ambito", "admin");

  const respuesta = NextResponse.redirect(urlDestino);
  respuesta.headers.set("Cache-Control", "no-store");

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
    {
      ...(ambitoAdmin ? { cookieOptions: { name: COOKIE_SESION_ADMIN } } : {}),
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            respuesta.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  if (tokenHash) {
    const { error } = await supabase.auth.verifyOtp({
      type: "recovery",
      token_hash: tokenHash,
    });

    if (error) {
      return respuestaDeError(request, ambitoAdmin);
    }

    return respuesta;
  }

  if (!code) {
    return respuestaDeError(request, ambitoAdmin);
  }

  const { error } = await supabase.auth.exchangeCodeForSession(
    code,
    flujoPkce ? { flowId: flujoPkce } : undefined,
  );

  if (error) {
    return respuestaDeError(request, ambitoAdmin);
  }

  return respuesta;
}
