import { useState } from "react";
import { MessageCircle, X } from "lucide-react";

interface WhatsAppButtonProps {
  phoneNumber?: string;
  defaultMessage?: string;
}

export default function WhatsAppButton({
  phoneNumber = "+919845012345",
  defaultMessage = "Hello MedIntel Healthcare Team, I need assistance with my account and services.",
}: WhatsAppButtonProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  // Clean phone number: remove '+' and any whitespace
  const sanitizedNumber = phoneNumber.replace(/[^0-9]/g, "");
  const whatsappUrl = `https://wa.me/${sanitizedNumber}?text=${encodeURIComponent(defaultMessage)}`;

  return (
    <aside aria-label="Support and Quick Contact" className="fixed bottom-6 right-6 z-40 flex flex-col items-end">
      {/* Interactive Tooltip Card */}
      {showTooltip && (
        <div className="mb-2 w-72 bg-white rounded-2xl shadow-xl border border-emerald-100 p-4 transition-all duration-200 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <p className="text-xs font-bold text-slate-800">MedIntel WhatsApp Helpdesk</p>
            </div>
            <button
              onClick={() => setShowTooltip(false)}
              className="text-slate-400 hover:text-slate-600 p-0.5 rounded"
              title="Close notification"
            >
              <X size={14} />
            </button>
          </div>
          <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
            Need urgent assistance with appointments, prescriptions, or billing? Connect directly with our Indian care coordinators.
          </p>
          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>SLA: &lt; 5 mins response</span>
            <span className="font-semibold text-emerald-700">+91 98450 12345</span>
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        onMouseEnter={() => setShowTooltip(true)}
        className="group relative flex items-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-emerald-200"
        title="Chat on WhatsApp (+91 98450 12345)"
      >
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-300"></span>
        </span>
        <MessageCircle size={22} className="shrink-0" />
        <span className="text-xs font-semibold hidden sm:inline-block">WhatsApp Support</span>
      </a>
    </aside>
  );
}
