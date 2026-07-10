import {
  Activity,
  Shield,
  Users,
  BarChart3,
  TrendingUp,
} from "lucide-react";

import type { Interaction } from "../../types/interaction";

interface Props {
  interaction: Interaction;
}

export default function VisitIntelligence({ interaction }: Props) {
  const i = interaction.intelligence;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow">
      <div className="flex items-center gap-3 mb-5">
        <Activity className="text-purple-600" />
        <h2 className="text-xl font-bold">
          📈 Visit Intelligence
        </h2>
      </div>

      <div className="space-y-5">
        <Item
          icon={<TrendingUp size={18} />}
          label="Prescription Probability"
          value={`${i?.prescriptionProbability || 0}%`}
        />

        <Item
          icon={<BarChart3 size={18} />}
          label="Visit Success"
          value={`${i?.visitSuccessScore || 0}%`}
        />

        <Item
          icon={<Shield size={18} />}
          label="Competitor Risk"
          value={i?.competitorRisk || "-"}
        />

        <Item
          icon={<Users size={18} />}
          label="Doctor Category"
          value={i?.doctorCategory || "-"}
        />

        <Item
          icon={<TrendingUp size={18} />}
          label="Business Opportunity"
          value={i?.businessOpportunity || "-"}
        />
      </div>
    </div>
  );
}

function Item({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <div className="flex items-center gap-2 font-semibold">
        {icon}
        {label}
      </div>
      <p className="mt-2">{value}</p>
    </div>
  );
}