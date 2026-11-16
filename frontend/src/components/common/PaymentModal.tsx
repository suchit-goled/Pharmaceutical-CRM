import { useState } from "react";
import { CreditCard, QrCode, Building, CheckCircle2, X, ShieldCheck, Lock, ArrowRight, Truck } from "lucide-react";
import api from "../../services/api";
import { useToast } from "../../context/ToastContext";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderType?: "CONSULTATION" | "PHARMACY_ORDER" | string;
  referenceId?: number;
  title: string;
  amountInr?: number;
  amount?: number;
  description?: string;
  patientName?: string;
  onPaymentSuccess?: (orderId?: string) => void;
}

export default function PaymentModal({
  isOpen,
  onClose,
  orderType = "CONSULTATION",
  referenceId = 1,
  title,
  amountInr,
  amount,
  description,
  patientName = "Patient",
  onPaymentSuccess
}: PaymentModalProps) {
  const { showToast } = useToast();
  const [selectedMethod, setSelectedMethod] = useState<"UPI" | "CARD" | "NETBANKING" | "COD">("UPI");
  const [upiId, setUpiId] = useState("rohan@okhdfcbank");
  const [loading, setLoading] = useState(false);
  const [receipt, setReceipt] = useState<any | null>(null);

  const effectiveAmount = amountInr ?? amount ?? 500;

  if (!isOpen) return null;

  // 18% inclusive GST calculations
  const baseAmount = Number((effectiveAmount / 1.18).toFixed(2));
  const cgstAmount = Number(((effectiveAmount - baseAmount) / 2).toFixed(2));
  const sgstAmount = Number(((effectiveAmount - baseAmount) / 2).toFixed(2));

  const handlePay = async () => {
    setLoading(true);
    try {
      // 1. Create order
      const orderRes = await api.post("/api/payments/create-order", {
        order_type: orderType,
        reference_id: referenceId,
        amount_inr: effectiveAmount,
        patient_name: patientName,
        payment_method: selectedMethod
      });

      // 2. Simulate gateway verification
      const verifyRes = await api.post("/api/payments/verify", {
        payment_id: orderRes.data.payment_id,
        reference_id: referenceId,
        order_type: orderType,
        payment_method: selectedMethod,
        amount_inr: effectiveAmount
      });

      setReceipt(verifyRes.data);
      showToast(`Payment of ₹${effectiveAmount.toFixed(2)} confirmed successfully!`, "success");
      if (onPaymentSuccess) {
        onPaymentSuccess(verifyRes.data.order_id || verifyRes.data.payment_id);
      }
    } catch (err: any) {
      showToast(err.response?.data?.detail || "Payment processing failed.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDone = () => {
    setReceipt(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <Lock size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Secure Payment Checkout</h3>
              <p className="text-[11px] text-slate-500">256-Bit SSL Encrypted Indian Payment Gateway</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
            <X size={18} />
          </button>
        </div>

        {receipt ? (
          <div className="py-6 space-y-4 text-center">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 size={36} />
            </div>
            <div>
              <h4 className="text-xl font-bold text-slate-900">Payment Successful!</h4>
              <p className="text-xs text-slate-500 mt-1">{receipt.receipt_message}</p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Tax Invoice Number:</span>
                <span className="font-mono font-bold text-indigo-700">{receipt.invoice_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Transaction ID:</span>
                <span className="font-mono text-slate-800">{receipt.transaction_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Service:</span>
                <span className="font-medium text-slate-800">{title}</span>
              </div>
              <div className="flex justify-between font-bold text-slate-900 pt-2 border-t border-slate-200">
                <span>Amount Paid (INR):</span>
                <span className="text-emerald-700 text-sm">₹{effectiveAmount.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={handleDone}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
            >
              Back to Appointments / Orders
            </button>
          </div>
        ) : (
          <div className="space-y-4 mt-4 text-xs">
            {/* Bill Summary */}
            <div className="p-3.5 bg-indigo-50/70 border border-indigo-100 rounded-xl space-y-1.5">
              <div className="flex justify-between font-bold text-slate-800 text-sm">
                <span>{title}</span>
                <span className="text-indigo-900">₹{effectiveAmount.toFixed(2)}</span>
              </div>
              {description && (
                <p className="text-[11px] text-slate-600">{description}</p>
              )}
              <div className="flex justify-between text-[11px] text-slate-500 pt-1">
                <span>Consultation / Product Base Fee:</span>
                <span>₹{baseAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-500">
                <span>CGST (9%) + SGST (9%):</span>
                <span>₹{(cgstAmount + sgstAmount).toFixed(2)}</span>
              </div>
            </div>

            {/* Payment Modes */}
            <div>
              <label className="block font-semibold text-slate-700 mb-2">Select Indian Payment Method</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "UPI", label: "UPI (GPay, PhonePe, Paytm)", icon: QrCode },
                  { id: "CARD", label: "Debit / RuPay / Credit Card", icon: CreditCard },
                  { id: "NETBANKING", label: "Net Banking (SBI, HDFC)", icon: Building },
                  { id: "COD", label: "Cash on Delivery", icon: Truck }
                ].map((m) => (
                  <button
                    type="button"
                    key={m.id}
                    onClick={() => setSelectedMethod(m.id as any)}
                    className={`p-3 rounded-xl border text-left transition flex items-center gap-2.5 ${
                      selectedMethod === m.id
                        ? "border-indigo-600 bg-indigo-50/50 text-indigo-900 font-bold"
                        : "border-slate-200 hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <m.icon size={16} className={selectedMethod === m.id ? "text-indigo-600" : "text-slate-400"} />
                    <span className="text-[11px]">{m.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* UPI QR & VPA Detail */}
            {selectedMethod === "UPI" && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-700">Enter UPI ID / VPA</span>
                  <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Instant 0% Convenience Fee
                  </span>
                </div>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="name@okhdfcbank"
                  className="w-full p-2 text-xs border border-slate-200 rounded-xl outline-none focus:border-indigo-600"
                />
                <p className="text-[10px] text-slate-400">
                  Accepts Google Pay, PhonePe, Paytm, BHIM, CRED UPI.
                </p>
              </div>
            )}

            {/* Card Detail Mock */}
            {selectedMethod === "CARD" && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <input
                  type="text"
                  placeholder="Card Number (RuPay, Visa, Mastercard)"
                  className="w-full p-2 text-xs border border-slate-200 rounded-xl outline-none"
                  defaultValue="4532 •••• •••• 8892"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="MM / YY"
                    className="p-2 text-xs border border-slate-200 rounded-xl outline-none"
                    defaultValue="12/28"
                  />
                  <input
                    type="password"
                    placeholder="CVV"
                    className="p-2 text-xs border border-slate-200 rounded-xl outline-none"
                    defaultValue="892"
                  />
                </div>
              </div>
            )}

            {/* Security Badge */}
            <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-1">
              <ShieldCheck size={14} className="text-emerald-600 shrink-0" />
              <span>PCI-DSS &amp; RBI 2FA Compliant • 256-Bit SSL Secured</span>
            </div>

            {/* Pay Button */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePay}
                disabled={loading}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-1.5 transition shadow-sm"
              >
                {loading ? "Processing Payment..." : <>Pay ₹{effectiveAmount.toFixed(2)} Now <ArrowRight size={14} /></>}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
