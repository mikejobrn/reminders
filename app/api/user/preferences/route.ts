import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const preferencesSchema = z.object({
  completedPosition: z.enum(["MOVE_TO_BOTTOM", "KEEP_IN_PLACE"]).optional(),
  completedVisibility: z.enum(["SHOW_TODAY_ONLY", "HIDE", "SHOW_ALL"]).optional(),
  undoTimeoutSeconds: z.number().int().min(3).max(10).optional(),
  confirmBeforeDelete: z.boolean().optional(),
});

const DEFAULT_PREFERENCES = {
  completedPosition: "MOVE_TO_BOTTOM" as const,
  completedVisibility: "SHOW_TODAY_ONLY" as const,
  undoTimeoutSeconds: 5,
  confirmBeforeDelete: true,
};

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });

  if (!user) {
    return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
  }

  const prefs = await prisma.userPreferences.findUnique({
    where: { userId: user.id },
  });

  if (!prefs) {
    return NextResponse.json({ userId: user.id, ...DEFAULT_PREFERENCES });
  }

  return NextResponse.json(prefs);
}

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });

  if (!user) {
    return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
  }

  const body = await request.json();
  const data = preferencesSchema.parse(body);

  const updated = await prisma.userPreferences.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      ...DEFAULT_PREFERENCES,
      ...data,
    },
    update: {
      ...data,
      updatedAt: new Date(),
    },
  });

  return NextResponse.json(updated);
}
