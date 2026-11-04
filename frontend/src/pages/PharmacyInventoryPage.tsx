import { useState, useEffect } from "react";
import Sidebar from "../components/layout/Sidebar";
import Header from "../components/layout/Header";
import { useToast } from "../context/ToastContext";
import api from "../services/api";
import {
  Boxes,
  Plus,
  Search,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  ShieldCheck,
  Building2,
  Calendar
} from "lucide-react";

interface InventoryItem {
  id: number;
  hco_id?: number | null;
  pharmacy_name?: string;
  medicine_name: string;
  generic_name?: string;
  strength: string;
  dosage_form: string;
  stock_quantity: number;
  reorder_level: number;
  unit_price: number;
  lot_number?: string;
  expiry_date?: string;
  schedule_category?: string;
  status: "In Stock" | "Low Stock" | "Out of Stock";
  created_at?: string;
}

interface ScheduleH1Record {
  id: number;
  order_id: number;
  doctor_name: string;
  doctor_registration_no: string;
  patient_name: string;
  patient_address: string;
  drug_name: string;
  batch_number: string;
  quantity_dispensed: number;
  dispensed_pharmacist_name?: string | null;
  dispensed_pharmacist_reg_no?: string | null;
  dispensed_at: string;
}

export default function PharmacyInventoryPage() {
  const { showToast } = useToast();

  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Adjust Stock Modal
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [adjustQty, setAdjustQty] = useState<number>(0);
  const [submittingAdjust, setSubmittingAdjust] = useState(false);

  // Add Item Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    medicine_name: "",
    generic_name: "",
    strength: "",
    dosage_form: "Tablet",
    stock_quantity: 100,
    reorder_level: 25,
    unit_price: 15.0,
    lot_number: "",
    expiry_date: "2027-12-31",
    schedule_category: "Schedule H"
  });
  const [submittingAdd, setSubmittingAdd] = useState(false);

  // Schedule H1 Register Modal
  const [showH1Modal, setShowH1Modal] = useState(false);
  const [h1Records, setH1Records] = useState<ScheduleH1Record[]>([]);
  const [h1Loading, setH1Loading] = useState(false);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/pharmacy/inventory");
      setInventory(Array.isArray(res.data) ? res.data : []);
    } catch (err: any) {
      showToast(err.response?.data?.detail || "Failed to load pharmacy inventory", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchH1Register = async () => {
    setH1Loading(true);
    try {
      const res = await api.get("/api/pharmacy/schedule-h1-register");
      setH1Records(Array.isArray(res.data) ? res.data : []);
    } catch (err: any) {
      showToast(err.response?.data?.detail || "Failed to load Schedule H1 Register", "error");
    } finally {
      setH1Loading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    setSubmittingAdjust(true);
    try {
      await api.put(`/api/pharmacy/inventory/${selectedItem.id}`, {
        stock_quantity: adjustQty
      });
      showToast(`Updated ${selectedItem.medicine_name} stock to ${adjustQty} units`, "success");
      setSelectedItem(null);
      fetchInventory();
    } catch (err: any) {
      showToast(err.response?.data?.detail || "Failed to update stock", "error");
    } finally {
      setSubmittingAdjust(false);
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.medicine_name.trim() || !addForm.strength.trim()) {
      showToast("Medicine name and strength are required", "warning");
      return;
    }
    setSubmittingAdd(true);
    try {
      await api.post("/api/pharmacy/inventory", addForm);
      showToast(`Added ${addForm.medicine_name} to pharmacy stock`, "success");
      setShowAddModal(false);
      setAddForm({
        medicine_name: "",
        generic_name: "",
        strength: "",
        dosage_form: "Tablet",
        stock_quantity: 100,
        reorder_level: 25,
        unit_price: 15.0,
        lot_number: "",
        expiry_date: "2027-12-31",
        schedule_category: "Schedule H"
      });
      fetchInventory();
    } catch (err: any) {
      showToast(err.response?.data?.detail || "Failed to add inventory item", "error");
    } finally {
      setSubmittingAdd(false);
    }
  };

  const filteredItems = inventory.filter((item) => {
    const matchesSearch =
      item.medicine_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.generic_name && item.generic_name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === "ALL" || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalSKUs = inventory.length;
  const inStockCount = inventory.filter((i) => i.status === "In Stock").length;
  const lowStockCount = inventory.filter((i) => i.status === "Low Stock").length;
  const outOfStockCount = inventory.filter((i) => i.status === "Out of Stock").length;

  return (
    <div className="flex h-screen bg-slate-100">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Header
          title="Pharmacy Retail Inventory & Stock Management"
          subtitle="Real-time pharmaceutical dispensary stock levels, batch lots, CDSCO Schedules, and statutory H1 register"
        />

        <main className="p-4 md:p-8 space-y-6">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">Total Medicine SKUs</span>
                <Boxes size={18} className="text-indigo-600" />
              </div>
              <p className="text-2xl font-bold text-slate-800 mt-2">{totalSKUs}</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-600">In Stock</span>
                <CheckCircle2 size={18} className="text-emerald-600" />
              </div>
              <p className="text-2xl font-bold text-slate-800 mt-2">{inStockCount}</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-amber-600">Low Stock Alert</span>
                <AlertTriangle size={18} className="text-amber-500" />
              </div>
              <p className="text-2xl font-bold text-slate-800 mt-2">{lowStockCount}</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-rose-600">Out of Stock</span>
                <XCircle size={18} className="text-rose-500" />
              </div>
              <p className="text-2xl font-bold text-slate-800 mt-2">{outOfStockCount}</p>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 flex-1 max-w-md">
              <Search size={16} className="text-slate-400" />
              <input
                type="text"
                placeholder="Search brand name or active generic ingredient..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="outline-none bg-transparent text-sm w-full text-slate-700"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs font-semibold border border-slate-200 rounded-xl px-3 py-2 bg-white text-slate-700 outline-none"
              >
                <option value="ALL">All Stock Statuses</option>
                <option value="In Stock">In Stock Only</option>
                <option value="Low Stock">Low Stock Alert</option>
                <option value="Out of Stock">Out of Stock</option>
              </select>

              <button
                onClick={() => {
                  fetchH1Register();
                  setShowH1Modal(true);
                }}
                className="flex items-center gap-2 px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-semibold rounded-xl shadow-sm transition shrink-0"
              >
                <FileSpreadsheet size={15} className="text-amber-700" />
                Schedule H1 Register
              </button>

              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-sm transition shrink-0"
              >
                <Plus size={16} />
                Add Medicine SKU
              </button>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="flex justify-center items-center py-16">
              <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <Boxes className="mx-auto text-slate-300 mb-3" size={48} />
              <h4 className="text-base font-semibold text-slate-700">No Inventory Items Match</h4>
              <p className="text-xs text-slate-400 mt-1">Try refining your search or add a new medicine SKU.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-3.5 px-6">Medicine & Strength</th>
                      <th className="py-3.5 px-6">Form & Generic</th>
                      <th className="py-3.5 px-6 text-center">Schedule</th>
                      <th className="py-3.5 px-6 text-center">Stock Level</th>
                      <th className="py-3.5 px-6 text-center">Unit Price</th>
                      <th className="py-3.5 px-6">Lot & Expiry</th>
                      <th className="py-3.5 px-6 text-center">Status</th>
                      <th className="py-3.5 px-6 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {filteredItems.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-4 px-6">
                          <p className="font-bold text-slate-800">{item.medicine_name}</p>
                          <span className="inline-block mt-0.5 text-xs text-indigo-700 font-semibold bg-indigo-50 px-2 py-0.5 rounded">
                            {item.strength}
                          </span>
                        </td>

                        <td className="py-4 px-6 text-xs text-slate-500">
                          <p className="text-slate-700 font-medium">{item.dosage_form}</p>
                          <p className="italic text-slate-400">{item.generic_name || "—"}</p>
                        </td>

                        <td className="py-4 px-6 text-center">
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded border ${
                            item.schedule_category === "Schedule H1"
                              ? "bg-rose-50 text-rose-700 border-rose-300"
                              : item.schedule_category === "Schedule X"
                              ? "bg-purple-50 text-purple-700 border-purple-300"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}>
                            {item.schedule_category || "Schedule H"}
                          </span>
                        </td>

                        <td className="py-4 px-6 text-center">
                          <span className="font-bold text-slate-800 text-base">{item.stock_quantity}</span>
                          <span className="text-xs text-slate-400 ml-1">units</span>
                        </td>

                        <td className="py-4 px-6 text-center font-semibold text-slate-700">
                          ₹{item.unit_price.toFixed(2)}
                        </td>

                        <td className="py-4 px-6 text-xs text-slate-500">
                          <p className="font-mono text-slate-700 font-medium">{item.lot_number || "LOT-SYS-01"}</p>
                          <p className="text-slate-400">Exp: {item.expiry_date || "2027-12"}</p>
                        </td>

                        <td className="py-4 px-6 text-center">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                              item.status === "In Stock"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : item.status === "Low Stock"
                                ? "bg-amber-50 text-amber-700 border border-amber-200"
                                : "bg-rose-50 text-rose-700 border border-rose-200"
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>

                        <td className="py-4 px-6 text-right">
                          <button
                            onClick={() => {
                              setSelectedItem(item);
                              setAdjustQty(item.stock_quantity);
                            }}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 rounded-xl text-xs font-semibold transition"
                          >
                            Adjust Stock
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Adjust Stock Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-800">Adjust Inventory Units</h3>
              <button onClick={() => setSelectedItem(null)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl text-xs space-y-1">
              <p className="font-bold text-slate-800">{selectedItem.medicine_name} {selectedItem.strength}</p>
              <p className="text-slate-500">Current Stock: <strong>{selectedItem.stock_quantity} units</strong></p>
            </div>

            <form onSubmit={handleAdjustSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  New Physical Stock Count *
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(parseInt(e.target.value) || 0)}
                  className="w-full text-base font-bold border border-slate-200 rounded-xl p-2.5 outline-none focus:border-indigo-600"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setSelectedItem(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAdjust}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition"
                >
                  {submittingAdjust ? "Updating..." : "Save Stock"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Medicine SKU Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Plus size={18} className="text-indigo-600" />
                Add Medicine to Pharmacy Inventory
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Brand Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Augmentin 625 Duo"
                    value={addForm.medicine_name}
                    onChange={(e) => setAddForm({ ...addForm, medicine_name: e.target.value })}
                    className="w-full text-sm border border-slate-200 rounded-xl p-2.5 outline-none focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Active Generic (CAPITALS)</label>
                  <input
                    type="text"
                    placeholder="e.g. AMOXICILLIN + CLAVULANIC ACID"
                    value={addForm.generic_name}
                    onChange={(e) => setAddForm({ ...addForm, generic_name: e.target.value })}
                    className="w-full text-sm border border-slate-200 rounded-xl p-2.5 outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Strength *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 625mg, 500mg"
                    value={addForm.strength}
                    onChange={(e) => setAddForm({ ...addForm, strength: e.target.value })}
                    className="w-full text-sm border border-slate-200 rounded-xl p-2.5 outline-none focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Dosage Form</label>
                  <select
                    value={addForm.dosage_form}
                    onChange={(e) => setAddForm({ ...addForm, dosage_form: e.target.value })}
                    className="w-full text-sm border border-slate-200 rounded-xl p-2.5 outline-none focus:border-indigo-600"
                  >
                    <option>Tablet</option>
                    <option>Capsule</option>
                    <option>Syrup</option>
                    <option>Inhaler</option>
                    <option>Injection</option>
                    <option>Drops</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Schedule Category</label>
                  <select
                    value={addForm.schedule_category}
                    onChange={(e) => setAddForm({ ...addForm, schedule_category: e.target.value })}
                    className="w-full text-sm border border-slate-200 rounded-xl p-2.5 outline-none focus:border-indigo-600 font-medium"
                  >
                    <option value="Schedule H">Schedule H (Rx)</option>
                    <option value="Schedule H1">Schedule H1 (Statutory Log)</option>
                    <option value="Schedule X">Schedule X (Narcotics)</option>
                    <option value="OTC">OTC (Non-Prescription)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Stock Qty *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={addForm.stock_quantity}
                    onChange={(e) => setAddForm({ ...addForm, stock_quantity: parseInt(e.target.value) || 0 })}
                    className="w-full text-sm border border-slate-200 rounded-xl p-2.5 outline-none focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Unit Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={addForm.unit_price}
                    onChange={(e) => setAddForm({ ...addForm, unit_price: parseFloat(e.target.value) || 0 })}
                    className="w-full text-sm border border-slate-200 rounded-xl p-2.5 outline-none focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Lot Number</label>
                  <input
                    type="text"
                    placeholder="AUG-2026-X"
                    value={addForm.lot_number}
                    onChange={(e) => setAddForm({ ...addForm, lot_number: e.target.value })}
                    className="w-full text-sm border border-slate-200 rounded-xl p-2.5 outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAdd}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition"
                >
                  {submittingAdd ? "Saving..." : "Add to Inventory"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Statutory Schedule H1 Dispensing Register Modal */}
      {showH1Modal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl">
                  <FileSpreadsheet size={22} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Statutory Schedule H1 Dispensing Register
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Drugs & Cosmetics Rules, 1945 • Rule 65(9) Mandated Audit Log (Retain for 3 Years)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowH1Modal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-950 flex items-center gap-2">
              <ShieldCheck size={18} className="text-amber-700 shrink-0" />
              <span>
                Under Indian regulations, retail dispensaries are legally required to document prescriber registration details, patient address, drug batch number, and quantity for all Schedule H1 medications.
              </span>
            </div>

            {h1Loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : h1Records.length === 0 ? (
              <div className="text-center py-12 border border-slate-200 rounded-2xl">
                <FileSpreadsheet className="mx-auto text-slate-300 mb-2" size={40} />
                <p className="text-sm font-semibold text-slate-700">No Schedule H1 Dispensing Entries Logged Yet</p>
                <p className="text-xs text-slate-400 mt-0.5">Dispensing a Schedule H1 order automatically records an audit entry here.</p>
              </div>
            ) : (
              <div className="border border-slate-200 rounded-xl overflow-x-auto shadow-sm">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600">
                      <th className="p-3">Dispensed Date</th>
                      <th className="p-3">Drug & Batch</th>
                      <th className="p-3 text-center">Qty</th>
                      <th className="p-3">Prescriber (Doctor)</th>
                      <th className="p-3">Patient & Address</th>
                      <th className="p-3">Dispensing Pharmacist</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {h1Records.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50 transition">
                        <td className="p-3 whitespace-nowrap text-slate-700 font-mono">
                          {r.dispensed_at ? new Date(r.dispensed_at).toLocaleDateString("en-IN") : "Today"}
                        </td>
                        <td className="p-3">
                          <p className="font-bold text-slate-900">{r.drug_name}</p>
                          <p className="text-[11px] text-slate-500 font-mono">Batch: {r.batch_number}</p>
                        </td>
                        <td className="p-3 text-center font-bold text-slate-800">
                          {r.quantity_dispensed}
                        </td>
                        <td className="p-3">
                          <p className="font-semibold text-slate-800">{r.doctor_name}</p>
                          <p className="text-[11px] text-indigo-700 font-mono">Reg: {r.doctor_registration_no}</p>
                        </td>
                        <td className="p-3">
                          <p className="font-semibold text-slate-800">{r.patient_name}</p>
                          <p className="text-[11px] text-slate-500 line-clamp-1">{r.patient_address}</p>
                        </td>
                        <td className="p-3">
                          <p className="font-semibold text-slate-800">{r.dispensed_pharmacist_name || "Dispensing Pharmacist"}</p>
                          <p className="text-[11px] text-emerald-700 font-mono">Reg: {r.dispensed_pharmacist_reg_no || "KA-PH-2024-998"}</p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowH1Modal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
              >
                Close Register
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
