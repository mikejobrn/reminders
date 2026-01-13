import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

// Rotas públicas que não requerem autenticação
const publicRoutes = ["/login", "/register", "/api/auth"];

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Permitir acesso a arquivos estáticos e assets
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/fonts") ||
    pathname.startsWith("/icons") ||
    pathname.startsWith("/manifest.json") ||
    pathname.startsWith("/sw.js") ||
    pathname.startsWith("/workbox-")
  ) {
    return NextResponse.next();
  }

  // Verificar se é uma rota pública
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Obter token de autenticação
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // Se não estiver autenticado, redirecionar para login
  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Se estiver autenticado e tentar acessar login/register, redirecionar para /lists
  if (token && (pathname === "/login" || pathname === "/register")) {
    return NextResponse.redirect(new URL("/lists", request.url));
  }

  return NextResponse.next();
}

// Rotas que o Proxy NÃO deve executar
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
