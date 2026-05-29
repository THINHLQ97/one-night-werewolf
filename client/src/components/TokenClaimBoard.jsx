import { useState } from 'react';
import RoleIcon from './RoleIcon';

const ROLE_NAME = {
  doppelganger: 'Doppelgänger',
  werewolf: 'Werewolf', minion: 'Minion', seer: 'Seer', robber: 'Robber',
  troublemaker: 'Troublemaker', drunk: 'Drunk', insomniac: 'Insomniac',
  villager: 'Villager', hunter: 'Hunter', tanner: 'Tanner', mason: 'Mason',
  sentinel: 'Sentinel', alphawolf: 'Alpha Wolf', mysticwolf: 'Mystic Wolf',
  dreamwolf: 'Dream Wolf', apprenticeseer: 'Apprentice', paranormalinvestigator: 'P.I.',
  witch: 'Witch', villageidiot: 'Village Idiot', revealer: 'Revealer', bodyguard: 'Bodyguard',
};

const ROLE_ABBR = {
  doppelganger: 'Dop',
  werewolf: 'Wolf', minion: 'Min', seer: 'Seer', robber: 'Rob',
  troublemaker: 'TM', drunk: 'Drnk', insomniac: 'Inso',
  villager: 'Vill', hunter: 'Hunt', tanner: 'Tan', mason: 'Msn',
  sentinel: 'Sent', alphawolf: 'AWlf', mysticwolf: 'MWlf',
  dreamwolf: 'DWlf', apprenticeseer: 'Appr', paranormalinvestigator: 'PI',
  witch: 'Wtch', villageidiot: 'Idiot', revealer: 'Rev', bodyguard: 'BG',
};

