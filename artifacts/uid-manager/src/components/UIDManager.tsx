import { useState, useCallback, useRef } from 'react'
import LanguageToggle from './LanguageToggle'
import { useT, useLanguage } from '../i18n'

type FilterTab = 'all' | 'unchecked' | 'checked' | 'saved'
type LockStatus = 'unlocked' | 'private' | 'notFound' | 'invalidToken' | 'unknown' | null

interface UIDEntry {
  id: string
  uid: string
  pass: string
  checked: boolean
  saved: boolean
  note: string
  name: string | null
  friendCount: number | null
  lockStatus: LockStatus
}

function parseLines(raw: string): UIDEntry[] {
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const sep = line.indexOf('|')
      const uid = sep >= 0 ? line.slice(0, sep).trim() : line.trim()
      const pass = sep >= 0 ? line.slice(sep + 1).trim() : ''
      return {
        id: crypto.randomUUID(),
        uid,
        pass,
        checked: false,
        saved: false,
        note: '',
        name: null,
        friendCount: null,
        lockStatus: null,
      }
    })
}

export default function UIDManager() {
  const t = useT()
  const { language } = useLanguage()
  const [inputText, setInputText] = useState('')
  const [entries, setEntries] = useState<UIDEntry[]>([])
  const [filter, setFilter] = useState<FilterTab>('all')
  const [showPasses, setShowPasses] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [token, setToken] = useState('')
  const [cookie, setCookie] = useState('')
  const [tokenSectionOpen, setTokenSectionOpen] = useState(false)
  const [exportSectionOpen, setExportSectionOpen] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const clearTapRef = useRef(false)
  const clearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }, [])

  const processInput = useCallback(() => {
    if (!inputText.trim()) return
    const parsed = parseLines(inputText)
    setEntries((prev) => {
      const existingUids = new Set(prev.map((e) => e.uid))
      const newEntries = parsed.filter((e) => !existingUids.has(e.uid))
      return [...prev, ...newEntries]
    })
    setInputText('')
    showToast(t('toastProcessed'))
  }, [inputText, t, showToast])

  const handleClear = useCallback(() => {
    if (clearTapRef.current) {
      setEntries([])
      setSelectedIds(new Set())
      clearTapRef.current = false
      if (clearTimerRef.current) clearTimeout(clearTimerRef.current)
      showToast(t('toastCleared'))
    } else {
      clearTapRef.current = true
      showToast(t('toastClearConfirm'))
      clearTimerRef.current = setTimeout(() => {
        clearTapRef.current = false
      }, 2000)
    }
  }, [t, showToast])

  const filteredEntries = entries.filter((e) => {
    if (filter === 'checked') return e.checked
    if (filter === 'unchecked') return !e.checked
    if (filter === 'saved') return e.saved
    return true
  })

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectAll = () => setSelectedIds(new Set(filteredEntries.map((e) => e.id)))
  const deselectAll = () => setSelectedIds(new Set())

  const removeSelected = () => {
    setEntries((prev) => prev.filter((e) => !selectedIds.has(e.id)))
    setSelectedIds(new Set())
    showToast(t('toastRemoved'))
  }

  const saveSelected = () => {
    setEntries((prev) =>
      prev.map((e) => (selectedIds.has(e.id) ? { ...e, saved: true } : e)),
    )
    showToast(t('toastSaved'))
  }

  const copySelected = () => {
    const text = entries
      .filter((e) => selectedIds.has(e.id))
      .map((e) => (e.pass ? `${e.uid}|${e.pass}` : e.uid))
      .join('\n')
    navigator.clipboard.writeText(text).then(() => showToast(t('toastCopied')))
  }

  const removeEntry = (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id))
    showToast(t('toastRemoved'))
  }

  const saveEntry = (id: string) => {
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, saved: !e.saved } : e)),
    )
  }

  const copyEntry = (e: UIDEntry, mode: 'uid' | 'pass' | 'both') => {
    let text = ''
    if (mode === 'uid') text = e.uid
    else if (mode === 'pass') text = e.pass
    else text = e.pass ? `${e.uid}|${e.pass}` : e.uid
    navigator.clipboard.writeText(text).then(() => showToast(t('toastCopied')))
  }

  const lineCount = inputText ? inputText.split('\n').filter((l) => l.trim()).length : 0

  const isDark = theme === 'dark'
  const bg = isDark ? '#0d1117' : '#f6f8fa'
  const cardBg = isDark ? '#161b22' : '#ffffff'
  const border = isDark ? '#30363d' : '#d0d7de'
  const text = isDark ? '#e6edf3' : '#1f2328'
  const mutedText = isDark ? '#8b949e' : '#57606a'
  const accent = '#2ea44f'

  const stats = {
    total: entries.length,
    unlocked: entries.filter((e) => e.lockStatus === 'unlocked').length,
    private: entries.filter((e) => e.lockStatus === 'private').length,
    unfetched: entries.filter((e) => e.lockStatus === null).length,
    totalFriends: entries.reduce((sum, e) => sum + (e.friendCount ?? 0), 0),
  }

  const filterTabs: { key: FilterTab; label: string }[] = [
    { key: 'all', label: t('tabAll') },
    { key: 'unchecked', label: t('tabUnchecked') },
    { key: 'checked', label: t('tabChecked') },
    { key: 'saved', label: t('tabSaved') },
  ]

  return (
    <div
      dir="ltr"
      style={{
        background: bg,
        color: text,
        minHeight: '100vh',
        fontFamily: language === 'bn'
          ? "'SolaimanLipi', 'Kalpurush', 'Noto Sans Bengali', Arial, sans-serif"
          : "'Segoe UI', Arial, sans-serif",
        transition: 'background 0.2s, color 0.2s',
      }}
    >
      {/* Toast */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#1f6feb',
            color: '#fff',
            padding: '10px 24px',
            borderRadius: 8,
            fontSize: 14,
            zIndex: 1000,
            boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
          }}
        >
          {toast}
        </div>
      )}

      {/* Header */}
      <header
        style={{
          background: isDark ? '#161b22' : '#24292f',
          borderBottom: `1px solid ${isDark ? '#30363d' : '#30363d'}`,
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: 20, color: '#e6edf3' }}>{t('appTitle')}</h1>
          <p style={{ margin: 0, fontSize: 12, color: '#8b949e' }}>{t('appSubtitle')}</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.18)',
              borderRadius: 6,
              color: '#e6edf3',
              padding: '4px 12px',
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            {isDark ? '☀️ ' + t('lightTheme') : '🌙 ' + t('darkTheme')}
          </button>
          <LanguageToggle />
        </div>
      </header>

      <main style={{ maxWidth: 900, margin: '0 auto', padding: '16px 12px' }}>
        {/* Input section */}
        <section
          style={{
            background: cardBg,
            border: `1px solid ${border}`,
            borderRadius: 8,
            padding: 16,
            marginBottom: 16,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <label style={{ fontWeight: 600 }}>{t('inputLabel')}</label>
            <span style={{ fontSize: 12, color: mutedText }}>
              {lineCount} {t('lineCount')}
            </span>
          </div>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={t('inputPlaceholder')}
            rows={6}
            style={{
              width: '100%',
              background: isDark ? '#0d1117' : '#f6f8fa',
              color: text,
              border: `1px solid ${border}`,
              borderRadius: 6,
              padding: '8px 12px',
              fontSize: 13,
              fontFamily: 'monospace',
              resize: 'vertical',
            }}
          />
          <p style={{ margin: '6px 0 12px', fontSize: 12, color: mutedText }}>
            {t('dragDropHint')}
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={processInput}
              style={{
                background: accent,
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                padding: '8px 20px',
                fontWeight: 600,
                fontSize: 14,
              }}
            >
              {t('processBtn')}
            </button>
            <button
              onClick={handleClear}
              style={{
                background: isDark ? '#21262d' : '#f6f8fa',
                color: text,
                border: `1px solid ${border}`,
                borderRadius: 6,
                padding: '8px 20px',
                fontSize: 14,
              }}
            >
              {t('clearBtn')}
            </button>
          </div>
        </section>

        {/* Token & Cookie section */}
        <section
          style={{
            background: cardBg,
            border: `1px solid ${border}`,
            borderRadius: 8,
            marginBottom: 16,
          }}
        >
          <button
            onClick={() => setTokenSectionOpen(!tokenSectionOpen)}
            style={{
              width: '100%',
              textAlign: 'left',
              background: 'none',
              border: 'none',
              color: text,
              padding: '12px 16px',
              fontWeight: 600,
              fontSize: 14,
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            <span>🔑 {t('tokenSection')}</span>
            <span>{tokenSectionOpen ? '▲' : '▼'}</span>
          </button>
          {tokenSectionOpen && (
            <div style={{ padding: '0 16px 16px' }}>
              <div style={{ marginBottom: 10 }}>
                <label style={{ fontSize: 13, color: mutedText }}>{t('tokenLabel')}</label>
                <input
                  type="text"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder={t('tokenPlaceholder')}
                  style={{
                    width: '100%',
                    background: isDark ? '#0d1117' : '#f6f8fa',
                    color: text,
                    border: `1px solid ${border}`,
                    borderRadius: 6,
                    padding: '6px 10px',
                    fontSize: 13,
                    marginTop: 4,
                  }}
                />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 13, color: mutedText }}>{t('cookieLabel')}</label>
                <input
                  type="text"
                  value={cookie}
                  onChange={(e) => setCookie(e.target.value)}
                  placeholder={t('cookiePlaceholder')}
                  style={{
                    width: '100%',
                    background: isDark ? '#0d1117' : '#f6f8fa',
                    color: text,
                    border: `1px solid ${border}`,
                    borderRadius: 6,
                    padding: '6px 10px',
                    fontSize: 13,
                    marginTop: 4,
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => {
                    if (!token) { showToast(t('toastNoToken')); return }
                    showToast(t('toastFetchStarted'))
                  }}
                  style={{
                    background: accent,
                    color: '#fff',
                    border: 'none',
                    borderRadius: 6,
                    padding: '6px 16px',
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  {t('fetchAll')}
                </button>
                <button
                  onClick={() => {
                    if (!token) { showToast(t('toastNoToken')); return }
                    showToast(t('toastFetchStarted'))
                  }}
                  style={{
                    background: isDark ? '#21262d' : '#f6f8fa',
                    color: text,
                    border: `1px solid ${border}`,
                    borderRadius: 6,
                    padding: '6px 16px',
                    fontSize: 13,
                  }}
                >
                  {t('fetchUnfetched')}
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Stats row */}
        {entries.length > 0 && (
          <section
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
              gap: 10,
              marginBottom: 16,
            }}
          >
            {[
              { label: t('totalUIDs'), value: stats.total, color: '#58a6ff' },
              { label: t('unlocked'), value: stats.unlocked, color: '#3fb950' },
              { label: t('private'), value: stats.private, color: '#f78166' },
              { label: t('unfetched'), value: stats.unfetched, color: '#8b949e' },
              { label: t('totalFriends'), value: stats.totalFriends, color: '#d2a8ff' },
            ].map((stat) => (
              <div
                key={stat.label}
                style={{
                  background: cardBg,
                  border: `1px solid ${border}`,
                  borderRadius: 8,
                  padding: '12px 16px',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: 22, fontWeight: 700, color: stat.color }}>
                  {stat.value.toLocaleString()}
                </div>
                <div style={{ fontSize: 12, color: mutedText }}>{stat.label}</div>
              </div>
            ))}
          </section>
        )}

        {/* Filter tabs + bulk actions */}
        {entries.length > 0 && (
          <section style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 10 }}>
              {filterTabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  style={{
                    background: filter === tab.key ? accent : (isDark ? '#21262d' : '#f6f8fa'),
                    color: filter === tab.key ? '#fff' : text,
                    border: `1px solid ${filter === tab.key ? accent : border}`,
                    borderRadius: 6,
                    padding: '5px 14px',
                    fontSize: 13,
                    fontWeight: filter === tab.key ? 600 : 400,
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <button
                onClick={selectAll}
                style={{
                  background: isDark ? '#21262d' : '#f6f8fa',
                  color: text,
                  border: `1px solid ${border}`,
                  borderRadius: 5,
                  padding: '4px 12px',
                  fontSize: 12,
                }}
              >
                {t('selectAll')}
              </button>
              <button
                onClick={deselectAll}
                style={{
                  background: isDark ? '#21262d' : '#f6f8fa',
                  color: text,
                  border: `1px solid ${border}`,
                  borderRadius: 5,
                  padding: '4px 12px',
                  fontSize: 12,
                }}
              >
                {t('deselectAll')}
              </button>
              <button
                onClick={saveSelected}
                style={{
                  background: isDark ? '#21262d' : '#f6f8fa',
                  color: text,
                  border: `1px solid ${border}`,
                  borderRadius: 5,
                  padding: '4px 12px',
                  fontSize: 12,
                }}
              >
                {t('saveSelected')}
              </button>
              <button
                onClick={copySelected}
                style={{
                  background: isDark ? '#21262d' : '#f6f8fa',
                  color: text,
                  border: `1px solid ${border}`,
                  borderRadius: 5,
                  padding: '4px 12px',
                  fontSize: 12,
                }}
              >
                {t('copySelected')}
              </button>
              <button
                onClick={removeSelected}
                style={{
                  background: '#da3633',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 5,
                  padding: '4px 12px',
                  fontSize: 12,
                }}
              >
                {t('removeSelected')}
              </button>
              <button
                onClick={() =>
                  setEntries((prev) =>
                    prev.map((e) =>
                      filteredEntries.some((f) => f.id === e.id)
                        ? { ...e, checked: true }
                        : e,
                    ),
                  )
                }
                style={{
                  background: isDark ? '#21262d' : '#f6f8fa',
                  color: text,
                  border: `1px solid ${border}`,
                  borderRadius: 5,
                  padding: '4px 12px',
                  fontSize: 12,
                }}
              >
                {t('checkAll')}
              </button>
              <button
                onClick={() =>
                  setEntries((prev) =>
                    prev.map((e) =>
                      filteredEntries.some((f) => f.id === e.id)
                        ? { ...e, checked: false }
                        : e,
                    ),
                  )
                }
                style={{
                  background: isDark ? '#21262d' : '#f6f8fa',
                  color: text,
                  border: `1px solid ${border}`,
                  borderRadius: 5,
                  padding: '4px 12px',
                  fontSize: 12,
                }}
              >
                {t('uncheckAll')}
              </button>
            </div>
          </section>
        )}

        {/* UID List */}
        <section>
          {entries.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '40px 20px',
                color: mutedText,
                fontSize: 15,
              }}
            >
              {t('emptyState')}
            </div>
          ) : filteredEntries.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '30px 20px',
                color: mutedText,
                fontSize: 14,
              }}
            >
              {t('noResults')}
            </div>
          ) : (
            filteredEntries.map((entry) => (
              <div
                key={entry.id}
                style={{
                  background: cardBg,
                  border: `1px solid ${selectedIds.has(entry.id) ? '#1f6feb' : border}`,
                  borderRadius: 8,
                  padding: '12px 16px',
                  marginBottom: 8,
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 10,
                  alignItems: 'center',
                }}
              >
                <input
                  type="checkbox"
                  checked={entry.checked}
                  onChange={() =>
                    setEntries((prev) =>
                      prev.map((e) =>
                        e.id === entry.id ? { ...e, checked: !e.checked } : e,
                      ),
                    )
                  }
                  style={{ width: 16, height: 16, cursor: 'pointer' }}
                />
                <input
                  type="checkbox"
                  checked={selectedIds.has(entry.id)}
                  onChange={() => toggleSelect(entry.id)}
                  style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#1f6feb' }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: 600 }}>
                    {entry.uid}
                  </span>
                  {entry.name && (
                    <span style={{ marginLeft: 8, fontSize: 13, color: '#58a6ff' }}>
                      {entry.name}
                    </span>
                  )}
                  {entry.pass && (
                    <span
                      style={{
                        marginLeft: 8,
                        fontFamily: 'monospace',
                        fontSize: 12,
                        color: mutedText,
                      }}
                    >
                      {showPasses ? entry.pass : '••••••••'}
                    </span>
                  )}
                  {entry.friendCount !== null && (
                    <span style={{ marginLeft: 8, fontSize: 12, color: '#d2a8ff' }}>
                      👥 {entry.friendCount.toLocaleString()}
                    </span>
                  )}
                  {entry.lockStatus && (
                    <span
                      style={{
                        marginLeft: 8,
                        fontSize: 11,
                        padding: '2px 7px',
                        borderRadius: 4,
                        background:
                          entry.lockStatus === 'unlocked'
                            ? '#1a4731'
                            : entry.lockStatus === 'private'
                            ? '#3d1a1a'
                            : '#2d2d2d',
                        color:
                          entry.lockStatus === 'unlocked'
                            ? '#3fb950'
                            : entry.lockStatus === 'private'
                            ? '#f78166'
                            : '#8b949e',
                      }}
                    >
                      {entry.lockStatus === 'unlocked'
                        ? t('statusUnlocked')
                        : entry.lockStatus === 'private'
                        ? t('statusPrivate')
                        : entry.lockStatus === 'notFound'
                        ? t('statusNotFound')
                        : entry.lockStatus === 'invalidToken'
                        ? t('statusInvalidToken')
                        : t('statusUnknown')}
                    </span>
                  )}
                  {entry.saved && (
                    <span
                      style={{
                        marginLeft: 8,
                        fontSize: 11,
                        padding: '2px 7px',
                        borderRadius: 4,
                        background: '#1f3a1f',
                        color: '#3fb950',
                      }}
                    >
                      ★
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  <button
                    onClick={() => copyEntry(entry, 'uid')}
                    title={t('copyUID')}
                    style={{
                      background: isDark ? '#21262d' : '#f6f8fa',
                      color: text,
                      border: `1px solid ${border}`,
                      borderRadius: 5,
                      padding: '3px 9px',
                      fontSize: 11,
                    }}
                  >
                    {t('copyUID')}
                  </button>
                  {entry.pass && (
                    <>
                      <button
                        onClick={() => copyEntry(entry, 'pass')}
                        title={t('copyPass')}
                        style={{
                          background: isDark ? '#21262d' : '#f6f8fa',
                          color: text,
                          border: `1px solid ${border}`,
                          borderRadius: 5,
                          padding: '3px 9px',
                          fontSize: 11,
                        }}
                      >
                        {t('copyPass')}
                      </button>
                      <button
                        onClick={() => copyEntry(entry, 'both')}
                        style={{
                          background: isDark ? '#21262d' : '#f6f8fa',
                          color: text,
                          border: `1px solid ${border}`,
                          borderRadius: 5,
                          padding: '3px 9px',
                          fontSize: 11,
                        }}
                      >
                        {t('copyBoth')}
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => saveEntry(entry.id)}
                    style={{
                      background: entry.saved ? '#1a4731' : (isDark ? '#21262d' : '#f6f8fa'),
                      color: entry.saved ? '#3fb950' : text,
                      border: `1px solid ${entry.saved ? '#3fb950' : border}`,
                      borderRadius: 5,
                      padding: '3px 9px',
                      fontSize: 11,
                    }}
                  >
                    {t('save')}
                  </button>
                  <button
                    onClick={() => removeEntry(entry.id)}
                    style={{
                      background: '#da3633',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 5,
                      padding: '3px 9px',
                      fontSize: 11,
                    }}
                  >
                    {t('remove')}
                  </button>
                </div>
              </div>
            ))
          )}
        </section>

        {/* Show/Hide passwords toggle */}
        {entries.some((e) => e.pass) && (
          <div style={{ textAlign: 'center', marginTop: 12 }}>
            <button
              onClick={() => setShowPasses(!showPasses)}
              style={{
                background: isDark ? '#21262d' : '#f6f8fa',
                color: text,
                border: `1px solid ${border}`,
                borderRadius: 6,
                padding: '6px 16px',
                fontSize: 13,
              }}
            >
              {showPasses ? `🙈 ${t('hidePass')}` : `👁️ ${t('showPass')}`}
            </button>
          </div>
        )}

        {/* Export section */}
        <section
          style={{
            background: cardBg,
            border: `1px solid ${border}`,
            borderRadius: 8,
            marginTop: 16,
          }}
        >
          <button
            onClick={() => setExportSectionOpen(!exportSectionOpen)}
            style={{
              width: '100%',
              textAlign: 'left',
              background: 'none',
              border: 'none',
              color: text,
              padding: '12px 16px',
              fontWeight: 600,
              fontSize: 14,
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            <span>📦 {t('exportSection')}</span>
            <span>{exportSectionOpen ? '▲' : '▼'}</span>
          </button>
          {exportSectionOpen && (
            <div style={{ padding: '0 16px 16px' }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                  gap: 8,
                }}
              >
                {(['all', 'checked', 'unchecked', 'saved'] as const).map((scope) => {
                  const scopeLabel = {
                    all: t('exportAll'),
                    checked: t('exportChecked'),
                    unchecked: t('exportUnchecked'),
                    saved: t('exportSaved'),
                  }[scope]
                  const scopeEntries =
                    scope === 'all'
                      ? entries
                      : scope === 'checked'
                      ? entries.filter((e) => e.checked)
                      : scope === 'unchecked'
                      ? entries.filter((e) => !e.checked)
                      : entries.filter((e) => e.saved)
                  return (
                    <div
                      key={scope}
                      style={{
                        background: isDark ? '#0d1117' : '#f6f8fa',
                        border: `1px solid ${border}`,
                        borderRadius: 6,
                        padding: '10px 12px',
                      }}
                    >
                      <p style={{ margin: '0 0 8px', fontWeight: 600, fontSize: 13 }}>
                        {scopeLabel} ({scopeEntries.length})
                      </p>
                      <button
                        onClick={() => {
                          const content = scopeEntries.map((e) => (e.pass ? `${e.uid}|${e.pass}` : e.uid)).join('\n')
                          const blob = new Blob([content], { type: 'text/plain' })
                          const url = URL.createObjectURL(blob)
                          const a = document.createElement('a')
                          a.href = url
                          a.download = `uids-${scope}.txt`
                          a.click()
                          URL.revokeObjectURL(url)
                        }}
                        style={{
                          background: isDark ? '#21262d' : '#e9ecef',
                          color: text,
                          border: `1px solid ${border}`,
                          borderRadius: 5,
                          padding: '4px 10px',
                          fontSize: 12,
                          marginRight: 6,
                        }}
                      >
                        {t('exportTxt')}
                      </button>
                      <button
                        onClick={() => {
                          const header = 'uid,password,name,friendCount,lockStatus,saved'
                          const rows = scopeEntries.map((e) => {
                            const escape = (v: string) => `"${v.replace(/"/g, '""')}"`
                            return [
                              escape(e.uid),
                              escape(e.pass),
                              escape(e.name ?? ''),
                              e.friendCount ?? '',
                              e.lockStatus ?? '',
                              e.saved,
                            ].join(',')
                          })
                          const csv = [header, ...rows].join('\n')
                          const blob = new Blob([csv], { type: 'text/csv' })
                          const url = URL.createObjectURL(blob)
                          const a = document.createElement('a')
                          a.href = url
                          a.download = `uids-${scope}.csv`
                          a.click()
                          URL.revokeObjectURL(url)
                        }}
                        style={{
                          background: isDark ? '#21262d' : '#e9ecef',
                          color: text,
                          border: `1px solid ${border}`,
                          borderRadius: 5,
                          padding: '4px 10px',
                          fontSize: 12,
                        }}
                      >
                        {t('exportCsv')}
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </section>

        {/* Footer */}
        <footer style={{ textAlign: 'center', marginTop: 32, color: mutedText, fontSize: 12 }}>
          FB UID Manager Pro v2 — PRODIUS BY MR.TOM
        </footer>
      </main>
    </div>
  )
}
