import { useState } from "react";
import api from "../../services/api";
import { useToast } from "../../context/ToastContext";
import { useAuth } from "../../context/AuthContext";
import { Sparkles, BrainCircuit } from "lucide-react";

import { useDispatch, useSelector } from "react-redux";

import { setInteraction } from "./interactionSlice";

import type { RootState } from "../../store/store";

export default function AIAssistant() {
  const { showToast } = useToast();
  const { isPatient } = useAuth();
  const dispatch = useDispatch();

  const interaction = useSelector(
    (state: RootState) => state.interaction
  );

  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);

  // Patient Sample Templates
  const patientSamples = [
    {
      title: "🩺 Hypertension Regimen",
      text: "Discussed blood pressure readings with Dr. Gregory House at MedIntel Specialty Hospital. Current BP is 138/88 mmHg. Prescribed Telmisartan 40mg once daily in morning before breakfast. Advised low-sodium diet (<2g/day), daily 30-minute brisk walk, and monitor BP twice weekly. Follow-up consultation scheduled in 4 weeks."
    },
    {
      title: "🩸 Type 2 Diabetes Review",
      text: "Consultation with Dr. Gregory House at MedIntel Specialty Hospital for quarterly diabetes review. Fasting blood sugar 132 mg/dL, HbA1c 7.2%. Prescribed Glycomet 500mg SR twice daily after meals. Recommended continuous glucose monitoring, foot care, and dietary fiber intake. Next HbA1c test in 90 days."
    },
    {
      title: "💊 Fever & Antibiotics Care",
      text: "Visited Apollo Hospital for persistent fever (101°F) and productive chest cough for 3 days. Doctor prescribed Augmentin 625mg twice daily for 5 days and Dolo 650 SOS for fever. Advised steam inhalation twice daily and abundant fluid hydration. Review after 5 days if symptoms do not improve."
    }
  ];

  // HCP / Commercial Detailing Samples
  const repSamples = [
    {
      title: "📋 Dolo 650 HCP Detailing",
      text: "Met Dr. Gregory House at MedIntel Specialty Hospital. Discussed Dolo 650 rapid antipyretic efficacy and clinical safety in adult pyrexia. Shared Phase III monograph brochure. Doctor showed strong interest and requested clinical comparative study. Provided 5 product samples."
    },
    {
      title: "🩺 CardioGuard Review",
      text: "Met Dr. Raj Sharma at Apollo Hospital. Discussed CardioGuard (Telmisartan 40mg) for essential hypertension management. Physician noted excellent tolerability in elderly cohort and requested 10 clinical sample packs."
    }
  ];

  const currentSamples = isPatient ? patientSamples : repSamples;

  const generate = async () => {
    if (!prompt.trim()) {
      showToast("Please enter or select a conversation transcript first.", "warning");
      return;
    }

    try {
      setLoading(true);

      const res = await api.post(
        "/generate",
        {
          prompt,
        }
      );

      const data = res.data;

      dispatch(
        setInteraction({
          ...interaction,

          ...data,

          suggestions:
            data.suggestions ?? interaction.suggestions,

          compliance:
            data.compliance ?? interaction.compliance,

          confidence:
            data.confidence ?? 0,

          topics:
            data.topics ?? [],
        })
      );
      setGenerated(true);

      setTimeout(() => {
        setGenerated(false);
      }, 5000);

      showToast("AI Clinical Extraction Complete!", "success");
    } catch (err: any) {
      console.error("Generation Error:", err);
      showToast("AI Generation Failed. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-9 h-9 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-md">
          <BrainCircuit size={20} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            {isPatient ? "Patient Consultation AI" : "Scientific Detailing AI"}
          </h2>
          <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
            {isPatient ? "EHR Report Generator" : "HCP Detailing Engine"}
          </span>
        </div>
      </div>

      <p className="text-slate-500 text-xs sm:text-sm mb-4 leading-relaxed">
        {isPatient
          ? "Paste your doctor or pharmacist consultation. MedIntel AI extracts diagnoses, prescribed therapies, and formats a verifiable Medical Report for your records."
          : "Paste HCP conversation notes and let MedIntel AI automatically extract clinical detailing, sentiment, and CRM fields."}
      </p>

      {/* Quick Sample Chips */}
      <div className="mb-4">
        <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
          {isPatient ? "💡 Quick Sample Consultations (Click to Test):" : "💡 Sample Detailing Transcripts:"}
        </label>
        <div className="flex flex-col gap-1.5">
          {currentSamples.map((sample, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setPrompt(sample.text)}
              className="text-left px-3 py-1.5 rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/60 text-xs text-slate-700 transition flex items-center justify-between group"
            >
              <span className="font-semibold text-[11px] group-hover:text-indigo-700">{sample.title}</span>
              <span className="text-[10px] text-slate-400 group-hover:text-indigo-600 font-medium">Use Prompt →</span>
            </button>
          ))}
        </div>
      </div>

      {generated && (
        <div className="mb-4 rounded-xl border border-emerald-300 bg-emerald-50 p-3.5">
          <div className="font-semibold text-emerald-800 text-xs flex items-center gap-1.5">
            <Sparkles size={14} className="text-emerald-600" />
            AI Extraction Complete
          </div>
          <p className="mt-0.5 text-xs text-emerald-700">
            {isPatient
              ? "Clinical details extracted. You can now save it directly as an official Medical Report below."
              : "Review the extracted interaction details in the form before saving."}
          </p>
        </div>
      )}

      <textarea
        rows={10}
        className="w-full rounded-xl border border-slate-300 p-3.5 text-xs sm:text-sm shadow-sm transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none leading-relaxed"
        placeholder={
          isPatient
            ? "Paste your consultation transcript or notes:\n\nExample:\nConsultation with Dr. Gregory House at MedIntel Specialty Hospital.\nPrescribed Telmisartan 40mg once daily.\nAdvised low-salt diet and review in 4 weeks."
            : "Paste conversation:\n\nMet Dr. Raj Sharma at Apollo Hospital.\nDiscussed Dolo 650.\nProvided 5 samples."
        }
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
      />

      <button
        onClick={generate}
        disabled={loading}
        className="mt-4 w-full rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 py-3 text-white font-semibold text-xs sm:text-sm shadow-md transition-all active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70 flex items-center justify-center gap-2"
      >
        {loading ? (
          <div className="flex items-center justify-center gap-2">
            <svg
              className="h-4 w-4 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="white"
                strokeWidth="4"
                opacity="0.25"
              />
              <path
                fill="white"
                d="M22 12a10 10 0 0 1-10 10V18a6 6 0 0 0 6-6h4z"
              />
            </svg>
            <span>Analyzing Conversation with AI...</span>
          </div>
        ) : (
          <>
            <Sparkles size={16} />
            <span>{isPatient ? "Analyze & Generate Medical Report" : "Generate AI Insights"}</span>
          </>
        )}
      </button>

      {/* AI Extraction Status Checklist */}
      <div className="mt-5 rounded-xl bg-slate-50 p-4 border border-slate-200">
        <h3 className="font-semibold text-xs text-slate-700 uppercase tracking-wider mb-2.5">
          Extraction Status
        </h3>

        <div className="space-y-1.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-600">{isPatient ? "Doctor Identified" : "HCP Extracted"}:</span>
            <span className={interaction.doctor ? "font-semibold text-emerald-600" : "text-slate-400"}>
              {interaction.doctor ? `✓ ${interaction.doctor}` : "Waiting"}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-600">{isPatient ? "Hospital / Clinic" : "HCO Facility"}:</span>
            <span className={interaction.hospital ? "font-semibold text-emerald-600" : "text-slate-400"}>
              {interaction.hospital ? `✓ ${interaction.hospital}` : "Waiting"}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-600">{isPatient ? "Prescribed Medicine" : "Product Identified"}:</span>
            <span className={interaction.product ? "font-semibold text-emerald-600" : "text-slate-400"}>
              {interaction.product ? `✓ ${interaction.product}` : "Waiting"}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-600">{isPatient ? "Clinical Care Plan" : "CRM Suggestions"}:</span>
            <span className={interaction.summary ? "font-semibold text-emerald-600" : "text-slate-400"}>
              {interaction.summary ? "✓ Structured Summary" : "Waiting"}
            </span>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-600 font-medium">AI Confidence Score:</span>
          <span className="font-bold text-sm text-indigo-600">
            {interaction.confidence ?? 0}%
          </span>
        </div>
      </div>
    </div>
  );
}
