import { useState, useEffect, useCallback } from "react";

interface LogEntry {
  id: number;
  ip_address: string;
  device_info: string;
  screen_size: string;
  browser_info: string;
  language: string;
  platform: string;
  timezone: string;
  input_data: string | null;
  input_count: number | null;
  action_type: string;
  created_at: string;
}

interface Stats {
  totalVisits: number;
  uniqueIPs: number;
  todayVisits: number;
  dataProcessedCount: number;
  topDevices: Array<{ name: string; count: number }>;
  topBrowsers: Array<{ name: string; count: number }>;
}

export default function AdminPanel() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/stats");
      const data = await res.json() as Stats;
      setStats(data);
    } catch {
      // ignore
    }
  }, []);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      if (search) params.set("search", search);
      const res = await fetch(`/api/admin/logs?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json() as { logs: LogEntry[]; total: number };
      setLogs(data.logs);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch logs");
    } finally {
      setLoading(false);
    }
  }, [page, limit, search]);

  useEffect(() => {
    void fetchStats();
    void fetchLogs();
  }, [fetchStats, fetchLogs]);

  async function deleteLog(id: number) {
    if (!confirm("Delete this log entry?")) return;
    try {
      await fetch(`/api/admin/logs/${id}`, { method: "DELETE" });
      setLogs((prev) => prev.filter((l) => l.id !== id));
      setTotal((t) => t - 1);
    } catch {
      alert("Failed to delete");
    }
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#c9d1d9]">Admin Dashboard</h1>
        <span className="text-xs text-[#8b949e] bg-[#21262d] border border-[#30363d] px-3 py-1 rounded-full">Hidden Panel</span>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Visits" value={stats.totalVisits} color="text-[#58a6ff]" />
          <StatCard label="Unique IPs" value={stats.uniqueIPs} color="text-[#3fb950]" />
          <StatCard label="Today's Visits" value={stats.todayVisits} color="text-[#d29922]" />
          <StatCard label="Data Processed" value={stats.dataProcessedCount} color="text-[#f0883e]" />
        </div>
      )}

      {/* Charts Row */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ChartPanel title="Top Platforms" items={stats.topDevices} />
          <ChartPanel title="Top Browsers" items={stats.topBrowsers} />
        </div>
      )}

      {/* Activity Log Table */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg">
        <div className="px-4 py-3 border-b border-[#30363d] flex items-center justify-between gap-3 flex-wrap">
          <h2 className="font-semibold text-[#c9d1d9]">Activity Log ({total})</h2>
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search IP, browser, action..."
            className="bg-[#0d1117] border border-[#30363d] rounded px-3 py-1.5 text-[#c9d1d9] text-sm placeholder-[#484f58] focus:outline-none focus:border-[#58a6ff] w-56"
          />
        </div>

        {loading && (
          <div className="text-center py-8 text-[#8b949e]">Loading...</div>
        )}
        {error && (
          <div className="text-center py-8 text-[#f85149]">Error: {error}</div>
        )}
        {!loading && !error && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[#8b949e] border-b border-[#30363d]">
                  <th className="px-4 py-2 text-left">IP</th>
                  <th className="px-4 py-2 text-left">Platform</th>
                  <th className="px-4 py-2 text-left">Browser</th>
                  <th className="px-4 py-2 text-left">Action</th>
                  <th className="px-4 py-2 text-left">Input</th>
                  <th className="px-4 py-2 text-left">Screen</th>
                  <th className="px-4 py-2 text-left">Time</th>
                  <th className="px-4 py-2 text-left">Del</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-[#21262d] hover:bg-[#21262d] transition-colors">
                    <td className="px-4 py-2 font-mono text-[#58a6ff]">{log.ip_address}</td>
                    <td className="px-4 py-2 text-[#8b949e]">{log.platform}</td>
                    <td className="px-4 py-2 text-[#8b949e]">{log.browser_info || "—"}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-0.5 rounded text-xs border ${
                        log.action_type === "visit"
                          ? "text-[#3fb950] bg-[#0d2818] border-[#238636]"
                          : log.action_type === "process"
                          ? "text-[#d29922] bg-[#272115] border-[#9e6a03]"
                          : "text-[#8b949e] bg-[#21262d] border-[#30363d]"
                      }`}>
                        {log.action_type}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-[#8b949e]">{log.input_count != null ? `${log.input_count} UIDs` : "—"}</td>
                    <td className="px-4 py-2 text-[#8b949e]">{log.screen_size}</td>
                    <td className="px-4 py-2 text-[#8b949e] whitespace-nowrap">{new Date(log.created_at).toLocaleString()}</td>
                    <td className="px-4 py-2">
                      <button onClick={() => void deleteLog(log.id)} className="text-[#f85149] hover:text-white text-xs">✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-[#30363d] flex items-center justify-between">
            <span className="text-xs text-[#8b949e]">Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 bg-[#21262d] border border-[#30363d] rounded text-xs text-[#c9d1d9] disabled:opacity-50 hover:bg-[#30363d]"
              >
                ← Prev
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 bg-[#21262d] border border-[#30363d] rounded text-xs text-[#c9d1d9] disabled:opacity-50 hover:bg-[#30363d]"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-lg px-4 py-4">
      <div className={`text-3xl font-bold ${color}`}>{value.toLocaleString()}</div>
      <div className="text-sm text-[#8b949e] mt-1">{label}</div>
    </div>
  );
}

function ChartPanel({ title, items }: { title: string; items: Array<{ name: string; count: number }> }) {
  const max = Math.max(...items.map((i) => i.count), 1);
  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
      <h3 className="font-semibold text-[#c9d1d9] mb-3">{title}</h3>
      <div className="space-y-2">
        {items.length === 0 && <p className="text-[#8b949e] text-sm">No data</p>}
        {items.map((item) => (
          <div key={item.name} className="space-y-1">
            <div className="flex justify-between text-xs text-[#8b949e]">
              <span className="truncate max-w-40">{item.name || "Unknown"}</span>
              <span>{item.count}</span>
            </div>
            <div className="w-full bg-[#21262d] rounded-full h-1.5">
              <div
                className="bg-[#1f6feb] h-1.5 rounded-full"
                style={{ width: `${(item.count / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
