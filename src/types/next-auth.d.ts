import NextAuth from 'next-auth';

declare module 'next-auth' {
  interface User {
    id: string;
    role: string;
    xpPoints: number;
    level: number;
    email: string;
    name?: string | null;
    image?: string | null;
  }

  interface Session {
    user: User;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: string;
    xpPoints: number;
    level: number;
  }
}
