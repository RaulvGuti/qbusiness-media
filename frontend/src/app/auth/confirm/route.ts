import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export const dynamic = "force-dynamic";

const DESTINO_RECUPERACION = "/restablecer-password";

function respuestaDeError(request: NextRequest) {
  const respuesta = NextResponse.redirect(
    new URL(`${DESTINO_RECUPERACION}?error=enlace`, request.nextUrl.origin),
  );
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

  if (errorSupabase || (!tokenHash && !code)) {
    return respuestaDeError(request);
  }

  if (tipo && tipo !== "recovery") {
    return respuestaDeError(request);
  }

  const respuesta = NextResponse.redirect(
    new URL(`${DESTINO_RECUPERACION}?recuperacion=1`, request.nextUrl.origin),
  );
  respuesta.headers.set("Cache-Control", "no-store");

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
    {
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
      return respuestaDeError(request);
    }

    return respuesta;
  }

  if (!code) {
    return respuestaDeError(request);
  }

  const { error } = await supabase.auth.exchangeCodeForSession(
    code,
    flujoPkce ? { flowId: flujoPkce } : undefined,
  );

  if (error) {
    return respuestaDeError(request);
  }

  return respuesta;
}
