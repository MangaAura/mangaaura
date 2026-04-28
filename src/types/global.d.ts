// Global type declarations to fix TypeScript errors

declare module 'web-push' {
  export function setVapidDetails(
    subject: string,
    publicKey: string,
    privateKey: string
  ): void;

  export function sendNotification(
    pushSubscription: unknown,
    payload: string
  ): Promise<unknown>;
}

// Extend ZodError
declare module 'zod' {
  interface ZodError<T = unknown> {
    errors: Array<{
      message: string;
      path: (string | number)[];
    }>;
  }
}

// Extend Stripe
declare module '@stripe/stripe-js' {
  interface Stripe {
    redirectToCheckout(options: {
      sessionId: string;
    }): Promise<{ error?: { message: string } }>;
  }
}

// Fix ButtonProps
declare module '@/components/ui/Button' {
  interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    asChild?: boolean;
  }
}

// Fix Notification model
declare module '@prisma/client' {
  interface Notification {
    id: string;
    userId: string;
    type: string;
    title: string;
    message: string;
    linkUrl?: string | null;
    data?: string | null;
    isRead: boolean;
    createdAt: Date;
  }

  interface Clan {
    id: string;
    name: string;
    description: string | null;
    emblemUrl: string | null;
    totalScore: number;
    monthlyScore: number;
    currentSeason: number;
    leaderId: string | null;
    createdAt: Date;
    updatedAt: Date;
    _count?: {
      members: number;
    };
  }

  interface Comment {
    id: string;
    chapterId: string;
    userId: string;
    content: string;
    parentId: string | null;
    likesCount: number;
    isDeleted: boolean;
    isHidden: boolean;
    hiddenReason: string | null;
    createdAt: Date;
    updatedAt: Date;
    user?: {
      id: string;
      username: string;
      displayName: string | null;
      avatarUrl: string | null;
    };
    _count?: {
      replies: number;
      likes: number;
    };
    replies?: Comment[];
  }

  interface Chapter {
    id: string;
    mangaId: string;
    chapterNumber: number;
    title: string | null;
    totalPages: number;
    pageUrls: string;
    crowdfundingGoal: number | null;
    crowdfundingCurrent: number;
    isCrowdfunded: boolean;
    viewCount: number;
    createdAt: Date;
    updatedAt: Date;
    _count?: {
      sponsorshipBids: number;
    };
  }
}

// Fix for AI infrastructure
declare module 'bullmq' {
  interface QueueEvents {
    on(event: string, listener: (...args: unknown[]) => void): void;
    emit(event: string, ...args: unknown[]): void;
  }

  interface Queue {
    add(name: string, data: unknown, opts?: unknown): Promise<unknown>;
  }
}

// Fix for vitest
declare global {
  const vi: {
    fn(): jest.Mock;
    mock(path: string, factory?: () => unknown): void;
  };
}

// Redis types
interface MockRedis {
  ping(): Promise<string>;
  get(key: string): Promise<string | null>;
  set(key: string, value: string, opts?: unknown): Promise<string>;
  del(key: string): Promise<number>;
  incr(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<boolean>;
}

// Fix for Next.js Image
interface StaticImageData {
  src: string;
  height: number;
  width: number;
  blurDataURL?: string;
}

// Fix for API route parameters
declare module 'next' {
  export interface PageProps {
    params?: Promise<Record<string, string>> | Record<string, string>;
    searchParams?: Promise<Record<string, string | string[] | undefined>> | Record<string, string | string[] | undefined>;
  }
}
