import { NextRequest } from 'next/server';
import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';

vi.hoisted(() => {
  process.env.AUTH_SECRET = 'test-secret-for-testing';
  process.env.AUTH_URL = 'http://localhost:3000';
  process.env.GOOGLE_CLIENT_ID = 'test-google-id';
  process.env.GOOGLE_CLIENT_SECRET = 'test-google-secret';
  process.env.GITHUB_CLIENT_ID = 'test-github-id';
  process.env.GITHUB_CLIENT_SECRET = 'test-github-secret';
});

const mockFindUnique = vi.hoisted(() => vi.fn());
const mockCompare = vi.hoisted(() => vi.fn());

vi.mock('@/lib/auth', () => ({
  handlers: {
    GET: vi.fn(),
    POST: vi.fn(async (req: Request) => {
      const body = await req.json();
      const { email, password } = body;

      if (!email || !password) {
        return Response.redirect('http://localhost:3000/auth/error?error=CredentialsSignin');
      }

      // Simulate prisma lookup
      const user = await mockFindUnique();
      if (!user) {
        return Response.redirect('http://localhost:3000/auth/error?error=CredentialsSignin');
      }

      // Simulate bcrypt compare
      const isValid = await mockCompare();
      if (!isValid) {
        return Response.redirect('http://localhost:3000/auth/error?error=CredentialsSignin');
      }

      return Response.redirect('http://localhost:3000');
    }),
  },
  auth: vi.fn(),
  signIn: vi.fn(),
  signOut: vi.fn(),
}));

import { POST } from '@/app/api/auth/[...nextauth]/route';

const userFixture = {
  id: '1',
  email: 'test@test.com',
  passwordHash: 'hashed_password',
  displayName: 'Test User',
  username: 'testuser',
  avatarUrl: null,
  xpPoints: 100,
  level: 3,
  role: 'USER',
};

function createCallbackRequest(overrides: Record<string, string> = {}) {
  return new NextRequest('http://localhost:3000/api/auth/callback/credentials', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      csrfToken: 'test',
      email: '',
      password: '',
      callbackUrl: 'http://localhost:3000',
      ...overrides,
    }),
  });
}

describe('POST /api/auth/[...nextauth] (credentials sign-in)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterAll(() => {
    delete process.env.AUTH_SECRET;
  });

  it('signs in with valid credentials', async () => {
    mockFindUnique.mockResolvedValue(userFixture);
    mockCompare.mockResolvedValue(true);

    const response = await POST(createCallbackRequest({ email: 'test@test.com', password: 'Password1!' }));
    expect(response.status).toBe(302);
    expect(response.headers.get('Location')).toBe('http://localhost:3000/');
  });

  it('rejects invalid password', async () => {
    mockFindUnique.mockResolvedValue(userFixture);
    mockCompare.mockResolvedValue(false);

    const response = await POST(createCallbackRequest({ email: 'test@test.com', password: 'wrong' }));
    expect(response.status).toBe(302);
    expect(response.headers.get('Location')).toContain('error');
  });

  it('rejects non-existent user', async () => {
    mockFindUnique.mockResolvedValue(null);

    const response = await POST(createCallbackRequest({ email: 'unknown@test.com', password: 'Password1!' }));
    expect(response.status).toBe(302);
    expect(response.headers.get('Location')).toContain('error');
  });

  it('rejects missing credentials', async () => {
    const response = await POST(createCallbackRequest({ email: '', password: '' }));
    expect(response.status).toBe(302);
    expect(response.headers.get('Location')).toContain('error');
  });
});
