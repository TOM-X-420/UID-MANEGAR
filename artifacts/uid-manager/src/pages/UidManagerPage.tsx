import React, { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Header } from "../components/Header";
import { Sidebar } from "../components/Sidebar";

interface UidEntry {
  id: string;
  uid: string;
  pass: string;
  checked: boolean;
  saved: boolean;
  note: string;
}

type FilterTab = "all" | "unchecked" | "checked" | "saved";

function parseLines(raw: string): UidEntry[] {
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [uid = "", pass = ""] = line.split("|");
      return {
        id: `${uid.trim()}-${Date.now()}-${Math.random()}`,
        uid: uid.trim(),
        pass: pass.trim(),
        checked: false,
        saved: false,
        note: "",
      };
    });
}

export function UidManagerPage() {
  const { t } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [rawInput, setRawInput] = useState("");
  const [entries, setEntries] = useState<UidEntry[]>([]);
  const [filter, setFilter] = useState<FilterTab>("all");
  const [search, setSearch] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const lineCount = rawInput.split("\n").filter(Boolean).length;

  const handleProcess = useCallback(() => {
    const parsed = parseLines(rawInput);
    setEntries((prev) => [...prev, ...parsed]);
    setRawInput("");
  }, [rawInput]);

  const handleClear = useCallback(() => {
    setEntries([]);
    setSelected(new Set());
  }, []);

  const visible = entries.filter((e) => {
    if (filter === "checked" && !e.checked) return false;
    if (filter === "unchecked" && e.checked) return false;
    if (filter === "saved" && !e.saved) return false;
    if (search && !e.uid.includes(search)) return false;
    return true;
  });

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => setSelected(new Set(visible.map((e) => e.id)));
  const deselectAll = () => setSelected(new Set());

  const removeSelected = () => {
    setEntries((prev) => prev.filter((e) => !selected.has(e.id)));
    setSelected(new Set());
  };

  const copySelected = () => {
    const text = entries
      .filter((e) => selected.has(e.id))
      .map((e) => `${e.uid}|${e.pass}`)
      .join("\n");
    void navigator.clipboard.writeText(text);
  };

  const saveSelected = () => {
    setEntries((prev) =>
      prev.map((e) => (selected.has(e.id) ? { ...e, saved: true } : e))
    );
  };

  const toggleCheck = (id: string) => {
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, checked: !e.checked } : e))
    );
  };

  const checkAll = () =>
    setEntries((prev) =>
      prev.map((e) =>
        visible.some((v) => v.id === e.id) ? { ...e, checked: true } : e
      )
    );

  const uncheckAll = () =>
    setEntries((prev) =>
      prev.map((e) =>
        visible.some((v) => v.id === e.id) ? { ...e, checked: false } : e
      )
    );

  const filterTabs: { key: FilterTab; label: string }[] = [
    { key: "all", label: t("filterAll") },
    { key: "unchecked", label: t("filterUnchecked") },
    { key: "checked", label: t("filterChecked") },
    { key: "saved", label: t("filterSaved") },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <Header onMenuOpen={() => setSidebarOpen(true)} />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Input Area */}
        <section className="space-y-2">
          <div className="flex justify-between text-sm text-gray-400">
            <label htmlFor="uid-input">{t("pasteLabel")}</label>
            <span>
              {lineCount} {t("lineCount")}
            </span>
          </div>
          <textarea
            id="uid-input"
            value={rawInput}
            onChange={(e) => setRawInput(e.target.value)}
            className="w-full h-32 bg-gray-800 border border-gray-700 rounded p-3 text-sm font-mono resize-y focus:outline-none focus:border-blue-500"
            placeholder={t("pasteLabel")}
          />
          <div className="flex gap-2">
            <button
              onClick={handleProcess}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded text-sm font-medium transition-colors"
            >
              {t("processBtn")}
            </button>
            <button
              onClick={handleClear}
              className="px-4 py-2 bg-red-700 hover:bg-red-600 rounded text-sm font-medium transition-colors"
            >
              {t("clearBtn")}
            </button>
          </div>
        </section>

        {/* Filter Tabs */}
        <section>
          <div className="flex gap-2 border-b border-gray-700 pb-2">
            {filterTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  filter === tab.key
                    ? "bg-blue-600 text-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </section>

        {/* Search & Actions */}
        <section className="flex flex-wrap gap-2 items-center">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="flex-1 min-w-48 bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={selectAll}
            className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-sm"
          >
            {t("selectAll")}
          </button>
          <button
            onClick={deselectAll}
            className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-sm"
          >
            {t("deselectAll")}
          </button>
          <button
            onClick={saveSelected}
            className="px-3 py-1.5 bg-green-700 hover:bg-green-600 rounded text-sm"
          >
            {t("saveSelected")}
          </button>
          <button
            onClick={copySelected}
            className="px-3 py-1.5 bg-blue-700 hover:bg-blue-600 rounded text-sm"
          >
            {t("copySelected")}
          </button>
          <button
            onClick={removeSelected}
            className="px-3 py-1.5 bg-red-700 hover:bg-red-600 rounded text-sm"
          >
            {t("removeSelected")}
          </button>
          <button
            onClick={() => setShowPasswords((v) => !v)}
            className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-sm"
          >
            {showPasswords ? t("hidePasswords") : t("showPasswords")}
          </button>
          <button
            onClick={checkAll}
            className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-sm"
          >
            {t("checkAll")}
          </button>
          <button
            onClick={uncheckAll}
            className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-sm"
          >
            {t("uncheckAll")}
          </button>
        </section>

        {/* Entries List */}
        <section className="space-y-2">
          {visible.length === 0 && (
            <p className="text-gray-500 text-sm text-center py-8">
              {t("noEntries")}
            </p>
          )}
          {visible.map((entry) => (
            <div
              key={entry.id}
              className={`flex items-start gap-3 p-3 rounded border ${
                entry.saved
                  ? "border-green-700 bg-green-950"
                  : entry.checked
                    ? "border-blue-700 bg-blue-950"
                    : "border-gray-700 bg-gray-900"
              }`}
            >
              <input
                type="checkbox"
                checked={selected.has(entry.id)}
                onChange={() => toggleSelect(entry.id)}
                className="mt-1 accent-blue-500"
              />
              <input
                type="checkbox"
                checked={entry.checked}
                onChange={() => toggleCheck(entry.id)}
                className="mt-1 accent-green-500"
              />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-mono break-all">{entry.uid}</div>
                {showPasswords && (
                  <div className="text-xs text-gray-400 font-mono break-all">
                    {entry.pass}
                  </div>
                )}
              </div>
              <div className="flex gap-1 flex-wrap">
                <button
                  onClick={() => void navigator.clipboard.writeText(entry.uid)}
                  className="px-2 py-0.5 text-xs bg-gray-700 hover:bg-gray-600 rounded"
                >
                  {t("copyUid")}
                </button>
                <button
                  onClick={() => void navigator.clipboard.writeText(entry.pass)}
                  className="px-2 py-0.5 text-xs bg-gray-700 hover:bg-gray-600 rounded"
                >
                  {t("copyPass")}
                </button>
                <button
                  onClick={() =>
                    void navigator.clipboard.writeText(
                      `${entry.uid}|${entry.pass}`
                    )
                  }
                  className="px-2 py-0.5 text-xs bg-gray-700 hover:bg-gray-600 rounded"
                >
                  {t("copyBoth")}
                </button>
                <button
                  onClick={() =>
                    setEntries((prev) =>
                      prev.map((e) =>
                        e.id === entry.id ? { ...e, saved: !e.saved } : e
                      )
                    )
                  }
                  className="px-2 py-0.5 text-xs bg-green-700 hover:bg-green-600 rounded"
                >
                  {t("save")}
                </button>
                <button
                  onClick={() =>
                    setEntries((prev) => prev.filter((e) => e.id !== entry.id))
                  }
                  className="px-2 py-0.5 text-xs bg-red-700 hover:bg-red-600 rounded"
                >
                  {t("remove")}
                </button>
              </div>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
