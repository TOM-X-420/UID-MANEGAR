# FB UID Manager Pro v2

**PRODIUS BY MR.TOM** — A web-based Facebook UID management tool built with a pnpm monorepo using TypeScript, React, and Vite.

---

## Stack

| Layer | Technology |
|---|---|
| Monorepo | pnpm workspaces |
| Node.js | ≥ 24 |
| TypeScript | 5.9 |
| Frontend | React 18 + Vite 6 + Tailwind-like inline styles |
| Package manager | pnpm 9 |

## Project Structure

```
.
├── artifacts/
│   └── uid-manager/        # React + Vite frontend (main app)
│       └── src/
│           ├── i18n/       # Localization system (EN / Bangla)
│           └── components/ # UI components
├── lib/                    # Shared libraries (future)
├── scripts/                # Utility scripts (future)
├── pnpm-workspace.yaml
├── tsconfig.base.json
└── tsconfig.json
```

---

## Getting Started

### Prerequisites

- Node.js ≥ 24
- pnpm ≥ 9 (`npm install -g pnpm`)

### Install

```bash
pnpm install
```

### Run Dev Server

```bash
cd artifacts/uid-manager
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build

```bash
pnpm run build          # typecheck + build all packages
# or for the frontend only:
cd artifacts/uid-manager && pnpm run build
```

### Typecheck

```bash
pnpm run typecheck
```

---

## 🌐 Language Support (English / বাংলা)

The UID Manager supports **English** (default) and **Bangla (Bengali)** UI languages.

### Switching Language in the UI

1. Open the app at `/` (or `http://localhost:5173`).
2. Look for the language toggle button in the **top-right corner of the header**.
   - When the app is in English, the button shows **`🇧🇩 বাংলা`**.
   - When the app is in Bangla, the button shows **`🇬🇧 English`**.
3. Click the button to toggle between English and Bangla instantly.

The selected language is **automatically saved to `localStorage`** (key: `uid-manager-language`), so your preference persists across page reloads and browser sessions.

### Default Language

The app defaults to **English** for all new visitors. If `localStorage` contains a previously saved language preference (`en` or `bn`), that preference is restored on page load.

### Switching Language Programmatically

```typescript
import { useLanguage } from './i18n'

function MyComponent() {
  const { language, setLanguage, toggleLanguage } = useLanguage()

  return (
    <>
      <p>Current language: {language}</p>
      <button onClick={() => setLanguage('bn')}>Switch to Bangla</button>
      <button onClick={() => setLanguage('en')}>Switch to English</button>
      <button onClick={toggleLanguage}>Toggle</button>
    </>
  )
}
```

### Adding New Translations

All strings live in [`artifacts/uid-manager/src/i18n/translations.ts`](artifacts/uid-manager/src/i18n/translations.ts).

1. Add a new key to the `TranslationKey` union type.
2. Add the English string under `translations.en`.
3. Add the Bangla string under `translations.bn`.
4. Use it in any component with `const t = useT(); t('yourNewKey')`.

### Translated UI Areas

| Area | Keys |
|---|---|
| Header | `appTitle`, `appSubtitle` |
| Input / Processing | `inputLabel`, `processBtn`, `clearBtn`, `lineCount`, … |
| Filter tabs | `tabAll`, `tabUnchecked`, `tabChecked`, `tabSaved` |
| Stats row | `totalUIDs`, `unlocked`, `private`, `unfetched`, `totalFriends` |
| Bulk actions | `selectAll`, `deselectAll`, `saveSelected`, `copySelected`, … |
| Per-entry buttons | `save`, `remove`, `copyUID`, `copyPass`, `copyBoth`, … |
| Token & Cookie panel | `tokenSection`, `tokenLabel`, `fetchAll`, `fetchUnfetched`, … |
| Lock status badges | `statusUnlocked`, `statusPrivate`, `statusNotFound`, … |
| Export panel | `exportSection`, `exportTxt`, `exportCsv`, … |
| Toast messages | `toastProcessed`, `toastCopied`, `toastCleared`, … |
| Empty/no-results states | `emptyState`, `noResults` |

---

## Features

- Paste `UID|PASS` data or drag & drop up to 20 `.txt` files
- Filter tabs: All / Unchecked / Checked / Saved
- Multi-select with bulk actions: Save / Copy / Remove Selected
- Check All / Uncheck All per filter scope
- Per-entry: Save, Remove, Copy UID / Pass / Both
- Show/Hide passwords toggle
- Confirm-before-clear (double-tap to clear)
- Collapsible Token & Cookie panel with Fetch All / Fetch Unfetched
- Lock status badges: Unlocked / Private / Not Found / Invalid Token / Unknown
- Stats row: Total UIDs, Unlocked, Private, Unfetched, Total Friends
- Export to `.txt` / `.csv` (All / Checked / Unchecked / Saved)
- Dark / Light theme toggle
- **English / Bangla language toggle (persisted in localStorage)**
- All UID data stored in localStorage (client-side only)

---

## License

Private project — PRODIUS BY MR.TOM.