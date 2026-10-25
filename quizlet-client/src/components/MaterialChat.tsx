import React, { useCallback, useEffect, useRef, useState } from "react";
import { askMaterials } from "../api/materialService";
import { getErrorMessage } from "../helper/ErrorHandler";
import { MaterialSearchResult } from "../models/Study";

type ChatMessage = {
  id: number;
  role: "user" | "assistant";
  kind?: "answer" | "fallback" | "error" | "greeting";
  text: string;
  sources?: MaterialSearchResult[];
  question?: string;
  typing?: boolean;
};

interface MaterialChatProps {
  hasMaterials: boolean | null;
  aiAvailable: boolean | null;
}

const GREETING =
  "Hi! Ask me anything about your study materials and I'll answer from them, with sources.";
const SUGGESTIONS = [
  "Summarize my materials",
  "What are the key topics?",
  "Make a quiz question from my notes",
];
const SLOW_HINT_MS = 8000;

const TypedText = ({ text, onDone }: { text: string; onDone: () => void }) => {
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (shown >= text.length) {
      onDone();
      return;
    }
    const timer = setTimeout(() => setShown((s) => Math.min(text.length, s + 3)), 12);
    return () => clearTimeout(timer);
  }, [shown, text, onDone]);

  return (
    <>
      {text.slice(0, shown)}
      {shown < text.length && <span className="animate-pulse">▍</span>}
    </>
  );
};

const MaterialChat = ({ hasMaterials, aiAvailable }: MaterialChatProps) => {
  const nextId = useRef(1);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 0, role: "assistant", kind: "greeting", text: GREETING },
  ]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [slow, setSlow] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const add = (message: Omit<ChatMessage, "id">): number => {
    const id = nextId.current++;
    setMessages((prev) => [...prev, { ...message, id }]);
    return id;
  };

  const finishTyping = useCallback((id: number) => {
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, typing: false } : m)));
  }, []);

  const clearChat = () => {
    setMessages([{ id: 0, role: "assistant", kind: "greeting", text: GREETING }]);
    setInput("");
  };

  useEffect(() => {
    if (!pending) {
      setSlow(false);
      return;
    }
    const timer = setTimeout(() => setSlow(true), SLOW_HINT_MS);
    return () => clearTimeout(timer);
  }, [pending]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, pending]);

  const ask = async (question: string, showQuestion: boolean) => {
    if (showQuestion) add({ role: "user", text: question });

    if (hasMaterials === false) {
      add({
        role: "assistant",
        kind: "fallback",
        text: "You don't have any study materials yet. Add some text or upload a file, then ask me again.",
      });
      return;
    }
    if (aiAvailable === false) {
      add({
        role: "assistant",
        kind: "error",
        text: "The AI model is offline, so I can't answer right now. Start Ollama and try again.",
        question,
      });
      return;
    }

    setPending(true);
    try {
      const result = await askMaterials(question);
      if (result.sources.length === 0) {
        add({ role: "assistant", kind: "fallback", text: result.answer, question });
      } else {
        add({
          role: "assistant",
          kind: "answer",
          text: result.answer,
          sources: result.sources,
          typing: true,
        });
      }
    } catch (err) {
      add({ role: "assistant", kind: "error", text: getErrorMessage(err), question });
    } finally {
      setPending(false);
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const question = input.trim();
    if (!question || pending) return;
    setInput("");
    ask(question, true);
  };

  const hasUserMessage = messages.some((m) => m.role === "user");

  return (
    <section className="mt-8 p-6 space-y-4 text-left bg-blue-100 border-4 border-blue-200">
      <h2 className="text-2xl font-bold text-blue-850">Ask your materials</h2>

      <div className="space-y-3 min-h-[12rem] max-h-[28rem] overflow-y-auto pr-2" aria-live="polite">
        {messages.map((m) => {
          if (m.role === "user") {
            return (
              <div key={m.id} className="ml-auto max-w-[80%] px-4 py-2 bg-blue-800 text-blue-200">
                {m.text}
              </div>
            );
          }

          if (m.kind === "error") {
            return (
              <div key={m.id} className="max-w-[80%] p-4 bg-red-100 border-2 border-red-600 text-red-900">
                <p>{m.text}</p>
                {m.question && (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => ask(m.question as string, false)}
                    className="mt-2 px-3 py-1 font-bold bg-blue-800 text-blue-200 hover:bg-yellow-500 hover:text-blue-800 disabled:opacity-50"
                  >
                    Retry
                  </button>
                )}
              </div>
            );
          }

          if (m.kind === "fallback") {
            return (
              <div key={m.id} className="max-w-[80%] p-4 bg-yellow-100 border-2 border-yellow-500 text-blue-950">
                <p className="whitespace-pre-wrap">{m.text}</p>
                {m.question && (
                  <div className="mt-3">
                    <p className="text-sm font-bold text-blue-800">Try asking instead:</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {SUGGESTIONS.map((s) => (
                        <button
                          key={s}
                          type="button"
                          disabled={pending}
                          onClick={() => ask(s, true)}
                          className="px-3 py-1 text-sm font-bold bg-white border-2 border-blue-200 text-blue-950 hover:bg-yellow-500 disabled:opacity-50"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          }

          return (
            <div key={m.id} className="max-w-[80%] p-4 bg-white border-2 border-blue-200 text-blue-950">
              <p className="whitespace-pre-wrap">
                {m.typing ? (
                  <TypedText text={m.text} onDone={() => finishTyping(m.id)} />
                ) : (
                  m.text
                )}
              </p>
              {m.sources && m.sources.length > 0 && !m.typing && (
                <details className="mt-2 text-sm">
                  <summary className="font-bold cursor-pointer text-blue-800">
                    Sources ({m.sources.length})
                  </summary>
                  <ul className="mt-2 space-y-1">
                    {m.sources.map((s) => (
                      <li key={s.chunkId} className="text-blue-900">
                        <span className="font-bold">{s.title}</span> · {(s.similarity * 100).toFixed(0)}% match
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          );
        })}

        {pending && (
          <div className="max-w-[80%] p-4 bg-white border-2 border-blue-200">
            <div className="flex items-center gap-1" role="status" aria-label="Thinking">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-2 h-2 rounded-full bg-blue-800 animate-bounce"
                  style={{ animationDelay: `${i * 150}ms` }}
                />
              ))}
              <span className="ml-2 text-blue-900">Thinking…</span>
            </div>
            {slow && (
              <p className="mt-2 text-sm text-blue-800">
                Still working. Local models can take a little while on longer materials.
              </p>
            )}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {!hasUserMessage && (
        <div className="flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              disabled={pending}
              onClick={() => ask(s, true)}
              className="px-3 py-1 text-sm font-bold bg-white border-2 border-blue-200 text-blue-950 hover:bg-yellow-500 disabled:opacity-50"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <form onSubmit={onSubmit} className="flex gap-2">
        <input
          aria-label="Ask a question"
          className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-blue-950"
          placeholder="Ask a question about your materials"
          value={input}
          disabled={pending}
          onChange={(e) => setInput(e.target.value)}
        />
        <button
          type="submit"
          disabled={pending || !input.trim()}
          className="px-4 font-bold bg-blue-800 text-blue-200 hover:bg-yellow-500 hover:text-blue-800 disabled:opacity-50"
        >
          Send
        </button>
        <button
          type="button"
          disabled={pending || messages.length <= 1}
          onClick={clearChat}
          className="px-4 font-bold bg-white border-2 border-blue-200 text-blue-950 hover:bg-yellow-500 disabled:opacity-50"
        >
          Clear
        </button>
      </form>
    </section>
  );
};

export default MaterialChat;
