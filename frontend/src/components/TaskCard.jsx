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

const MATCH_BADGE = {
  HIGH:   { label: "High Match",   classes: "bg-emerald-950 text-emerald-400 border-emerald-800" },
  MEDIUM: { label: "Partial Match", classes: "bg-yellow-950 text-yellow-400 border-yellow-800" },
  LOW:    { label: "Low Match",    classes: "bg-red-950 text-red-400 border-red-900" },
};

function MatchBadge({ level }) {
  const config = MATCH_BADGE[level?.toUpperCase()];
  if (!config) return null;
  return (
    <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${config.classes}`}>
      {config.label}
    </span>
  );
}

const MATCH_PANEL = {
  HIGH: {
    icon: "✓",
    heading: "Strong match",
    summary: "Your skills align well with this role.",
    classes: {
      wrap:    "bg-emerald-900/10 border-emerald-500/20",
      icon:    "text-emerald-400",
      heading: "text-emerald-400",
      reason:  "text-emerald-200/70",
    },
  },
  MEDIUM: {
    icon: "⚡",
    heading: "Partial match",
    summary: "You meet some requirements, but there are gaps.",
    classes: {
      wrap:    "bg-yellow-900/10 border-yellow-500/20",
      icon:    "text-yellow-400",
      heading: "text-yellow-400",
      reason:  "text-yellow-200/70",
    },
  },
  LOW: {
    icon: "⚠",
    heading: "Low match",
    summary: "Your profile does not fully align with the required skills.",
    classes: {
      wrap:    "bg-red-900/10 border-red-500/20",
      icon:    "text-red-400",
      heading: "text-red-400",
      reason:  "text-red-200/70",
    },
  },
};

function MatchPanel({ level, reason }) {
  const config = MATCH_PANEL[level?.toUpperCase()];
  if (!config) return null;

  return (
    <div className={`rounded-lg border px-4 py-3 ${config.classes.wrap}`}>
      <div className="flex items-center gap-2 mb-1">
        <span className={`text-xs ${config.classes.icon}`}>{config.icon}</span>
        <span className={`text-xs font-semibold uppercase tracking-wider ${config.classes.heading}`}>
          {config.heading}
        </span>
        <span className="text-xs text-zinc-500">— {config.summary}</span>
      </div>
      {reason && (
        <p className={`text-xs leading-relaxed mt-1 pl-4 ${config.classes.reason}`}>
          {reason}
        </p>
      )}
    </div>
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

// main
export default function TaskCard({ task, onUpdate }) {
  const [loading, setLoading]               = useState(false);
  const [actionError, setActionError]       = useState("");
  const [declineMessage, setDeclineMessage] = useState("");

  const hasEmail   = !!(task.subject || task.body);
  const isResolved = ["COMPLETED", "REJECTED", "STALE"].includes(task.status);
  const matchLevel = task.matchLevel?.toUpperCase(); // HIGH | MEDIUM | LOW | undefined

  // generate
  const handleGenerate = async () => {
    setLoading(true);
    setActionError("");
    setDeclineMessage("");
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/prompt`,
        { jobDescription: task.jobDescription }
      );

      const generatedTask = res.data?.task || (res.data?._id ? res.data : null);
      const aiText        = res.data?.text || res.data?.message || res.data?.reason || "";

      if (generatedTask) {
        onUpdate(generatedTask);
      } else {
        setDeclineMessage(
          aiText.trim() ||
          "The AI could not generate an email. Check the backend console for details."
        );
      }
    } catch {
      setActionError("AI generation failed. Check the backend console.");
    } finally {
      setLoading(false);
    }
  };

  // approve
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

      {/* ── 1. Job description + badges ── */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-4">
          <p className="flex-1 min-w-0 text-sm font-medium leading-snug text-zinc-100">
            {task.jobDescription || task.input}
          </p>
          {/* Status + match badges stacked on the right */}
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <StatusBadge status={task.status} />
            <MatchBadge level={matchLevel} />
          </div>
        </div>
        <p className="mt-1.5 font-mono text-xs text-zinc-600">{task._id}</p>
      </div>

      {/* ── 2. Match insight panel ── */}
      {matchLevel && (
        <div className="px-4 pb-3">
          <MatchPanel level={matchLevel} reason={task.matchReason} />
        </div>
      )}

      {/* ── 3. States: loading / decline / generate / email ── */}
      <div className="px-4 pb-4 space-y-3">

        {/* Loading */}
        {loading && (
          <div className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-800/30 px-4 py-3">
            <div className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-zinc-600 border-t-blue-400" />
            <p className="text-xs text-zinc-400">AI is analysing the job description…</p>
          </div>
        )}

        {/* AI declined */}
        {!loading && declineMessage && !hasEmail && (
          <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 overflow-hidden">
            <div className="flex items-center gap-2 border-b border-zinc-700 bg-zinc-800 px-4 py-2.5">
              <span className="text-amber-400 text-sm">⚠</span>
              <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                Not a match — no email generated
              </p>
            </div>
            <div className="px-4 py-3">
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">
                Why the AI declined
              </p>
              <p className="text-sm text-zinc-200 leading-relaxed">{declineMessage}</p>
            </div>
            <div className="border-t border-zinc-700 bg-zinc-900/60 px-4 py-3">
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">
                Next steps
              </p>
              <ul className="space-y-1.5">
                {[
                  "Add the missing skills to your profile and hit Try Again",
                  "The AI will re-read your updated profile before deciding",
                  "If the gap is too large, move on — this role isn't the right fit",
                ].map((step, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-zinc-400">
                    <span className="mt-0.5 shrink-0 text-zinc-600">→</span>
                    {step}
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex justify-end">
                <ActionButton variant="amber" onClick={handleGenerate} disabled={loading}>
                  ↺ Try Again
                </ActionButton>
              </div>
            </div>
          </div>
        )}

        {/* No email yet — initial state */}
        {!loading && !declineMessage && !hasEmail && !isResolved && (
          <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-800/40 px-4 py-3">
            <p className="text-xs text-zinc-500">No email generated yet</p>
            <ActionButton variant="blue" onClick={handleGenerate} disabled={loading}>
              ✦ Generate Email
            </ActionButton>
          </div>
        )}

        {/* Email preview */}
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

        {/* Action buttons */}
        {hasEmail && !isResolved && (
          <div className="flex flex-wrap items-center gap-2">
            <ActionButton variant="green" onClick={handleApprove} disabled={loading}>✓ Approve</ActionButton>
            <ActionButton variant="red"   onClick={handleReject}  disabled={loading}>✕ Reject</ActionButton>
            <ActionButton variant="amber" onClick={handleGenerate} disabled={loading}>↺ Regenerate</ActionButton>
          </div>
        )}

        {/* Resolved */}
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

        {/* Hard error */}
        {actionError && <p className="text-xs text-red-400">{actionError}</p>}

        {/* Agent logs */}
        <AgentLogs logs={task.logs} />
      </div>
    </div>
  );
}