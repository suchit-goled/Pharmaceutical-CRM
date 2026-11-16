import { useState, useEffect } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import api from "../services/api";
import {
  FileText,
  Upload,
  Calendar,
  CheckCircle2,
  Clock,
  Stethoscope,
  Activity,
  Microscope
} from "lucide-react";

interface MedicalReport {
  id: number;
  patient_id: number;
  patient_name?: string;
  title: string;
  report_type: string;
  test_category?: string;
  report_date: string;
  file_url?: string | null;
  file_name?: string | null;
  file_size_kb: number;
  biomarkers?: Record<string, any>;
  clinical_observations?: string | null;
  status: "Uploaded" | "Under Review" | "Reviewed";
  reviewed_by_id?: number | null;
  reviewed_by_name?: string | null;
  reviewed_at?: string | null;
  created_at?: string;
}

export default function MedicalReports() {
  const { isDoctor } = useAuth();
  const { showToast } = useToast();

  const [reports, setReports] = useState<MedicalReport[]>([]);
  const [loading, setLoading] = useState(true);

  // Upload Modal (Patient)
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    title: "",
    report_type: "Lab Test",
    test_category: "Biochemistry",
    report_date: new Date().toISOString().split("T")[0],
    file_name: ""
  });
  const [submittingUpload, setSubmittingUpload] = useState(false);

  // Review Modal (Doctor)
  const [selectedReport, setSelectedReport] = useState<MedicalReport | null>(null);
  const [reviewForm, setReviewForm] = useState({
    clinical_observations: ""
  });
  const [submittingReview, setSubmittingReview] = useState(false);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/medical-reports");
      setReports(Array.isArray(res.data) ? res.data : []);
    } catch (err: any) {
      showToast(err.response?.data?.detail || "Failed to load medical reports", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const formatIndianDate = (dateStr?: string | null) => {
    if (!dateStr) return "—";
    const parts = dateStr.split("T")[0].split("-");
    if (parts.length === 3 && parts[0].length === 4) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return dateStr;
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadForm.title.trim()) {
      showToast("Please provide a title for the medical report", "warning");
      return;
    }
    setSubmittingUpload(true);
    try {
      await api.post("/api/medical-reports", {
        title: uploadForm.title,
        report_type: uploadForm.report_type,
        test_category: uploadForm.test_category,
        report_date: uploadForm.report_date,
        file_name: uploadForm.file_name || `${uploadForm.title.replace(/\s+/g, "_")}.pdf`,
        file_size_kb: 1024.0
      });
      showToast("Diagnostic report uploaded successfully!", "success");
      setShowUploadModal(false);
      setUploadForm({
        title: "",
        report_type: "Lab Test",
        test_category: "Biochemistry",
        report_date: new Date().toISOString().split("T")[0],
        file_name: ""
      });
      fetchReports();
    } catch (err: any) {
      showToast(err.response?.data?.detail || "Failed to upload medical report", "error");
    } finally {
      setSubmittingUpload(false);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReport) return;
    if (!reviewForm.clinical_observations.trim()) {
      showToast("Please record clinical observations before completing review", "warning");
      return;
    }
    setSubmittingReview(true);
    try {
      await api.put(`/api/medical-reports/${selectedReport.id}/review`, {
        clinical_observations: reviewForm.clinical_observations,
        status: "Reviewed"
      });
      showToast("Report review recorded successfully", "success");
      setSelectedReport(null);
      fetchReports();
    } catch (err: any) {
      showToast(err.response?.data?.detail || "Failed to complete review", "error");
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <DashboardLayout
      title={isDoctor ? "Patient Diagnostic Reports Review" : "Diagnostic Medical Reports"}
      subtitle={
        isDoctor
          ? "Review patient-submitted diagnostic lab tests, Indian biomarker standards (mg/dL, mmHg, °C) and clinical observations"
          : "Upload lab tests, diagnostic scans, and clinical summaries with standard Indian clinical units for doctor review"
      }
    >
      <div className="space-y-6">
          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-800">
                  {isDoctor ? "Clinical Diagnostics Review Panel" : "My Health Records & Reports"}
                </h3>
                <span className="bg-emerald-50 text-emerald-800 text-xs px-2.5 py-0.5 rounded-full font-semibold border border-emerald-200 flex items-center gap-1">
                  <Activity size={12} />
                  Standard Indian Lab Units (mg/dL, mmHg)
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {isDoctor
                  ? "Examine patient test parameters, document doctor observations, and adjust therapy regimens"
                  : "Keep your medical records centralized and share diagnostic reports securely with your doctor"}
              </p>
            </div>
            {!isDoctor && (
              <button
                onClick={() => setShowUploadModal(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-md transition"
              >
                <Upload size={18} />
                Upload Diagnostic Report
              </button>
            )}
          </div>

          {/* Reports List */}
          {loading ? (
            <div className="flex justify-center items-center py-16">
              <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : reports.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <FileText className="mx-auto text-slate-300 mb-3" size={48} />
              <h4 className="text-base font-semibold text-slate-700">No Medical Reports</h4>
              <p className="text-xs text-slate-400 mt-1">
                {isDoctor
                  ? "There are currently no patient diagnostic reports awaiting clinical review."
                  : "You have not uploaded any diagnostic lab tests or medical documents yet."}
              </p>
              {!isDoctor && (
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="mt-4 px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl text-xs font-semibold transition"
                >
                  Upload Your First Lab Report
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {reports.map((rep) => {
                const isReviewed = rep.status === "Reviewed";

                return (
                  <div
                    key={rep.id}
                    className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:border-indigo-200 transition flex flex-col justify-between"
                  >
                    <div>
                      {/* Badge Header */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span
                          className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            isReviewed
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}
                        >
                          {isReviewed ? <CheckCircle2 size={13} /> : <Clock size={13} />}
                          {rep.status}
                        </span>

                        <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          {rep.test_category || rep.report_type}
                        </span>
                      </div>

                      {/* Title */}
                      <h4 className="text-base font-bold text-slate-800 line-clamp-1 mb-1">
                        {rep.title}
                      </h4>

                      {/* Patient & Date */}
                      <div className="text-xs text-slate-500 space-y-1 mb-3">
                        {rep.patient_name && isDoctor && (
                          <p>
                            Patient: <strong className="text-slate-800">{rep.patient_name}</strong>
                          </p>
                        )}
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <Calendar size={13} />
                          <span>Report Date: {formatIndianDate(rep.report_date)}</span>
                        </div>
                      </div>

                      {/* Biomarkers if present */}
                      {rep.biomarkers && Object.keys(rep.biomarkers).length > 0 && (
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 mb-3 space-y-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                            <Microscope size={12} className="text-indigo-600" />
                            Clinical Biomarkers
                          </span>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            {Object.entries(rep.biomarkers).map(([k, v]) => (
                              <div key={k} className="bg-white p-1.5 rounded-lg border border-slate-100">
                                <span className="text-[10px] text-slate-400 block capitalize">{k.replace(/_/g, " ")}:</span>
                                <span className="font-bold text-slate-800 text-[11px]">{String(v)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* File preview pill */}
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-center justify-between text-xs text-slate-600 mb-3">
                        <span className="truncate max-w-[200px] font-mono text-[11px]">
                          {rep.file_name || "document.pdf"}
                        </span>
                        <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                          {(rep.file_size_kb / 1024).toFixed(1)} MB
                        </span>
                      </div>

                      {/* Doctor Clinical Observations */}
                      {rep.clinical_observations && (
                        <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-3 text-xs mb-3 space-y-1">
                          <p className="font-semibold text-indigo-900 flex items-center gap-1">
                            <Stethoscope size={13} /> Doctor Observation:
                          </p>
                          <p className="text-indigo-800 text-[11px]">{rep.clinical_observations}</p>
                          {rep.reviewed_by_name && (
                            <p className="text-[10px] text-indigo-500 font-medium">
                              Reviewed by {rep.reviewed_by_name}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                      {isDoctor ? (
                        <button
                          onClick={() => {
                            setSelectedReport(rep);
                            setReviewForm({
                              clinical_observations: rep.clinical_observations || ""
                            });
                          }}
                          className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition"
                        >
                          {isReviewed ? "Edit Clinical Observations" : "Review & Record Observations"}
                        </button>
                      ) : (
                        <div className="w-full text-center text-xs text-slate-500 py-1.5 bg-slate-50 rounded-xl">
                          {isReviewed ? "Reviewed by Doctor" : "Under Physician Review"}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

      {/* Upload Modal (Patient) */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Upload size={18} className="text-indigo-600" />
                Upload Medical Diagnostic Report
              </h3>
              <button onClick={() => setShowUploadModal(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Report Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Fasting Blood Sugar & Lipid Profile"
                  value={uploadForm.title}
                  onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                  className="w-full text-sm border border-slate-200 rounded-xl p-2.5 outline-none focus:border-indigo-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Diagnostic Category *
                  </label>
                  <select
                    value={uploadForm.test_category}
                    onChange={(e) => setUploadForm({ ...uploadForm, test_category: e.target.value })}
                    className="w-full text-sm border border-slate-200 rounded-xl p-2.5 outline-none focus:border-indigo-600"
                  >
                    <option value="Biochemistry">Biochemistry (FBS, HbA1c)</option>
                    <option value="Hematology">Hematology (CBC, ESR)</option>
                    <option value="Lipid Profile">Lipid Profile</option>
                    <option value="Renal Function">Renal Function (KFT)</option>
                    <option value="Liver Function">Liver Function (LFT)</option>
                    <option value="Radiology">Radiology / X-Ray / CT</option>
                    <option value="Prescription">Doctor Prescription</option>
                    <option value="Discharge Summary">Hospital Discharge Summary</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Test / Report Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={uploadForm.report_date}
                    onChange={(e) => setUploadForm({ ...uploadForm, report_date: e.target.value })}
                    className="w-full text-sm border border-slate-200 rounded-xl p-2.5 outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Attach Report File (PDF, PNG, JPG)
                </label>
                <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center hover:border-indigo-400 transition cursor-pointer bg-slate-50/50">
                  <Upload className="mx-auto text-slate-400 mb-2" size={24} />
                  <p className="text-xs font-medium text-slate-600">
                    Click to browse or drop diagnostic report document
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Supports PDF, PNG, JPG up to 10MB</p>
                  <input
                    type="file"
                    className="hidden"
                    id="reportFile"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        setUploadForm({ ...uploadForm, file_name: e.target.files[0].name });
                      }
                    }}
                  />
                  <label
                    htmlFor="reportFile"
                    className="inline-block mt-3 px-3 py-1 bg-white border border-slate-200 text-xs font-semibold text-slate-700 rounded-lg cursor-pointer hover:bg-slate-50"
                  >
                    {uploadForm.file_name ? uploadForm.file_name : "Choose File"}
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingUpload}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition"
                >
                  {submittingUpload ? "Uploading..." : "Save & Share with Doctor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Review Modal (Doctor) */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Stethoscope size={18} className="text-indigo-600" />
                Record Clinical Observations
              </h3>
              <button onClick={() => setSelectedReport(null)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl text-xs space-y-1">
              <p className="font-semibold text-slate-700">Report: {selectedReport.title}</p>
              <p className="text-slate-500">
                Category: {selectedReport.test_category || selectedReport.report_type} • Date: {formatIndianDate(selectedReport.report_date)}
              </p>
              {selectedReport.patient_name && (
                <p className="text-slate-500">Patient: {selectedReport.patient_name}</p>
              )}
            </div>

            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Doctor Clinical Observations & Evaluation *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Record your diagnostic assessment, review of lab values (e.g. FBS mg/dL), therapy adjustments, or patient recommendations..."
                  value={reviewForm.clinical_observations}
                  onChange={(e) => setReviewForm({ ...reviewForm, clinical_observations: e.target.value })}
                  className="w-full text-sm border border-slate-200 rounded-xl p-2.5 outline-none focus:border-indigo-600"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setSelectedReport(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition"
                >
                  {submittingReview ? "Saving..." : "Confirm & Mark Reviewed"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </DashboardLayout>
  );
}
