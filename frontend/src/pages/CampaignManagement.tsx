import { useState, useEffect } from "react";
import { Plus, X } from "lucide-react";
import DashboardLayout from "../layouts/DashboardLayout";
import api from "../services/api";
import { useToast } from "../context/ToastContext";

interface Campaign {
  id: number;
  name: string;
  therapeutic_area?: string | null;
  target_specialty?: string | null;
  channel: string;
  start_date?: string | null;
  end_date?: string | null;
  budget: number;
  status: string;
  target_count: number;
  engaged_count: number;
}

export default function CampaignManagement() {
  const { showToast } = useToast();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [, setLoading] = useState<boolean>(true);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  const [formData, setFormData] = useState({
    name: "",
    therapeutic_area: "Cardiovascular",
    target_specialty: "Cardiology",
    channel: "In-Person Detailing Drive",
    start_date: new Date().toISOString().split("T")[0],
    end_date: new Date(Date.now() + 86400000 * 60).toISOString().split("T")[0],
    budget: 50000,
    status: "Active",
    target_count: 300,
    engaged_count: 0,
  });

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/campaigns");
      setCampaigns(res.data || []);
    } catch (err) {
      console.error(err);
      showToast("Failed to load detailing campaigns", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/api/campaigns", formData);
      showToast(`Created campaign ${formData.name}`, "success");
      setShowAddModal(false);
      fetchCampaigns();
    } catch (err: any) {
      showToast(err.response?.data?.detail || "Failed to launch campaign", "error");
    }
  };

  return (
    <DashboardLayout
      title="Medical Detailing Campaigns & Outreach"
      subtitle="Therapeutic area drives, physician segmentation, webinars & scientific symposiums"
    >
      <div className="flex justify-between items-center mb-6">
        <div>
          <p className="text-xs text-slate-500">
            Active Campaigns: <span className="font-bold text-slate-800">{campaigns.length}</span>
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl text-sm transition flex items-center gap-2 shadow-sm"
        >
          <Plus size={16} /> Launch New Campaign
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {campaigns.map((camp) => {
          const progress = Math.min(100, Math.round(((camp.engaged_count || 0) / (camp.target_count || 1)) * 100));

          return (
            <div
              key={camp.id}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 text-lg">{camp.name}</h4>
                    <span className="text-xs px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-semibold mt-1 inline-block">
                      {camp.therapeutic_area} • {camp.target_specialty}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    {camp.status}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl text-xs">
                  <div>
                    <span className="text-slate-400">Detailing Channel:</span>
                    <p className="font-semibold text-slate-700">{camp.channel}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Campaign Budget:</span>
                    <p className="font-semibold text-slate-700">${camp.budget.toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Timeframe:</span>
                    <p className="font-semibold text-slate-700">
                      {camp.start_date} to {camp.end_date}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400">Engaged HCPs:</span>
                    <p className="font-semibold text-indigo-700">
                      {camp.engaged_count} / {camp.target_count} ({progress}%)
                    </p>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>HCP Outreach Target Progress</span>
                    <span className="font-bold text-slate-800">{progress}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div className="bg-indigo-600 h-2 rounded-full" style={{ width: `${progress}%` }}></div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-4">
              <h3 className="text-lg font-bold text-slate-900">Launch Detailing Campaign</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Campaign Title</label>
                <input
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none"
                  placeholder="e.g. Q4 CardioGuard Lipid Health Detailing Drive"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Therapeutic Focus</label>
                  <input
                    value={formData.therapeutic_area}
                    onChange={(e) => setFormData({ ...formData, therapeutic_area: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none"
                    placeholder="Cardiovascular"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Target Specialty</label>
                  <input
                    value={formData.target_specialty}
                    onChange={(e) => setFormData({ ...formData, target_specialty: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none"
                    placeholder="Cardiology"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Target HCP Count</label>
                  <input
                    type="number"
                    value={formData.target_count}
                    onChange={(e) => setFormData({ ...formData, target_count: parseInt(e.target.value) || 0 })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Budget ($)</label>
                  <input
                    type="number"
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: parseFloat(e.target.value) || 0 })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl text-xs shadow transition"
                >
                  Create Campaign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
