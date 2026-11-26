import { getDb } from "../index";

export interface NotificationRecord {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  readStatus: boolean;
  createdAt: string;
}

export type NotificationType =
  | "donation_alert"
  | "match_found"
  | "pickup_assigned"
  | "pickup_accepted"
  | "pickup_status_changed"
  | "pickup_cancelled"
  | "delivery_completed"
  | "verification_update"
  | "general";

export class NotificationRepository {
  static createNotification(data: {
    id?: string;
    userId: string;
    title: string;
    message: string;
    type: NotificationType;
  }): NotificationRecord {
    const db = getDb();
    const id = data.id || `notif_${Date.now()}`;

    db.prepare(`
      INSERT INTO notifications (id, user_id, title, message, type, read_status, created_at)
      VALUES (?, ?, ?, ?, ?, 0, CURRENT_TIMESTAMP)
    `).run(id, data.userId, data.title, data.message, data.type);

    return {
      id,
      userId: data.userId,
      title: data.title,
      message: data.message,
      type: data.type,
      readStatus: false,
      createdAt: new Date().toISOString(),
    };
  }

  static getUserNotifications(userId: string): NotificationRecord[] {
    const db = getDb();
    const rows = db
      .prepare("SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC")
      .all(userId) as any[];

    return rows.map((r) => ({
      id: r.id,
      userId: r.user_id,
      title: r.title,
      message: r.message,
      type: r.type,
      readStatus: r.read_status === 1,
      createdAt: r.created_at,
    }));
  }

  static markAsRead(id: string): boolean {
    const db = getDb();
    const res = db.prepare("UPDATE notifications SET read_status = 1 WHERE id = ?").run(id);
    return res.changes > 0;
  }

  static markAllAsRead(userId: string): boolean {
    const db = getDb();
    const res = db.prepare("UPDATE notifications SET read_status = 1 WHERE user_id = ?").run(userId);
    return res.changes > 0;
  }
}
