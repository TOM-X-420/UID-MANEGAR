import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "react-router-dom";

type Tool = "divider" | "mixer" | "remove-dupes" | "remove-stylish" | "cut-lines" | "separate-links";

const TOOLS: { id: Tool; label: string }[] = [
  { id: "divider", label: "[D] File Divider" },
  { id: "mixer", label: "[E] File Mixer" },
  { id: "remove-dupes", label: "[F] Remove Duplicates" },
  { id: "remove-stylish", label: "[G] Remove Stylish/Emoji" },
  { id: "cut-lines", label: "[H] Cut/Delete Lines" },
  { id: "separate-links", label: "[I] Separate Links" },
];

function downloadFile(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text).catch(() => {});
}

// Remove emoji & stylish characters
function removeStylish(text: string): string {
  return text
    .split("\n")
    .map((line) =>
      line
        // Remove emoji ranges
        .replace(/[\u{1F600}-\u{1F64F}]/gu, "")
        .replace(/[\u{1F300}-\u{1F5FF}]/gu, "")
        .replace(/[\u{1F680}-\u{1F6FF}]/gu, "")
        .replace(/[\u{1F1E0}-\u{1F1FF}]/gu, "")
        .replace(/[\u{2600}-\u{26FF}]/gu, "")
        .replace(/[\u{2700}-\u{27BF}]/gu, "")
        .replace(/[\u{FE00}-\u{FE0F}]/gu, "")
        .replace(/[\u{1F900}-\u{1F9FF}]/gu, "")
        .replace(/[\u{1FA00}-\u{1FA6F}]/gu, "")
        .replace(/[\u{1FA70}-\u{1FAFF}]/gu, "")
        // Remove combining/diacritical marks
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[\u1AB0-\u1AFF]/g, "")
        .replace(/[\u1DC0-\u1DFF]/g, "")
        .replace(/[\u20D0-\u20FF]/g, "")
        .replace(/[\uFE20-\uFE2F]/g, "")
        // Remove stylish unicode alphabets
        .replace(/[\u{1D400}-\u{1D7FF}]/gu, "")
        .trim()
    )
    .join("\n");
}

