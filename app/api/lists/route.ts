import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Schema de validação para criação de lista
const createListSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(100),
  color: z.string().optional(),
  icon: z.string().optional(),
  order: z.number().optional(),
});

// Schema de validação para atualização de lista
const updateListSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
  order: z.number().optional(),
});

// GET /api/lists - Buscar todas as listas do usuário
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    // Buscar usuário pelo email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    // Buscar listas do usuário (próprias e compartilhadas)
    const ownLists = await prisma.list.findMany({
      where: {
        userId: user.id,
      },
      include: {
        _count: {
          select: {
            reminders: {
              where: {
                completed: false,
                deletedAt: null,
              },
            },
          },
        },
        shares: {
          include: {
            sharedWith: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
      },
      orderBy: {
        order: "asc",
      },
    });

    // Buscar listas compartilhadas com o usuário
    const sharedLists = await prisma.listShare.findMany({
      where: {
        sharedWithId: user.id,
      },
      include: {
        list: {
          include: {
            _count: {
              select: {
                reminders: {
                  where: {
                    completed: false,
                    deletedAt: null,
                  },
                },
              },
            },
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
            shares: {
              include: {
                sharedWith: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    image: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const toClientRole = (role: string): "viewer" | "editor" | "admin" => {
      switch (role) {
        case "VIEWER":
          return "viewer";
        case "EDITOR":
          return "editor";
        case "ADMIN":
        default:
          return "admin";
      }
    };

    // Combinar listas próprias e compartilhadas
    const allLists = [
      ...ownLists.map((list: any) => ({
        ...list,
        isOwner: true,
        role: "admin" as const,
        incompleteCount: list._count.reminders,
      })),
      ...sharedLists.map((share: any) => ({
        ...share.list,
        isOwner: false,
        role: toClientRole(share.role),
        incompleteCount: share.list._count.reminders,
      })),
    ];

    return NextResponse.json(allLists);
  } catch (error) {
    console.error("Erro ao buscar listas:", error);
    return NextResponse.json(
      { error: "Erro ao buscar listas" },
      { status: 500 }
    );
  }
}

// POST /api/lists - Criar nova lista
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    // Buscar usuário pelo email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = createListSchema.parse(body);

    const { name, color, icon } = validatedData;

    // Se order não for fornecido, calcular o próximo
    let order = validatedData.order;
    if (order === undefined) {
      const lastList = await prisma.list.findFirst({
        where: { userId: user.id },
        orderBy: { order: "desc" },
      });
      order = (lastList?.order ?? 0) + 1;
    }

    // Criar a lista
    const newList = await prisma.list.create({
      data: {
        name,
        ...(color ? { color } : {}),
        ...(icon ? { icon } : {}),
        order,
        userId: user.id,
      },
      include: {
        _count: {
          select: {
            reminders: {
              where: {
                completed: false,
                deletedAt: null,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(
      {
        ...newList,
        incompleteCount: newList._count.reminders,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Erro ao criar lista:", error);
    return NextResponse.json(
      { error: "Erro ao criar lista" },
      { status: 500 }
    );
  }
}
