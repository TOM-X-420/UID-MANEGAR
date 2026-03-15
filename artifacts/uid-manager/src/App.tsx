import { useHealthz, useAdminStats } from '@workspace/api-client-react';

function App() {
  const healthz = useHealthz();
  const stats = useAdminStats();

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-3xl font-bold tracking-tight">FB UID Manager Pro</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-lg">
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">API Health</p>
          {healthz.isLoading && <p className="text-yellow-400">Checking…</p>}
          {healthz.isError && <p className="text-red-400">Offline</p>}
          {healthz.data && (
            <p className="text-green-400 font-semibold">
              {healthz.data.status === 'ok' ? '✓ Online' : healthz.data.status}
            </p>
          )}
        </div>

        <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Total Events</p>
          {stats.isLoading && <p className="text-yellow-400">Loading…</p>}
          {stats.isError && <p className="text-red-400">N/A</p>}
          {stats.data && (
            <p className="text-2xl font-bold">
              {stats.data.totalEvents.toLocaleString()}
            </p>
          )}
        </div>

        <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Unique UIDs</p>
          {stats.isLoading && <p className="text-yellow-400">Loading…</p>}
          {stats.isError && <p className="text-red-400">N/A</p>}
          {stats.data && (
            <p className="text-2xl font-bold">
              {stats.data.uniqueUids.toLocaleString()}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
