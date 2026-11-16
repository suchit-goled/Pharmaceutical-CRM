import { useState, useEffect } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import api from "../services/api";
import PaymentModal from "../components/common/PaymentModal";
import {
  Calendar,
  Clock,
  Plus,
  CheckCircle2,
  XCircle,
  FileText,
  Stethoscope,
  Video,
  MapPin,
  Sparkles,
  Languages,
  ShieldCheck,
  Send,
  CreditCard
} from "lucide-react";

interface Appointment {
  id: number;
  patient_id: number;
  patient_name: string;
  doctor_id?: number | null;
  doctor_name?: string | null;
  hcp_id?: number | null;
  hcp_name?: string | null;
  appointment_date: string;
  slot_time: string;
  appointment_type: string;
  consultation_mode?: string;
  consultation_fee_inr?: number;
  patient_language?: string;
  reason: string;
  status: "Requested" | "Confirmed" | "Completed" | "Cancelled" | "Rejected";
  clinical_notes?: string | null;
  diagnosis?: string | null;
  transcript_original?: string | null;
  clinical_summary_english?: string | null;
  created_at?: string;
}

interface HCP {
  id: number;
  first_name: string;
  last_name: string;
  specialty: string;
  medical_council_reg_no?: string;
  medical_council_name?: string;
  qualifications?: string;
  consultation_fee_inr?: number;
}

interface AIConsultationResponse {
  vernacular_reply: string;
  english_reply: string;
  clinical_summary_english: string;
  extracted_symptoms: string[];
  recommended_diagnostic_tests: string[];
  prescribing_cautions: string[];
  detected_language: string;
  consultation_protocol: string;
}

