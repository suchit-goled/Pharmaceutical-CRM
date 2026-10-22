import { useState, useEffect } from "react";
import { ShieldCheck } from "lucide-react";
import DashboardLayout from "../layouts/DashboardLayout";
import api from "../services/api";
import { useToast } from "../context/ToastContext";

interface AuditLog {
  id: number;
  user_id?: number | null;
  actor_email: string;
  action: string;
  entity_type: string;
  entity_id?: string | null;
  details?: string | null;
  ip_address?: string | null;
  timestamp: string;
}

export default function AuditLogs() {
  const { showToast } = useToast();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [, setLoading] = useState<boolean>(true);
  const [actionFilter, setActionFilter] = useState<string>("");

  const fetchLogs = async () => {
    setLoading(true);
    try {
      let url = `/api/admin/audit-logs?page=1&page_size=50`;
      if (actionFilter) url += `&action=${encodeURIComponent(actionFilter)}`;
      const res = await api.get(url);
      setLogs(res.data.items || []);
    } catch (err) {
      console.error(err);
      showToast("Failed to fetch security audit logs", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter]);

  return (
    <DashboardLayout
      title="Compliance & Security Audit Trail"
      subtitle="Immutable cryptographic log of privileged user activities, data modifications & system events"
    >
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="border border-slate-200 bg-slate-50 text-slate-700 text-sm rounded-xl px-3 py-2 outline-none"
          >
            <option value="">All Action Types</option>
            <option value="USER_LOGIN">User Logins</option>
            <option value="USER_CREATE">User Creations</option>
            <option value="HCP_CREATE">HCP Registrations</option>
            <option value="LEAD_CONVERT">Lead Conversions</option>
            <option value="PRODUCT_CREATE">Product Creations</option>
            <option value="SYSTEM_INIT">System Initialization</option>
          </select>
          <span className="text-xs text-slate-500">
            {logs.length} audit records captured
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
          <ShieldCheck size={16} /> Immutable Hash-Chained Trail
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
            <tr>
              <th className="p-4">Timestamp</th>
              <th className="p-4">Action</th>
              <th className="p-4">Actor</th>
              <th className="p-4">Entity</th>
              <th className="p-4">Event Details</th>
              <th className="p-4">IP Address</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-mono">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-slate-50 transition">
                <td className="p-4 text-slate-500 text-[11px] whitespace-nowrap">
                  {new Date(log.timestamp).toLocaleString()}
                </td>
                <td className="p-4">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 font-sans">
                    {log.action}
                  </span>
                </td>
                <td className="p-4 font-sans font-semibold text-slate-800">{log.actor_email}</td>
                <td className="p-4">
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-600 font-sans">
                    {log.entity_type} {log.entity_id ? `#${log.entity_id}` : ""}
                  </span>
                </td>
                <td className="p-4 font-sans text-slate-600 max-w-xs truncate">{log.details}</td>
                <td className="p-4 text-slate-400 text-[11px]">{log.ip_address || "127.0.0.1"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}
