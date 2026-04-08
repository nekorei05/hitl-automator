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
      <div className="bg-[#111827] border border-[#1F2937] rounded-lg w-full max-w-md mx-4 p-6 shadow-lg">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
          <h3 className="text-sm font-semibold uppercase tracking-widest text-yellow-400">
            Approval Required
          </h3>
        </div>

        <p className="text-xs text-gray-400 dark:text-gray-400 mb-1 uppercase tracking-wider">Task</p>
        <p className="text-gray-200 text-sm mb-4">{task.input}</p>

        <p className="text-xs text-gray-400 mb-1 uppercase tracking-wider">Pending Action</p>
        <div className="bg-[#0B0F14] rounded p-3 font-mono text-xs text-gray-300 mb-6 border border-[#1F2937]">
          {task.pendingAction || "Agent is requesting human approval."}
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => handle("approve")}
            disabled={loading}
            className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-semibold py-2 rounded transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/40 focus:border-[#7C3AED]"
          >
            {loading ? "..." : "Approve"}
          </button>
          <button
            onClick={() => handle("reject")}
            disabled={loading}
            className="flex-1 bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white text-sm font-semibold py-2 rounded transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/40 focus:border-[#7C3AED]"
          >
            {loading ? "..." : "Reject"}
          </button>
        </div>
      </div>
    </div>
  );
}
