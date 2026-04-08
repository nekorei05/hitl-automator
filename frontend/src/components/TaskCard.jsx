import { useEffect, useState } from "react";
import AgentLogs from "./AgentLogs";
import { approveTask, rejectTask } from "../services/api";
import axios from "axios";

// ─── Status badge ─────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  CREATED:          { label: "Created",          classes: "bg-white text-gray-900 border-gray-200 dark:bg-[#0B0F14] dark:text-gray-100 dark:border-[#1F2937]" },
  PENDING_APPROVAL: { label: "Pending",          classes: "bg-white text-gray-900 border-gray-200 dark:bg-[#0B0F14] dark:text-gray-100 dark:border-[#1F2937]" },
  READY_FOR_REVIEW: { label: "Ready for Review", classes: "bg-yellow-50 text-yellow-800 border-yellow-200 dark:bg-yellow-950/40 dark:text-yellow-200 dark:border-yellow-900/60" },
  APPROVED:         { label: "Approved",         classes: "bg-indigo-50 text-indigo-800 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-200 dark:border-indigo-900/60" },
  COMPLETED:        { label: "Completed",        classes: "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-900/60" },
  REJECTED:         { label: "Rejected",         classes: "bg-red-50 text-red-800 border-red-200 dark:bg-red-950/40 dark:text-red-200 dark:border-red-900/60" },
  REWRITING:        { label: "Rewriting",        classes: "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-200 dark:border-amber-900/60" },
  STALE:            { label: "Stale",            classes: "bg-gray-100 text-gray-700 border-gray-200 dark:bg-[#0B0F14] dark:text-gray-300 dark:border-[#1F2937]" },
};

function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.CREATED;
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide ${config.classes}`}>
      {config.label}
    </span>
  );
}

// ─── Match badge ──────────────────────────────────────────────────────────────
const MATCH_BADGE = {
  HIGH:   { label: "High Match",    classes: "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-900/60" },
  MEDIUM: { label: "Partial Match", classes: "bg-yellow-50 text-yellow-800 border-yellow-200 dark:bg-yellow-950/40 dark:text-yellow-200 dark:border-yellow-900/60" },
  LOW:    { label: "Low Match",     classes: "bg-red-50 text-red-800 border-red-200 dark:bg-red-950/40 dark:text-red-200 dark:border-red-900/60" },
};

function MatchBadge({ level }) {
  const config = MATCH_BADGE[level?.toUpperCase()];
  if (!config) return null;
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide ${config.classes}`}>
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
    green: "bg-gray-50 text-emerald-700 border-gray-200 hover:bg-white dark:bg-[#0B0F14] dark:text-emerald-300 dark:border-[#1F2937] dark:hover:bg-[#111827]",
    red:   "bg-gray-50 text-red-700 border-gray-200 hover:bg-white dark:bg-[#0B0F14] dark:text-red-300 dark:border-[#1F2937] dark:hover:bg-[#111827]",
    amber: "bg-gray-50 text-amber-700 border-gray-200 hover:bg-white dark:bg-[#0B0F14] dark:text-amber-300 dark:border-[#1F2937] dark:hover:bg-[#111827]",
    blue:  "bg-gray-50 text-indigo-700 border-gray-200 hover:bg-white dark:bg-[#0B0F14] dark:text-indigo-300 dark:border-[#1F2937] dark:hover:bg-[#111827]",
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex-1 rounded-lg border px-4 py-2 text-xs font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/40 focus:border-[#7C3AED] ${variants[variant]}`}>
      {children}
    </button>
  );
}

// ─── Divider ──────────────────────────────────────────────────────────────────
function SectionDivider() {
  return <div className="border-t border-gray-200 dark:border-[#1F2937]" />;
}

