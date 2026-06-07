'use client';

import { useSession } from 'next-auth/react';
import useSWR from 'swr';

import { fetcher } from '@/lib/swr-config';

interface UseAuraBalanceOptions {
  /** How often to poll the balance in ms. Default 30000. */
  refreshInterval?: number;
  /** Initial balance fetched server-side. Used as fallback before SWR resolves. */
  initialBalance?: number;
}

interface UseAuraBalanceReturn {
  /** Current aura balance. Falls back to session value on initial load. */
  auraBalance: number;
  /** Manually revalidate the balance (e.g. after a generation or purchase). */
  refreshBalance: () => void;
}

/**
 * Shared hook for fetching the user's real-time aura balance.
 *
 * Uses `/api/economy/balance` with SWR so admin changes and purchases
 * are reflected without a page reload. Falls back to session (`useSession`)
 * on initial load to avoid flashing 0.
 *
 * When the user is not logged in the SWR key is `null` (no fetch),
 * and the hook returns 0.
 */
export function useAuraBalance(
  options: UseAuraBalanceOptions = {},
): UseAuraBalanceReturn {
  const { refreshInterval = 30000, initialBalance } = options;
  const { data: session } = useSession();
  const sessionBalance =
    (session?.user as { auraBalance?: number } | undefined)?.auraBalance;

  // Priority: initialBalance (server-side) > sessionBalance (JWT) > 0
  const fallback = initialBalance ?? sessionBalance ?? 0;

  const { data, mutate } = useSWR<{ auraBalance?: number }>(
    session?.user ? '/api/economy/balance' : null,
    fetcher,
    {
      refreshInterval: session?.user ? refreshInterval : undefined,
      revalidateOnFocus: true,
      revalidateIfStale: true,
      fallbackData: session?.user ? { auraBalance: fallback } : undefined,
    },
  );

  const auraBalance = data?.auraBalance ?? fallback;

  return { auraBalance, refreshBalance: mutate };
}
