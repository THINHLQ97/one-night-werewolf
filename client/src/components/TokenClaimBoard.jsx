import { useState } from 'react';
import RoleIcon from './RoleIcon';

const ROLE_SHORT = {
  werewolf: 'Soi', minion: 'Tay Sai', seer: 'Tien Tri', robber: 'Cuop',
  troublemaker: 'Gay Roi', drunk: 'Say', insomniac: 'Mat Ngu',
  villager: 'Dan', hunter: 'Tho San', tanner: 'Tho Thuoc Da', mason: 'Sinh Doi',
  sentinel: 'Linh Gac', alphawolf: 'Alpha', mysticwolf: 'Mystic',
  dreamwolf: 'Dream Wolf', apprenticeseer: 'Hoc Vien', paranormalinvestigator: 'Tham Tu',
  witch: 'Phu Thuy', villageidiot: 'Ngu Ngoc', revealer: 'Khai Quat', bodyguard: 'Can Ve',
};

const ROLE_EMOJI = {
  werewolf: '🐺', minion: '🦹', seer: '🔮', robber: '🦝', troublemaker: '😈',
  drunk: '🍺', insomniac: '👁️', villager: '👨‍🌾', hunter: '🏹', tanner: '💀', mason: '🤝',
  sentinel: '🛡️', alphawolf: '🐺', mysticwolf: '🐺', dreamwolf: '🐺',
  apprenticeseer: '🔮', paranormalinvestigator: '🕵️', witch: '🧙',
  villageidiot: '🤪', revealer: '🔦', bodyguard: '💪',
};

