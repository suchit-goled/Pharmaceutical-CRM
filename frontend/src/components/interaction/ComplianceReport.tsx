import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";

import type { Interaction } from "../../types/interaction";

interface Props {
  interaction: Interaction;
}

export default function ComplianceReport({
  interaction,
}: Props) {
  const c = interaction.compliance;

  const completion =
    c?.ready
      ? 100
      : Math.max(
          0,
          100 - (c?.missingFields?.length || 0) * 20
        );

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow">
      <div className="flex items-center gap-3 mb-5">
        <ShieldCheck className="text-green-600" />
        <h2 className="text-xl font-bold">
          🛡 Compliance Report
        </h2>
      </div>

      <div className="space-y-5">

        <div className="rounded-xl bg-slate-50 p-3">
          <div className="flex items-center gap-2 font-semibold">
            <CheckCircle size={18} />
            CRM Status
          </div>

          <p className="mt-2">
            {c?.ready ? "Ready ✅" : "Pending ⚠"}
          </p>
        </div>

        <div className="rounded-xl bg-slate-50 p-3">
          <div className="flex items-center gap-2 font-semibold">
            <AlertTriangle size={18} />
            Risk
          </div>

          <p className="mt-2">
            {c?.risk || "-"}
          </p>
        </div>

        <div className="rounded-xl bg-slate-50 p-3">
          <div className="font-semibold mb-2">
            Missing Fields
          </div>

          {c?.missingFields?.length ? (
            <div className="flex flex-wrap gap-2">
              {c.missingFields.map((field) => (
                <span
                  key={field}
                  className="rounded-full bg-red-100 px-3 py-1 text-red-700 text-sm"
                >
                  {field}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-green-600">
              No missing fields
            </p>
          )}
        </div>

        <div className="rounded-xl bg-slate-50 p-3">
          <div className="font-semibold">
            Completion
          </div>

          <div className="mt-3 h-3 rounded-full bg-slate-200">
            <div
              style={{ width: `${completion}%` }}
              className="h-3 rounded-full bg-green-500"
            />
          </div>

          <p className="mt-2 text-sm">
            {completion}% Completed
          </p>
        </div>

      </div>
    </div>
  );
}