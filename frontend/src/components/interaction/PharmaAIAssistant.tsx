import { useEffect, useRef, useState } from "react";
import api from "../../services/api";

import { Bot, User, Send, Sparkles } from "lucide-react";

import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { updateField } from "./interactionSlice";
import { addMessage } from "../../store/chatSlice";

interface ChatMessage {
  role: "user" | "assistant";
  text: string;
}

export default function PharmaAIAssistant() {
  const dispatch = useAppDispatch();

  const interaction = useAppSelector(
    (state) => state.interaction
  );

  const history = useAppSelector(
    (state)=>state.chat.messages
);
  const [loading, setLoading] = useState(false);

  const [message, setMessage] = useState("");

  const bottomRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      text:
        "👋 Hi! I'm PharmaAI Assistant.\n\nI can edit CRM fields, rewrite summaries, explain AI decisions and generate follow-up content.",
    },
  ]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  const quickActions = [
    "Rewrite Summary",
    "Explain Sentiment",
    "Generate Follow-up Email",
    "Check Missing Fields",
    "Generate Next Visit Plan",
    "Improve Notes",
  ];

  async function send(text: string) {
  if (!text.trim()) return;

  // Add user message to UI
  setMessages((prev) => [
    ...prev,
    {
      role: "user",
      text,
    },
  ]);

  // Save user message in Redux history
  dispatch(
    addMessage({
      role: "user",
      content: text,
    })
  );

  setLoading(true);
  setMessage("");

  try {
    console.log({
      interaction,
      message: text,
      history,
    });

    const res = await api.post(
      "/assistant",
      {
        interaction,
        message: text,
        history,
      }
    );

    const assistant = res.data;
    console.log("Assistant Response:", assistant);

    // Prefer generated content (email, WhatsApp, etc.)
    const generated =
  typeof assistant.generated === "string"
    ? assistant.generated
    : "";

const reply =
  generated.trim().length > 0
    ? generated
    : assistant.reply;

    // Add AI reply to UI
    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        text: reply,
      },
    ]);

    // Save AI reply in Redux history
    dispatch(
      addMessage({
        role: "assistant",
        content: reply,
      })
    );

    // Apply AI field updates
    if (
      assistant.updates &&
      assistant.updates.length > 0
    ) {
      assistant.updates.forEach((u: any) => {
        dispatch(
          updateField({
            field: u.field,
            value: u.value,
          })
        );
      });
    }
  } catch (err) {
    console.error(err);

    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        text: "Something went wrong.",
      },
    ]);
  } finally {
    setLoading(false);
  }
}
  return (
    <div className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-lg">

      {/* Header */}

      <div className="flex items-center justify-between border-b border-slate-200 p-5">

        <div className="flex items-center gap-3">

          <div className="rounded-full bg-blue-100 p-3">
            <Bot className="text-blue-600" size={24} />
          </div>

          <div>
            <h2 className="text-xl font-bold">
              💊 PharmaAI Assistant
            </h2>

            <p className="text-sm text-slate-500">
              AI-powered CRM Assistant
            </p>
          </div>

        </div>

        <Sparkles className="text-yellow-500" />

      </div>

      {/* Capabilities */}

      <div className="border-b border-slate-200 bg-slate-50 p-4">

        <p className="mb-3 text-sm font-semibold text-slate-700">
          I can help you:
        </p>

        <div className="grid grid-cols-2 gap-2 text-sm">

          <div>✔ Edit CRM fields</div>

          <div>✔ Rewrite summaries</div>

          <div>✔ Explain AI decisions</div>

          <div>✔ Generate follow-up email</div>

          <div>✔ Improve notes</div>

          <div>✔ Recommend next visit</div>

        </div>

      </div>

      {/* Quick Actions */}

      <div className="flex flex-wrap gap-2 border-b border-slate-200 p-4">

        {quickActions.map((action) => (
          <button
            key={action}
            onClick={() => send(action)}
            className="rounded-full bg-blue-50 px-3 py-2 text-sm text-blue-700 transition hover:bg-blue-100"
          >
            {action}
          </button>
        ))}

      </div>

      {/* Chat */}

      <div className="h-[420px] overflow-y-auto bg-slate-50 p-5 space-y-5">

        {messages.map((msg, index) => (

          <div
            key={index}
            className={`flex ${
              msg.role === "user"
                ? "justify-end"
                : "justify-start"
            }`}
          >

            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 shadow ${
                msg.role === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-white border border-slate-200"
              }`}
            >

              <div className="mb-2 flex items-center gap-2">

                {msg.role === "assistant" ? (
                  <Bot size={18} />
                ) : (
                  <User size={18} />
                )}

                <span className="text-xs font-semibold">

                  {msg.role === "assistant"
                    ? "PharmaAI"
                    : "You"}

                </span>

              </div>

              <p className="whitespace-pre-wrap text-sm">
                {msg.text}
              </p>

            </div>

          </div>

        ))}

        {loading && (

          <div className="flex justify-start">

            <div className="rounded-xl border bg-white px-4 py-3 shadow">

              <div className="flex items-center gap-2">

                <Bot size={18} />

                <span className="text-sm font-medium">
                  PharmaAI is thinking...
                </span>

              </div>

              <div className="mt-3 flex gap-2">

                <div className="h-2 w-2 animate-bounce rounded-full bg-blue-600"></div>

                <div className="h-2 w-2 animate-bounce rounded-full bg-blue-600 [animation-delay:0.2s]"></div>

                <div className="h-2 w-2 animate-bounce rounded-full bg-blue-600 [animation-delay:0.4s]"></div>

              </div>

            </div>

          </div>

        )}

        <div ref={bottomRef} />

      </div>
         {/* Input */}

      <div className="border-t border-slate-200 p-4">

        <div className="flex gap-3">

          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                send(message);
              }
            }}
            placeholder="Ask PharmaAI anything..."
            className="flex-1 rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          />

          <button
            onClick={() => send(message)}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
          >
            <Send size={18} />
            Send
          </button>

        </div>

        <p className="mt-3 text-xs text-slate-500">
          💡 Try:
          <span className="ml-1 font-medium">
            "Change hospital to Apollo Hospital"
          </span>
          ,
          <span className="ml-1 font-medium">
            "Rewrite the summary professionally"
          </span>
          ,
          <span className="ml-1 font-medium">
            "Generate a follow-up email"
          </span>
        </p>

      </div>

    </div>
  );
}