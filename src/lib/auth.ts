import { PrismaAdapter } from '@auth/prisma-adapter';
import bcrypt from 'bcryptjs';
import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import GitHub from 'next-auth/providers/github';
import { prisma } from './prisma';

// Configuración compatible con NextAuth 5 beta
export const authConfig = {
  adapter: PrismaAdapter(prisma) as any,
  session: {
    strategy: 'jwt' as const,
    maxAge: 30 * 24 * 60 * 60, // 30 días
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
    newUser: '/profile',
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHub({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
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

          const user = await prisma.user.findUnique({
            where: { email: credentials.email.toLowerCase() },
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
    async signIn({ user, account, profile }: { user: any; account: any; profile?: any }) {
      // Manejar usuarios OAuth
      if (account?.provider === 'google' || account?.provider === 'github') {
        try {
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email! },
          });

          if (!existingUser) {
            // Crear nuevo usuario OAuth
            const username =
              user.name?.replace(/\s+/g, '').toLowerCase() ||
              user.email!.split('@')[0];

            // Verificar si el username ya existe
            const existingUsername = await prisma.user.findUnique({
              where: { username },
            });

            const finalUsername = existingUsername
              ? `${username}_${Date.now()}`
              : username;

            // Obtener avatar del proveedor OAuth
            let avatarUrl = user.image;
            if (!avatarUrl && account.provider === 'github' && profile) {
              avatarUrl = (profile as any).avatar_url;
            }

            const newUser = await prisma.user.create({
              data: {
                email: user.email!,
                username: finalUsername,
                displayName: user.name || finalUsername,
                avatarUrl: avatarUrl,
                role: 'USER',
                xpPoints: 0,
                level: 1,
                inkcoinsBalance: 50, // 50 InkCoins de regalo por OAuth
                passwordHash: null, // OAuth users no tienen password
              },
            });

            // Asignar el ID del usuario creado
            user.id = newUser.id;
            user.xpPoints = newUser.xpPoints;
            user.level = newUser.level;
            user.role = newUser.role;
          } else {
            // Usuario existe, cargar datos
            user.id = existingUser.id;
            user.xpPoints = existingUser.xpPoints;
            user.level = existingUser.level;
            user.role = existingUser.role;

            // Actualizar avatar si no tiene uno
            if (!existingUser.avatarUrl && user.image) {
              await prisma.user.update({
                where: { id: existingUser.id },
                data: { avatarUrl: user.image },
              });
            }
          }
        } catch (error) {
          console.error('OAuth signIn error:', error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, account }: { token: any; user: any; account: any }) {
      if (user) {
        token.id = user.id;
        token.xpPoints = user.xpPoints || 0;
        token.level = user.level || 1;
        token.role = user.role || 'USER';
      }

      // Si es un login OAuth reciente, refrescar datos desde DB
      if (account && (account.provider === 'google' || account.provider === 'github')) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email! },
          select: {
            id: true,
            xpPoints: true,
            level: true,
            role: true,
          },
        });

        if (dbUser) {
          token.id = dbUser.id;
          token.xpPoints = dbUser.xpPoints;
          token.level = dbUser.level;
          token.role = dbUser.role;
        }
      }

      return token;
    },
    async session({ session, token }: { session: any; token: any }) {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.xpPoints = token.xpPoints;
        session.user.level = token.level;
        session.user.role = token.role;
      }
      return session;
    },
  },
  events: {
    async signIn({ user, account }: { user: any; account: any }) {
      console.log(`[Auth] User ${user.email} signed in via ${account?.provider || 'credentials'}`);
    },
  },
  debug: process.env.NODE_ENV === 'development',
};

// Export for NextAuth 5 beta
export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
export default authConfig;
