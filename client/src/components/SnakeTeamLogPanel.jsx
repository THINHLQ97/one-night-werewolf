import { useState, useEffect } from 'react';

const OFFICE_SNAKE_SET = ['snake', 'toxic_manager', 'stalker', 'snoop'];

export function useIsSnakeTeammate(gameMode, myRole, outsourcingCopied) {
  if (gameMode !== 'office' || !myRole?.roleId) return false;
  if (OFFICE_SNAKE_SET.includes(myRole.roleId)) return true;
  if (myRole.roleId === 'outsourcing' && OFFICE_SNAKE_SET.includes(outsourcingCopied)) return true;
  return false;
}

export default function SnakeTeamLogPanel({ snakeTeamLog = [], visible, label = 'Sổ tay phe Rắn', autoOpenOnFirst = true }) {
  const [open, setOpen] = useState(false);
  const [seen, setSeen] = useState(0);

  useEffect(() => {
    if (!visible) return;
    if (autoOpenOnFirst && snakeTeamLog.length === 1 && !open) setOpen(true);
  }, [snakeTeamLog.length, visible, autoOpenOnFirst]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (open) setSeen(snakeTeamLog.length);
  }, [open, snakeTeamLog.length]);

  if (!visible) return null;
  const unseen = Math.max(0, snakeTeamLog.length - seen);

  return (
    <div className="fixed top-16 right-2 sm:right-4 z-40 select-none">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="relative px-3 py-2 rounded-xl bg-rose-900/80 hover:bg-rose-800/90 border border-rose-400/40 text-rose-100 text-xs font-semibold shadow-lg backdrop-blur-sm flex items-center gap-1.5 transition-colors"
          title={label}
        >
          <span className="text-base leading-none">🐍</span>
          <span>Phe Rắn ({snakeTeamLog.length})</span>
          {unseen > 0 && (
            <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-amber-400 text-rose-950 text-[10px] font-bold flex items-center justify-center shadow">
              {unseen}
            </span>
          )}
        </button>
      ) : (
        <div className="w-[260px] sm:w-[300px] max-h-[60vh] rounded-2xl bg-rose-950/85 border border-rose-400/40 shadow-2xl backdrop-blur-md flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 bg-rose-900/70 border-b border-rose-400/30">
            <div className="flex items-center gap-1.5 text-rose-100 text-xs font-bold">
              <span className="text-base leading-none">🐍</span>
              <span>{label}</span>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="w-6 h-6 rounded-lg hover:bg-white/10 flex items-center justify-center text-rose-200 text-sm"
              title="Ẩn"
            >×</button>
          </div>
          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5">
            {snakeTeamLog.length === 0 ? (
              <p className="text-rose-300/60 text-xs italic text-center py-3">Chưa có hành động nào.</p>
            ) : (
              snakeTeamLog.map((entry, i) => (
                <div
                  key={`${entry.timestamp}-${i}`}
                  className={`px-2 py-1.5 rounded-lg text-[11px] leading-snug border ${
                    entry.viaOutsourcing
                      ? 'bg-amber-500/10 border-amber-400/30 text-amber-100'
                      : 'bg-rose-500/10 border-rose-400/30 text-rose-100'
                  }`}
                >
                  {entry.description}
                </div>
              ))
            )}
          </div>
          <div className="px-3 py-1.5 bg-rose-900/50 border-t border-rose-400/20 text-[10px] text-rose-300/70 italic text-center">
            Chỉ phe Rắn thấy log này.
          </div>
        </div>
      )}
    </div>
  );
}
