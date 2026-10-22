import { useState } from "react";
import api from "../../services/api";
import { useToast } from "../../context/ToastContext";

import { useDispatch, useSelector } from "react-redux";

import { setInteraction } from "./interactionSlice";

import type { RootState } from "../../store/store";

export default function AIAssistant() {
  const { showToast } = useToast();
  const dispatch = useDispatch();

  const interaction = useSelector(
    (state: RootState) => state.interaction
  );

  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);

  const generate = async () => {
    if (!prompt.trim()) {
      showToast("Please enter a conversation first.", "warning");
      return;
    }

    try {
      setLoading(true);

      console.log("Sending Prompt:", prompt);

      const res = await api.post(
        "/generate",
        {
          prompt,
        }
      );

      console.log("Backend Response:", res.data);

      const data = res.data;

      dispatch(
        setInteraction({
          ...interaction,

          ...data,

          suggestions:
            data.suggestions ?? interaction.suggestions,

          compliance:
            data.compliance ?? interaction.compliance,

          confidence:
            data.confidence ?? 0,

          topics:
            data.topics ?? [],
        })

      );
      setGenerated(true);

setTimeout(() => {

    setGenerated(false);

}, 4000);
    } catch (err: any) {
      console.error("Generation Error:", err);

      if (err.response) {
        console.log("Status:", err.response.status);
        console.log("Response:", err.response.data);
      }

      showToast("AI Generation Failed. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">

      <h2 className="text-2xl font-bold mb-2">
         MED-AI 🩺
      </h2>
      

      <p className="text-slate-500 mb-5">
        Paste the doctor's conversation and let AI
        extract the interaction automatically.
      </p>
      {
generated && (

<div className="mb-4 rounded-xl border border-green-300 bg-green-50 p-4">

<div className="font-semibold text-green-700">

✅ AI Extraction Complete

</div>

<p className="mt-1 text-sm text-green-600">

Review the extracted interaction before saving.

</p>

</div>

)
}

      <textarea
        rows={12}
       className="w-full rounded-xl border border-slate-300 p-4 shadow-sm transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
        placeholder="Example:

Met Dr Raj Sharma at Apollo Hospital.

Discussed Dolo 650.

Shared brochure.

Doctor requested clinical study.

Provided 5 samples."
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
      />

      <button
    onClick={generate}
    disabled={loading}
    className="mt-5 w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3 text-white font-semibold shadow-lg transition hover:scale-[1.02] hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-70"
>
    {loading ? (
        <div className="flex items-center justify-center gap-3">

            <svg
                className="h-5 w-5 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
            >
                <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="white"
                    strokeWidth="4"
                    opacity="0.25"
                />

                <path
                    fill="white"
                    d="M22 12a10 10 0 0 1-10 10V18a6 6 0 0 0 6-6h4z"
                />
            </svg>

            <span>🤖 Analyzing Conversation...</span>

        </div>
    ) : (
        "✨ Generate AI Insights"
    )}
</button>
      <div className="mt-6 rounded-xl bg-slate-50 p-4 border">

        <h3 className="font-semibold mb-3">
          AI Status
        </h3>

        <div className="space-y-2 text-sm">

          <div>
            {interaction.doctor
              ? "✅ HCP Extracted"
              : "⭕ Waiting"}
          </div>

          <div>
            {interaction.product
              ? "✅ Product Identified"
              : "⭕ Waiting"}
          </div>

          <div>
            {interaction.summary
              ? "✅ AI Analysis Complete"
              : "⭕ Waiting"}
          </div>

          <div>
            {interaction.suggestions?.nextAction
              ? "✅ Suggestions Ready"
              : "⭕ Waiting"}
          </div>

          <div>
            {interaction.compliance
              ? "✅ Compliance Checked"
              : "⭕ Waiting"}
          </div>

        </div>

        <div className="mt-4">

          <div className="text-sm text-slate-600">
            Confidence
          </div>

          <div className="font-bold text-lg text-blue-600">
            {interaction.confidence ?? 0}%
          </div>

        </div>

      </div>
    </div>
  );
}