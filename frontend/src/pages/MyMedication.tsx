import { useState, useEffect } from "react";
import {
  Pill,
  Clock,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  AlertTriangle,
  Camera,
  X,
  Plus,
  FileText,
  TrendingUp,
  RotateCcw,
  Upload
} from "lucide-react";
import DashboardLayout from "../layouts/DashboardLayout";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

interface Prescription {
  id: number;
  patient_id: number;
  prescriber_id: number;
  prescriber_name?: string;
  patient_name?: string;
  product_id?: number | null;
  medicine_name: string;
  generic_name?: string | null;
  strength: string;
  dosage_quantity: number;
  dosage_unit: string;
  frequency: string;
  scheduled_times: string[];
  start_date: string;
  end_date?: string | null;
  food_instruction: string;
  instructions?: string | null;
  status: string;
  created_at?: string;
}

interface DoseScheduleLog {
  id: number;
  prescription_id: number;
  medicine_name: string;
  generic_name?: string | null;
  strength: string;
  dosage_quantity: number;
  dosage_unit: string;
  food_instruction: string;
  instructions?: string | null;
  scheduled_date: string;
  scheduled_slot: string;
  scheduled_time: string;
  status: string; // Scheduled, Taken, Skipped, Snoozed
  taken_at?: string | null;
  skipped_reason?: string | null;
  snooze_until?: string | null;
  is_verified: boolean;
  verification_method?: string | null;
  verification_notes?: string | null;
}

interface AdherenceReport {
  daily_adherence_rate: number;
  weekly_adherence_rate: number;
  total_doses: number;
  taken_doses: number;
  skipped_doses: number;
  missed_doses: number;
  verified_percentage: number;
}

interface VerificationResult {
  status: "VERIFIED" | "WARNING" | "MISMATCH";
  verified: boolean;
  confidence_score: number;
  detected_medicine_name?: string;
  detected_strength?: string;
  detected_expiry?: string;
  is_expired: boolean;
  details: string;
  warnings: string[];
  food_advisory?: string;
}

