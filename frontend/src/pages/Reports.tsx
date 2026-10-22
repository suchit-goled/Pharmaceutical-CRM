import { useState } from "react";
import { FileSpreadsheet, Download, CheckCircle2, Loader2 } from "lucide-react";
import DashboardLayout from "../layouts/DashboardLayout";
import api from "../services/api";
import { useToast } from "../context/ToastContext";

interface ExportJob {
  status: string;
  message: string;
  filename: string;
  download_url: string;
}

export default function Reports() {
  const { showToast } = useToast();
  const [loadingType, setLoadingType] = useState<string | null>(null);
  const [completedJob, setCompletedJob] = useState<ExportJob | null>(null);

  const triggerExport = async (type: string) => {
    setLoadingType(type);
    setCompletedJob(null);
    try {
      const res = await api.post(`/api/reports/export?report_type=${type}`);
      showToast(`Export generated for ${type}. Ready for download.`, "success");
      setCompletedJob(res.data);
    } catch (err: any) {
      showToast("Export generation failed", "error");
    } finally {
      setLoadingType(null);
    }
  };

  const handleDownload = (filename: string) => {
    const url = `http://127.0.0.1:8000/api/reports/download/${filename}`;
    window.open(url, "_blank");
  };

  return (
    <DashboardLayout
      title="Compliance & Detailing Reports Exporter"
      subtitle="Asynchronous CSV generation for Call Reporting, Physician Demographics, and Catalogues"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Card 1: Interactions Report */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-4">
              <FileSpreadsheet size={24} />
            </div>
            <h4 className="font-bold text-slate-900 text-lg">Call Reporting & Interactions</h4>
            <p className="text-xs text-slate-500 mt-1">
              Export all logged physician detailing interactions, discussion notes, sample distributions, and sentiments.
            </p>
          </div>
          <button
            onClick={() => triggerExport("interactions")}
            disabled={loadingType === "interactions"}
            className="mt-6 w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
          >
            {loadingType === "interactions" ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Generating CSV...
              </>
            ) : (
              <>
                <Download size={16} /> Export Call History
              </>
            )}
          </button>
        </div>

        {/* Card 2: HCP Registry */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-4">
              <FileSpreadsheet size={24} />
            </div>
            <h4 className="font-bold text-slate-900 text-lg">Healthcare Professionals (HCPs)</h4>
            <p className="text-xs text-slate-500 mt-1">
              Comprehensive roster of verified physicians, NPI identifiers, specialty categorizations, and prescribing tiers.
            </p>
          </div>
          <button
            onClick={() => triggerExport("hcps")}
            disabled={loadingType === "hcps"}
            className="mt-6 w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
          >
            {loadingType === "hcps" ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Generating CSV...
              </>
            ) : (
              <>
                <Download size={16} /> Export HCP Registry
              </>
            )}
          </button>
        </div>

        {/* Card 3: Products */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center mb-4">
              <FileSpreadsheet size={24} />
            </div>
            <h4 className="font-bold text-slate-900 text-lg">Pharmaceutical Catalogue</h4>
            <p className="text-xs text-slate-500 mt-1">
              Export verified drug specifications, approved indications, dosage forms, strengths, and regulatory statuses.
            </p>
          </div>
          <button
            onClick={() => triggerExport("products")}
            disabled={loadingType === "products"}
            className="mt-6 w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
          >
            {loadingType === "products" ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Generating CSV...
              </>
            ) : (
              <>
                <Download size={16} /> Export Drug Catalogue
              </>
            )}
          </button>
        </div>
      </div>

      {/* Download Alert when Ready */}
      {completedJob && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle2 size={24} className="text-emerald-600 shrink-0" />
            <div>
              <h5 className="font-bold text-emerald-900 text-sm">Report Ready for Download</h5>
              <p className="text-xs text-emerald-700 mt-0.5">
                File <span className="font-mono font-semibold">{completedJob.filename}</span> generated successfully.
              </p>
            </div>
          </div>
          <button
            onClick={() => handleDownload(completedJob.filename)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow transition flex items-center gap-2"
          >
            <Download size={14} /> Download File
          </button>
        </div>
      )}
    </DashboardLayout>
  );
}
