import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/push-notifications', () => ({ savePushSubscription: vi.fn(), deletePushSubscription: vi.fn() }));

import { auth } from '@/lib/auth';
import { savePushSubscription } from '@/lib/push-notifications';
import { POST } from '@/app/api/notifications/push/route';
import { GET as VapidGet } from '@/app/api/notifications/vapid-public-key/route';

describe('Notifications API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = 'original-key';
  });

  const mockSession = { user: { id: 'user1' } };
  const validSub = {
    endpoint: 'https://fcm.example.com/abc',
    keys: { p256dh: 'key123', auth: 'auth456' },
  };

  describe('POST /api/notifications/push', () => {
    it('returns 401 when not authenticated', async () => {
      vi.mocked(auth).mockResolvedValue(null as any);
      const req = new NextRequest('http://localhost/api/notifications/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validSub),
      });
      const response = await POST(req);
      expect(response.status).toBe(401);
    });

    it('returns 400 for missing subscription data', async () => {
      vi.mocked(auth).mockResolvedValue(mockSession as any);
      const req = new NextRequest('http://localhost/api/notifications/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const response = await POST(req);
      expect(response.status).toBe(400);
    });

    it('returns 200 and saves subscription', async () => {
      vi.mocked(auth).mockResolvedValue(mockSession as any);
      vi.mocked(savePushSubscription).mockResolvedValue(undefined);
      const req = new NextRequest('http://localhost/api/notifications/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validSub),
      });
      const response = await POST(req);
      const data = await response.json();
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(savePushSubscription).toHaveBeenCalledWith('user1', {
        endpoint: validSub.endpoint,
        keys: validSub.keys,
      });
    });
  });

  describe('GET /api/notifications/vapid-public-key', () => {
    it('returns VAPID public key', async () => {
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = 'test-vapid-key';
      const response = await VapidGet();
      const data = await response.json();
      expect(response.status).toBe(200);
      expect(data.publicKey).toBe('test-vapid-key');
    });

    it('returns 500 when VAPID key is not configured', async () => {
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = '';
      const response = await VapidGet();
      const data = await response.json();
      expect(response.status).toBe(500);
      expect(data.error).toBe('VAPID public key not configured');
    });
  });
});
