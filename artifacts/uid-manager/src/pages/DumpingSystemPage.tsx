import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useFacebookBulkDumpFriends } from '@workspace/api-client-react';

interface DumpResult {
  uid: string;
  friends: Array<{ id: string; name: string }>;
  total: number;
  status: string;
}

export default function DumpingSystemPage() {
  const [step, setStep] = useState(1);
  const [uids, setUids] = useState('');
  const [token, setToken] = useState(() => localStorage.getItem('fb-token') ?? '');
  const [cookie, setCookie] = useState(() => localStorage.getItem('fb-cookie') ?? '');
  const [results, setResults] = useState<DumpResult[]>([]);
  const [progress, setProgress] = useState(0);
  const [isDumping, setIsDumping] = useState(false);
  const [selectedUID, setSelectedUID] = useState<string | null>(null);
  const bulkDump = useFacebookBulkDumpFriends();

  const uidList = uids.split('\n').map(l => l.trim().split(':')[0] ?? '').filter(Boolean);

  const startDump = async () => {
    if (!token || uidList.length === 0) return;
    setIsDumping(true);
    setStep(2);
    setProgress(0);

    const batchSize = 10;
    const allResults: DumpResult[] = [];

    for (let i = 0; i < uidList.length; i += batchSize) {
      const batch = uidList.slice(i, i + batchSize);
      try {
        const res = await bulkDump.mutateAsync({ uids: batch, token, cookie: cookie || undefined });
        allResults.push(...(res.results as DumpResult[]));
      } catch {
        // continue on error
      }
      setProgress(Math.round(Math.min(((i + batchSize) / uidList.length) * 100, 100)));
      await new Promise(r => setTimeout(r, 300));
    }

    setResults(allResults);
    setIsDumping(false);
    setStep(3);
  };

  const exportFriends = (uid: string) => {
    const result = results.find(r => r.uid === uid);
    if (!result) return;
    const content = result.friends.map(f => `${f.id}:${f.name}`).join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `friends-${uid}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportAll = () => {
    const content = results.flatMap(r => r.friends.map(f => `${f.id}:${f.name}`)).join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'all-friends.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <header className="bg-gray-900 border-b border-cyan-900 px-4 py-3 flex items-center gap-4">
        <Link to="/" className="text-cyan-400 hover:text-cyan-200">← Back</Link>
        <h1 className="text-xl font-bold text-cyan-400">⬇️ Dumping System</h1>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-6">
          {[1, 2, 3].map(s => (
            <React.Fragment key={s}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= s ? 'bg-cyan-600 text-white' : 'bg-gray-800 text-gray-500'}`}>{s}</div>
              {s < 3 && <div className={`flex-1 h-1 rounded ${step > s ? 'bg-cyan-600' : 'bg-gray-800'}`} />}
            </React.Fragment>
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 space-y-4">
              <h2 className="text-lg font-semibold text-cyan-400">Step 1: Input UIDs &amp; Token</h2>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">UIDs (one per line, uid or uid:password)</label>
                <textarea
                  className="w-full bg-gray-950 border border-gray-700 rounded p-3 text-sm font-mono text-gray-200 h-40 focus:outline-none focus:border-cyan-600 resize-none"
                  placeholder={'100123456789\n200987654321\n...'}
                  value={uids}
                  onChange={e => setUids(e.target.value)}
                />
                <div className="text-xs text-gray-500 mt-1">{uidList.length} UIDs</div>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Access Token</label>
                <input
                  type="text"
                  className="w-full bg-gray-950 border border-gray-700 rounded p-2 text-sm font-mono text-gray-200 focus:outline-none focus:border-cyan-600"
                  placeholder="EAABwz..."
                  value={token}
                  onChange={e => { setToken(e.target.value); localStorage.setItem('fb-token', e.target.value); }}
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Cookie (optional)</label>
                <input
                  type="text"
                  className="w-full bg-gray-950 border border-gray-700 rounded p-2 text-sm font-mono text-gray-200 focus:outline-none focus:border-cyan-600"
                  placeholder="c_user=..."
                  value={cookie}
                  onChange={e => { setCookie(e.target.value); localStorage.setItem('fb-cookie', e.target.value); }}
                />
              </div>
              <button
                onClick={startDump}
                disabled={uidList.length === 0 || !token || isDumping}
                className="bg-cyan-700 hover:bg-cyan-600 disabled:opacity-50 text-white px-6 py-2 rounded font-semibold"
              >
                Start Dumping ({uidList.length} UIDs)
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 text-center space-y-4">
            <h2 className="text-lg font-semibold text-cyan-400">Step 2: Processing...</h2>
            <div className="text-4xl animate-spin">⚙️</div>
            <div className="w-full bg-gray-800 rounded-full h-4">
              <div className="bg-cyan-500 h-4 rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
            <div className="text-cyan-300 font-bold">{progress}%</div>
            <div className="text-gray-400 text-sm">Dumping friends... Please wait</div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-cyan-400">Step 3: Results</h2>
              <div className="flex gap-2">
                <button onClick={exportAll} className="bg-cyan-700 hover:bg-cyan-600 text-white px-4 py-2 rounded text-sm">⬇ Export All</button>
                <button onClick={() => { setStep(1); setResults([]); }} className="bg-gray-700 hover:bg-gray-600 text-gray-200 px-4 py-2 rounded text-sm">🔄 New Dump</button>
              </div>
            </div>
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="text-center"><div className="text-2xl font-bold text-cyan-400">{results.length}</div><div className="text-xs text-gray-400">UIDs Processed</div></div>
              <div className="text-center"><div className="text-2xl font-bold text-green-400">{results.filter(r => r.status === 'ok').length}</div><div className="text-xs text-gray-400">Successful</div></div>
              <div className="text-center"><div className="text-2xl font-bold text-blue-400">{results.reduce((s, r) => s + r.total, 0).toLocaleString()}</div><div className="text-xs text-gray-400">Total Friends</div></div>
            </div>
            <div className="space-y-2">
              {results.map(result => (
                <div key={result.uid} className="bg-gray-900 border border-gray-700 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-cyan-300 text-sm">{result.uid}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${result.status === 'ok' ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>{result.status}</span>
                      <span className="text-xs text-gray-400">👥 {result.total.toLocaleString()} friends</span>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setSelectedUID(selectedUID === result.uid ? null : result.uid)} className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-2 py-1 rounded">
                        {selectedUID === result.uid ? '▲ Hide' : '▼ View'}
                      </button>
                      <button onClick={() => exportFriends(result.uid)} className="text-xs bg-cyan-900 hover:bg-cyan-800 text-cyan-300 px-2 py-1 rounded">⬇ Export</button>
                    </div>
                  </div>
                  {selectedUID === result.uid && result.friends.length > 0 && (
                    <div className="mt-3 max-h-48 overflow-y-auto bg-gray-950 rounded p-2">
                      {result.friends.slice(0, 100).map(f => (
                        <div key={f.id} className="text-xs font-mono text-gray-400 py-0.5 border-b border-gray-800">
                          {f.id}: {f.name}
                        </div>
                      ))}
                      {result.friends.length > 100 && <div className="text-xs text-gray-500 mt-1">...and {result.friends.length - 100} more</div>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
