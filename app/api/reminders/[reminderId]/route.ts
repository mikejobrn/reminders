import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { DateTime } from "luxon";

// Schema de validação para atualização
const updateReminderSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  notes: z.string().optional(),
  sectionId: z.string().uuid().optional().nullable(),
  parentId: z.string().uuid().optional().nullable(),
  priority: z.number().int().min(0).max(3).optional(),
  flagged: z.boolean().optional(),
  isCompleted: z.boolean().optional(),
  
  // Data e timezone
  dueDate: z.string().optional().nullable(),
  timezone: z.string().optional(),
  isFloating: z.boolean().optional(),
  isDateOnly: z.boolean().optional(),
  
  // URL
  url: z.string().url().optional().or(z.literal("")).nullable(),
  
  // Recorrência
  isRecurring: z.boolean().optional(),
  rruleString: z.string().optional(),
  
  // Tags
  tagIds: z.array(z.string().uuid()).optional(),
  
  sortOrder: z.number().optional(),
});

// Helper para verificar permissão no lembrete
async function checkReminderAccess(reminderId: string, userEmail: string) {
  const user = await prisma.user.findUnique({
    where: { email: userEmail },
  });

  if (!user) return { authorized: false, user: null };

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

  if (!reminder) return { authorized: false, user, reminder: null };

  // Dono da lista tem acesso total
  if (reminder.list.userId === user.id) {
    return {
      authorized: true,
      user,
      reminder,
      isOwner: true,
      role: "admin" as const,
    };
  }

  // Compartilhado precisa ter pelo menos viewer
  const share = reminder.list.shares[0];
  if (share) {
    return {
      authorized: true,
      user,
      reminder,
      isOwner: false,
      role: share.role,
    };
  }

  return { authorized: false, user, reminder };
}

// Converter data para UTC considerando timezone
function convertToUTC(
  dateStr: string | null,
  timezone: string,
  isFloating: boolean,
  isDateOnly: boolean
) {
  if (!dateStr) return null;

  if (isFloating || isDateOnly) {
    return new Date(dateStr);
  }

  const dt = DateTime.fromISO(dateStr, { zone: timezone });
  return dt.toJSDate();
}

// GET /api/reminders/[reminderId] - Buscar lembrete específico
export async function GET(
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

    if (!access.authorized) {
      return NextResponse.json(
        { error: "Sem permissão para acessar este lembrete" },
        { status: 403 }
      );
    }

    const reminder = await prisma.reminder.findUnique({
      where: { id: reminderId },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
        recurrenceRule: true,
        attachments: true,
        children: {
          where: {
            deletedAt: null,
          },
          include: {
            _count: {
              select: {
                children: true,
              },
            },
          },
          orderBy: {
            sortOrder: "asc",
          },
        },
        parent: {
          select: {
            id: true,
            title: true,
          },
        },
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
    });

    if (!reminder) {
      return NextResponse.json(
        { error: "Lembrete não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(reminder);
  } catch (error) {
    console.error("Erro ao buscar lembrete:", error);
    return NextResponse.json(
      { error: "Erro ao buscar lembrete" },
      { status: 500 }
    );
  }
}

// PATCH /api/reminders/[reminderId] - Atualizar lembrete
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

    if (!access.authorized || access.role === "viewer") {
      return NextResponse.json(
        { error: "Sem permissão para editar este lembrete" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = updateReminderSchema.parse(body);

    // Se completar um lembrete recorrente, criar histórico
    if (
      validatedData.isCompleted &&
      !access.reminder?.isCompleted &&
      access.reminder?.isRecurring
    ) {
      await prisma.completionHistory.create({
        data: {
          reminderId: reminderId,
          completedAt: new Date(),
          userId: access.user.id,
        },
      });
    }

    // Converter data para UTC se fornecida
    let utcDatetime: Date | null | undefined = undefined;
    if ("dueDate" in validatedData) {
      if (validatedData.dueDate) {
        const timezone =
          validatedData.timezone ?? access.reminder?.timezone ?? "UTC";
        const isFloating =
          validatedData.isFloating ?? access.reminder?.isFloating ?? false;
        const isDateOnly =
          validatedData.isDateOnly ?? access.reminder?.isDateOnly ?? false;

        utcDatetime = convertToUTC(
          validatedData.dueDate,
          timezone,
          isFloating,
          isDateOnly
        );
      } else {
        utcDatetime = null;
      }
    }

    // Preparar dados para atualização
    const { tagIds, rruleString, ...reminderData } = validatedData;

    // Atualizar tags se fornecidas
    if (tagIds) {
      // Remover tags existentes
      await prisma.reminderTag.deleteMany({
        where: { reminderId },
      });

      // Adicionar novas tags
      if (tagIds.length > 0) {
        await prisma.reminderTag.createMany({
          data: tagIds.map((tagId) => ({
            reminderId,
            tagId,
          })),
        });
      }
    }

    // Atualizar regra de recorrência se fornecida
    if (rruleString && validatedData.isRecurring) {
      const existingRule = await prisma.recurrenceRule.findUnique({
        where: { reminderId },
      });

      if (existingRule) {
        await prisma.recurrenceRule.update({
          where: { reminderId },
          data: { rruleString },
        });
      } else {
        await prisma.recurrenceRule.create({
          data: {
            reminderId,
            rruleString,
            userId: access.user.id,
          },
        });
      }
    } else if (validatedData.isRecurring === false) {
      // Remover regra se não for mais recorrente
      await prisma.recurrenceRule.deleteMany({
        where: { reminderId },
      });
    }

    // Atualizar lembrete
    const updatedReminder = await prisma.reminder.update({
      where: { id: reminderId },
      data: {
        ...reminderData,
        ...(utcDatetime !== undefined ? { utcDatetime } : {}),
        updatedAt: new Date(),
      },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
        recurrenceRule: true,
        attachments: true,
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
    });

    return NextResponse.json(updatedReminder);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Erro ao atualizar lembrete:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar lembrete" },
      { status: 500 }
    );
  }
}

// DELETE /api/reminders/[reminderId] - Deletar lembrete
export async function DELETE(
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

    if (!access.authorized || access.role === "viewer") {
      return NextResponse.json(
        { error: "Sem permissão para deletar este lembrete" },
        { status: 403 }
      );
    }

    // Soft delete
    await prisma.reminder.update({
      where: { id: reminderId },
      data: {
        deletedAt: new Date(),
      },
    });

    return NextResponse.json({ message: "Lembrete deletado com sucesso" });
  } catch (error) {
    console.error("Erro ao deletar lembrete:", error);
    return NextResponse.json(
      { error: "Erro ao deletar lembrete" },
      { status: 500 }
    );
  }
}
