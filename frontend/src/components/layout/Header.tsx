import { Bell, Search, ShieldCheck } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

interface HeaderProps {
  title?: string;
  subtitle?: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
  const { user } = useAuth();

  return (
    <header className="bg-white border-b border-slate-200 h-20 flex items-center justify-between px-8 shrink-0">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
          {title || "MedIntel Pharmaceutical CRM"}
        </h2>
        <p className="text-xs text-slate-500">
          {subtitle || "AI-Assisted Field Detailing, HCP Engagement & Compliance Suite"}
        </p>
      </div>

      <div className="flex items-center gap-4">
        {/* Compliance & System Badge */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-medium">
          <ShieldCheck size={16} className="text-emerald-600" />
          <span>CDSCO & DPDPA Compliant</span>
        </div>

        <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3.5 py-2 bg-slate-50 text-slate-600 w-64">
          <Search size={16} className="text-slate-400" />
          <input
            placeholder="Search Doctor, NMC Reg, Medicine, PIN..."
            className="outline-none bg-transparent text-sm w-full placeholder:text-slate-400"
          />
        </div>

        <button className="relative p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition">
          <Bell size={18} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white"></span>
        </button>

        <div className="flex items-center gap-3 pl-2 border-l border-slate-200">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-semibold text-slate-800">{user?.full_name || "Eleanor Vance"}</p>
            <p className="text-[11px] text-slate-400">{user?.email || "admin@medintelcrm.com"}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-800 text-white font-bold text-sm flex items-center justify-center shadow-sm">
            {user?.full_name ? user.full_name[0] : "A"}
          </div>
        </div>
      </div>
    </header>
  );
}
