import { useState } from "react";

type Step = 1 | 2 | 3;

interface FriendEntry {
  id: string;
  name: string;
}

interface DumpResult {
  uid: string;
  friends: FriendEntry[];
  status: string;
  totalFetched?: number;
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text).catch(() => {
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
  });
}

function downloadFile(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function DumpingSystem() {
  const [step, setStep] = useState<Step>(1);
  const [token, setToken] = useState("");
  const [cookie, setCookie] = useState("");
  const [uidsText, setUidsText] = useState("");
  const [totalUsers, setTotalUsers] = useState(1000);
  const [maxPerFile, setMaxPerFile] = useState(500);
  const [perBatch, setPerBatch] = useState(61);
  const [results, setResults] = useState<DumpResult[]>([]);
  const [isDumping, setIsDumping] = useState(false);
  const [progress, setProgress] = useState(0);
  const [totalUIDs, setTotalUIDs] = useState(0);
  const [successCount, setSuccessCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);
  const [totalFriendsCount, setTotalFriendsCount] = useState(0);

  const uids = uidsText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  async function startDump() {
    if (!token.trim()) { alert("Please enter an Access Token"); return; }
    if (!uids.length) { alert("Please enter UIDs to dump"); return; }

    setIsDumping(true);
    setStep(3);
    setProgress(0);
    setTotalUIDs(uids.length);
    setSuccessCount(0);
    setFailedCount(0);
    setTotalFriendsCount(0);
    setResults([]);

    let success = 0;
    let failed = 0;
    let friendsTotal = 0;
    const allResults: DumpResult[] = [];

    for (let i = 0; i < uids.length; i++) {
      const uid = uids[i];
      try {
        const res = await fetch("/api/facebook/dump-friends", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            uid,
            token,
            cookie: cookie || undefined,
            totalUsers,
            maxPerFile,
            perBatch,
          }),
        });
        const data = await res.json() as DumpResult;
        allResults.push(data);
        if (data.status === "ok") {
          success++;
          friendsTotal += data.friends.length;
        } else {
          failed++;
        }
      } catch {
        allResults.push({ uid: uid ?? "", friends: [], status: "error" });
        failed++;
      }
      setProgress(i + 1);
      setSuccessCount(success);
      setFailedCount(failed);
      setTotalFriendsCount(friendsTotal);
      setResults([...allResults]);
    }

    setIsDumping(false);
  }

  const allFriends = results.flatMap((r) => r.friends);

  function downloadBatch(batchIndex: number) {
    const start = batchIndex * perBatch;
    const batch = allFriends.slice(start, start + perBatch);
    const content = batch.map((f) => `${f.id}|${f.name}`).join("\n");
    downloadFile(content, `batch_${batchIndex + 1}.txt`);
  }

  function downloadFile_(content: string, filename: string) {
    downloadFile(content, filename);
  }

  const batches = Math.ceil(allFriends.length / perBatch);
  const files = Math.ceil(allFriends.length / maxPerFile);

  return (
    <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#c9d1d9]">Dumping System</h1>
        <div className="flex gap-2">
          {([1, 2, 3] as Step[]).map((s) => (
            <div
              key={s}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border ${
                step >= s
                  ? "bg-[#1f6feb] border-[#1f6feb] text-white"
                  : "bg-[#21262d] border-[#30363d] text-[#8b949e]"
              }`}
            >
              {s}
            </div>
          ))}
        </div>
      </div>

      {/* Step 1: Login */}
      {step === 1 && (
        <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-6 space-y-4">
          <h2 className="font-semibold text-[#c9d1d9] text-lg">Step 1: Authentication</h2>
          <div>
            <label className="text-sm text-[#8b949e] mb-1 block">Facebook Access Token *</label>
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="EAA..."
              className="w-full bg-[#0d1117] border border-[#30363d] rounded px-3 py-2 text-[#c9d1d9] placeholder-[#484f58] focus:outline-none focus:border-[#58a6ff]"
            />
          </div>
          <div>
            <label className="text-sm text-[#8b949e] mb-1 block">Cookie (optional)</label>
            <input
              type="text"
              value={cookie}
              onChange={(e) => setCookie(e.target.value)}
              placeholder="c_user=...; xs=..."
              className="w-full bg-[#0d1117] border border-[#30363d] rounded px-3 py-2 text-[#c9d1d9] placeholder-[#484f58] focus:outline-none focus:border-[#58a6ff]"
            />
          </div>
          <button
            onClick={() => { if (!token.trim()) { alert("Enter token"); return; } setStep(2); }}
            className="px-6 py-2 bg-[#1f6feb] hover:bg-[#388bfd] border border-[#1f6feb] rounded text-white font-semibold transition-colors"
          >
            Next →
          </button>
        </div>
      )}

      {/* Step 2: Configure */}
      {step === 2 && (
        <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-6 space-y-4">
          <h2 className="font-semibold text-[#c9d1d9] text-lg">Step 2: Configure & Dump</h2>
          <div>
            <label className="text-sm text-[#8b949e] mb-1 block">UIDs to dump (one per line)</label>
            <textarea
              value={uidsText}
              onChange={(e) => setUidsText(e.target.value)}
              placeholder="100067890&#10;100012345&#10;..."
              rows={6}
              className="w-full bg-[#0d1117] border border-[#30363d] rounded px-3 py-2 text-[#c9d1d9] font-mono placeholder-[#484f58] focus:outline-none focus:border-[#58a6ff] resize-y"
            />
            <div className="text-xs text-[#8b949e] mt-1">{uids.length} UIDs</div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-sm text-[#8b949e] mb-1 block">Total Users</label>
              <input type="number" value={totalUsers} onChange={(e) => setTotalUsers(Number(e.target.value))} className="w-full bg-[#0d1117] border border-[#30363d] rounded px-3 py-2 text-[#c9d1d9] focus:outline-none focus:border-[#58a6ff]" />
            </div>
            <div>
              <label className="text-sm text-[#8b949e] mb-1 block">Max / File</label>
              <input type="number" value={maxPerFile} onChange={(e) => setMaxPerFile(Number(e.target.value))} className="w-full bg-[#0d1117] border border-[#30363d] rounded px-3 py-2 text-[#c9d1d9] focus:outline-none focus:border-[#58a6ff]" />
            </div>
            <div>
              <label className="text-sm text-[#8b949e] mb-1 block">Per Batch</label>
              <input type="number" value={perBatch} onChange={(e) => setPerBatch(Number(e.target.value))} className="w-full bg-[#0d1117] border border-[#30363d] rounded px-3 py-2 text-[#c9d1d9] focus:outline-none focus:border-[#58a6ff]" />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="px-4 py-2 bg-[#21262d] border border-[#30363d] rounded text-[#c9d1d9] hover:bg-[#30363d]">← Back</button>
            <button
              onClick={() => void startDump()}
              className="px-6 py-2 bg-[#238636] hover:bg-[#2ea043] border border-[#2ea043] rounded text-white font-semibold transition-colors"
            >
              Start Dump
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Results */}
      {step === 3 && (
        <div className="space-y-4">
          {/* Progress */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-[#c9d1d9] font-semibold">Progress: {progress}/{totalUIDs}</span>
              <span className="text-[#8b949e]">✓ {successCount} | ✗ {failedCount}</span>
            </div>
            <div className="w-full bg-[#21262d] rounded-full h-3">
              <div
                className="bg-[#1f6feb] h-3 rounded-full transition-all duration-300"
                style={{ width: `${totalUIDs > 0 ? (progress / totalUIDs) * 100 : 0}%` }}
              />
            </div>
            <div className="text-[#3fb950] font-semibold">
              Total Friends Dumped: {totalFriendsCount.toLocaleString()}
            </div>
          </div>

          {/* Download Options */}
          {!isDumping && allFriends.length > 0 && (
            <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 space-y-3">
              <h3 className="font-semibold text-[#c9d1d9]">Download Results</h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => downloadFile_(allFriends.map((f) => `${f.id}|${f.name}`).join("\n"), "all_id_name.txt")}
                  className="px-3 py-1.5 bg-[#21262d] border border-[#30363d] rounded text-sm text-[#c9d1d9] hover:bg-[#30363d]"
                >
                  All ID|Name
                </button>
                <button
                  onClick={() => downloadFile_(allFriends.map((f) => f.id).join("\n"), "ids_only.txt")}
                  className="px-3 py-1.5 bg-[#21262d] border border-[#30363d] rounded text-sm text-[#c9d1d9] hover:bg-[#30363d]"
                >
                  IDs Only
                </button>
                <button
                  onClick={() => copyToClipboard(allFriends.map((f) => `${f.id}|${f.name}`).join("\n"))}
                  className="px-3 py-1.5 bg-[#21262d] border border-[#30363d] rounded text-sm text-[#c9d1d9] hover:bg-[#30363d]"
                >
                  Copy All
                </button>
              </div>

              {/* User Separate batches */}
              <div>
                <div className="text-sm text-[#8b949e] mb-2">User Separate ({batches} batches of {perBatch})</div>
                <div className="flex flex-wrap gap-2">
                  {Array.from({ length: batches }, (_, i) => (
                    <button
                      key={i}
                      onClick={() => downloadBatch(i)}
                      className="px-3 py-1 bg-[#21262d] border border-[#30363d] rounded text-xs text-[#c9d1d9] hover:bg-[#30363d]"
                    >
                      Batch {i + 1}
                    </button>
                  ))}
                </div>
              </div>

              {/* Clone File Divide */}
              <div>
                <div className="text-sm text-[#8b949e] mb-2">Clone File Divide ({files} files of {maxPerFile})</div>
                <div className="flex flex-wrap gap-2">
                  {Array.from({ length: files }, (_, i) => {
                    const start = i * maxPerFile;
                    const slice = allFriends.slice(start, start + maxPerFile);
                    return (
                      <button
                        key={i}
                        onClick={() => downloadFile_(slice.map((f) => `${f.id}|${f.name}`).join("\n"), `file_${i + 1}.txt`)}
                        className="px-3 py-1 bg-[#21262d] border border-[#30363d] rounded text-xs text-[#c9d1d9] hover:bg-[#30363d]"
                      >
                        File {i + 1} ({slice.length})
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Per-UID results table */}
          {results.length > 0 && (
            <div className="bg-[#161b22] border border-[#30363d] rounded-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-[#30363d]">
                <h3 className="font-semibold text-[#c9d1d9]">Per-UID Results</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-[#8b949e] border-b border-[#30363d]">
                      <th className="px-4 py-2 text-left">UID</th>
                      <th className="px-4 py-2 text-left">Status</th>
                      <th className="px-4 py-2 text-left">Friends</th>
                      <th className="px-4 py-2 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((r, idx) => (
                      <tr key={idx} className="border-b border-[#21262d] hover:bg-[#21262d]">
                        <td className="px-4 py-2 font-mono text-[#58a6ff]">{r.uid}</td>
                        <td className="px-4 py-2">
                          <span className={`px-2 py-0.5 rounded text-xs border ${r.status === "ok" ? "text-[#3fb950] bg-[#0d2818] border-[#238636]" : "text-[#f85149] bg-[#2d1319] border-[#da3633]"}`}>
                            {r.status}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-[#c9d1d9]">{r.friends.length}</td>
                        <td className="px-4 py-2 flex gap-2">
                          <button
                            onClick={() => downloadFile_(r.friends.map((f) => `${f.id}|${f.name}`).join("\n"), `${r.uid}_friends.txt`)}
                            className="px-2 py-1 bg-[#21262d] border border-[#30363d] rounded text-xs text-[#c9d1d9] hover:bg-[#30363d]"
                          >
                            DL
                          </button>
                          <button
                            onClick={() => copyToClipboard(r.friends.map((f) => `${f.id}|${f.name}`).join("\n"))}
                            className="px-2 py-1 bg-[#21262d] border border-[#30363d] rounded text-xs text-[#c9d1d9] hover:bg-[#30363d]"
                          >
                            Copy
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {!isDumping && (
            <button
              onClick={() => { setStep(2); setResults([]); }}
              className="px-4 py-2 bg-[#21262d] border border-[#30363d] rounded text-[#c9d1d9] hover:bg-[#30363d]"
            >
              ← New Dump
            </button>
          )}
        </div>
      )}
    </main>
  );
}
