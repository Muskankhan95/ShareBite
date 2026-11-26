import { getDb } from "../index";
import { NGOMatchResult } from "@/lib/matching/types";

export interface MatchRecord {
  id: string;
  donationId: string;
  ngoId: string;
  matchScore: number;
  distance: number;
  urgencyScore: number;
  reasons: string[];
  factorsJson?: Record<string, number>;
  status: "pending" | "accepted" | "rejected" | "expired";
  createdAt: string;
  ngoDetails?: {
    organizationName: string;
    contactPerson: string;
    phone: string;
    address: string;
    capacity: number;
  };
  donationDetails?: {
    foodName: string;
    quantity: string;
    servings: number;
    category: string;
    pickupAddress: string;
    availableUntil: string;
  };
}

export class MatchRepository {
  static createMatch(data: {
    id?: string;
    donationId: string;
    ngoId: string;
    matchScore: number;
    distance: number;
    urgencyScore: number;
    reasons?: string[];
    factorsJson?: Record<string, number>;
  }): MatchRecord {
    const db = getDb();
    const id = data.id || `mat_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const reasonsStr = JSON.stringify(data.reasons || []);
    const factorsStr = JSON.stringify(data.factorsJson || {});

    db.prepare(`
      INSERT INTO matches (id, donation_id, ngo_id, match_score, distance, urgency_score, reasons, factors_json, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET
        match_score = excluded.match_score,
        distance = excluded.distance,
        urgency_score = excluded.urgency_score,
        reasons = excluded.reasons,
        factors_json = excluded.factors_json
    `).run(
      id,
      data.donationId,
      data.ngoId,
      data.matchScore,
      data.distance,
      data.urgencyScore,
      reasonsStr,
      factorsStr
    );

    return {
      id,
      donationId: data.donationId,
      ngoId: data.ngoId,
      matchScore: data.matchScore,
      distance: data.distance,
      urgencyScore: data.urgencyScore,
      reasons: data.reasons || [],
      factorsJson: data.factorsJson,
      status: "pending",
      createdAt: new Date().toISOString(),
    };
  }

  static saveBatchMatches(matches: NGOMatchResult[]): number {
    const db = getDb();
    let count = 0;

    const upsertStmt = db.prepare(`
      INSERT INTO matches (id, donation_id, ngo_id, match_score, distance, urgency_score, reasons, factors_json, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET
        match_score = excluded.match_score,
        distance = excluded.distance,
        urgency_score = excluded.urgency_score,
        reasons = excluded.reasons,
        factors_json = excluded.factors_json
    `);

    const transaction = db.transaction((items: NGOMatchResult[]) => {
      for (const item of items) {
        const id = item.id || `mat_${item.donationId}_${item.ngoId}`;
        const reasonsStr = JSON.stringify(item.reasons || []);
        const factorsStr = JSON.stringify(item.factors || {});

        upsertStmt.run(
          id,
          item.donationId,
          item.ngoId,
          item.matchScore,
          item.distanceKm,
          item.urgencyScore,
          reasonsStr,
          factorsStr
        );
        count++;
      }
    });

    transaction(matches);
    return count;
  }

  static getMatchesForDonation(donationId: string): MatchRecord[] {
    const db = getDb();
    const rows = db
      .prepare(`
        SELECT m.*, 
               np.organization_name, np.contact_person, np.address as ngo_address, np.capacity,
               u.phone as ngo_phone
        FROM matches m
        JOIN ngo_profiles np ON m.ngo_id = np.id
        LEFT JOIN users u ON np.user_id = u.id
        WHERE m.donation_id = ?
        ORDER BY m.match_score DESC
      `)
      .all(donationId) as any[];

    return rows.map((r) => {
      let reasons: string[] = [];
      try {
        reasons = JSON.parse(r.reasons || "[]");
      } catch {
        reasons = [];
      }
      let factorsJson: Record<string, number> = {};
      try {
        factorsJson = JSON.parse(r.factors_json || "{}");
      } catch {
        factorsJson = {};
      }

      return {
        id: r.id,
        donationId: r.donation_id,
        ngoId: r.ngo_id,
        matchScore: r.match_score,
        distance: r.distance,
        urgencyScore: r.urgency_score,
        reasons,
        factorsJson,
        status: r.status,
        createdAt: r.created_at,
        ngoDetails: {
          organizationName: r.organization_name,
          contactPerson: r.contact_person,
          phone: r.ngo_phone || "",
          address: r.ngo_address,
          capacity: r.capacity,
        },
      };
    });
  }

  static getMatchesForNgo(ngoId: string): MatchRecord[] {
    const db = getDb();
    const rows = db
      .prepare(`
        SELECT m.*, 
               fd.food_name, fd.quantity, fd.servings, fd.category, fd.pickup_address, fd.available_until
        FROM matches m
        JOIN food_donations fd ON m.donation_id = fd.id
        WHERE m.ngo_id = ?
        ORDER BY m.match_score DESC
      `)
      .all(ngoId) as any[];

    return rows.map((r) => {
      let reasons: string[] = [];
      try {
        reasons = JSON.parse(r.reasons || "[]");
      } catch {
        reasons = [];
      }
      let factorsJson: Record<string, number> = {};
      try {
        factorsJson = JSON.parse(r.factors_json || "{}");
      } catch {
        factorsJson = {};
      }

      return {
        id: r.id,
        donationId: r.donation_id,
        ngoId: r.ngo_id,
        matchScore: r.match_score,
        distance: r.distance,
        urgencyScore: r.urgency_score,
        reasons,
        factorsJson,
        status: r.status,
        createdAt: r.created_at,
        donationDetails: {
          foodName: r.food_name,
          quantity: r.quantity,
          servings: r.servings,
          category: r.category,
          pickupAddress: r.pickup_address,
          availableUntil: r.available_until,
        },
      };
    });
  }

  static updateMatchStatus(id: string, status: "pending" | "accepted" | "rejected" | "expired"): boolean {
    const db = getDb();
    const res = db.prepare("UPDATE matches SET status = ? WHERE id = ?").run(status, id);
    return res.changes > 0;
  }
}
