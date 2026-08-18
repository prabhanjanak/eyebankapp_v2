import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ShieldAlert,
  Search,
  RefreshCw,
  Smartphone,
  Globe,
  Clock,
  User as UserIcon,
  CheckCircle2,
  AlertCircle,
  Truck,
  PhoneCall,
  LogIn,
  LogOut,
  Key,
  SlidersHorizontal,
  Download,
  Calendar,
  Layers,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDistanceToNow, format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

export default function AuditLogsPage() {
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [clientFilter, setClientFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch Audit Logs
  const {
    data: logsData,
    isLoading,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["audit-logs", page, search, actionFilter, clientFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "40",
      });
      if (search.trim()) params.append("search", search.trim());
      if (actionFilter !== "all") params.append("action", actionFilter);
      if (clientFilter !== "all") params.append("clientApp", clientFilter);

      const res = await fetch(`/api/audit-logs?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch audit logs");
      return res.json();
    },
    refetchInterval: autoRefresh ? 5000 : false,
  });

  // Fetch Stats
  const { data: statsData } = useQuery({
    queryKey: ["audit-stats"],
    queryFn: async () => {
      const res = await fetch("/api/audit-logs/stats");
      if (!res.ok) throw new Error("Failed to fetch audit stats");
      return res.json();
    },
    refetchInterval: autoRefresh ? 10000 : false,
  });

  const getActionBadge = (action: string) => {
    switch (action) {
      case "DISPATCH_COORDINATOR":
        return (
          <Badge className="bg-red-500/15 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800 flex items-center gap-1 font-semibold">
            <Truck className="w-3 h-3" /> Team Dispatched
          </Badge>
        );
      case "CALL_COMPLETED":
        return (
          <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 flex items-center gap-1 font-semibold">
            <CheckCircle2 className="w-3 h-3" /> Call Completed / Done
          </Badge>
        );
      case "CALL_CREATED":
        return (
          <Badge className="bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800 flex items-center gap-1 font-semibold">
            <PhoneCall className="w-3 h-3" /> Call Registered
          </Badge>
        );
      case "LOGIN":
        return (
          <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800 flex items-center gap-1 font-semibold">
            <LogIn className="w-3 h-3" /> Signed In
          </Badge>
        );
      case "LOGOUT":
        return (
          <Badge className="bg-gray-500/15 text-gray-700 dark:text-gray-400 border-gray-200 dark:border-gray-800 flex items-center gap-1 font-semibold">
            <LogOut className="w-3 h-3" /> Signed Out
          </Badge>
        );
      case "GENERATE_DUMMY_CALLS":
        return (
          <Badge className="bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800 flex items-center gap-1 font-semibold">
            <Layers className="w-3 h-3" /> Generated Test Calls
          </Badge>
        );
      case "PASSWORD_CHANGED":
      case "USER_PASSWORD_RESET":
        return (
          <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800 flex items-center gap-1 font-semibold">
            <Key className="w-3 h-3" /> Password Updated
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-gray-600 dark:text-gray-300 font-semibold">
            {action.replace(/_/g, " ")}
          </Badge>
        );
    }
  };

  const handleExportCSV = () => {
    if (!logsData?.logs || logsData.logs.length === 0) return;
    const headers = ["ID", "Timestamp", "User Name", "User Email", "Role", "Action", "Entity Type", "Entity ID", "Description", "Platform", "IP Address"];
    const rows = logsData.logs.map((log: any) => [
      log.id,
      new Date(log.createdAt).toISOString(),
      `"${log.userName}"`,
      `"${log.userEmail || ""}"`,
      `"${log.userRole || ""}"`,
      `"${log.action}"`,
      `"${log.entityType}"`,
      `"${log.entityId || ""}"`,
      `"${log.description.replace(/"/g, '""')}"`,
      `"${log.clientApp || "web"}"`,
      `"${log.ipAddress || ""}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e: any) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `sankara_audit_logs_${format(new Date(), "yyyyMMdd_HHmmss")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
              Activity & Audit Trail
            </h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300">
              Live Who Did What
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Complete, immutable audit log of all actions, emergency dispatches, and coordinator activities across mobile & web.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`gap-1.5 text-xs font-semibold ${
              autoRefresh ? "border-emerald-400 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30" : ""
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${autoRefresh ? "bg-emerald-500 animate-pulse" : "bg-gray-400"}`} />
            {autoRefresh ? "Live Polling On" : "Live Polling Paused"}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="gap-1.5 text-xs font-semibold"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={handleExportCSV}
            disabled={!logsData?.logs?.length}
            className="gap-1.5 text-xs font-semibold bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-orange-500/10 to-amber-500/5 border-orange-200/60 dark:border-orange-900/40">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider">Today's Operations</p>
              <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white mt-1">
                {statsData?.todayCount ?? 0}
              </h3>
              <p className="text-[11px] text-gray-500 mt-0.5">Actions recorded today</p>
            </div>
            <div className="p-3 bg-orange-500 text-white rounded-xl shadow-md shadow-orange-500/20">
              <Clock className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500/10 to-pink-500/5 border-red-200/60 dark:border-red-900/40">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">Emergency Dispatches</p>
              <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white mt-1">
                {statsData?.actionCounts?.find((a: any) => a.action === "DISPATCH_COORDINATOR")?.count ?? 0}
              </h3>
              <p className="text-[11px] text-gray-500 mt-0.5">Teams sent to field</p>
            </div>
            <div className="p-3 bg-red-500 text-white rounded-xl shadow-md shadow-red-500/20">
              <Truck className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border-emerald-200/60 dark:border-emerald-900/40">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Completed Calls</p>
              <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white mt-1">
                {statsData?.actionCounts?.find((a: any) => a.action === "CALL_COMPLETED")?.count ?? 0}
              </h3>
              <p className="text-[11px] text-gray-500 mt-0.5">Marked as Done</p>
            </div>
            <div className="p-3 bg-emerald-500 text-white rounded-xl shadow-md shadow-emerald-500/20">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-indigo-500/5 border-blue-200/60 dark:border-blue-900/40">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Total Recorded Logs</p>
              <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white mt-1">
                {statsData?.totalCount ?? 0}
              </h3>
              <p className="text-[11px] text-gray-500 mt-0.5">Full immutable audit trail</p>
            </div>
            <div className="p-3 bg-blue-500 text-white rounded-xl shadow-md shadow-blue-500/20">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter & Search Bar */}
      <Card className="border-gray-200 dark:border-gray-800 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by Coordinator, Donor name, Call ID (EC...), or description..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-9 text-sm"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Select
                value={actionFilter}
                onValueChange={(val) => {
                  setActionFilter(val);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-[180px] text-xs font-semibold">
                  <SelectValue placeholder="Action Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="DISPATCH_COORDINATOR">🚨 Team Dispatched</SelectItem>
                  <SelectItem value="CALL_COMPLETED">✅ Completed / Done</SelectItem>
                  <SelectItem value="CALL_CREATED">📞 Call Registered</SelectItem>
                  <SelectItem value="CALL_UPDATED">✏️ Call Updated</SelectItem>
                  <SelectItem value="STATUS_CHANGE">🔄 Status Changed</SelectItem>
                  <SelectItem value="LOGIN">🔑 Signed In</SelectItem>
                  <SelectItem value="LOGOUT">🚪 Signed Out</SelectItem>
                  <SelectItem value="GENERATE_DUMMY_CALLS">🧪 Test Dummy Calls</SelectItem>
                  <SelectItem value="USER_CREATED">👥 User Created</SelectItem>
                  <SelectItem value="USER_UPDATED">👤 User Updated</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={clientFilter}
                onValueChange={(val) => {
                  setClientFilter(val);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-[150px] text-xs font-semibold">
                  <SelectValue placeholder="Client Device" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Devices</SelectItem>
                  <SelectItem value="mobile_app">📱 Mobile App</SelectItem>
                  <SelectItem value="web">💻 Web Portal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity Timeline List */}
      <Card className="border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
        <CardHeader className="bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-800 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-gray-900 dark:text-white">
                Live Activity Stream
              </CardTitle>
              <CardDescription className="text-xs text-gray-500">
                Chronological timeline of all operations performed in the system
              </CardDescription>
            </div>
            <span className="text-xs font-semibold text-gray-500">
              Showing {logsData?.logs?.length ?? 0} of {logsData?.total ?? 0} events
            </span>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center text-gray-400 gap-3">
              <RefreshCw className="w-8 h-8 animate-spin text-orange-500" />
              <p className="text-sm font-medium">Loading activity audit records...</p>
            </div>
          ) : !logsData?.logs || logsData.logs.length === 0 ? (
            <div className="py-16 text-center text-gray-400">
              <AlertCircle className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
              <p className="text-base font-bold text-gray-700 dark:text-gray-300">No activity logs found</p>
              <p className="text-xs text-gray-400 mt-1">Try clearing your search query or filters.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {logsData.logs.map((log: any) => {
                const isExpanded = expandedId === log.id;
                let parsedDetails = null;
                if (log.details) {
                  try {
                    parsedDetails = JSON.parse(log.details);
                  } catch (_) {
                    parsedDetails = log.details;
                  }
                }

                const isMobile = log.clientApp === "mobile_app";

                return (
                  <div
                    key={log.id}
                    className="p-4 md:p-5 hover:bg-gray-50/70 dark:hover:bg-gray-900/40 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-start gap-3">
                        {/* Avatar */}
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 text-white flex items-center justify-center font-bold text-sm shadow-sm shrink-0">
                          {log.userName.charAt(0).toUpperCase()}
                        </div>

                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm text-gray-900 dark:text-white">
                              {log.userName}
                            </span>
                            {log.userRole && (
                              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                                {log.userRole.replace(/_/g, " ")}
                              </span>
                            )}
                            {getActionBadge(log.action)}
                          </div>

                          <p className="text-sm text-gray-700 dark:text-gray-200 mt-1 font-medium">
                            {log.description}
                          </p>

                          <div className="flex items-center gap-3 mt-1 text-xs text-gray-400 flex-wrap">
                            <span className="flex items-center gap-1 font-medium text-gray-500 dark:text-gray-400">
                              <Clock className="w-3.5 h-3.5" />
                              {format(new Date(log.createdAt), "MMM d, yyyy • h:mm:ss a")} (
                              {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })})
                            </span>

                            {log.entityId && (
                              <span className="font-mono text-orange-600 dark:text-orange-400 font-semibold">
                                #{log.entityId}
                              </span>
                            )}

                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-semibold bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                              {isMobile ? (
                                <>
                                  <Smartphone className="w-3 h-3 text-emerald-500" /> Mobile App
                                </>
                              ) : (
                                <>
                                  <Globe className="w-3 h-3 text-blue-500" /> Web Portal
                                </>
                              )}
                            </span>

                            {log.ipAddress && (
                              <span className="text-[11px] text-gray-400 font-mono">
                                IP: {log.ipAddress}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Expand Details button */}
                      {log.details && (
                        <div className="sm:self-center shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setExpandedId(isExpanded ? null : log.id)}
                            className="text-xs text-gray-500 hover:text-gray-900 dark:hover:text-white gap-1 h-8 px-2"
                          >
                            {isExpanded ? (
                              <>
                                Less Info <ChevronUp className="w-3.5 h-3.5" />
                              </>
                            ) : (
                              <>
                                View Metadata <ChevronDown className="w-3.5 h-3.5" />
                              </>
                            )}
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Expandable JSON details */}
                    <AnimatePresence>
                      {isExpanded && log.details && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-3 overflow-hidden"
                        >
                          <div className="bg-gray-950 text-emerald-400 p-3 rounded-lg font-mono text-xs overflow-x-auto border border-gray-800 shadow-inner">
                            <p className="text-gray-400 text-[10px] uppercase font-bold mb-1">EVENT PAYLOAD METADATA:</p>
                            <pre className="whitespace-pre-wrap leading-relaxed">
                              {typeof parsedDetails === "object"
                                ? JSON.stringify(parsedDetails, null, 2)
                                : parsedDetails}
                            </pre>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {logsData && logsData.totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <p className="text-xs text-gray-500">
            Page {logsData.page} of {logsData.totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="text-xs font-semibold"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(logsData.totalPages, p + 1))}
              disabled={page >= logsData.totalPages}
              className="text-xs font-semibold"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
