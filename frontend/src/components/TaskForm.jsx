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
    } catch (err) {
      setError("Failed to create task. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-5 mb-6">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-4">
        New Task
      </h2>
      <form onSubmit={handleSubmit} className="flex gap-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Describe a task for the agent..."
          className="flex-1 bg-zinc-800 border border-zinc-600 text-zinc-100 placeholder-zinc-500 rounded px-4 py-2 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white text-sm font-medium px-5 py-2 rounded transition-colors"
        >
          {loading ? "Sending..." : "Run"}
        </button>
      </form>
      {error && (
        <p className="mt-3 text-xs text-red-400">{error}</p>
      )}
    </div>
  );
}
