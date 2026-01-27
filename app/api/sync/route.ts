import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const session = await auth();
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const sinceLists = request.nextUrl.searchParams.get('sinceLists');
    const sinceReminders = request.nextUrl.searchParams.get('sinceReminders');

    // Buscar listas com permissão
    let listsWhere: any = {
      OR: [
        { userId: user.id },
        {
          shares: {
            some: {
              sharedWithId: user.id,
            },
          },
        },
      ],
    };

    if (sinceLists) {
      listsWhere.updatedAt = {
        gt: new Date(sinceLists),
      };
    }

    const lists = await prisma.list.findMany({
      where: listsWhere,
      select: {
        id: true,
        name: true,
        color: true,
        icon: true,
        updatedAt: true,
        _count: {
          select: {
            reminders: {
              where: { completed: false, deletedAt: null },
            },
          },
        },
      },
    });

    // Buscar lembretes de listas com permissão
    let remindersWhere: any = {
      list: {
        OR: [
          { userId: user.id },
          {
            shares: {
              some: {
                sharedWithId: user.id,
              },
            },
          },
        ],
      },
      deletedAt: null,
    };

    if (sinceReminders) {
      remindersWhere.updatedAt = {
        gt: new Date(sinceReminders),
      };
    }

    const reminders = await prisma.reminder.findMany({
      where: remindersWhere,
      select: {
        id: true,
        listId: true,
        title: true,
        notes: true,
        completed: true,
        priority: true,
        utcDatetime: true,
        timezone: true,
        isFloating: true,
        isDateOnly: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      lists: lists.map(l => ({
        id: l.id,
        name: l.name,
        color: l.color,
        icon: l.icon,
        incompleteCount: l._count.reminders,
        updatedAt: l.updatedAt.toISOString(),
      })),
      reminders: reminders.map(r => ({
        id: r.id,
        listId: r.listId,
        title: r.title,
        notes: r.notes,
        completed: r.completed,
        priority: r.priority,
        utcDatetime: r.utcDatetime?.toISOString(),
        timezone: r.timezone,
        isFloating: r.isFloating,
        isDateOnly: r.isDateOnly,
        updatedAt: r.updatedAt.toISOString(),
      })),
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
