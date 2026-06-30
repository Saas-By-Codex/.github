import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { loginSchema } from "@/lib/validation";

/**
 * Auth.js configuration. Credentials provider is used for the self-contained
 * MVP; OAuth providers (Google, etc.) can be added to `providers` later without
 * touching the rest of the app. JWT sessions keep the app stateless on Vercel.
 */
export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  // Required on Vercel/proxied hosts so Auth.js trusts the forwarded host
  // header instead of throwing UntrustedHost.
  trustHost: true,
  // Prefer the env secret; fall back to a clearly-insecure dev value so a
  // zero-config deploy still boots. OVERRIDE `AUTH_SECRET` in production.
  secret: process.env.AUTH_SECRET ?? "evfleetiq-insecure-dev-secret-change-me",
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(raw) {
        const parsed = loginSchema.safeParse(raw);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user?.passwordHash) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return { id: user.id, email: user.email, name: user.name ?? undefined };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});
