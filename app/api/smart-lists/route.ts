import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DateTime } from "luxon";

type SmartListId = "today" | "scheduled" | "all" | "flagged" | "completed";

type SmartList = {
  id: SmartListId;
  name: string;
  icon: string;
  color: string;
  count: number;
};

async function getAccessibleListIds(userId: string): Promise<string[]> {
  const [ownLists, shared] = await Promise.all([
    prisma.list.findMany({ where: { userId }, select: { id: true } }),
    prisma.listShare.findMany({ where: { sharedWithId: userId }, select: { listId: true } }),
  ]);

  return Array.from(new Set([...ownLists.map((l) => l.id), ...shared.map((s) => s.listId)]));
}

export async function GET() {
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

    const listIds = await getAccessibleListIds(user.id);

    const zone = user.timezone || "UTC";
    const now = DateTime.now().setZone(zone);
    const startOfDayUtc = now.startOf("day").toUTC().toJSDate();
    const startOfNextDayUtc = now.plus({ days: 1 }).startOf("day").toUTC().toJSDate();
    const todayDateOnly = new Date(now.toISODate()!);

    const baseWhere = {
      listId: { in: listIds },
      deletedAt: null as null,
    };

    const [
      todayCount,
      scheduledCount,
      allCount,
      completedCount,
    ] = await Promise.all([
      prisma.reminder.count({
        where: {
          ...baseWhere,
          completed: false,
          OR: [
            { utcDatetime: { gte: startOfDayUtc, lt: startOfNextDayUtc } },
            { reminderDate: todayDateOnly },
          ],
        },
      }),
      prisma.reminder.count({
        where: {
          ...baseWhere,
          completed: false,
          OR: [
            { utcDatetime: { not: null } },
            { reminderDate: { not: null } },
            { recurrence: { isNot: null } },
          ],
        },
      }),
      prisma.reminder.count({
        where: {
          ...baseWhere,
          completed: false,
        },
      }),
      prisma.reminder.count({
        where: {
          ...baseWhere,
          completed: true,
        },
      }),
    ]);

    const smartLists: SmartList[] = [
      { id: "today", name: "Hoje", icon: "calendar-outline", color: "#007AFF", count: todayCount },
      { id: "scheduled", name: "Agendados", icon: "calendar-outline", color: "#FF3B30", count: scheduledCount },
      { id: "all", name: "Todos", icon: "list-outline", color: "#8E8E93", count: allCount },
      // "Sinalizados" ainda não é persistido no schema (campo flagged), então por enquanto fica como 0.
      { id: "flagged", name: "Sinalizados", icon: "flag-outline", color: "#FF9500", count: 0 },
      { id: "completed", name: "Concluídos", icon: "checkmark-circle-outline", color: "#8E8E93", count: completedCount },
    ];

    return NextResponse.json(smartLists);
  } catch (error) {
    console.error("Erro ao buscar smart lists:", error);
    return NextResponse.json({ error: "Erro ao buscar listas inteligentes" }, { status: 500 });
  }
}
