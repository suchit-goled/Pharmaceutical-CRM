import { useState, useEffect } from "react";
import {
  Users,
  Search,
  Plus,
  Mail,
  Phone,
  Award,
  ChevronRight,
  ShieldCheck,
  X,
} from "lucide-react";
import DashboardLayout from "../layouts/DashboardLayout";
import api from "../services/api";
import { useToast } from "../context/ToastContext";

interface HCP {
  id: number;
  first_name: string;
  last_name: string;
  npi_number: string;
  specialty: string;
  hco_id?: number | null;
  territory_id?: number | null;
  email?: string | null;
  phone?: string | null;
  prescribing_tier: string;
  preferred_channel: string;
  relationship_status: string;
  license_state: string;
  license_verified: boolean;
  notes?: string | null;
}

export default function HCPDirectory() {
  const { showToast } = useToast();
  const [hcps, setHcps] = useState<HCP[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>("");
  const [specialtyFilter, setSpecialtyFilter] = useState<string>("");
  const [tierFilter, setTierFilter] = useState<string>("");
  const [selectedHCP, setSelectedHCP] = useState<HCP | null>(null);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // Form state
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    npi_number: "",
    specialty: "Cardiology",
    email: "",
    phone: "",
    prescribing_tier: "Tier 1",
    preferred_channel: "In-Person",
    relationship_status: "Active Detailing",
    license_state: "NY",
    notes: "",
  });

  const fetchHcps = async () => {
    setLoading(true);
    try {
      let url = `/api/hcps?page=1&page_size=50`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (specialtyFilter) url += `&specialty=${encodeURIComponent(specialtyFilter)}`;
      if (tierFilter) url += `&prescribing_tier=${encodeURIComponent(tierFilter)}`;

      const res = await api.get(url);
      setHcps(res.data.items || []);
    } catch (err) {
      console.error(err);
      showToast("Failed to load Healthcare Professionals directory", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchHcps();
    }, 250);
    return () => clearTimeout(timer);
  }, [search, specialtyFilter, tierFilter]);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/api/hcps", formData);
      showToast(`Added Dr. ${formData.first_name} ${formData.last_name} to HCP directory`, "success");
      setShowAddModal(false);
      setFormData({
        first_name: "",
        last_name: "",
        npi_number: "",
        specialty: "Cardiology",
        email: "",
        phone: "",
        prescribing_tier: "Tier 1",
        preferred_channel: "In-Person",
        relationship_status: "Active Detailing",
        license_state: "NY",
        notes: "",
      });
      fetchHcps();
    } catch (err: any) {
      showToast(err.response?.data?.detail || "Failed to create HCP", "error");
    }
  };

  return (
    <DashboardLayout
      title="Healthcare Professionals (HCP) Directory"
      subtitle="Verified prescribers, Key Opinion Leaders (KOLs), and detailing targets"
    >
      {/* Control Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-3 w-full">
          <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3.5 py-2 bg-slate-50 text-slate-600 flex-1 max-w-md">
            <Search size={16} className="text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by physician name, NPI, email..."
              className="outline-none bg-transparent text-sm w-full"
            />
          </div>

          <select
            value={specialtyFilter}
            onChange={(e) => setSpecialtyFilter(e.target.value)}
            className="border border-slate-200 bg-slate-50 text-slate-700 text-sm rounded-xl px-3 py-2 outline-none"
          >
            <option value="">All Specialties</option>
            <option value="Cardiology">Cardiology</option>
            <option value="Oncology">Oncology</option>
            <option value="Endocrinology">Endocrinology</option>
            <option value="Neurology">Neurology</option>
            <option value="Immunology">Immunology</option>
          </select>

          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className="border border-slate-200 bg-slate-50 text-slate-700 text-sm rounded-xl px-3 py-2 outline-none"
          >
            <option value="">All Tiers</option>
            <option value="Tier 1">Tier 1 (High Volume / KOL)</option>
            <option value="Tier 2">Tier 2 (Moderate Prescriber)</option>
            <option value="Tier 3">Tier 3 (Emerging)</option>
          </select>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="w-full md:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl text-sm transition flex items-center justify-center gap-2 shadow-sm"
        >
          <Plus size={16} /> Register New HCP
        </button>
      </div>

      {/* HCP Grid / List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 animate-pulse h-48"></div>
          ))}
        </div>
      ) : hcps.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-md mx-auto">
          <Users size={48} className="text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800">No Prescribers Found</h3>
          <p className="text-slate-500 text-sm mt-1">
            No physicians matched your current filter criteria.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {hcps.map((hcp) => (
            <div
              key={hcp.id}
              onClick={() => setSelectedHCP(hcp)}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:border-indigo-300 transition cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-700 font-bold text-base flex items-center justify-center">
                      {hcp.first_name[0]}
                      {hcp.last_name[0]}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-base">
                        Dr. {hcp.first_name} {hcp.last_name}
                      </h4>
                      <p className="text-xs font-semibold text-indigo-600">{hcp.specialty}</p>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      hcp.prescribing_tier === "Tier 1"
                        ? "bg-purple-100 text-purple-800"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {hcp.prescribing_tier}
                  </span>
                </div>

                <div className="mt-4 space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <Award size={14} className="text-slate-400" />
                    <span>NPI: <span className="font-mono font-medium text-slate-800">{hcp.npi_number}</span></span>
                  </div>
                  {hcp.email && (
                    <div className="flex items-center gap-2">
                      <Mail size={14} className="text-slate-400" />
                      <span className="truncate">{hcp.email}</span>
                    </div>
                  )}
                  {hcp.phone && (
                    <div className="flex items-center gap-2">
                      <Phone size={14} className="text-slate-400" />
                      <span>{hcp.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1 text-emerald-600 font-medium">
                  <ShieldCheck size={14} /> License Verified ({hcp.license_state})
                </span>
                <span className="text-indigo-600 font-semibold flex items-center gap-0.5">
                  Details <ChevronRight size={14} />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* HCP Detail Drawer / Modal */}
      {selectedHCP && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-200">
            <div className="flex items-start justify-between border-b border-slate-200 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white font-bold text-lg flex items-center justify-center">
                  {selectedHCP.first_name[0]}
                  {selectedHCP.last_name[0]}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">
                    Dr. {selectedHCP.first_name} {selectedHCP.last_name}
                  </h3>
                  <p className="text-xs font-semibold text-indigo-600">{selectedHCP.specialty}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedHCP(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl text-xs">
                <div>
                  <p className="text-slate-400 font-medium">NPI Identifier</p>
                  <p className="font-mono font-bold text-slate-800">{selectedHCP.npi_number}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-medium">Prescribing Tier</p>
                  <p className="font-bold text-indigo-700">{selectedHCP.prescribing_tier}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-medium">Preferred Channel</p>
                  <p className="font-semibold text-slate-800">{selectedHCP.preferred_channel}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-medium">Status</p>
                  <p className="font-semibold text-emerald-700">{selectedHCP.relationship_status}</p>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-400 mb-1">Medical Detailing Notes</p>
                <p className="text-xs text-slate-600 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  {selectedHCP.notes || "No special physician profiling notes recorded yet."}
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-200 flex justify-end gap-2">
              <button
                onClick={() => setSelectedHCP(null)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New HCP Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-4">
              <h3 className="text-lg font-bold text-slate-900">Register Healthcare Professional</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">First Name</label>
                  <input
                    required
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none"
                    placeholder="e.g. Jonathan"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Last Name</label>
                  <input
                    required
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none"
                    placeholder="e.g. Hayes"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">10-Digit NPI</label>
                  <input
                    required
                    value={formData.npi_number}
                    onChange={(e) => setFormData({ ...formData, npi_number: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none font-mono"
                    placeholder="1942857102"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Specialty</label>
                  <select
                    value={formData.specialty}
                    onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none bg-white"
                  >
                    <option value="Cardiology">Cardiology</option>
                    <option value="Oncology">Oncology</option>
                    <option value="Endocrinology">Endocrinology</option>
                    <option value="Neurology">Neurology</option>
                    <option value="Immunology">Immunology</option>
                    <option value="General Medicine">General Medicine</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none"
                    placeholder="physician@hospital.org"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone</label>
                  <input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none"
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Physician Profiling Notes</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none"
                  placeholder="KOL focus, preferred detailing times, ongoing clinical interests..."
                />
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
                  Save Prescriber
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
