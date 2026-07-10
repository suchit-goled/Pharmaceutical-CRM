import type { ReactNode } from "react";

import {
  Brain,
  Activity,
  ShieldCheck,
  TrendingUp,
  HeartPulse,
  AlertTriangle,
} from "lucide-react";

import type { Interaction } from "../../types/interaction";

interface Props {
  interaction: Interaction;
}

export default function AIIntelligenceDashboard({
  interaction,
}: Props) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow p-6 mt-6">

      <div className="flex items-center gap-3 mb-6">
        <Brain className="text-blue-600" size={24} />

        <h2 className="text-xl font-bold">
          AI Intelligence Dashboard
        </h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-5">

        <Card
          icon={<HeartPulse className="text-pink-500" />}
          title="Sentiment"
          value={interaction.sentiment}
          color="bg-pink-50"
        />

        <Card
          icon={<TrendingUp className="text-green-600" />}
          title="Confidence"
          value={`${interaction.confidence}%`}
          color="bg-green-50"
        />

        <Card
          icon={<Activity className="text-blue-600" />}
          title="Engagement"
          value={`${interaction.suggestions?.engagementScore ?? 0}%`}
          color="bg-blue-50"
        />

        <Card
          icon={<Brain className="text-purple-600" />}
          title="Prescription"
          value={`${interaction.intelligence?.prescriptionProbability ?? 0}%`}
          color="bg-purple-50"
        />

        <Card
          icon={<ShieldCheck className="text-emerald-600" />}
          title="Compliance"
          value={
            interaction.compliance?.ready
              ? "Ready"
              : "Pending"
          }
          color="bg-emerald-50"
        />

        <Card
          icon={<AlertTriangle className="text-orange-500" />}
          title="Priority"
          value={interaction.suggestions?.priority ?? "-"}
          color="bg-orange-50"
        />

      </div>

      <div className="mt-8">

        <h3 className="font-semibold mb-3">
          Missing Fields
        </h3>

        {(interaction.compliance?.missingFields?.length ?? 0) === 0 ? (
          <p className="text-green-600 font-medium">
            ✅ Everything looks good.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {interaction.compliance?.missingFields?.map((field) => (
              <span
                key={field}
                className="rounded-full bg-red-100 px-3 py-1 text-sm text-red-700"
              >
                {field}
              </span>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}

interface CardProps {
  icon: ReactNode;
  title: string;
  value: string | number;
  color: string;
}

function Card({
  icon,
  title,
  value,
  color,
}: CardProps) {
  return (
    <div className={`${color} rounded-xl p-5`}>

      <div className="flex items-center justify-between">

        {icon}

        <span className="text-2xl font-bold">
          {value}
        </span>

      </div>

      <p className="mt-3 text-slate-600 font-medium">
        {title}
      </p>

    </div>
  );
}