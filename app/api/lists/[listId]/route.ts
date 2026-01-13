import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Schema de validação para atualização de lista
const updateListSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
  order: z.number().optional(),
});

// Helper para verificar permissão do usuário na lista
async function checkListPermission(
  listId: string,
  userEmail: string,
  requiredRole: "viewer" | "editor" | "admin"
) {
  const user = await prisma.user.findUnique({
    where: { email: userEmail },
  });

  if (!user) {
    return { authorized: false, user: null, isOwner: false };
  }

  // Verificar se o usuário é o dono da lista
  const list = await prisma.list.findUnique({
    where: { id: listId },
    include: {
      shares: {
        where: {
          sharedWithId: user.id,
        },
      },
    },
  });

  if (!list) {
    return { authorized: false, user, isOwner: false, notFound: true as const };
  }

  // Se é o dono, tem todas as permissões
  if (list.userId === user.id) {
    return { authorized: true, user, isOwner: true, list };
  }

  // Se não é o dono, verificar permissão de compartilhamento
  const share = list.shares[0];
  if (!share) {
    return { authorized: false, user, isOwner: false, list };
  }

  // Verificar se tem a permissão necessária
  const requiredRoleRank: Record<"viewer" | "editor" | "admin", number> = {
    viewer: 1,
    editor: 2,
    admin: 3,
  };
  const shareRoleRank: Record<string, number> = {
    VIEWER: 1,
    EDITOR: 2,
    ADMIN: 3,
  };
  const hasPermission =
    (shareRoleRank[String(share.role).toUpperCase()] ?? 0) >=
    requiredRoleRank[requiredRole];

  return {
    authorized: hasPermission,
    user,
    isOwner: false,
    list,
    role: share.role,
  };
}

// GET /api/lists/[listId] - Buscar lista específica
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ listId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    const { listId } = await params;
    const permission = await checkListPermission(
      listId,
      session.user.email,
      "viewer"
    );

    if ((permission as any).notFound) {
      return NextResponse.json(
        { error: "Lista não encontrada" },
        { status: 404 }
      );
    }

    if (!permission.authorized) {
      return NextResponse.json(
        { error: "Sem permissão para acessar esta lista" },
        { status: 403 }
      );
    }

    // Buscar lista com todas as informações
    const list = await prisma.list.findUnique({
      where: { id: listId },
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
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    if (!list) {
      return NextResponse.json(
        { error: "Lista não encontrada" },
        { status: 404 }
      );
    }

    const toClientRole = (role?: string): "viewer" | "editor" | "admin" => {
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

    return NextResponse.json({
      ...list,
      isOwner: permission.isOwner,
      role: permission.isOwner ? "admin" : toClientRole(permission.role),
      incompleteCount: list._count.reminders,
    });
  } catch (error) {
    console.error("Erro ao buscar lista:", error);
    return NextResponse.json(
      { error: "Erro ao buscar lista" },
      { status: 500 }
    );
  }
}

// PATCH /api/lists/[listId] - Atualizar lista
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ listId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    const { listId } = await params;
    const permission = await checkListPermission(
      listId,
      session.user.email,
      "editor"
    );

    if (!permission.authorized) {
      return NextResponse.json(
        { error: "Sem permissão para editar esta lista" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = updateListSchema.parse(body);

    // Atualizar lista
    const updatedList = await prisma.list.update({
      where: { id: listId },
      data: {
        ...validatedData,
      },
    });

    // Buscar contagem de lembretes incompletos
    const incompleteCount = await prisma.reminder.count({
      where: {
        listId: listId,
        completed: false,
        deletedAt: null,
      },
    });

    return NextResponse.json({
      ...updatedList,
      incompleteCount,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Erro ao atualizar lista:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar lista" },
      { status: 500 }
    );
  }
}

// DELETE /api/lists/[listId] - Deletar lista (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ listId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    const { listId } = await params;
    const permission = await checkListPermission(
      listId,
      session.user.email,
      "admin"
    );

    if (!permission.authorized) {
      return NextResponse.json(
        { error: "Apenas o dono pode deletar a lista" },
        { status: 403 }
      );
    }

    // Deletar lista (cascade deletará lembretes relacionados)
    await prisma.list.delete({
      where: { id: listId },
    });

    return NextResponse.json(
      { message: "Lista deletada com sucesso" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erro ao deletar lista:", error);
    return NextResponse.json(
      { error: "Erro ao deletar lista" },
      { status: 500 }
    );
  }
}
