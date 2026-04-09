import { useState, useRef, useEffect } from "react";
import { createTask } from "../services/api";
import { Sparkles, ArrowRight, Loader2 } from "lucide-react";

export default function TaskForm({ onTaskCreated }) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingSteps, setLoadingSteps] = useState([]);
  const [error, setError] = useState("");
  const textareaRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [input]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    setLoading(true);
    setError("");
    setLoadingSteps(["Analyzing job description..."]);

    setTimeout(() => setLoadingSteps(prev => [...prev, "Matching with profile..."]), 1000);
    setTimeout(() => setLoadingSteps(prev => [...prev, "Generating draft via AI..."]), 2000);

    try {
      const res = await createTask(input.trim());
      onTaskCreated(res.data);
      setInput("");
      setLoadingSteps([]);
    } catch {
      setError("AI is currently busy. Please wait 10 seconds and try again.");
      setLoadingSteps([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center max-w-3xl mx-auto w-full w-full h-full pb-20 pt-10">
      
      <div className="mb-10 text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-2 border border-indigo-500/20 shadow-inner shadow-indigo-500/10">
          <Sparkles className="w-3.5 h-3.5" />
          AI-Powered Matcher
        </div>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-zinc-100">
          New Outreach Task
        </h1>
        <p className="text-zinc-400 text-lg max-w-xl mx-auto">
          Paste a job description below. Our AI will analyze the fit and draft a highly-tailored pitch email.
        </p>
      </div>

      <form 
        onSubmit={handleSubmit}
        className="w-full relative isolate"
      >
        {/* Glow effect behind the form */}
        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl blur opacity-20 transition duration-500 group-hover:opacity-40"></div>
        
        <div className="relative bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-6 transition-all focus-within:border-indigo-500/50 focus-within:ring-1 focus-within:ring-indigo-500/50">
          
          <label htmlFor="job-description" className="sr-only">Job Description</label>
          <textarea
            id="job-description"
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            placeholder="Paste the target job description or requirements here..."
            className="w-full bg-transparent border-none outline-none text-zinc-200 placeholder-zinc-600 text-base resize-none overflow-hidden min-h-[160px]"
            rows={5}
          />

          <div className="flex items-center justify-between mt-4 pt-4 border-t border-zinc-800">
            <div className="text-xs text-zinc-500 flex items-center gap-2">
              <span>Markdown supported</span>
            </div>
            
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="inline-flex flex-shrink-0 items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-6 py-2.5 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(79,70,229,0.3)] hover:shadow-[0_0_25px_rgba(79,70,229,0.5)] active:scale-95"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Analyze Match
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Loading Steps UI */}
      {loading && loadingSteps.length > 0 && (
        <div className="mt-10 w-full bg-zinc-900/50 border border-zinc-800/80 rounded-xl p-5 shadow-lg max-w-lg animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="space-y-3">
            {loadingSteps.map((step, idx) => {
              const isLast = idx === loadingSteps.length - 1;
              return (
                <div key={idx} className={`flex items-center gap-3 ${isLast ? 'text-indigo-400' : 'text-zinc-500'}`}>
                  {isLast ? (
                    <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                  ) : (
                    <div className="w-4 h-4 rounded-full bg-indigo-500/20 border border-indigo-500/50 flex items-center justify-center shrink-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                    </div>
                  )}
                  <span className="text-sm font-medium">{step}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Error UI */}
      {error && (
        <div className="mt-8 w-full max-w-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-lg flex items-center gap-2 animate-in fade-in">
          <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}
    </div>
  );
}