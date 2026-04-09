import { useState } from "react";
import { createTask } from "../services/api";

export default function TaskForm({ onTaskCreated }) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await createTask(input.trim());
      onTaskCreated(res.data);
      setInput("");
    } catch {
      setError("AI is currently busy. Please wait 10 seconds and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-6 lg:px-10 pt-16 pb-12 max-w-[760px] mx-auto text-center">

      {/* Eyebrow */}
      <div className="flex items-center justify-center gap-3 mb-5">
        <span className="h-px w-10 bg-violet-700/50" />
        <span className="text-[11px] font-semibold tracking-[0.18em] uppercase text-violet-500">
          AI-Powered Outreach
        </span>
        <span className="h-px w-10 bg-violet-700/50" />
      </div>

      {/* Headline */}
      <h1 className="text-[42px] sm:text-[52px] font-extrabold tracking-tight leading-[1.08] text-white mb-4">
        Turn job descriptions into{" "}
        <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
          tailored emails
        </span>
      </h1>

      <p className="text-[17px] text-slate-400 leading-relaxed max-w-[500px] mx-auto mb-10">
        Paste a job description. Your AI agent analyses your skills, writes a
        personalised cold email, and waits for your approval.
      </p>

      {/* Input form */}
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 bg-white/[0.03] border border-white/[0.09] rounded-2xl px-5 py-2 max-w-[640px] mx-auto transition-all duration-200 focus-within:border-violet-500/50 focus-within:bg-white/[0.04]"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Paste a job description or describe the role…"
          className="flex-1 bg-transparent border-none outline-none text-[15px] text-slate-200 placeholder-slate-600 py-3"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="shrink-0 bg-gradient-to-br from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl px-6 py-3 transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98] shadow-lg shadow-violet-900/30"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Analysing…
            </span>
          ) : (
            "Generate Draft"
          )}
        </button>
      </form>

      {/* Error */}
      {error && (
        <div className="mt-4 max-w-[580px] mx-auto flex items-center gap-2 bg-red-950/40 border border-red-900/50 rounded-xl px-4 py-3 text-sm text-red-400">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      {/* Steps */}
      <div className="flex items-start justify-center gap-0 mt-12 max-w-[480px] mx-auto">
        {[
          { n: "1", label: "Paste JD" },
          { n: "2", label: "AI analyses" },
          { n: "3", label: "Review draft" },
          { n: "4", label: "Send via Gmail" },
        ].map((step, i, arr) => (
          <div key={i} className="flex-1 flex flex-col items-center relative">
            {i < arr.length - 1 && (
              <span className="absolute top-[13px] left-1/2 w-full h-px bg-violet-900/50" />
            )}
            <span className="relative z-10 w-7 h-7 rounded-full border border-violet-700/50 bg-violet-950/60 text-violet-400 text-[11px] font-bold flex items-center justify-center mb-2">
              {step.n}
            </span>
            <span className="text-[11px] text-slate-600">{step.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}