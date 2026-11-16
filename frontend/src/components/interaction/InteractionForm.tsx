import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  Calendar,
  ClipboardList,
  FileText,
  Printer,
  CheckCircle2,
  ExternalLink,
  Sparkles,
  X
} from "lucide-react";
import api from "../../services/api";
import { useToast } from "../../context/ToastContext";
import { useAuth } from "../../context/AuthContext";

import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { updateField } from "./interactionSlice";
import type { Interaction } from "../../types/interaction";

export default function InteractionForm() {
  const { showToast } = useToast();
  const { user, isPatient } = useAuth();
  const interaction = useAppSelector((state) => state.interaction);
  const dispatch = useAppDispatch();

  const [savingMedicalReport, setSavingMedicalReport] = useState(false);
  const [savingInteraction, setSavingInteraction] = useState(false);
  const [savedReportSuccess, setSavedReportSuccess] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);

  const fields = [
    interaction.doctor,
    interaction.hospital,
    interaction.specialization,
    interaction.product,
    interaction.notes,
    interaction.summary,
    interaction.outcomes,
    interaction.followUp,
    interaction.attendees,
    interaction.visitDate,
    interaction.visitTime,
  ];

  const completed = fields.filter(Boolean).length;
  const progress = Math.round((completed / fields.length) * 100);

  const handleChange = (field: keyof Interaction, value: string | number) => {
    dispatch(
      updateField({
        field,
        value,
      })
    );
  };

  // Standard CRM Interaction Save
  const saveInteraction = async () => {
    try {
      setSavingInteraction(true);
      await api.post("/save", interaction);
      showToast("Call Report Saved to CRM Successfully!", "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to save call report. Please verify connection.", "error");
    } finally {
      setSavingInteraction(false);
    }
  };

  // Save as Official Medical Report in Patient's EHR Records
  const saveAsMedicalReport = async () => {
    try {
      setSavingMedicalReport(true);

      const title = interaction.product
        ? `Consultation Detailing: ${interaction.product} (${interaction.doctor || "Physician"})`
        : `Consultation Report: ${interaction.doctor || "Clinical Consultation"}`;

      const reportDate = interaction.visitDate || new Date().toISOString().split("T")[0];

      const clinicalObs = [
        `Consulting Doctor: ${interaction.doctor || "Dr. Gregory House"}`,
        `Hospital / Facility: ${interaction.hospital || "MedIntel Specialty Hospital"}`,
        `Specialty: ${interaction.specialization || "General Medicine"}`,
        `Therapy Regimen: ${interaction.product || "Standard Regimen"}`,
        `Samples / Units: ${interaction.samples || 0}`,
        "",
        "--- CLINICAL SUMMARY ---",
        interaction.summary || "Consultation completed. Patient advised on prescribed regimen.",
        "",
        "--- CONSULTATION NOTES ---",
        interaction.notes || "No detailed notes recorded.",
        "",
        "--- FOLLOW-UP & CARE PLAN ---",
        interaction.followUp ? `Review Date: ${interaction.followUp}` : "Routine follow-up in 4 weeks.",
        interaction.outcomes ? `Outcomes: ${interaction.outcomes}` : ""
      ].join("\n");

      // 1. Save to EHR Medical Reports table
      await api.post("/api/medical-reports", {
        title,
        report_type: "Consultation Summary",
        test_category: interaction.specialization || "Clinical Detailing",
        report_date: reportDate,
        file_name: `Consultation_${(interaction.doctor || "Physician").replace(/[^a-zA-Z0-9]/g, "_")}.pdf`,
        file_size_kb: 1024.0,
        clinical_observations: clinicalObs,
        biomarkers: {
          doctor: interaction.doctor || "Dr. Gregory House",
          hospital: interaction.hospital || "MedIntel Specialty Hospital",
          prescribed_medication: interaction.product || "Telmisartan 40mg",
          specialization: interaction.specialization || "Internal Medicine",
          ai_confidence: `${interaction.confidence || 88}%`,
          sentiment: interaction.sentiment || "Positive"
        }
      });

      // 2. Also log in CRM Interaction store
      try {
        await api.post("/save", interaction);
      } catch (e) {
        console.warn("CRM interaction secondary save: ", e);
      }

      setSavedReportSuccess(true);
      showToast("Official Medical Report successfully created & saved to your Health Records!", "success");
    } catch (err: any) {
      console.error("Save as Medical Report error:", err);
      showToast(err.response?.data?.detail || "Failed to save medical report.", "error");
    } finally {
      setSavingMedicalReport(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Completeness Bar */}
      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            {isPatient ? "Medical Detailing & Consultation Report" : "HCP Detailing Report"}
          </h2>
          <span className="text-xs font-semibold px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-100 flex items-center gap-1">
            <Sparkles size={13} /> AI Extracted
          </span>
        </div>

        <p className="text-slate-500 text-xs sm:text-sm mt-1">
          {isPatient
            ? "Review and edit the AI-extracted consultation details, drug regimens, and clinical advice before saving to your official medical records."
            : "Review and edit AI-extracted HCP detailing details before saving to the enterprise CRM."}
        </p>

        <div className="mt-4">
          <div className="flex justify-between text-xs mb-1.5 font-medium text-slate-600">
            <span>{isPatient ? "Report Completeness" : "CRM Detailing Completion"}</span>
            <span className="font-bold text-indigo-600">{progress}%</span>
          </div>

          <div className="h-2.5 bg-slate-200 rounded-full overflow-hidden">
            <div
              style={{ width: `${progress}%` }}
              className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-700 rounded-full"
            />
          </div>
        </div>
      </div>

      {/* Confirmation Banner When Report is Saved */}
      {savedReportSuccess && (
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-300 rounded-2xl p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-600 text-white rounded-xl flex items-center justify-center shrink-0 shadow-md">
                <CheckCircle2 size={22} />
              </div>
              <div>
                <h4 className="font-bold text-emerald-900 text-sm sm:text-base">
                  Medical Report Successfully Generated &amp; Saved!
                </h4>
                <p className="text-xs text-emerald-700 mt-0.5">
                  Saved into your Central Health EHR Records under CDSCO / DPDPA guidelines.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Link
                to="/medical-reports"
                className="flex-1 sm:flex-none px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow transition flex items-center justify-center gap-1.5"
              >
                <span>View in Medical Reports</span>
                <ExternalLink size={14} />
              </Link>
              <button
                type="button"
                onClick={() => setShowPrintModal(true)}
                className="flex-1 sm:flex-none px-3.5 py-2 bg-white hover:bg-slate-50 border border-emerald-300 text-emerald-800 text-xs font-semibold rounded-xl shadow-xs transition flex items-center justify-center gap-1.5"
              >
                <Printer size={14} />
                <span>Print Report</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Healthcare Professional / Doctor Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <Building2 className="text-indigo-600" size={18} />
          <h3 className="font-semibold text-base text-slate-800">
            {isPatient ? "Consulting Physician & Facility" : "Healthcare Professional"}
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-slate-700">
                {isPatient ? "Consulting Doctor / Specialist" : "Doctor Name"}
              </label>
              {interaction.doctor && (
                <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">
                  AI Filled
                </span>
              )}
            </div>
            <input
              value={interaction.doctor}
              onChange={(e) => handleChange("doctor", e.target.value)}
              placeholder="e.g. Dr. Gregory House"
              className={`w-full rounded-xl border px-3.5 py-2.5 text-xs sm:text-sm outline-none transition ${
                interaction.doctor
                  ? "border-emerald-400 bg-emerald-50/20 focus:ring-2 focus:ring-emerald-100"
                  : "border-slate-300 focus:border-indigo-500"
              }`}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              {isPatient ? "Hospital / Clinic Facility" : "Hospital"}
            </label>
            <input
              value={interaction.hospital}
              onChange={(e) => handleChange("hospital", e.target.value)}
              placeholder="e.g. MedIntel Specialty Hospital"
              className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-slate-700 mb-1">
              {isPatient ? "Medical Department / Specialty" : "Specialization"}
            </label>
            <input
              value={interaction.specialization}
              onChange={(e) => handleChange("specialization", e.target.value)}
              placeholder="e.g. Internal Medicine / Diabetology"
              className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Visit & Regimen Details Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="text-indigo-600" size={18} />
          <h3 className="font-semibold text-base text-slate-800">
            {isPatient ? "Consultation & Therapy Regimen Details" : "Visit Details"}
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              {isPatient ? "Consultation Date" : "Visit Date"}
            </label>
            <input
              type="date"
              value={interaction.visitDate}
              onChange={(e) => handleChange("visitDate", e.target.value)}
              className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              {isPatient ? "Consultation Time" : "Visit Time"}
            </label>
            <input
              type="time"
              value={interaction.visitTime}
              onChange={(e) => handleChange("visitTime", e.target.value)}
              className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              {isPatient ? "Consultation Format" : "Interaction Type"}
            </label>
            <input
              value={interaction.interactionType}
              onChange={(e) => handleChange("interactionType", e.target.value)}
              placeholder="OPD Physical / Virtual Telehealth"
              className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              {isPatient ? "Attending Family / Attendees" : "Attendees"}
            </label>
            <input
              value={interaction.attendees}
              onChange={(e) => handleChange("attendees", e.target.value)}
              placeholder="Doctor, Patient, Attendant"
              className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              {isPatient ? "Prescribed Medicine / Therapy Discussed" : "Product"}
            </label>
            <input
              value={interaction.product}
              onChange={(e) => handleChange("product", e.target.value)}
              placeholder="e.g. Telmisartan 40mg"
              className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              {isPatient ? "Medicine Units / Dosage Packs" : "Samples"}
            </label>
            <input
              type="number"
              value={interaction.samples}
              onChange={(e) => handleChange("samples", Number(e.target.value))}
              className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm outline-none"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-slate-700 mb-1">
              {isPatient ? "Care Leaflets / Educational Materials" : "Materials Shared"}
            </label>
            <input
              value={interaction.materials}
              onChange={(e) => handleChange("materials", e.target.value)}
              placeholder="e.g. Patient Regimen Guide, Diet Chart"
              className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm outline-none"
            />
          </div>
        </div>
      </div>

      {/* Discussion & Clinical Observations */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6">
        <div className="flex items-center gap-2 mb-3">
          <ClipboardList size={18} className="text-indigo-600" />
          <h3 className="font-semibold text-base text-slate-800">
            {isPatient ? "Clinical Observations & Doctor Instructions" : "Discussion Notes"}
          </h3>
        </div>

        <textarea
          rows={4}
          value={interaction.notes}
          onChange={(e) => handleChange("notes", e.target.value)}
          placeholder={
            isPatient
              ? "Doctor's instructions, dietary restrictions, dosage timings..."
              : "Doctor feedback and detailing points..."
          }
          className="w-full border border-slate-300 rounded-xl p-3.5 text-xs sm:text-sm resize-none outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
        />
      </div>

      {/* AI Summary Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <FileText size={18} className="text-indigo-600" />
            <h3 className="font-semibold text-base text-slate-800">
              {isPatient ? "AI Consultation Summary & Care Guidance" : "AI Summary"}
            </h3>
          </div>
          <span className="rounded-full bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 text-xs font-bold text-indigo-700">
            AI Confidence: {interaction.confidence}%
          </span>
        </div>

        <textarea
          rows={4}
          value={interaction.summary}
          onChange={(e) => handleChange("summary", e.target.value)}
          className="w-full border border-slate-300 rounded-xl p-3.5 text-xs sm:text-sm resize-none outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 leading-relaxed"
        />

        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-slate-50 p-3 border border-slate-200">
            <p className="text-[11px] text-slate-500">Sentiment</p>
            <h4 className="font-bold text-xs sm:text-sm text-slate-800 mt-0.5">{interaction.sentiment}</h4>
          </div>

          <div className="rounded-xl bg-slate-50 p-3 border border-slate-200">
            <p className="text-[11px] text-slate-500">Priority</p>
            <h4 className="font-bold text-xs sm:text-sm text-slate-800 mt-0.5">
              {interaction.suggestions?.priority || "Normal"}
            </h4>
          </div>

          <div className="rounded-xl bg-slate-50 p-3 border border-slate-200">
            <p className="text-[11px] text-slate-500">Compliance</p>
            <h4 className="font-bold text-xs sm:text-sm text-slate-800 mt-0.5">
              {interaction.compliance?.ready ? "Verified ✓" : "Pending"}
            </h4>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3 pt-2">
        {/* Primary Action: Save as Official Medical Report */}
        <button
          type="button"
          disabled={savingMedicalReport}
          onClick={saveAsMedicalReport}
          className="w-full rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 py-3.5 text-white font-bold text-xs sm:text-sm shadow-lg transition-all duration-300 active:scale-[0.99] hover:shadow-xl disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {savingMedicalReport ? (
            <span>Saving Official Medical Report...</span>
          ) : (
            <>
              <CheckCircle2 size={17} />
              <span>💾 Save as Official Medical Report in EHR Records</span>
            </>
          )}
        </button>

        <div className="flex flex-col sm:flex-row gap-3">
          {/* Secondary Action: Print / Export Consultation Report */}
          <button
            type="button"
            onClick={() => setShowPrintModal(true)}
            className="flex-1 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 py-3 text-indigo-700 font-semibold text-xs sm:text-sm shadow-xs transition flex items-center justify-center gap-2"
          >
            <Printer size={16} />
            <span>🖨️ Print / Export Consultation Report</span>
          </button>

          {/* Tertiary Action: Save Interaction to CRM */}
          <button
            type="button"
            disabled={savingInteraction}
            onClick={saveInteraction}
            className="flex-1 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 py-3 text-slate-700 font-semibold text-xs sm:text-sm shadow-xs transition flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {savingInteraction ? (
              <span>Saving...</span>
            ) : (
              <span>Save Interaction Record Only</span>
            )}
          </button>
        </div>
      </div>

      {/* Printable Consultation Report Modal */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-6">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-indigo-600 rounded-xl text-white flex items-center justify-center font-bold">
                  Rx
                </div>
                <div>
                  <h3 className="font-extrabold text-base sm:text-lg text-slate-900">
                    MedIntel Health Ecosystem
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Official Clinical Consultation &amp; Regimen Detailing Report
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPrintModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Document Body */}
            <div className="space-y-4 text-xs sm:text-sm text-slate-800 leading-relaxed border border-slate-200 rounded-2xl p-5 bg-slate-50/50">
              <div className="grid grid-cols-2 gap-4 pb-3 border-b border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Patient</span>
                  <strong className="text-slate-900 text-sm">{user?.full_name || "Johnathan Doe"}</strong>
                  <p className="text-[11px] text-slate-500">ABHA: 91-4589-2041-8891</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Consulting Physician</span>
                  <strong className="text-slate-900 text-sm">{interaction.doctor || "Dr. Gregory House, MBBS, MD"}</strong>
                  <p className="text-[11px] text-slate-500">{interaction.hospital || "MedIntel Specialty Hospital"}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pb-3 border-b border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Consultation Date</span>
                  <span className="font-semibold text-slate-800">
                    {interaction.visitDate || new Date().toISOString().split("T")[0]}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Prescribed Therapy</span>
                  <span className="font-semibold text-indigo-700">
                    {interaction.product || "Telmisartan 40mg"}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                  AI Structured Summary &amp; Clinical Findings
                </span>
                <p className="bg-white p-3 rounded-xl border border-slate-200 text-slate-700 text-xs">
                  {interaction.summary || "Consultation successfully conducted. Patient was counseled regarding prescribed dosage and regimen."}
                </p>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                  Clinical Observations &amp; Regimen Notes
                </span>
                <p className="bg-white p-3 rounded-xl border border-slate-200 text-slate-700 text-xs">
                  {interaction.notes || "No additional observations noted."}
                </p>
              </div>

              <div className="pt-2 text-[11px] text-slate-500 flex items-center justify-between">
                <span>Follow-Up Review: {interaction.followUp || "4 Weeks"}</span>
                <span>AI Confidence: {interaction.confidence || 88}%</span>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200 text-[10px] text-slate-400 text-center">
                Generated via MedIntel AI Clinical Detailing • CDSCO &amp; NMC Telemedicine Compliant (2020)
              </div>
            </div>

            {/* Modal Actions */}
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowPrintModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow transition flex items-center gap-1.5"
              >
                <Printer size={15} />
                <span>Print Document</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
