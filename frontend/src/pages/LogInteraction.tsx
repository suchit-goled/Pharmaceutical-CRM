import DashboardLayout from "../layouts/DashboardLayout";

import AIAssistant from "../components/interaction/AIAssistant";
import InteractionForm from "../components/interaction/InteractionForm";
import InteractionAnalysis from "../components/interaction/InteractionAnalysis";
import AISuggestions from "../components/interaction/AISuggestions";
import VisitIntelligence from "../components/interaction/VisitIntelligence";
import ComplianceReport from "../components/interaction/ComplianceReport";
import PharmaAIAssistant from "../components/interaction/PharmaAIAssistant";

import { useAppSelector } from "../store/hooks";

export default function LogInteraction() {

  const interaction = useAppSelector(
    (state) => state.interaction
  );

  return (
    <DashboardLayout>

      <div className="mx-auto max-w-7xl space-y-8">

        {/* Top Section */}

        <div className="grid grid-cols-12 gap-6 items-start">

          {/* AI Interaction */}

          <div className="col-span-4 sticky top-6">

            <AIAssistant />

          </div>

          {/* Call Report */}

          <div className="col-span-8">

            <InteractionForm />

          </div>

        </div>

        {/* AI Dashboard */}

       <div className="mt-8">
    <h2 className="text-3xl font-bold mb-6">
        🧠 AI Insights
    </h2>

    <div className="grid grid-cols-2 gap-6">

        <InteractionAnalysis interaction={interaction} />

        <AISuggestions interaction={interaction} />

        <VisitIntelligence interaction={interaction} />

        <ComplianceReport interaction={interaction} />

    </div>

</div>
        {/* Chat Assistant */}

        <PharmaAIAssistant />

      </div>

    </DashboardLayout>
  );
}