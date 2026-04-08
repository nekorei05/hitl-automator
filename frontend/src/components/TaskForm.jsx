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
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-md transition-all duration-200 hover:shadow-lg dark:border-[#1F2937] dark:bg-[#111827]">
      <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400">
        New Task
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Describe the job or outreach goal…"
          className="flex-1 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all duration-200 focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/30 dark:border-[#1F2937] dark:bg-[#0B0F14] dark:text-gray-100 dark:placeholder-gray-500"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="rounded-lg bg-gradient-to-r from-[#7C3AED] to-[#6366F1] px-5 py-2 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/40 focus:border-[#7C3AED]"
        >
          {loading ? "Creating…" : "Create Task"}
        </button>
      </form>
      {error && <p className="mt-2.5 text-xs text-red-400">{error}</p>}
    </div>
  );
}