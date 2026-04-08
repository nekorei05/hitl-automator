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
    <div className={`min-h-screen text-zinc-100 ${isDark ? 'dark bg-zinc-950' : 'bg-white'}`}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className={`sticky top-0 z-10 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md ${isDark ? 'dark:bg-zinc-950/80 dark:border-zinc-800' : 'bg-white/80 border-gray-300'}`}>
        <div className="w-full flex items-center justify-between px-6 lg:px-10 py-4">
          <div>
            <h1 className="text-base font-semibold tracking-tight text-zinc-100 dark:text-zinc-100 text-gray-900">
              Agentic HITL
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-500 text-gray-600">AI Task Orchestrator</p>
          </div>

          {/* Stats pills */}
          <div className="flex items-center gap-2 text-xs">
            <span className="rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1 text-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 border-gray-300 bg-gray-100 text-gray-600">
              {counts.all} total
            </span>
            {counts.review > 0 && (
              <span className="rounded-full border border-yellow-800 bg-yellow-950 px-3 py-1 text-yellow-400 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-400 border-yellow-300 bg-yellow-50 text-yellow-600">
                {counts.review} to review
              </span>
            )}
            {counts.done > 0 && (
              <span className="rounded-full border border-emerald-800 bg-emerald-950 px-3 py-1 text-emerald-400 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-400 border-emerald-300 bg-emerald-50 text-emerald-600">
                {counts.done} done
              </span>
            )}
          </div>

          {/* Theme toggle */}
          <button
            onClick={() => setIsDark(!isDark)}
            className="text-xs text-zinc-400 hover:text-zinc-200 dark:text-zinc-400 dark:hover:text-zinc-200 text-gray-600 hover:text-gray-800"
          >
            {isDark ? 'Light' : 'Dark'}
          </button>
        </div>
      </header>

      {/* ── Main content ───────────────────────────────────────────────────── */}
      <main className="w-full px-6 lg:px-10 py-8">

        {/* Task creation form */}
        <TaskForm onTaskCreated={handleTaskCreated} />

        {/* Filter tabs */}
        <div className="mt-8 flex items-center gap-1 overflow-x-auto pb-1">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-150 ${
                filter === f
                  ? "bg-zinc-800 text-zinc-100 dark:bg-zinc-800 dark:text-zinc-100 bg-blue-600 text-white"
                  : "text-zinc-500 hover:text-zinc-300 dark:text-zinc-500 dark:hover:text-zinc-300 text-gray-600 hover:text-gray-800"
              }`}
            >
              {f === "All" ? `All (${counts.all})` : f.replace(/_/g, " ")}
            </button>
          ))}
        </div>

        {/* Divider */}
        <div className="mt-4 border-t border-zinc-800 dark:border-zinc-800 border-gray-300" />

        {/* Task list */}
        <div className="mt-5">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-zinc-600 dark:text-zinc-600 text-gray-500">
              <div className="mb-3 h-4 w-4 animate-spin rounded-full border-2 border-zinc-700 border-t-zinc-400 dark:border-zinc-700 dark:border-t-zinc-400 border-gray-300 border-t-blue-600" />
              <p className="text-xs">Loading tasks…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-sm text-zinc-600 dark:text-zinc-600 text-gray-500">
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
      </main>
    </div>
  );
}