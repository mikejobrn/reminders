import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// POST /api/notifications/cancel - Cancel a scheduled notification via OneSignal
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
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
    const { oneSignalNotificationId } = body;

    if (!oneSignalNotificationId) {
      return NextResponse.json(
        { error: "ID da notificação não fornecido" },
        { status: 400 }
      );
    }

    // Cancel notification via OneSignal API
    const oneSignalResponse = await fetch(
      `https://onesignal.com/api/v1/notifications/${oneSignalNotificationId}?app_id=${oneSignalAppId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Basic ${oneSignalApiKey}`,
        },
      }
    );

    if (!oneSignalResponse.ok) {
      const error = await oneSignalResponse.json();
      console.error("OneSignal API error:", error);
      return NextResponse.json(
        { error: "Erro ao cancelar notificação" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error cancelling notification:", error);
    return NextResponse.json(
      { error: "Erro ao cancelar notificação" },
      { status: 500 }
    );
  }
}
