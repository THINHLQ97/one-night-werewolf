import { useState, useEffect, useRef } from 'react';

const ROLE_ICON = {
  outsourcing: '🤝', snake: '🐍',
  toxic_manager: '😤', stalker: '👀', snoop: '🔍',
  ishikoi: '🐟', netizen: '📣',
  tracker: '🕒', spammer: '📨',
  ceo: '👔', poacher: '💼', legal: '⚖️',
  dumper: '📦', hr: '📋', paranoid: '😰',
};

function formatTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

/**
 * Tin Đồn Văn Phòng — Office whispers panel.
 * Office equivalent of Alien's Echo-From-Space.
 * Shows live narration of every role action during the night, then persists.
 */
export default function OfficeChronicle({ entries = [], maxLines = 10, collapsed: initialCollapsed = false }) {
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  const scrollRef = useRef(null);

  // Auto-scroll to bottom on new entries
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries.length]);

  const visibleEntries = entries.slice(-maxLines);

  return (
    <div
      className="mx-auto max-w-md w-full rounded-xl overflow-hidden border"
      style={{
        background: 'linear-gradient(135deg, rgba(45,15,30,0.92), rgba(35,12,25,0.92))',
        borderColor: 'rgba(244,114,182,0.3)',
        boxShadow: '0 4px 20px rgba(244,114,182,0.15)',
      }}
    >
      {/* Header */}
      <button
        onClick={() => setCollapsed(c => !c)}
        className="w-full flex items-center justify-between px-3 py-2 hover:bg-white/5 transition-colors"
        style={{ borderBottom: collapsed ? 'none' : '1px solid rgba(244,114,182,0.2)' }}
      >
        <div className="flex items-center gap-2">
          <span className="text-rose-300 text-sm">☕</span>
          <span className="text-rose-200 text-xs font-bold tracking-wider">TIN ĐỒN VĂN PHÒNG</span>
          {entries.length > 0 && (
            <span className="text-rose-400/60 text-[10px]">({entries.length})</span>
          )}
        </div>
        <span className="text-rose-300/60 text-xs">{collapsed ? '▾' : '▴'}</span>
      </button>

      {/* Body */}
      {!collapsed && (
        <div
          ref={scrollRef}
          className="px-3 py-2 space-y-1.5 overflow-y-auto"
          style={{ maxHeight: 220 }}
        >
          {visibleEntries.length === 0 ? (
            <p className="text-rose-300/40 text-xs italic text-center py-4">Đêm còn yên ắng… chưa có tin đồn nào.</p>
          ) : (
            visibleEntries.map((e, i) => (
              <div
                key={`${e.time}-${i}`}
                className="flex items-start gap-2 text-[12px] leading-relaxed animate-narratFadeIn"
              >
                <span className="flex-shrink-0 w-5 text-center text-sm">{ROLE_ICON[e.role] || '📝'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-rose-100/85">{e.message}</p>
                  <p className="text-rose-300/40 text-[10px] font-mono mt-0.5">{formatTime(e.time)}</p>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
