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
      setData(res.data);
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
        <div className="flex items-center gap-3 flex-1">
          <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3.5 py-2 bg-slate-50 text-slate-600 flex-1 max-w-md">
            <Search size={16} className="text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by physician, hospital, notes..."
              className="outline-none bg-transparent text-sm w-full"
            />
          </div>

          <select
            value={productFilter}
            onChange={(e) => setProductFilter(e.target.value)}
            className="border border-slate-200 bg-slate-50 text-slate-700 text-sm rounded-xl px-3 py-2 outline-none"
          >
            <option value="">All Products</option>
            <option value="CardioGuard">CardioGuard</option>
            <option value="OncoShield">OncoShield</option>
            <option value="GlucoFlow">GlucoFlow</option>
            <option value="NeuroCalm">NeuroCalm</option>
            <option value="ImmunoPax">ImmunoPax</option>
          </select>
        </div>

        <span className="text-xs text-slate-500 font-medium">{data.length} interactions recorded</span>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
            <tr>
              <th className="p-4">Physician & Specialty</th>
              <th className="p-4">Hospital / HCO</th>
              <th className="p-4">Product Detailing</th>
              <th className="p-4">Visit Date</th>
              <th className="p-4">Samples</th>
              <th className="p-4">Sentiment</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((item) => {
              const sentimentColors: Record<string, string> = {
                Positive: "bg-emerald-100 text-emerald-800",
                Neutral: "bg-amber-100 text-amber-800",
                Negative: "bg-rose-100 text-rose-800",
              };

              return (
                <tr
                  key={item.id}
                  className="hover:bg-slate-50 transition cursor-pointer"
                  onClick={() => setSelectedItem(item)}
                >
                  <td className="p-4">
                    <p className="font-bold text-slate-900">{item.doctor}</p>
                    <p className="text-slate-400">{item.specialization || "General"}</p>
                  </td>
                  <td className="p-4 text-slate-700 font-medium">{item.hospital}</td>
                  <td className="p-4">
                    <span className="font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                      {item.product}
                    </span>
                  </td>
                  <td className="p-4 text-slate-600 font-medium">{item.visitDate}</td>
                  <td className="p-4 font-mono font-bold text-slate-700">{item.samples || 0}</td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-0.5 rounded-full font-bold ${
                        sentimentColors[item.sentiment] || "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {item.sentiment}
                    </span>
                  </td>
                  <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => deleteInteraction(item.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      title="Delete Report"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Interaction Detail Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-200">
            <div className="flex items-start justify-between border-b border-slate-200 pb-4 mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{selectedItem.doctor}</h3>
                <p className="text-xs text-slate-500">{selectedItem.hospital} • {selectedItem.visitDate}</p>
              </div>
              <button onClick={() => setSelectedItem(null)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl">
                <div>
                  <span className="text-slate-400">Product Detailing:</span>
                  <p className="font-bold text-indigo-700">{selectedItem.product}</p>
                </div>
                <div>
                  <span className="text-slate-400">Sentiment:</span>
                  <p className="font-bold text-slate-800">{selectedItem.sentiment}</p>
                </div>
                <div>
                  <span className="text-slate-400">Interaction Type:</span>
                  <p className="font-semibold text-slate-700">{selectedItem.interactionType}</p>
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
