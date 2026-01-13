import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DateTime } from "luxon";

type SmartListId = "today" | "scheduled" | "all" | "flagged" | "completed";

async function getAccessibleListIds(userId: string): Promise<string[]> {
  const [ownLists, shared] = await Promise.all([
    prisma.list.findMany({ where: { userId }, select: { id: true } }),
    prisma.listShare.findMany({ where: { sharedWithId: userId }, select: { listId: true } }),
  ]);

  return Array.from(new Set([...ownLists.map((l) => l.id), ...shared.map((s) => s.listId)]));
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ smartListId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, timezone: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { smartListId: rawId } = await params;
    const smartListId = rawId as SmartListId;

    const allowed: SmartListId[] = ["today", "scheduled", "all", "flagged", "completed"];
    if (!allowed.includes(smartListId)) {
      return NextResponse.json({ error: "Lista inteligente inválida" }, { status: 400 });
    }

    const listIds = await getAccessibleListIds(user.id);

    const { searchParams } = new URL(request.url);
    const parentId = searchParams.get("parentId");

    const where: any = {
      listId: { in: listIds },
      deletedAt: null,
    };

    // Mesma semântica do endpoint de lista: por padrão não inclui concluídos
    const includeCompleted = searchParams.get("includeCompleted") === "true";
    if (!includeCompleted) {
      where.completed = false;
    }

    if (parentId === "null" || parentId === undefined) {
      where.parentId = null;
    } else if (parentId) {
      where.parentId = parentId;
    }

    const zone = user.timezone || "UTC";
    const now = DateTime.now().setZone(zone);
    const startOfDayUtc = now.startOf("day").toUTC().toJSDate();
    const startOfNextDayUtc = now.plus({ days: 1 }).startOf("day").toUTC().toJSDate();
    const todayDateOnly = new Date(now.toISODate()!);

    if (smartListId === "today") {
      where.completed = false;
      where.OR = [
        { utcDatetime: { gte: startOfDayUtc, lt: startOfNextDayUtc } },
        { reminderDate: todayDateOnly },
      ];
    }

    if (smartListId === "scheduled") {
      where.completed = false;
      where.OR = [
        { utcDatetime: { not: null } },
        { reminderDate: { not: null } },
        { recurrence: { isNot: null } },
      ];
    }

    if (smartListId === "all") {
      where.completed = false;
    }

    if (smartListId === "completed") {
      where.completed = true;
    }

    if (smartListId === "flagged") {
      // Campo "flagged" ainda não existe no schema do Prisma.
      return NextResponse.json([], { status: 200 });
    }

    const reminders = await prisma.reminder.findMany({
      where,
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
        recurrence: true,
        _count: {
          select: {
            children: {
              where: {
                deletedAt: null,
              },
            },
            attachments: true,
          },
        },
      },
      orderBy: [
        { completed: "asc" },
        { sortOrder: "asc" },
        { createdAt: "desc" },
      ],
    });

    return NextResponse.json(reminders);
  } catch (error) {
    console.error("Erro ao buscar smart list reminders:", error);
    return NextResponse.json(
      { error: "Erro ao buscar lembretes" },
      { status: 500 }
    );
  }
}
