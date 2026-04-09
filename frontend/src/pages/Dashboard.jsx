import { useState, useEffect, useCallback } from "react";
import TaskForm from "../components/TaskForm";
import TaskCard from "../components/TaskCard";
import { getTasks } from "../services/api";
import { Plus, LayoutDashboard } from "lucide-react";

const FILTERS = ["All", "CREATED", "PROCESSING", "READY_FOR_REVIEW", "COMPLETED", "REJECTED"];

function StatusBadge({ status }) {
  const config = {
    CREATED: { label: "Created", color: "blue" },
    PROCESSING: { label: "Processing", color: "blue" },
    READY_FOR_REVIEW: { label: "Ready for Review", color: "yellow" },
    COMPLETED: { label: "Completed", color: "green" },
    REJECTED: { label: "Rejected", color: "red" }
  };
  
  const c = config[status] || { label: status, color: "gray" };

  const colors = {
    blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    yellow: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    green: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    red: "bg-red-500/10 text-red-400 border-red-500/20",
    gray: "bg-zinc-800 text-zinc-400 border-zinc-700",
  };

  return (
    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${colors[c.color]}`}>
      {c.label}
    </span>
  );
}

export default function Dashboard() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [selectedTaskId, setSelectedTaskId] = useState(null);

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
    const interval = setInterval(fetchTasks, 6000); 
    return () => clearInterval(interval);
  }, [fetchTasks]);

  const handleTaskCreated = (task) => {
    setTasks((prev) => [task, ...prev]);
    setSelectedTaskId(task._id); 
  };

  const handleTaskUpdated = (updated) => {
    setTasks((prev) =>
      prev.map((t) => (t._id === updated._id ? updated : t))
    );
  };

  const counts = {
    all: tasks.length,
    review: tasks.filter((t) => t.status === "READY_FOR_REVIEW").length,
    done: tasks.filter((t) => t.status === "COMPLETED").length,
  };

  const filtered = filter === "All"
    ? tasks
    : tasks.filter((t) => t.status === filter);

  const selectedTask = tasks.find(t => t._id === selectedTaskId);

  return (
    <div className="flex h-screen w-full bg-zinc-950 text-zinc-100 overflow-hidden font-sans">
      
      {/* ── Left Sidebar ── */}
      <aside className="w-[340px] flex-shrink-0 border-r border-zinc-800/50 bg-[#09090b] flex flex-col h-full z-10">
        
        {/* Header */}
        <div className="p-5 border-b border-zinc-800/50">
          <div className="flex items-center gap-2 mb-4">
            <LayoutDashboard className="w-5 h-5 text-indigo-500" />
            <div>
              <h1 className="text-sm font-semibold tracking-tight text-zinc-100">Agentic HITL</h1>
              <p className="text-[11px] text-zinc-500 leading-none mt-1">AI Task Orchestrator</p>
            </div>
          </div>
          
          <button
            onClick={() => setSelectedTaskId(null)}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium py-2.5 rounded-lg transition-colors shadow-lg shadow-indigo-900/20"
          >
            <Plus className="w-4 h-4" />
            New Task
          </button>
        </div>

        {/* Filters */}
        <div className="px-3 pt-3 pb-2 border-b border-zinc-800/50">
          <div className="flex overflow-x-auto no-scrollbar gap-1 pb-1">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`shrink-0 rounded-md px-2.5 py-1.5 text-[11px] font-semibold transition-all ${
                  filter === f
                    ? "bg-zinc-800 text-zinc-100"
                    : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
                }`}
              >
                {f === "All" ? `All (${counts.all})` : f.replace(/_/g, " ")}
              </button>
            ))}
          </div>
        </div>

        {/* Task List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1 scrollbar-thin scrollbar-thumb-zinc-800 hover:scrollbar-thumb-zinc-700">
          {loading ? (
            <div className="py-10 text-center flex flex-col items-center">
              <div className="w-4 h-4 border-2 border-zinc-700 border-t-indigo-500 rounded-full animate-spin mb-2" />
              <p className="text-xs text-zinc-500">Loading tasks...</p>
            </div>
          ) : filtered.length === 0 ? (
            <p className="py-10 text-xs text-center text-zinc-600">No tasks found.</p>
          ) : (
            filtered.map((task) => {
              const isSelected = selectedTaskId === task._id;
              // Extract snippet
              const snippet = task.jobDescription?.substring(0, 60) || "No description provided...";
              
              return (
                <button
                  key={task._id}
                  onClick={() => setSelectedTaskId(task._id)}
                  className={`w-full text-left p-3 rounded-lg border transition-all duration-200 ${
                    isSelected 
                      ? "bg-zinc-800/80 border-indigo-500/30 shadow-sm shadow-indigo-900/10" 
                      : "bg-transparent border-transparent hover:bg-zinc-800/40"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <StatusBadge status={task.status} />
                    <span className="text-[10px] text-zinc-500 font-mono">
                      {task._id.slice(-6)}
                    </span>
                  </div>
                  <p className="text-[13px] text-zinc-300 line-clamp-2 leading-relaxed">
                    {snippet}
                  </p>
                </button>
              );
            })
          )}
        </div>
      </aside>

      {/* ── Main Content Area ── */}
      <main className="flex-1 h-full overflow-y-auto bg-[#040405] scrollbar-thin scrollbar-thumb-zinc-800">
        <div className="max-w-[1200px] mx-auto px-8 py-10 min-h-full flex flex-col">
          {!selectedTaskId || !selectedTask ? (
            <TaskForm onTaskCreated={handleTaskCreated} />
          ) : (
            <TaskCard task={selectedTask} onUpdate={handleTaskUpdated} />
          )}
        </div>
      </main>

    </div>
  );
}