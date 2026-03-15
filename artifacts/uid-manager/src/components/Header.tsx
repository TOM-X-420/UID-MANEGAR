import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const tools = [
  {
    section: "IDS Extract & Dump",
    items: [
      { label: "[A] Unlimited IDs Extract", path: "/dumping-system" },
      { label: "[B] Extra Utility Dump", path: "/dumping-system" },
      { label: "[C] Simple Dump", path: "/dumping-system" },
    ],
  },
  {
    section: "File Utilities",
    items: [
      { label: "[D] File Divider", path: "/file-tools?tool=divider" },
      { label: "[E] File Mixer", path: "/file-tools?tool=mixer" },
      { label: "[F] Remove Duplicates", path: "/file-tools?tool=remove-dupes" },
      { label: "[G] Remove Stylish/Emoji", path: "/file-tools?tool=remove-stylish" },
      { label: "[H] Cut/Delete Lines", path: "/file-tools?tool=cut-lines" },
      { label: "[I] Separate Links", path: "/file-tools?tool=separate-links" },
    ],
  },
];

export default function Header() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const navigate = useNavigate();

  function handleNav(path: string) {
    setDrawerOpen(false);
    navigate(path);
  }

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#161b22] border-b border-[#30363d] px-4 py-3 flex items-center justify-between">
        <Link to="/" className="text-[#58a6ff] font-bold text-lg tracking-tight hover:text-white transition-colors">
          FB UID Manager Pro
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#8b949e] hidden sm:inline">PRODIUS BY MR.TOM</span>
          <button
            onClick={() => setDrawerOpen(true)}
            className="w-9 h-9 flex items-center justify-center rounded bg-[#21262d] border border-[#30363d] text-[#c9d1d9] hover:bg-[#30363d] transition-colors text-lg"
            aria-label="Open menu"
          >
            ☰
          </button>
        </div>
      </header>

      {/* Backdrop */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* Slide-out drawer */}
      <aside
        className={`fixed top-0 right-0 z-50 h-full w-72 bg-[#161b22] border-l border-[#30363d] shadow-2xl transform transition-transform duration-300 ${
          drawerOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#30363d]">
          <span className="font-semibold text-[#c9d1d9]">Tools Menu</span>
          <button
            onClick={() => setDrawerOpen(false)}
            className="text-[#8b949e] hover:text-white text-xl"
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>
        <nav className="overflow-y-auto h-full pb-20">
          <div className="px-4 py-3">
            <button
              onClick={() => handleNav("/")}
              className="w-full text-left py-2 px-3 rounded text-[#58a6ff] hover:bg-[#21262d] transition-colors font-semibold"
            >
              🏠 UID Manager
            </button>
          </div>
          {tools.map((section) => (
            <div key={section.section} className="px-4 py-2">
              <div className="text-xs text-[#8b949e] uppercase font-semibold tracking-wider mb-2 px-3">
                {section.section}
              </div>
              <div className="space-y-1">
                {section.items.map((item) => (
                  <button
                    key={item.label}
                    onClick={() => handleNav(item.path)}
                    className="w-full text-left py-2 px-3 rounded text-[#c9d1d9] hover:bg-[#21262d] hover:text-[#58a6ff] transition-colors text-sm"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}
