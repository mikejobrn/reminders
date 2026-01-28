import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/user/onesignal - Save OneSignal player ID
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { playerId } = body;

    if (!playerId) {
      return NextResponse.json(
        { error: "Player ID não fornecido" },
        { status: 400 }
      );
    }

    // Update user with OneSignal player ID
    await prisma.user.update({
      where: { email: session.user.email },
      data: { oneSignalPlayerId: playerId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving OneSignal player ID:", error);
    return NextResponse.json(
      { error: "Erro ao salvar player ID" },
      { status: 500 }
    );
  }
}
