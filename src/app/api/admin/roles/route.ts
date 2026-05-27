import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [roles, permissions] = await Promise.all([
      prisma.role.findMany({
        orderBy: { priority: 'desc' },
        include: {
          permissions: {
            include: { permission: true },
          },
          _count: { select: { users: true } },
        },
      }),
      prisma.permission.findMany({
        orderBy: [{ module: 'asc' }, { codename: 'asc' }],
      }),
    ]);

    const modules = [...new Set(permissions.map((p) => p.module))].sort();

    return NextResponse.json({
      roles: roles.map((r) => ({
        id: r.id,
        name: r.name,
        description: r.description,
        isSystem: r.isSystem,
        priority: r.priority,
        permissionIds: r.permissions.map((rp) => rp.permissionId),
        userCount: r._count.users,
        createdAt: r.createdAt.toISOString(),
      })),
      permissions: permissions.map((p) => ({
        id: p.id,
        codename: p.codename,
        description: p.description,
        module: p.module,
      })),
      modules,
    });
  } catch (error) {
    console.error('Error fetching roles:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, priority } = body;

    if (!name) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 });
    }

    const role = await prisma.role.create({
      data: {
        name,
        description: description || null,
        priority: priority || 0,
      },
    });

    return NextResponse.json({ role, message: 'Role created successfully' }, { status: 201 });
  } catch (error) {
    console.error('Error creating role:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
