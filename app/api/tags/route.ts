import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createTagSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(50),
  color: z.string().optional(),
});

// GET /api/tags - lista tags do usuário
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const tags = await prisma.tag.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(tags);
  } catch (error) {
    console.error("Erro ao buscar tags:", error);
    return NextResponse.json({ error: "Erro ao buscar tags" }, { status: 500 });
  }
}

// POST /api/tags - cria nova tag
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const data = createTagSchema.parse(body);

    // Garantir unicidade por usuário
    const existing = await prisma.tag.findFirst({
      where: {
        userId: user.id,
        name: data.name,
      },
    });

    if (existing) {
      return NextResponse.json(existing, { status: 200 });
    }

    const tag = await prisma.tag.create({
      data: {
        name: data.name,
        color: data.color ?? "blue",
        userId: user.id,
      },
    });

    return NextResponse.json(tag, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Dados inválidos", details: error.issues }, { status: 400 });
    }
    console.error("Erro ao criar tag:", error);
    return NextResponse.json({ error: "Erro ao criar tag" }, { status: 500 });
  }
}
