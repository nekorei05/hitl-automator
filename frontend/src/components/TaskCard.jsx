import { useEffect, useState } from "react";
import AgentLogs from "./AgentLogs";
import { approveTask, rejectTask } from "../services/api";
import axios from "axios";

// ─── Status badge config ──────────────────────────────────────────────────────
const STATUS_CONFIG = {
  CREATED:          { label: "Created" },
  PENDING_APPROVAL: { label: "Pending" },
  READY_FOR_REVIEW: { label: "Ready for Review" },
  APPROVED:         { label: "Approved" },
  COMPLETED:        { label: "Completed" },
  REJECTED:         { label: "Rejected" },
  REWRITING:        { label: "Rewriting" },
  STALE:            { label: "Stale" },
};

function StatusBadge({ status }) {
  const label = STATUS_CONFIG[status]?.label ?? status;
  return (
    <span className="text-[11px] font-semibold px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/50 text-slate-400">
      {label}
    </span>
  );
}

// ─── Match badge ──────────────────────────────────────────────────────────────
const MATCH_BADGE_STYLE = {
  HIGH:   "text-emerald-400 bg-emerald-950/50 border-emerald-800/50",
  MEDIUM: "text-amber-400 bg-amber-950/50 border-amber-800/50",
  LOW:    "text-red-400 bg-red-950/50 border-red-800/50",
};

function MatchBadge({ level }) {
  if (!level) return null;
  const style = MATCH_BADGE_STYLE[level.toUpperCase()] ?? "text-slate-400 bg-slate-800 border-slate-700";
  return (
    <span className={`text-[11px] font-semibold px-3 py-1 rounded-full border ${style}`}>
      {level} Match
    </span>
  );
}

// ─── Match panel ──────────────────────────────────────────────────────────────
const MATCH_CFG = {
  HIGH:   { dot: "bg-emerald-400", labelColor: "text-emerald-400", summary: "Skills align well with this role.", numStyle: "text-emerald-700 border-slate-800" },
  MEDIUM: { dot: "bg-amber-400",   labelColor: "text-amber-400",   summary: "You meet some requirements, but gaps exist.", numStyle: "text-amber-700 border-slate-800" },
  LOW:    { dot: "bg-red-400",     labelColor: "text-red-400",     summary: "Weak fit based on your current skills.", numStyle: "text-red-700 border-slate-800" },
};
const MATCH_LABEL = { HIGH: "Strong Match", MEDIUM: "Partial Match", LOW: "Low Match" };

