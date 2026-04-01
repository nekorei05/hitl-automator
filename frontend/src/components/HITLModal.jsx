import { useState } from "react";
import { approveTask, rejectTask } from "../services/api";

export default function HITLModal({ task, onResolved }) {
  const [loading, setLoading] = useState(false);

  const handle = async (action) => {
    setLoading(true);
    try {
      const res = action === "approve"
        ? await approveTask(task._id)
        : await rejectTask(task._id);
      onResolved(res.data);
    } catch (err) {
      console.error("HITL action failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-yellow-500/40 rounded-lg w-full max-w-md mx-4 p-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
          <h3 className="text-sm font-semibold uppercase tracking-widest text-yellow-400">
            Approval Required
          </h3>
        </div>

        <p className="text-xs text-zinc-400 mb-1 uppercase tracking-wider">Task</p>
        <p className="text-zinc-200 text-sm mb-4">{task.input}</p>

        <p className="text-xs text-zinc-400 mb-1 uppercase tracking-wider">Pending Action</p>
        <div className="bg-black rounded p-3 font-mono text-xs text-zinc-300 mb-6 border border-zinc-700">
          {task.pendingAction || "Agent is requesting human approval."}
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => handle("approve")}
            disabled={loading}
            className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-medium py-2 rounded transition-colors"
          >
            {loading ? "..." : "Approve"}
          </button>
          <button
            onClick={() => handle("reject")}
            disabled={loading}
            className="flex-1 bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white text-sm font-medium py-2 rounded transition-colors"
          >
            {loading ? "..." : "Reject"}
          </button>
        </div>
      </div>
    </div>
  );
}