export default function MyMedication() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<"schedule" | "prescriptions">("schedule");
  const [selectedSlot, setSelectedSlot] = useState<string>("All");

  const [doses, setDoses] = useState<DoseScheduleLog[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [adherence, setAdherence] = useState<AdherenceReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Verification Modal State (Module 3)
  const [verifyModalDose, setVerifyModalDose] = useState<DoseScheduleLog | null>(null);
  const [verifyPackagingText, setVerifyPackagingText] = useState<string>("");
  const [verifyImageBase64, setVerifyImageBase64] = useState<string>("");
  const [verifying, setVerifying] = useState<boolean>(false);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [warningAcknowledged, setWarningAcknowledged] = useState<boolean>(false);

  // Skip Modal State
  const [skipModalDose, setSkipModalDose] = useState<DoseScheduleLog | null>(null);
  const [skipReason, setSkipReason] = useState<string>("");

  // Prescribe Modal State (Doctors / Admin)
  const [prescribeModalOpen, setPrescribeModalOpen] = useState<boolean>(false);
  const [prescribeForm, setPrescribeForm] = useState({
    patient_id: user?.id || 1,
    medicine_name: "",
    generic_name: "",
    strength: "",
    dosage_quantity: 1,
    dosage_unit: "Tablet",
    frequency: "Once Daily",
    scheduled_times: ["Morning"],
    start_date: new Date().toISOString().split("T")[0],
    end_date: "",
    food_instruction: "After Food",
    instructions: ""
  });
  const [submittingPrescription, setSubmittingPrescription] = useState<boolean>(false);

  const canPrescribe = user?.role === "ADMIN" || user?.role === "MEDICAL_DIRECTOR";

  const loadData = async () => {
    setLoading(true);
    try {
      const [schedRes, prescRes, adhRes] = await Promise.all([
        api.get("/api/medications/schedule/today"),
        api.get("/api/prescriptions"),
        api.get("/api/medications/adherence")
      ]);
      setDoses(schedRes.data);
      setPrescriptions(prescRes.data);
      setAdherence(adhRes.data);
    } catch (err) {
      console.error("Failed to load medication records:", err);
      showToast("Unable to load medication records. Please check backend connection.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Dose Actions
  const handleQuickTake = async (dose: DoseScheduleLog) => {
    try {
      await api.post(`/api/medications/schedule/${dose.id}/take`, {
        is_verified: false,
        verification_method: "MANUAL",
        verification_notes: "Patient manual confirmation"
      });
      showToast(`Confirmed ${dose.medicine_name} dose taken!`, "success");
      loadData();
    } catch (err: any) {
      showToast(err.response?.data?.detail || "Failed to confirm dose", "error");
    }
  };

  const handleSnooze = async (dose: DoseScheduleLog, minutes: number = 30) => {
    try {
      await api.post(`/api/medications/schedule/${dose.id}/snooze`, { snooze_minutes: minutes });
      showToast(`Dose snoozed for ${minutes} minutes.`, "info");
      loadData();
    } catch (err: any) {
      showToast(err.response?.data?.detail || "Failed to snooze reminder", "error");
    }
  };

  const handleConfirmSkip = async () => {
    if (!skipModalDose || !skipReason.trim()) {
      showToast("Please provide a reason for skipping this dose.", "warning");
      return;
    }
    try {
      await api.post(`/api/medications/schedule/${skipModalDose.id}/skip`, { reason: skipReason.trim() });
      showToast(`Marked ${skipModalDose.medicine_name} dose as skipped.`, "info");
      setSkipModalDose(null);
      setSkipReason("");
      loadData();
    } catch (err: any) {
      showToast(err.response?.data?.detail || "Failed to record skipped dose", "error");
    }
  };

  // Module 3: Pre-Consumption Verification Flow
  const openVerificationModal = (dose: DoseScheduleLog) => {
    setVerifyModalDose(dose);
    setVerifyPackagingText(`${dose.medicine_name} ${dose.strength}`);
    setVerifyImageBase64("");
    setVerificationResult(null);
    setWarningAcknowledged(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setVerifyImageBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const runVerification = async () => {
    if (!verifyModalDose) return;
    setVerifying(true);
    try {
      const res = await api.post(`/api/medications/schedule/${verifyModalDose.id}/verify`, {
        packaging_text: verifyPackagingText,
        image_base64: verifyImageBase64 || undefined
      });
      setVerificationResult(res.data);
      if (res.data.status === "VERIFIED") {
        showToast("Medicine verification match confirmed!", "success");
      } else if (res.data.status === "MISMATCH") {
        showToast("CRITICAL ALERT: Wrong medication detected!", "error");
      } else {
        showToast("Verification caution: Please review warning before taking.", "warning");
      }
    } catch (err: any) {
      showToast(err.response?.data?.detail || "Verification failed to execute", "error");
    } finally {
      setVerifying(false);
    }
  };

  const confirmVerifiedTake = async () => {
    if (!verifyModalDose) return;
    try {
      await api.post(`/api/medications/schedule/${verifyModalDose.id}/take`, {
        is_verified: true,
        verification_method: verifyImageBase64 ? "AI_VISION" : "LABEL_SCAN",
        verification_notes: verificationResult?.details || "Package cross-referenced and verified."
      });
      showToast(`Verified & Confirmed ${verifyModalDose.medicine_name} dose taken!`, "success");
      setVerifyModalDose(null);
      loadData();
    } catch (err: any) {
      showToast(err.response?.data?.detail || "Failed to confirm dose", "error");
    }
  };

  // Prescribing Form Submission
  const handlePrescribeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prescribeForm.medicine_name || !prescribeForm.strength) {
      showToast("Please enter medicine name and strength.", "warning");
      return;
    }
    setSubmittingPrescription(true);
    try {
      await api.post("/api/prescriptions", {
        patient_id: Number(prescribeForm.patient_id),
        medicine_name: prescribeForm.medicine_name,
        generic_name: prescribeForm.generic_name || undefined,
        strength: prescribeForm.strength,
        dosage_quantity: Number(prescribeForm.dosage_quantity),
        dosage_unit: prescribeForm.dosage_unit,
        frequency: prescribeForm.frequency,
        scheduled_times: prescribeForm.scheduled_times,
        start_date: prescribeForm.start_date,
        end_date: prescribeForm.end_date || undefined,
        food_instruction: prescribeForm.food_instruction,
        instructions: prescribeForm.instructions || undefined
      });
      showToast(`Prescription for ${prescribeForm.medicine_name} assigned successfully!`, "success");
      setPrescribeModalOpen(false);
      loadData();
    } catch (err: any) {
      showToast(err.response?.data?.detail || "Failed to assign prescription", "error");
    } finally {
      setSubmittingPrescription(false);
    }
  };

  const formatIndianDate = (dateStr?: string | null) => {
    if (!dateStr) return "Ongoing";
    const parts = dateStr.split("T")[0].split("-");
    if (parts.length === 3 && parts[0].length === 4) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return dateStr;
  };

  const getIndianFoodLabel = (inst?: string) => {
    if (!inst) return "Any Time";
    const lower = inst.toLowerCase();
    if (lower.includes("before")) return "Before Food (खाली पेट / ಊಟಕ್ಕೆ ಮುಂಚೆ)";
    if (lower.includes("after")) return "After Food (भोजन के बाद / ಊಟದ ನಂತರ)";
    if (lower.includes("with")) return "With Food (भोजन के साथ)";
    if (lower.includes("sleep")) return "Before Sleep (सोने से पहले)";
    return inst;
  };

  const renderDoseStatusBadge = (status: string, isVerified?: boolean) => {
    switch (status) {
      case "Taken":
      case "Confirmed taken":
        return (
          <span className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 size={13} /> {isVerified ? "Identity Matched & Taken" : "Confirmed Taken"}
          </span>
        );
      case "Skipped":
        return (
          <span className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-slate-200 text-slate-700">
            Skipped
          </span>
        );
      case "Missed":
        return (
          <span className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-rose-100 text-rose-800 border border-rose-200">
            Missed
          </span>
        );
      case "Snoozed":
        return (
          <span className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800">
            <RotateCcw size={13} /> Snoozed
          </span>
        );
      case "Identity mismatch":
        return (
          <span className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-rose-100 text-rose-800 border border-rose-300">
            <AlertCircle size={13} /> Identity Mismatch
          </span>
        );
      case "Under professional review":
        return (
          <span className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-purple-100 text-purple-800">
            Under Doctor Review
          </span>
        );
      case "Verification pending":
        return (
          <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-blue-100 text-blue-800">
            Verification Pending
          </span>
        );
      default:
        return (
          <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-indigo-100 text-indigo-800">
            {status || "Scheduled"}
          </span>
        );
    }
  };

  const filteredDoses = doses.filter((d) => {
    if (selectedSlot === "All") return true;
    return d.scheduled_slot.toLowerCase() === selectedSlot.toLowerCase();
  });

  return (
    <DashboardLayout
      title="Smart Medication & Dosage Management"
      subtitle="Prescription schedules, adherence tracking & AI pre-consumption verification"
    >
      {/* Adherence Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Today's Adherence</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">
              {adherence ? `${adherence.daily_adherence_rate}%` : "—"}
            </h3>
            <span className="text-xs font-semibold text-emerald-600">Daily Target</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Based on today's scheduled doses</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">7-Day Weekly Adherence</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">
              {adherence ? `${adherence.weekly_adherence_rate}%` : "—"}
            </h3>
            <span className="text-xs font-semibold text-slate-500">7-Day Rolling</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {adherence ? `${adherence.taken_doses} of ${adherence.total_doses} doses taken` : "—"}
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Verified Consumptions</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
              <ShieldCheck size={16} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">
              {adherence ? `${adherence.verified_percentage}%` : "—"}
            </h3>
            <span className="text-xs font-semibold text-purple-600">AI Confirmed</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Doses verified with packaging check</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Active Prescriptions</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <Pill size={16} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">{prescriptions.length}</h3>
            <span className="text-xs font-semibold text-slate-500">Assigned</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Authorized medical regimens</p>
        </div>
      </div>

      {/* Main Tab Navigation & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2 p-1 bg-slate-200/60 rounded-2xl">
          <button
            onClick={() => setActiveTab("schedule")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition ${
              activeTab === "schedule"
                ? "bg-white text-indigo-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Clock size={16} />
            <span>Today's Dosage Schedule</span>
            <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px]">
              {doses.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("prescriptions")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition ${
              activeTab === "prescriptions"
                ? "bg-white text-indigo-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <FileText size={16} />
            <span>Active Prescriptions</span>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px]">
              {prescriptions.length}
            </span>
          </button>
        </div>

        {canPrescribe && (
          <button
            onClick={() => setPrescribeModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-100 transition"
          >
            <Plus size={16} />
            <span>Assign New Prescription</span>
          </button>
        )}
      </div>

      {/* TAB 1: TODAY'S DOSAGE SCHEDULE */}
      {activeTab === "schedule" && (
        <div className="space-y-6">
          {/* Time Slot Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {["All", "Morning", "Afternoon", "Evening", "Night"].map((slot) => {
              const active = selectedSlot === slot;
              return (
                <button
                  key={slot}
                  onClick={() => setSelectedSlot(slot)}
                  className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition ${
                    active
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {slot} {slot !== "All" && `(${doses.filter((d) => d.scheduled_slot === slot).length})`}
                </button>
              );
            })}
          </div>

          {loading ? (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
              <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-xs font-semibold text-slate-500">Loading daily schedule & dosage reminders...</p>
            </div>
          ) : filteredDoses.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
              <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mx-auto mb-3">
                <CheckCircle2 size={24} />
              </div>
              <h4 className="text-sm font-bold text-slate-800">No scheduled doses for this slot</h4>
              <p className="text-xs text-slate-500 mt-1">All medications for this timeframe are up to date.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDoses.map((dose) => {
                const isTaken = dose.status === "Taken";
                const isSkipped = dose.status === "Skipped";

                return (
                  <div
                    key={dose.id}
                    className={`bg-white rounded-2xl p-5 border transition flex flex-col justify-between shadow-sm ${
                      isTaken
                        ? "border-emerald-200 bg-emerald-50/20"
                        : isSkipped
                        ? "border-slate-200 opacity-70"
                        : "border-slate-200 hover:border-indigo-300 hover:shadow-md"
                    }`}
                  >
                    <div>
                      {/* Dose Header */}
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700">
                              {dose.scheduled_slot} • {dose.scheduled_time}
                            </span>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800">
                              {getIndianFoodLabel(dose.food_instruction)}
                            </span>
                          </div>
                          <h4 className="text-base font-bold text-slate-900 tracking-tight">
                            {dose.medicine_name}
                          </h4>
                          {dose.generic_name && (
                            <p className="text-xs text-slate-400 italic">{dose.generic_name}</p>
                          )}
                        </div>

                        {/* 9-State Medication Adherence Lifecycle Badge */}
                        {renderDoseStatusBadge(dose.status, dose.is_verified)}
                      </div>

                      {/* Dose Specifics */}
                      <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1 text-xs">
                        <div className="flex items-center justify-between text-slate-600">
                          <span className="text-slate-400">Prescribed Strength:</span>
                          <span className="font-semibold text-slate-800">{dose.strength}</span>
                        </div>
                        <div className="flex items-center justify-between text-slate-600">
                          <span className="text-slate-400">Dose Quantity:</span>
                          <span className="font-semibold text-slate-800">
                            {dose.dosage_quantity} {dose.dosage_unit}
                          </span>
                        </div>
                        {dose.instructions && (
                          <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-200">
                            💬 {dose.instructions}
                          </p>
                        )}
                      </div>

                      {/* Verification Status Proof */}
                      {isTaken && (
                        <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-100/50 p-2 rounded-xl">
                          <ShieldCheck size={14} className="shrink-0" />
                          <span className="truncate">
                            {dose.is_verified ? "AI Package Verified Match" : "Manually Confirmed"}
                          </span>
                        </div>
                      )}

                      {isSkipped && dose.skipped_reason && (
                        <div className="mt-3 text-xs text-slate-600 bg-slate-100 p-2 rounded-xl">
                          <b>Reason:</b> {dose.skipped_reason}
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    {!isTaken && !isSkipped && (
                      <div className="mt-5 pt-3 border-t border-slate-100 space-y-2">
                        {/* Primary: Verify & Take (Module 3) */}
                        <button
                          type="button"
                          onClick={() => openVerificationModal(dose)}
                          className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
                        >
                          <Camera size={14} />
                          <span>Verify & Take Dose</span>
                        </button>

                        <div className="grid grid-cols-3 gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleQuickTake(dose)}
                            className="py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold transition"
                          >
                            Quick Take
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSnooze(dose, 30)}
                            className="py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold transition"
                          >
                            Snooze
                          </button>
                          <button
                            type="button"
                            onClick={() => setSkipModalDose(dose)}
                            className="py-1.5 px-2 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-600 rounded-lg text-[11px] font-semibold transition"
                          >
                            Skip
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ACTIVE PRESCRIPTIONS */}
      {activeTab === "prescriptions" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-800">
              Assigned Medication Regimens ({prescriptions.length})
            </h3>
            <span className="text-xs text-slate-500">Authorized medical records</span>
          </div>

          <div className="divide-y divide-slate-100">
            {prescriptions.map((p) => (
              <div key={p.id} className="p-5 hover:bg-slate-50/50 transition flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">{p.medicine_name}</span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700">
                      {p.strength}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      {p.status}
                    </span>
                  </div>
                  {p.generic_name && (
                    <p className="text-xs text-slate-500">Generic: {p.generic_name}</p>
                  )}
                  <p className="text-xs text-slate-600">
                    <b>Dosage:</b> {p.dosage_quantity} {p.dosage_unit} • {p.frequency} ({p.scheduled_times.join(", ")}) • {getIndianFoodLabel(p.food_instruction)}
                  </p>
                  {p.instructions && (
                    <p className="text-xs text-slate-500 italic">Instructions: {p.instructions}</p>
                  )}
                </div>

                <div className="text-left md:text-right text-xs text-slate-500 space-y-1 shrink-0">
                  <p>
                    <b>Prescribed by:</b> {p.prescriber_name || "Medical Director"}
                  </p>
                  <p>
                    <b>Duration:</b> {formatIndianDate(p.start_date)} {p.end_date ? `to ${formatIndianDate(p.end_date)}` : "(Ongoing)"}
                  </p>
                </div>
              </div>
            ))}

            {prescriptions.length === 0 && (
              <div className="p-12 text-center text-slate-400 text-xs">
                No active prescriptions assigned.
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODULE 3: PRE-CONSUMPTION MEDICINE VERIFICATION MODAL */}
      {verifyModalDose && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded-md">
                    Pre-Consumption Verification
                  </span>
                  <span className="text-xs text-slate-400">Safety Requirement</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  Verify {verifyModalDose.medicine_name}
                </h3>
              </div>
              <button
                onClick={() => setVerifyModalDose(null)}
                className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            {/* Prescribed Target Reference Box */}
            <div className="mt-4 p-3.5 bg-indigo-50/70 border border-indigo-100 rounded-xl text-xs space-y-1 text-slate-700">
              <span className="font-bold text-indigo-900 block mb-1">Target Prescribed Dose:</span>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div><b>Medicine:</b> {verifyModalDose.medicine_name}</div>
                <div><b>Strength:</b> {verifyModalDose.strength}</div>
                <div><b>Quantity:</b> {verifyModalDose.dosage_quantity} {verifyModalDose.dosage_unit}</div>
                <div><b>Timing:</b> {verifyModalDose.food_instruction}</div>
              </div>
            </div>

            {/* Verification Inputs */}
            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Upload Packaging / Strip Photo (Optional)
                </label>
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-xl p-3 cursor-pointer transition bg-slate-50">
                  <Upload size={20} className="text-slate-400 mb-1" />
                  <span className="text-xs font-semibold text-slate-600">
                    {verifyImageBase64 ? "Image Selected ✓" : "Click to upload packaging or pill strip image"}
                  </span>
                  <span className="text-[10px] text-slate-400">Supports JPG, PNG</span>
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Packaging Label Text / Barcode
                </label>
                <input
                  type="text"
                  value={verifyPackagingText}
                  onChange={(e) => setVerifyPackagingText(e.target.value)}
                  placeholder="e.g. CardioGuard 20mg Tablets EXP: 12/2027"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:border-indigo-500"
                />
              </div>

              <button
                type="button"
                onClick={runVerification}
                disabled={verifying}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {verifying ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Cross-referencing package details...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck size={15} />
                    <span>Cross-Check Medicine Before Consuming</span>
                  </>
                )}
              </button>
            </div>

            {/* Verification Result Display */}
            {verificationResult && (
              <div
                className={`mt-4 p-4 rounded-xl text-xs space-y-2 border ${
                  verificationResult.status === "VERIFIED"
                    ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                    : verificationResult.status === "MISMATCH"
                    ? "bg-rose-50 border-rose-300 text-rose-900"
                    : "bg-amber-50 border-amber-200 text-amber-900"
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-sm">
                  {verificationResult.status === "VERIFIED" ? (
                    <CheckCircle2 size={18} className="text-emerald-600" />
                  ) : verificationResult.status === "MISMATCH" ? (
                    <AlertCircle size={18} className="text-rose-600" />
                  ) : (
                    <AlertTriangle size={18} className="text-amber-600" />
                  )}
                  <span>
                    {verificationResult.status === "VERIFIED"
                      ? "Medicine Verification Confirmed ✓"
                      : verificationResult.status === "MISMATCH"
                      ? "CRITICAL MISMATCH ALERT"
                      : "Verification Warning"}
                  </span>
                </div>

                <p className="text-xs leading-relaxed">{verificationResult.details}</p>

                {verificationResult.warnings.length > 0 && (
                  <div className="space-y-1 pt-1 font-semibold text-[11px]">
                    {verificationResult.warnings.map((w, idx) => (
                      <p key={idx}>⚠️ {w}</p>
                    ))}
                  </div>
                )}

                {verificationResult.food_advisory && (
                  <p className="text-[11px] pt-1 text-slate-700">
                    💡 <b>Advisory:</b> {verificationResult.food_advisory}
                  </p>
                )}
              </div>
            )}

            {/* Modal Actions */}
            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setVerifyModalDose(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>

              {verificationResult?.status === "VERIFIED" && (
                <button
                  type="button"
                  onClick={confirmVerifiedTake}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-100"
                >
                  <CheckCircle2 size={15} />
                  <span>Confirm Verified Dose Taken</span>
                </button>
              )}

              {verificationResult?.status === "WARNING" && (
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1.5 text-[11px] text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={warningAcknowledged}
                      onChange={(e) => setWarningAcknowledged(e.target.checked)}
                      className="rounded"
                    />
                    <span>I understand the warning</span>
                  </label>
                  <button
                    type="button"
                    disabled={!warningAcknowledged}
                    onClick={confirmVerifiedTake}
                    className="px-3 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold shadow-sm"
                  >
                    Confirm Taken
                  </button>
                </div>
              )}

              {verificationResult?.status === "MISMATCH" && (
                <span className="text-rose-700 text-[11px] font-bold">
                  ⛔ Taking blocked for patient safety
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SKIP MODAL */}
      {skipModalDose && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <h3 className="font-bold text-base text-slate-900 mb-1">
              Skip Dose: {skipModalDose.medicine_name}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Please state why you are skipping this scheduled dose for clinical record-keeping.
            </p>

            <div className="space-y-2 mb-4">
              {["Doctor advised temporary hold", "Fasting for medical test", "Feeling unwell / Nausea", "Out of stock / Needs refill", "Other"].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setSkipReason(r)}
                  className={`w-full text-left p-2.5 rounded-xl border text-xs transition ${
                    skipReason === r
                      ? "border-indigo-600 bg-indigo-50 text-indigo-900 font-semibold"
                      : "border-slate-200 hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            <textarea
              rows={2}
              placeholder="Additional reason or notes..."
              value={skipReason}
              onChange={(e) => setSkipReason(e.target.value)}
              className="w-full p-2.5 text-xs border border-slate-200 rounded-xl outline-none focus:border-indigo-500 mb-4"
            />

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setSkipModalDose(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSkip}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl"
              >
                Confirm Skip
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRESCRIBE MODAL (Doctors / Admin) */}
      {prescribeModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-base text-slate-900">
                Assign Medication Regimen (Authorized Prescriber)
              </h3>
              <button
                onClick={() => setPrescribeModalOpen(false)}
                className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handlePrescribeSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Medicine Brand Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CardioGuard"
                    value={prescribeForm.medicine_name}
                    onChange={(e) => setPrescribeForm({ ...prescribeForm, medicine_name: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Generic Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Atorvastatin Calcium"
                    value={prescribeForm.generic_name}
                    onChange={(e) => setPrescribeForm({ ...prescribeForm, generic_name: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Strength *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 20mg"
                    value={prescribeForm.strength}
                    onChange={(e) => setPrescribeForm({ ...prescribeForm, strength: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Dosage Form</label>
                  <select
                    value={prescribeForm.dosage_unit}
                    onChange={(e) => setPrescribeForm({ ...prescribeForm, dosage_unit: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl outline-none"
                  >
                    <option value="Tablet">Tablet</option>
                    <option value="Capsule">Capsule</option>
                    <option value="ml">ml (Syrup)</option>
                    <option value="Drops">Drops</option>
                    <option value="Injection">Injection</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Quantity</label>
                  <input
                    type="number"
                    min={1}
                    value={prescribeForm.dosage_quantity}
                    onChange={(e) => setPrescribeForm({ ...prescribeForm, dosage_quantity: Number(e.target.value) })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Frequency</label>
                  <select
                    value={prescribeForm.frequency}
                    onChange={(e) => setPrescribeForm({ ...prescribeForm, frequency: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl outline-none"
                  >
                    <option value="Once Daily">Once Daily</option>
                    <option value="Twice Daily">Twice Daily</option>
                    <option value="Three Times Daily">Three Times Daily</option>
                    <option value="As Needed">As Needed (PRN)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Food Timing</label>
                  <select
                    value={prescribeForm.food_instruction}
                    onChange={(e) => setPrescribeForm({ ...prescribeForm, food_instruction: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl outline-none"
                  >
                    <option value="After Food">After Food</option>
                    <option value="Before Food">Before Food</option>
                    <option value="With Food">With Food</option>
                    <option value="Before Sleep">Before Sleep</option>
                    <option value="No Restriction">No Restriction</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Scheduled Time Slots</label>
                <div className="flex gap-2">
                  {["Morning", "Afternoon", "Evening", "Night"].map((slot) => {
                    const checked = prescribeForm.scheduled_times.includes(slot);
                    return (
                      <label key={slot} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 cursor-pointer text-xs">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            const newSlots = e.target.checked
                              ? [...prescribeForm.scheduled_times, slot]
                              : prescribeForm.scheduled_times.filter((s) => s !== slot);
                            setPrescribeForm({ ...prescribeForm, scheduled_times: newSlots });
                          }}
                        />
                        <span>{slot}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={prescribeForm.start_date}
                    onChange={(e) => setPrescribeForm({ ...prescribeForm, start_date: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">End Date (Optional)</label>
                  <input
                    type="date"
                    value={prescribeForm.end_date}
                    onChange={(e) => setPrescribeForm({ ...prescribeForm, end_date: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Special Clinical Instructions</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Take with plenty of water. Do not crush."
                  value={prescribeForm.instructions}
                  onChange={(e) => setPrescribeForm({ ...prescribeForm, instructions: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPrescribeModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingPrescription}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md shadow-indigo-100 disabled:opacity-50"
                >
                  {submittingPrescription ? "Assigning..." : "Assign Prescription"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
