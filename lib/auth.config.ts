import type { NextAuthConfig } from "next-auth";

export const authConfig = {
    trustHost: true,
    session: { strategy: "jwt" },
    pages: {
        signIn: "/login",
        newUser: "/register",
    },
    providers: [], // Providers serão configurados em auth.ts para evitar conflitos no Edge
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isOnLogin = nextUrl.pathname.startsWith("/login");
            const isOnRegister = nextUrl.pathname.startsWith("/register");
            const isPublicRoute = nextUrl.pathname.startsWith("/api/auth") || isOnLogin || isOnRegister || nextUrl.pathname.startsWith("/manifest.json") || nextUrl.pathname.startsWith("/sw.js") || nextUrl.pathname.startsWith("/workbox-");

            // Se está logado e tenta acessar login/register, redireciona para listas
            if (isLoggedIn && (isOnLogin || isOnRegister)) {
                return Response.redirect(new URL("/lists", nextUrl));
            }

            // Se é rota publica, permite
            if (isPublicRoute) return true;

            // Se não está logado e não é publica, nega (NextAuth redireciona para login)
            // Nota: Retornar false redireciona automaticamente para a página de login configurada
            if (!isLoggedIn) return false;

            return true;
        },
        async redirect({ url, baseUrl }) {
            console.log("[AUTH] Redirect callback", { url, baseUrl });

            // Se a URL é relativa, retorna ela
            if (url.startsWith("/")) return `${baseUrl}${url}`;

            // Se a URL começa com baseUrl, retorna ela
            if (url.startsWith(baseUrl)) return url;

            // Caso contrário, retorna baseUrl
            return baseUrl;
        },
        async jwt({ token, user }) {
            console.log("[AUTH] JWT callback", { hasUser: !!user, tokenId: token.id });
            if (user) {
                token.id = user.id;
            }
            return token;
        },
        async session({ session, token }) {
            console.log("[AUTH] Session callback", { tokenId: token.id });
            if (session.user) {
                session.user.id = token.id as string;
            }
            return session;
        },
    },
} satisfies NextAuthConfig;
