"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/Card";
import { Input, Select } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { LoadingTable } from "@/components/ui/LoadingState";
import { adminService } from "@/lib/services/admin.service";
import { AdminUserRecord } from "@/lib/db/repositories/admin.repo";
import { useAuth } from "@/lib/auth/auth-context";
import {
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  RotateCw,
  Power,
  Eye,
  X,
  UserCheck,
  UserX,
  ShieldCheck,
  Building2,
  Bike,
  Utensils,
} from "lucide-react";

export default function AdminUsersPage() {
  const { user: currentAdmin } = useAuth();
  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await adminService.getAllUsers({
        search: search || undefined,
        role: roleFilter !== "all" ? roleFilter : undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
      });
      setUsers(data);
    } catch (err: any) {
      console.error("Failed to load users:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [roleFilter, statusFilter, search]);

  const handleToggleStatus = async (targetUser: AdminUserRecord) => {
    const nextStatus = targetUser.status === "active" ? "suspended" : "active";
    const confirmMsg =
      nextStatus === "suspended"
        ? `Are you sure you want to deactivate ${targetUser.name}? Historical records will be safely preserved.`
        : `Reactivate ${targetUser.name}'s account?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      setActionError(null);
      await adminService.setUserStatus(targetUser.id, nextStatus);
      setActionSuccess(`User "${targetUser.name}" has been ${nextStatus === "active" ? "activated" : "deactivated"}.`);
      setTimeout(() => setActionSuccess(null), 3500);
      await loadUsers();
      if (selectedUser?.user?.id === targetUser.id) {
        setSelectedUser((prev: any) => ({
          ...prev,
          user: { ...prev.user, status: nextStatus },
        }));
      }
    } catch (err: any) {
      setActionError(err.message || "Failed to update user status.");
    }
  };

  const handleViewDetails = async (userId: string) => {
    try {
      setLoadingDetails(true);
      const details = await adminService.getUserDetails(userId);
      setSelectedUser(details);
    } catch (err: any) {
      setActionError("Failed to fetch user details.");
    } finally {
      setLoadingDetails(false);
    }
  };

  return (
    <DashboardLayout
      role="admin"
      title="User Management"
      description="View, search, filter, and govern platform participants. Soft deactivation preserves historical activity logs."
      action={
        <Button
          size="sm"
          variant="outline"
          onClick={loadUsers}
          leftIcon={<RotateCw className="w-3.5 h-3.5" />}
        >
          Refresh
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Action Alerts */}
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

        {/* Controls Bar */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="w-44">
              <Select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                options={[
                  { value: "all", label: "All Roles" },
                  { value: "donor", label: "Donors" },
                  { value: "ngo", label: "NGOs" },
                  { value: "volunteer", label: "Volunteers" },
                  { value: "admin", label: "Admins" },
                ]}
              />
            </div>

            <div className="w-40">
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={[
                  { value: "all", label: "All Statuses" },
                  { value: "active", label: "🟢 Active" },
                  { value: "suspended", label: "⚪ Deactivated / Suspended" },
                ]}
              />
            </div>
          </div>

          <div className="w-full sm:w-80">
            <Input
              placeholder="Search by name, email, organization..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search className="w-4 h-4 text-slate-400" />}
            />
          </div>
        </div>

        {/* Users Table */}
        {loading ? (
          <LoadingTable rows={6} />
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3.5">User Details</th>
                      <th className="px-6 py-3.5">Role</th>
                      <th className="px-6 py-3.5">Organization / Info</th>
                      <th className="px-6 py-3.5">Phone Contact</th>
                      <th className="px-6 py-3.5">Account Status</th>
                      <th className="px-6 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {users.map((u) => {
                      const isSelf = currentAdmin?.id === u.id;
                      const isActive = u.status === "active";

                      return (
                        <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                                  u.role === "admin"
                                    ? "bg-purple-100 text-purple-700"
                                    : u.role === "donor"
                                    ? "bg-emerald-100 text-emerald-700"
                                    : u.role === "ngo"
                                    ? "bg-blue-100 text-blue-700"
                                    : "bg-amber-100 text-amber-700"
                                }`}
                              >
                                {u.name[0]}
                              </div>
                              <div>
                                <span className="font-semibold text-slate-900 block">{u.name}</span>
                                <span className="text-xs text-slate-400">{u.email}</span>
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <Badge
                              variant={
                                u.role === "admin"
                                  ? "danger"
                                  : u.role === "donor"
                                  ? "success"
                                  : u.role === "ngo"
                                  ? "info"
                                  : "warning"
                              }
                              size="sm"
                            >
                              {u.role}
                            </Badge>
                          </td>

                          <td className="px-6 py-4 text-xs font-medium text-slate-800">
                            {u.organizationName ||
                              (u.vehicleType ? `${u.vehicleType} Courier` : "Individual")}
                          </td>

                          <td className="px-6 py-4 text-xs text-slate-600">{u.phone}</td>

                          <td className="px-6 py-4">
                            <Badge
                              variant={isActive ? "success" : "neutral"}
                              size="sm"
                              dot
                            >
                              {u.status}
                            </Badge>
                          </td>

                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-xs text-slate-600 hover:text-slate-900"
                                onClick={() => handleViewDetails(u.id)}
                              >
                                <Eye className="w-3.5 h-3.5 mr-1" /> Details
                              </Button>

                              <Button
                                size="sm"
                                variant={isActive ? "outline" : "primary"}
                                className={`text-xs ${
                                  isActive
                                    ? "text-rose-600 border-rose-200 hover:bg-rose-50"
                                    : ""
                                }`}
                                disabled={isSelf}
                                title={isSelf ? "Admins cannot deactivate their own account" : undefined}
                                onClick={() => handleToggleStatus(u)}
                              >
                                {isActive ? "Deactivate" : "Activate"}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* User Details Modal / Drawer */}
        {selectedUser && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-2xl bg-white shadow-xl max-h-[90vh] overflow-y-auto">
              <CardContent className="p-6 sm:p-8 space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
                      {selectedUser.user.name[0]}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">{selectedUser.user.name}</h3>
                      <p className="text-xs text-slate-500">ID: {selectedUser.user.id} • Registered {new Date(selectedUser.user.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedUser(null)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div>
                    <span className="font-semibold text-slate-500 block">Email</span>
                    <span className="font-medium text-slate-900">{selectedUser.user.email}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-500 block">Phone</span>
                    <span className="font-medium text-slate-900">{selectedUser.user.phone}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-500 block">Role</span>
                    <Badge variant="info" size="sm">{selectedUser.user.role}</Badge>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-500 block">Status</span>
                    <Badge variant={selectedUser.user.status === "active" ? "success" : "neutral"} size="sm">
                      {selectedUser.user.status}
                    </Badge>
                  </div>
                  {selectedUser.profile?.organization_name && (
                    <div className="col-span-2">
                      <span className="font-semibold text-slate-500 block">Organization</span>
                      <span className="font-medium text-slate-900">{selectedUser.profile.organization_name}</span>
                    </div>
                  )}
                  {selectedUser.profile?.address && (
                    <div className="col-span-2 sm:col-span-3">
                      <span className="font-semibold text-slate-500 block">Address on File</span>
                      <span className="text-slate-800">{selectedUser.profile.address}</span>
                    </div>
                  )}
                </div>

                {/* Role Specific Activity */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Recent Historical Activity
                  </h4>
                  {selectedUser.activity && selectedUser.activity.length > 0 ? (
                    <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden text-xs">
                      {selectedUser.activity.map((act: any) => (
                        <div key={act.id} className="p-3 bg-white flex items-center justify-between">
                          <div>
                            <p className="font-bold text-slate-900">{act.food_name || `Record #${act.id}`}</p>
                            <p className="text-slate-500">
                              {act.servings ? `${act.servings} servings` : ""} {act.status ? `• ${act.status}` : ""}
                            </p>
                          </div>
                          <Badge size="sm">{act.status || "Logged"}</Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic p-3 bg-slate-50 rounded-xl border border-slate-100">
                      No recent activity records found for this user.
                    </p>
                  )}
                </div>

                <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-900">
                  <span className="font-bold block">Soft Deactivation Policy:</span>
                  ShareBite never permanently purges historical donor or courier logs to ensure auditability of food distributions and regulatory compliance.
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <Button variant="outline" onClick={() => setSelectedUser(null)}>
                    Close
                  </Button>
                  <Button
                    variant={selectedUser.user.status === "active" ? "outline" : "primary"}
                    className={selectedUser.user.status === "active" ? "text-rose-600 border-rose-200" : ""}
                    disabled={currentAdmin?.id === selectedUser.user.id}
                    onClick={() => handleToggleStatus(selectedUser.user)}
                  >
                    {selectedUser.user.status === "active" ? "Deactivate User" : "Activate User"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
