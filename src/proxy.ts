import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";

// AU-004: todas las rutas exigen sesión excepto /login, /setup, /p/*,
// /api/health, /api/cron/* (con secreto), /api/v1/* (con token) y /api/auth/*.
const PUBLIC_PATHS = new Set(["/login", "/setup", "/p"]);
const PUBLIC_PREFIXES = [
  "/login/", // paso de verificación 2FA (/login/2fa)
  "/p/",
  "/api/health",
  "/api/cron",
  "/api/v1",
  "/api/auth",
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublic =
    PUBLIC_PATHS.has(pathname) || PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  if (isPublic) {
    return NextResponse.next();
  }

  // Comprobación optimista por cookie (sin consultar la BD). La verificación
  // real de sesión se hace además en cada Server Action y Route Handler (8.2).
  const sessionCookie = getSessionCookie(request);
  if (!sessionCookie) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Excluye assets de Next y cualquier archivo con extensión (sw.js, iconos, etc.).
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