export default function FileTools() {
  const [searchParams] = useSearchParams();
  const toolParam = searchParams.get("tool") as Tool | null;
  const [activeTool, setActiveTool] = useState<Tool>(toolParam ?? "divider");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (toolParam && TOOLS.find((t) => t.id === toolParam)) {
      setActiveTool(toolParam);
    }
  }, [toolParam]);

  // ── Tool-specific state ─────────────────────────────────────────────────────
  const [dividerSize, setDividerSize] = useState(1000);
  const [dividerFiles, setDividerFiles] = useState<string[]>([]);

  const [mixerFiles, setMixerFiles] = useState<{ name: string; content: string }[]>([]);
  const mixerFileRef = useRef<HTMLInputElement>(null);

  const [cutStart, setCutStart] = useState(1);
  const [cutEnd, setCutEnd] = useState(100);
  const [cutMode, setCutMode] = useState<"keep" | "delete">("keep");

  const [linksOutput, setLinksOutput] = useState("");
  const [textOutput, setTextOutput] = useState("");

  // ── File import ─────────────────────────────────────────────────────────────
  function importFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setInput(ev.target?.result as string ?? "");
    reader.readAsText(file);
  }

  // ── Tool Logic ──────────────────────────────────────────────────────────────

  function runTool() {
    const lines = input.split(/\r?\n/);

    switch (activeTool) {
      case "divider": {
        const chunks: string[] = [];
        for (let i = 0; i < lines.length; i += dividerSize) {
          chunks.push(lines.slice(i, i + dividerSize).join("\n"));
        }
        setDividerFiles(chunks);
        setOutput(`Split into ${chunks.length} files`);
        break;
      }
      case "mixer": {
        const combined = mixerFiles.flatMap((f) => f.content.split(/\r?\n/).filter(Boolean));
        // Shuffle
        for (let i = combined.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [combined[i], combined[j]] = [combined[j]!, combined[i]!];
        }
        setOutput(combined.join("\n"));
        break;
      }
      case "remove-dupes": {
        const unique = [...new Set(lines.filter(Boolean))];
        setOutput(unique.join("\n"));
        break;
      }
      case "remove-stylish": {
        setOutput(removeStylish(input));
        break;
      }
      case "cut-lines": {
        const start = Math.max(1, cutStart) - 1;
        const end = Math.min(lines.length, cutEnd);
        if (cutMode === "keep") {
          setOutput(lines.slice(start, end).join("\n"));
        } else {
          const result = [...lines.slice(0, start), ...lines.slice(end)];
          setOutput(result.join("\n"));
        }
        break;
      }
      case "separate-links": {
        const urlRegex = /https?:\/\/[^\s]+/g;
        const extractedLinks: string[] = [];
        const textWithoutLinks = lines.map((line) => {
          const links = line.match(urlRegex) ?? [];
          extractedLinks.push(...links);
          return line.replace(urlRegex, "").trim();
        }).filter(Boolean);
        setLinksOutput(extractedLinks.join("\n"));
        setTextOutput(textWithoutLinks.join("\n"));
        setOutput(extractedLinks.join("\n"));
        break;
      }
    }
  }

  function addMixerFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setMixerFiles((prev) => [
          ...prev,
          { name: file.name, content: ev.target?.result as string ?? "" },
        ]);
      };
      reader.readAsText(file);
    });
  }

  const outputLines = output.split("\n").filter(Boolean).length;

  return (
    <main className="max-w-6xl mx-auto px-4 py-6 space-y-4">
      <h1 className="text-2xl font-bold text-[#c9d1d9]">File Tools</h1>

      {/* Tab Bar */}
      <div className="flex flex-wrap gap-1 bg-[#161b22] border border-[#30363d] rounded-lg p-1">
        {TOOLS.map((tool) => (
          <button
            key={tool.id}
            onClick={() => { setActiveTool(tool.id); setOutput(""); setDividerFiles([]); }}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              activeTool === tool.id
                ? "bg-[#21262d] text-[#c9d1d9]"
                : "text-[#8b949e] hover:text-[#c9d1d9]"
            }`}
          >
            {tool.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Input Panel */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-[#c9d1d9]">Input</span>
            <span className="text-xs text-[#8b949e]">{input.split("\n").filter(Boolean).length} lines</span>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste data here or import a file..."
            rows={12}
            className="w-full bg-[#0d1117] border border-[#30363d] rounded px-3 py-2 text-[#c9d1d9] text-sm font-mono placeholder-[#484f58] focus:outline-none focus:border-[#58a6ff] resize-y"
          />
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 bg-[#21262d] border border-[#30363d] rounded text-sm text-[#c9d1d9] hover:bg-[#30363d]"
            >
              Import File
            </button>
            <input ref={fileInputRef} type="file" accept=".txt" className="hidden" onChange={importFile} />
            <button
              onClick={() => setInput("")}
              className="px-3 py-1.5 bg-[#21262d] border border-[#30363d] rounded text-sm text-[#8b949e] hover:bg-[#30363d]"
            >
              Clear
            </button>
          </div>

          {/* Tool-specific options */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 space-y-3">
            <div className="text-sm font-semibold text-[#c9d1d9]">
              {TOOLS.find((t) => t.id === activeTool)?.label}
            </div>

            {activeTool === "divider" && (
              <div>
                <label className="text-xs text-[#8b949e] mb-1 block">Lines per file</label>
                <input
                  type="number"
                  value={dividerSize}
                  onChange={(e) => setDividerSize(Number(e.target.value))}
                  className="w-32 bg-[#0d1117] border border-[#30363d] rounded px-3 py-2 text-[#c9d1d9] text-sm focus:outline-none focus:border-[#58a6ff]"
                />
              </div>
            )}

            {activeTool === "mixer" && (
              <div className="space-y-2">
                <button
                  onClick={() => mixerFileRef.current?.click()}
                  className="px-3 py-1.5 bg-[#21262d] border border-[#30363d] rounded text-sm text-[#c9d1d9] hover:bg-[#30363d]"
                >
                  Add Files
                </button>
                <input ref={mixerFileRef} type="file" accept=".txt" multiple className="hidden" onChange={addMixerFiles} />
                {mixerFiles.length > 0 && (
                  <div className="space-y-1">
                    {mixerFiles.map((f, i) => (
                      <div key={i} className="flex items-center justify-between text-xs text-[#8b949e]">
                        <span>{f.name}</span>
                        <button onClick={() => setMixerFiles((prev) => prev.filter((_, j) => j !== i))} className="text-[#f85149]">✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTool === "cut-lines" && (
              <div className="space-y-2">
                <div className="flex gap-3 items-center">
                  <div>
                    <label className="text-xs text-[#8b949e] mb-1 block">Start Line</label>
                    <input type="number" value={cutStart} onChange={(e) => setCutStart(Number(e.target.value))} className="w-24 bg-[#0d1117] border border-[#30363d] rounded px-2 py-1.5 text-[#c9d1d9] text-sm focus:outline-none focus:border-[#58a6ff]" />
                  </div>
                  <div>
                    <label className="text-xs text-[#8b949e] mb-1 block">End Line</label>
                    <input type="number" value={cutEnd} onChange={(e) => setCutEnd(Number(e.target.value))} className="w-24 bg-[#0d1117] border border-[#30363d] rounded px-2 py-1.5 text-[#c9d1d9] text-sm focus:outline-none focus:border-[#58a6ff]" />
                  </div>
                  <div>
                    <label className="text-xs text-[#8b949e] mb-1 block">Mode</label>
                    <select value={cutMode} onChange={(e) => setCutMode(e.target.value as "keep" | "delete")} className="bg-[#21262d] border border-[#30363d] rounded px-2 py-1.5 text-[#c9d1d9] text-sm">
                      <option value="keep">Keep</option>
                      <option value="delete">Delete</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={runTool}
              className="px-4 py-2 bg-[#1f6feb] hover:bg-[#388bfd] border border-[#1f6feb] rounded text-white text-sm font-semibold transition-colors"
            >
              Run
            </button>
          </div>
        </div>

        {/* Output Panel */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-[#c9d1d9]">Output</span>
            <span className="text-xs text-[#8b949e]">{outputLines} lines</span>
          </div>

          {activeTool === "separate-links" && output ? (
            <div className="space-y-3">
              <div>
                <div className="text-xs text-[#8b949e] mb-1">Links ({linksOutput.split("\n").filter(Boolean).length})</div>
                <textarea value={linksOutput} readOnly rows={6} className="w-full bg-[#0d1117] border border-[#30363d] rounded px-3 py-2 text-[#c9d1d9] text-sm font-mono focus:outline-none resize-y" />
                <div className="flex gap-2 mt-1">
                  <button onClick={() => copyToClipboard(linksOutput)} className="px-3 py-1 bg-[#21262d] border border-[#30363d] rounded text-xs text-[#c9d1d9] hover:bg-[#30363d]">Copy</button>
                  <button onClick={() => downloadFile(linksOutput, "links.txt")} className="px-3 py-1 bg-[#21262d] border border-[#30363d] rounded text-xs text-[#c9d1d9] hover:bg-[#30363d]">Download</button>
                </div>
              </div>
              <div>
                <div className="text-xs text-[#8b949e] mb-1">Text without links</div>
                <textarea value={textOutput} readOnly rows={6} className="w-full bg-[#0d1117] border border-[#30363d] rounded px-3 py-2 text-[#c9d1d9] text-sm font-mono focus:outline-none resize-y" />
                <div className="flex gap-2 mt-1">
                  <button onClick={() => copyToClipboard(textOutput)} className="px-3 py-1 bg-[#21262d] border border-[#30363d] rounded text-xs text-[#c9d1d9] hover:bg-[#30363d]">Copy</button>
                  <button onClick={() => downloadFile(textOutput, "text_without_links.txt")} className="px-3 py-1 bg-[#21262d] border border-[#30363d] rounded text-xs text-[#c9d1d9] hover:bg-[#30363d]">Download</button>
                </div>
              </div>
            </div>
          ) : activeTool === "divider" && dividerFiles.length > 0 ? (
            <div className="space-y-2">
              <div className="text-sm text-[#8b949e]">{dividerFiles.length} files created</div>
              {dividerFiles.map((chunk, i) => (
                <div key={i} className="flex items-center justify-between bg-[#0d1117] border border-[#30363d] rounded px-3 py-2">
                  <span className="text-xs text-[#c9d1d9]">Part {i + 1} ({chunk.split("\n").filter(Boolean).length} lines)</span>
                  <div className="flex gap-2">
                    <button onClick={() => copyToClipboard(chunk)} className="px-2 py-1 bg-[#21262d] border border-[#30363d] rounded text-xs text-[#c9d1d9] hover:bg-[#30363d]">Copy</button>
                    <button onClick={() => downloadFile(chunk, `part_${i + 1}.txt`)} className="px-2 py-1 bg-[#21262d] border border-[#30363d] rounded text-xs text-[#c9d1d9] hover:bg-[#30363d]">DL</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              <textarea
                value={output}
                readOnly
                placeholder="Output will appear here..."
                rows={12}
                className="w-full bg-[#0d1117] border border-[#30363d] rounded px-3 py-2 text-[#c9d1d9] text-sm font-mono placeholder-[#484f58] focus:outline-none resize-y"
              />
              {output && (
                <div className="flex gap-2 flex-wrap">
                  <button onClick={() => copyToClipboard(output)} className="px-3 py-1.5 bg-[#21262d] border border-[#30363d] rounded text-sm text-[#c9d1d9] hover:bg-[#30363d]">Copy</button>
                  <button onClick={() => downloadFile(output, "output.txt")} className="px-3 py-1.5 bg-[#21262d] border border-[#30363d] rounded text-sm text-[#c9d1d9] hover:bg-[#30363d]">Download</button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}
