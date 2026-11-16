import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Home, MapPin, Pill, HelpCircle, ShieldAlert } from "lucide-react";
import notFoundIllustration from "../assets/illustrations/not-found-404.svg";
import ContactModal from "../components/common/ContactModal";

export default function NotFound() {
  const location = useLocation();
  const navigate = useNavigate();
  const [showContactModal, setShowContactModal] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-2xl w-full bg-white rounded-3xl shadow-xl border border-slate-200/80 p-6 sm:p-10 text-center">
        {/* Error Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-full text-xs font-semibold mb-6">
          <ShieldAlert size={14} />
          <span>Error 404: Clinical Endpoint Not Located</span>
        </div>

        {/* Compressed / Sized Responsive SVG Illustration */}
        <div className="flex justify-center mb-6">
          <img
            src={notFoundIllustration}
            alt="404 Page Not Found Illustration"
            className="w-48 sm:w-64 h-auto object-contain drop-shadow-sm select-none"
            width={280}
            height={200}
            loading="eager"
          />
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
          Looking for a Medical Record or Page?
        </h1>
        <p className="text-sm sm:text-base text-slate-600 max-w-lg mx-auto mb-4 leading-relaxed">
          The requested healthcare resource or URL does not exist or may have been moved within the MedIntel Indian clinical network.
        </p>

        {/* Path details */}
        <div className="inline-block px-3 py-1 bg-slate-100 rounded-lg text-xs font-mono text-slate-600 mb-6 max-w-full truncate">
          Path: {location.pathname}
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm transition"
          >
            <ArrowLeft size={16} />
            <span>Go Back</span>
          </button>

          <Link
            to="/dashboard"
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm shadow-md shadow-indigo-100 transition"
          >
            <Home size={16} />
            <span>Return to Dashboard</span>
          </Link>
        </div>

        {/* Quick Help Navigation Links */}
        <div className="pt-6 border-t border-slate-100">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Quick Navigation
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-left">
            <Link
              to="/medications"
              className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 hover:border-indigo-200 hover:bg-indigo-50/50 transition group"
            >
              <Pill size={18} className="text-indigo-600 group-hover:scale-110 transition-transform" />
              <div>
                <p className="text-xs font-bold text-slate-800">My Medications</p>
                <p className="text-[11px] text-slate-500">View active regimens</p>
              </div>
            </Link>

            <Link
              to="/nearby-healthcare"
              className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 hover:border-emerald-200 hover:bg-emerald-50/50 transition group"
            >
              <MapPin size={18} className="text-emerald-600 group-hover:scale-110 transition-transform" />
              <div>
                <p className="text-xs font-bold text-slate-800">Healthcare Map</p>
                <p className="text-[11px] text-slate-500">Find nearby chemists</p>
              </div>
            </Link>

            <button
              type="button"
              onClick={() => setShowContactModal(true)}
              className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 hover:border-indigo-200 hover:bg-indigo-50/50 transition group text-left w-full"
            >
              <HelpCircle size={18} className="text-indigo-600 group-hover:scale-110 transition-transform" />
              <div>
                <p className="text-xs font-bold text-slate-800">Support Desk</p>
                <p className="text-[11px] text-slate-500">Open 24/7 ticket</p>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* SSL Padlock Security Footer */}
      <footer className="mt-6 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
        <span>🔒 256-bit SSL Encrypted</span>
        <span>•</span>
        <span>CDSCO &amp; DPDPA 2023 Compliant</span>
      </footer>

      {/* Contact Support Modal */}
      <ContactModal isOpen={showContactModal} onClose={() => setShowContactModal(false)} />
    </div>
  );
}
