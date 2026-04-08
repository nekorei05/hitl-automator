import { useState } from "react";
import AgentLogs from "./AgentLogs";
import { approveTask, rejectTask } from "../services/api";
import axios from "axios";

// ─── Status badge ─────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  CREATED:          { label: "Created",          classes: "bg-zinc-800/80 text-zinc-400 border-zinc-700/60" },
  PENDING_APPROVAL: { label: "Pending",          classes: "bg-zinc-800/80 text-zinc-400 border-zinc-700/60" },
  READY_FOR_REVIEW: { label: "Ready for Review", classes: "bg-yellow-950/60 text-yellow-500 border-yellow-900/60" },
  APPROVED:         { label: "Approved",         classes: "bg-blue-950/60 text-blue-400 border-blue-900/60" },
  COMPLETED:        { label: "Completed",        classes: "bg-emerald-950/60 text-emerald-400 border-emerald-900/60" },
  REJECTED:         { label: "Rejected",         classes: "bg-red-950/60 text-red-400 border-red-900/60" },
  REWRITING:        { label: "Rewriting",        classes: "bg-amber-950/60 text-amber-400 border-amber-900/60" },
  STALE:            { label: "Stale",            classes: "bg-zinc-800/80 text-zinc-500 border-zinc-700/60" },
};

function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.CREATED;
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium tracking-wide ${config.classes}`}>
      {config.label}
    </span>
  );
}

// ─── Match badge ──────────────────────────────────────────────────────────────
const MATCH_BADGE = {
  HIGH:   { label: "High Match",    classes: "bg-emerald-950/60 text-emerald-400 border-emerald-900/60" },
  MEDIUM: { label: "Partial Match", classes: "bg-yellow-950/60 text-yellow-500 border-yellow-900/60" },
  LOW:    { label: "Low Match",     classes: "bg-red-950/60 text-red-400 border-red-900/60" },
};

function MatchBadge({ level }) {
  const config = MATCH_BADGE[level?.toUpperCase()];
  if (!config) return null;
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium tracking-wide ${config.classes}`}>
      {config.label}
    </span>
  );
}

// ─── Match panel ──────────────────────────────────────────────────────────────
const MATCH_CONFIG = {
  HIGH: {
    indicator: "bg-emerald-400",
    label:     "Strong Match",
    summary:   "Your skills align well with this role.",
    heading:   "text-emerald-400",
    chip:      "bg-zinc-800 text-emerald-400 border-zinc-700",
    muted:     "text-zinc-400",
    divider:   "border-zinc-800",
  },
  MEDIUM: {
    indicator: "bg-yellow-400",
    label:     "Partial Match",
    summary:   "You meet some requirements, but gaps exist.",
    heading:   "text-yellow-500",
    chip:      "bg-zinc-800 text-yellow-400 border-zinc-700",
    muted:     "text-zinc-400",
    divider:   "border-zinc-800",
  },
  LOW: {
    indicator: "bg-red-400",
    label:     "Low Match",
    summary:   "This role is a weak fit based on your current skills.",
    heading:   "text-red-400",
    chip:      "bg-zinc-800 text-red-400 border-zinc-700",
    muted:     "text-zinc-400",
    divider:   "border-zinc-800",
  },
};

