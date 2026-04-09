import { useState, useEffect, useCallback } from "react";
import TaskForm from "../components/TaskForm";
import TaskCard from "../components/TaskCard";
import { getTasks } from "../services/api";

// ─── Status filter tabs ───────────────────────────────────────────────────────
const FILTERS = ["All", "CREATED", "READY_FOR_REVIEW", "COMPLETED", "REJECTED"];

export default function Dashboard() {
  const [tasks, setTasks]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState("All");
  const [isDark, setIsDark]   = useState(true);

  const fetchTasks = useCallback(async () => {
    try {
      const res = await getTasks();
      setTasks(res.data);
    } catch (err) {
      console.error("Failed to fetch tasks:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
    const interval = setInterval(fetchTasks, 6000); // poll every 6s
    return () => clearInterval(interval);
  }, [fetchTasks]);

  // Add new task to top of list
  const handleTaskCreated = (task) => {
    setTasks((prev) => [task, ...prev]);
  };

  // Replace an existing task in-place (after approve/reject/generate)
  const handleTaskUpdated = (updated) => {
    setTasks((prev) =>
      prev.map((t) => (t._id === updated._id ? updated : t))
    );
  };

  // Derived counts
  const counts = {
    all:    tasks.length,
    review: tasks.filter((t) => t.status === "READY_FOR_REVIEW").length,
    done:   tasks.filter((t) => t.status === "COMPLETED").length,
  };

  const filtered = filter === "All"
    ? tasks
    : tasks.filter((t) => t.status === filter);

  return (
    <div className={`min-h-screen w-full ${isDark ? "dark bg-[#0B0F14] text-gray-100" : "bg-gray-50 text-gray-900"}`}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className={`sticky top-0 z-10 border-b backdrop-blur-md ${isDark ? "bg-[#0B0F14]/80 border-[#1F2937]" : "bg-white/80 border-gray-200"}`}>
        <div className="w-full max-w-[1600px] mx-auto px-6 lg:px-10 flex items-center justify-between py-3">
          <div>
            <h1 className="text-base font-semibold tracking-tight text-gray-100 dark:text-gray-100 text-gray-900">
              Agentic HITL
            </h1>
            <p className="text-xs text-gray-400 dark:text-gray-400 text-gray-600">AI Task Orchestrator</p>
          </div>

          {/* Stats pills */}
          <div className="flex items-center gap-2 text-xs">
            <span className={`rounded-full border px-3 py-1 ${isDark ? "border-[#1F2937] bg-[#111827] text-gray-300" : "border-gray-200 bg-gray-50 text-gray-600"}`}>
              {counts.all} total
            </span>
            {counts.review > 0 && (
              <span className={`rounded-full border px-3 py-1 ${isDark ? "border-yellow-900/60 bg-yellow-950/40 text-yellow-300" : "border-yellow-200 bg-yellow-50 text-yellow-700"}`}>
                {counts.review} to review
              </span>
            )}
            {counts.done > 0 && (
              <span className={`rounded-full border px-3 py-1 ${isDark ? "border-emerald-900/60 bg-emerald-950/40 text-emerald-300" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
                {counts.done} done
              </span>
            )}
          </div>

          {/* Theme toggle */}
          <button
            onClick={() => setIsDark(!isDark)}
            className="text-xs font-semibold text-gray-400 hover:text-gray-200 dark:text-gray-400 dark:hover:text-gray-200 text-gray-600 hover:text-gray-900 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/40 focus:border-[#7C3AED]"
          >
            {isDark ? 'Light' : 'Dark'}
          </button>
        </div>
      </header>

      {/* ── Main content ───────────────────────────────────────────────────── */}
      <main className="w-full py-8">
        <div className="w-full max-w-[1600px] mx-auto px-6 lg:px-10">

        {/* Task creation form */}
        <TaskForm onTaskCreated={handleTaskCreated} />

        {/* Filter tabs */}
        <div className="mt-8 flex items-center gap-1 overflow-x-auto pb-1">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/40 focus:border-[#7C3AED] ${
                filter === f
                  ? "bg-gradient-to-r from-[#7C3AED] to-[#6366F1] text-white shadow-sm"
                  : `${isDark ? "text-gray-400 hover:text-gray-200 bg-transparent hover:bg-[#111827]" : "text-gray-600 hover:text-gray-900 bg-transparent hover:bg-gray-100"}`
              }`}
            >
              {f === "All" ? `All (${counts.all})` : f.replace(/_/g, " ")}
            </button>
          ))}
        </div>

        {/* Divider */}
        <div className={`mt-4 border-t ${isDark ? "border-[#1F2937]" : "border-gray-200"}`} />

        {/* Task list */}
        <div className="mt-5">
          {loading ? (
            <div className={`flex flex-col items-center justify-center py-20 ${isDark ? "text-gray-500" : "text-gray-500"}`}>
              <div className={`mb-3 h-4 w-4 animate-spin rounded-full border-2 ${isDark ? "border-[#1F2937] border-t-gray-300" : "border-gray-200 border-t-[#7C3AED]"}`} />
              <p className="text-xs">Loading tasks…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-500 text-gray-500">
                {filter === "All"
                  ? "No tasks yet. Create one above."
                  : `No tasks with status "${filter.replace(/_/g, " ")}".`}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filtered.map((task) => (
                <TaskCard
                  key={task._id}
                  task={task}
                  onUpdate={handleTaskUpdated}
                />
              ))}
            </div>
          )}
        </div>
        </div>
      </main>
    </div>
  );
}