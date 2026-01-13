import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { DateTime } from "luxon";

// Schema de validação para criação de lembrete
const createReminderSchema = z.object({
  title: z.string().min(1, "Título é obrigatório").max(500),
  notes: z.string().optional(),
  listId: z.string().uuid("ID da lista inválido"),
  sectionId: z.string().uuid().optional(),
  parentId: z.string().uuid().optional(), // Para subtarefas
  priority: z.number().int().min(0).max(3).default(0),
  flagged: z.boolean().default(false),
  
  // Data e timezone
  dueDate: z.string().optional(), // ISO string
  timezone: z.string().optional(), // IANA timezone
  isFloating: z.boolean().default(false),
  isDateOnly: z.boolean().default(false),
  
  // URL
  url: z.string().url().optional().or(z.literal("")),
  
  // Recorrência
  isRecurring: z.boolean().default(false),
  rruleString: z.string().optional(),
  
  // Tags
  tagIds: z.array(z.string().uuid()).optional(),
  
  sortOrder: z.number().optional(),
});

// Schema de validação para atualização
const updateReminderSchema = createReminderSchema.partial();

// Helper para verificar permissão na lista
async function checkListAccess(listId: string, userEmail: string) {
  const user = await prisma.user.findUnique({
    where: { email: userEmail },
  });

  if (!user) return { authorized: false, user: null };

  const list = await prisma.list.findUnique({
    where: { id: listId },
    include: {
      shares: {
        where: { sharedWithId: user.id },
      },
    },
  });

  if (!list) return { authorized: false, user };

  // Dono tem acesso total
  if (list.userId === user.id) {
    return { authorized: true, user, isOwner: true, role: "admin" as const };
  }

  // Compartilhado precisa ter pelo menos viewer
  const share = list.shares[0];
  if (share) {
    return {
      authorized: true,
      user,
      isOwner: false,
      role: share.role,
    };
  }

  return { authorized: false, user };
}

// Converter data para UTC considerando timezone
function convertToUTC(dateStr: string, timezone: string, isFloating: boolean, isDateOnly: boolean) {
  if (!dateStr) return null;

  if (isFloating || isDateOnly) {
    // Para datas flutuantes ou apenas data, armazenar como UTC sem conversão
    return new Date(dateStr);
  }

  // Para datas com timezone específico, converter para UTC
  const dt = DateTime.fromISO(dateStr, { zone: timezone });
  return dt.toJSDate();
}

// GET /api/lists/[listId]/reminders - Buscar lembretes de uma lista
export async function GET(
  request: NextRequest,
  { params }: { params: { listId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { listId } = params;
    const access = await checkListAccess(listId, session.user.email);

    if (!access.authorized) {
      return NextResponse.json(
        { error: "Sem permissão para acessar esta lista" },
        { status: 403 }
      );
    }

    // Buscar parâmetros de query
    const { searchParams } = new URL(request.url);
    const includeCompleted = searchParams.get("includeCompleted") === "true";
    const parentId = searchParams.get("parentId");

    // Construir filtros
    const where: any = {
      listId,
      deletedAt: null,
    };

    if (!includeCompleted) {
      where.isCompleted = false;
    }

    // Filtrar por parent (para buscar subtarefas específicas ou tarefas raiz)
    if (parentId === "null" || parentId === undefined) {
      where.parentId = null; // Apenas tarefas raiz
    } else if (parentId) {
      where.parentId = parentId; // Subtarefas de uma tarefa específica
    }

    const reminders = await prisma.reminder.findMany({
      where,
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
        recurrenceRule: true,
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
        { isCompleted: "asc" },
        { sortOrder: "asc" },
        { createdAt: "desc" },
      ],
    });

    return NextResponse.json(reminders);
  } catch (error) {
    console.error("Erro ao buscar lembretes:", error);
    return NextResponse.json(
      { error: "Erro ao buscar lembretes" },
      { status: 500 }
    );
  }
}

// POST /api/lists/[listId]/reminders - Criar novo lembrete
export async function POST(
  request: NextRequest,
  { params }: { params: { listId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { listId } = params;
    const access = await checkListAccess(listId, session.user.email);

    if (!access.authorized || access.role === "viewer") {
      return NextResponse.json(
        { error: "Sem permissão para criar lembretes nesta lista" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = createReminderSchema.parse(body);

    // Validar que a lista ID no body corresponde ao parâmetro
    if (validatedData.listId !== listId) {
      return NextResponse.json(
        { error: "ID da lista não corresponde" },
        { status: 400 }
      );
    }

    // Calcular sortOrder se não fornecido
    let sortOrder = validatedData.sortOrder;
    if (sortOrder === undefined) {
      const lastReminder = await prisma.reminder.findFirst({
        where: {
          listId,
          parentId: validatedData.parentId ?? null,
        },
        orderBy: { sortOrder: "desc" },
      });
      sortOrder = (lastReminder?.sortOrder ?? 0) + 1;
    }

    // Converter data para UTC se fornecida
    let utcDatetime = null;
    if (validatedData.dueDate) {
      const timezone = validatedData.timezone ?? "UTC";
      utcDatetime = convertToUTC(
        validatedData.dueDate,
        timezone,
        validatedData.isFloating,
        validatedData.isDateOnly
      );
    }

    // Criar lembrete
    const { tagIds, rruleString, ...reminderData } = validatedData;
    
    const newReminder = await prisma.reminder.create({
      data: {
        ...reminderData,
        sortOrder,
        utcDatetime,
        userId: access.user.id,
        // Criar recorrência se fornecida
        ...(rruleString && validatedData.isRecurring
          ? {
              recurrenceRule: {
                create: {
                  rruleString,
                  userId: access.user.id,
                },
              },
            }
          : {}),
        // Conectar tags se fornecidas
        ...(tagIds && tagIds.length > 0
          ? {
              tags: {
                create: tagIds.map((tagId) => ({
                  tag: {
                    connect: { id: tagId },
                  },
                })),
              },
            }
          : {}),
      },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
        recurrenceRule: true,
        _count: {
          select: {
            children: true,
            attachments: true,
          },
        },
      },
    });

    return NextResponse.json(newReminder, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Erro ao criar lembrete:", error);
    return NextResponse.json(
      { error: "Erro ao criar lembrete" },
      { status: 500 }
    );
  }
}
