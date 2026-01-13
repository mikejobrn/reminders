import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const registerSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  timezone: z.string().optional().default("UTC"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const validatedData = registerSchema.parse(body);

    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Este email já está em uso" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(validatedData.password, 10);

    const user = await prisma.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        password: hashedPassword,
        timezone: validatedData.timezone,
      },
      select: {
        id: true,
        name: true,
        email: true,
        timezone: true,
        createdAt: true,
      },
    });

    await prisma.list.createMany({
      data: [
        {
          name: "Lembretes",
          color: "blue",
          icon: "list",
          userId: user.id,
          order: 0,
        },
        {
          name: "Pessoal",
          color: "purple",
          icon: "person",
          userId: user.id,
          order: 1,
        },
        {
          name: "Trabalho",
          color: "orange",
          icon: "briefcase",
          userId: user.id,
          order: 2,
        },
      ],
    });

    return NextResponse.json(
      {
        message: "Usuário criado com sucesso",
        user,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error registering user:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Erro ao criar usuário" },
      { status: 500 }
    );
  }
}