export default function TokenClaimBoard({
  tokenClaims, hasAlphaWolf, myId, players,
  onDeductionSet, onDeductionClear,
}) {
  const [activeTab, setActiveTab] = useState('my');
  const [pickerTarget, setPickerTarget] = useState(null);
  const [expanded, setExpanded] = useState(true);
  const [focusPlayer, setFocusPlayer] = useState('');

  if (!tokenClaims) return null;

  const { pool, deductions = {}, conflicts = [] } = tokenClaims;
  const myRow = deductions[myId] || {};

  // All positions: players + center slots
  const centerSlots = hasAlphaWolf
    ? ['center0', 'center1', 'center2', 'centerWolf']
    : ['center0', 'center1', 'center2'];

  const playerPositions = players.map(p => p.id);
  const allPositions = [...playerPositions, ...centerSlots];

  // Pool frequency
  const poolFreq = {};
  pool.forEach(r => { poolFreq[r] = (poolFreq[r] || 0) + 1; });

  // Count how many times I used each role in my row
  const myUsage = {};
  Object.values(myRow).forEach(rid => {
    if (rid) myUsage[rid] = (myUsage[rid] || 0) + 1;
  });

  // Conflict sets for styling
  const selfConflictRoles = new Set(
    conflicts.filter(c => c.type === 'selfClaimConflict').map(c => c.roleId)
  );

  // Count self-claims
  const selfClaimCount = Object.keys(deductions).filter(pid => deductions[pid]?.[pid]).length;

  function getColLabel(pos) {
    if (pos === 'centerWolf') return '🐺';
    if (pos.startsWith('center')) return `C${parseInt(pos.replace('center', '')) + 1}`;
    const p = players.find(pl => pl.id === pos);
    if (!p) return '?';
    if (pos === myId) return 'You';
    return p.name.length > 5 ? p.name.slice(0, 5) : p.name;
  }

  function getFullLabel(pos) {
    if (pos === 'centerWolf') return '🐺 Alpha Wolf Card';
    if (pos.startsWith('center')) return `Center Card ${parseInt(pos.replace('center', '')) + 1}`;
    const p = players.find(pl => pl.id === pos);
    return p ? (pos === myId ? 'You' : p.name) : '?';
  }

  // Determine which rows to show
  let rowsToShow;
  if (activeTab === 'my') {
    rowsToShow = [myId];
  } else if (focusPlayer) {
    rowsToShow = [focusPlayer];
  } else {
    rowsToShow = [myId, ...players.filter(p => p.id !== myId).map(p => p.id)];
  }

  function getRowConflictRoles(pid) {
    return new Set(
      conflicts.filter(c => c.type === 'rowLogicConflict' && c.playerId === pid).map(c => c.roleId)
    );
  }

  // Compute remaining for role picker (exclude current cell being edited)
  function getRoleRemaining(roleId, excludePosition) {
    const max = poolFreq[roleId] || 0;
    let used = 0;
    Object.entries(myRow).forEach(([pos, rid]) => {
      if (rid === roleId && pos !== excludePosition) used++;
    });
    return max - used;
  }

  return (
    <div className="bg-night-800/60 border border-white/10 rounded-xl overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between px-3 py-2 text-left"
      >
        <span className="text-moon-400 text-xs font-semibold">📋 Deduction Board</span>
        <span className="text-white/40 text-xs">
          {expanded ? '▼' : '▶'} {selfClaimCount}/{players.length} claimed
        </span>
      </button>

      {expanded && (
        <div className="px-2 pb-3 space-y-2">
          {/* Tabs */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => { setActiveTab('my'); setFocusPlayer(''); }}
              className={`px-2.5 py-1 rounded-lg text-[11px] transition-all ${
                activeTab === 'my'
                  ? 'bg-moon-400/20 text-moon-300 font-semibold'
                  : 'bg-white/5 text-white/40 hover:text-white/60'
              }`}
            >
              👤 My View
            </button>
            <button
              onClick={() => { setActiveTab('all'); setFocusPlayer(''); }}
              className={`px-2.5 py-1 rounded-lg text-[11px] transition-all ${
                activeTab === 'all'
                  ? 'bg-moon-400/20 text-moon-300 font-semibold'
                  : 'bg-white/5 text-white/40 hover:text-white/60'
              }`}
            >
              📊 All
            </button>
            {activeTab === 'all' && (
              <select
                value={focusPlayer}
                onChange={e => setFocusPlayer(e.target.value)}
                className="ml-auto px-2 py-1 rounded-lg bg-white/5 text-white/50 text-[10px] border border-white/10 outline-none"
              >
                <option value="">Everyone</option>
                {players.map(p => (
                  <option key={p.id} value={p.id}>
                    🔍 {p.id === myId ? 'You' : p.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Deduction Table */}
          <div className="overflow-x-auto scrollbar-thin rounded-lg border border-white/5" style={{ WebkitOverflowScrolling: 'touch' }}>
            <table className="border-collapse w-full" style={{ minWidth: allPositions.length * 50 + 60 }}>
              <thead>
                <tr className="bg-night-900/80">
                  <th className="sticky left-0 z-10 bg-night-900 w-[56px] min-w-[56px]" />
                  {playerPositions.length > 0 && (
                    <th
                      colSpan={playerPositions.length}
                      className="text-[8px] text-white/20 font-normal py-0.5 border-b border-white/5 text-center"
                    >
                      PLAYERS
                    </th>
                  )}
                  <th
                    colSpan={centerSlots.length}
                    className="text-[8px] text-white/20 font-normal py-0.5 border-b border-white/5 border-l border-white/10 text-center"
                  >
                    CENTER CARDS
                  </th>
                </tr>
                <tr className="bg-night-900/60">
                  <th className="sticky left-0 z-10 bg-night-900 w-[56px] min-w-[56px] px-1 py-1.5">
                    <span className="text-[8px] text-white/20">WHO ↓</span>
                  </th>
                  {allPositions.map((pos, i) => {
                    const isCenter = pos.startsWith('center');
                    const isMe = pos === myId;
                    const firstCenter = i === playerPositions.length;
                    return (
                      <th
                        key={pos}
                        className={`px-0.5 py-1.5 text-center min-w-[48px] max-w-[52px]
                          ${firstCenter ? 'border-l border-white/10' : ''}
                        `}
                      >
                        <span className={`text-[9px] leading-tight block truncate ${
                          isMe ? 'text-moon-300 font-bold'
                          : isCenter ? 'text-white/35'
                          : 'text-white/50'
                        }`}>
                          {getColLabel(pos)}
                        </span>
                      </th>
                    );
                  })}
                </tr>
              </thead>

              <tbody>
                {rowsToShow.map(pid => {
                  const row = deductions[pid] || {};
                  const isMe = pid === myId;
                  const pName = isMe ? 'You' : (players.find(p => p.id === pid)?.name || '?');
                  const rowConflicts = getRowConflictRoles(pid);
                  const filledCount = Object.keys(row).length;

                  return (
                    <tr
                      key={pid}
                      className={`${isMe ? 'bg-moon-400/5' : 'hover:bg-white/[0.02]'} border-t border-white/5`}
                    >
                      <td className={`sticky left-0 z-10 px-1.5 py-1 min-w-[56px] ${
                        isMe ? 'bg-night-800' : 'bg-night-900'
                      }`}>
                        <div className="flex flex-col">
                          <span className={`text-[10px] truncate leading-tight ${
                            isMe ? 'text-moon-300 font-bold' : 'text-white/50'
                          }`} style={{ maxWidth: 48 }}>
                            {pName}
                          </span>
                          <span className="text-[8px] text-white/15">
                            {filledCount}/{allPositions.length}
                          </span>
                        </div>
                      </td>

                      {allPositions.map((pos, i) => {
                        const roleId = row[pos];
                        const isSelf = pos === pid;
                        const firstCenter = i === playerPositions.length;
                        const hasSelfConflict = isSelf && roleId && selfConflictRoles.has(roleId);
                        const hasRowConflict = roleId && rowConflicts.has(roleId);
                        const isEditable = isMe;

                        return (
                          <td
                            key={pos}
                            onClick={(e) => { if (isEditable) { e.stopPropagation(); setPickerTarget(pos); } }}
                            className={`px-0.5 py-1 text-center min-w-[48px] transition-colors relative
                              ${firstCenter ? 'border-l border-white/10' : ''}
                              ${isEditable ? 'cursor-pointer active:bg-white/10' : ''}
                              ${isSelf ? 'bg-moon-400/8' : ''}
                              ${hasSelfConflict ? 'bg-wolf-500/15' : ''}
                              ${hasRowConflict && !hasSelfConflict ? 'bg-yellow-500/8' : ''}
                            `}
                          >
                            {roleId ? (
                              <div className="flex flex-col items-center gap-0.5">
                                <div className={`rounded-full p-0.5 ${
                                  hasSelfConflict ? 'ring-1 ring-wolf-400/60' :
                                  hasRowConflict ? 'ring-1 ring-yellow-400/40' :
                                  isSelf ? 'ring-1 ring-moon-400/30' : ''
                                }`}>
                                  <RoleIcon roleId={roleId} size={20} />
                                </div>
                                <span className={`text-[7px] leading-tight ${
                                  hasSelfConflict ? 'text-wolf-400'
                                  : hasRowConflict ? 'text-yellow-400/80'
                                  : 'text-white/40'
                                }`}>
                                  {ROLE_ABBR[roleId] || roleId}
                                </span>
                              </div>
                            ) : (
                              <div className={`w-7 h-7 mx-auto rounded-md border border-dashed flex items-center justify-center
                                ${isEditable
                                  ? (isSelf
                                    ? 'border-moon-400/25 hover:border-moon-400/50'
                                    : 'border-white/10 hover:border-white/25')
                                  : 'border-white/5'
                                }
                              `}>
                                {isEditable && (
                                  <span className={`text-[10px] ${
                                    isSelf ? 'text-moon-400/30' : 'text-white/10'
                                  }`}>+</span>
                                )}
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Conflict summary */}
          {conflicts.length > 0 && (
            <div className="space-y-1">
              {conflicts.filter(c => c.type === 'selfClaimConflict').map((c, i) => (
                <div key={`sc-${i}`} className="flex items-center gap-1.5 px-2 py-1 bg-wolf-500/10 border border-wolf-400/30 rounded-lg">
                  <RoleIcon roleId={c.roleId} size={14} />
                  <span className="text-wolf-300 text-[10px] flex-1">
                    ⚠️ {ROLE_NAME[c.roleId]}: {c.claimed} claims, only {c.available} in pool
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Bottom Sheet Role Picker */}
      {pickerTarget !== null && (
        <RolePickerSheet
          pool={pool}
          poolFreq={poolFreq}
          currentRole={myRow[pickerTarget]}
          positionLabel={getFullLabel(pickerTarget)}
          isSelfClaim={pickerTarget === myId}
          getRoleRemaining={(roleId) => getRoleRemaining(roleId, pickerTarget)}
          onSelect={(roleId) => {
            onDeductionSet(pickerTarget, roleId);
            setPickerTarget(null);
          }}
          onClear={() => {
            onDeductionClear(pickerTarget);
            setPickerTarget(null);
          }}
          onClose={() => setPickerTarget(null)}
        />
      )}
    </div>
  );
}

/* ─── Bottom Sheet Role Picker ──────────────────────────────────────────────── */

function RolePickerSheet({ pool, poolFreq, currentRole, positionLabel, isSelfClaim, getRoleRemaining, onSelect, onClear, onClose }) {
  const uniqueRoles = [...new Set(pool)];

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 z-40" onClick={onClose} />

      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-night-900 border-t border-white/10 rounded-t-2xl max-h-[55vh] overflow-y-auto animate-slideUp">
        <div className="px-4 pt-3 pb-5">
          {/* Handle */}
          <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-3" />

          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-white/80 text-sm font-semibold">
                {isSelfClaim ? '🎭 Claim your role' : `Assign role → ${positionLabel}`}
              </p>
              <p className="text-white/30 text-[10px]">Tap a role · grayed = all used in your board</p>
            </div>
            {currentRole && (
              <button
                onClick={onClear}
                className="px-2.5 py-1 rounded-lg bg-wolf-500/20 border border-wolf-400/30 text-wolf-300 text-xs"
              >
                ✕ Clear
              </button>
            )}
          </div>

          {/* Role grid */}
          <div className="grid grid-cols-4 gap-1.5">
            {uniqueRoles.map(roleId => {
              const totalInPool = poolFreq[roleId] || 0;
              const remaining = getRoleRemaining(roleId);
              const isSelected = currentRole === roleId;
              // Exhausted = no remaining AND this isn't the currently selected role for this cell
              const isExhausted = remaining <= 0 && !isSelected;

              return (
                <button
                  key={roleId}
                  disabled={isExhausted}
                  onClick={() => !isExhausted && onSelect(roleId)}
                  className={`flex flex-col items-center gap-0.5 py-2 px-1 rounded-xl border transition-all ${
                    isExhausted
                      ? 'border-white/5 bg-white/[0.02] opacity-30 cursor-not-allowed'
                      : isSelected
                        ? 'border-moon-400 bg-moon-400/20 scale-105'
                        : 'border-white/10 bg-white/5 active:bg-white/15'
                  }`}
                >
                  <RoleIcon roleId={roleId} size={26} />
                  <span className={`text-[8px] leading-tight text-center ${
                    isExhausted ? 'text-white/20'
                    : isSelected ? 'text-moon-300 font-bold'
                    : 'text-white/60'
                  }`}>
                    {ROLE_NAME[roleId]}
                  </span>
                  {/* Show remaining / total count */}
                  <span className={`text-[7px] ${
                    isExhausted ? 'text-wolf-400/50' : remaining <= 1 && totalInPool > 1 ? 'text-yellow-400/60' : 'text-white/20'
                  }`}>
                    {isExhausted ? `0/${totalInPool}` : `${remaining}/${totalInPool}`}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
