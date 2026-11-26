"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { ngoService } from "@/lib/services/ngo.service";
import { FoodRequest } from "@/types/ngo";
import { useAuth } from "@/lib/auth/auth-context";
import { PlusCircle, ClipboardList, Clock, CheckCircle2, AlertCircle } from "lucide-react";

export default function FoodRequestsPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<FoodRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [foodTypeNeeded, setFoodTypeNeeded] = useState("Cooked Meals");
  const [servingsRequired, setServingsRequired] = useState(50);
  const [urgency, setUrgency] = useState<"urgent" | "standard">("urgent");
  const [neededBy, setNeededBy] = useState("Today, 6:00 PM");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    async function fetchRequests() {
      try {
        const data = await ngoService.getFoodRequests();
        setRequests(data);
      } finally {
        setLoading(false);
      }
    }
    fetchRequests();
  }, []);

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    const newReq = await ngoService.createFoodRequest({
      ngoId: user?.id || "usr_ngo_1",
      ngoName: user?.organizationName || "Hope Kitchen & Shelter",
      foodTypeNeeded,
      servingsRequired: Number(servingsRequired),
      urgency,
      neededBy,
      location: user?.address.street || "782 Mission Blvd",
      notes,
    });
    setRequests([newReq, ...requests]);
    setIsModalOpen(false);
  };

  return (
    <DashboardLayout
      role="ngo"
      title="Food Requirements & Requests"
      description="Broadcast your shelter's specific daily food needs to commercial donors in advance."
      action={
        <Button
          size="sm"
          leftIcon={<PlusCircle className="w-4 h-4" />}
          onClick={() => setIsModalOpen(true)}
        >
          Create Food Request
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Intro Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-blue-900">
              Need specific ingredients or prepared dinners tonight?
            </h3>
            <p className="text-xs text-blue-700 max-w-xl leading-relaxed">
              Listing your required portion count helps caterers, hotels, and university canteens
              route their end-of-shift surpluses directly to your facility.
            </p>
          </div>
          <Button
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white shrink-0"
            onClick={() => setIsModalOpen(true)}
          >
            Post Daily Need
          </Button>
        </div>

        {/* Requests List */}
        {requests.length === 0 ? (
          <EmptyState
            title="No Active Food Requests"
            description="You have not posted any food requests yet. Create a request to inform donors of your specific portion requirements."
            actionLabel="Create Food Request"
            onAction={() => setIsModalOpen(true)}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {requests.map((req) => (
              <Card key={req.id}>
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <Badge
                      variant={req.urgency === "urgent" ? "danger" : "info"}
                      size="sm"
                      dot
                    >
                      {req.urgency} requirement
                    </Badge>
                    <span className="text-xs font-semibold text-slate-500">
                      Target: {req.neededBy}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{req.foodTypeNeeded}</h3>
                    <p className="text-sm font-semibold text-emerald-700 mt-0.5">
                      {req.servingsRequired} Portions Needed
                    </p>
                  </div>

                  {req.notes && (
                    <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      {req.notes}
                    </p>
                  )}

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span>Location: {req.location}</span>
                    <Badge variant={req.status === "open" ? "success" : "neutral"} size="sm">
                      {req.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Modal: Create Food Request */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Create Food Requirement"
          description="Alert nearby food donors about what your shelter needs"
        >
          <form onSubmit={handleCreateRequest} className="space-y-4">
            <Select
              label="Food Type Needed"
              value={foodTypeNeeded}
              onChange={(e) => setFoodTypeNeeded(e.target.value)}
              options={[
                { value: "Cooked meals", label: "Cooked meals (Dinner / Lunch trays)" },
                { value: "Rice", label: "Rice & Grains" },
                { value: "Bread/roti", label: "Bread / Roti" },
                { value: "Fruits", label: "Fresh Fruits" },
                { value: "Vegetables", label: "Fresh Vegetables" },
                { value: "Bakery", label: "Bakery & Bread" },
                { value: "Packaged food", label: "Packaged Food & Canned Goods" },
                { value: "Other", label: "Other" },
              ]}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Portions Needed"
                type="number"
                min={5}
                value={servingsRequired}
                onChange={(e) => setServingsRequired(Number(e.target.value))}
                required
              />
              <Select
                label="Urgency"
                value={urgency}
                onChange={(e) => setUrgency(e.target.value as any)}
                options={[
                  { value: "urgent", label: "Urgent (Within 4 hours)" },
                  { value: "standard", label: "Standard (Scheduled Daily)" },
                ]}
              />
            </div>

            <Input
              label="Needed By Date/Time"
              value={neededBy}
              onChange={(e) => setNeededBy(e.target.value)}
              placeholder="e.g. Today, 7:00 PM"
              required
            />

            <Textarea
              label="Notes for Donors"
              placeholder="e.g. For our nightly soup kitchen serving 60 unhoused residents."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm">
                Publish Food Request
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </DashboardLayout>
  );
}
