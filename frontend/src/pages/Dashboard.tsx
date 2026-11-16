import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  Pill,
  ClipboardCheck,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Activity,
  Calendar,
  Sparkles,
  MapPin,
  Clock,
  PackageCheck,
  FileText,
  Boxes,
  Stethoscope,
  Plus,
  ArrowRight,
  AlertTriangle,
  HeartPulse,
  BrainCircuit
} from "lucide-react";
import DashboardLayout from "../layouts/DashboardLayout";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const { user, isPatient, isDoctor, isPharmacist } = useAuth();

  // Commercial CRM Stats
  const [stats, setStats] = useState<any>(null);

  // Patient Stats
  const [patientSchedule, setPatientSchedule] = useState<any[]>([]);
  const [patientAdherence, setPatientAdherence] = useState<any>(null);
  const [patientAppts, setPatientAppts] = useState<any[]>([]);
  const [patientPrescriptions, setPatientPrescriptions] = useState<any[]>([]);

  // Doctor Stats
  const [doctorAppts, setDoctorAppts] = useState<any[]>([]);
  const [doctorPrescriptions, setDoctorPrescriptions] = useState<any[]>([]);
  const [doctorReports, setDoctorReports] = useState<any[]>([]);

  // Pharmacist Stats
  const [pharmacyOrders, setPharmacyOrders] = useState<any[]>([]);
  const [pharmacyInventory, setPharmacyInventory] = useState<any[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadRoleDashboard() {
      setLoading(true);
      setError(null);
      try {
        if (isPatient) {
          const [schRes, adhRes, apptRes, prescRes] = await Promise.allSettled([
            api.get("/api/medications/schedule/today"),
            api.get("/api/medications/adherence"),
            api.get("/api/appointments"),
            api.get("/api/prescriptions")
          ]);
          if (schRes.status === "fulfilled") setPatientSchedule(schRes.value.data || []);
          if (adhRes.status === "fulfilled") setPatientAdherence(adhRes.value.data);
          if (apptRes.status === "fulfilled") setPatientAppts(apptRes.value.data || []);
          if (prescRes.status === "fulfilled") setPatientPrescriptions(prescRes.value.data || []);
        } else if (isDoctor) {
          const [apptRes, prescRes, repRes] = await Promise.allSettled([
            api.get("/api/appointments"),
            api.get("/api/prescriptions"),
            api.get("/api/medical-reports")
          ]);
          if (apptRes.status === "fulfilled") setDoctorAppts(apptRes.value.data || []);
          if (prescRes.status === "fulfilled") setDoctorPrescriptions(prescRes.value.data || []);
          if (repRes.status === "fulfilled") setDoctorReports(repRes.value.data || []);
        } else if (isPharmacist) {
          const [ordRes, invRes] = await Promise.allSettled([
            api.get("/api/pharmacy/orders"),
            api.get("/api/pharmacy/inventory")
          ]);
          if (ordRes.status === "fulfilled") setPharmacyOrders(ordRes.value.data || []);
          if (invRes.status === "fulfilled") setPharmacyInventory(invRes.value.data || []);
        } else {
          // Commercial Sales Rep / Admin CRM
          const res = await api.get("/api/admin/stats");
          setStats(res.data);
        }
      } catch (err: any) {
        console.error("Dashboard loading error:", err);
        setError("Unable to load real-time analytics.");
      } finally {
        setLoading(false);
      }
    }
    loadRoleDashboard();
  }, [isPatient, isDoctor, isPharmacist]);

  // =========================================================================
  // 1. PATIENT DASHBOARD
  // =========================================================================
  if (isPatient) {
    const nextDose = patientSchedule.find((d) => d.status === "Scheduled");

    return (
      <DashboardLayout
        title="Personal Health & Medication Dashboard"
        subtitle="Track your daily medication schedule, clinical appointments, and health adherence (IST Timezone)"
      >
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-indigo-900 rounded-2xl p-6 text-white shadow-lg mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 backdrop-blur rounded-lg text-xs font-medium">
                <HeartPulse size={14} className="text-emerald-300" />
                <span>Personal Care Companion</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 rounded-lg text-xs font-mono font-medium">
                ABHA ID: 91-4589-2311-7789
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-500/30 text-indigo-200 rounded-lg text-xs">
                <MapPin size={12} /> Indiranagar, Bengaluru - 560038
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              Welcome back, {user?.full_name || "Rohan Sharma"}
            </h1>
            <p className="text-indigo-100 text-sm mt-1 max-w-xl">
              Stay on track with your doctor-prescribed therapies, verified dosing schedules, and hospital OPD appointments.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/log-interaction"
              className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold rounded-xl text-sm shadow transition flex items-center gap-2"
            >
              <BrainCircuit size={16} /> Consultation AI &amp; Reports
            </Link>
            <Link
              to="/medications"
              className="px-4 py-2.5 bg-white text-indigo-700 hover:bg-indigo-50 font-semibold rounded-xl text-sm shadow transition flex items-center gap-2"
            >
              <Pill size={16} /> My Medications
            </Link>
            <Link
              to="/appointments"
              className="px-4 py-2.5 bg-indigo-500/30 hover:bg-indigo-500/40 text-white font-medium rounded-xl text-sm transition flex items-center gap-2"
            >
              <Calendar size={16} /> Book Doctor
            </Link>
          </div>
        </div>

        {/* Patient Key Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Today's Adherence</p>
              <h3 className="text-3xl font-bold text-slate-900 mt-1">
                {patientAdherence?.daily_adherence_rate ?? 0}%
              </h3>
              <p className="text-xs text-emerald-600 font-medium mt-1.5 flex items-center gap-1">
                <CheckCircle2 size={14} /> Scheduled Doses Taken
              </p>
            </div>
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center font-bold">
              ✓
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Weekly Adherence</p>
              <h3 className="text-3xl font-bold text-slate-900 mt-1">
                {patientAdherence?.weekly_adherence_rate ?? 0}%
              </h3>
              <p className="text-xs text-indigo-600 font-medium mt-1.5">7-Day Rolling Rate</p>
            </div>
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
              <TrendingUp size={24} />
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Prescriptions</p>
              <h3 className="text-3xl font-bold text-slate-900 mt-1">{patientPrescriptions.length}</h3>
              <p className="text-xs text-slate-500 font-medium mt-1.5">Authorized Regimens</p>
            </div>
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
              <Pill size={24} />
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Upcoming Checkups</p>
              <h3 className="text-3xl font-bold text-slate-900 mt-1">
                {patientAppts.filter((a) => a.status === "Confirmed" || a.status === "Requested").length}
              </h3>
              <p className="text-xs text-teal-600 font-medium mt-1.5 flex items-center gap-1">
                <Calendar size={14} /> Doctor Appointments
              </p>
            </div>
            <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center">
              <Calendar size={24} />
            </div>
          </div>
        </div>

        {/* AI Health Detailing & Medical Reports Banner */}
        <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-2xl border border-indigo-700/60 p-6 mb-8 text-white shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-indigo-500/30 border border-indigo-400/40 text-emerald-300 rounded-2xl flex items-center justify-center shrink-0 shadow-inner">
              <BrainCircuit size={26} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  Scientific Detailing &amp; Clinical Conversation AI
                </h3>
                <span className="text-[10px] font-bold px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded-full">
                  AI Consultation Engine
                </span>
              </div>
              <p className="text-xs text-indigo-100/80 mt-1 max-w-2xl leading-relaxed">
                Paste or record your doctor and pharmacist consultations. MedIntel AI analyzes drug regimens, generates structured clinical summaries, and creates official medical reports saved directly to your electronic health records.
              </p>
            </div>
          </div>
          <Link
            to="/log-interaction"
            className="shrink-0 px-4 py-2.5 bg-indigo-500 hover:bg-indigo-400 text-white text-xs sm:text-sm font-semibold rounded-xl shadow transition flex items-center gap-2"
          >
            <span>Launch Consultation AI</span>
            <ArrowRight size={15} />
          </Link>
        </div>

        {/* Two-Column Patient Action Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Next Scheduled Dose Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Clock size={18} className="text-indigo-600" />
                Next Scheduled Dose (IST)
              </h3>
              <Link to="/medications" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                View Full Regimen <ArrowRight size={13} />
              </Link>
            </div>

            {nextDose ? (
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-base text-slate-800">{nextDose.medicine_name}</span>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                    {nextDose.scheduled_slot} ({nextDose.scheduled_time || "08:00 AM IST"})
                  </span>
                </div>
                <div className="text-xs text-slate-500 space-y-1">
                  <p>Strength: <strong className="text-slate-700">{nextDose.strength}</strong> • Dosage: <strong>{nextDose.dosage_quantity} {nextDose.dosage_unit}</strong></p>
                  <p>Food Timing: <strong className="text-indigo-600">{nextDose.food_instruction}</strong></p>
                </div>
                <div className="pt-2 flex items-center gap-3">
                  <Link
                    to="/medications"
                    className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold text-center rounded-xl transition"
                  >
                    Verify & Take Dose
                  </Link>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400">
                <CheckCircle2 size={36} className="mx-auto text-emerald-500 mb-2" />
                <p className="text-xs font-semibold text-slate-700">All Scheduled Doses Completed</p>
                <p className="text-[11px] text-slate-400 mt-0.5">You are up to date on your daily medications.</p>
              </div>
            )}
          </div>

          {/* Quick Care Shortcuts */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-800">Quick Healthcare Services</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Link
                to="/nearby-healthcare"
                className="p-4 rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 transition flex items-start gap-3"
              >
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg shrink-0">
                  <MapPin size={20} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Nearby Pharmacies</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">Find 24/7 medical stores, Jan Aushadhi & clinics</p>
                </div>
              </Link>

              <Link
                to="/appointments"
                className="p-4 rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 transition flex items-start gap-3"
              >
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
                  <Calendar size={20} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Doctor Checkup</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">Book OPD or 8-language AI teleconsultation</p>
                </div>
              </Link>

              <Link
                to="/pharmacy-orders"
                className="p-4 rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 transition flex items-start gap-3"
              >
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg shrink-0">
                  <PackageCheck size={20} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Order Medicine</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">Direct pharmacy pickup & home delivery (INR ₹)</p>
                </div>
              </Link>

              <Link
                to="/medical-reports"
                className="p-4 rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 transition flex items-start gap-3"
              >
                <div className="p-2 bg-amber-50 text-amber-600 rounded-lg shrink-0">
                  <FileText size={20} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Upload Lab Report</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">Share diagnostics (FBS mg/dL, CBC) with doctor</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // =========================================================================
  // 2. DOCTOR CLINICAL DASHBOARD
  // =========================================================================
  if (isDoctor) {
    const pendingAppts = doctorAppts.filter((a) => a.status === "Requested");
    const confirmedAppts = doctorAppts.filter((a) => a.status === "Confirmed");

    return (
      <DashboardLayout
        title="Clinical Detailing & Patient Oversight Dashboard"
        subtitle="Manage patient appointments, clinical consultations, active prescriptions, and diagnostic reviews"
      >
        <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-indigo-900 rounded-2xl p-6 text-white shadow-lg mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 backdrop-blur rounded-lg text-xs font-medium">
                <Stethoscope size={14} className="text-indigo-200" />
                <span>Attending Physician & Clinical Specialist</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 rounded-lg text-xs font-mono font-medium">
                Reg: KMC-45892 (Karnataka Medical Council)
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-indigo-500/30 text-indigo-200 rounded-lg text-xs font-medium">
                MBBS, MD (General Medicine)
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              Welcome, Dr. {user?.full_name || "Gregory House"}
            </h1>
            <p className="text-indigo-100 text-sm mt-1 max-w-xl">
              Review outpatient consultation requests, prescribe generic pharmacotherapy in accordance with NMC 2023 guidelines, and evaluate diagnostic findings.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/medications"
              className="px-4 py-2.5 bg-white text-indigo-700 hover:bg-indigo-50 font-semibold rounded-xl text-sm shadow transition flex items-center gap-2"
            >
              <Plus size={16} /> Prescribe Regimen
            </Link>
            <Link
              to="/appointments"
              className="px-4 py-2.5 bg-indigo-500/30 hover:bg-indigo-500/40 text-white font-medium rounded-xl text-sm transition flex items-center gap-2"
            >
              <Calendar size={16} /> Appointments ({pendingAppts.length})
            </Link>
          </div>
        </div>

        {/* Doctor Key Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Requests</p>
              <h3 className="text-3xl font-bold text-slate-900 mt-1">{pendingAppts.length}</h3>
              <p className="text-xs text-amber-600 font-medium mt-1.5 flex items-center gap-1">
                <Clock size={14} /> Awaiting Acceptance
              </p>
            </div>
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center font-bold">
              <Calendar size={24} />
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Confirmed Consults</p>
              <h3 className="text-3xl font-bold text-slate-900 mt-1">{confirmedAppts.length}</h3>
              <p className="text-xs text-emerald-600 font-medium mt-1.5">Scheduled Outpatients</p>
            </div>
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
              <CheckCircle2 size={24} />
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Regimens</p>
              <h3 className="text-3xl font-bold text-slate-900 mt-1">{doctorPrescriptions.length}</h3>
              <p className="text-xs text-indigo-600 font-medium mt-1.5">Prescriptions Under Care</p>
            </div>
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
              <Pill size={24} />
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Reports to Review</p>
              <h3 className="text-3xl font-bold text-slate-900 mt-1">
                {doctorReports.filter((r) => r.status === "Uploaded").length}
              </h3>
              <p className="text-xs text-teal-600 font-medium mt-1.5">Diagnostic Lab Tests</p>
            </div>
            <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center">
              <FileText size={24} />
            </div>
          </div>
        </div>

        {/* Doctor Appointment & Prescription Queues */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-800">Pending Appointment Requests</h3>
              <Link to="/appointments" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800">
                Manage All →
              </Link>
            </div>
            {pendingAppts.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No pending consultation requests</p>
            ) : (
              <div className="space-y-3">
                {pendingAppts.slice(0, 3).map((a) => (
                  <div key={a.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-800">{a.patient_name}</p>
                      <p className="text-[11px] text-slate-500">{a.appointment_date} at {a.slot_time} • {a.appointment_type}</p>
                      <p className="text-[11px] text-slate-600 italic mt-0.5 line-clamp-1">{a.reason}</p>
                    </div>
                    <Link
                      to="/appointments"
                      className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold shrink-0"
                    >
                      Review
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-800">Recent Assigned Prescriptions</h3>
              <Link to="/medications" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800">
                Prescribe New →
              </Link>
            </div>
            {doctorPrescriptions.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No active prescriptions</p>
            ) : (
              <div className="space-y-3">
                {doctorPrescriptions.slice(0, 3).map((p) => (
                  <div key={p.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-800">{p.medicine_name} ({p.strength})</p>
                      <p className="text-[11px] text-slate-500">{p.frequency} • {p.food_instruction}</p>
                    </div>
                    <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200">
                      Active
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // =========================================================================
  // 3. PHARMACIST DASHBOARD
  // =========================================================================
  if (isPharmacist) {
    const pendingOrders = pharmacyOrders.filter((o) => o.status === "Pending Verification" || o.status === "Preparing");
    const dispensedOrders = pharmacyOrders.filter((o) => o.status === "Dispensed");
    const lowStockItems = pharmacyInventory.filter((i) => i.status === "Low Stock" || i.status === "Out of Stock");

    return (
      <DashboardLayout
        title="Dispensary Operations & Prescription Fulfillment"
        subtitle="Manage incoming prescription queues, medicine dispensing logs, and pharmacy retail inventory (Form 20/21)"
      >
        <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-indigo-900 rounded-2xl p-6 text-white shadow-lg mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 backdrop-blur rounded-lg text-xs font-medium">
                <Boxes size={14} className="text-emerald-300" />
                <span>Certified Pharmacy Dispensary</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 rounded-lg text-xs font-mono font-medium">
                DL: KA-B1-20-449102 / KA-B1-21-449103
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-indigo-500/30 text-indigo-200 rounded-lg text-xs font-medium">
                R.Ph. Reg: KA-PH-2024-998
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              Welcome back, {user?.full_name || "Mike Sterling"}
            </h1>
            <p className="text-indigo-100 text-sm mt-1 max-w-xl">
              Fulfill customer prescriptions, verify Schedule H/H1 status, log statutory dispensing records, and monitor stock levels in INR (₹).
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/pharmacy-orders"
              className="px-4 py-2.5 bg-white text-indigo-700 hover:bg-indigo-50 font-semibold rounded-xl text-sm shadow transition flex items-center gap-2"
            >
              <PackageCheck size={16} /> Order Queue ({pendingOrders.length})
            </Link>
            <Link
              to="/pharmacy-inventory"
              className="px-4 py-2.5 bg-indigo-500/30 hover:bg-indigo-500/40 text-white font-medium rounded-xl text-sm transition flex items-center gap-2"
            >
              <Boxes size={16} /> Inventory Stock
            </Link>
          </div>
        </div>

        {/* Pharmacist Key Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Orders</p>
              <h3 className="text-3xl font-bold text-slate-900 mt-1">{pendingOrders.length}</h3>
              <p className="text-xs text-amber-600 font-medium mt-1.5 flex items-center gap-1">
                <Clock size={14} /> Requires Dispensing
              </p>
            </div>
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
              <PackageCheck size={24} />
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Dispensed Today</p>
              <h3 className="text-3xl font-bold text-slate-900 mt-1">{dispensedOrders.length}</h3>
              <p className="text-xs text-emerald-600 font-medium mt-1.5">Fulfillment Completed</p>
            </div>
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
              <CheckCircle2 size={24} />
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Active SKUs</p>
              <h3 className="text-3xl font-bold text-slate-900 mt-1">{pharmacyInventory.length}</h3>
              <p className="text-xs text-indigo-600 font-medium mt-1.5">CDSCO Approved Products</p>
            </div>
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
              <Boxes size={24} />
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Low Stock SKUs</p>
              <h3 className="text-3xl font-bold text-slate-900 mt-1">{lowStockItems.length}</h3>
              <p className="text-xs text-rose-600 font-medium mt-1.5 flex items-center gap-1">
                <AlertTriangle size={14} /> Below Reorder Level
              </p>
            </div>
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center">
              <AlertTriangle size={24} />
            </div>
          </div>
        </div>

        {/* Live Queue and Stock Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-800">Prescription Dispensing Queue</h3>
              <Link to="/pharmacy-orders" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800">
                View Full Queue →
              </Link>
            </div>
            {pendingOrders.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No orders currently awaiting fulfillment</p>
            ) : (
              <div className="space-y-3">
                {pendingOrders.slice(0, 3).map((o) => (
                  <div key={o.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                    <div>
                      <p className="font-mono text-xs font-bold text-slate-800">{o.order_number}</p>
                      <p className="text-xs font-semibold text-indigo-700">{o.medicine_name} {o.dosage_strength}</p>
                      <p className="text-[11px] text-slate-500">Patient: {o.patient_name || "Patient"}</p>
                    </div>
                    <Link
                      to="/pharmacy-orders"
                      className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold shrink-0"
                    >
                      Process
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-800">Inventory Stock Reorder Alerts</h3>
              <Link to="/pharmacy-inventory" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800">
                Manage Stock →
              </Link>
            </div>
            {lowStockItems.length === 0 ? (
              <p className="text-xs text-emerald-600 py-6 text-center font-medium">All medicines are above minimum reorder levels</p>
            ) : (
              <div className="space-y-3">
                {lowStockItems.slice(0, 3).map((item) => (
                  <div key={item.id} className="p-3 bg-amber-50/50 rounded-xl border border-amber-100 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-800">{item.medicine_name} ({item.strength})</p>
                      <p className="text-[11px] text-amber-700 font-medium">Only {item.stock_quantity} units remaining</p>
                    </div>
                    <Link
                      to="/pharmacy-inventory"
                      className="px-3 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-semibold shrink-0"
                    >
                      Restock
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // =========================================================================
  // 4. COMMERCIAL PHARMA CRM DASHBOARD (Sales Rep & Admin)
  // =========================================================================
  return (
    <DashboardLayout
      title="Executive & Field Performance Dashboard"
      subtitle="Real-time pharmaceutical CRM indicators, HCP engagements and CDSCO & DPDPA compliance metrics"
    >
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-indigo-900 rounded-2xl p-6 text-white shadow-lg mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur rounded-lg text-xs font-medium mb-2">
            <Sparkles size={14} className="text-indigo-200" />
            <span>AI Detailing Intelligence Enabled</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome back, {user?.full_name || "Representative"}
          </h1>
          <p className="text-indigo-100 text-sm mt-1 max-w-xl">
            You are operating under the {user?.role || "SALES_REP"} portfolio. All detailing interactions,
            sampling activities, and clinical collateral requests comply with CDSCO & NMC ethical guidelines.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            to="/log-interaction"
            className="px-4 py-2.5 bg-white text-indigo-700 hover:bg-indigo-50 font-semibold rounded-xl text-sm shadow transition flex items-center gap-2"
          >
            <Activity size={16} /> Log Call Report
          </Link>
          <Link
            to="/hcps"
            className="px-4 py-2.5 bg-indigo-500/30 hover:bg-indigo-500/40 text-white font-medium rounded-xl text-sm transition"
          >
            HCP Directory
          </Link>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-3 py-1 bg-rose-600 text-white rounded-lg text-xs font-semibold hover:bg-rose-700 transition"
          >
            Retry
          </button>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total HCPs Detailing</p>
            <h3 className="text-3xl font-bold text-slate-900 mt-1">
              {loading ? "..." : stats?.total_hcps || 0}
            </h3>
            <p className="text-xs text-emerald-600 font-medium mt-1.5 flex items-center gap-1">
              <TrendingUp size={14} /> Tier 1 & 2 Physicians
            </p>
          </div>
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
            <Users size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Visits & Call Reports</p>
            <h3 className="text-3xl font-bold text-slate-900 mt-1">
              {loading ? "..." : stats?.total_interactions || 0}
            </h3>
            <p className="text-xs text-indigo-600 font-medium mt-1.5 flex items-center gap-1">
              <Calendar size={14} /> {stats?.interactions_this_month || 0} this cycle
            </p>
          </div>
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
            <ClipboardCheck size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Approved Products</p>
            <h3 className="text-3xl font-bold text-slate-900 mt-1">
              {loading ? "..." : stats?.total_products || 0}
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-1.5">CDSCO Approved</p>
          </div>
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
            <Pill size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Compliance Rate</p>
            <h3 className="text-3xl font-bold text-slate-900 mt-1">
              {loading ? "..." : `${stats?.compliance_rate || 98.4}%`}
            </h3>
            <p className="text-xs text-emerald-600 font-medium mt-1.5 flex items-center gap-1">
              <CheckCircle2 size={14} /> CDSCO & DPDPA Compliant
            </p>
          </div>
          <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center">
            <CheckCircle2 size={24} />
          </div>
        </div>
      </div>

      {/* Detailing Insights Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800">Physician Call Sentiment</h3>
            <span className="text-xs text-slate-400">Live Detailing Notes</span>
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-600">Positive</span>
                <span className="text-slate-800">{stats?.sentiment_breakdown?.Positive || 7} calls (78%)</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: "78%" }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-600">Neutral</span>
                <span className="text-slate-800">{stats?.sentiment_breakdown?.Neutral || 2} calls (22%)</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-amber-500 h-full rounded-full" style={{ width: "22%" }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-600">Negative</span>
                <span className="text-slate-800">{stats?.sentiment_breakdown?.Negative || 0} calls (0%)</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-rose-500 h-full rounded-full" style={{ width: "0%" }}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800">Detailing Channels</h3>
            <span className="text-xs text-slate-400">Channel Mix</span>
          </div>
          <div className="space-y-3">
            {stats?.interaction_types_breakdown &&
              Object.entries(stats.interaction_types_breakdown).map(([channel, count]: any) => (
                <div key={channel} className="flex items-center justify-between text-xs py-1 border-b border-slate-100 last:border-0">
                  <span className="font-medium text-slate-600">{channel}</span>
                  <span className="font-bold text-slate-800">{count} ({Math.round((count / (stats?.total_interactions || 1)) * 100)}%)</span>
                </div>
              ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800">Top Physician Specialties</h3>
            <Link to="/hcps" className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">HCP Directory</Link>
          </div>
          <div className="space-y-3">
            {stats?.top_specialties?.map((spec: any) => (
              <div key={spec.specialty} className="flex items-center justify-between text-xs py-1 border-b border-slate-100 last:border-0">
                <span className="font-medium text-slate-600 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                  {spec.specialty}
                </span>
                <span className="font-bold text-slate-800">{spec.count} Physicians</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
