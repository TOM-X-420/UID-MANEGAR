import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';

type Tool = 'merge' | 'dedup' | 'split' | 'filter' | 'sort' | 'stats';

export default function FileToolsPage() {
  const [activeTool, setActiveTool] = useState<Tool>('merge');
  const [input, setInput] = useState('');
  const [input2, setInput2] = useState('');
  const [output, setOutput] = useState('');
  const [keyword, setKeyword] = useState('');
  const [splitSize, setSplitSize] = useState(100);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const fileRef = useRef<HTMLInputElement>(null);
  const file2Ref = useRef<HTMLInputElement>(null);

  const loadFile = (setter: (v: string) => void, ref: React.RefObject<HTMLInputElement | null>) => {
    ref.current?.click();
    if (ref.current) {
      ref.current.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = ev => setter(ev.target?.result as string);
        reader.readAsText(file);
      };
    }
  };

  const downloadOutput = () => {
    const blob = new Blob([output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'output.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const runMerge = () => {
    const lines = [...input.split('\n'), ...input2.split('\n')].filter(Boolean);
    setOutput(lines.join('\n'));
  };

  const runDedup = () => {
    const lines = [...new Set(input.split('\n').filter(Boolean))];
    setOutput(lines.join('\n'));
  };

  const runSplit = () => {
    const lines = input.split('\n').filter(Boolean);
    const parts: string[] = [];
    for (let i = 0; i < lines.length; i += splitSize) {
      parts.push(`=== Part ${Math.floor(i / splitSize) + 1} ===\n` + lines.slice(i, i + splitSize).join('\n'));
    }
    setOutput(parts.join('\n\n'));
  };

  const runFilter = () => {
    const lines = input.split('\n').filter(l => l.toLowerCase().includes(keyword.toLowerCase()));
    setOutput(lines.join('\n'));
  };

  const runSort = () => {
    const lines = input.split('\n').filter(Boolean).sort();
    if (sortDir === 'desc') lines.reverse();
    setOutput(lines.join('\n'));
  };

  const runStats = () => {
    const lines = input.split('\n').filter(Boolean);
    const unique = new Set(lines).size;
    const dupes = lines.length - unique;
    const withColon = lines.filter(l => l.includes(':')).length;
    const lengths = lines.map(l => l.length);
    const stats = [
      `Total lines: ${lines.length}`,
      `Unique lines: ${unique}`,
      `Duplicates: ${dupes}`,
      `Lines with ':' (uid:pass): ${withColon}`,
      `Average length: ${lines.length ? Math.round(lengths.reduce((s, l) => s + l, 0) / lines.length) : 0}`,
      `Longest line: ${lengths.length ? Math.max(...lengths) : 0}`,
      `Shortest line: ${lengths.length ? Math.min(...lengths) : 0}`,
    ];
    setOutput(stats.join('\n'));
  };

  const tools: { id: Tool; label: string; icon: string }[] = [
    { id: 'merge', label: 'Merge', icon: '🔀' },
    { id: 'dedup', label: 'Deduplicate', icon: '🧹' },
    { id: 'split', label: 'Split', icon: '✂️' },
    { id: 'filter', label: 'Filter', icon: '🔍' },
    { id: 'sort', label: 'Sort', icon: '📊' },
    { id: 'stats', label: 'Stats', icon: '📈' },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <header className="bg-gray-900 border-b border-cyan-900 px-4 py-3 flex items-center gap-4">
        <Link to="/" className="text-cyan-400 hover:text-cyan-200">← Back</Link>
        <h1 className="text-xl font-bold text-cyan-400">🗂️ File Tools</h1>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex gap-2 mb-6 flex-wrap">
          {tools.map(t => (
            <button
              key={t.id}
              onClick={() => { setActiveTool(t.id); setOutput(''); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTool === t.id ? 'bg-cyan-700 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm text-gray-400">Input{activeTool === 'merge' ? ' (File 1)' : ''}</label>
                <button onClick={() => loadFile(setInput, fileRef)} className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-2 py-1 rounded">📁 Load</button>
              </div>
              <textarea
                className="w-full bg-gray-950 border border-gray-700 rounded p-3 text-sm font-mono text-gray-200 h-48 focus:outline-none focus:border-cyan-600 resize-none"
                placeholder="Paste content or load file..."
                value={input}
                onChange={e => setInput(e.target.value)}
              />
              <div className="text-xs text-gray-500 mt-1">{input.split('\n').filter(Boolean).length} lines</div>
            </div>
            {activeTool === 'merge' && (
              <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm text-gray-400">Input (File 2)</label>
                  <button onClick={() => loadFile(setInput2, file2Ref)} className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-2 py-1 rounded">📁 Load</button>
                </div>
                <textarea
                  className="w-full bg-gray-950 border border-gray-700 rounded p-3 text-sm font-mono text-gray-200 h-32 focus:outline-none focus:border-cyan-600 resize-none"
                  value={input2}
                  onChange={e => setInput2(e.target.value)}
                />
              </div>
            )}
            {activeTool === 'filter' && (
              <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
                <label className="text-sm text-gray-400 mb-2 block">Keyword</label>
                <input
                  type="text"
                  className="w-full bg-gray-950 border border-gray-700 rounded p-2 text-sm text-gray-200"
                  value={keyword}
                  onChange={e => setKeyword(e.target.value)}
                  placeholder="Filter keyword..."
                />
              </div>
            )}
            {activeTool === 'split' && (
              <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
                <label className="text-sm text-gray-400 mb-2 block">Lines per part</label>
                <input
                  type="number"
                  className="w-full bg-gray-950 border border-gray-700 rounded p-2 text-sm text-gray-200"
                  value={splitSize}
                  onChange={e => setSplitSize(Number(e.target.value))}
                  min={1}
                />
              </div>
            )}
            {activeTool === 'sort' && (
              <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
                <label className="text-sm text-gray-400 mb-2 block">Sort Direction</label>
                <select
                  className="w-full bg-gray-950 border border-gray-700 rounded p-2 text-sm text-gray-200"
                  value={sortDir}
                  onChange={e => setSortDir(e.target.value as 'asc' | 'desc')}
                >
                  <option value="asc">Ascending (A-Z)</option>
                  <option value="desc">Descending (Z-A)</option>
                </select>
              </div>
            )}
            <button
              onClick={() => {
                if (activeTool === 'merge') runMerge();
                else if (activeTool === 'dedup') runDedup();
                else if (activeTool === 'split') runSplit();
                else if (activeTool === 'filter') runFilter();
                else if (activeTool === 'sort') runSort();
                else if (activeTool === 'stats') runStats();
              }}
              className="w-full bg-cyan-700 hover:bg-cyan-600 text-white py-2 rounded font-semibold"
            >
              ▶ Run {tools.find(t => t.id === activeTool)?.label}
            </button>
          </div>
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm text-gray-400">Output</label>
              {output && (
                <button onClick={downloadOutput} className="text-xs bg-cyan-900 hover:bg-cyan-800 text-cyan-300 px-3 py-1 rounded">⬇ Download</button>
              )}
            </div>
            <textarea
              className="w-full bg-gray-950 border border-gray-700 rounded p-3 text-sm font-mono text-gray-200 h-96 focus:outline-none focus:border-cyan-600 resize-none"
              value={output}
              readOnly
              placeholder="Output will appear here..."
            />
            <div className="text-xs text-gray-500 mt-1">{output.split('\n').filter(Boolean).length} lines</div>
          </div>
        </div>
        <input ref={fileRef} type="file" accept=".txt" className="hidden" />
        <input ref={file2Ref} type="file" accept=".txt" className="hidden" />
      </main>
    </div>
  );
}
