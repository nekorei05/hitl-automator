import { useState } from "react";
import AgentLogs from "./AgentLogs";

const STATUS_STYLES = {
  pending:   "bg-zinc-700 text-zinc-300",
  running:   "bg-blue-900 text-blue-300",
  completed: "bg-emerald-900 text-emerald-300",
  rejected:  "bg-red-900 text-red-300",
  failed:    "bg-red-900 text-red-400",
};

export default function TaskCard({ task, onApprovalNeeded }) {
  const [showLogs, setShowLogs] = useState(false);

  const statusStyle = STATUS_STYLES[task.status] || "bg-zinc-700 text-zinc-400";
  const hasLogs = task.logs && task.logs.length > 0;

  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-4">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <p className="text-zinc-100 text-sm flex-1 leading-snug">{task.jobDescription}</p>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${statusStyle}`}>
          {task.status}
        </span>
      </div>

      {/* Output */}
      {task.output && (
        <div className="mt-2 text-zinc-400 text-xs bg-zinc-800 rounded px-3 py-2 border border-zinc-700">
          {task.output}
        </div>
      )}

      {/* HITL banner */}
      {task.requiresApproval && task.status !== "completed" && task.status !== "rejected" && (
        <div className="mt-3 flex items-center justify-between bg-yellow-950/50 border border-yellow-600/30 rounded px-3 py-2">
          <span className="text-xs text-yellow-300 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse inline-block" />
            Waiting for your approval
          </span>
          <button
            onClick={() => onApprovalNeeded(task)}
            className="text-xs bg-yellow-500 hover:bg-yellow-400 text-black font-semibold px-3 py-1 rounded transition-colors"
          >
            Review
          </button>
        </div>
      )}

      {/* Logs toggle */}
      {hasLogs && (
        <div className="mt-3">
          <button
            onClick={() => setShowLogs((v) => !v)}
            className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            {showLogs ? "▾ Hide logs" : "▸ Show logs"} ({task.logs.length})
          </button>
          {showLogs && <AgentLogs logs={task.logs} />}
        </div>
      )}

      {/* Task ID */}
      <p className="mt-3 text-zinc-600 text-xs font-mono">{task._id}</p>
    </div>
  );
}
