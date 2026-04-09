import { useEffect, useState } from "react";
import AgentLogs from "./AgentLogs";
import { approveTask, rejectTask, generateDraft } from "../services/api";
import { Brain, FileText, Mail, Check, X, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import axios from "axios";

//status badge
const STATUS_CONFIG = {
  CREATED:          { label: "Created", color: "blue" },
  PROCESSING:       { label: "Processing", color: "blue" },
  READY_FOR_REVIEW: { label: "Ready for Review", color: "yellow" },
  APPROVED:         { label: "Approved", color: "green" },
  COMPLETED:        { label: "Completed", color: "green" },
  REJECTED:         { label: "Rejected", color: "red" },
  REWRITING:        { label: "Rewriting", color: "blue" },
  STALE:            { label: "Stale", color: "gray" },
};

function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status];
  const label = config?.label ?? status;
  const color = config?.color ?? "gray";

  const colorClasses = {
    blue: "bg-blue-500/10 border-blue-500/20 text-blue-400",
    yellow: "bg-amber-500/10 border-amber-500/20 text-amber-400",
    green: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
    red: "bg-red-500/10 border-red-500/20 text-red-400",
    gray: "bg-zinc-800/80 border-zinc-700/50 text-zinc-400",
  };

  return (
    <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${colorClasses[color]}`}>
      {label}
    </span>
  );
}

function MatchGauge({ level, score }) {
  if (!level) return null;
  
  const levelClass = {
    HIGH: "text-emerald-400",
    MEDIUM: "text-amber-400",
    LOW: "text-red-400"
  }[level] || "text-zinc-400";

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-zinc-900 border border-zinc-800 rounded-2xl w-32 h-32 shrink-0">
      <span className={`text-3xl font-bold ${levelClass}`}>{score}%</span>
      <span className="text-xs uppercase tracking-widest text-zinc-500 mt-2 font-medium">{level} Match</span>
    </div>
  );
}

function MatchAnalysis({ level, score, reason, missing, strength, insight }) {
  if (!level) return null;

  return (
    <div className="flex flex-col md:flex-row gap-6 mt-6">
      <MatchGauge level={level} score={score} />
      
      <div className="flex-1 space-y-4">
        {insight && (
           <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
             <div className="flex items-center gap-2 mb-2 text-indigo-400 font-medium text-sm">
                <Brain className="w-4 h-4" /> AI Insight
             </div>
             <p className="text-sm text-zinc-300 leading-relaxed">{insight}</p>
           </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {strength && strength.length > 0 && (
            <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-4">
              <span className="text-xs uppercase tracking-wider text-emerald-500 font-semibold mb-2 block">Strengths</span>
              <ul className="space-y-1.5">
                {strength.map((item, i) => (
                  <li key={i} className="text-sm text-zinc-300 flex items-start gap-2">
                    <span className="text-emerald-500 mt-0.5">•</span> <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {missing && missing.length > 0 && (
            <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-4">
              <span className="text-xs uppercase tracking-wider text-amber-500 font-semibold mb-2 block">Missing</span>
              <ul className="space-y-1.5">
                {missing.map((item, i) => (
                  <li key={i} className="text-sm text-zinc-300 flex items-start gap-2">
                    <span className="text-amber-500 mt-0.5">•</span> <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TaskCard({ task, onUpdate }) {
  const [loading, setLoading] = useState(false);
  const [draftBody, setDraftBody] = useState(task.body || "");
  const [showJobDesc, setShowJobDesc] = useState(false);

  const hasEmail = !!(task.subject || task.body);

  useEffect(() => {
    setDraftBody(task.body || "");
  }, [task.body]);

  const handleGenerate = async () => {
    console.log("Generating for ID:", task._id)
    setLoading(true);
    try {
      const res = await generateDraft(task._id);
      onUpdate(res.data);
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
    <div className="w-full flex flex-col gap-8 pb-10">
      
      {/* ── Header ── */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-5">
        <div className="flex items-center gap-4">
          <StatusBadge status={task.status} />
          <span className="text-xs font-mono text-zinc-500">TASK-{task._id?.slice(-6).toUpperCase()}</span>
        </div>
      </div>

      {/* ── Job Description Collapsible ── */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
        <button 
          onClick={() => setShowJobDesc(!showJobDesc)}
          className="w-full flex items-center justify-between p-4 bg-zinc-900 hover:bg-zinc-800/80 transition-colors text-zinc-300 font-medium text-sm"
        >
          <span className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-zinc-500" />
            Original Job Description
          </span>
          {showJobDesc ? <ChevronUp className="w-4 h-4 text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
        </button>
        {showJobDesc && (
          <div className="p-4 border-t border-zinc-800 bg-zinc-950/30">
            <p className="text-sm text-zinc-400 whitespace-pre-wrap leading-relaxed">
              {task.jobDescription}
            </p>
          </div>
        )}
      </div>

      {/* ── Match Details ── */}
      {(task.matchLevel || task.status === "PROCESSING") && (
        <section>
          <h3 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
            Match Analysis
          </h3>
          {task.status === "PROCESSING" && !task.matchLevel ? (
            <div className="mt-4 p-8 border border-dashed border-zinc-800 rounded-xl flex flex-col items-center justify-center text-zinc-500">
               <div className="w-6 h-6 border-2 border-zinc-700 border-t-indigo-500 rounded-full animate-spin mb-3" />
               <p className="text-sm">Analyzing profile against job description...</p>
            </div>
          ) : (
            <MatchAnalysis
              level={task.matchLevel}
              score={task.matchScore}
              reason={task.matchReason}
              missing={task.missingSkills}
              strength={task.strengthSkills}
              insight={task.matchInsight}
            />
          )}
        </section>
      )}

      {/* ── Email Draft Section ── */}
      <section className="mt-2">
        <h3 className="text-lg font-semibold text-zinc-100 mb-4 flex items-center justify-between">
          <span>Generated Draft</span>
          {!hasEmail && !loading && (
            <button
               onClick={handleGenerate}
               disabled={loading}
               className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg px-4 py-2 transition-all flex items-center gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Generate
            </button>
          )}
        </h3>

        {hasEmail ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-lg shadow-black/20">
            {/* Email Headers */}
            <div className="bg-zinc-900/80 border-b border-zinc-800 px-6 py-4 space-y-2">
              <div className="flex items-center text-sm">
                <span className="w-16 text-zinc-500 font-medium">To:</span>
                <span className="text-zinc-300 bg-zinc-800 px-2.5 py-0.5 rounded-md">{task.recipient || "Hiring Team"}</span>
              </div>
              <div className="flex items-center text-sm">
                <span className="w-16 text-zinc-500 font-medium">Subject:</span>
                <span className="text-zinc-200 font-medium">{task.subject}</span>
              </div>
            </div>
            
            {/* Email Body */}
            <div className="p-6 bg-zinc-950">
              <textarea
                value={draftBody}
                onChange={(e) => setDraftBody(e.target.value)}
                className="w-full bg-transparent border-none outline-none text-sm text-zinc-300 leading-8 whitespace-pre-wrap resize-none min-h-[250px]"
              />
            </div>
          </div>
        ) : loading ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 flex flex-col items-center justify-center">
             <div className="w-8 h-8 border-2 border-zinc-700 border-t-indigo-500 rounded-full animate-spin mb-4" />
             <p className="text-sm text-zinc-400">Generating highly personalized draft...</p>
          </div>
        ) : (
          <div className="bg-zinc-900/50 border border-dashed border-zinc-800 rounded-xl p-10 text-center flex flex-col items-center">
             <Mail className="w-8 h-8 text-zinc-600 mb-3" />
             <p className="text-sm text-zinc-400">No draft available yet.</p>
          </div>
        )}
      </section>

      {/* ── Human Review Actions ── */}
      {hasEmail && task.status !== "COMPLETED" && task.status !== "APPROVED" && (
        <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 sticky bottom-4 z-10 shadow-2xl shadow-black/50">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex-1 w-full">
              <button
                onClick={handleOpenGmail}
                className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-sm font-semibold rounded-lg py-3 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/30"
              >
                <Mail className="w-4 h-4" />
                Open Details in Gmail
              </button>
            </div>
            <div className="flex w-full md:w-auto gap-3 shrink-0">
               <button
                onClick={handleReject}
                disabled={loading}
                className="flex-1 md:flex-none px-6 py-3 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 text-sm font-semibold transition-all flex items-center justify-center gap-2"
              >
                <X className="w-4 h-4" />
                Reject
              </button>
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="flex-1 md:flex-none px-6 py-3 rounded-lg border border-zinc-700 text-zinc-300 hover:bg-zinc-800 text-sm font-semibold transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Regenerate
              </button>
              <button
                onClick={handleApprove}
                disabled={loading}
                className="flex-1 md:flex-none px-8 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30"
              >
                <Check className="w-4 h-4" />
                Approve
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ── Agent Logs ── */}
      <section className="mt-8 border-t border-zinc-800 pt-8">
        <AgentLogs logs={task.logs} />
      </section>

    </div>
  );
}