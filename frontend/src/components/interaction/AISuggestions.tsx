import {
  Lightbulb,
  Calendar,
  Flag,
  BookOpen,
  TrendingUp,
} from "lucide-react";

import type { Interaction } from "../../types/interaction";

interface Props {
  interaction: Interaction;
}

export default function AISuggestions({ interaction }: Props) {
  const s = interaction.suggestions;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow">
      <div className="flex items-center gap-3 mb-5">
        <Lightbulb className="text-yellow-500" />
        <h2 className="text-xl font-bold">💡 AI Suggestions</h2>
      </div>

      <div className="space-y-5">
        <Item
          icon={<TrendingUp size={18} />}
          label="Next Action"
          value={s?.nextAction || "-"}
        />

        <Item
          icon={<Calendar size={18} />}
          label="Follow Up"
          value={s?.followUp || "-"}
        />

        <Item
          icon={<Flag size={18} />}
          label="Priority"
          value={s?.priority || "-"}
        />

        <Item
          icon={<BookOpen size={18} />}
          label="Material"
          value={s?.recommendedMaterial || "-"}
        />

        <Item
          icon={<TrendingUp size={18} />}
          label="Engagement"
          value={`${s?.engagementScore || 0}%`}
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