export default function Appointments() {
  const { isDoctor } = useAuth();
  const { showToast } = useToast();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [hcps, setHcps] = useState<HCP[]>([]);
  const [loading, setLoading] = useState(true);

  // Booking Modal State (Patient)
  const [showBookModal, setShowBookModal] = useState(false);
  const [bookForm, setBookForm] = useState({
    hcp_id: "",
    appointment_date: new Date(Date.now() + 86400000).toISOString().split("T")[0],
    slot_time: "10:00 AM",
    appointment_type: "In-Person",
    consultation_mode: "OPD In-Person Visit",
    patient_language: "Hindi",
    consultation_fee_inr: 500,
    reason: ""
  });
  const [submittingBook, setSubmittingBook] = useState(false);

  // Consultation Modal State (Doctor)
  const [showConsultModal, setShowConsultModal] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
  const [consultForm, setConsultForm] = useState({
    diagnosis: "",
    clinical_notes: ""
  });
  const [submittingConsult, setSubmittingConsult] = useState(false);

  // Multilingual Doctor-Patient AI Modal State
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiLang, setAiLang] = useState("Hindi");
  const [aiMessage, setAiMessage] = useState("");
  const [aiPatientName, setAiPatientName] = useState("Rohan Sharma");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<AIConsultationResponse | null>(null);
  const [paymentAppt, setPaymentAppt] = useState<Appointment | null>(null);
  const [paidApptIds, setPaidApptIds] = useState<number[]>([]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/appointments");
      setAppointments(Array.isArray(res.data) ? res.data : []);
    } catch (err: any) {
      showToast(err.response?.data?.detail || "Failed to load appointments", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctors = async () => {
    try {
      const res = await api.get("/api/hcps?page=1&size=50");
      setHcps(res.data?.items || []);
    } catch {
      // Non-blocking fallback
    }
  };

  useEffect(() => {
    fetchAppointments();
    fetchDoctors();
  }, []);

  const handleBookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookForm.reason.trim()) {
      showToast("Please state the symptoms or reason for consultation", "warning");
      return;
    }
    setSubmittingBook(true);
    try {
      await api.post("/api/appointments", {
        hcp_id: bookForm.hcp_id ? parseInt(bookForm.hcp_id) : null,
        appointment_date: bookForm.appointment_date,
        slot_time: bookForm.slot_time,
        appointment_type: bookForm.appointment_type,
        consultation_mode: bookForm.consultation_mode,
        patient_language: bookForm.patient_language,
        consultation_fee_inr: bookForm.consultation_fee_inr,
        reason: bookForm.reason
      });
      showToast("Appointment requested successfully!", "success");
      setShowBookModal(false);
      setBookForm({
        hcp_id: "",
        appointment_date: new Date(Date.now() + 86400000).toISOString().split("T")[0],
        slot_time: "10:00 AM",
        appointment_type: "In-Person",
        consultation_mode: "OPD In-Person Visit",
        patient_language: "Hindi",
        consultation_fee_inr: 500,
        reason: ""
      });
      fetchAppointments();
    } catch (err: any) {
      showToast(err.response?.data?.detail || "Failed to book appointment", "error");
    } finally {
      setSubmittingBook(false);
    }
  };

  const handleStatusUpdate = async (apptId: number, status: string) => {
    try {
      await api.put(`/api/appointments/${apptId}/status`, { status });
      showToast(`Appointment ${status.toLowerCase()} successfully`, "success");
      fetchAppointments();
    } catch (err: any) {
      showToast(err.response?.data?.detail || "Failed to update appointment", "error");
    }
  };

  const handleConsultSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppt) return;
    if (!consultForm.clinical_notes.trim()) {
      showToast("Clinical notes are required to complete consultation", "warning");
      return;
    }
    setSubmittingConsult(true);
    try {
      await api.put(`/api/appointments/${selectedAppt.id}/consultation`, {
        diagnosis: consultForm.diagnosis,
        clinical_notes: consultForm.clinical_notes,
        status: "Completed"
      });
      showToast("Clinical consultation documented and completed", "success");
      setShowConsultModal(false);
      setSelectedAppt(null);
      fetchAppointments();
    } catch (err: any) {
      showToast(err.response?.data?.detail || "Failed to document consultation", "error");
    } finally {
      setSubmittingConsult(false);
    }
  };

  const handleRunAIConsultation = async () => {
    if (!aiMessage.trim()) {
      showToast("Please enter a patient symptom description", "warning");
      return;
    }
    setAiLoading(true);
    try {
      const res = await api.post("/api/ai/doctor-consultation", {
        patient_message: aiMessage,
        language: aiLang,
        patient_name: aiPatientName || "Patient",
        doctor_name: "Dr. Gregory House, MBBS, MD",
        medical_council_reg_no: "KMC-45892"
      });
      setAiResult(res.data);
      showToast("Bilingual clinical assessment generated", "success");
    } catch (err: any) {
      showToast(err.response?.data?.detail || "Failed to process consultation AI", "error");
    } finally {
      setAiLoading(false);
    }
  };

  const copyAIToClinicalNotes = () => {
    if (!aiResult) return;
    setConsultForm({
      diagnosis: aiResult.extracted_symptoms.length > 0
        ? `Evaluation for: ${aiResult.extracted_symptoms.join(", ")}`
        : "Clinical Evaluation",
      clinical_notes: `${aiResult.clinical_summary_english}\n\nRecommended Tests: ${aiResult.recommended_diagnostic_tests.join(", ")}\nCautions: ${aiResult.prescribing_cautions.join(", ")}`
    });
    setShowAIModal(false);
    showToast("AI Clinical Summary copied to notes", "info");
  };

  return (
    <DashboardLayout
      title={isDoctor ? "Clinical Appointment Queue" : "Doctor Appointments & Consultations"}
      subtitle={
        isDoctor
          ? "Review patient consultation requests, conduct bilingual evaluations, and record clinical EHR notes"
          : "Book appointments with SMC/NMC verified physicians, track status, and view clinical consultation records"
      }
    >
      <div className="space-y-6">
          {/* Top Banner / Action Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-800">
                  {isDoctor ? "Patient Consultation Management" : "My Scheduled Consultations"}
                </h3>
                <span className="bg-indigo-50 text-indigo-700 text-xs px-2.5 py-0.5 rounded-full font-semibold border border-indigo-200 flex items-center gap-1">
                  <Languages size={12} />
                  8 Indian Languages Supported
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {isDoctor
                  ? "Manage incoming appointment requests, perform multilingual clinical intake, and record post-consultation diagnoses"
                  : "Connect with specialist physicians for in-person hospital OPD or virtual teleconsultations in your preferred Indian language"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setShowAIModal(true);
                  if (isDoctor && selectedAppt) {
                    setAiPatientName(selectedAppt.patient_name);
                    setAiMessage(selectedAppt.reason);
                  }
                }}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-teal-600 to-indigo-600 hover:from-teal-700 hover:to-indigo-700 text-white text-xs font-semibold rounded-xl shadow-sm transition"
              >
                <Sparkles size={16} />
                Bilingual AI Consultation
              </button>

              {!isDoctor && (
                <button
                  onClick={() => setShowBookModal(true)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-md transition"
                >
                  <Plus size={18} />
                  Book Doctor Appointment
                </button>
              )}
            </div>
          </div>

          {/* Appointments Grid / List */}
          {loading ? (
            <div className="flex justify-center items-center py-16">
              <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : appointments.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <Calendar className="mx-auto text-slate-300 mb-3" size={48} />
              <h4 className="text-base font-semibold text-slate-700">No Appointments Found</h4>
              <p className="text-xs text-slate-400 mt-1">
                {isDoctor
                  ? "There are currently no pending appointment requests assigned to you."
                  : "You have not scheduled any doctor appointments yet."}
              </p>
              {!isDoctor && (
                <button
                  onClick={() => setShowBookModal(true)}
                  className="mt-4 px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl text-xs font-semibold transition"
                >
                  Schedule Your First Appointment
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {appointments.map((appt) => {
                const isRequested = appt.status === "Requested";
                const isConfirmed = appt.status === "Confirmed";
                const isCompleted = appt.status === "Completed";
                const isRejected = appt.status === "Rejected" || appt.status === "Cancelled";

                return (
                  <div
                    key={appt.id}
                    className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between hover:border-indigo-200 transition"
                  >
                    <div>
                      {/* Status & Type Header */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                            isConfirmed
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : isRequested
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : isCompleted
                              ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                              : "bg-rose-50 text-rose-700 border border-rose-200"
                          }`}
                        >
                          {isConfirmed && <CheckCircle2 size={13} />}
                          {isRequested && <Clock size={13} />}
                          {isCompleted && <FileText size={13} />}
                          {isRejected && <XCircle size={13} />}
                          {appt.status}
                        </span>

                        <div className="flex items-center gap-1.5">
                          <span className="flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                            {appt.appointment_type === "Virtual / Video" ? (
                              <Video size={12} className="text-indigo-600" />
                            ) : (
                              <MapPin size={12} className="text-slate-600" />
                            )}
                            {appt.consultation_mode || appt.appointment_type}
                          </span>
                          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                            ₹{appt.consultation_fee_inr || 500}
                          </span>
                        </div>
                      </div>

                      {/* Doctor or Patient Name */}
                      <div className="mb-3">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                          {isDoctor ? "Patient Details" : "Consulting Physician"}
                        </p>
                        <h4 className="text-base font-bold text-slate-800 flex items-center gap-2 mt-0.5">
                          <Stethoscope size={16} className="text-indigo-600 shrink-0" />
                          {isDoctor ? appt.patient_name : appt.doctor_name || "Specialist Physician"}
                        </h4>
                        {appt.patient_language && (
                          <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <Languages size={12} className="text-slate-400" />
                            Preferred Language: <span className="font-semibold text-slate-700">{appt.patient_language}</span>
                          </p>
                        )}
                      </div>

                      {/* Date & Time Slot */}
                      <div className="bg-slate-50 rounded-xl p-3 flex items-center justify-between text-xs text-slate-700 font-medium mb-3">
                        <div className="flex items-center gap-2">
                          <Calendar size={14} className="text-indigo-600" />
                          <span>{appt.appointment_date}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock size={14} className="text-indigo-600" />
                          <span>{appt.slot_time}</span>
                        </div>
                      </div>

                      {/* Reason */}
                      <div className="mb-3">
                        <p className="text-xs font-semibold text-slate-400">Chief Complaint / Symptoms:</p>
                        <p className="text-xs text-slate-700 mt-1 line-clamp-2">{appt.reason}</p>
                      </div>

                      {/* Clinical Diagnosis if completed */}
                      {appt.diagnosis && (
                        <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-xs space-y-1 mb-3">
                          <p className="font-semibold text-indigo-900 flex items-center gap-1">
                            <FileText size={12} /> Diagnosis: {appt.diagnosis}
                          </p>
                          {appt.clinical_notes && (
                            <p className="text-indigo-700 text-[11px] mt-1 whitespace-pre-line">{appt.clinical_notes}</p>
                          )}
                          {appt.clinical_summary_english && (
                            <div className="mt-2 pt-2 border-t border-indigo-200/50">
                              <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wide">Doctor-Reviewed English Summary:</span>
                              <p className="text-[11px] text-slate-700 mt-0.5">{appt.clinical_summary_english}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                      {isDoctor ? (
                        <>
                          {isRequested && (
                            <>
                              <button
                                onClick={() => handleStatusUpdate(appt.id, "Confirmed")}
                                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition"
                              >
                                Accept & Confirm
                              </button>
                              <button
                                onClick={() => handleStatusUpdate(appt.id, "Rejected")}
                                className="py-2 px-3 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-semibold transition"
                              >
                                Decline
                              </button>
                            </>
                          )}
                          {isConfirmed && (
                            <button
                              onClick={() => {
                                setSelectedAppt(appt);
                                setConsultForm({
                                  diagnosis: appt.diagnosis || "",
                                  clinical_notes: appt.clinical_notes || ""
                                });
                                setShowConsultModal(true);
                              }}
                              className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition"
                            >
                              Conduct Consultation
                            </button>
                          )}
                        </>
                      ) : (
                        <>
                          {isRequested && (
                            <button
                              onClick={() => handleStatusUpdate(appt.id, "Cancelled")}
                              className="w-full py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-semibold transition"
                            >
                              Cancel Request
                            </button>
                          )}
                          {isConfirmed && (
                            <div className="w-full flex flex-col gap-2">
                              {paidApptIds.includes(appt.id) ? (
                                <div className="w-full text-center text-xs text-emerald-700 font-semibold py-1.5 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-center gap-1">
                                  <CheckCircle2 size={13} /> Fee Paid (₹{appt.consultation_fee_inr || 500})
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setPaymentAppt(appt)}
                                  className="w-full flex items-center justify-center gap-1.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition"
                                >
                                  <CreditCard size={14} /> Pay Fee (₹{appt.consultation_fee_inr || 500})
                                </button>
                              )}
                              <div className="w-full text-center text-[11px] text-slate-500 font-medium">
                                Ready for Scheduled Consultation
                              </div>
                            </div>
                          )}
                          {isCompleted && (
                            <div className="w-full text-center text-xs text-indigo-700 font-semibold py-1.5 bg-indigo-50 rounded-xl border border-indigo-200">
                              Consultation Completed
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

      {/* Book Appointment Modal (Patient) */}
      {showBookModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Calendar size={18} className="text-indigo-600" />
                Book Doctor Appointment
              </h3>
              <button
                onClick={() => setShowBookModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleBookSubmit} className="space-y-4">
              {/* Select Doctor */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select Physician / Specialist
                </label>
                <select
                  value={bookForm.hcp_id}
                  onChange={(e) => setBookForm({ ...bookForm, hcp_id: e.target.value })}
                  className="w-full text-sm border border-slate-200 rounded-xl p-2.5 outline-none focus:border-indigo-600"
                >
                  <option value="">Any Available Specialist</option>
                  {hcps.map((hcp) => (
                    <option key={hcp.id} value={hcp.id}>
                      Dr. {hcp.first_name} {hcp.last_name} ({hcp.specialty}) {hcp.medical_council_reg_no ? `• ${hcp.medical_council_reg_no}` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Consultation Format & Mode */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Consultation Format
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {["In-Person", "Virtual / Video"].map((type) => (
                      <button
                        type="button"
                        key={type}
                        onClick={() => setBookForm({
                          ...bookForm,
                          appointment_type: type,
                          consultation_mode: type === "In-Person" ? "OPD In-Person Visit" : "Teleconsultation (Video/Audio)"
                        })}
                        className={`py-2 px-2 text-[11px] font-semibold rounded-xl border transition flex items-center justify-center gap-1.5 ${
                          bookForm.appointment_type === type
                            ? "bg-indigo-50 border-indigo-600 text-indigo-700"
                            : "border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {type === "In-Person" ? <MapPin size={13} /> : <Video size={13} />}
                        {type === "In-Person" ? "In-Person" : "Video"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Preferred Language */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Preferred Language
                  </label>
                  <select
                    value={bookForm.patient_language}
                    onChange={(e) => setBookForm({ ...bookForm, patient_language: e.target.value })}
                    className="w-full text-sm border border-slate-200 rounded-xl p-2.5 outline-none focus:border-indigo-600"
                  >
                    <option value="English">English</option>
                    <option value="Hindi">Hindi (हिंदी)</option>
                    <option value="Kannada">Kannada (ಕನ್ನಡ)</option>
                    <option value="Tamil">Tamil (தமிழ்)</option>
                    <option value="Telugu">Telugu (తెలుగు)</option>
                    <option value="Malayalam">Malayalam (മലയാളം)</option>
                    <option value="Marathi">Marathi (मराठी)</option>
                    <option value="Bengali">Bengali (বাংলা)</option>
                  </select>
                </div>
              </div>

              {/* Date & Slot */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split("T")[0]}
                    value={bookForm.appointment_date}
                    onChange={(e) => setBookForm({ ...bookForm, appointment_date: e.target.value })}
                    className="w-full text-sm border border-slate-200 rounded-xl p-2.5 outline-none focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Time Slot (IST) *</label>
                  <select
                    value={bookForm.slot_time}
                    onChange={(e) => setBookForm({ ...bookForm, slot_time: e.target.value })}
                    className="w-full text-sm border border-slate-200 rounded-xl p-2.5 outline-none focus:border-indigo-600"
                  >
                    <option>09:00 AM IST</option>
                    <option>10:00 AM IST</option>
                    <option>11:30 AM IST</option>
                    <option>02:00 PM IST</option>
                    <option>03:30 PM IST</option>
                    <option>05:00 PM IST</option>
                    <option>06:30 PM IST</option>
                  </select>
                </div>
              </div>

              {/* Consultation Fee Display */}
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between text-xs">
                <span className="text-emerald-800 font-medium">Standard Consultation Fee:</span>
                <span className="text-emerald-700 font-bold text-sm">₹500.00 (Inclusive of Taxes)</span>
              </div>

              {/* Reason */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Symptoms & Reason for Visit *
                </label>
                <textarea
                  required
                  rows={3}
                  value={bookForm.reason}
                  onChange={(e) => setBookForm({ ...bookForm, reason: e.target.value })}
                  placeholder="Describe your health symptoms, questions or medication renewal requests in English or your native language..."
                  className="w-full text-sm border border-slate-200 rounded-xl p-2.5 outline-none focus:border-indigo-600"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowBookModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingBook}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition"
                >
                  {submittingBook ? "Booking..." : "Submit Appointment Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Document Consultation Modal (Doctor) */}
      {showConsultModal && selectedAppt && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Stethoscope size={18} className="text-indigo-600" />
                Document Clinical Consultation (EHR)
              </h3>
              <button
                onClick={() => setShowConsultModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl text-xs space-y-1">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-slate-700">Patient: {selectedAppt.patient_name}</p>
                <span className="text-[11px] text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded font-medium">
                  Lang: {selectedAppt.patient_language || "English"}
                </span>
              </div>
              <p className="text-slate-500">Chief Complaint: {selectedAppt.reason}</p>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setAiPatientName(selectedAppt.patient_name);
                  setAiMessage(selectedAppt.reason);
                  setAiLang(selectedAppt.patient_language || "Hindi");
                  setShowAIModal(true);
                }}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1.5 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-200"
              >
                <Sparkles size={14} /> Open Bilingual AI Assistant
              </button>
            </div>

            <form onSubmit={handleConsultSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Clinical Diagnosis (ICD-10 / Standard Clinical Term) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Essential Hypertension, Acute Upper Respiratory Infection"
                  value={consultForm.diagnosis}
                  onChange={(e) => setConsultForm({ ...consultForm, diagnosis: e.target.value })}
                  className="w-full text-sm border border-slate-200 rounded-xl p-2.5 outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Clinical Notes, Examination Findings & Treatment Plan *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Record patient vitals (BP, SpO2, Temp), examination findings, dietary advice, and follow-up recommendation..."
                  value={consultForm.clinical_notes}
                  onChange={(e) => setConsultForm({ ...consultForm, clinical_notes: e.target.value })}
                  className="w-full text-sm border border-slate-200 rounded-xl p-2.5 outline-none focus:border-indigo-600"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowConsultModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingConsult}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition"
                >
                  {submittingConsult ? "Saving..." : "Save & Complete Consultation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Multilingual Doctor-Patient AI Modal */}
      {showAIModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Languages size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">
                    Bilingual Doctor-Patient Clinical Conversation AI
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Natural Indian clinical dialogue across 8 regional languages with doctor-reviewed English summary
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAIModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Patient Name
                </label>
                <input
                  type="text"
                  value={aiPatientName}
                  onChange={(e) => setAiPatientName(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none focus:border-indigo-600"
                  placeholder="Patient Name"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Language for Consultation
                </label>
                <select
                  value={aiLang}
                  onChange={(e) => setAiLang(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none focus:border-indigo-600 font-medium"
                >
                  <option value="Hindi">Hindi (हिंदी)</option>
                  <option value="Kannada">Kannada (ಕನ್ನಡ)</option>
                  <option value="Tamil">Tamil (தமிழ்)</option>
                  <option value="Telugu">Telugu (తెలుగు)</option>
                  <option value="Malayalam">Malayalam (മലയാളം)</option>
                  <option value="Marathi">Marathi (मराठी)</option>
                  <option value="Bengali">Bengali (বাংলা)</option>
                  <option value="English">Indian English</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Patient Symptom Statement (In native script or Romanized text)
              </label>
              <textarea
                rows={3}
                value={aiMessage}
                onChange={(e) => setAiMessage(e.target.value)}
                placeholder="e.g. मुझे 3 दिन से तेज़ बुखार, गले में खराश और बदन दर्द है (or 'nanna thale novu ide mattu jwara ide')..."
                className="w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none focus:border-indigo-600"
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <ShieldCheck size={13} className="text-teal-600" />
                Respects CDSCO & NMC ethical tele-prescribing guidelines
              </span>
              <button
                type="button"
                onClick={handleRunAIConsultation}
                disabled={aiLoading}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition"
              >
                {aiLoading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Processing Clinical AI...
                  </>
                ) : (
                  <>
                    <Send size={13} /> Run Bilingual AI Consultation
                  </>
                )}
              </button>
            </div>

            {aiResult && (
              <div className="mt-4 pt-4 border-t border-slate-200 space-y-4">
                {/* Vernacular Reply */}
                <div className="p-4 bg-teal-50 border border-teal-200 rounded-xl">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 bg-teal-100 px-2 py-0.5 rounded">
                    Doctor's Response ({aiResult.detected_language})
                  </span>
                  <p className="text-sm text-teal-950 font-medium mt-2 leading-relaxed whitespace-pre-line">
                    {aiResult.vernacular_reply}
                  </p>
                </div>

                {/* English Translation */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 bg-slate-200 px-2 py-0.5 rounded">
                    English Clinical Translation
                  </span>
                  <p className="text-xs text-slate-800 font-medium mt-1 leading-relaxed whitespace-pre-line">
                    {aiResult.english_reply}
                  </p>
                </div>

                {/* Structured Extraction Tags */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl">
                    <p className="font-bold text-rose-800 text-[11px] mb-1">Identified Symptoms:</p>
                    <div className="flex flex-wrap gap-1">
                      {aiResult.extracted_symptoms.map((sym, idx) => (
                        <span key={idx} className="bg-white text-rose-700 px-2 py-0.5 rounded-md text-[10px] font-semibold border border-rose-200">
                          {sym}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                    <p className="font-bold text-amber-800 text-[11px] mb-1">Prescribing Cautions:</p>
                    <div className="flex flex-wrap gap-1">
                      {aiResult.prescribing_cautions.map((cau, idx) => (
                        <span key={idx} className="bg-white text-amber-800 px-2 py-0.5 rounded-md text-[10px] font-medium border border-amber-200">
                          {cau}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Recommended Diagnostic Tests */}
                {aiResult.recommended_diagnostic_tests.length > 0 && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs">
                    <p className="font-bold text-blue-800 text-[11px] mb-1">Recommended Indian Diagnostic Workup:</p>
                    <div className="flex flex-wrap gap-1">
                      {aiResult.recommended_diagnostic_tests.map((test, idx) => (
                        <span key={idx} className="bg-white text-blue-700 px-2 py-0.5 rounded-md text-[10px] font-medium border border-blue-200">
                          {test}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Clinical Summary English */}
                <div className="p-3.5 bg-indigo-50 border border-indigo-200 rounded-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700">
                      Doctor-Reviewed English Clinical Summary
                    </span>
                    {isDoctor && showConsultModal && (
                      <button
                        type="button"
                        onClick={copyAIToClinicalNotes}
                        className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-2.5 py-1 rounded-lg transition"
                      >
                        Copy to Clinical Notes
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-indigo-950 mt-1 font-medium leading-relaxed">
                    {aiResult.clinical_summary_english}
                  </p>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowAIModal(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Indian Payment Gateway Modal for OPD Consultation Fee */}
      {paymentAppt && (
        <PaymentModal
          isOpen={!!paymentAppt}
          onClose={() => setPaymentAppt(null)}
          amount={paymentAppt.consultation_fee_inr || 500}
          title={`OPD Fee: ${paymentAppt.doctor_name || "Specialist Physician"}`}
          description={`Consultation #${paymentAppt.id} • ${paymentAppt.appointment_date} at ${paymentAppt.slot_time}`}
          patientName={paymentAppt.patient_name}
          onPaymentSuccess={(orderId?: string) => {
            setPaidApptIds((prev) => [...prev, paymentAppt.id]);
            setPaymentAppt(null);
            showToast(`Payment successful! Ref ID: ${orderId || "PAID"}. Consultation confirmed.`, "success");
          }}
        />
      )}
      </div>
    </DashboardLayout>
  );
}