function MatchPanel({ level, reason, suggestions }) {
  const cfg = MATCH_CONFIG[level?.toUpperCase()];
  if (!cfg) return null;

  const suggestionList = Array.isArray(suggestions)
    ? suggestions.filter(Boolean)
    : typeof suggestions === "string" && suggestions.trim()
    ? suggestions.split(/[\,\n]/).map((s) => s.trim()).filter(Boolean)
    : [];

  return (
    <div className="rounded-lg border border-zinc-800 overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 bg-zinc-800/30">
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.indicator}`} />
        <span className={`text-xs font-semibold uppercase tracking-wider ${cfg.heading}`}>
          {cfg.label}
        </span>
        <span className="text-xs text-zinc-500">{cfg.summary}</span>
      </div>

      {reason && (
        <div className={`border-t px-4 py-3 ${cfg.divider}`}>
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1.5 font-medium">
            Analysis
          </p>
          <p className={`text-xs leading-relaxed ${cfg.muted}`}>{reason}</p>
        </div>
      )}

      {(level?.toUpperCase() === "LOW" || level?.toUpperCase() === "MEDIUM") &&
        suggestionList.length > 0 && (
          <div className={`border-t px-4 py-3 ${cfg.divider}`}>
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2.5 font-medium">
              To improve your chances
            </p>
            <div className="flex flex-col gap-2">
              {suggestionList.map((s, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className={`mt-0.5 shrink-0 rounded border px-1.5 py-0.5 font-mono text-[10px] ${cfg.chip}`}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <p className="text-xs text-zinc-300 leading-relaxed">{s}</p>
                </div>
              ))}
            </div>
          </div>
        )}

      {level?.toUpperCase() === "HIGH" && (
        <div className={`border-t px-4 py-2.5 ${cfg.divider}`}>
          <p className="text-xs text-zinc-500">
            Your profile is a strong fit. Review the email and send when ready.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Action button ────────────────────────────────────────────────────────────
function ActionButton({ onClick, disabled, variant, children }) {
  const variants = {
    green: "bg-zinc-800 text-emerald-400 border-zinc-700 hover:bg-zinc-700 hover:border-zinc-600",
    red:   "bg-zinc-800 text-red-400 border-zinc-700 hover:bg-zinc-700 hover:border-zinc-600",
    amber: "bg-zinc-800 text-amber-400 border-zinc-700 hover:bg-zinc-700 hover:border-zinc-600",
    blue:  "bg-zinc-800 text-blue-400 border-zinc-700 hover:bg-zinc-700 hover:border-zinc-600",
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex-1 rounded-lg border px-4 py-2 text-xs font-medium transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-40 ${variants[variant]}`}>
      {children}
    </button>
  );
}

// ─── Divider ──────────────────────────────────────────────────────────────────
function SectionDivider() {
  return <div className="border-t border-zinc-800/60" />;
}

// ─── Section label ────────────────────────────────────────────────────────────
function SectionLabel({ children }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
      {children}
    </p>
  );
}

