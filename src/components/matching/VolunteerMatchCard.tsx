"use client";

import React from "react";
import { VolunteerMatchResult } from "@/lib/matching/types";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  Bike,
  Car,
  Truck,
  Footprints,
  MapPin,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  UserCheck,
} from "lucide-react";

interface VolunteerMatchCardProps {
  match: VolunteerMatchResult;
  onAssign?: (volunteerId: string) => void;
  isAssigning?: boolean;
}

export default function VolunteerMatchCard({
  match,
  onAssign,
  isAssigning = false,
}: VolunteerMatchCardProps) {
  const getVehicleIcon = (type: string) => {
    const lower = type.toLowerCase();
    if (lower.includes("bike")) return <Bike className="w-4 h-4 text-emerald-600" />;
    if (lower.includes("car")) return <Car className="w-4 h-4 text-blue-600" />;
    if (lower.includes("van") || lower.includes("truck")) return <Truck className="w-4 h-4 text-purple-600" />;
    return <Footprints className="w-4 h-4 text-amber-600" />;
  };

  const getScoreTheme = (score: number) => {
    if (score >= 85) return "bg-emerald-50 text-emerald-800 border-emerald-200";
    if (score >= 70) return "bg-teal-50 text-teal-800 border-teal-200";
    if (score >= 50) return "bg-amber-50 text-amber-800 border-amber-200";
    return "bg-rose-50 text-rose-800 border-rose-200";
  };

  return (
    <Card className="border-slate-200 hover:shadow-md transition-shadow overflow-hidden">
      <div className="bg-slate-50/80 px-4 py-3 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-sm border border-emerald-200">
            {match.volunteerName.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h4 className="font-bold text-slate-900 text-sm">{match.volunteerName}</h4>
              {match.verificationStatus === "verified" && (
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
              )}
            </div>
            <p className="text-xs text-slate-500 flex items-center gap-1.5">
              <span className="flex items-center gap-1">
                {getVehicleIcon(match.vehicleType)}
                <span>{match.vehicleType}</span>
              </span>
              <span>•</span>
              <span className="capitalize">{match.availabilityStatus}</span>
            </p>
          </div>
        </div>

        {/* Match Score */}
        <div className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${getScoreTheme(match.matchScore)}`}>
          <Sparkles className="w-3.5 h-3.5" />
          <span>{match.matchScore}% Match</span>
        </div>
      </div>

      <CardContent className="p-4 space-y-3">
        {/* Distance & Travel time banner */}
        <div className="grid grid-cols-2 gap-2 p-2.5 bg-slate-50 rounded-lg text-xs">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-400 block font-semibold">FROM PICKUP</span>
              <span className="font-bold text-slate-800">
                {match.distanceKm.toFixed(1)} km ({match.distanceMiles.toFixed(1)} mi)
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-400 block font-semibold">TRANSIT ESTIMATE</span>
              <span className="font-bold text-slate-800">~{match.estimatedTravelMinutes} mins</span>
            </div>
          </div>
        </div>

        {/* Explainable reasons */}
        <div className="space-y-1.5">
          <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Why this courier is recommended:
          </p>
          <ul className="space-y-1 pl-1">
            {match.reasons.map((reason, idx) => (
              <li key={idx} className="text-xs text-slate-600 flex items-start gap-1.5">
                <span className="text-emerald-600 font-bold shrink-0">•</span>
                <span>{reason.replace(/^✓\s*/, "")}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Warnings / Disqualification notes */}
        {match.warnings && match.warnings.length > 0 && (
          <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
            {match.warnings.map((w, idx) => (
              <p key={idx} className="flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>{w}</span>
              </p>
            ))}
          </div>
        )}

        {/* Action Button */}
        {onAssign && (
          <div className="pt-2">
            <Button
              className="w-full"
              size="sm"
              disabled={isAssigning || !match.isEligible}
              onClick={() => onAssign(match.volunteerId)}
              leftIcon={<UserCheck className="w-4 h-4" />}
            >
              {match.isEligible ? "Dispatch / Assign Courier" : "Courier Unavailable"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