export default function TokenClaimBoard({
  tokenClaims, hasAlphaWolf, myId, players,
  onClaimPlayer, onClaimCenter, onUnclaim,
}) {
  const [selectedToken, setSelectedToken] = useState(null);
  const [expanded, setExpanded] = useState(true);

  if (!tokenClaims) return null;

  const { pool, playerClaims = {}, centerClaims = {}, conflicts = [] } = tokenClaims;

  // Build pool items with availability counts
  const poolItems = buildPoolItems(pool, playerClaims, centerClaims);

  // My current claim
  const myClaim = playerClaims[myId];

  // Center slots
  const centerSlots = hasAlphaWolf
    ? ['center0', 'center1', 'center2', 'centerWolf']
    : ['center0', 'center1', 'center2'];

  function handleTokenTap(roleId, poolIndex) {
    setSelectedToken(prev => (prev?.roleId === roleId && prev?.poolIndex === poolIndex) ? null : { roleId, poolIndex });
  }

  function handleClaimSelf() {
    if (!selectedToken) return;
    onClaimPlayer(selectedToken.roleId);
    setSelectedToken(null);
  }

  function handleClaimCenter(slot) {
    if (!selectedToken) return;
    onClaimCenter(selectedToken.roleId, slot);
    setSelectedToken(null);
  }

  return (
    <div className="bg-night-800/60 border border-white/10 rounded-xl overflow-hidden">
      {/* Header - collapsible */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between px-3 py-2 text-left"
      >
        <span className="text-moon-400 text-xs font-semibold">🎭 Nhận Role</span>
        <span className="text-white/40 text-xs">{expanded ? '▼' : '▶'} {Object.keys(playerClaims).length}/{players?.length || 0}</span>
      </button>

      {expanded && (
        <div className="px-3 pb-3 space-y-3">
          {/* Token Pool */}
          <div>
            <p className="text-white/30 text-[10px] mb-1.5">Chọn token rồi chạm vị trí:</p>
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
              {poolItems.map((item, i) => {
                const isSelected = selectedToken?.roleId === item.roleId && selectedToken?.poolIndex === i;
                const isConflict = conflicts.some(c => c.roleId === item.roleId);

                return (
                  <button
                    key={`${item.roleId}-${i}`}
                    onClick={() => handleTokenTap(item.roleId, i)}
                    className={`flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center border-2 transition-all relative
                      ${isSelected ? 'border-moon-400 scale-110 bg-moon-400/20' : ''}
                      ${item.claimed && !isSelected ? 'opacity-40 border-white/10' : ''}
                      ${!item.claimed && !isSelected ? 'border-white/20 bg-night-700 hover:border-white/40' : ''}
                      ${isConflict && item.claimed ? 'border-wolf-400 opacity-100' : ''}
                    `}
                    title={`${ROLE_EMOJI[item.roleId]} ${ROLE_SHORT[item.roleId] || item.roleId}${item.claimerName ? ` (${item.claimerName})` : ''}`}
                  >
                    <RoleIcon roleId={item.roleId} size={28} />
                    {item.claimerName && (
                      <span className="absolute -bottom-3 text-[7px] text-white/50 whitespace-nowrap max-w-[40px] truncate">
                        {item.claimerName}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Destinations - show when token selected */}
          {selectedToken && (
            <div className="space-y-2 animate-fadeIn">
              <p className="text-white/50 text-[10px]">Đặt <strong className="text-moon-300">{ROLE_SHORT[selectedToken.roleId]}</strong> vào:</p>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={handleClaimSelf}
                  className="px-3 py-1.5 rounded-lg bg-village-500/20 border border-village-400/30 text-village-300 text-xs hover:bg-village-500/30 transition-all"
                >
                  👤 Tôi là {ROLE_SHORT[selectedToken.roleId]}
                </button>
                {centerSlots.map((slot, i) => (
                  <button
                    key={slot}
                    onClick={() => handleClaimCenter(slot)}
                    className="px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/60 text-xs hover:bg-white/15 transition-all"
                  >
                    {slot === 'centerWolf' ? '🐺' : '🃏'} {slot === 'centerWolf' ? 'Alpha' : `Giữa ${i + 1}`}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Claims Summary */}
          <ClaimsSummary
            playerClaims={playerClaims}
            centerClaims={centerClaims}
            players={players}
            centerSlots={centerSlots}
            myId={myId}
            onUnclaim={onUnclaim}
            conflicts={conflicts}
          />

          {/* Conflicts */}
          {conflicts.length > 0 && <ConflictPanel conflicts={conflicts} />}
        </div>
      )}
    </div>
  );
}

function ClaimsSummary({ playerClaims, centerClaims, players, centerSlots, myId, onUnclaim, conflicts }) {
  const conflictRoles = new Set(conflicts.map(c => c.roleId));

  return (
    <div className="space-y-1">
      <p className="text-white/30 text-[10px] font-semibold">Bảng nhận role:</p>

      {/* Player claims */}
      <div className="grid grid-cols-2 gap-1">
        {(players || []).map(p => {
          const claim = playerClaims[p.id];
          const isMe = p.id === myId;
          const roleId = claim?.roleId;
          const isConflict = roleId && conflictRoles.has(roleId);

          return (
            <div
              key={p.id}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs
                ${isConflict ? 'bg-wolf-500/15 border border-wolf-400/30' : 'bg-white/5'}
                ${isMe ? 'ring-1 ring-moon-400/30' : ''}
              `}
            >
              <span className="text-white/50 truncate flex-1" style={{ maxWidth: 60 }}>
                {isMe ? '(Ban)' : p.name}
              </span>
              {roleId ? (
                <>
                  <RoleIcon roleId={roleId} size={16} />
                  <span className="text-white/70 text-[10px]">{ROLE_SHORT[roleId]}</span>
                  {isMe && (
                    <button onClick={() => onUnclaim('self')} className="text-wolf-400 text-[10px] ml-0.5">✕</button>
                  )}
                </>
              ) : (
                <span className="text-white/20 text-[10px]">—</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Center claims */}
      <div className="flex gap-1 mt-1">
        {centerSlots.map((slot, i) => {
          const claim = centerClaims[slot];
          const isWolf = slot === 'centerWolf';
          const label = isWolf ? '🐺' : `${i + 1}`;

          return (
            <div
              key={slot}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] flex-1
                ${claim ? 'bg-white/10' : 'bg-white/5'}
                ${isWolf ? 'border border-wolf-500/20' : ''}
              `}
            >
              <span className="text-white/40">{label}</span>
              {claim ? (
                <>
                  <RoleIcon roleId={claim.roleId} size={14} />
                  <span className="text-white/60 truncate">{ROLE_SHORT[claim.roleId]}</span>
                </>
              ) : (
                <span className="text-white/20">—</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ConflictPanel({ conflicts }) {
  return (
    <div className="space-y-1.5">
      <p className="text-wolf-400 text-[10px] font-semibold">⚠️ Xung dot:</p>
      {conflicts.map((c, i) => (
        <div key={i} className="p-2 bg-wolf-500/10 border border-wolf-400/30 rounded-lg">
          <div className="flex items-center gap-1.5 mb-1">
            <RoleIcon roleId={c.roleId} size={18} />
            <span className="text-white/80 text-xs font-medium">{ROLE_SHORT[c.roleId]}</span>
          </div>
          <p className="text-white/60 text-[10px]">{c.reasoning}</p>
          <p className="text-white/40 text-[9px] mt-0.5">
            Nhan boi: {c.claimers.map(cl => cl.name || '?').join(', ')}
          </p>
        </div>
      ))}
    </div>
  );
}

// Build pool items tracking which tokens are claimed
function buildPoolItems(pool, playerClaims, centerClaims) {
  // Count how many of each role are claimed
  const claimedCounts = {};
  Object.values(playerClaims).forEach(claim => {
    const rid = typeof claim === 'string' ? claim : claim?.roleId;
    if (rid) claimedCounts[rid] = (claimedCounts[rid] || 0) + 1;
  });
  Object.values(centerClaims).forEach(claim => {
    if (claim?.roleId) claimedCounts[claim.roleId] = (claimedCounts[claim.roleId] || 0) + 1;
  });

  // Build name map for claimed tokens
  const claimerNames = {};
  Object.entries(playerClaims).forEach(([pid, claim]) => {
    const rid = typeof claim === 'string' ? claim : claim?.roleId;
    const name = typeof claim === 'object' ? claim?.playerName : null;
    if (rid) {
      if (!claimerNames[rid]) claimerNames[rid] = [];
      claimerNames[rid].push(name || '?');
    }
  });
  Object.values(centerClaims).forEach(claim => {
    if (claim?.roleId) {
      if (!claimerNames[claim.roleId]) claimerNames[claim.roleId] = [];
      claimerNames[claim.roleId].push(claim.claimerName || 'center');
    }
  });

  // Track how many of each role we've assigned as "claimed" so far
  const assignedCounts = {};

  return pool.map((roleId, i) => {
    if (!assignedCounts[roleId]) assignedCounts[roleId] = 0;
    const totalClaimed = claimedCounts[roleId] || 0;
    const isClaimed = assignedCounts[roleId] < totalClaimed;
    const claimerName = isClaimed ? (claimerNames[roleId]?.[assignedCounts[roleId]] || null) : null;
    assignedCounts[roleId]++;

    return { roleId, poolIndex: i, claimed: isClaimed, claimerName };
  });
}
