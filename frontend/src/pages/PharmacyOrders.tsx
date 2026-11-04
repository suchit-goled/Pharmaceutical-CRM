import { useState, useEffect } from "react";
import Sidebar from "../components/layout/Sidebar";
import Header from "../components/layout/Header";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import api from "../services/api";
import {
  PackageCheck,
  CheckCircle2,
  Plus,
  Truck,
  Store,
  Pill,
  ShieldAlert,
  FileSpreadsheet
} from "lucide-react";

interface PharmacyOrder {
  id: number;
  order_number: string;
  patient_id: number;
  patient_name?: string;
  prescription_id: number;
  medicine_name?: string;
  dosage_strength?: string;
  pharmacy_hco_id?: number | null;
  pharmacy_name?: string;
  status: "Pending Verification" | "Verified" | "Preparing" | "Ready for Pickup" | "Dispensed" | "Cancelled";
  delivery_type: "Store Pickup" | "Home Delivery";
  delivery_address?: string | null;
  patient_notes?: string | null;
  pharmacist_notes?: string | null;
  dispensed_at?: string | null;
  schedule_category?: string;
  total_amount_inr?: number;
  created_at?: string;
}

interface Prescription {
  id: number;
  medicine_name: string;
  strength: string;
  dosage_unit: string;
  status: string;
}

