import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useFacebookLookup, useTrack } from '@workspace/api-client-react';

interface UIDEntry {
  uid: string;
  password: string;
  name?: string;
  friendCount?: number;
  lockStatus: 'unlocked' | 'private' | 'unfetched';
  isSaved: boolean;
  isChecked: boolean;
  note?: string;
}

type FilterTab = 'all' | 'unchecked' | 'checked' | 'saved';
type SortMode = 'none' | 'mostFriends' | 'leastFriends' | 'unlockedFirst' | 'lockedFirst';
type StatusFilter = 'all' | 'unlocked' | 'private' | 'unfetched';

function parseEntries(text: string): UIDEntry[] {
  return text
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      const [uid = '', password = ''] = line.split(':');
      return {
        uid: uid.trim(),
        password: password.trim(),
        lockStatus: 'unfetched' as const,
        isSaved: false,
        isChecked: false,
      };
    })
    .filter(e => e.uid);
}

export default function UIDManagerPage() {
  const [dark, setDark] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [entries, setEntries] = useState<UIDEntry[]>([]);
  const [filterTab, setFilterTab] = useState<FilterTab>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortMode, setSortMode] = useState<SortMode>('none');
  const [showPasswords, setShowPasswords] = useState(false);
  const [tokenOpen, setTokenOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [token, setToken] = useState('');
  const [cookie, setCookie] = useState('');
  const [fetchingAll, setFetchingAll] = useState(false);
  const [fetchProgress, setFetchProgress] = useState(0);
  const [clearCount, setClearCount] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lookupMutation = useFacebookLookup();
  const trackMutation = useTrack();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

  useEffect(() => {
    const saved = localStorage.getItem('fb-token');
    const savedCookie = localStorage.getItem('fb-cookie');
    if (saved) setToken(saved);
    if (savedCookie) setCookie(savedCookie);
  }, []);

  useEffect(() => {
    localStorage.setItem('fb-token', token);
    localStorage.setItem('fb-cookie', cookie);
  }, [token, cookie]);

  useEffect(() => {
    trackMutation.mutate({
      actionType: 'visit',
      deviceInfo: navigator.userAgent,
      ipAddress: 'client',
      screenSize: `${window.screen.width}x${window.screen.height}`,
      browserInfo: navigator.userAgent.split(' ').pop() ?? '',
      language: navigator.language,
      platform: navigator.platform,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const processInput = () => {
    const parsed = parseEntries(inputText);
    setEntries(parsed);
    setInputText('');
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files).slice(0, 20).filter(f => f.name.endsWith('.txt'));
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result as string;
        setInputText(prev => prev ? prev + '\n' + text : text);
      };
      reader.readAsText(file);
    });
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).slice(0, 20);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result as string;
        setInputText(prev => prev ? prev + '\n' + text : text);
      };
      reader.readAsText(file);
    });
  };

  const fetchUID = async (uid: string) => {
    if (!token) return;
    try {
      const result = await lookupMutation.mutateAsync({ uids: [uid], token, cookie: cookie || undefined });
      const r = result.results[0];
      if (r) {
        setEntries(prev => prev.map(e => e.uid === uid ? {
          ...e,
          name: r.name,
          friendCount: r.friendCount,
          lockStatus: r.error ? 'private' : (r.name ? 'unlocked' : 'private'),
        } : e));
      }
    } catch {
      // silently ignore fetch errors
    }
  };

  const fetchAll = async () => {
    if (!token || fetchingAll) return;
    setFetchingAll(true);
    setFetchProgress(0);
    const toFetch = entries.filter(e => e.lockStatus === 'unfetched');
    for (let i = 0; i < toFetch.length; i++) {
      const e = toFetch[i]!;
      await fetchUID(e.uid);
      setFetchProgress(Math.round(((i + 1) / toFetch.length) * 100));
      await new Promise(r => setTimeout(r, 200));
    }
    setFetchingAll(false);
  };

  const fetchAllOverwrite = async () => {
    if (!token || fetchingAll) return;
    setFetchingAll(true);
    setFetchProgress(0);
    for (let i = 0; i < entries.length; i++) {
      const e = entries[i]!;
      await fetchUID(e.uid);
      setFetchProgress(Math.round(((i + 1) / entries.length) * 100));
      await new Promise(r => setTimeout(r, 200));
    }
    setFetchingAll(false);
  };

  const handleClear = () => {
    setClearCount(prev => {
      if (prev >= 1) {
        setEntries([]);
        setInputText('');
        return 0;
      }
      setTimeout(() => setClearCount(0), 2000);
      return prev + 1;
    });
  };

  const toggleSave = (uid: string) => {
    setEntries(prev => prev.map(e => e.uid === uid ? { ...e, isSaved: !e.isSaved } : e));
  };

  const toggleCheck = (uid: string) => {
    setEntries(prev => prev.map(e => e.uid === uid ? { ...e, isChecked: !e.isChecked } : e));
  };

  const removeEntry = (uid: string) => {
    setEntries(prev => prev.filter(e => e.uid !== uid));
  };

  const copyEntry = (entry: UIDEntry) => {
    navigator.clipboard.writeText(`${entry.uid}:${entry.password}`);
  };

  const selectAll = () => setEntries(prev => prev.map(e => ({ ...e, isChecked: true })));
  const deselectAll = () => setEntries(prev => prev.map(e => ({ ...e, isChecked: false })));

  const saveSelected = () => setEntries(prev => prev.map(e => e.isChecked ? { ...e, isSaved: true } : e));
  const removeSelected = () => setEntries(prev => prev.filter(e => !e.isChecked));
  const copySelected = () => {
    const text = entries.filter(e => e.isChecked).map(e => `${e.uid}:${e.password}`).join('\n');
    navigator.clipboard.writeText(text);
  };

  const copyNames = () => {
    const text = entries.filter(e => e.name).map(e => e.name).join('\n');
    navigator.clipboard.writeText(text);
  };

  const copyUnlocked = () => {
    const text = entries.filter(e => e.lockStatus === 'unlocked').map(e => `${e.uid}:${e.password}`).join('\n');
    navigator.clipboard.writeText(text);
  };

  const copyPrivate = () => {
    const text = entries.filter(e => e.lockStatus === 'private').map(e => `${e.uid}:${e.password}`).join('\n');
    navigator.clipboard.writeText(text);
  };

  const exportData = (type: 'all' | 'checked' | 'unchecked' | 'saved', format: 'txt' | 'csv') => {
    let data = entries;
    if (type === 'checked') data = entries.filter(e => e.isChecked);
    if (type === 'unchecked') data = entries.filter(e => !e.isChecked);
    if (type === 'saved') data = entries.filter(e => e.isSaved);

    let content = '';
    if (format === 'txt') {
      content = data.map(e => `${e.uid}:${e.password}`).join('\n');
    } else {
      content = 'UID,Password,Name,Friends,Status\n' +
        data.map(e => `${e.uid},${e.password},${e.name ?? ''},${e.friendCount ?? ''},${e.lockStatus}`).join('\n');
    }

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `uids-${type}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const sortedFiltered = () => {
    let result = [...entries];

    if (filterTab === 'checked') result = result.filter(e => e.isChecked);
    if (filterTab === 'unchecked') result = result.filter(e => !e.isChecked);
    if (filterTab === 'saved') result = result.filter(e => e.isSaved);

    if (statusFilter === 'unlocked') result = result.filter(e => e.lockStatus === 'unlocked');
    if (statusFilter === 'private') result = result.filter(e => e.lockStatus === 'private');
    if (statusFilter === 'unfetched') result = result.filter(e => e.lockStatus === 'unfetched');

    if (sortMode === 'mostFriends') result.sort((a, b) => (b.friendCount ?? -1) - (a.friendCount ?? -1));
    if (sortMode === 'leastFriends') result.sort((a, b) => (a.friendCount ?? Infinity) - (b.friendCount ?? Infinity));
    if (sortMode === 'unlockedFirst') result.sort((a, b) => (a.lockStatus === 'unlocked' ? -1 : 1) - (b.lockStatus === 'unlocked' ? -1 : 1));
    if (sortMode === 'lockedFirst') result.sort((a, b) => (a.lockStatus === 'private' ? -1 : 1) - (b.lockStatus === 'private' ? -1 : 1));

    return result;
  };

  const stats = {
    unlocked: entries.filter(e => e.lockStatus === 'unlocked').length,
    private: entries.filter(e => e.lockStatus === 'private').length,
    unfetched: entries.filter(e => e.lockStatus === 'unfetched').length,
    totalFriends: entries.reduce((s, e) => s + (e.friendCount ?? 0), 0),
  };

  const display = sortedFiltered();

  return (
    <div className={`min-h-screen bg-gray-950 text-gray-100 ${dark ? 'dark' : ''}`}>
      {/* Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="w-64 bg-gray-900 border-r border-cyan-900 p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-cyan-400 font-bold text-lg">Menu</span>
              <button onClick={() => setDrawerOpen(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>
            <Link to="/" className="text-cyan-300 hover:text-cyan-100 py-2 border-b border-gray-800" onClick={() => setDrawerOpen(false)}>🏠 UID Manager</Link>
            <Link to="/dumping-system" className="text-cyan-300 hover:text-cyan-100 py-2 border-b border-gray-800" onClick={() => setDrawerOpen(false)}>⬇️ Dumping System</Link>
            <Link to="/file-tools" className="text-cyan-300 hover:text-cyan-100 py-2 border-b border-gray-800" onClick={() => setDrawerOpen(false)}>🗂️ File Tools</Link>
            <Link to="/admin-panel-x7k9" className="text-cyan-300 hover:text-cyan-100 py-2" onClick={() => setDrawerOpen(false)}>🔐 Admin Panel</Link>
          </div>
          <div className="flex-1 bg-black/50" onClick={() => setDrawerOpen(false)} />
        </div>
      )}

      {/* Header */}
      <header className="bg-gray-900 border-b border-cyan-900 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <button onClick={() => setDrawerOpen(true)} className="text-cyan-400 hover:text-cyan-200 text-xl">☰</button>
          <h1 className="text-xl font-bold text-cyan-400 tracking-wider">FB UID Manager Pro</h1>
        </div>
        <button onClick={() => setDark(!dark)} className="text-gray-400 hover:text-yellow-300 text-xl">
          {dark ? '☀️' : '🌙'}
        </button>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-4">
        {/* Input Area */}
        <div
          className={`border-2 rounded-lg p-4 transition-colors ${isDragging ? 'border-cyan-400 bg-cyan-950/30' : 'border-gray-700 bg-gray-900'}`}
          onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-400">Paste UIDs (uid:password format) or drag .txt files</span>
            <span className="text-xs text-cyan-500">{inputText.split('\n').filter(Boolean).length} lines</span>
          </div>
          <textarea
            className="w-full bg-gray-950 border border-gray-700 rounded p-3 text-sm font-mono text-gray-200 focus:outline-none focus:border-cyan-600 h-32 resize-none"
            placeholder={'100123456789:password123\n200987654321:mypassword\n...'}
            value={inputText}
            onChange={e => setInputText(e.target.value)}
          />
          <div className="flex gap-2 mt-2 flex-wrap">
            <button
              onClick={processInput}
              className="bg-cyan-700 hover:bg-cyan-600 text-white px-5 py-2 rounded font-semibold text-sm transition-colors"
            >
              ▶ Process
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-gray-700 hover:bg-gray-600 text-gray-200 px-4 py-2 rounded text-sm"
            >
              📁 Load Files
            </button>
            <button
              onClick={handleClear}
              className={`px-4 py-2 rounded text-sm transition-colors ${clearCount > 0 ? 'bg-red-700 hover:bg-red-600 text-white animate-pulse' : 'bg-gray-700 hover:bg-gray-600 text-gray-200'}`}
            >
              {clearCount > 0 ? '⚠ Tap again to clear' : '🗑 Clear'}
            </button>
            <input ref={fileInputRef} type="file" accept=".txt" multiple className="hidden" onChange={handleFileInput} />
          </div>
        </div>

        {/* Token & Cookie */}
        <div className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
          <button
            className="w-full flex items-center justify-between px-4 py-3 text-sm text-gray-300 hover:bg-gray-800"
            onClick={() => setTokenOpen(!tokenOpen)}
          >
            <span className="font-semibold text-cyan-400">🔑 Token &amp; Cookie</span>
            <span>{tokenOpen ? '▲' : '▼'}</span>
          </button>
          {tokenOpen && (
            <div className="px-4 pb-4 space-y-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Access Token</label>
                <input
                  type={showPasswords ? 'text' : 'password'}
                  className="w-full bg-gray-950 border border-gray-700 rounded p-2 text-sm text-gray-200 focus:outline-none focus:border-cyan-600"
                  placeholder="EAABwz..."
                  value={token}
                  onChange={e => setToken(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Cookie (optional)</label>
                <input
                  type={showPasswords ? 'text' : 'password'}
                  className="w-full bg-gray-950 border border-gray-700 rounded p-2 text-sm text-gray-200 focus:outline-none focus:border-cyan-600"
                  placeholder="c_user=..."
                  value={cookie}
                  onChange={e => setCookie(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>

        {entries.length > 0 && (
          <>
            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <button
                onClick={() => setStatusFilter(statusFilter === 'unlocked' ? 'all' : 'unlocked')}
                className={`rounded-lg p-3 text-center transition-all border ${statusFilter === 'unlocked' ? 'bg-green-900 border-green-500' : 'bg-gray-900 border-gray-700 hover:border-green-700'}`}
              >
                <div className="text-2xl font-bold text-green-400">{stats.unlocked}</div>
                <div className="text-xs text-gray-400">Unlocked</div>
              </button>
              <button
                onClick={() => setStatusFilter(statusFilter === 'private' ? 'all' : 'private')}
                className={`rounded-lg p-3 text-center transition-all border ${statusFilter === 'private' ? 'bg-red-900 border-red-500' : 'bg-gray-900 border-gray-700 hover:border-red-700'}`}
              >
                <div className="text-2xl font-bold text-red-400">{stats.private}</div>
                <div className="text-xs text-gray-400">Private</div>
              </button>
              <button
                onClick={() => setStatusFilter(statusFilter === 'unfetched' ? 'all' : 'unfetched')}
                className={`rounded-lg p-3 text-center transition-all border ${statusFilter === 'unfetched' ? 'bg-yellow-900 border-yellow-500' : 'bg-gray-900 border-gray-700 hover:border-yellow-700'}`}
              >
                <div className="text-2xl font-bold text-yellow-400">{stats.unfetched}</div>
                <div className="text-xs text-gray-400">Unfetched</div>
              </button>
              <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-cyan-400">{stats.totalFriends.toLocaleString()}</div>
                <div className="text-xs text-gray-400">Total Friends</div>
              </div>
            </div>

            {/* Controls */}
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 space-y-3">
              {/* Filter Tabs */}
              <div className="flex gap-1 flex-wrap">
                {(['all', 'unchecked', 'checked', 'saved'] as FilterTab[]).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setFilterTab(tab)}
                    className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${filterTab === tab ? 'bg-cyan-700 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>

              {/* Sort + Options row */}
              <div className="flex gap-2 flex-wrap items-center">
                <select
                  value={sortMode}
                  onChange={e => setSortMode(e.target.value as SortMode)}
                  className="bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded px-2 py-1.5"
                >
                  <option value="none">Sort: Default</option>
                  <option value="mostFriends">Most Friends</option>
                  <option value="leastFriends">Least Friends</option>
                  <option value="unlockedFirst">Unlocked First</option>
                  <option value="lockedFirst">Locked First</option>
                </select>
                <button
                  onClick={() => setShowPasswords(!showPasswords)}
                  className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded text-sm"
                >
                  {showPasswords ? '🙈 Hide PWD' : '👁 Show PWD'}
                </button>
                <button onClick={selectAll} className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded text-sm">✓ Select All</button>
                <button onClick={deselectAll} className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded text-sm">✗ Deselect</button>
              </div>

              {/* Bulk Actions */}
              <div className="flex gap-2 flex-wrap">
                <button onClick={saveSelected} className="bg-green-800 hover:bg-green-700 text-white px-3 py-1.5 rounded text-sm">💾 Save Selected</button>
                <button onClick={copySelected} className="bg-blue-800 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-sm">📋 Copy Selected</button>
                <button onClick={removeSelected} className="bg-red-900 hover:bg-red-800 text-white px-3 py-1.5 rounded text-sm">🗑 Remove Selected</button>
                <button onClick={copyNames} className="bg-purple-900 hover:bg-purple-800 text-white px-3 py-1.5 rounded text-sm">📝 Copy Names</button>
                <button onClick={copyUnlocked} className="bg-green-900 hover:bg-green-800 text-white px-3 py-1.5 rounded text-sm">🔓 Copy Unlocked</button>
                <button onClick={copyPrivate} className="bg-red-900 hover:bg-red-800 text-white px-3 py-1.5 rounded text-sm">🔒 Copy Private</button>
              </div>

              {/* Fetch Buttons */}
              <div className="flex gap-2 flex-wrap items-center">
                <button
                  onClick={fetchAll}
                  disabled={fetchingAll || !token}
                  className="bg-cyan-800 hover:bg-cyan-700 disabled:opacity-50 text-white px-4 py-2 rounded text-sm font-semibold"
                >
                  ⚡ Fetch Unfetched
                </button>
                <button
                  onClick={fetchAllOverwrite}
                  disabled={fetchingAll || !token}
                  className="bg-teal-800 hover:bg-teal-700 disabled:opacity-50 text-white px-4 py-2 rounded text-sm font-semibold"
                >
                  🔄 Fetch All
                </button>
                {fetchingAll && (
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-gray-800 rounded-full h-2">
                      <div className="bg-cyan-500 h-2 rounded-full transition-all" style={{ width: `${fetchProgress}%` }} />
                    </div>
                    <span className="text-xs text-cyan-400">{fetchProgress}%</span>
                  </div>
                )}
                {!token && <span className="text-xs text-yellow-500">Set token first</span>}
              </div>
            </div>

            {/* Entry Cards */}
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-sm text-gray-400">Showing {display.length} of {entries.length} entries</span>
              </div>
              {display.map(entry => (
                <div
                  key={entry.uid}
                  className={`bg-gray-900 border rounded-lg p-3 transition-all ${entry.isSaved ? 'border-green-800' : entry.isChecked ? 'border-cyan-800' : 'border-gray-700'}`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={entry.isChecked}
                      onChange={() => toggleCheck(entry.uid)}
                      className="mt-1 accent-cyan-500"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-sm text-cyan-300 truncate">{entry.uid}</span>
                        {entry.name && <span className="text-sm text-white font-medium">{entry.name}</span>}
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                          entry.lockStatus === 'unlocked' ? 'bg-green-900 text-green-300' :
                          entry.lockStatus === 'private' ? 'bg-red-900 text-red-300' :
                          'bg-gray-800 text-gray-400'
                        }`}>
                          {entry.lockStatus === 'unlocked' ? '🔓 Unlocked' : entry.lockStatus === 'private' ? '🔒 Private' : '❓ Unfetched'}
                        </span>
                        {entry.friendCount !== undefined && (
                          <span className="text-xs bg-blue-900 text-blue-300 px-2 py-0.5 rounded-full">
                            👥 {entry.friendCount.toLocaleString()}
                          </span>
                        )}
                        {entry.isSaved && <span className="text-xs bg-green-900 text-green-400 px-2 py-0.5 rounded-full">💾 Saved</span>}
                      </div>
                      {showPasswords && (
                        <div className="mt-1 text-xs font-mono text-gray-500">{entry.password}</div>
                      )}
                      {editingNote === entry.uid ? (
                        <div className="mt-2 flex gap-2">
                          <input
                            type="text"
                            className="flex-1 bg-gray-950 border border-gray-700 rounded px-2 py-1 text-xs text-gray-200"
                            value={notes[entry.uid] ?? ''}
                            onChange={e => setNotes(prev => ({ ...prev, [entry.uid]: e.target.value }))}
                            placeholder="Add note..."
                            autoFocus
                          />
                          <button onClick={() => setEditingNote(null)} className="text-xs text-cyan-400 hover:text-cyan-200">Save</button>
                        </div>
                      ) : notes[entry.uid] ? (
                        <div className="mt-1 text-xs text-yellow-400 cursor-pointer" onClick={() => setEditingNote(entry.uid)}>
                          📌 {notes[entry.uid]}
                        </div>
                      ) : null}
                    </div>
                    <div className="flex gap-1 flex-shrink-0 flex-wrap justify-end">
                      <button onClick={() => fetchUID(entry.uid)} disabled={!token} title="Fetch" className="text-xs bg-cyan-900 hover:bg-cyan-800 disabled:opacity-40 text-cyan-300 px-2 py-1 rounded">🔍</button>
                      <button onClick={() => { navigator.clipboard.writeText(entry.name ?? ''); }} disabled={!entry.name} title="Copy Name" className="text-xs bg-purple-900 hover:bg-purple-800 disabled:opacity-40 text-purple-300 px-2 py-1 rounded">📝</button>
                      <button onClick={() => copyEntry(entry)} title="Copy UID:PWD" className="text-xs bg-blue-900 hover:bg-blue-800 text-blue-300 px-2 py-1 rounded">📋</button>
                      <button onClick={() => toggleSave(entry.uid)} title={entry.isSaved ? 'Unsave' : 'Save'} className={`text-xs px-2 py-1 rounded ${entry.isSaved ? 'bg-green-900 hover:bg-green-800 text-green-300' : 'bg-gray-800 hover:bg-gray-700 text-gray-300'}`}>💾</button>
                      <button onClick={() => setEditingNote(editingNote === entry.uid ? null : entry.uid)} title="Note" className="text-xs bg-yellow-900 hover:bg-yellow-800 text-yellow-300 px-2 py-1 rounded">📌</button>
                      <button onClick={() => removeEntry(entry.uid)} title="Remove" className="text-xs bg-red-900 hover:bg-red-800 text-red-300 px-2 py-1 rounded">✕</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Tools & Export */}
            <div className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
              <button
                className="w-full flex items-center justify-between px-4 py-3 text-sm text-gray-300 hover:bg-gray-800"
                onClick={() => setToolsOpen(!toolsOpen)}
              >
                <span className="font-semibold text-cyan-400">🛠 Tools &amp; Export</span>
                <span>{toolsOpen ? '▲' : '▼'}</span>
              </button>
              {toolsOpen && (
                <div className="px-4 pb-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {(['all', 'checked', 'unchecked', 'saved'] as const).map(type =>
                      (['txt', 'csv'] as const).map(fmt => (
                        <button
                          key={`${type}-${fmt}`}
                          onClick={() => exportData(type, fmt)}
                          className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-2 rounded text-xs"
                        >
                          ⬇ Export {type} (.{fmt})
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
