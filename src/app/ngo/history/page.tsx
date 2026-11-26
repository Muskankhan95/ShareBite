"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingCards } from "@/components/ui/LoadingState";
import { ngoService } from "@/lib/services/ngo.service";
import { DonationItem } from "@/types/donation";
import { useAuth } from "@/lib/auth/auth-context";
import { formatDate } from "@/lib/utils";
import { Utensils, CheckCircle2, Heart, Award, MapPin, Download } from "lucide-react";

export default function NGODonationHistoryPage() {
  const { user } = useAuth();
  const [historyItems, setHistoryItems] = useState<DonationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHistory() {
      try {
        const ngoUserId = user?.id || "usr_ngo_1";
        const items = await ngoService.getCompletedDonations(ngoUserId);
        setHistoryItems(items);
      } catch (err) {
        console.error("Failed to load NGO history:", err);
      } finally {
        setLoading(false);
      }
    }
    loadHistory();
  }, [user]);

  const totalMeals = historyItems.reduce((acc, curr) => acc + (curr.servingsEstimate || 0), 0);
  const uniqueDonors = new Set(historyItems.map((h) => h.donorName)).size;
  const estimatedCostSaved = totalMeals * 5.5; // ~$5.50 average cost saved per charitable meal

  return (
    <DashboardLayout
      role="ngo"
      title="NGO Distribution History"
      description="Historical log of surplus food received and safely distributed to community beneficiaries."
      action={
        <Button
          size="sm"
          variant="outline"
          leftIcon={<Download className="w-3.5 h-3.5" />}
          onClick={() => alert("Charitable food distribution audit report generated.")}
        >
          Download Audit Log
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Cumulative Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            label="Total Rescued Meals"
            value={`${totalMeals.toLocaleString()} Portions`}
            subtext="Distributed to shelter guests"
            variant="emerald"
            icon={<Utensils className="w-5 h-5" />}
          />
          <StatCard
            label="Kitchen Budget Saved"
            value={`$${Math.round(estimatedCostSaved).toLocaleString()}`}
            subtext="In food procurement costs"
            variant="blue"
            icon={<Award className="w-5 h-5" />}
          />
          <StatCard
            label="Active Donor Partners"
            value={`${uniqueDonors} Kitchens`}
            subtext="Regular surplus contributors"
            variant="amber"
            icon={<Heart className="w-5 h-5" />}
          />
        </div>

        {/* History Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6">
                <LoadingCards count={3} />
              </div>
            ) : historyItems.length === 0 ? (
              <EmptyState
                title="No Completed Food Receipts Yet"
                description="Once inbound food donations are delivered to your shelter and confirmed, they will be permanently logged here for reporting and compliance."
                actionLabel="Browse Available Food"
                actionHref="/ngo/nearby"
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3.5">Food Description</th>
                      <th className="px-6 py-3.5">Donor Establishment</th>
                      <th className="px-6 py-3.5">Portions Received</th>
                      <th className="px-6 py-3.5">Courier Volunteer</th>
                      <th className="px-6 py-3.5">Received Date</th>
                      <th className="px-6 py-3.5">Verification</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {historyItems.map((h) => (
                      <tr key={h.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-4 font-semibold text-slate-900">
                          {h.title}
                          <span className="block text-xs font-normal text-slate-400">
                            {h.foodType} • ID: {h.id}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-800">{h.donorName}</td>
                        <td className="px-6 py-4 font-bold text-emerald-700">
                          {h.servingsEstimate} servings
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-600">
                          {h.assignedVolunteerName || "Courier Volunteer"}
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-500">
                          {h.completedAt ? formatDate(h.completedAt) : formatDate(h.createdAt)}
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant="success" size="sm">
                            Verified Safe
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
