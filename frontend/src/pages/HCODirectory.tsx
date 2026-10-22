import { useState, useEffect } from "react";
import { Search, Plus, MapPin, Phone, Bed, X } from "lucide-react";
import DashboardLayout from "../layouts/DashboardLayout";
import api from "../services/api";
import { useToast } from "../context/ToastContext";

interface HCO {
  id: number;
  name: string;
  type: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  phone?: string | null;
  email?: string | null;
  bed_count: number;
  purchasing_tier: string;
}

export default function HCODirectory() {
  const { showToast } = useToast();
  const [hcos, setHcos] = useState<HCO[]>([]);
  const [, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>("");
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  const [formData, setFormData] = useState({
    name: "",
    type: "Hospital",
    address: "",
    city: "",
    state: "NY",
    postal_code: "",
    phone: "",
    email: "",
    bed_count: 500,
    purchasing_tier: "Tier 1",
  });

  const fetchHcos = async () => {
    setLoading(true);
    try {
      let url = `/api/hcos?page=1&page_size=50`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      const res = await api.get(url);
      setHcos(res.data.items || []);
    } catch (err) {
      console.error(err);
      showToast("Failed to load healthcare organizations", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHcos();
  }, [search]);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/api/hcos", formData);
      showToast(`Added organization ${formData.name}`, "success");
      setShowAddModal(false);
      fetchHcos();
    } catch (err: any) {
      showToast(err.response?.data?.detail || "Failed to create organization", "error");
    }
  };

  return (
    <DashboardLayout
      title="Healthcare Organizations (HCO) Directory"
      subtitle="Hospitals, Academic Medical Centers, Clinics, and Institutional Purchasing Accounts"
    >
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3.5 py-2 bg-slate-50 text-slate-600 flex-1 max-w-md">
          <Search size={16} className="text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by hospital name, city, state..."
            className="outline-none bg-transparent text-sm w-full"
          />
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl text-sm transition flex items-center gap-2 shadow-sm"
        >
          <Plus size={16} /> Register Organization
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {hcos.map((hco) => (
          <div
            key={hco.id}
            className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-base">{hco.name}</h4>
                  <span className="text-xs px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-semibold mt-1 inline-block">
                    {hco.type}
                  </span>
                </div>
                <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                  {hco.purchasing_tier}
                </span>
              </div>

              <div className="mt-4 space-y-2 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <MapPin size={14} className="text-slate-400 shrink-0" />
                  <span>
                    {hco.city}, {hco.state} {hco.postal_code}
                  </span>
                </div>
                {hco.phone && (
                  <div className="flex items-center gap-2">
                    <Phone size={14} className="text-slate-400 shrink-0" />
                    <span>{hco.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Bed size={14} className="text-slate-400 shrink-0" />
                  <span>Bed Capacity: <span className="font-semibold">{hco.bed_count} beds</span></span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 text-right">
              <span className="text-xs text-indigo-600 font-semibold">Active Institutional Account</span>
            </div>
          </div>
        ))}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-4">
              <h3 className="text-lg font-bold text-slate-900">Add Healthcare Organization</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Organization Name</label>
                <input
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none"
                  placeholder="e.g. Johns Hopkins Hospital"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Organization Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none bg-white"
                  >
                    <option value="Hospital">Hospital</option>
                    <option value="Academic Medical Center">Academic Medical Center</option>
                    <option value="Clinic">Clinic</option>
                    <option value="Pharmacy">Pharmacy</option>
                    <option value="Distributor">Distributor</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Bed Capacity</label>
                  <input
                    type="number"
                    value={formData.bed_count}
                    onChange={(e) => setFormData({ ...formData, bed_count: parseInt(e.target.value) || 0 })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
                  <input
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none"
                    placeholder="Baltimore"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">State</label>
                  <input
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none"
                    placeholder="MD"
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
                  Save Organization
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