export default function PharmacyOrders() {
  const { isPharmacist } = useAuth();
  const { showToast } = useToast();

  const [orders, setOrders] = useState<PharmacyOrder[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);

  // New Order Modal (Patient)
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderForm, setOrderForm] = useState({
    prescription_id: "",
    delivery_type: "Store Pickup",
    delivery_address: "",
    patient_notes: ""
  });
  const [submittingOrder, setSubmittingOrder] = useState(false);

  // Status Update Modal (Pharmacist)
  const [selectedOrder, setSelectedOrder] = useState<PharmacyOrder | null>(null);
  const [statusUpdateForm, setStatusUpdateForm] = useState({
    status: "Preparing",
    pharmacist_notes: ""
  });
  const [submittingStatus, setSubmittingStatus] = useState(false);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/pharmacy/orders");
      setOrders(Array.isArray(res.data) ? res.data : []);
    } catch (err: any) {
      showToast(err.response?.data?.detail || "Failed to load pharmacy orders", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchPrescriptions = async () => {
    try {
      const res = await api.get("/api/prescriptions");
      setPrescriptions(Array.isArray(res.data) ? res.data : []);
    } catch {
      // Non-blocking
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchPrescriptions();
  }, []);

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderForm.prescription_id) {
      showToast("Please select a prescription to fulfill", "warning");
      return;
    }
    setSubmittingOrder(true);
    try {
      await api.post("/api/pharmacy/orders", {
        prescription_id: parseInt(orderForm.prescription_id),
        delivery_type: orderForm.delivery_type,
        delivery_address: orderForm.delivery_address || null,
        patient_notes: orderForm.patient_notes || null
      });
      showToast("Prescription submitted to pharmacy successfully!", "success");
      setShowOrderModal(false);
      setOrderForm({
        prescription_id: "",
        delivery_type: "Store Pickup",
        delivery_address: "",
        patient_notes: ""
      });
      fetchOrders();
    } catch (err: any) {
      showToast(err.response?.data?.detail || "Failed to place pharmacy order", "error");
    } finally {
      setSubmittingOrder(false);
    }
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    setSubmittingStatus(true);
    try {
      await api.put(`/api/pharmacy/orders/${selectedOrder.id}/status`, {
        status: statusUpdateForm.status,
        pharmacist_notes: statusUpdateForm.pharmacist_notes || null
      });
      showToast(`Order marked as ${statusUpdateForm.status}`, "success");
      setSelectedOrder(null);
      fetchOrders();
    } catch (err: any) {
      showToast(err.response?.data?.detail || "Failed to update order status", "error");
    } finally {
      setSubmittingStatus(false);
    }
  };

  return (
    <div className="flex h-screen bg-slate-100">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Header
          title={isPharmacist ? "Pharmacy Dispensing & Prescription Queue" : "Pharmacy Prescription Orders"}
          subtitle={
            isPharmacist
              ? "Verify digital prescriptions, validate Schedule H/H1 status, and maintain CDSCO Form 20/21 dispensing registers"
              : "Submit your authorized doctor prescriptions to verified Indian chemists and track fulfillment status"
          }
        />

        <main className="p-4 md:p-8 space-y-6">
          {/* Action / Banner */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-800">
                  {isPharmacist ? "Prescription Dispensing Pipeline" : "Prescription Order Tracking"}
                </h3>
                {isPharmacist && (
                  <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs px-2.5 py-0.5 rounded-full font-semibold">
                    Form 20 & 21 Verified Dispensary
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {isPharmacist
                  ? "Manage incoming customer orders, verify prescription safety under Drugs & Cosmetics Rules, and log Schedule H1 records"
                  : "Order your medication directly from authorized partner pharmacies with store pickup or home delivery across India"}
              </p>
            </div>
            {!isPharmacist && (
              <button
                onClick={() => setShowOrderModal(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-md transition"
              >
                <Plus size={18} />
                Order Medicine From Pharmacy
              </button>
            )}
          </div>

          {/* Orders List */}
          {loading ? (
            <div className="flex justify-center items-center py-16">
              <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <PackageCheck className="mx-auto text-slate-300 mb-3" size={48} />
              <h4 className="text-base font-semibold text-slate-700">No Pharmacy Orders</h4>
              <p className="text-xs text-slate-400 mt-1">
                {isPharmacist
                  ? "The prescription fulfillment queue is currently clear."
                  : "You have not submitted any prescription orders to a pharmacy yet."}
              </p>
              {!isPharmacist && (
                <button
                  onClick={() => setShowOrderModal(true)}
                  className="mt-4 px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl text-xs font-semibold transition"
                >
                  Submit a Prescription Order
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((ord) => {
                const isPreparing = ord.status === "Preparing" || ord.status === "Verified";
                const isReady = ord.status === "Ready for Pickup";
                const isDispensed = ord.status === "Dispensed";

                return (
                  <div
                    key={ord.id}
                    className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:border-indigo-200 transition flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                  >
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                          {ord.order_number}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            isDispensed
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : isReady
                              ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                              : isPreparing
                              ? "bg-blue-50 text-blue-700 border border-blue-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}
                        >
                          {ord.status}
                        </span>
                        <span className="flex items-center gap-1 text-[11px] text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                          {ord.delivery_type === "Home Delivery" ? <Truck size={12} /> : <Store size={12} />}
                          {ord.delivery_type}
                        </span>
                        {ord.schedule_category && (
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
                              ord.schedule_category === "Schedule H1"
                                ? "bg-rose-50 text-rose-700 border-rose-300"
                                : "bg-amber-50 text-amber-700 border-amber-200"
                            }`}
                          >
                            ⚠️ {ord.schedule_category}
                          </span>
                        )}
                        <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                          ₹{ord.total_amount_inr || 240}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold shrink-0">
                          <Pill size={20} />
                        </div>
                        <div>
                          <h4 className="text-base font-bold text-slate-800">
                            {ord.medicine_name} {ord.dosage_strength}
                          </h4>
                          <p className="text-xs text-slate-500">
                            Fulfilling Pharmacy: <span className="font-medium text-slate-700">{ord.pharmacy_name}</span>
                            {ord.patient_name && isPharmacist && (
                              <span> • Patient: <strong className="text-slate-800">{ord.patient_name}</strong></span>
                            )}
                          </p>
                        </div>
                      </div>

                      {ord.patient_notes && (
                        <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          <strong>Patient Note:</strong> {ord.patient_notes}
                        </p>
                      )}

                      {ord.pharmacist_notes && (
                        <p className="text-xs text-indigo-900 bg-indigo-50/70 p-2.5 rounded-xl border border-indigo-100">
                          <strong>Pharmacist Advisory:</strong> {ord.pharmacist_notes}
                        </p>
                      )}
                    </div>

                    {/* Action / Stepper */}
                    <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3 shrink-0">
                      {isPharmacist && !isDispensed && (
                        <button
                          onClick={() => {
                            setSelectedOrder(ord);
                            setStatusUpdateForm({
                              status: ord.status === "Pending Verification" ? "Preparing" : "Dispensed",
                              pharmacist_notes: ord.pharmacist_notes || ""
                            });
                          }}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-sm transition"
                        >
                          Update Dispensing Status
                        </button>
                      )}

                      {isDispensed && (
                        <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                          <CheckCircle2 size={16} />
                          Dispensed & Registered
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* Place Order Modal (Patient) */}
      {showOrderModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <PackageCheck size={18} className="text-indigo-600" />
                Submit Prescription to Pharmacy
              </h3>
              <button onClick={() => setShowOrderModal(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <form onSubmit={handlePlaceOrder} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select Prescribed Medicine *
                </label>
                <select
                  required
                  value={orderForm.prescription_id}
                  onChange={(e) => setOrderForm({ ...orderForm, prescription_id: e.target.value })}
                  className="w-full text-sm border border-slate-200 rounded-xl p-2.5 outline-none focus:border-indigo-600"
                >
                  <option value="">-- Choose Active Prescription --</option>
                  {prescriptions.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.medicine_name} ({p.strength}) - {p.dosage_unit}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Delivery Method
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: "Store Pickup", icon: Store, label: "Store Pickup" },
                    { id: "Home Delivery", icon: Truck, label: "Home Delivery" }
                  ].map((m) => (
                    <button
                      type="button"
                      key={m.id}
                      onClick={() => setOrderForm({ ...orderForm, delivery_type: m.id as any })}
                      className={`py-2 px-3 text-xs font-semibold rounded-xl border transition flex items-center justify-center gap-2 ${
                        orderForm.delivery_type === m.id
                          ? "bg-indigo-50 border-indigo-600 text-indigo-700"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <m.icon size={14} />
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {orderForm.delivery_type === "Home Delivery" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Delivery Address (House/Street/City/6-digit PIN) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. #42, 12th Cross, Indiranagar, Bengaluru - 560038"
                    value={orderForm.delivery_address}
                    onChange={(e) => setOrderForm({ ...orderForm, delivery_address: e.target.value })}
                    className="w-full text-sm border border-slate-200 rounded-xl p-2.5 outline-none focus:border-indigo-600"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Notes for Dispensing Pharmacist
                </label>
                <textarea
                  rows={2}
                  placeholder="Special instructions, pickup time preferences, or allergy notes..."
                  value={orderForm.patient_notes}
                  onChange={(e) => setOrderForm({ ...orderForm, patient_notes: e.target.value })}
                  className="w-full text-sm border border-slate-200 rounded-xl p-2.5 outline-none focus:border-indigo-600"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowOrderModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingOrder}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition"
                >
                  {submittingOrder ? "Submitting..." : "Send Prescription to Pharmacy"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Update Dispensing Status Modal (Pharmacist) */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <PackageCheck size={18} className="text-indigo-600" />
                Process Prescription Dispensing
              </h3>
              <button onClick={() => setSelectedOrder(null)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl text-xs space-y-1">
              <p className="font-semibold text-slate-700">Order: {selectedOrder.order_number}</p>
              <p className="text-slate-500">
                Medicine: <strong>{selectedOrder.medicine_name} {selectedOrder.dosage_strength}</strong>
              </p>
              <p className="text-slate-500">Patient: {selectedOrder.patient_name || `Patient #${selectedOrder.patient_id}`}</p>
              {selectedOrder.schedule_category === "Schedule H1" && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-[11px] font-medium flex items-start gap-2 mt-2">
                  <ShieldAlert size={16} className="shrink-0 text-rose-600 mt-0.5" />
                  <span>
                    <strong>Schedule H1 Drug:</strong> Marking as <em>Dispensed</em> will automatically log prescriber registration details and patient address into the statutory Schedule H1 Register as required by Indian Drug Rules.
                  </span>
                </div>
              )}
            </div>

            <form onSubmit={handleUpdateStatus} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Update Fulfillment Stage *
                </label>
                <select
                  value={statusUpdateForm.status}
                  onChange={(e) => setStatusUpdateForm({ ...statusUpdateForm, status: e.target.value })}
                  className="w-full text-sm border border-slate-200 rounded-xl p-2.5 outline-none focus:border-indigo-600"
                >
                  <option value="Preparing">Preparing Medication Package</option>
                  <option value="Ready for Pickup">Ready for Patient Pickup</option>
                  <option value="Dispensed">Dispensed (Delivered to Patient)</option>
                  <option value="Cancelled">Cancel / Stock Unavailable</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pharmacist Verification & Advisory Notes
                </label>
                <textarea
                  rows={3}
                  placeholder="Record batch lot number, expiration verified, verbal counseling provided..."
                  value={statusUpdateForm.pharmacist_notes}
                  onChange={(e) => setStatusUpdateForm({ ...statusUpdateForm, pharmacist_notes: e.target.value })}
                  className="w-full text-sm border border-slate-200 rounded-xl p-2.5 outline-none focus:border-indigo-600"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingStatus}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition"
                >
                  {submittingStatus ? "Updating..." : "Confirm Status Update"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
