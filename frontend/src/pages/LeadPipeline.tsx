import { useState, useEffect } from "react";
import { Plus, CheckCircle2, Building2, X } from "lucide-react";
import DashboardLayout from "../layouts/DashboardLayout";
import api from "../services/api";
import { useToast } from "../context/ToastContext";

interface Lead {
  id: number;
  contact_name: string;
  organization_name?: string | null;
  email?: string | null;
  phone?: string | null;
  specialty?: string | null;
  stage: string;
  lead_score: number;
  source: string;
  notes?: string | null;
  converted_hcp_id?: number | null;
}

const STAGES = ["New", "Contacted", "Qualified", "Proposal", "Converted"];

export default function LeadPipeline() {
  const { showToast } = useToast();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [, setLoading] = useState<boolean>(true);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  const [formData, setFormData] = useState({
    contact_name: "",
    organization_name: "",
    email: "",
    phone: "",
    specialty: "Cardiology",
    stage: "New",
    lead_score: 75,
    source: "Medical Conference",
    notes: "",
  });

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/leads?page=1&page_size=100");
      setLeads(res.data.items || []);
    } catch (err) {
      console.error(err);
      showToast("Failed to load lead pipeline", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const handleConvert = async (lead: Lead) => {
    try {
      await api.post(`/api/leads/${lead.id}/convert`);
      showToast(`Successfully converted ${lead.contact_name} into Active HCP record!`, "success");
      fetchLeads();
    } catch (err: any) {
      showToast(err.response?.data?.detail || "Lead conversion failed", "error");
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/api/leads", formData);
      showToast(`Added lead ${formData.contact_name}`, "success");
      setShowAddModal(false);
      setFormData({
        contact_name: "",
        organization_name: "",
        email: "",
        phone: "",
        specialty: "Cardiology",
        stage: "New",
        lead_score: 75,
        source: "Medical Conference",
        notes: "",
      });
      fetchLeads();
    } catch (err: any) {
      showToast(err.response?.data?.detail || "Failed to create lead", "error");
    }
  };

  return (
    <DashboardLayout
      title="Lead & Institutional Opportunity Pipeline"
      subtitle="Physician engagement stages, lead scoring & conversion to active prescribing HCPs"
    >
      <div className="flex justify-between items-center mb-6">
        <div>
          <p className="text-xs text-slate-500">
            Total Pipeline Prospects: <span className="font-bold text-slate-800">{leads.length}</span>
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl text-sm transition flex items-center gap-2 shadow-sm"
        >
          <Plus size={16} /> Add Prospect
        </button>
      </div>

      {/* Kanban Board Columns */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto pb-4">
        {STAGES.map((stage) => {
          const stageLeads = leads.filter((l) => l.stage === stage);
          const stageColors: Record<string, string> = {
            New: "border-t-blue-500",
            Contacted: "border-t-amber-500",
            Qualified: "border-t-purple-500",
            Proposal: "border-t-indigo-500",
            Converted: "border-t-emerald-500",
          };

          return (
            <div
              key={stage}
              className={`bg-slate-50 rounded-2xl p-4 border border-slate-200 border-t-4 ${stageColors[stage]} flex flex-col min-h-[500px]`}
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-slate-800 text-sm">{stage}</h4>
                <span className="text-xs px-2 py-0.5 rounded-full bg-white font-bold text-slate-600 border border-slate-200">
                  {stageLeads.length}
                </span>
              </div>

              <div className="space-y-3 flex-1 overflow-y-auto">
                {stageLeads.map((lead) => (
                  <div
                    key={lead.id}
                    className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow transition"
                  >
                    <div className="flex items-start justify-between">
                      <h5 className="font-bold text-slate-900 text-xs">{lead.contact_name}</h5>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700">
                        Score {lead.lead_score}
                      </span>
                    </div>

                    {lead.organization_name && (
                      <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1 truncate">
                        <Building2 size={12} /> {lead.organization_name}
                      </p>
                    )}

                    <div className="mt-2 text-[11px] text-slate-600 space-y-0.5">
                      <p>
                        <span className="text-slate-400">Spec:</span> {lead.specialty || "General"}
                      </p>
                      <p>
                        <span className="text-slate-400">Src:</span> {lead.source}
                      </p>
                    </div>

                    {lead.notes && (
                      <p className="mt-2 text-[11px] text-slate-500 bg-slate-50 p-2 rounded-lg line-clamp-2">
                        {lead.notes}
                      </p>
                    )}

                    {lead.stage !== "Converted" && (
                      <button
                        onClick={() => handleConvert(lead)}
                        className="mt-3 w-full py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1"
                      >
                        <CheckCircle2 size={13} /> Convert to HCP
                      </button>
                    )}
                    {lead.stage === "Converted" && (
                      <div className="mt-3 flex items-center justify-center gap-1 text-[11px] font-bold text-emerald-700">
                        <CheckCircle2 size={13} /> Converted to Prescriber
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Lead Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-4">
              <h3 className="text-lg font-bold text-slate-900">Add New Lead Prospect</h3>
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Name</label>
                  <input
                    required
                    value={formData.contact_name}
                    onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none"
                    placeholder="e.g. Dr. Angela Washington"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Organization / Hospital</label>
                  <input
                    value={formData.organization_name}
                    onChange={(e) => setFormData({ ...formData, organization_name: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none"
                    placeholder="e.g. Boston Medical Center"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
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
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Stage</label>
                  <select
                    value={formData.stage}
                    onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none bg-white"
                  >
                    <option value="New">New</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Qualified">Qualified</option>
                    <option value="Proposal">Proposal</option>
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
                    placeholder="lead@hospital.org"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Source</label>
                  <input
                    value={formData.source}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none"
                    placeholder="e.g. Conference, Referral"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Opportunity Notes</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none"
                  placeholder="Detailing interest, requested clinical literature..."
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
                  Save Prospect
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
