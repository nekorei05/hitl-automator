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
      setError("Could not create task. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
      <p className="mb-3 text-xs font-medium uppercase tracking-widest text-zinc-500">
        New Task
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Describe the job or outreach goal…"
          className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-all duration-150 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-all duration-150 hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-500"
        >
          {loading ? "Creating…" : "Create Task"}
        </button>
      </form>
      {error && <p className="mt-2.5 text-xs text-red-400">{error}</p>}
    </div>
  );
}