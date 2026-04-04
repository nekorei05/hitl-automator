import { useState } from "react";

export default function AgentLogs({ logs }) {
  const [open, setOpen] = useState(false);

  if (!logs || logs.length === 0) return null;

  return (
    <div className="mt-3 border-t border-zinc-800 pt-3">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-xs text-zinc-500 transition-colors hover:text-zinc-300"
      >
        <span className={`transition-transform duration-150 ${open ? "rotate-90" : ""}`}>▶</span>
        <span>{open ? "Hide" : "Show"} agent logs</span>
        <span className="ml-1 rounded bg-zinc-800 px-1.5 py-0.5 font-mono text-zinc-400">
          {logs.length}
        </span>
      </button>

      {open && (
        <div className="mt-2 max-h-36 overflow-y-auto rounded-lg border border-zinc-800 bg-black px-3 py-2.5">
          {logs.map((log, i) => (
            <div key={i} className="flex gap-2 font-mono text-xs leading-relaxed">
              <span className="select-none text-zinc-600">›</span>
              <span className="text-zinc-400">{log}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}