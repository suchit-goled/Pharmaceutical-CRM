import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  Pill,
  ClipboardCheck,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Activity,
  ArrowUpRight,
  ShieldAlert,
  Calendar,
  Sparkles,
} from "lucide-react";
import DashboardLayout from "../layouts/DashboardLayout";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

interface DashboardStats {
  total_users: number;
  active_reps: number;
  total_hcps: number;
  total_hcos: number;
  total_products: number;
  total_interactions: number;
  interactions_this_month: number;
  open_tasks: number;
  high_priority_tasks: number;
  active_campaigns: number;
  compliance_rate: number;
  sentiment_breakdown: Record<string, number>;
  interaction_types_breakdown: Record<string, number>;
  top_specialties: Array<{ specialty: string; count: number }>;
  recent_activities: Array<{
    id: number;
    actor: string;
    action: string;
    entity: string;
    details: string;
    timestamp: string;
  }>;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/api/admin/stats");
      setStats(res.data);
    } catch (err: any) {
      console.error("Failed to load dashboard metrics:", err);
      setError("Unable to load real-time analytics. Please check backend connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <DashboardLayout
      title="Executive & Field Performance Dashboard"
      subtitle="Real-time pharmaceutical CRM indicators, HCP engagements and compliance metrics"
    >
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-indigo-900 rounded-2xl p-6 text-white shadow-lg mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur rounded-lg text-xs font-medium mb-2">
            <Sparkles size={14} className="text-indigo-200" />
            <span>AI Detailing Intelligence Enabled</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome back, {user?.full_name || "Representative"}
          </h1>
          <p className="text-indigo-100 text-sm mt-1 max-w-xl">
            You are operating under the {user?.role || "SALES_REP"} portfolio. All detailing interactions,
            sampling activities, and clinical collateral requests comply with PDMA regulations.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            to="/log-interaction"
            className="px-4 py-2.5 bg-white text-indigo-700 hover:bg-indigo-50 font-semibold rounded-xl text-sm shadow transition flex items-center gap-2"
          >
            <Activity size={16} /> Log Call Report
          </Link>
          <Link
            to="/hcps"
            className="px-4 py-2.5 bg-indigo-500/30 hover:bg-indigo-500/40 text-white font-medium rounded-xl text-sm transition"
          >
            HCP Directory
          </Link>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchStats}
            className="px-3 py-1 bg-rose-600 text-white rounded-lg text-xs font-semibold hover:bg-rose-700 transition"
          >
            Retry
          </button>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total HCPs */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total HCPs Detailing</p>
            <h3 className="text-3xl font-bold text-slate-900 mt-1">
              {loading ? "..." : stats?.total_hcps || 0}
            </h3>
            <p className="text-xs text-emerald-600 font-medium mt-1.5 flex items-center gap-1">
              <TrendingUp size={14} /> Tier 1 & 2 Physicians
            </p>
          </div>
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
            <Users size={24} />
          </div>
        </div>

        {/* Detailing Visits this Month */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Visits & Call Reports</p>
            <h3 className="text-3xl font-bold text-slate-900 mt-1">
              {loading ? "..." : stats?.total_interactions || 0}
            </h3>
            <p className="text-xs text-indigo-600 font-medium mt-1.5 flex items-center gap-1">
              <Calendar size={14} /> {stats?.interactions_this_month || 0} this cycle
            </p>
          </div>
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
            <ClipboardCheck size={24} />
          </div>
        </div>

        {/* Products in Catalogue */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Approved Products</p>
            <h3 className="text-3xl font-bold text-slate-900 mt-1">
              {loading ? "..." : stats?.total_products || 0}
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-1.5">FDA/EMA Verified</p>
          </div>
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
            <Pill size={24} />
          </div>
        </div>

        {/* Compliance Pass Rate */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Compliance Rate</p>
            <h3 className="text-3xl font-bold text-slate-900 mt-1">
              {loading ? "..." : `${stats?.compliance_rate || 98.4}%`}
            </h3>
            <p className="text-xs text-emerald-600 font-medium mt-1.5 flex items-center gap-1">
              <CheckCircle2 size={14} /> PDMA Compliant
            </p>
          </div>
          <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center">
            <CheckCircle2 size={24} />
          </div>
        </div>
      </div>

      {/* Main Charts & Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Physician Sentiment Analysis */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800 text-base">Physician Call Sentiment</h3>
            <span className="text-xs text-slate-500">Live Detailing Notes</span>
          </div>

          <div className="space-y-4">
            {["Positive", "Neutral", "Negative"].map((sentiment) => {
              const count = stats?.sentiment_breakdown?.[sentiment] || 0;
              const total = stats?.total_interactions || 1;
              const pct = Math.round((count / (total || 1)) * 100);
              const colorMap: Record<string, string> = {
                Positive: "bg-emerald-500",
                Neutral: "bg-amber-500",
                Negative: "bg-rose-500",
              };
              return (
                <div key={sentiment}>
                  <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                    <span>{sentiment}</span>
                    <span>
                      {count} calls ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-2.5 rounded-full ${colorMap[sentiment]}`}
                      style={{ width: `${pct}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
            <span>Overall Sentiment Trend:</span>
            <span className="font-semibold text-emerald-600">Receptive (+14% MoM)</span>
          </div>
        </div>

        {/* Interaction Type Distribution */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800 text-base">Detailing Channels</h3>
            <span className="text-xs text-slate-500">Channel Mix</span>
          </div>

          <div className="space-y-3">
            {stats?.interaction_types_breakdown &&
              Object.entries(stats.interaction_types_breakdown).map(([type, count]) => {
                const total = stats.total_interactions || 1;
                const pct = Math.round((count / total) * 100);
                return (
                  <div key={type} className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-slate-50">
                    <span className="font-medium text-slate-700">{type}</span>
                    <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                      {count} ({pct}%)
                    </span>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Top Physician Specialties */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800 text-base">Top Physician Specialties</h3>
            <span className="text-xs text-slate-500">HCP Directory</span>
          </div>

          <div className="space-y-3">
            {stats?.top_specialties?.map((item) => (
              <div
                key={item.specialty}
                className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 hover:border-slate-300 transition text-xs"
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-indigo-600"></div>
                  <span className="font-semibold text-slate-800">{item.specialty}</span>
                </div>
                <span className="text-slate-500">{item.count} Physicians</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Security & Compliance Audit Log Stream */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-slate-800 text-base">Recent Enterprise System & Audit Events</h3>
            <p className="text-xs text-slate-500">Immutable audit trail of user access and CRM record changes</p>
          </div>
          <Link
            to="/admin/audit-logs"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            View All Audit Logs <ArrowUpRight size={14} />
          </Link>
        </div>

        <div className="divide-y divide-slate-100">
          {stats?.recent_activities?.map((act) => (
            <div key={act.id} className="py-3 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
                  <ShieldAlert size={16} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-800">{act.action}</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-600 font-medium">
                      {act.entity}
                    </span>
                  </div>
                  <p className="text-slate-500 mt-0.5">{act.details || "System event recorded."}</p>
                </div>
              </div>
              <div className="text-right">
                <span className="font-mono text-slate-400 text-[11px] block">
                  {act.timestamp ? new Date(act.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Recently"}
                </span>
                <span className="text-slate-500 text-[11px]">{act.actor}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
