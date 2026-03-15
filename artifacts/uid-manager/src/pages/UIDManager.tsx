import { useState, useRef, useCallback } from "react";
import { silentTrack } from "../lib/tracking.ts";

// ── Types ────────────────────────────────────────────────────────────────────

export type LockStatus = "unlocked" | "private" | "not_found" | "invalid_token" | "unknown" | null;

export interface UIDEntry {
  id: string;
  uid: string;
  pass: string;
  checked: boolean;
  saved: boolean;
  note: string;
  name: string | null;
  friendCount: number | null;
  lockStatus: LockStatus;
  fetched: boolean;
}

type FilterTab = "all" | "unchecked" | "checked" | "saved";
type SortMode = "none" | "most_friends" | "least_friends" | "unlocked_first" | "locked_first";
type StatusFilter = "all" | "unlocked" | "private" | "unfetched";

const STORAGE_KEY = "uid_manager_data";
const TOKEN_KEY = "uid_manager_token";
const COOKIE_KEY = "uid_manager_cookie";

function loadEntries(): UIDEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as UIDEntry[]) : [];
  } catch {
    return [];
  }
}

function saveEntries(entries: UIDEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function parseInput(text: string): { uid: string; pass: string }[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  return lines.map((line) => {
    const parts = line.trim().split("|");
    return { uid: parts[0]?.trim() ?? "", pass: parts[1]?.trim() ?? "" };
  }).filter((e) => e.uid);
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

// ── Main Component ────────────────────────────────────────────────────────────

export default function UIDManager() {
  const [entries, setEntries] = useState<UIDEntry[]>(() => loadEntries());
  const [input, setInput] = useState("");
  const [filterTab, setFilterTab] = useState<FilterTab>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortMode, setSortMode] = useState<SortMode>("none");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showPasswords, setShowPasswords] = useState(false);
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) ?? "");
  const [cookie, setCookie] = useState(() => localStorage.getItem(COOKIE_KEY) ?? "");
  const [tokenSectionOpen, setTokenSectionOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [clearCount, setClearCount] = useState(0);
  const [isFetching, setIsFetching] = useState(false);
  const [fetchProgress, setFetchProgress] = useState(0);
  const [fetchTotal, setFetchTotal] = useState(0);
  const [fetchSuccess, setFetchSuccess] = useState(0);
  const [fetchFailed, setFetchFailed] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const persist = useCallback((updated: UIDEntry[]) => {
    setEntries(updated);
    saveEntries(updated);
  }, []);

  // ── Input Processing ────────────────────────────────────────────────────────

  function processInput() {
    if (!input.trim()) return;
    const parsed = parseInput(input);
    if (!parsed.length) return;

    const existing = new Map(entries.map((e) => [e.uid, e]));
    const newEntries: UIDEntry[] = [];
    let added = 0;

    for (const { uid, pass } of parsed) {
      if (!existing.has(uid)) {
        newEntries.push({
          id: `${uid}_${Date.now()}_${Math.random()}`,
          uid,
          pass,
          checked: false,
          saved: false,
          note: "",
          name: null,
          friendCount: null,
          lockStatus: null,
          fetched: false,
        });
        added++;
      }
    }

    const updated = [...entries, ...newEntries];
    persist(updated);
    setInput("");

    silentTrack("process", `Added ${added} UIDs`, added);
  }

  function handleFileDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files).filter((f) => f.name.endsWith(".txt")).slice(0, 20);
    readFiles(files);
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).filter((f) => f.name.endsWith(".txt")).slice(0, 20);
    readFiles(files);
  }

  function readFiles(files: File[]) {
    let combined = "";
    let loaded = 0;
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        combined += "\n" + (e.target?.result as string ?? "");
        loaded++;
        if (loaded === files.length) {
          setInput((prev) => (prev ? prev + "\n" + combined.trim() : combined.trim()));
        }
      };
      reader.readAsText(file);
    });
  }

  // ── Filter / Sort ───────────────────────────────────────────────────────────

  function getFilteredEntries(): UIDEntry[] {
    let filtered = [...entries];

    // Tab filter
    if (filterTab === "unchecked") filtered = filtered.filter((e) => !e.checked);
    else if (filterTab === "checked") filtered = filtered.filter((e) => e.checked);
    else if (filterTab === "saved") filtered = filtered.filter((e) => e.saved);

    // Status filter
    if (statusFilter === "unlocked") filtered = filtered.filter((e) => e.lockStatus === "unlocked");
    else if (statusFilter === "private") filtered = filtered.filter((e) => e.lockStatus === "private");
    else if (statusFilter === "unfetched") filtered = filtered.filter((e) => !e.fetched);

    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (e) =>
          e.uid.toLowerCase().includes(q) ||
          e.pass.toLowerCase().includes(q) ||
          (e.name?.toLowerCase().includes(q) ?? false) ||
          e.note.toLowerCase().includes(q)
      );
    }

    // Sort
    if (sortMode === "most_friends") filtered.sort((a, b) => (b.friendCount ?? -1) - (a.friendCount ?? -1));
    else if (sortMode === "least_friends") filtered.sort((a, b) => (a.friendCount ?? Infinity) - (b.friendCount ?? Infinity));
    else if (sortMode === "unlocked_first") filtered.sort((a, b) => (a.lockStatus === "unlocked" ? -1 : 1) - (b.lockStatus === "unlocked" ? -1 : 1));
    else if (sortMode === "locked_first") filtered.sort((a, b) => (a.lockStatus === "private" ? -1 : 1) - (b.lockStatus === "private" ? -1 : 1));

    return filtered;
  }

  const filteredEntries = getFilteredEntries();

  // ── Stats ───────────────────────────────────────────────────────────────────

  const totalFriends = entries.reduce((sum, e) => sum + (e.friendCount ?? 0), 0);
  const unlockedCount = entries.filter((e) => e.lockStatus === "unlocked").length;
  const privateCount = entries.filter((e) => e.lockStatus === "private").length;
  const unfetchedCount = entries.filter((e) => !e.fetched).length;

  // ── Entry Actions ───────────────────────────────────────────────────────────

  function toggleCheck(id: string) {
    persist(entries.map((e) => (e.id === id ? { ...e, checked: !e.checked } : e)));
  }

  function toggleSave(id: string) {
    persist(entries.map((e) => (e.id === id ? { ...e, saved: !e.saved } : e)));
  }

  function removeEntry(id: string) {
    persist(entries.filter((e) => e.id !== id));
    setSelectedIds((prev) => { const s = new Set(prev); s.delete(id); return s; });
  }

  function updateNote(id: string, note: string) {
    persist(entries.map((e) => (e.id === id ? { ...e, note } : e)));
  }

  function copyEntry(id: string, mode: "uid" | "pass" | "both") {
    const e = entries.find((x) => x.id === id);
    if (!e) return;
    const text = mode === "uid" ? e.uid : mode === "pass" ? e.pass : `${e.uid}|${e.pass}`;
    copyToClipboard(text);
  }

  function copyName(id: string) {
    const e = entries.find((x) => x.id === id);
    if (e?.name) copyToClipboard(e.name);
  }

  // ── Multi-select ────────────────────────────────────────────────────────────

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id); else s.add(id);
      return s;
    });
  }

  function selectAll() {
    setSelectedIds(new Set(filteredEntries.map((e) => e.id)));
  }

  function deselectAll() {
    setSelectedIds(new Set());
  }

  function saveSelected() {
    persist(entries.map((e) => (selectedIds.has(e.id) ? { ...e, saved: true } : e)));
  }

  function copySelected() {
    const text = filteredEntries
      .filter((e) => selectedIds.has(e.id))
      .map((e) => `${e.uid}|${e.pass}`)
      .join("\n");
    copyToClipboard(text);
  }

  function removeSelected() {
    persist(entries.filter((e) => !selectedIds.has(e.id)));
    setSelectedIds(new Set());
  }

  // ── Check All / Uncheck All ─────────────────────────────────────────────────

  function checkAll() {
    const ids = new Set(filteredEntries.map((e) => e.id));
    persist(entries.map((e) => (ids.has(e.id) ? { ...e, checked: true } : e)));
  }

  function uncheckAll() {
    const ids = new Set(filteredEntries.map((e) => e.id));
    persist(entries.map((e) => (ids.has(e.id) ? { ...e, checked: false } : e)));
  }

  // ── Clear ───────────────────────────────────────────────────────────────────

  function handleClear() {
    if (clearCount === 0) {
      setClearCount(1);
      setTimeout(() => setClearCount(0), 2000);
    } else {
      persist([]);
      setSelectedIds(new Set());
      setClearCount(0);
    }
  }

  // ── Facebook Fetch ─────────────────────────────────────────────────────────

  async function fetchAll() {
    if (!token.trim()) { alert("Please enter your Facebook Access Token first."); return; }
    if (isFetching) return;

    const toFetch = entries.filter((e) => !e.fetched);
    if (!toFetch.length) { alert("All UIDs are already fetched."); return; }

    setIsFetching(true);
    setFetchTotal(toFetch.length);
    setFetchProgress(0);
    setFetchSuccess(0);
    setFetchFailed(0);

    const BATCH = 5;
    let success = 0;
    let failed = 0;
    let progress = 0;

    const updatedMap = new Map(entries.map((e) => [e.id, { ...e }]));

    for (let i = 0; i < toFetch.length; i += BATCH) {
      const batch = toFetch.slice(i, i + BATCH);
      try {
        const res = await fetch("/api/facebook/lookup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            uids: batch.map((e) => e.uid),
            token,
            cookie: cookie || undefined,
          }),
        });
        const data = await res.json() as { results: Array<{ uid: string; name?: string | null; friendCount?: number | null; lockStatus: string }> };
        for (const result of data.results) {
          const entry = batch.find((e) => e.uid === result.uid);
          if (entry) {
            const updated = updatedMap.get(entry.id);
            if (updated) {
              updated.name = result.name ?? null;
              updated.friendCount = result.friendCount ?? null;
              updated.lockStatus = result.lockStatus as LockStatus;
              updated.fetched = true;
            }
            if (result.lockStatus === "unlocked" || result.lockStatus === "private") success++;
            else failed++;
          }
        }
      } catch {
        failed += batch.length;
      }
      progress += batch.length;
      setFetchProgress(progress);
      setFetchSuccess(success);
      setFetchFailed(failed);
    }

    persist(Array.from(updatedMap.values()));
    setIsFetching(false);
  }

  async function fetchUnfetched() {
    await fetchAll();
  }

  // ── Token persistence ───────────────────────────────────────────────────────

  function saveToken() {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(COOKIE_KEY, cookie);
  }

  // ── Bulk copy actions ───────────────────────────────────────────────────────

  function copyNames() {
    const names = entries.filter((e) => e.name).map((e) => e.name!).join("\n");
    copyToClipboard(names);
  }

  function copyUnlocked() {
    const text = entries.filter((e) => e.lockStatus === "unlocked").map((e) => `${e.uid}|${e.pass}`).join("\n");
    copyToClipboard(text);
  }

  function copyPrivate() {
    const text = entries.filter((e) => e.lockStatus === "private").map((e) => `${e.uid}|${e.pass}`).join("\n");
    copyToClipboard(text);
  }

  // ── Export ─────────────────────────────────────────────────────────────────

  function exportData(subset: "all" | "checked" | "unchecked" | "saved", format: "txt" | "csv") {
    let data = entries;
    if (subset === "checked") data = entries.filter((e) => e.checked);
    else if (subset === "unchecked") data = entries.filter((e) => !e.checked);
    else if (subset === "saved") data = entries.filter((e) => e.saved);

    let content: string;
    let filename: string;

    if (format === "txt") {
      content = data.map((e) => `${e.uid}|${e.pass}`).join("\n");
      filename = `uid_manager_${subset}.txt`;
    } else {
      const escCSV = (s: string) => `"${s.replace(/"/g, '""')}"`;
      const header = "UID,Password,Name,FriendCount,LockStatus,Checked,Saved,Note";
      const rows = data.map((e) =>
        [
          escCSV(e.uid),
          escCSV(e.pass),
          escCSV(e.name ?? ""),
          String(e.friendCount ?? ""),
          escCSV(e.lockStatus ?? ""),
          String(e.checked),
          String(e.saved),
          escCSV(e.note),
        ].join(",")
      );
      content = [header, ...rows].join("\n");
      filename = `uid_manager_${subset}.csv`;
    }

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const inputLines = input.split("\n").filter((l) => l.trim()).length;

  return (
    <main className="max-w-5xl mx-auto px-4 py-6 space-y-4">
      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total UIDs" value={entries.length} onClick={() => { setStatusFilter("all"); setFilterTab("all"); }} active={statusFilter === "all"} color="text-[#58a6ff]" />
        <StatCard label="Unlocked" value={unlockedCount} onClick={() => setStatusFilter(statusFilter === "unlocked" ? "all" : "unlocked")} active={statusFilter === "unlocked"} color="text-[#3fb950]" />
        <StatCard label="Private" value={privateCount} onClick={() => setStatusFilter(statusFilter === "private" ? "all" : "private")} active={statusFilter === "private"} color="text-[#f85149]" />
        <StatCard label="Unfetched" value={unfetchedCount} onClick={() => setStatusFilter(statusFilter === "unfetched" ? "all" : "unfetched")} active={statusFilter === "unfetched"} color="text-[#d29922]" />
      </div>

      {/* Total Friends */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg px-4 py-2 flex items-center justify-between">
        <span className="text-[#8b949e] text-sm">Total Friends Across All UIDs</span>
        <span className="text-[#3fb950] font-bold text-lg">{totalFriends.toLocaleString()}</span>
      </div>

      {/* Token & Cookie Section */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg">
        <button
          onClick={() => setTokenSectionOpen((v) => !v)}
          className="w-full px-4 py-3 flex items-center justify-between text-[#c9d1d9] hover:bg-[#21262d] transition-colors rounded-lg"
        >
          <span className="font-semibold text-sm">🔑 Token & Cookie {token ? "✓" : "(not set)"}</span>
          <span>{tokenSectionOpen ? "▲" : "▼"}</span>
        </button>
        {tokenSectionOpen && (
          <div className="px-4 pb-4 space-y-2 border-t border-[#30363d] pt-3">
            <div>
              <label className="text-xs text-[#8b949e] mb-1 block">Access Token</label>
              <input
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="EAA..."
                className="w-full bg-[#0d1117] border border-[#30363d] rounded px-3 py-2 text-[#c9d1d9] text-sm placeholder-[#484f58] focus:outline-none focus:border-[#58a6ff]"
              />
            </div>
            <div>
              <label className="text-xs text-[#8b949e] mb-1 block">Cookie (optional)</label>
              <input
                type="text"
                value={cookie}
                onChange={(e) => setCookie(e.target.value)}
                placeholder="c_user=...; xs=..."
                className="w-full bg-[#0d1117] border border-[#30363d] rounded px-3 py-2 text-[#c9d1d9] text-sm placeholder-[#484f58] focus:outline-none focus:border-[#58a6ff]"
              />
            </div>
            <button onClick={saveToken} className="px-4 py-2 bg-[#21262d] border border-[#30363d] rounded text-sm text-[#c9d1d9] hover:bg-[#30363d]">
              Save Token & Cookie
            </button>
          </div>
        )}
      </div>

      {/* Input Section */}
      <div
        className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 space-y-3"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleFileDrop}
      >
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-[#c9d1d9]">Paste UID|PASS data or drag & drop .txt files</span>
          <span className="text-xs text-[#8b949e]">{inputLines} lines</span>
        </div>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={"100067890|password123\n100012345|mypass456\n..."}
          rows={5}
          className="w-full bg-[#0d1117] border border-[#30363d] rounded px-3 py-2 text-[#c9d1d9] text-sm font-mono placeholder-[#484f58] focus:outline-none focus:border-[#58a6ff] resize-y"
        />
        <div className="flex flex-wrap gap-2">
          <button
            onClick={processInput}
            className="px-4 py-2 bg-[#238636] hover:bg-[#2ea043] border border-[#2ea043] rounded text-white text-sm font-semibold transition-colors"
          >
            Add UIDs
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 bg-[#21262d] border border-[#30363d] rounded text-[#c9d1d9] text-sm hover:bg-[#30363d] transition-colors"
          >
            Import Files (up to 20)
          </button>
          <input ref={fileInputRef} type="file" multiple accept=".txt" className="hidden" onChange={handleFileInput} />
          <button
            onClick={() => setInput("")}
            className="px-4 py-2 bg-[#21262d] border border-[#30363d] rounded text-[#8b949e] text-sm hover:bg-[#30363d] transition-colors"
          >
            Clear Input
          </button>
        </div>
      </div>

      {/* Fetch Controls */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 space-y-3">
        <div className="flex flex-wrap gap-2 items-center">
          <button
            onClick={fetchAll}
            disabled={isFetching}
            className="px-4 py-2 bg-[#1f6feb] hover:bg-[#388bfd] border border-[#1f6feb] rounded text-white text-sm font-semibold transition-colors disabled:opacity-50"
          >
            {isFetching ? "Fetching..." : "Fetch All UIDs"}
          </button>
          <button
            onClick={fetchUnfetched}
            disabled={isFetching}
            className="px-4 py-2 bg-[#21262d] border border-[#30363d] rounded text-[#c9d1d9] text-sm hover:bg-[#30363d] transition-colors disabled:opacity-50"
          >
            Fetch Unfetched
          </button>
          <button
            onClick={() => setShowPasswords((v) => !v)}
            className="px-4 py-2 bg-[#21262d] border border-[#30363d] rounded text-[#c9d1d9] text-sm hover:bg-[#30363d] transition-colors"
          >
            {showPasswords ? "Hide Passwords" : "Show Passwords"}
          </button>
        </div>
        {isFetching && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-[#8b949e]">
              <span>Progress: {fetchProgress}/{fetchTotal}</span>
              <span>✓ {fetchSuccess} | ✗ {fetchFailed}</span>
            </div>
            <div className="w-full bg-[#21262d] rounded-full h-2">
              <div
                className="bg-[#1f6feb] h-2 rounded-full transition-all duration-300"
                style={{ width: `${fetchTotal > 0 ? (fetchProgress / fetchTotal) * 100 : 0}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 bg-[#161b22] border border-[#30363d] rounded-lg p-1">
        {(["all", "unchecked", "checked", "saved"] as FilterTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilterTab(tab)}
            className={`flex-1 py-1.5 rounded text-sm font-medium capitalize transition-colors ${
              filterTab === tab
                ? "bg-[#21262d] text-[#c9d1d9]"
                : "text-[#8b949e] hover:text-[#c9d1d9]"
            }`}
          >
            {tab} {tab === "all" ? `(${entries.length})` : tab === "unchecked" ? `(${entries.filter(e=>!e.checked).length})` : tab === "checked" ? `(${entries.filter(e=>e.checked).length})` : `(${entries.filter(e=>e.saved).length})`}
          </button>
        ))}
      </div>

      {/* Search + Sort + Bulk Actions */}
      <div className="flex flex-wrap gap-2 items-center">
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search UID, name, note..."
          className="flex-1 min-w-40 bg-[#0d1117] border border-[#30363d] rounded px-3 py-2 text-[#c9d1d9] text-sm placeholder-[#484f58] focus:outline-none focus:border-[#58a6ff]"
        />
        <select
          value={sortMode}
          onChange={(e) => setSortMode(e.target.value as SortMode)}
          className="bg-[#21262d] border border-[#30363d] rounded px-3 py-2 text-[#c9d1d9] text-sm"
        >
          <option value="none">Sort: Default</option>
          <option value="most_friends">Most Friends</option>
          <option value="least_friends">Least Friends</option>
          <option value="unlocked_first">Unlocked First</option>
          <option value="locked_first">Locked First</option>
        </select>
      </div>

      {/* Multi-select actions */}
      <div className="flex flex-wrap gap-2 items-center">
        <button onClick={selectAll} className="px-3 py-1.5 bg-[#21262d] border border-[#30363d] rounded text-xs text-[#c9d1d9] hover:bg-[#30363d]">Select All</button>
        <button onClick={deselectAll} className="px-3 py-1.5 bg-[#21262d] border border-[#30363d] rounded text-xs text-[#c9d1d9] hover:bg-[#30363d]">Deselect All</button>
        {selectedIds.size > 0 && (
          <>
            <span className="text-xs text-[#8b949e]">{selectedIds.size} selected</span>
            <button onClick={saveSelected} className="px-3 py-1.5 bg-[#238636] border border-[#2ea043] rounded text-xs text-white hover:bg-[#2ea043]">Save Selected</button>
            <button onClick={copySelected} className="px-3 py-1.5 bg-[#21262d] border border-[#30363d] rounded text-xs text-[#c9d1d9] hover:bg-[#30363d]">Copy Selected</button>
            <button onClick={removeSelected} className="px-3 py-1.5 bg-[#da3633] border border-[#f85149] rounded text-xs text-white hover:bg-[#f85149]">Remove Selected</button>
          </>
        )}
        <button onClick={checkAll} className="px-3 py-1.5 bg-[#21262d] border border-[#30363d] rounded text-xs text-[#c9d1d9] hover:bg-[#30363d]">✓ Check All</button>
        <button onClick={uncheckAll} className="px-3 py-1.5 bg-[#21262d] border border-[#30363d] rounded text-xs text-[#c9d1d9] hover:bg-[#30363d]">✗ Uncheck All</button>
        <button
          onClick={handleClear}
          className={`px-3 py-1.5 border rounded text-xs transition-colors ${
            clearCount > 0
              ? "bg-[#da3633] border-[#f85149] text-white"
              : "bg-[#21262d] border-[#30363d] text-[#f85149]"
          }`}
        >
          {clearCount > 0 ? "Tap Again to Clear All" : "Clear All"}
        </button>
      </div>

      {/* Tools & Export Panel */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg">
        <button
          onClick={() => setToolsOpen((v) => !v)}
          className="w-full px-4 py-3 flex items-center justify-between text-[#c9d1d9] hover:bg-[#21262d] transition-colors rounded-lg text-sm font-semibold"
        >
          <span>🛠 Tools & Export</span>
          <span>{toolsOpen ? "▲" : "▼"}</span>
        </button>
        {toolsOpen && (
          <div className="px-4 pb-4 border-t border-[#30363d] pt-3 space-y-3">
            <div>
              <div className="text-xs text-[#8b949e] mb-2">Bulk Copy</div>
              <div className="flex flex-wrap gap-2">
                <button onClick={copyNames} className="px-3 py-1.5 bg-[#21262d] border border-[#30363d] rounded text-xs text-[#c9d1d9] hover:bg-[#30363d]">Copy Names</button>
                <button onClick={copyUnlocked} className="px-3 py-1.5 bg-[#21262d] border border-[#30363d] rounded text-xs text-[#3fb950] hover:bg-[#30363d]">Copy Unlocked</button>
                <button onClick={copyPrivate} className="px-3 py-1.5 bg-[#21262d] border border-[#30363d] rounded text-xs text-[#f85149] hover:bg-[#30363d]">Copy Private</button>
              </div>
            </div>
            <div>
              <div className="text-xs text-[#8b949e] mb-2">Export .txt</div>
              <div className="flex flex-wrap gap-2">
                {(["all", "checked", "unchecked", "saved"] as const).map((s) => (
                  <button key={s} onClick={() => exportData(s, "txt")} className="px-3 py-1.5 bg-[#21262d] border border-[#30363d] rounded text-xs text-[#c9d1d9] hover:bg-[#30363d] capitalize">{s}</button>
                ))}
              </div>
            </div>
            <div>
              <div className="text-xs text-[#8b949e] mb-2">Export .csv</div>
              <div className="flex flex-wrap gap-2">
                {(["all", "checked", "unchecked", "saved"] as const).map((s) => (
                  <button key={s} onClick={() => exportData(s, "csv")} className="px-3 py-1.5 bg-[#21262d] border border-[#30363d] rounded text-xs text-[#c9d1d9] hover:bg-[#30363d] capitalize">{s}</button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Entry List */}
      <div className="space-y-2">
        {filteredEntries.length === 0 ? (
          <div className="text-center py-12 text-[#8b949e]">
            {entries.length === 0 ? "No UIDs yet. Paste UID|PASS data above to get started." : "No entries match the current filter."}
          </div>
        ) : (
          filteredEntries.map((entry) => (
            <EntryCard
              key={entry.id}
              entry={entry}
              selected={selectedIds.has(entry.id)}
              showPassword={showPasswords}
              onToggleSelect={() => toggleSelect(entry.id)}
              onToggleCheck={() => toggleCheck(entry.id)}
              onToggleSave={() => toggleSave(entry.id)}
              onRemove={() => removeEntry(entry.id)}
              onCopy={(mode) => copyEntry(entry.id, mode)}
              onCopyName={() => copyName(entry.id)}
              onNoteChange={(note) => updateNote(entry.id, note)}
            />
          ))
        )}
      </div>
    </main>
  );
}

// ── StatCard Component ────────────────────────────────────────────────────────

function StatCard({ label, value, onClick, active, color }: {
  label: string;
  value: number;
  onClick: () => void;
  active: boolean;
  color: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`bg-[#161b22] border rounded-lg px-4 py-3 text-left transition-colors hover:bg-[#21262d] ${
        active ? "border-[#58a6ff]" : "border-[#30363d]"
      }`}
    >
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-xs text-[#8b949e]">{label}</div>
    </button>
  );
}

// ── EntryCard Component ───────────────────────────────────────────────────────

function EntryCard({
  entry,
  selected,
  showPassword,
  onToggleSelect,
  onToggleCheck,
  onToggleSave,
  onRemove,
  onCopy,
  onCopyName,
  onNoteChange,
}: {
  entry: UIDEntry;
  selected: boolean;
  showPassword: boolean;
  onToggleSelect: () => void;
  onToggleCheck: () => void;
  onToggleSave: () => void;
  onRemove: () => void;
  onCopy: (mode: "uid" | "pass" | "both") => void;
  onCopyName: () => void;
  onNoteChange: (note: string) => void;
}) {
  const [editingNote, setEditingNote] = useState(false);
  const [noteVal, setNoteVal] = useState(entry.note);

  const lockBadge = {
    unlocked: { text: "Unlocked", color: "text-[#3fb950] bg-[#0d2818] border-[#238636]" },
    private: { text: "Private", color: "text-[#f85149] bg-[#2d1319] border-[#da3633]" },
    not_found: { text: "Not Found", color: "text-[#8b949e] bg-[#21262d] border-[#30363d]" },
    invalid_token: { text: "Invalid Token", color: "text-[#d29922] bg-[#272115] border-[#9e6a03]" },
    unknown: { text: "Unknown", color: "text-[#8b949e] bg-[#21262d] border-[#30363d]" },
  };

  const badge = entry.lockStatus ? lockBadge[entry.lockStatus] : null;

  return (
    <div className={`bg-[#161b22] border rounded-lg p-3 transition-colors ${selected ? "border-[#58a6ff]" : "border-[#30363d]"} ${entry.saved ? "border-l-2 border-l-[#3fb950]" : ""}`}>
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggleSelect}
          className="mt-1 accent-[#58a6ff]"
        />

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-[#58a6ff] text-sm font-semibold truncate">{entry.uid}</span>
            {entry.name && (
              <span className="text-[#c9d1d9] text-sm">{entry.name}</span>
            )}
            {badge && (
              <span className={`px-2 py-0.5 rounded border text-xs font-medium ${badge.color}`}>
                {badge.text}
              </span>
            )}
            {!entry.fetched && (
              <span className="px-2 py-0.5 rounded border text-xs font-medium text-[#8b949e] bg-[#21262d] border-[#30363d]">
                Unfetched
              </span>
            )}
            {entry.friendCount !== null && (
              <span className="text-xs text-[#3fb950]">👥 {entry.friendCount.toLocaleString()}</span>
            )}
          </div>

          <div className="flex items-center gap-2 text-sm text-[#8b949e]">
            <span className="font-mono">
              {showPassword ? entry.pass : "••••••••"}
            </span>
          </div>

          {entry.note && !editingNote && (
            <div className="text-xs text-[#d29922] italic">{entry.note}</div>
          )}

          {editingNote && (
            <div className="flex gap-2">
              <input
                value={noteVal}
                onChange={(e) => setNoteVal(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") { onNoteChange(noteVal); setEditingNote(false); }
                  if (e.key === "Escape") { setNoteVal(entry.note); setEditingNote(false); }
                }}
                placeholder="Add note..."
                autoFocus
                className="flex-1 bg-[#0d1117] border border-[#30363d] rounded px-2 py-1 text-xs text-[#c9d1d9] focus:outline-none focus:border-[#58a6ff]"
              />
              <button onClick={() => { onNoteChange(noteVal); setEditingNote(false); }} className="px-2 py-1 bg-[#238636] rounded text-xs text-white">✓</button>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-1 shrink-0">
          <button onClick={onToggleCheck} title={entry.checked ? "Uncheck" : "Check"} className={`px-2 py-1 rounded text-xs border transition-colors ${entry.checked ? "bg-[#1f6feb] border-[#1f6feb] text-white" : "bg-[#21262d] border-[#30363d] text-[#c9d1d9] hover:bg-[#30363d]"}`}>
            {entry.checked ? "✓" : "○"}
          </button>
          <button onClick={onToggleSave} title={entry.saved ? "Unsave" : "Save"} className={`px-2 py-1 rounded text-xs border transition-colors ${entry.saved ? "bg-[#238636] border-[#2ea043] text-white" : "bg-[#21262d] border-[#30363d] text-[#c9d1d9] hover:bg-[#30363d]"}`}>
            {entry.saved ? "★" : "☆"}
          </button>
          <button onClick={() => onCopy("uid")} title="Copy UID" className="px-2 py-1 rounded text-xs bg-[#21262d] border border-[#30363d] text-[#c9d1d9] hover:bg-[#30363d]">ID</button>
          <button onClick={() => onCopy("pass")} title="Copy Pass" className="px-2 py-1 rounded text-xs bg-[#21262d] border border-[#30363d] text-[#c9d1d9] hover:bg-[#30363d]">PW</button>
          <button onClick={() => onCopy("both")} title="Copy Both" className="px-2 py-1 rounded text-xs bg-[#21262d] border border-[#30363d] text-[#c9d1d9] hover:bg-[#30363d]">⊕</button>
          {entry.name && (
            <button onClick={onCopyName} title="Copy Name" className="px-2 py-1 rounded text-xs bg-[#21262d] border border-[#30363d] text-[#c9d1d9] hover:bg-[#30363d]">📋</button>
          )}
          <button onClick={() => { setNoteVal(entry.note); setEditingNote(true); }} title="Note" className="px-2 py-1 rounded text-xs bg-[#21262d] border border-[#30363d] text-[#d29922] hover:bg-[#30363d]">✎</button>
          <button onClick={onRemove} title="Remove" className="px-2 py-1 rounded text-xs bg-[#21262d] border border-[#30363d] text-[#f85149] hover:bg-[#da3633] hover:text-white">✕</button>
        </div>
      </div>
    </div>
  );
}
