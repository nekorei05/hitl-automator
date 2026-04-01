import { useState, useEffect, useCallback } from "react";
import TaskForm from "../components/TaskForm";
import TaskCard from "../components/TaskCard";
import HITLModal from "../components/HITLModal";
import { getTasks } from "../services/api";

export default function Dashboard() {
  const [tasks, setTasks] = useState([]);
  const [activeHITL, setActiveHITL] = useState(null);
  const [loading, setLoading] = useState(true);

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
    // Poll every 5 seconds to pick up status changes from the agent
    const interval = setInterval(fetchTasks, 5000);
    return () => clearInterval(interval);
  }, [fetchTasks]);

  const handleTaskCreated = (task) => {
    setTasks((prev) => [task, ...prev]);
  };

  const handleResolved = (updatedTask) => {
    setTasks((prev) =>
      prev.map((t) => (t._id === updatedTask._id ? updatedTask : t))
    );
    setActiveHITL(null);
  };

  const pendingApprovals = tasks.filter(
    (t) => t.requiresApproval && t.status !== "completed" && t.status !== "rejected"
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <header className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-sm font-semibold tracking-widest uppercase text-zinc-100">
            Agentic HITL
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">Task Orchestrator</p>
        </div>
        <div className="flex items-center gap-4 text-xs text-zinc-500">
          <span>{tasks.length} tasks</span>
          {pendingApprovals.length > 0 && (
            <span className="flex items-center gap-1.5 text-yellow-400">
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
              {pendingApprovals.length} awaiting approval
            </span>
          )}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <TaskForm onTaskCreated={handleTaskCreated} />

        {/* Task list */}
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-4">
            Tasks
          </h2>

          {loading ? (
            <p className="text-zinc-600 text-sm text-center py-10">Loading...</p>
          ) : tasks.length === 0 ? (
            <p className="text-zinc-600 text-sm text-center py-10">
              No tasks yet. Submit one above.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {tasks.map((task) => (
                <TaskCard
                  key={task._id}
                  task={task}
                  onApprovalNeeded={setActiveHITL}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* HITL Modal */}
      {activeHITL && (
        <HITLModal
          task={activeHITL}
          onResolved={handleResolved}
        />
      )}
    </div>
  );
}
