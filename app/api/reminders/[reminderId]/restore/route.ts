import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function checkReminderAccess(reminderId: string, userEmail: string) {
  const user = await prisma.user.findUnique({
    where: { email: userEmail },
  });

  if (!user) return { authorized: false, user: null, reminder: null, role: "VIEWER" as const };

  const reminder = await prisma.reminder.findUnique({
    where: { id: reminderId },
    include: {
      list: {
        include: {
          shares: {
            where: { sharedWithId: user.id },
          },
        },
      },
    },
  });

  if (!reminder) return { authorized: false, user, reminder: null, role: "VIEWER" as const };

  if (reminder.list.userId === user.id) {
    return { authorized: true, user, reminder, role: "ADMIN" as const };
  }

  const share = reminder.list.shares[0];
  if (share) {
    return { authorized: true, user, reminder, role: share.role } as const;
  }

  return { authorized: false, user, reminder, role: "VIEWER" as const };
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ reminderId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { reminderId } = await params;
    const access = await checkReminderAccess(reminderId, session.user.email);

    if (!access.authorized || access.role === "VIEWER") {
      return NextResponse.json(
        { error: "Sem permissão para restaurar este lembrete" },
        { status: 403 }
      );
    }

    const restored = await prisma.reminder.update({
      where: { id: reminderId },
      data: { deletedAt: null },
      include: {
        tags: { include: { tag: true } },
        recurrence: true,
        attachments: true,
        _count: {
          select: {
            children: { where: { deletedAt: null } },
            attachments: true,
          },
        },
      },
    });

    return NextResponse.json(restored);
  } catch (error) {
    console.error("Erro ao restaurar lembrete:", error);
    return NextResponse.json({ error: "Erro ao restaurar lembrete" }, { status: 500 });
  }
}
