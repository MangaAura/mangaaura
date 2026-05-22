declare module '@auth/core/types' {
  interface User {
    role: string;
    xpPoints: number;
    level: number;
    twoFactorEnabled?: boolean;
    twoFactorPending?: boolean;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: string;
    xpPoints: number;
    level: number;
    twoFactorPending?: boolean;
  }
}