function MatchPanel({ level, reason, suggestions }) {
  const cfg = MATCH_CFG[level?.toUpperCase()];
  if (!cfg) return null;

  const suggestionList = Array.isArray(suggestions)
    ? suggestions.filter(Boolean)
    : typeof suggestions === "string" && suggestions.trim()
    ? suggestions.split(/[,\n]/).map((s) => s.trim()).filter(Boolean)
    : [];

  const isLow = level?.toUpperCase() === "LOW" || level?.toUpperCase() === "MEDIUM";

  return (
    <div className="mt-4 rounded-xl border border-white/[0.06] bg-[#0d0d14] overflow-hidden">

      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-white/[0.04]">
        <span className={`w-2 h-2 rounded-full shrink-0 ${cfg.dot}`} />
        <span className={`text-[11px] font-bold uppercase tracking-wider ${cfg.labelColor}`}>
          {MATCH_LABEL[level?.toUpperCase()]}
        </span>
        <span className="text-[11px] text-slate-600">— {cfg.summary}</span>
      </div>

      {/* Reason */}
      {reason && (
        <div className="px-4 py-3 border-b border-white/[0.04]">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-700 mb-1.5">Analysis</p>
          <p className="text-[13px] text-slate-500 leading-relaxed">{reason}</p>
        </div>
      )}

      {/* Suggestions */}
      {isLow && suggestionList.length > 0 && (
        <div className="px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-700 mb-3">To improve your chances</p>
          <div className="flex flex-col gap-2.5">
            {suggestionList.map((s, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className={`shrink-0 font-mono text-[10px] px-1.5 py-0.5 rounded border border-slate-800 bg-[#0a0a0f] ${cfg.numStyle} mt-0.5`}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <p className="text-[13px] text-slate-500 leading-relaxed">{s}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* HIGH affirmation */}
      {level?.toUpperCase() === "HIGH" && (
        <div className="px-4 py-2.5">
          <p className="text-[12px] text-slate-600">Your profile is a strong fit. Review the email and send when ready.</p>
        </div>
      )}
    </div>
  );
}

// ─── Main TaskCard ────────────────────────────────────────────────────────────
export default function TaskCard({ task, onUpdate }) {
  const [loading, setLoading] = useState(false);
  const [draftBody, setDraftBody] = useState(task.body || "");

  const hasEmail = !!(task.subject || task.body);

  useEffect(() => {
    setDraftBody(task.body || "");
  }, [task.body]);

  // ── Handlers (logic unchanged) ─────────────────────────────────────────────
  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/prompt`,
        { jobDescription: task.jobDescription }
      );
      onUpdate(res.data.task);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    const res = await approveTask(task._id);
    onUpdate(res.data);
  };

  const handleReject = async () => {
    const reason = prompt("Enter rejection reason:");
    if (!reason) return;
    const res = await rejectTask(task._id, reason);
    onUpdate(res.data);
  };

  const handleOpenGmail = () => {
    const url = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(task.recipient || "")}&su=${encodeURIComponent(task.subject || "")}&body=${encodeURIComponent(task.body || "")}`;
    window.open(url, "_blank");
  };

  return (
    <div className="w-full rounded-2xl border border-white/[0.07] bg-[#13131a] hover:border-violet-500/25 transition-all duration-200 hover:-translate-y-0.5 overflow-hidden shadow-xl shadow-black/30">

      {/* ── Card header ── */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.05]">
        <div className="flex items-center gap-2 flex-wrap">
          <StatusBadge status={task.status} />
          <MatchBadge level={task.matchLevel} />
        </div>
        <span className="font-mono text-[10px] text-slate-800 tabular-nums">
          {task._id?.slice(-8)}
        </span>
      </div>

      {/* ── Two-column body ── */}
      <div className="grid lg:grid-cols-[1fr_1.6fr]">

        {/* Left: job description + match analysis */}
        <div className="px-5 py-5 border-b lg:border-b-0 lg:border-r border-white/[0.05] flex flex-col">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-700 mb-3">
            Job Description
          </p>
          <p className="text-[14px] text-slate-400 leading-relaxed">
            {task.jobDescription}
          </p>

          {/* Match panel */}
          <MatchPanel
            level={task.matchLevel}
            reason={task.matchReason}
            suggestions={task.matchSuggestions}
          />
        </div>

        {/* Right: email preview + actions */}
        <div className="flex flex-col">

          {/* Email preview area */}
          <div className="flex-1 px-5 pt-5 pb-0">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-700 mb-3">
              Draft Email
            </p>

            {hasEmail ? (
              <div className="rounded-xl border border-white/[0.06] overflow-hidden">
                {/* Email metadata */}
                <div className="bg-[#0d0d14] border-b border-white/[0.04] px-4 py-3 space-y-1.5">
                  <p className="text-[12px] text-slate-600">
                    <span className="text-slate-700 mr-2">To</span>
                    {task.recipient || <span className="italic text-slate-800">No recipient</span>}
                  </p>
                  <p className="text-[12px] text-slate-500 font-medium">
                    <span className="text-slate-700 font-normal mr-2">Subject</span>
                    {task.subject}
                  </p>
                </div>
                {/* Email body — white to simulate real email */}
                <div className="bg-white px-5 py-5">
                  <p className="text-[14px] text-slate-800 leading-[1.8] whitespace-pre-wrap font-sans">
                    {draftBody}
                  </p>
                </div>
              </div>
            ) : (
              /* No email state */
              <div className="flex items-center justify-between rounded-xl border border-white/[0.05] bg-[#0d0d14] px-5 py-4">
                <p className="text-[13px] text-slate-700 italic">No draft generated yet</p>
                <button
                  onClick={handleGenerate}
                  disabled={loading}
                  className="bg-violet-950/60 hover:bg-violet-900/60 border border-violet-700/40 hover:border-violet-600/50 text-violet-400 text-[12px] font-semibold rounded-lg px-4 py-2 transition-all duration-150 disabled:opacity-40"
                >
                  {loading ? "Generating…" : "Generate Draft"}
                </button>
              </div>
            )}
          </div>

          {/* Actions */}
          {hasEmail && (
            <div className="px-5 py-5 mt-4 border-t border-white/[0.05] space-y-3">
              {/* Primary Gmail button */}
              <button
                onClick={handleOpenGmail}
                className="w-full bg-gradient-to-br from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-[14px] font-semibold rounded-xl py-3 transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98] shadow-lg shadow-violet-900/30"
              >
                Send Email via Gmail
              </button>
              <p className="text-center text-[11px] text-slate-700">
                Opens Gmail pre-filled. Review before sending.
              </p>

              {/* Secondary actions */}
              <div className="flex gap-2">
                <button
                  onClick={handleApprove}
                  disabled={loading}
                  className="flex-1 text-[12px] font-semibold py-2.5 rounded-lg bg-[#0d0d14] border border-white/[0.07] text-emerald-500 hover:bg-emerald-950/30 hover:border-emerald-900/50 transition-all duration-150 disabled:opacity-40"
                >
                  Mark as Completed
                </button>
                <button
                  onClick={handleReject}
                  disabled={loading}
                  className="flex-1 text-[12px] font-semibold py-2.5 rounded-lg bg-[#0d0d14] border border-white/[0.07] text-red-500 hover:bg-red-950/30 hover:border-red-900/50 transition-all duration-150 disabled:opacity-40"
                >
                  Reject
                </button>
                <button
                  onClick={handleGenerate}
                  disabled={loading}
                  className="flex-1 text-[12px] font-semibold py-2.5 rounded-lg bg-[#0d0d14] border border-white/[0.07] text-amber-500 hover:bg-amber-950/30 hover:border-amber-900/50 transition-all duration-150 disabled:opacity-40"
                >
                  Regenerate
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Agent logs */}
      <div className="px-5 pb-5 border-t border-white/[0.04] pt-4">
        <AgentLogs logs={task.logs} />
      </div>
    </div>
  );
}