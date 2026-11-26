import { NextRequest, NextResponse } from "next/server";
import { NotificationRepository } from "@/lib/db/repositories/notification.repo";
import { verifyJWT } from "@/lib/auth/jwt";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("auth_token")?.value;
    const user = token ? await verifyJWT(token) : null;

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || user?.userId || "usr_donor_1";

    const notifications = NotificationRepository.getUserNotifications(userId);
    const unreadCount = notifications.filter((n) => !n.readStatus).length;

    return NextResponse.json({ notifications, unreadCount }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const token = req.cookies.get("auth_token")?.value;
    const user = token ? await verifyJWT(token) : null;

    const body = await req.json();
    const { id, markAllRead } = body;
    const userId = body.userId || user?.userId || "usr_donor_1";

    if (markAllRead) {
      NotificationRepository.markAllAsRead(userId);
      return NextResponse.json({ success: true, message: "All notifications marked as read." }, { status: 200 });
    }

    if (id) {
      NotificationRepository.markAsRead(id);
      return NextResponse.json({ success: true, message: "Notification marked as read." }, { status: 200 });
    }

    return NextResponse.json({ error: "Missing notification id or markAllRead flag." }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