// ─── Main TaskCard ────────────────────────────────────────────────────────────
export default function TaskCard({ task, onUpdate }) {
  const [loading, setLoading]               = useState(false);
  const [actionError, setActionError]       = useState("");
  const [declineMessage, setDeclineMessage] = useState("");
  const [gmailOpened, setGmailOpened]       = useState(false);
  const [isJobDescriptionOpen, setIsJobDescriptionOpen] = useState(false);

  const hasEmail   = !!(task.subject || task.body);
  const isResolved = ["COMPLETED", "REJECTED", "STALE"].includes(task.status);
  const matchLevel = task.matchLevel?.toUpperCase();

  const jobDescriptionTextStyle = isJobDescriptionOpen
    ? {}
    : {
        display: "-webkit-box",
        WebkitLineClamp: 2,
        WebkitBoxOrient: "vertical",
        overflow: "hidden",
      };

  // ── Handlers (logic unchanged) ────────────────────────────────────────────
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

const handleReject = async () => {
  const userReason = window.prompt("Enter rejection reason:");
  
  if (userReason === null) return; 

  setLoading(true);
  setActionError("");
  
  try {
    const res = await rejectTask(task._id, userReason || "No reason provided");
    onUpdate(res.data);
  } catch (err) {
    setActionError("Reject failed. Please try again.");
    console.error(err);
  } finally {
    setLoading(false);
  }
};

  const handleOpenGmail = () => {
    const to      = task.recipient || "";
    const subject = task.subject   || "";
    const body    = task.body      || "";
    const url     = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(to)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(url, "_blank");
    setGmailOpened(true);
    setTimeout(() => setGmailOpened(false), 4000);
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="w-full px-6 lg:px-10 rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden transition-colors duration-200 hover:border-zinc-700">

      {/* ── 1. Card header: badges + short ID ── */}
      <div className="flex items-center justify-between px-5 pt-5 pb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <StatusBadge status={task.status} />
          <MatchBadge level={task.matchLevel} />
        </div>
        <span className="text-[10px] font-mono text-zinc-700 tabular-nums">
          {task._id?.slice(-8)}
        </span>
      </div>

      <SectionDivider />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-8 w-full">

        {/* ── Left column: Job description + match analysis ── */}
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3 flex-1">
            <div className="flex items-center justify-between gap-3">
              <SectionLabel>Job Description</SectionLabel>
              <button
                type="button"
                onClick={() => setIsJobDescriptionOpen((prev) => !prev)}
                className="text-[11px] font-semibold leading-none text-zinc-400 hover:text-zinc-200 transition-colors duration-150"
              >
                {isJobDescriptionOpen ? "Collapse" : "Expand"}
              </button>
            </div>
            <div className="text-sm text-zinc-300 leading-relaxed" style={isJobDescriptionOpen ? {maxHeight: '300px', overflowY: 'auto'} : {}}>
              <p style={jobDescriptionTextStyle}>
                {task.jobDescription}
              </p>
            </div>
          </div>

          {matchLevel && (
            <div className="space-y-3">
              <SectionDivider />
              <MatchPanel
                level={task.matchLevel}
                reason={task.matchReason}
                suggestions={task.matchSuggestions}
              />
            </div>
          )}
        </div>

        {/* ── Right column: Email preview + actions ── */}
        <div className="flex flex-col gap-6">
          <div className="rounded-xl border border-zinc-800 overflow-hidden bg-zinc-900 shadow-sm shadow-black/10 flex flex-col flex-1">
            <div className="bg-zinc-800/50 border-b border-zinc-800 px-4 py-3 space-y-2">
              <div className="flex items-center justify-between gap-3">
                <SectionLabel>Draft Email</SectionLabel>
                <span className="text-[11px] text-zinc-500">
                  {hasEmail ? "Preview" : "No draft available"}
                </span>
              </div>
              <div className="space-y-1">
                <p className="text-[11px] text-zinc-500">
                  <span className="text-zinc-600 mr-1.5">To</span>
                  {task.recipient || <span className="italic text-zinc-700">No recipient</span>}
                </p>
                <p className="text-[11px] text-zinc-400 font-medium">
                  <span className="text-zinc-600 mr-1.5 font-normal">Subject</span>
                  {task.subject || <span className="italic text-zinc-700">No subject</span>}
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto bg-white px-5 py-5">
              <p className="whitespace-pre-wrap text-[13px] text-zinc-800 leading-7 font-sans">
                {hasEmail ? task.body : "Generate an email draft to preview the content here."}
              </p>
            </div>
          </div>

          {declineMessage && (
            <div className="rounded-lg border border-zinc-800 bg-zinc-800/30 px-4 py-3">
              <p className="text-xs text-zinc-400 leading-relaxed">{declineMessage}</p>
            </div>
          )}

          <div className="space-y-3">
            {actionError && (
              <p className="text-[11px] text-red-400 text-center">{actionError}</p>
            )}

            {!hasEmail && !isResolved && (
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="w-full rounded-lg bg-zinc-100 hover:bg-white text-zinc-900 py-2.5 text-sm font-semibold transition-all duration-150 disabled:opacity-50"
              >
                {loading ? "Analysing…" : "Generate Match & Draft Email"}
              </button>
            )}

            {hasEmail && task.status !== "COMPLETED" && task.status !== "REJECTED" && (
              <div className="space-y-4">
                <button
                  onClick={handleOpenGmail}
                  disabled={!task.subject || !task.body}
                  className="w-full rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white py-2.5 text-sm font-semibold transition-all duration-150 shadow-md shadow-blue-950/40"
                >
                  Send Email via Gmail
                </button>
                <div className="flex gap-2">
                  <ActionButton onClick={handleApprove} disabled={loading} variant="green">
                    Mark as Completed
                  </ActionButton>
                  <ActionButton onClick={handleReject} disabled={loading} variant="red">
                    Reject
                  </ActionButton>
                  <ActionButton onClick={handleGenerate} disabled={loading} variant="amber">
                    Regenerate
                  </ActionButton>
                </div>
                <p className="text-center text-[10px] text-zinc-600">
                  Opens Gmail with your email pre-filled. Review and send.
                </p>
                {gmailOpened && (
                  <p className="text-center text-[11px] text-blue-400 transition-opacity duration-300">
                    Gmail opened — review and send your email
                  </p>
                )}
              </div>
            )}

            {isResolved && (
              <p className="text-center text-xs text-zinc-600">
                {task.status === "COMPLETED" && "Marked as completed"}
                {task.status === "REJECTED"  && "Task rejected"}
                {task.status === "STALE"     && "Task is stale"}
                {task.completedAt && (
                  <span className="ml-1.5 text-zinc-700">
                    · {new Date(task.completedAt).toLocaleString()}
                  </span>
                )}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── 7. Agent logs ── */}
      <div className="px-5 pb-5">
        <AgentLogs logs={task.logs} />
      </div>
    </div>
  );
}
