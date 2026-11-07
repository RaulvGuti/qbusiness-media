import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export const dynamic = "force-dynamic";

const DESTINO_POR_DEFECTO = "/resenas";

function destinoSeguro(nextParam: string | null): string {
  if (!nextParam || !nextParam.startsWith("/") || nextParam.startsWith("//")) {
    return DESTINO_POR_DEFECTO;
  }
  return nextParam;
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const destino = destinoSeguro(request.nextUrl.searchParams.get("next"));
  const origen = request.nextUrl.origin;

  if (!code) {
    return NextResponse.redirect(`${origen}/login?error=oauth`);
  }

  const respuesta = NextResponse.redirect(`${origen}${destino}`);

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

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${origen}/login?error=oauth`);
  }

  return respuesta;
}
