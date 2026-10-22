import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BrainCircuit, ShieldCheck, Lock, Mail, ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

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
      showToast("Signed in successfully. Welcome back!", "success");
      navigate("/dashboard");
    } catch (err: any) {
      const msg = err.response?.data?.detail || "Invalid email or password. Please try again.";
      setError(msg);
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (quickEmail: string, quickPass: string) => {
    setEmail(quickEmail);
    setPassword(quickPass);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white mx-auto shadow-lg shadow-indigo-200">
          <BrainCircuit size={32} />
        </div>
        <h2 className="mt-4 text-3xl font-extrabold text-slate-900 tracking-tight">
          MedIntel Pharma CRM
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Enterprise Medical Detailing, HCP Relationship & Compliance Platform
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl sm:px-10 border border-slate-200">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm">
              {error}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Corporate Email Address
              </label>
              <div className="relative rounded-xl border border-slate-300 shadow-sm focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@medintelcrm.com"
                  className="block w-full pl-10 pr-3 py-2.5 text-sm rounded-xl outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Password
              </label>
              <div className="relative rounded-xl border border-slate-300 shadow-sm focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="block w-full pl-10 pr-3 py-2.5 text-sm rounded-xl outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1 text-emerald-600 font-medium">
                <ShieldCheck size={14} /> 256-bit TLS Encrypted
              </span>
              <span>24h JWT Session</span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none transition disabled:opacity-50"
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

          {/* Quick Demo Credentials */}
          <div className="mt-8 pt-6 border-t border-slate-200">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
              Fast Demo Login Shortcuts
            </p>
            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin("admin@medintelcrm.com", "AdminPassword123!")}
                className="w-full text-left px-3 py-2 rounded-lg border border-slate-200 hover:bg-indigo-50 hover:border-indigo-300 text-xs text-slate-700 transition flex items-center justify-between"
              >
                <div>
                  <span className="font-semibold text-indigo-700 block">Dr. Eleanor Vance (Admin)</span>
                  <span className="text-[11px] text-slate-500">admin@medintelcrm.com</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] bg-indigo-100 text-indigo-800 font-bold">ADMIN</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin("rep1@medintelcrm.com", "RepPassword123!")}
                className="w-full text-left px-3 py-2 rounded-lg border border-slate-200 hover:bg-emerald-50 hover:border-emerald-300 text-xs text-slate-700 transition flex items-center justify-between"
              >
                <div>
                  <span className="font-semibold text-emerald-700 block">Marcus Reynolds (Field Rep)</span>
                  <span className="text-[11px] text-slate-500">rep1@medintelcrm.com</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-800 font-bold">SALES REP</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin("medical.director@medintelcrm.com", "MedDirector123!")}
                className="w-full text-left px-3 py-2 rounded-lg border border-slate-200 hover:bg-amber-50 hover:border-amber-300 text-xs text-slate-700 transition flex items-center justify-between"
              >
                <div>
                  <span className="font-semibold text-amber-700 block">Dr. Gregory House (Director)</span>
                  <span className="text-[11px] text-slate-500">medical.director@medintelcrm.com</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] bg-amber-100 text-amber-800 font-bold">MEDICAL</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
