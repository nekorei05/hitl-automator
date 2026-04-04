import { useState } from "react";
import AgentLogs from "./AgentLogs";
import { approveTask, rejectTask } from "../services/api";
import axios from "axios";

// status badge
const STATUS_CONFIG = {
  CREATED:          { label: "Created",          classes: "bg-zinc-800 text-zinc-400 border-zinc-700" },
  PENDING_APPROVAL: { label: "Pending",          classes: "bg-zinc-800 text-zinc-400 border-zinc-700" },
  READY_FOR_REVIEW: { label: "Ready for Review", classes: "bg-yellow-950 text-yellow-400 border-yellow-800" },
  APPROVED:         { label: "Approved",         classes: "bg-blue-950 text-blue-400 border-blue-800" },
  COMPLETED:        { label: "Completed",        classes: "bg-emerald-950 text-emerald-400 border-emerald-800" },
  REJECTED:         { label: "Rejected",         classes: "bg-red-950 text-red-400 border-red-900" },
  REWRITING:        { label: "Rewriting",        classes: "bg-amber-950 text-amber-400 border-amber-800" },
  STALE:            { label: "Stale",            classes: "bg-zinc-800 text-zinc-500 border-zinc-700" },
};

function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.CREATED;
  return (
    <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${config.classes}`}>
      {config.label}
    </span>
  );
}

function ActionButton({ onClick, disabled, variant, children }) {
  const variants = {
    green: "bg-emerald-900/60 text-emerald-400 border-emerald-800 hover:bg-emerald-800/60",
    red:   "bg-red-900/60 text-red-400 border-red-900 hover:bg-red-800/60",
    amber: "bg-amber-900/60 text-amber-400 border-amber-800 hover:bg-amber-800/60",
    blue:  "bg-blue-900/60 text-blue-400 border-blue-800 hover:bg-blue-800/60",
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg border px-4 py-1.5 text-xs font-medium transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-40 ${variants[variant]}`}
    >
      {children}
    </button>
  );
}