// ─── Section label ────────────────────────────────────────────────────────────
function SectionLabel({ children }) {
  return (
    <p className="text-sm font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400">
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
  const [draftBody, setDraftBody] = useState(task.body || "");

  const hasEmail   = !!(task.subject || task.body);
  const isResolved = ["COMPLETED", "REJECTED", "STALE"].includes(task.status);
  const matchLevel = task.matchLevel?.toUpperCase();

  useEffect(() => {
    setDraftBody(task.body || "");
  }, [task.body]);

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
    <div className="w-full rounded-xl border border-gray-200 bg-white overflow-hidden shadow-md transition-all duration-200 hover:shadow-lg dark:border-[#1F2937] dark:bg-[#111827] dark:hover:bg-[#1A2233]">

      {/* ── 1. Card header: badges + short ID ── */}
      <div className="flex items-center justify-between px-6 pt-4 pb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <StatusBadge status={task.status} />
          <MatchBadge level={task.matchLevel} />
        </div>
        <span className="text-[10px] font-mono text-zinc-700 tabular-nums">
          {task._id?.slice(-8)}
        </span>
      </div>

      <SectionDivider />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-6 w-full">

        {/* ── Left column: Job description + match analysis ── */}
        <div className="flex flex-col gap-4 p-5">
          <div className="flex flex-col gap-3 flex-1">
            <div className="flex items-center justify-between gap-3">
              <SectionLabel>Job Description</SectionLabel>
              <button
                type="button"
                onClick={() => setIsJobDescriptionOpen((prev) => !prev)}
                className="text-[11px] font-semibold leading-none text-gray-500 hover:text-gray-900 transition-all duration-200 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/40 focus:border-[#7C3AED]"
              >
                {isJobDescriptionOpen ? "Collapse" : "Expand"}
              </button>
            </div>
            <div className="text-base text-gray-900 leading-relaxed dark:text-gray-100" style={isJobDescriptionOpen ? {maxHeight: '300px', overflowY: 'auto'} : {}}>
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
        <div className="flex flex-col gap-4 p-5">
          <div className="rounded-xl border border-gray-200 overflow-hidden bg-white shadow-md transition-all duration-200 hover:shadow-lg ring-1 ring-black/5 dark:border-[#1F2937] dark:bg-[#111827] dark:ring-white/5 min-h-[600px]">
            <div className="bg-white border-b border-gray-200 px-6 py-5 space-y-3 dark:bg-[#0B0F14]/40 dark:border-[#1F2937]">
              <div className="flex items-center justify-between gap-3">
                <SectionLabel>Draft Email</SectionLabel>
                <span className="text-sm tracking-wide text-gray-600 dark:text-gray-400">
                  {hasEmail ? "Preview" : "No draft available"}
                </span>
              </div>
              <div className="space-y-1">
                <p className="text-sm tracking-wide text-gray-600 dark:text-gray-400">
                  <span className="text-gray-600 mr-1.5 dark:text-gray-500">To</span>
                  {task.recipient || <span className="italic text-gray-400 dark:text-gray-500">No recipient</span>}
                </p>
                <p className="text-sm text-gray-900 font-semibold dark:text-gray-100">
                  <span className="text-gray-600 mr-1.5 font-normal dark:text-gray-500">Subject</span>
                  {task.subject || <span className="italic text-gray-400 dark:text-gray-500">No subject</span>}
                </p>
              </div>
            </div>

            <div className="relative flex-1 overflow-y-auto bg-white px-6 py-5 dark:bg-white">
              <textarea
                value={hasEmail ? draftBody : "Generate an email draft to preview the content here."}
                onChange={(e) => setDraftBody(e.target.value)}
                disabled={!hasEmail}
                className="min-h-[520px] w-full resize-none border-0 bg-transparent p-0 leading-relaxed text-[15px] text-gray-900 outline-none transition-all duration-200 focus:ring-0 disabled:cursor-not-allowed disabled:opacity-70"
              />
              <span className="pointer-events-none absolute bottom-3 right-4 text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                Live Edit Mode
              </span>
            </div>
          </div>

          {declineMessage && (
            <div className="rounded-lg border border-zinc-800 bg-zinc-800/30 px-4 py-3 shadow-md dark:border-[#1F2937] dark:bg-[#111827]">
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
                className="w-full rounded-lg bg-gradient-to-r from-[#7C3AED] to-[#6366F1] text-white py-2.5 text-sm font-semibold shadow-md transition-all duration-200 hover:shadow-lg disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/40 focus:border-[#7C3AED]"
              >
                {loading ? "Analysing…" : "Generate Match & Draft Email"}
              </button>
            )}

            {hasEmail && task.status !== "COMPLETED" && task.status !== "REJECTED" && (
              <div className="space-y-4">
                <button
                  onClick={handleOpenGmail}
                  disabled={!task.subject || !task.body}
                  className="w-full rounded-lg bg-gradient-to-r from-[#7C3AED] to-[#6366F1] disabled:opacity-40 disabled:cursor-not-allowed text-white py-2.5 text-sm font-semibold shadow-md transition-all duration-200 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/40 focus:border-[#7C3AED]"
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
                <p className="text-center text-[10px] text-gray-500 dark:text-gray-500">
                  Opens Gmail with your email pre-filled. Review and send.
                </p>
                {gmailOpened && (
                  <p className="text-center text-[11px] text-indigo-400 transition-all duration-200">
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
      <div className="px-6 pb-6">
        <AgentLogs logs={task.logs} />
      </div>
    </div>
  );
}
