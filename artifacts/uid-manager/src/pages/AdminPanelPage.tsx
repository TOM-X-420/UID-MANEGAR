import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAdminLogs, useAdminStats, useDeleteLog } from '@workspace/api-client-react';

export default function AdminPanelPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const limit = 20;
  const queryClient = useQueryClient();

  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const { data: logsData, isLoading: logsLoading } = useAdminLogs({ page, limit, search });
  const deleteMutation = useDeleteLog();

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this log entry?')) return;
    await deleteMutation.mutateAsync(id);
    await queryClient.invalidateQueries({ queryKey: ['admin-logs'] });
    await queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const totalPages = logsData ? Math.ceil(logsData.total / limit) : 0;

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <header className="bg-gray-900 border-b border-cyan-900 px-4 py-3 flex items-center gap-4">
        <Link to="/" className="text-cyan-400 hover:text-cyan-200">← Back</Link>
        <h1 className="text-xl font-bold text-cyan-400">🔐 Admin Panel</h1>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statsLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-gray-900 border border-gray-700 rounded-lg p-4 animate-pulse h-24" />
            ))
          ) : (
            <>
              <div className="bg-gray-900 border border-cyan-900 rounded-lg p-4">
                <div className="text-3xl font-bold text-cyan-400">{stats?.totalVisits?.toLocaleString() ?? '—'}</div>
                <div className="text-sm text-gray-400 mt-1">Total Visits</div>
              </div>
              <div className="bg-gray-900 border border-green-900 rounded-lg p-4">
                <div className="text-3xl font-bold text-green-400">{stats?.uniqueIPs?.toLocaleString() ?? '—'}</div>
                <div className="text-sm text-gray-400 mt-1">Unique IPs</div>
              </div>
              <div className="bg-gray-900 border border-yellow-900 rounded-lg p-4">
                <div className="text-3xl font-bold text-yellow-400">{stats?.todayVisits?.toLocaleString() ?? '—'}</div>
                <div className="text-sm text-gray-400 mt-1">Today's Visits</div>
              </div>
              <div className="bg-gray-900 border border-purple-900 rounded-lg p-4">
                <div className="text-3xl font-bold text-purple-400">{stats?.dataProcessed?.toLocaleString() ?? '—'}</div>
                <div className="text-sm text-gray-400 mt-1">Data Processed</div>
              </div>
            </>
          )}
        </div>

        {/* Top Devices & Browsers */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-400 mb-3">Top Devices</h3>
              {stats.topDevices?.map((d, i) => (
                <div key={i} className="flex items-center gap-2 mb-2">
                  <span className="text-xs text-gray-300 flex-1 truncate">{d.name}</span>
                  <div className="w-24 bg-gray-800 rounded-full h-2">
                    <div
                      className="bg-cyan-600 h-2 rounded-full"
                      style={{ width: `${Math.min(100, (d.count / (stats.topDevices[0]?.count ?? 1)) * 100)}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 w-8 text-right">{d.count}</span>
                </div>
              ))}
            </div>
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-400 mb-3">Top Browsers</h3>
              {stats.topBrowsers?.map((b, i) => (
                <div key={i} className="flex items-center gap-2 mb-2">
                  <span className="text-xs text-gray-300 flex-1 truncate">{b.name}</span>
                  <div className="w-24 bg-gray-800 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{ width: `${Math.min(100, (b.count / (stats.topBrowsers[0]?.count ?? 1)) * 100)}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 w-8 text-right">{b.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Activity Log Table */}
        <div className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between gap-4 flex-wrap">
            <h3 className="font-semibold text-gray-300">Activity Logs</h3>
            <form onSubmit={handleSearch} className="flex gap-2">
              <input
                type="text"
                className="bg-gray-950 border border-gray-700 rounded px-3 py-1.5 text-sm text-gray-200 focus:outline-none focus:border-cyan-600"
                placeholder="Search IP, device..."
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
              />
              <button type="submit" className="bg-cyan-700 hover:bg-cyan-600 text-white px-3 py-1.5 rounded text-sm">🔍</button>
              {search && (
                <button type="button" onClick={() => { setSearch(''); setSearchInput(''); setPage(1); }} className="bg-gray-700 hover:bg-gray-600 text-gray-300 px-3 py-1.5 rounded text-sm">✕</button>
              )}
            </form>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-gray-400 text-xs">
                  <th className="text-left px-4 py-2">ID</th>
                  <th className="text-left px-4 py-2">IP</th>
                  <th className="text-left px-4 py-2">Device</th>
                  <th className="text-left px-4 py-2">Action</th>
                  <th className="text-left px-4 py-2">Language</th>
                  <th className="text-left px-4 py-2">Time</th>
                  <th className="text-left px-4 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {logsLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-gray-800 animate-pulse">
                      {Array.from({ length: 7 }).map((_, j) => (
                        <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-800 rounded" /></td>
                      ))}
                    </tr>
                  ))
                ) : logsData?.logs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">No logs found</td>
                  </tr>
                ) : (
                  logsData?.logs.map(log => (
                    <tr key={log.id} className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                      <td className="px-4 py-3 text-gray-500">{log.id}</td>
                      <td className="px-4 py-3 font-mono text-cyan-400 text-xs">{log.ipAddress}</td>
                      <td className="px-4 py-3 text-gray-300 max-w-xs truncate text-xs">{log.deviceInfo}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs bg-cyan-900 text-cyan-300 px-2 py-0.5 rounded-full">{log.actionType}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{log.language}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{new Date(log.createdAt).toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleDelete(log.id)}
                          className="text-xs bg-red-900 hover:bg-red-800 text-red-300 px-2 py-1 rounded"
                        >
                          🗑 Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="px-4 py-3 border-t border-gray-700 flex items-center justify-between">
              <span className="text-xs text-gray-500">
                Page {page} of {totalPages} ({logsData?.total} total)
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-gray-300 px-3 py-1.5 rounded text-sm"
                >
                  ← Prev
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-gray-300 px-3 py-1.5 rounded text-sm"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