export default function TaskCard({ task, onUpdate }) {
  const [loading, setLoading]           = useState(false);
  const [actionError, setActionError]   = useState("");

  
  const [declineMessage, setDeclineMessage] = useState("");

  const hasEmail   = !!(task.subject || task.body);
  const isResolved = ["COMPLETED", "REJECTED", "STALE"].includes(task.status);

  const handleGenerate = async () => {
    setLoading(true);
    setActionError("");
    setDeclineMessage(""); // clear any previous decline message on retry

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/prompt`,
        { jobDescription: task.jobDescription }
      );

      const generatedTask = res.data?.task || (res.data?._id ? res.data : null);
      const aiText = res.data?.text || res.data?.message || res.data?.reason || "";


      //debug 
      console.log("[Generate] full response:", res.data); 

      if (generatedTask) {
        onUpdate(generatedTask);
      } else {
        setDeclineMessage(
          aiText.trim() ||
          "The AI could not generate an email. Check the backend console for details."
        );
      }
    } catch (err) {
      setActionError("AI generation failed. Check the backend console.");
    } finally {
      setLoading(false);
    }
  };

//approve
    const handleApprove = async () => {
    setLoading(true);
    setActionError("");
    try {
      const res = await approveTask(task._id);
      onUpdate(res.data);
    } catch {
      setActionError("Approve failed.");
    } finally {
      setLoading(false);
    }
  };

//reject
  const handleReject = async () => {
    setLoading(true);
    setActionError("");
    try {
      const res = await rejectTask(task._id);
      onUpdate(res.data);
    } catch {
      setActionError("Reject failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="group rounded-xl border border-zinc-800 bg-zinc-900 transition-all duration-200 hover:border-zinc-700">

      <div className="flex items-start justify-between gap-4 p-4">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium leading-snug text-zinc-100">
            {task.jobDescription || task.input}
          </p>
          <p className="mt-1 font-mono text-xs text-zinc-600">{task._id}</p>
        </div>
        <StatusBadge status={task.status} />
      </div>

      <div className="px-4 pb-4 space-y-3">

        {loading && (
          <div className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-800/30 px-4 py-3">
            <div className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-zinc-600 border-t-blue-400" />
            <p className="text-xs text-zinc-400">AI is analysing the job description…</p>
          </div>
        )}

        {!loading && declineMessage && !hasEmail && (
          <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 overflow-hidden">

            {/* Header strip */}
            <div className="flex items-center gap-2 border-b border-zinc-700 bg-zinc-800 px-4 py-2.5">
              <span className="text-amber-400 text-sm">⚠</span>
              <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                Not a match — no email generated
              </p>
            </div>

            {/* AI's actual explanation from Gemini */}
            <div className="px-4 py-3">
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">
                Why the AI declined
              </p>
              <p className="text-sm text-zinc-200 leading-relaxed">
                {declineMessage}
              </p>
            </div>

            <div className="border-t border-zinc-700 bg-zinc-900/60 px-4 py-3">
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">
                Next steps
              </p>
              <ul className="space-y-1.5">
                <li className="flex items-start gap-2 text-xs text-zinc-400">
                  <span className="mt-0.5 shrink-0 text-zinc-600">→</span>
                  Add the missing skills to your profile and hit Try Again
                </li>
                <li className="flex items-start gap-2 text-xs text-zinc-400">
                  <span className="mt-0.5 shrink-0 text-zinc-600">→</span>
                  The AI will re-read your updated profile before deciding
                </li>
                <li className="flex items-start gap-2 text-xs text-zinc-400">
                  <span className="mt-0.5 shrink-0 text-zinc-600">→</span>
                  If the gap is too large, move on — this role isn’t the right fit
                </li>
              </ul>
              <div className="mt-3 flex justify-end">
                <ActionButton variant="amber" onClick={handleGenerate} disabled={loading}>
                  ↺ Try Again
                </ActionButton>
              </div>
            </div>

          </div>
        )}

        {!loading && !declineMessage && !hasEmail && !isResolved && (
          <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-800/40 px-4 py-3">
            <p className="text-xs text-zinc-500">No email generated yet</p>
            <ActionButton variant="blue" onClick={handleGenerate} disabled={loading}>
              ✦ Generate Email
            </ActionButton>
          </div>
        )}

        {hasEmail && (
          <div className="rounded-lg border border-zinc-800 bg-zinc-950/60">
            <div className="flex items-center gap-2 border-b border-zinc-800 px-4 py-2.5">
              <span className="shrink-0 text-xs uppercase tracking-wider text-zinc-500">Subject</span>
              <span className="truncate text-sm font-semibold text-zinc-100">{task.subject}</span>
            </div>
            <div className="px-4 py-3">
              <p className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-zinc-300">
                {task.body}
              </p>
            </div>
          </div>
        )}

        {/* Action buttons — only when email exists and task isn't resolved */}
        {hasEmail && !isResolved && (
          <div className="flex flex-wrap items-center gap-2">
            <ActionButton variant="green" onClick={handleApprove} disabled={loading}>✓ Approve</ActionButton>
            <ActionButton variant="red"   onClick={handleReject}  disabled={loading}>✕ Reject</ActionButton>
            <ActionButton variant="amber" onClick={handleGenerate} disabled={loading}>↺ Regenerate</ActionButton>
          </div>
        )}

        {isResolved && (
          <div className="flex items-center gap-1.5 text-xs text-zinc-600">
            <span>
              {task.status === "COMPLETED" && "✓ Task completed"}
              {task.status === "REJECTED"  && "✕ Task rejected"}
              {task.status === "STALE"     && "Task marked stale"}
            </span>
            {task.completedAt && (
              <span>· {new Date(task.completedAt).toLocaleString()}</span>
            )}
          </div>
        )}

        {/* Hard error (network/server failure) */}
        {actionError && (
          <p className="text-xs text-red-400">{actionError}</p>
        )}

        {/* Agent logs */}
        <AgentLogs logs={task.logs} />
      </div>
    </div>
  );
}