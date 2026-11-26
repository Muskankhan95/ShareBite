"use client";

import React, { useState } from "react";
import { NGOMatchResult } from "@/lib/matching/types";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  Building2,
  MapPin,
  Clock,
  Users,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Phone,
  BarChart2,
} from "lucide-react";

interface NgoMatchCardProps {
  match: NGOMatchResult;
  onSelect?: (match: NGOMatchResult) => void;
  isActionLoading?: boolean;
}

export default function NgoMatchCard({
  match,
  onSelect,
  isActionLoading = false,
}: NgoMatchCardProps) {
  const [showFactorBreakdown, setShowFactorBreakdown] = useState(false);

  // Determine score badge color
  const getScoreTheme = (score: number) => {
    if (score >= 85) return { bg: "bg-emerald-500", text: "text-emerald-700", ring: "ring-emerald-500/20", light: "bg-emerald-50 text-emerald-800 border-emerald-200" };
    if (score >= 70) return { bg: "bg-teal-500", text: "text-teal-700", ring: "ring-teal-500/20", light: "bg-teal-50 text-teal-800 border-teal-200" };
    if (score >= 50) return { bg: "bg-amber-500", text: "text-amber-700", ring: "ring-amber-500/20", light: "bg-amber-50 text-amber-800 border-amber-200" };
    return { bg: "bg-rose-500", text: "text-rose-700", ring: "ring-rose-500/20", light: "bg-rose-50 text-rose-800 border-rose-200" };
  };

  const theme = getScoreTheme(match.matchScore);

  return (
    <Card className="hover:shadow-md transition-shadow border-slate-200 overflow-hidden">
      <div className="bg-slate-50/80 px-4 py-3 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-sm">{match.organizationName}</h4>
            <p className="text-xs text-slate-500 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-slate-400" />
              {match.address}
            </p>
          </div>
        </div>

        {/* Match Score Badge */}
        <div className="flex items-center gap-2">
          <div className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${theme.light}`}>
            <Sparkles className="w-3.5 h-3.5" />
            <span>{match.matchScore}% Match</span>
          </div>
        </div>
      </div>

      <CardContent className="p-4 space-y-3.5">
        {/* Quick metrics row */}
        <div className="grid grid-cols-3 gap-2 py-2 px-3 bg-slate-50 rounded-lg text-xs">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Distance</span>
            <span className="font-bold text-slate-800">{match.distanceKm.toFixed(1)} km</span>
            <span className="text-[10px] text-slate-500 block">({match.distanceMiles.toFixed(1)} mi)</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Capacity</span>
            <span className="font-bold text-slate-800">{match.capacity} portions</span>
            <span className="text-[10px] text-slate-500 block">max daily</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Urgency</span>
            <span className={`font-bold capitalize ${match.urgencyLevel === "critical" ? "text-rose-600 font-extrabold" : "text-amber-600"}`}>
              {match.urgencyLevel}
            </span>
            <span className="text-[10px] text-slate-500 block">{match.minutesRemaining}m left</span>
          </div>
        </div>

        {/* Explainability: "Recommended because" */}
        <div className="space-y-1.5">
          <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Recommended because:
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

        {/* Warnings / Cautions if any */}
        {match.warnings && match.warnings.length > 0 && (
          <div className="p-2.5 rounded-lg bg-amber-50/80 border border-amber-200 text-xs text-amber-900 space-y-1">
            {match.warnings.map((warning, idx) => (
              <p key={idx} className="flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>{warning}</span>
              </p>
            ))}
          </div>
        )}

        {/* Collapsible Factor Breakdown */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowFactorBreakdown(!showFactorBreakdown)}
            className="text-[11px] text-slate-500 hover:text-slate-800 font-medium flex items-center gap-1 transition-colors"
          >
            <BarChart2 className="w-3 h-3" />
            <span>{showFactorBreakdown ? "Hide factor breakdown" : "View transparent factor scoring (100% weight)"}</span>
            {showFactorBreakdown ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          {showFactorBreakdown && (
            <div className="mt-2.5 p-3 rounded-lg bg-slate-100/70 border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between items-center text-slate-600">
                <span>Distance (30% weight)</span>
                <span className="font-semibold text-slate-900">{match.factors.distanceScore}/100</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-1.5">
                <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${match.factors.distanceScore}%` }} />
              </div>

              <div className="flex justify-between items-center text-slate-600">
                <span>Time Urgency (25% weight)</span>
                <span className="font-semibold text-slate-900">{match.factors.urgencyScore}/100</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-1.5">
                <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: `${match.factors.urgencyScore}%` }} />
              </div>

              <div className="flex justify-between items-center text-slate-600">
                <span>Capacity Compatibility (20% weight)</span>
                <span className="font-semibold text-slate-900">{match.factors.capacityScore}/100</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-1.5">
                <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${match.factors.capacityScore}%` }} />
              </div>

              <div className="flex justify-between items-center text-slate-600">
                <span>Food Preference (15% weight)</span>
                <span className="font-semibold text-slate-900">{match.factors.preferenceScore}/100</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-1.5">
                <div className="bg-purple-500 h-1.5 rounded-full" style={{ width: `${match.factors.preferenceScore}%` }} />
              </div>

              <div className="flex justify-between items-center text-slate-600">
                <span>Partner Availability (10% weight)</span>
                <span className="font-semibold text-slate-900">{match.factors.availabilityScore}/100</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-1.5">
                <div className="bg-emerald-600 h-1.5 rounded-full" style={{ width: `${match.factors.availabilityScore}%` }} />
              </div>
            </div>
          )}
        </div>

        {/* Action Button */}
        {onSelect && (
          <div className="pt-2">
            <Button
              className="w-full"
              size="sm"
              disabled={isActionLoading || !match.isEligible}
              onClick={() => onSelect(match)}
              leftIcon={<CheckCircle2 className="w-4 h-4" />}
            >
              {match.isEligible ? "Select & Connect NGO" : "Verification Incomplete"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
