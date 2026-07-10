interface Props {
  interaction: any;
}

export default function AIInsights({ interaction }: Props) {
  const suggestions = interaction.suggestions || {};

  return (
    <div className="mt-6 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">

      <h2 className="text-xl font-bold mb-6">
        AI Insights
      </h2>

      <div className="grid grid-cols-2 gap-4">

        <div className="p-4 rounded-xl bg-blue-50">
          <h4 className="font-semibold">Summary</h4>
          <p>{interaction.summary}</p>
        </div>

        <div className="p-4 rounded-xl bg-green-50">
          <h4 className="font-semibold">Sentiment</h4>
          <p>{interaction.sentiment}</p>
        </div>

        <div className="p-4 rounded-xl bg-purple-50">
          <h4 className="font-semibold">Priority</h4>
          <p>{suggestions.priority}</p>
        </div>

        <div className="p-4 rounded-xl bg-yellow-50">
          <h4 className="font-semibold">Engagement Score</h4>
          <p>{suggestions.engagementScore}/100</p>
        </div>

        <div className="col-span-2 p-4 rounded-xl bg-slate-50">
          <h4 className="font-semibold">Next Action</h4>
          <p>{suggestions.nextAction}</p>
        </div>

        <div className="col-span-2 p-4 rounded-xl bg-slate-50">
          <h4 className="font-semibold">Recommended Material</h4>
          <p>{suggestions.recommendedMaterial}</p>
        </div>

      </div>

    </div>
  );
}