import { useState } from "react";
import { Bell, Search, ShieldCheck, Lock, HelpCircle, Menu } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import ContactModal from "../common/ContactModal";

interface HeaderProps {
  title?: string;
  subtitle?: string;
  onMenuClick?: () => void;
}

export default function Header({ title, subtitle, onMenuClick }: HeaderProps) {
  const { user } = useAuth();
  const [showContactModal, setShowContactModal] = useState(false);

  return (
    <>
      <header className="bg-white border-b border-slate-200 min-h-[4.5rem] h-auto py-3 px-4 sm:px-6 md:px-8 flex items-center justify-between shrink-0 sticky top-0 z-30 shadow-xs">
        {/* Left Section: Mobile Menu Toggle + Title */}
        <div className="flex items-center gap-3 min-w-0 mr-2">
          {onMenuClick && (
            <button
              onClick={onMenuClick}
              type="button"
              className="md:hidden p-2 -ml-1 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition focus:outline-none focus:ring-2 focus:ring-indigo-500"
              aria-label="Open navigation menu"
            >
              <Menu size={22} />
            </button>
          )}

          <div className="min-w-0">
            <h1 className="text-base sm:text-xl md:text-2xl font-bold text-slate-800 tracking-tight truncate">
              {title || "MedIntel Pharmaceutical CRM"}
            </h1>
            <p className="text-[11px] sm:text-xs text-slate-500 truncate hidden sm:block">
              {subtitle || "AI-Assisted Field Detailing, HCP Engagement & Compliance Suite"}
            </p>
          </div>
        </div>

        {/* Right Section: Badges & Profile Controls */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* SSL Lock Security Badge */}
          <div
            className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 border border-slate-200 text-slate-600 rounded-xl text-xs font-medium cursor-default"
            title="Active 256-Bit SSL/TLS Encryption with CDSCO Data Integrity"
          >
            <Lock size={13} className="text-emerald-600" />
            <span className="font-mono text-[11px]">HTTPS SSL</span>
          </div>

          {/* Compliance & System Badge */}
          <div
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-medium cursor-default"
            title="Compliant with Indian CDSCO Guidelines and DPDPA 2023 Regulations"
          >
            <ShieldCheck size={15} className="text-emerald-600" />
            <span className="font-medium text-[11px]">CDSCO &amp; DPDPA</span>
          </div>

          {/* Universal Search Bar */}
          <div className="hidden md:flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-1.5 bg-slate-50 text-slate-600 w-44 lg:w-60 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:bg-white transition">
            <Search size={15} className="text-slate-400 shrink-0" />
            <input
              placeholder="Search NMC, medicine..."
              aria-label="Universal search"
              className="outline-none bg-transparent text-xs w-full placeholder:text-slate-400"
            />
          </div>

          {/* 24/7 Support Desk Button */}
          <button
            onClick={() => setShowContactModal(true)}
            type="button"
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition"
            title="Open 24/7 Support Desk"
          >
            <HelpCircle size={15} className="text-indigo-600 shrink-0" />
            <span className="hidden sm:inline">Support</span>
          </button>

          {/* Notifications Bell */}
          <button
            type="button"
            className="relative p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition"
            title="System notifications"
          >
            <Bell size={17} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white"></span>
          </button>

          {/* User Avatar & Name */}
          <div className="flex items-center gap-2.5 pl-2 sm:border-l border-slate-200">
            <div className="text-right hidden sm:block max-w-[120px] lg:max-w-[160px]">
              <p className="text-xs font-semibold text-slate-800 truncate">
                {user?.full_name || "Healthcare Professional"}
              </p>
              <p className="text-[10px] text-slate-400 uppercase font-mono tracking-wider truncate">
                {user?.role || "USER"}
              </p>
            </div>
            <div
              className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-800 text-white font-bold text-xs flex items-center justify-center shadow-xs shrink-0 select-none"
              title={user?.full_name || "User Profile"}
            >
              {user?.full_name ? user.full_name[0].toUpperCase() : "U"}
            </div>
          </div>
        </div>
      </header>

      {/* 24/7 Care Support Ticket Modal */}
      <ContactModal isOpen={showContactModal} onClose={() => setShowContactModal(false)} />
    </>
  );
}
