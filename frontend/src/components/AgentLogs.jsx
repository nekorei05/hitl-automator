export default function AgentLogs({ logs }) {
  if (!logs || logs.length === 0) return null;

  return (
    <div className="mt-3 bg-black rounded border border-zinc-700 p-3 font-mono text-xs leading-relaxed max-h-40 overflow-y-auto">
      {logs.map((log, i) => (
        <div key={i} className="flex gap-2 text-zinc-400">
          <span className="text-zinc-600 select-none">›</span>
          <span>{log}</span>
        </div>
      ))}
    </div>
  );
}
