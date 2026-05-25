import { PrismaAdapter } from '@auth/prisma-adapter';
import bcrypt from 'bcryptjs';
import NextAuth from 'next-auth';
import GitHub from 'next-auth/providers/github';
import Google from 'next-auth/providers/google';

import { prisma } from './prisma';
import { rateLimit, getRateLimitKey } from './rate-limit';
import { redis } from './redis';

// Nombre de la cookie de sesión, compartido entre auth y proxy/socket
// Debe coincidir con la cookie que establece NextAuth v5 beta
export const SESSION_COOKIE_NAME =
  process.env.NODE_ENV === 'production'
    ? '__Secure-next-auth.session-token'
    : 'next-auth.session-token';

// Configuración compatible con NextAuth 5 beta
export const authConfig = {
  // NextAuth v5 requires AUTH_SECRET (ignores NEXTAUTH_SECRET).
  // Explicit fallback so it works with either env var.
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  trustHost: true,
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt' as const,
    maxAge: 30 * 24 * 60 * 60, // 30 días
  },
  cookies: {
    sessionToken: {
      name: SESSION_COOKIE_NAME,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    callbackUrl: {
      name: process.env.NODE_ENV === 'production' ? '__Secure-next-auth.callback-url' : 'next-auth.callback-url',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    csrfToken: {
      name: process.env.NODE_ENV === 'production' ? '__Secure-next-auth.csrf-token' : 'next-auth.csrf-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
    newUser: '/profile',
  },
  providers: [
    // OAuth providers are only added when their credentials are configured.
    // This prevents NextAuth "Configuration" errors when env vars are missing
    // (e.g., on Vercel where .env.local is not deployed).
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [Google({
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        })]
      : []),
    ...(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
      ? [GitHub({
          clientId: process.env.GITHUB_CLIENT_ID,
          clientSecret: process.env.GITHUB_CLIENT_SECRET,
        })]
      : []),
    {
      id: 'credentials',
      name: 'credentials',
      type: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials: Record<string, string> | undefined) {
        try {
          if (!credentials?.email || !credentials?.password) {
            return null;
          }

          const email = credentials.email.toLowerCase();
          const limiterKey = getRateLimitKey('login', email);

          const { allowed } = await rateLimit(limiterKey, 5, 300);

          if (!allowed) {
            console.warn(`[RateLimit] Login exceeded for ${email}`);
            return null;
          }

          const user = await prisma.user.findUnique({
            where: { email },
          });

          if (!user || !user.passwordHash) {
            return null;
          }

          const isValid = await bcrypt.compare(
            credentials.password,
            user.passwordHash
          );

          if (!isValid) {
            return null;
          }

          return {
            id: user.id,
            email: user.email,
            name: user.displayName || user.username,
            image: user.avatarUrl,
            xpPoints: user.xpPoints,
            level: user.level,
            role: user.role,
          };
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      },
    },
  ],
  callbacks: {
    async signIn({ user, account, profile }: { user?: { id?: string; email?: string; name?: string; image?: string; xpPoints?: number; level?: number; role?: string }; account?: { provider?: string; type?: string }; profile?: { avatar_url?: string } }) {
      if (account?.provider === 'google' || account?.provider === 'github') {
        if (!user?.email) return true;
        try {
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email },
          });

          if (!existingUser) {
            const username =
              user.name?.replace(/\s+/g, '').toLowerCase() ||
              user.email.split('@')[0];

            const existingUsername = await prisma.user.findUnique({
              where: { username },
            });

            const finalUsername = existingUsername
              ? `${username}_${Date.now()}`
              : username;

            let avatarUrl = user.image;
            if (!avatarUrl && account.provider === 'github' && profile) {
              avatarUrl = profile.avatar_url;
            }

            const newUser = await prisma.user.create({
              data: {
                email: user.email,
                username: finalUsername,
                displayName: user.name || finalUsername,
                avatarUrl: avatarUrl,
                role: 'USER',
                xpPoints: 0,
                level: 1,
                auraBalance: 50,
                passwordHash: null,
              },
            });

            user.id = newUser.id;
            user.xpPoints = newUser.xpPoints ?? undefined;
            user.level = newUser.level ?? undefined;
            user.role = newUser.role ?? undefined;
          } else {
            user.id = existingUser.id;
            user.xpPoints = existingUser.xpPoints;
            user.level = existingUser.level;
            user.role = existingUser.role;

            if (!existingUser.avatarUrl && user.image) {
              await prisma.user.update({
                where: { id: existingUser.id },
                data: { avatarUrl: user.image },
              });
            }

            const providerAccountId = (account as Record<string, string | undefined>)?.providerAccountId;
            if (providerAccountId) {
              const existingAccount = await prisma.account.findUnique({
                where: {
                  provider_providerAccountId: {
                    provider: account.provider,
                    providerAccountId,
                  },
                },
              });
              if (!existingAccount) {
                await prisma.account.create({
                  data: {
                    userId: existingUser.id,
                    type: account.type || 'oauth',
                    provider: account.provider || 'unknown',
                    providerAccountId,
                  },
                });
              }
            }
          }
        } catch (error) {
          console.error('OAuth signIn error:', error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, account, trigger, session: updateData }: { token: Record<string, unknown>; user?: { id: string; xpPoints?: number; level?: number; role?: string }; account?: { provider?: string }; trigger?: string; session?: { twoFactorEnabled?: boolean } }) {
      // ── Initial sign-in: populate token ──────────────────────────
      if (user) {
        token.id = user.id as string;
        token.xpPoints = (user.xpPoints as number) || 0;
        token.level = (user.level as number) || 1;
        token.role = (user.role as string) || 'USER';

        // Check 2FA status from DB so we can set twoFactorPending
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { twoFactorEnabled: true },
          });
          token.twoFactorEnabled = dbUser?.twoFactorEnabled ?? false;
          if (token.twoFactorEnabled) {
            token.twoFactorPending = true;
          }
        } catch {
          token.twoFactorEnabled = false;
        }
      }

      // ── OAuth refresh: sync DB fields ────────────────────────────
      if (account && (account.provider === 'google' || account.provider === 'github')) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email as string },
          select: {
            id: true,
            xpPoints: true,
            level: true,
            role: true,
            twoFactorEnabled: true,
          },
        });

        if (dbUser) {
          token.id = dbUser.id;
          token.xpPoints = dbUser.xpPoints;
          token.level = dbUser.level;
          token.role = dbUser.role;
          token.twoFactorEnabled = dbUser.twoFactorEnabled;
        }
      }

      // ── Session update (e.g. after enabling/disabling 2FA) ───────
      if (trigger === 'update' && updateData) {
        if (typeof updateData.twoFactorEnabled === 'boolean') {
          token.twoFactorEnabled = updateData.twoFactorEnabled;
        }
      }

      // ── Login 2FA: check if user confirmed via Redis ─────────────
      if (token.twoFactorPending && token.id) {
        try {
          const confirmed = await redis.get(`2fa:confirmed:${token.id}`);
          if (confirmed === 'true') {
            token.twoFactorPending = false;
            await redis.del(`2fa:confirmed:${token.id}`);
          }
        } catch {
          // Redis unavailable – keep pending state
        }
      }

      return token;
    },
    async session({ session, token }: { session: { user?: Record<string, unknown> }; token: Record<string, unknown> }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.xpPoints = token.xpPoints as number;
        session.user.level = token.level as number;
        session.user.role = token.role as string;
        session.user.twoFactorEnabled = token.twoFactorEnabled as boolean;
        session.user.twoFactorPending = token.twoFactorPending as boolean | undefined;
      }
      return session;
    },
  } as Record<string, unknown>,
  events: {
    async signIn({
      user: _user,
      account: _account,
    }: {
      user?: { id?: string; email?: string; name?: string } | null;
      account?: { provider?: string; type?: string } | null;
    }) {
      // Sign-in event logged
    },
  },
  debug: process.env.NODE_ENV === 'development',
} as const;

// Export for NextAuth 5 beta
export const { handlers, auth, signIn, signOut } = NextAuth(authConfig as any);
export default authConfig;
