import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { customFetch, useListUnits } from "@workspace/api-client-react";
import { 
  Building2, Activity, Heart, CheckCircle2, Clock, Download, RefreshCw, 
  TrendingUp, Users, ShieldCheck, BarChart3, PieChart as PieChartIcon, 
  Filter, Search, MapPin, Award
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import * as XLSX from "xlsx";

const COLORS = ["#f97316", "#10b981", "#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b"];

export default function ManagementDashboard() {
  const [period, setPeriod] = useState<string>("30d");
  const [selectedUnitId, setSelectedUnitId] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const { data: units } = useListUnits();

  // Fetch Management Analytics Data
  const { data: analytics, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["management-analytics", period, selectedUnitId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (period) params.set("period", period);
      if (selectedUnitId && selectedUnitId !== "all") params.set("unitId", selectedUnitId);

      return customFetch<any>(`/api/management/analytics?${params.toString()}`);
    },
    refetchInterval: 30000, // Auto refresh every 30s
  });

  const filteredUnitPerformance = useMemo(() => {
    if (!analytics?.unitPerformance) return [];
    if (!searchQuery) return analytics.unitPerformance;
    const q = searchQuery.toLowerCase().trim();
    return analytics.unitPerformance.filter(
      (u: any) =>
        u.unitName?.toLowerCase().includes(q) ||
        u.state?.toLowerCase().includes(q) ||
        u.district?.toLowerCase().includes(q)
    );
  }, [analytics?.unitPerformance, searchQuery]);

  const handleExportCSV = () => {
    if (!analytics) return;
    
    // Prepare sheets
    const summarySheet = XLSX.utils.json_to_sheet([analytics.summary]);
    const unitSheet = XLSX.utils.json_to_sheet(analytics.unitPerformance || []);
    const trendsSheet = XLSX.utils.json_to_sheet(analytics.trends || []);

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, summarySheet, "Summary KPIs");
    XLSX.utils.book_append_sheet(wb, unitSheet, "Unit Performance");
    XLSX.utils.book_append_sheet(wb, trendsSheet, "Daily Trends");

    XLSX.writeFile(wb, `Sankara_Management_Report_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const summary = analytics?.summary || {
    totalCalls: 0,
    completedCalls: 0,
    conversionRate: 0,
    totalPledges: 0,
    activeUnits: 0,
    avgResponseMinutes: 18,
  };

  const demographicsData = useMemo(() => {
    if (!analytics?.demographics?.ageGroups) return [];
    return Object.entries(analytics.demographics.ageGroups).map(([ageGroup, count]) => ({
      ageGroup: `${ageGroup} yrs`,
      count,
    }));
  }, [analytics?.demographics]);

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-8 bg-slate-50/50 min-h-screen">
      
      {/* Top Header & Executive Controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-gradient-to-br from-orange-500 to-amber-600 text-white rounded-2xl shadow-md">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Management &amp; Dean Portal
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                Executive sight recovery throughput, hospital unit matrix &amp; regional analytics
              </p>
            </div>
          </div>
        </div>

        {/* Global Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200">
            <Filter size={14} className="text-slate-500 ml-2" />
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="h-9 border-0 bg-transparent text-xs font-black focus:ring-0 w-32 shadow-none">
                <SelectValue placeholder="Period" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="30d">Last 30 Days</SelectItem>
                <SelectItem value="90d">Last 90 Days</SelectItem>
                <SelectItem value="ytd">Year-to-Date</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200">
            <Building2 size={14} className="text-slate-500 ml-2" />
            <Select value={selectedUnitId} onValueChange={setSelectedUnitId}>
              <SelectTrigger className="h-9 border-0 bg-transparent text-xs font-black focus:ring-0 w-44 shadow-none">
                <SelectValue placeholder="All Units" />
              </SelectTrigger>
              <SelectContent className="bg-white max-h-60">
                <SelectItem value="all">All Hospital Units</SelectItem>
                {units?.map((u: any) => (
                  <SelectItem key={u.id} value={u.id.toString()}>
                    {u.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="h-10 rounded-2xl border-slate-200 font-bold text-xs flex items-center gap-1.5 bg-white shadow-sm"
          >
            <RefreshCw size={14} className={isFetching ? "animate-spin text-orange-500" : "text-slate-600"} />
            Refresh
          </Button>

          <Button
            size="sm"
            onClick={handleExportCSV}
            className="h-10 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-md"
          >
            <Download size={14} />
            Export Excel Report
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        <Card className="border-slate-200/80 rounded-3xl shadow-sm hover:shadow-md transition-all bg-gradient-to-br from-white to-orange-50/30 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-20 h-20 bg-orange-500/10 rounded-full blur-xl pointer-events-none" />
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Eye Calls</p>
              <div className="p-2.5 bg-orange-100 text-orange-655 rounded-2xl">
                <Activity size={20} />
              </div>
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              <h3 className="text-3xl font-black text-slate-900 tracking-tight">{summary.totalCalls}</h3>
              <span className="inline-flex items-center text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                <TrendingUp size={12} className="mr-1" /> Live
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium mt-2">Emergency calls registered</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 rounded-3xl shadow-sm hover:shadow-md transition-all bg-gradient-to-br from-white to-emerald-50/30 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Recovered Corneas</p>
              <div className="p-2.5 bg-emerald-100 text-emerald-600 rounded-2xl">
                <CheckCircle2 size={20} />
              </div>
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              <h3 className="text-3xl font-black text-slate-900 tracking-tight">{summary.completedCalls}</h3>
              <span className="inline-flex items-center text-xs font-extrabold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                {summary.conversionRate}% Conversion
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium mt-2">Successful sight restorations</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 rounded-3xl shadow-sm hover:shadow-md transition-all bg-gradient-to-br from-white to-blue-50/30 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 rounded-full blur-xl pointer-events-none" />
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Active Pledges</p>
              <div className="p-2.5 bg-blue-100 text-blue-600 rounded-2xl">
                <Heart size={20} />
              </div>
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              <h3 className="text-3xl font-black text-slate-900 tracking-tight">{summary.totalPledges}</h3>
              <span className="inline-flex items-center text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                Ambassadors
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium mt-2">Living eye pledges recorded</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 rounded-3xl shadow-sm hover:shadow-md transition-all bg-gradient-to-br from-white to-purple-50/30 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/10 rounded-full blur-xl pointer-events-none" />
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Avg Dispatch Latency</p>
              <div className="p-2.5 bg-purple-100 text-purple-600 rounded-2xl">
                <Clock size={20} />
              </div>
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              <h3 className="text-3xl font-black text-slate-900 tracking-tight">{summary.avgResponseMinutes}m</h3>
              <span className="inline-flex items-center text-xs font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
                Rapid Response
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium mt-2">Call creation to team dispatch</p>
          </CardContent>
        </Card>

      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Trend Area Chart */}
        <Card className="lg:col-span-2 border-slate-200/80 rounded-3xl shadow-sm bg-white">
          <CardHeader className="p-6 border-b border-slate-100 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-orange-500" /> Eye Call Volume &amp; Recovery Trends
              </CardTitle>
              <CardDescription className="text-xs font-medium text-slate-500 mt-0.5">
                Daily timeline of emergency calls vs. completed corneal retrievals
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-6 pt-4">
            <div className="h-80 w-full">
              {analytics?.trends && analytics.trends.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analytics.trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorCalls" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#f97316" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#64748b" }} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#64748b" }} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#0f172a", borderRadius: "12px", border: "none", color: "#fff", fontSize: "12px" }}
                    />
                    <Legend wrapperStyle={{ fontSize: "12px", fontWeight: "600" }} />
                    <Area type="monotone" dataKey="calls" name="Total Calls" stroke="#f97316" strokeWidth={3} fillOpacity={1} fill="url(#colorCalls)" />
                    <Area type="monotone" dataKey="completed" name="Recoveries" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorCompleted)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 font-semibold text-xs">
                  No trend data available for selected criteria
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Cause of Death Donut Chart */}
        <Card className="border-slate-200/80 rounded-3xl shadow-sm bg-white">
          <CardHeader className="p-6 border-b border-slate-100">
            <CardTitle className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <PieChartIcon className="w-5 h-5 text-amber-500" /> Cause of Death Distribution
            </CardTitle>
            <CardDescription className="text-xs font-medium text-slate-500 mt-0.5">
              Medical categorization of donor calls
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 pt-4">
            <div className="h-64 w-full flex items-center justify-center">
              {analytics?.causeOfDeath && analytics.causeOfDeath.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics.causeOfDeath}
                      dataKey="count"
                      nameKey="cause"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={4}
                    >
                      {analytics.causeOfDeath.map((_: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: "#0f172a", borderRadius: "12px", border: "none", color: "#fff", fontSize: "12px" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-slate-400 font-semibold text-xs">No distribution data</div>
              )}
            </div>

            {/* Legend list */}
            <div className="space-y-2 mt-2 max-h-28 overflow-y-auto pr-1">
              {analytics?.causeOfDeath?.map((item: any, idx: number) => (
                <div key={item.cause} className="flex items-center justify-between text-xs font-medium">
                  <div className="flex items-center gap-2 truncate">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                    <span className="text-slate-700 truncate">{item.cause}</span>
                  </div>
                  <span className="font-extrabold text-slate-900 ml-2">{item.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Secondary Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Unit Performance Comparison Bar Chart */}
        <Card className="border-slate-200/80 rounded-3xl shadow-sm bg-white">
          <CardHeader className="p-6 border-b border-slate-100">
            <CardTitle className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-500" /> Unit-Wise Sight Recovery Comparison
            </CardTitle>
            <CardDescription className="text-xs font-medium text-slate-500 mt-0.5">
              Total calls vs. successful corneal retrievals per hospital branch
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 pt-4">
            <div className="h-72 w-full">
              {analytics?.unitPerformance && analytics.unitPerformance.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.unitPerformance.slice(0, 8)} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="unitName" tick={{ fontSize: 10, fill: "#64748b" }} tickLine={false} interval={0} angle={-15} textAnchor="end" />
                    <YAxis tick={{ fontSize: 11, fill: "#64748b" }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderRadius: "12px", border: "none", color: "#fff", fontSize: "12px" }} />
                    <Bar dataKey="totalCalls" name="Total Calls" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="completedCalls" name="Recoveries" fill="#10b981" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 font-semibold text-xs">
                  No unit comparison data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Demographics Bar Chart */}
        <Card className="border-slate-200/80 rounded-3xl shadow-sm bg-white">
          <CardHeader className="p-6 border-b border-slate-100">
            <CardTitle className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-500" /> Donor Demographics (Age Brackets)
            </CardTitle>
            <CardDescription className="text-xs font-medium text-slate-500 mt-0.5">
              Distribution of donors across age brackets
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 pt-4">
            <div className="h-72 w-full">
              {demographicsData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={demographicsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="ageGroup" tick={{ fontSize: 11, fill: "#64748b" }} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#64748b" }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderRadius: "12px", border: "none", color: "#fff", fontSize: "12px" }} />
                    <Bar dataKey="count" name="Donors" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 font-semibold text-xs">
                  No demographic data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Hospital Unit Matrix & Leaderboard Table */}
      <Card className="border-slate-200/80 rounded-3xl shadow-sm bg-white overflow-hidden">
        <CardHeader className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" /> Hospital Unit Performance Leaderboard
            </CardTitle>
            <CardDescription className="text-xs font-medium text-slate-500 mt-0.5">
              Detailed breakdown of eye call throughput and conversion efficiency by branch
            </CardDescription>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search branch or state..."
              className="pl-9 h-9 rounded-2xl border-slate-200 text-xs font-medium bg-slate-50/50"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardHeader>

        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-extrabold uppercase tracking-wider">
              <tr>
                <th className="p-4 pl-6">Rank</th>
                <th className="p-4">Hospital Unit Branch</th>
                <th className="p-4">State &amp; District</th>
                <th className="p-4 text-center">Total Calls</th>
                <th className="p-4 text-center">Recovered</th>
                <th className="p-4 text-center">Cancelled</th>
                <th className="p-4 text-right pr-6">Conversion Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredUnitPerformance.length > 0 ? (
                filteredUnitPerformance.map((unit: any, idx: number) => (
                  <tr key={unit.unitId} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 pl-6 font-bold text-slate-400">#{idx + 1}</td>
                    <td className="p-4 font-extrabold text-slate-900 flex items-center gap-2">
                      <Building2 size={16} className="text-orange-500 shrink-0" />
                      {unit.unitName}
                    </td>
                    <td className="p-4 text-slate-500">
                      <div className="flex items-center gap-1">
                        <MapPin size={12} className="text-slate-400" />
                        {unit.district}, {unit.state}
                      </div>
                    </td>
                    <td className="p-4 text-center font-bold text-slate-900">{unit.totalCalls}</td>
                    <td className="p-4 text-center font-bold text-emerald-600 bg-emerald-50/50 rounded-lg">
                      {unit.completedCalls}
                    </td>
                    <td className="p-4 text-center text-slate-400">{unit.cancelledCalls}</td>
                    <td className="p-4 text-right pr-6">
                      <div className="inline-flex items-center gap-1.5">
                        <div className="w-16 bg-slate-100 rounded-full h-2 overflow-hidden hidden sm:block">
                          <div
                            className="bg-emerald-500 h-full rounded-full transition-all"
                            style={{ width: `${Math.min(unit.conversionRate, 100)}%` }}
                          />
                        </div>
                        <span className="font-extrabold text-slate-900">{unit.conversionRate}%</span>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 font-semibold">
                    No hospital unit performance data found matching your query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

    </div>
  );
}
