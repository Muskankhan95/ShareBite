"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Select, Input, Textarea } from "@/components/ui/Input";
import { LoadingCards } from "@/components/ui/LoadingState";
import { adminService } from "@/lib/services/admin.service";
import { FlaggedReport, ReportCategory, ReportStatus } from "@/types/report";
import {
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  RotateCw,
  Filter,
  PlusCircle,
  X,
  FileText,
  AlertCircle,
  Search,
} from "lucide-react";

export default function AdminReportsPage() {
  const [reports, setReports] = useState<FlaggedReport[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");

  // Status Update Modal
  const [editingReport, setEditingReport] = useState<FlaggedReport | null>(null);
  const [newStatus, setNewStatus] = useState<ReportStatus>("investigating");
  const [adminNotes, setAdminNotes] = useState("");

  // Create Report Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createTitle, setCreateTitle] = useState("");
  const [createCategory, setCreateCategory] = useState<ReportCategory>("food_safety_concern");
  const [createEntityType, setCreateEntityType] = useState<"donation" | "ngo" | "donor" | "volunteer" | "other">("donation");
  const [createDescription, setCreateDescription] = useState("");
  const [createSeverity, setCreateSeverity] = useState<"low" | "medium" | "high" | "critical">("medium");

  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const loadReports = async () => {
    try {
      setLoading(true);
      const data = await adminService.getReports({
        category: categoryFilter !== "all" ? categoryFilter : undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        severity: severityFilter !== "all" ? severityFilter : undefined,
      });
      setReports(data);
    } catch (err: any) {
      console.error("Failed to load reports:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [categoryFilter, statusFilter, severityFilter]);

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReport) return;

    try {
      setActionError(null);
      await adminService.updateReportStatus(editingReport.id, newStatus, adminNotes);
      setActionSuccess(`Report "${editingReport.reportedTitle}" status updated to ${newStatus}.`);
      setTimeout(() => setActionSuccess(null), 3500);
      setEditingReport(null);
      setAdminNotes("");
      await loadReports();
    } catch (err: any) {
      setActionError(err.message || "Failed to update report status.");
    }
  };

  const handleCreateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setActionError(null);
      await adminService.createReport({
        reporterId: "usr_donor_1",
        reportedTitle: createTitle,
        category: createCategory,
        reportedEntityType: createEntityType,
        description: createDescription,
        severity: createSeverity,
      });
      setActionSuccess("New incident report logged successfully.");
      setTimeout(() => setActionSuccess(null), 3500);
      setShowCreateModal(false);
      setCreateTitle("");
      setCreateDescription("");
      await loadReports();
    } catch (err: any) {
      setActionError(err.message || "Failed to log report.");
    }
  };

  const openTicketsCount = reports.filter((r) => r.status === "open").length;
  const investigatingCount = reports.filter((r) => r.status === "investigating").length;
  const resolvedCount = reports.filter((r) => r.status === "resolved").length;

  return (
    <DashboardLayout
      role="admin"
      title="Incident & Participant Safety Reporting"
      description="Quality assurance governance, food packaging concerns, fake organization audits, and dispute resolution."
      action={
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={loadReports}
            leftIcon={<RotateCw className="w-3.5 h-3.5" />}
          >
            Refresh
          </Button>
          <Button
            size="sm"
            variant="primary"
            onClick={() => setShowCreateModal(true)}
            leftIcon={<PlusCircle className="w-4 h-4" />}
          >
            Log New Report
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Status Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-rose-50 p-4 rounded-xl border border-rose-200">
            <span className="text-xs font-semibold text-rose-800 uppercase">Open Unassigned Tickets</span>
            <p className="text-2xl font-bold text-rose-950 mt-1">{openTicketsCount} Reports</p>
          </div>
          <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
            <span className="text-xs font-semibold text-amber-800 uppercase">Active Inquiries</span>
            <p className="text-2xl font-bold text-amber-950 mt-1">{investigatingCount} Investigating</p>
          </div>
          <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200">
            <span className="text-xs font-semibold text-emerald-800 uppercase">Resolved Disputes</span>
            <p className="text-2xl font-bold text-emerald-950 mt-1">{resolvedCount} Closed</p>
          </div>
        </div>

        {/* Feedback Messages */}
        {actionError && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{actionError}</span>
            </div>
            <button onClick={() => setActionError(null)} className="text-rose-600 font-bold hover:underline">
              Dismiss
            </button>
          </div>
        )}

        {actionSuccess && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {/* Filters Bar */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="w-52">
              <Select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                options={[
                  { value: "all", label: "All Categories" },
                  { value: "incorrect_donation", label: "Incorrect Donation" },
                  { value: "food_safety_concern", label: "Food Safety Concern" },
                  { value: "fake_organization", label: "Fake Organization" },
                  { value: "volunteer_issue", label: "Volunteer Issue" },
                  { value: "other", label: "Other Inquiries" },
                ]}
              />
            </div>

            <div className="w-40">
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={[
                  { value: "all", label: "All Statuses" },
                  { value: "open", label: "Open" },
                  { value: "investigating", label: "Investigating" },
                  { value: "resolved", label: "Resolved" },
                  { value: "dismissed", label: "Dismissed" },
                ]}
              />
            </div>

            <div className="w-36">
              <Select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                options={[
                  { value: "all", label: "All Severities" },
                  { value: "critical", label: "Critical" },
                  { value: "high", label: "High" },
                  { value: "medium", label: "Medium" },
                  { value: "low", label: "Low" },
                ]}
              />
            </div>
          </div>
        </div>

        {/* Reports List */}
        {loading ? (
          <LoadingCards count={3} />
        ) : reports.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center text-slate-500">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="font-semibold text-slate-900">No Incident Reports</p>
              <p className="text-xs mt-1">No open or investigated tickets match your selected filters.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <Card key={report.id} className="border-slate-200">
                <CardContent className="p-6 space-y-3">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge
                        variant={
                          report.severity === "critical" || report.severity === "high"
                            ? "danger"
                            : report.severity === "medium"
                            ? "warning"
                            : "neutral"
                        }
                        size="sm"
                      >
                        {report.severity} severity
                      </Badge>

                      <Badge variant="info" size="sm">
                        {report.category.replace(/_/g, " ")}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          report.status === "resolved"
                            ? "success"
                            : report.status === "investigating"
                            ? "warning"
                            : report.status === "dismissed"
                            ? "neutral"
                            : "danger"
                        }
                        size="sm"
                        dot
                      >
                        {report.status}
                      </Badge>

                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs"
                        onClick={() => {
                          setEditingReport(report);
                          setNewStatus(report.status);
                          setAdminNotes(report.adminNotes || "");
                        }}
                      >
                        Update Ticket
                      </Button>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{report.reportedTitle}</h3>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{report.description}</p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-500 flex flex-wrap items-center justify-between gap-2">
                    <span>
                      Reported by: <strong className="text-slate-800">{report.reportedBy || "Platform User"}</strong> ({report.reportedRole || "Member"})
                    </span>
                    <span>
                      Entity Type: <strong className="text-slate-800 capitalize">{report.reportedEntityType}</strong>
                    </span>
                    <span>Logged: {new Date(report.createdAt).toLocaleString()}</span>
                  </div>

                  {report.adminNotes && (
                    <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-900">
                      <strong>Admin Resolution Note:</strong> {report.adminNotes}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Update Report Status Modal */}
        {editingReport && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-lg bg-white shadow-xl">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 className="text-base font-bold text-slate-900">Review & Update Incident Status</h3>
                  <button onClick={() => setEditingReport(null)} className="p-1 text-slate-400 hover:text-slate-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                  <p className="font-bold text-slate-900">{editingReport.reportedTitle}</p>
                  <p>{editingReport.description}</p>
                </div>

                <form onSubmit={handleUpdateStatus} className="space-y-4">
                  <Select
                    label="Investigation Status"
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as any)}
                    options={[
                      { value: "open", label: "Open (Awaiting Review)" },
                      { value: "investigating", label: "Under Active Investigation" },
                      { value: "resolved", label: "Resolved (Action Taken)" },
                      { value: "dismissed", label: "Dismissed (Invalid / No Action Needed)" },
                    ]}
                  />

                  <Textarea
                    label="Compliance & Action Notes"
                    placeholder="Document audit steps taken, donor contacted, or warning issued."
                    rows={3}
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                  />

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <Button variant="outline" type="button" onClick={() => setEditingReport(null)}>
                      Cancel
                    </Button>
                    <Button type="submit" variant="primary">
                      Save Status
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Create Report Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-lg bg-white shadow-xl">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 className="text-base font-bold text-slate-900">Log Administrative Incident Report</h3>
                  <button onClick={() => setShowCreateModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleCreateReport} className="space-y-4">
                  <Input
                    label="Incident Title"
                    placeholder="e.g. Broken temperature seal on seafood donation"
                    required
                    value={createTitle}
                    onChange={(e) => setCreateTitle(e.target.value)}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Select
                      label="Report Category"
                      value={createCategory}
                      onChange={(e) => setCreateCategory(e.target.value as any)}
                      options={[
                        { value: "incorrect_donation", label: "Incorrect Donation" },
                        { value: "food_safety_concern", label: "Food Safety Concern" },
                        { value: "fake_organization", label: "Fake Organization" },
                        { value: "volunteer_issue", label: "Volunteer Issue" },
                        { value: "other", label: "Other" },
                      ]}
                    />

                    <Select
                      label="Severity"
                      value={createSeverity}
                      onChange={(e) => setCreateSeverity(e.target.value as any)}
                      options={[
                        { value: "low", label: "Low Severity" },
                        { value: "medium", label: "Medium Severity" },
                        { value: "high", label: "High Severity" },
                        { value: "critical", label: "Critical Severity" },
                      ]}
                    />
                  </div>

                  <Textarea
                    label="Incident Description & Evidence"
                    placeholder="Detailed explanation of the issue, participant involved, and timeline."
                    required
                    rows={3}
                    value={createDescription}
                    onChange={(e) => setCreateDescription(e.target.value)}
                  />

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <Button variant="outline" type="button" onClick={() => setShowCreateModal(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" variant="primary">
                      Log Incident
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
