import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/notifications/schedule - Schedule a notification via OneSignal
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, oneSignalPlayerId: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    if (!user.oneSignalPlayerId) {
      return NextResponse.json(
        { error: "Usuário não inscrito para notificações" },
        { status: 400 }
      );
    }

    // Check if OneSignal is configured
    const oneSignalAppId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
    const oneSignalApiKey = process.env.ONESIGNAL_REST_API_KEY;

    if (!oneSignalAppId || !oneSignalApiKey) {
      return NextResponse.json(
        { error: "OneSignal não configurado" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { reminderId, title, body: notificationBody, scheduledAt, listId } = body;

    if (!reminderId || !title || !scheduledAt) {
      return NextResponse.json(
        { error: "Parâmetros inválidos" },
        { status: 400 }
      );
    }

    // Calculate send_after timestamp (ISO 8601 format)
    const sendAfter = new Date(scheduledAt).toISOString();

    // Create notification via OneSignal API
    const oneSignalResponse = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${oneSignalApiKey}`,
      },
      body: JSON.stringify({
        app_id: oneSignalAppId,
        include_player_ids: [user.oneSignalPlayerId],
        headings: { en: title },
        contents: { en: notificationBody || title },
        data: {
          reminderId,
          listId,
          type: "reminder",
        },
        send_after: sendAfter,
        delayed_option: "timezone", // Respect user's timezone
        url: `${process.env.NEXT_PUBLIC_APP_URL || ''}/lists/${listId}`,
      }),
    });

    if (!oneSignalResponse.ok) {
      const error = await oneSignalResponse.json();
      console.error("OneSignal API error:", error);
      return NextResponse.json(
        { error: "Erro ao agendar notificação" },
        { status: 500 }
      );
    }

    const oneSignalData = await oneSignalResponse.json();
    const oneSignalNotificationId = oneSignalData.id;

    // Update reminder with OneSignal notification ID
    await prisma.reminder.update({
      where: { id: reminderId },
      data: { oneSignalNotificationId },
    });

    return NextResponse.json({
      success: true,
      oneSignalNotificationId,
    });
  } catch (error) {
    console.error("Error scheduling notification:", error);
    return NextResponse.json(
      { error: "Erro ao agendar notificação" },
      { status: 500 }
    );
  }
}
