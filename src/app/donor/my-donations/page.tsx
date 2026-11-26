"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DonationCard } from "@/components/shared/DonationCard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingCards } from "@/components/ui/LoadingState";
import { donationService } from "@/lib/services/donation.service";
import { DonationItem } from "@/types/donation";
import { useAuth } from "@/lib/auth/auth-context";
import { PlusCircle, Search, Filter, RefreshCw } from "lucide-react";

export default function MyDonationsPage() {
  const { user } = useAuth();
  const [donations, setDonations] = useState<DonationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filterTabs = [
    { id: "all", label: "All Listings" },
    { id: "active", label: "Active" },
    { id: "pending", label: "Pending" },
    { id: "matched", label: "Matched" },
    { id: "completed", label: "Completed" },
    { id: "expired", label: "Expired" },
    { id: "cancelled", label: "Cancelled" },
  ];

  const fetchDonations = async () => {
    setLoading(true);
    try {
      const donorId = user?.id || "usr_donor_1";
      const data = await donationService.getDonations({
        donorId,
        status: selectedFilter !== "all" ? selectedFilter : undefined,
      });
      setDonations(data);
    } catch (err) {
      console.error("Failed to fetch donor listings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDonations();
  }, [user, selectedFilter]);

  const filteredDonations = donations.filter((d) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      d.title.toLowerCase().includes(q) ||
      d.foodType.toLowerCase().includes(q) ||
      (d.description && d.description.toLowerCase().includes(q)) ||
      (d.claimedByNgoName && d.claimedByNgoName.toLowerCase().includes(q))
    );
  });

  return (
    <DashboardLayout
      role="donor"
      title="My Food Donations"
      description="Track, update, and manage all your active and historical food surplus listings."
      action={
        <Link href="/donor/create">
          <Button size="sm" leftIcon={<PlusCircle className="w-4 h-4" />}>
            Create Donation
          </Button>
        </Link>
      }
    >
      <div className="space-y-6">
        {/* Controls: Search, Filter Tabs, and Refresh */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {filterTabs.map((tab) => {
              const isActive = selectedFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedFilter(tab.id)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                    isActive
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <div className="w-full md:w-64">
              <Input
                placeholder="Search food, category, NGO..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search className="w-4 h-4" />}
              />
            </div>
            <button
              onClick={() => fetchDonations()}
              className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Listings Grid */}
        {loading ? (
          <LoadingCards count={6} />
        ) : filteredDonations.length === 0 ? (
          <EmptyState
            title={`No ${selectedFilter === "all" ? "" : selectedFilter} Donations Found`}
            description={
              searchQuery
                ? `No listings matched your search "${searchQuery}". Try a different keyword.`
                : selectedFilter === "all"
                ? "You haven't posted any food surplus listings yet. Create your first donation to connect with local charities."
                : `You currently have no donations in the "${selectedFilter}" state.`
            }
            actionLabel="Create Food Donation"
            actionHref="/donor/create"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredDonations.map((donation) => (
              <DonationCard key={donation.id} donation={donation} viewMode="donor" />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
