import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BrainCircuit, ShieldCheck, Lock, Mail, ArrowRight, CheckCircle2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import WhatsAppButton from "../components/common/WhatsAppButton";

export default function Login() {
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password);
      showToast("Signed in successfully. Welcome to MedIntel!", "success");
      navigate("/dashboard");
    } catch (err: any) {
      let msg = "Invalid email or password. Please try again.";
      if (err.response?.data?.detail) {
        msg = err.response.data.detail;
      } else if (err.code === "ERR_NETWORK" || !err.response) {
        msg = "Backend server is not reachable. Please make sure the FastAPI server is running on http://127.0.0.1:8000.";
      }
      setError(msg);
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (quickEmail: string, quickPass: string) => {
    setEmail(quickEmail);
    setPassword(quickPass);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-slate-100 to-indigo-50/30 flex flex-col justify-center py-8 px-4 sm:px-6 lg:px-8 selection:bg-indigo-600 selection:text-white">
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white mx-auto shadow-xl shadow-indigo-200">
          <BrainCircuit size={32} />
        </div>
        <h1 className="mt-3 text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          MedIntel Pharma CRM
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-600 max-w-sm mx-auto">
          AI Healthcare Ecosystem, HCP Detailing &amp; Smart Regimen Management
        </p>

        {/* Security / Compliance Badge */}
        <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-full text-[11px] font-medium">
          <ShieldCheck size={14} className="text-emerald-600" />
          <span>CDSCO &amp; DPDPA 2023 Compliant • 256-bit SSL</span>
        </div>
      </div>

      {/* Login Card */}
      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-7 px-5 sm:px-10 shadow-xl rounded-3xl border border-slate-200/80">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm leading-relaxed">
              {error}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1">
                Email Address
              </label>
              <div className="relative rounded-xl border border-slate-300 shadow-xs focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 transition">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail size={17} />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@medintelcrm.in"
                  className="block w-full pl-10 pr-3 py-2.5 text-xs sm:text-sm rounded-xl outline-none bg-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1">
                Password
              </label>
              <div className="relative rounded-xl border border-slate-300 shadow-xs focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 transition">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock size={17} />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="block w-full pl-10 pr-3 py-2.5 text-xs sm:text-sm rounded-xl outline-none bg-transparent"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] sm:text-xs text-slate-500 pt-1">
              <span className="flex items-center gap-1 text-emerald-600 font-medium">
                <Lock size={12} /> Encrypted Session
              </span>
              <span>24h JWT Session</span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl shadow-md text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] focus:outline-none transition disabled:opacity-50"
            >
              {loading ? (
                "Authenticating..."
              ) : (
                <>
                  Sign in to Portal <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Role-Specific Quick Login Shortcuts */}
          <div className="mt-6 pt-5 border-t border-slate-200">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
              Quick Role-Wise Demo Logins
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* Patient */}
              <button
                type="button"
                onClick={() => handleQuickLogin("patient.john@example.com", "PatientPassword123!")}
                className="text-left p-2.5 rounded-xl border border-slate-200 hover:bg-indigo-50/70 hover:border-indigo-300 text-xs text-slate-700 transition"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-[11px]">John Doe</span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] bg-indigo-100 text-indigo-700 font-bold">PATIENT</span>
                </div>
                <span className="text-[10px] text-slate-500 block truncate">patient.john@example.com</span>
              </button>

              {/* Doctor */}
              <button
                type="button"
                onClick={() => handleQuickLogin("medical.director@medintelcrm.com", "MedDirector123!")}
                className="text-left p-2.5 rounded-xl border border-slate-200 hover:bg-amber-50/70 hover:border-amber-300 text-xs text-slate-700 transition"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-[11px]">Dr. Gregory House</span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] bg-amber-100 text-amber-700 font-bold">DOCTOR</span>
                </div>
                <span className="text-[10px] text-slate-500 block truncate">medical.director@medintelcrm.com</span>
              </button>

              {/* Pharmacist */}
              <button
                type="button"
                onClick={() => handleQuickLogin("pharmacist.mike@example.com", "PharmacistPassword123!")}
                className="text-left p-2.5 rounded-xl border border-slate-200 hover:bg-emerald-50/70 hover:border-emerald-300 text-xs text-slate-700 transition"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-[11px]">Mike Ross, R.Ph</span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-100 text-emerald-700 font-bold">PHARMACIST</span>
                </div>
                <span className="text-[10px] text-slate-500 block truncate">pharmacist.mike@example.com</span>
              </button>

              {/* Admin */}
              <button
                type="button"
                onClick={() => handleQuickLogin("admin@medintelcrm.com", "AdminPassword123!")}
                className="text-left p-2.5 rounded-xl border border-slate-200 hover:bg-purple-50/70 hover:border-purple-300 text-xs text-slate-700 transition"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-[11px]">Dr. Eleanor Vance</span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] bg-purple-100 text-purple-700 font-bold">ADMIN</span>
                </div>
                <span className="text-[10px] text-slate-500 block truncate">admin@medintelcrm.com</span>
              </button>

              {/* Sales Rep */}
              <button
                type="button"
                onClick={() => handleQuickLogin("rep1@medintelcrm.com", "RepPassword123!")}
                className="sm:col-span-2 text-left p-2 rounded-xl border border-slate-200 hover:bg-blue-50/70 hover:border-blue-300 text-xs text-slate-700 transition flex items-center justify-between"
              >
                <div>
                  <span className="font-bold text-slate-800 text-[11px]">Marcus Reynolds (Field Rep)</span>
                  <span className="text-[10px] text-slate-500 block">rep1@medintelcrm.com</span>
                </div>
                <span className="px-1.5 py-0.5 rounded text-[9px] bg-blue-100 text-blue-700 font-bold">SALES REP</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <footer className="mt-6 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-center gap-2">
        <span className="flex items-center gap-1">
          <CheckCircle2 size={13} className="text-emerald-600" />
          Hosted in India • Asia/Kolkata (IST)
        </span>
        <span className="hidden sm:inline">•</span>
        <span>Support: support@medintelcrm.in</span>
      </footer>

      {/* Floating WhatsApp Support */}
      <WhatsAppButton />
    </div>
  );
}
