import { useEffect, useState } from "react";
import AgentLogs from "./AgentLogs";
import { approveTask, rejectTask } from "../services/api";
import axios from "axios";

export default function TaskCard({ task, onUpdate }) {
  const [loading, setLoading] = useState(false);
  const [draftBody, setDraftBody] = useState(task.body || "");

  const hasEmail = !!(task.subject || task.body);

  useEffect(() => {
    setDraftBody(task.body || "");
  }, [task.body]);

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
    <div className="w-full max-w-[1400px] mx-auto rounded-xl border border-gray-200 bg-white shadow-lg hover:shadow-xl transition-all dark:bg-[#111827] dark:border-[#1F2937]">

      {/* HEADER */}
      <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 dark:border-[#1F2937]">
        <div className="flex gap-2">
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-gray-100 dark:bg-[#0B0F14]">
            {task.status}
          </span>
          {task.matchLevel && (
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-purple-100 text-purple-700">
              {task.matchLevel} Match
            </span>
          )}
        </div>
        <span className="text-xs text-gray-400 font-mono">
          {task._id?.slice(-6)}
        </span>
      </div>

      {/* CONTENT */}
      <div className="grid lg:grid-cols-[0.9fr_1.4fr] gap-6 p-5">

        {/* LEFT */}
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 dark:bg-[#0B0F14] dark:border-[#1F2937] space-y-4">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Job Description
          </p>

          <p className="text-sm text-gray-800 leading-relaxed dark:text-gray-200">
            {task.jobDescription}
          </p>

          {task.matchReason && (
            <div className="mt-3 text-xs text-gray-600 dark:text-gray-400">
              {task.matchReason}
            </div>
          )}
        </div>

        {/* RIGHT */}
        <div className="flex flex-col gap-4">

          {/* EMAIL CARD */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-md dark:bg-[#111827] dark:border-[#1F2937]">

            {/* TOOLBAR */}
            <div className="flex justify-between items-center px-6 py-3 border-b bg-gray-50 dark:bg-[#0B0F14] dark:border-[#1F2937]">
              <p className="text-xs font-semibold uppercase text-gray-500">
                Draft Email
              </p>
              <span className="text-xs text-gray-400">
                {hasEmail ? "Preview" : "Empty"}
              </span>
            </div>

            {/* EMAIL BODY */}
            <div className="p-6">
              <div className="min-h-[460px] rounded-lg border bg-white p-6 text-[15px] leading-relaxed text-gray-900 shadow-inner">
                {hasEmail ? (
                  <div className="whitespace-pre-wrap">{draftBody}</div>
                ) : (
                  <p className="text-gray-400 italic">
                    No draft yet — generate one to preview here.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* ACTIONS */}
          <div className="space-y-3">

            {!hasEmail && (
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#6366F1] text-white font-semibold shadow-md hover:shadow-lg transition"
              >
                {loading ? "Generating..." : "Generate Match & Draft"}
              </button>
            )}

            {hasEmail && (
              <>
                <button
                  onClick={handleOpenGmail}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#6366F1] text-white font-semibold shadow-md hover:shadow-lg transition"
                >
                  Send via Gmail
                </button>

                <div className="flex gap-2 bg-gray-50 p-2 rounded-xl border">
                  <button onClick={handleApprove} className="flex-1 text-sm py-2 rounded-lg bg-green-100 text-green-700">
                    Complete
                  </button>
                  <button onClick={handleReject} className="flex-1 text-sm py-2 rounded-lg bg-red-100 text-red-700">
                    Reject
                  </button>
                  <button onClick={handleGenerate} className="flex-1 text-sm py-2 rounded-lg bg-yellow-100 text-yellow-700">
                    Regenerate
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="px-6 pb-6">
        <AgentLogs logs={task.logs} />
      </div>
    </div>
  );
}