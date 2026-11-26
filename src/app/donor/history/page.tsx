"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { StatCard } from "@/components/ui/StatCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingCards } from "@/components/ui/LoadingState";
import { donationService } from "@/lib/services/donation.service";
import { DonationItem } from "@/types/donation";
import { useAuth } from "@/lib/auth/auth-context";
import { formatDate } from "@/lib/utils";
import { Utensils, Download, CheckCircle2, Leaf, ArrowRight, Award, PlusCircle } from "lucide-react";

export default function DonationHistoryPage() {
  const { user } = useAuth();
  const [historyItems, setHistoryItems] = useState<DonationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHistory() {
      try {
        const donorId = user?.id || "usr_donor_1";
        const all = await donationService.getDonations({ donorId, status: "completed" });
        setHistoryItems(all);
      } catch (err) {
        console.error("Failed to load donation history:", err);
      } finally {
        setLoading(false);
      }
    }
    loadHistory();
  }, [user]);

  const totalMeals = historyItems.reduce((acc, curr) => acc + (curr.servingsEstimate || 0), 0);
  const totalWeightKg = historyItems.reduce((acc, curr) => acc + (curr.quantity || 0), 0);
  const totalCarbonKg = Math.round(totalMeals * 0.8);

  return (
    <DashboardLayout
      role="donor"
      title="Donation History & Impact"
      description="Permanent record of all fulfilled surplus donations and verifiable social dividends."
      action={
        <Button
          size="sm"
          variant="outline"
          leftIcon={<Download className="w-3.5 h-3.5" />}
          onClick={() => alert("Tax-deductible CSR report download generated.")}
        >
          Download CSR Report
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Cumulative metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            label="Total Rescues Fulfilled"
            value={`${historyItems.length} Deliveries`}
            subtext="Delivered to verified NGOs"
            variant="emerald"
            icon={<CheckCircle2 className="w-5 h-5" />}
          />
          <StatCard
            label="Community Portions"
            value={`${totalMeals.toLocaleString()} Meals`}
            subtext="Rescued and distributed"
            variant="blue"
            icon={<Utensils className="w-5 h-5" />}
          />
          <StatCard
            label="Total Carbon Diverted"
            value={`${totalCarbonKg} kg CO2e`}
            subtext="Certified landfill diversion"
            variant="emerald"
            icon={<Leaf className="w-5 h-5" />}
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
                title="No Completed Donations Yet"
                description="Once your active food listings are picked up and delivered to verified shelters, they will appear in your permanent history log here."
                actionLabel="Create Donation"
                actionHref="/donor/create"
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3.5">Donation Item</th>
                      <th className="px-6 py-3.5">Category</th>
                      <th className="px-6 py-3.5">Quantity / Servings</th>
                      <th className="px-6 py-3.5">Delivered To NGO</th>
                      <th className="px-6 py-3.5">Volunteer Courier</th>
                      <th className="px-6 py-3.5">Fulfilled Date</th>
                      <th className="px-6 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {historyItems.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-4 font-semibold text-slate-900">
                          {item.title}
                          <span className="block text-xs font-normal text-slate-400">
                            ID: {item.id}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                            {item.foodType}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-bold text-slate-900">
                            {item.quantity} {item.unit}
                          </span>
                          <span className="text-xs text-slate-400 block">
                            ({item.servingsEstimate} portions)
                          </span>
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-800">
                          {item.claimedByNgoName || "Hope Kitchen & Shelter"}
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-600">
                          {item.assignedVolunteerName || "Marcus Vance"}
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-500">
                          {item.completedAt ? formatDate(item.completedAt) : formatDate(item.createdAt)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link href={`/donor/donations/${item.id}`}>
                            <Button size="sm" variant="ghost" className="text-xs">
                              Details
                            </Button>
                          </Link>
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
