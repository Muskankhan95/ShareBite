import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Building2,
  CheckCircle2,
  XCircle,
  Clock,
  Phone,
  MapPin,
  User,
  ShieldAlert,
  Loader2,
  Search,
  Check,
  X,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/page-header";
import { StatusBadge } from "@/components/common/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { listAdminNgos, setNgoVerification } from "@/lib/data.functions";

export const Route = createFileRoute("/_authenticated/admin/ngos")({
  head: () => ({
    meta: [
      { title: "NGO Verification Queue — ShareBite Admin" },
      { name: "description", content: "Review and approve registered nonprofit organizations." },
    ],
  }),
  component: AdminNgos,
});

function AdminNgos() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<string>("pending");
  const [search, setSearch] = useState("");

  const { data: ngos = [], isLoading } = useQuery({
    queryKey: ["adminNgos"],
    queryFn: () => listAdminNgos(),
  });

  const verifyMutation = useMutation({
    mutationFn: (vars: { userId: string; status: "pending" | "verified" | "rejected" }) =>
      setNgoVerification({ data: vars }),
    onSuccess: (_, vars) => {
      toast.success(`NGO status updated to ${vars.status.toUpperCase()}`);
      queryClient.invalidateQueries({ queryKey: ["adminNgos"] });
      queryClient.invalidateQueries({ queryKey: ["adminStats"] });
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Failed to update verification status");
    },
  });

  const filteredNgos = useMemo(() => {
    return ngos.filter((ngo) => {
      if (activeTab !== "all" && ngo.verification_status !== activeTab) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const nameMatch = ngo.organization_name.toLowerCase().includes(q);
        const contactMatch = ngo.contact_person?.toLowerCase().includes(q) ?? false;
        const addressMatch = ngo.address.toLowerCase().includes(q);
        return nameMatch || contactMatch || addressMatch;
      }
      return true;
    });
  }, [ngos, activeTab, search]);

  const counts = useMemo(() => {
    const p = ngos.filter((n) => n.verification_status === "pending").length;
    const v = ngos.filter((n) => n.verification_status === "verified").length;
    const r = ngos.filter((n) => n.verification_status === "rejected").length;
    return { all: ngos.length, pending: p, verified: v, rejected: r };
  }, [ngos]);

  return (
    <>
      <PageHeader
        title="NGO Verification Queue"
        description="Verify legitimate nonprofit partners to ensure surplus food is safely and equitably redistributed."
        actions={
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-700 dark:text-amber-400">
              {counts.pending} Awaiting Review
            </span>
          </div>
        }
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 sm:w-96">
            <TabsTrigger value="pending">Pending ({counts.pending})</TabsTrigger>
            <TabsTrigger value="verified">Verified ({counts.verified})</TabsTrigger>
            <TabsTrigger value="rejected">Rejected ({counts.rejected})</TabsTrigger>
            <TabsTrigger value="all">All ({counts.all})</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search organizations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex min-h-64 items-center justify-center">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      ) : filteredNgos.length === 0 ? (
        <Card className="border-border/70 p-12 text-center shadow-[var(--shadow-card)]">
          <div className="size-14 rounded-full bg-primary/10 mx-auto flex items-center justify-center mb-4">
            <Building2 className="size-7 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">
            No {activeTab === "all" ? "" : activeTab} organizations found
          </h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
            {activeTab === "pending"
              ? "All pending NGO verification submissions have been reviewed."
              : "No organization profiles match your current filter."}
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredNgos.map((ngo) => {
            const profile = ngo.profiles;
            const isPending = ngo.verification_status === "pending";

            return (
              <Card
                key={ngo.id}
                className="border-border/70 shadow-[var(--shadow-card)] hover:border-primary/40 transition-all"
              >
                <CardContent className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-bold text-foreground">
                          {ngo.organization_name}
                        </h4>
                        <StatusBadge status={ngo.verification_status} />
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        {ngo.contact_person && (
                          <span className="flex items-center gap-1 font-semibold text-foreground">
                            <User className="size-3.5 text-primary" />
                            Contact: {ngo.contact_person}
                          </span>
                        )}

                        {profile?.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="size-3.5" />
                            {profile.phone}
                          </span>
                        )}

                        {ngo.capacity && (
                          <span>Daily Capacity: ~{ngo.capacity} meals</span>
                        )}

                        <span className="flex items-center gap-1">
                          <Clock className="size-3.5" />
                          Registered on {new Date(ngo.created_at).toLocaleDateString([], {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </div>

                      <div className="flex items-start gap-1.5 text-xs text-muted-foreground pt-1">
                        <MapPin className="size-3.5 text-primary shrink-0 mt-0.5" />
                        <span>Facility Address: {ngo.address}</span>
                      </div>

                      {ngo.description && (
                        <p className="text-xs text-muted-foreground bg-muted/30 p-2.5 rounded-lg border border-border/40">
                          {ngo.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      {ngo.verification_status !== "verified" && (
                        <Button
                          size="sm"
                          variant="hero"
                          disabled={verifyMutation.isPending}
                          onClick={() =>
                            verifyMutation.mutate({ userId: ngo.user_id, status: "verified" })
                          }
                        >
                          <Check className="size-3.5 mr-1" />
                          Verify NGO
                        </Button>
                      )}

                      {ngo.verification_status !== "rejected" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-destructive hover:bg-destructive/10"
                          disabled={verifyMutation.isPending}
                          onClick={() =>
                            verifyMutation.mutate({ userId: ngo.user_id, status: "rejected" })
                          }
                        >
                          <X className="size-3.5 mr-1" />
                          Reject
                        </Button>
                      )}

                      {!isPending && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-muted-foreground"
                          disabled={verifyMutation.isPending}
                          onClick={() =>
                            verifyMutation.mutate({ userId: ngo.user_id, status: "pending" })
                          }
                        >
                          <RotateCcw className="size-3.5 mr-1" />
                          Reset
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
