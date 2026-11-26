import { getDb } from "../index";

export interface ReviewRecord {
  id: string;
  reviewerId: string;
  reviewedUserId: string;
  rating: number;
  comment?: string;
  createdAt: string;
  reviewerName?: string;
}

export class ReviewRepository {
  static createReview(data: {
    id?: string;
    reviewerId: string;
    reviewedUserId: string;
    rating: number;
    comment?: string;
  }): ReviewRecord {
    const db = getDb();
    const id = data.id || `rev_${Date.now()}`;

    if (data.rating < 1 || data.rating > 5) {
      throw new Error("Rating must be between 1 and 5.");
    }

    db.prepare(`
      INSERT INTO reviews (id, reviewer_id, reviewed_user_id, rating, comment, created_at)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).run(id, data.reviewerId, data.reviewedUserId, data.rating, data.comment || null);

    return {
      id,
      reviewerId: data.reviewerId,
      reviewedUserId: data.reviewedUserId,
      rating: data.rating,
      comment: data.comment,
      createdAt: new Date().toISOString(),
    };
  }

  static getReviewsForUser(reviewedUserId: string): ReviewRecord[] {
    const db = getDb();
    const rows = db
      .prepare(`
        SELECT r.*, u.name as reviewer_name
        FROM reviews r
        JOIN users u ON r.reviewer_id = u.id
        WHERE r.reviewed_user_id = ?
        ORDER BY r.created_at DESC
      `)
      .all(reviewedUserId) as any[];

    return rows.map((r) => ({
      id: r.id,
      reviewerId: r.reviewer_id,
      reviewedUserId: r.reviewed_user_id,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.created_at,
      reviewerName: r.reviewer_name,
    }));
  }

  static getUserRatingSummary(reviewedUserId: string): { averageRating: number; totalReviews: number } {
    const db = getDb();
    const row = db
      .prepare(`
        SELECT AVG(rating) as avg_rating, COUNT(*) as total
        FROM reviews
        WHERE reviewed_user_id = ?
      `)
      .get(reviewedUserId) as any;

    return {
      averageRating: row?.avg_rating ? Number(row.avg_rating.toFixed(2)) : 5.0,
      totalReviews: row?.total || 0,
    };
  }
}
