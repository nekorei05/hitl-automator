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

// match badge
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

const MATCH_CONFIG = {
  HIGH: {
    icon: "✓",
    label: "Strong Match",
    summary: "Your skills align well with this role.",
    chip: "bg-emerald-900/20 text-emerald-400 border-emerald-800/40",
    wrap: "bg-transparent border-zinc-800/80",
    heading: "text-emerald-400",
    muted: "text-zinc-400",
    divider: "border-zinc-800/60",
  },
  MEDIUM: {
    icon: "⚡",
    label: "Partial Match",
    summary: "You meet some requirements, but gaps exist.",
    chip: "bg-yellow-900/20 text-yellow-400 border-yellow-800/40",
    wrap: "bg-transparent border-zinc-800/80",
    heading: "text-yellow-400",
    muted: "text-zinc-400",
    divider: "border-zinc-800/60",
  },
  LOW: {
    icon: "⚠",
    label: "Low Match",
    summary: "This role is a weak fit based on your current skills.",
    chip: "bg-red-900/20 text-red-400 border-red-800/40",
    wrap: "bg-transparent border-zinc-800/80",
    heading: "text-red-400",
    muted: "text-zinc-400",
    divider: "border-zinc-800/60",
  },
};

function MatchPanel({ level, reason, suggestions }) {
  const cfg = MATCH_CONFIG[level?.toUpperCase()];
  if (!cfg) return null;

  const suggestionList = Array.isArray(suggestions)
    ? suggestions.filter(Boolean)
    : typeof suggestions === "string" && suggestions.trim()
    ? suggestions.split(/[,\n]/).map(s => s.trim()).filter(Boolean)
    : [];

  return (
    <div className={`rounded-lg border overflow-hidden ${cfg.wrap}`}>

      <div className="flex items-center gap-2.5 px-4 py-3">
        <span className={`text-sm ${cfg.heading}`}>{cfg.icon}</span>
        <span className={`text-xs font-semibold uppercase tracking-wider ${cfg.heading}`}>
          {cfg.label}
        </span>
        <span className="text-xs text-zinc-500">— {cfg.summary}</span>
      </div>

      {reason && (
        <div className={`border-t px-4 py-2.5 ${cfg.divider}`}>
          <p className={`text-xs leading-relaxed ${cfg.muted}`}>{reason}</p>
        </div>
      )}

      {(level?.toUpperCase() === "LOW" || level?.toUpperCase() === "MEDIUM") &&
        suggestionList.length > 0 && (
        <div className={`border-t px-4 py-3 ${cfg.divider}`}>

          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2.5">
            To improve your chances
          </p>

          <div className="flex flex-col gap-2">
            {suggestionList.map((s, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <span className={`mt-0.5 shrink-0 rounded border px-1.5 py-0.5 font-mono text-xs ${cfg.chip}`}>
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
            Your profile is a strong fit. Review the email and approve when ready.
          </p>
        </div>
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
      className={`rounded-lg border px-4 py-1.5 text-xs font-medium transition-all duration-150 flex-1 sm:flex-none disabled:cursor-not-allowed disabled:opacity-40 ${variants[variant]}`}
    >
      {children}
    </button>
  );
}


export default function TaskCard({ task, onUpdate }) {
  const [loading, setLoading]               = useState(false);
  const [actionError, setActionError]       = useState("");
  const [declineMessage, setDeclineMessage] = useState("");
  const [gmailOpened, setGmailOpened]       = useState(false);

  const hasEmail   = !!(task.subject || task.body);
  const isResolved = ["COMPLETED", "REJECTED", "STALE"].includes(task.status);
  const matchLevel = task.matchLevel?.toUpperCase(); 

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
    const handleOpenGmail = () => {
    const to = task.recipient || "";
    const subject = task.subject || "";
    const body = task.body || "";

    // Use BACKTICKS ` (not single quotes) and include the $ before each {
    const url = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(to)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    window.open(url, "_blank");
    setGmailOpened(true);
    setTimeout(() => setGmailOpened(false), 4000);
  };



  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl transition-all duration-300 hover:border-zinc-700">
      <div className="p-6 space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <StatusBadge status={task.status} />
            <MatchBadge level={task.matchLevel} />
          </div>
          <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">
            ID: {task._id.slice(-6)}
          </span>
        </div>

        {/* Job Description Section */}
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Job Description</h3>
          <p className="text-sm text-zinc-300 leading-relaxed line-clamp-3 italic">
            "{task.jobDescription}"
          </p>
        </div>

        {/* Match Panel (AI Analysis) */}
        {task.matchLevel && (
           <MatchPanel 
             level={task.matchLevel} 
             reason={task.matchReason} 
             suggestions={task.matchSuggestions} 
           />
        )}

        {/* Decline Message if AI says no */}
        {declineMessage && (
          <div className="bg-red-950/20 border border-red-900/50 rounded-lg p-4">
             <p className="text-xs text-red-400 leading-relaxed">{declineMessage}</p>
          </div>
        )}

        {/* Email Preview Section */}
        {hasEmail && (
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Draft Email</h3>
            <div className="bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden">
              <div className="px-4 py-2 border-b border-zinc-800 bg-zinc-900/50 flex flex-col gap-1">
                <p className="text-[11px] text-zinc-500"><span className="text-zinc-600">To:</span> {task.recipient}</p>
                <p className="text-[11px] text-zinc-500 font-medium"><span className="text-zinc-600">Subject:</span> {task.subject}</p>
              </div>
              <div className="bg-white text-black px-4 py-6">
                <p className="whitespace-pre-wrap text-sm leading-relaxed font-sans">
                  {task.body}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col gap-3">
          {actionError && <p className="text-[11px] text-red-500 text-center font-medium">{actionError}</p>}
          
          <div className="flex flex-wrap gap-2">
            {!hasEmail && !isResolved && (
              <button 
                onClick={handleGenerate}
                disabled={loading}
                className="w-full bg-zinc-100 hover:bg-white text-black py-2 rounded-md text-sm font-bold transition-all disabled:opacity-50"
              >
                {loading ? "Analyzing..." : "✨ Generate Match & Email"}
              </button>
            )}

            {hasEmail && task.status !== "COMPLETED" && task.status !== "REJECTED" && (
              <>
                <div className="space-y-2 w-full">
                  <button
                    onClick={handleOpenGmail}
                    disabled={!task.subject || !task.body}
                    className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white py-2.5 rounded-md text-sm font-bold shadow-lg shadow-blue-900/20 transition-all"
                  >
                    Open in Gmail & Send
                  </button>
                  <p className="text-[10px] text-zinc-500 text-center">
                    Opens Gmail with your email pre-filled. Review and click send.
                  </p>
                  {gmailOpened && (
                    <p className="text-xs text-blue-400 text-center animate-pulse">
                      Gmail opened — review and send your email
                    </p>
                  )}
                </div>

                <div className="flex gap-2 w-full mt-2">
                   <ActionButton onClick={handleApprove} disabled={loading} variant="green">Mark as Sent</ActionButton>
                   <ActionButton onClick={handleReject} disabled={loading} variant="red">Discard</ActionButton>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Logs */}
        <AgentLogs logs={task.logs} />
      </div>
    </div>
  );
}
