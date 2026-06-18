"use client";

import { useEffect, useRef, useState } from "react";

type Msg = { role: "user" | "assistant"; content: string };

// Minimal inline markdown: **bold**, [text](url), and bare links. Dependency-free.
function renderRich(text: string) {
  const nodes: React.ReactNode[] = [];
  const re =
    /\[([^\]]+)\]\((https?:\/\/[^\s)]+|\/[^\s)]+)\)|\*\*([^*]+)\*\*|(https?:\/\/[^\s)]+|\/[a-zA-Z0-9\-_/]+)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  const link = (href: string, label: string) => (
    <a
      key={k++}
      href={href}
      {...(href.startsWith("http") ? { target: "_blank", rel: "noreferrer" } : {})}
      className="text-gold underline underline-offset-2 hover:opacity-80"
    >
      {label}
    </a>
  );
  while ((m = re.exec(text))) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    if (m[1]) nodes.push(link(m[2], m[1]));
    else if (m[3]) nodes.push(<strong key={k++} className="text-white font-semibold">{m[3]}</strong>);
    else if (m[4]) nodes.push(link(m[4], m[4]));
    last = re.lastIndex;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

const SUGGESTIONS = [
  "How do I price my services for higher-value clients?",
  "Which members should I connect with for a partnership?",
  "Give me a 30-day plan to land my first 3 customers.",
  "What does the classroom say about building a sales system?",
];

export default function AssistantChat({ firstName }: { firstName: string | null }) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, streaming]);

  async function send(text: string) {
    const q = text.trim();
    if (!q || streaming) return;
    setInput("");

    const next: Msg[] = [...messages, { role: "user", content: q }];
    setMessages([...next, { role: "assistant", content: "" }]);
    setStreaming(true);

    try {
      const res = await fetch("/api/concierge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      if (!res.ok || !res.body) {
        const errText = (await res.text().catch(() => "")) || "Something went wrong.";
        setMessages((m) => {
          const copy = [...m];
          copy[copy.length - 1] = { role: "assistant", content: errText };
          return copy;
        });
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMessages((m) => {
          const copy = [...m];
          copy[copy.length - 1] = { role: "assistant", content: acc };
          return copy;
        });
      }
    } catch {
      setMessages((m) => {
        const copy = [...m];
        copy[copy.length - 1] = {
          role: "assistant",
          content: "The AI ran into a connection error. Please try again.",
        };
        return copy;
      });
    } finally {
      setStreaming(false);
    }
  }

  const empty = messages.length === 0;

  return (
    <div className="flex flex-col h-[calc(100vh-9rem)] md:h-[calc(100vh-7rem)]">
      <div ref={scrollRef} className="flex-1 overflow-y-auto pr-1 space-y-4">
        {empty ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-4">
            <div className="w-14 h-14 rounded-2xl bg-gold/15 ring-1 ring-gold flex items-center justify-center text-3xl mb-4">
              ✨
            </div>
            <h2
              className="text-2xl font-black text-white"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {firstName ? `Hey ${firstName} — ask me anything` : "Ask me anything"}
            </h2>
            <p className="text-gray-400 mt-2 max-w-md">
              I know every BES classroom, your business, and the whole member network. Ask me
              about strategy, the material, or who to partner with.
            </p>
            <div className="grid sm:grid-cols-2 gap-2 mt-6 w-full max-w-xl">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="text-left text-sm rounded-xl border border-dark-border bg-dark-card px-4 py-3 text-gray-300 hover:border-gold hover:text-white transition-all"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m, i) => (
            <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 whitespace-pre-wrap leading-relaxed ${
                  m.role === "user"
                    ? "bg-gold text-dark font-medium"
                    : "bg-dark-card border border-dark-border text-gray-200"
                }`}
              >
                {m.content ? (
                  m.role === "assistant" ? renderRich(m.content) : m.content
                ) : (
                  <span className="inline-flex gap-1 items-center text-gray-500">
                    <span className="animate-pulse">Thinking…</span>
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="mt-4 flex items-end gap-2"
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send(input);
            }
          }}
          rows={1}
          placeholder="Ask the BES AI…"
          className="flex-1 resize-none rounded-xl bg-dark-card border border-dark-border px-4 py-3 text-white placeholder-gray-500 focus:border-gold focus:outline-none max-h-40"
        />
        <button
          type="submit"
          disabled={streaming || !input.trim()}
          className="rounded-xl bg-gold px-5 py-3 font-bold text-dark hover:opacity-90 transition-opacity disabled:opacity-40"
        >
          {streaming ? "…" : "Send"}
        </button>
      </form>
    </div>
  );
}
