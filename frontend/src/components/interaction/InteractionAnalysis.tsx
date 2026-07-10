import { Brain, Smile, Target, FileText } from "lucide-react";
import type { Interaction } from "../../types/interaction";

interface Props {
  interaction: Interaction;
}

export default function InteractionAnalysis({ interaction }: Props) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow">
      <div className="flex items-center gap-3 mb-5">
        <Brain className="text-blue-600" />
        <h2 className="text-xl font-bold">🧠 Interaction Analysis</h2>
      </div>

      <div className="space-y-5">
        <Item
          icon={<FileText size={18} />}
          label="Summary"
          value={interaction.summary || "No summary"}
        />

        <Item
          icon={<Smile size={18} />}
          label="Sentiment"
          value={interaction.sentiment || "-"}
        />

        <Item
          icon={<Target size={18} />}
          label="Confidence"
          value={`${interaction.confidence || 0}%`}
        />

        <Item
          icon={<Brain size={18} />}
          label="Topics"
          value={
            interaction.topics?.length
              ? interaction.topics.join(", ")
              : "None"
          }
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
      <p className="mt-2 text-slate-700">{value}</p>
    </div>
  );
}