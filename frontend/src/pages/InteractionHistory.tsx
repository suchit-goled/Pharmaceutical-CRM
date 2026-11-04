import { useEffect, useState } from "react";
import { Search, Trash2, X } from "lucide-react";
import DashboardLayout from "../layouts/DashboardLayout";
import api from "../services/api";
import { useToast } from "../context/ToastContext";

interface Interaction {
  id: number;
  doctor: string;
  hospital: string;
  specialization: string;
  interactionType: string;
  product: string;
  visitDate: string;
  visitTime: string;
  samples: number;
  sentiment: string;
  notes: string;
  outcomes: string;
  summary: string;
}

export default function InteractionHistory() {
  const { showToast } = useToast();
  const [data, setData] = useState<Interaction[]>([]);
  const [, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>("");
  const [productFilter, setProductFilter] = useState<string>("");
  const [selectedItem, setSelectedItem] = useState<Interaction | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      let url = `/interactions?page=1&page_size=50`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (productFilter) url += `&product=${encodeURIComponent(productFilter)}`;
      const res = await api.get(url);
      const items = Array.isArray(res.data) ? res.data : (res.data?.items || []);
      setData(items);
    } catch (err) {
      console.error(err);
      showToast("Failed to load call reporting history", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 250);
    return () => clearTimeout(timer);
  }, [search, productFilter]);

  const deleteInteraction = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this detailing call report?")) return;
    try {
      await api.delete(`/interaction/${id}`);
      showToast("Interaction deleted successfully", "success");
      loadData();
    } catch (err) {
      showToast("Failed to delete interaction", "error");
    }
  };

  return (
    <DashboardLayout
      title="Medical Detailing & Call Reporting History"
      subtitle="Complete chronological audit of field physician interactions, samples disbursed & outcomes"
    >
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search size={18} className="absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search physician, clinic, notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={productFilter}
            onChange={(e) => setProductFilter(e.target.value)}
            className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 outline-none"
          >
            <option value="">All Detailing Products</option>
            <option value="CardioGuard">CardioGuard</option>
            <option value="OncoShield">OncoShield</option>
            <option value="GlucoFlow">GlucoFlow</option>
            <option value="NeuroCalm">NeuroCalm</option>
            <option value="ImmunoPax">ImmunoPax</option>
            <option value="Dolo 650">Dolo 650</option>
            <option value="Paracetamol 650 mg">Paracetamol 650 mg</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider font-semibold text-slate-500">
            <tr>
              <th className="p-4">Visit Date</th>
              <th className="p-4">HCP (Physician)</th>
              <th className="p-4">Hospital / Clinic</th>
              <th className="p-4">Detailed Product</th>
              <th className="p-4">Samples</th>
              <th className="p-4">Sentiment</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {Array.isArray(data) && data.map((item) => {
              const sentimentColors: Record<string, string> = {
                Positive: "bg-emerald-100 text-emerald-800",
                Neutral: "bg-amber-100 text-amber-800",
                Negative: "bg-rose-100 text-rose-800",
              };

              return (
                <tr
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className="hover:bg-slate-50/80 cursor-pointer transition"
                >
                  <td className="p-4 font-medium text-slate-800">
                    {item.visitDate || "—"} {item.visitTime && <span className="text-slate-400 font-normal">({item.visitTime})</span>}
                  </td>
                  <td className="p-4 font-semibold text-indigo-700">
                    {item.doctor}
                    {item.specialization && (
                      <span className="block text-xs font-normal text-slate-400">{item.specialization}</span>
                    )}
                  </td>
                  <td className="p-4 text-slate-600">{item.hospital || "—"}</td>
                  <td className="p-4">
                    <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 font-medium rounded-lg text-xs">
                      {item.product}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="font-semibold text-slate-800">{item.samples || 0}</span> units
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        sentimentColors[item.sentiment] || "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {item.sentiment || "Neutral"}
                    </span>
                  </td>
                  <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => deleteInteraction(item.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                      title="Delete record"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {(!Array.isArray(data) || data.length === 0) && (
          <div className="p-12 text-center text-slate-400">
            No detailing interactions found matching your filters.
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-800">
                  Call Report #{selectedItem.id}: {selectedItem.doctor}
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedItem.hospital} • {selectedItem.visitDate}
                </p>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-400">Specialization:</span>
                  <p className="font-semibold text-slate-700">{selectedItem.specialization || "Unspecified"}</p>
                </div>
                <div>
                  <span className="text-slate-400">Detailed Product:</span>
                  <p className="font-semibold text-indigo-600">{selectedItem.product}</p>
                </div>
                <div>
                  <span className="text-slate-400">Recorded Sentiment:</span>
                  <p className="font-semibold text-slate-700">{selectedItem.sentiment}</p>
                </div>
                <div>
                  <span className="text-slate-400">Samples Distributed:</span>
                  <p className="font-semibold text-slate-700">{selectedItem.samples} units</p>
                </div>
              </div>

              <div>
                <span className="font-bold text-slate-700 block mb-1">Executive Summary</span>
                <p className="p-3 bg-slate-50 rounded-xl text-slate-600 border border-slate-100">
                  {selectedItem.summary || "No executive summary provided."}
                </p>
              </div>

              <div>
                <span className="font-bold text-slate-700 block mb-1">Detailing Notes & Outcomes</span>
                <p className="p-3 bg-slate-50 rounded-xl text-slate-600 border border-slate-100">
                  {selectedItem.notes || selectedItem.outcomes || "Detailed clinical discussion notes recorded."}
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedItem(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
