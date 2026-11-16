import { useState } from "react";
import { MessageSquare, Send, X, ShieldCheck, CheckCircle2 } from "lucide-react";
import api from "../../services/api";
import { useToast } from "../../context/ToastContext";

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCategory?: string;
}

export default function ContactModal({ isOpen, onClose, defaultCategory = "General Support" }: ContactModalProps) {
  const { showToast } = useToast();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    category: defaultCategory,
    subject: "",
    message: ""
  });
  const [loading, setLoading] = useState(false);
  const [ticketResult, setTicketResult] = useState<any | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      showToast("Please fill in your name, email, and message.", "warning");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post("/api/support/contact", form);
      setTicketResult(res.data);
      showToast("Support inquiry submitted successfully!", "success");
    } catch (err: any) {
      showToast(err.response?.data?.detail || "Failed to submit support request.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setTicketResult(null);
    setForm({
      name: "",
      email: "",
      phone: "",
      category: defaultCategory,
      subject: "",
      message: ""
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <MessageSquare size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">24/7 Healthcare & Clinical Support</h3>
              <p className="text-[11px] text-slate-500">Contact our Indian medical helpdesk & care coordinators</p>
            </div>
          </div>
          <button onClick={handleClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
            <X size={18} />
          </button>
        </div>

        {ticketResult ? (
          <div className="py-6 space-y-4 text-center">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto">
              <CheckCircle2 size={32} />
            </div>
            <div>
              <h4 className="text-lg font-bold text-slate-900">Support Ticket Created</h4>
              <p className="text-xs text-slate-500 mt-1">{ticketResult.message}</p>
            </div>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-left text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Ticket ID:</span>
                <span className="font-mono font-bold text-indigo-700">{ticketResult.ticket_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Target Response Time:</span>
                <span className="font-semibold text-slate-800">Within {ticketResult.estimated_response_hours} Hours</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">WhatsApp Helpline:</span>
                <a
                  href={`https://wa.me/919845012345?text=Hello%2C%20following%20up%20on%20my%20support%20ticket%20${ticketResult.ticket_id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold text-emerald-600 hover:underline"
                >
                  +91 98450 12345 ↗
                </a>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5 mt-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Your Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rohan Sharma"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:border-indigo-600"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:border-indigo-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Indian Mobile Number (+91)</label>
                <input
                  type="tel"
                  placeholder="98450 12345"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:border-indigo-600"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Inquiry Category *</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:border-indigo-600 font-medium"
                >
                  <option value="Clinical Support">Clinical Doctor Consultation</option>
                  <option value="Pharmacy Query">Pharmacy Dispensing &amp; Stock</option>
                  <option value="Appointment Reschedule">Appointment Rescheduling</option>
                  <option value="Billing &amp; Refunds">Billing &amp; Payment Support</option>
                  <option value="General Support">General Platform Inquiries</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Subject *</label>
              <input
                type="text"
                required
                placeholder="e.g. Inquiry regarding my prescription or appointment slot"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Message Details *</label>
              <textarea
                required
                rows={3}
                placeholder="Describe your question or issue in detail..."
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:border-indigo-600"
              />
            </div>

            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] text-emerald-800 flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-medium">
                <ShieldCheck size={14} className="text-emerald-600 shrink-0" />
                <span>Protected under DPDPA 2023 health privacy guidelines</span>
              </span>
              <span className="font-semibold text-emerald-700">SLA: 2-24 Hrs</span>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center gap-1.5 transition disabled:opacity-50 shadow-sm"
              >
                {loading ? "Submitting..." : <><Send size={13} /> Submit Inquiry</>}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
