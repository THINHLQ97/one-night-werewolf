import RoleIcon from './RoleIcon';

const ROLE_NAMES = {
  // Alien
  alien: 'Alien', syntheticalien: 'Synthetic Alien',
  cow: 'Cow', groob: 'Groob', zerb: 'Zerb',
  oracle: 'Oracle', rascal: 'Rascal', exposer: 'Exposer',
  psychic: 'Psychic', mortician: 'Mortician', leader: 'Leader', blob: 'Blob',
  // Phases (night log)
  aliens: 'Alien', groob_zerb: 'Groob & Zerb',
};

const PHASE_TO_ICON = {
  aliens: 'alien', groob_zerb: 'groob',
};

function describeAction(entry) {
  const { role, action, result, targetName, target1Name, target2Name } = entry;
  switch (role) {
    case 'oracle':
      if (result?.appReply) return result.appReply.replace('🤖 → Oracle: ', '');
      return `trả lời: ${result?.answer || 'không rõ'}`;
    case 'aliens':
      if (result?.seen) return `xem bài → ${ROLE_NAMES[result.seen.role] || result.seen.role}`;
      if (result?.swapped) return 'hoán đổi bài với Alien khác';
      return 'nhìn đồng bọn';
    case 'cow':
      if (result?.wasTapped) return `bị tap (Alien ngồi cạnh)`;
      return 'không bị tap';
    case 'rascal':
      if (result?.skipped) return 'bỏ qua';
      if (result?.action === 'troublemaker') return `hoán đổi bài ${target1Name || '?'} ↔ ${target2Name || '?'}`;
      if (result?.action === 'robber') return `cướp bài ${targetName || '?'} → thành ${ROLE_NAMES[result.newRole] || '?'}`;
      if (result?.action === 'drunk') return `đổi bài với bài giữa`;
      if (result?.action === 'village_idiot') return `xoay bài sang ${action.direction === 'left' ? 'trái' : 'phải'}`;
      return 'hành động';
    case 'exposer':
      if (result?.skipped) return 'bỏ qua';
      if (result?.exposed?.length) return `lật ${result.exposed.length} bài giữa`;
      return 'lật bài';
    case 'psychic':
      if (result?.seen) return `xem bài → ${ROLE_NAMES[result.seen.role] || '?'}`;
      return 'xem bài';
    case 'mortician':
      if (result?.seen) return `xem bài hàng xóm → ${ROLE_NAMES[result.seen.role] || '?'}`;
      return 'quan sát hàng xóm';
    case 'blob': return 'xem thành viên Blob';
    case 'leader': return 'thấy vị trí Alien';
    case 'groob_zerb': return 'nhìn Groob/Zerb';
    default: return 'thức dậy';
  }
}

export default function OracleVision({ vision, onClose }) {
  if (!vision) return null;
  const { allCards, centerCards, nightLog = [] } = vision;
  const players = Object.entries(allCards).map(([id, info]) => ({ id, ...info }))
    .sort((a, b) => a.seat - b.seat);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 fade-in p-4 overflow-y-auto"
      style={{ animation: 'eventFadeIn 0.6s ease-out' }}>
      {/* Background pulse */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse at center, rgba(74,222,128,0.1) 0%, transparent 60%)',
        animation: 'oraclePulse 3s ease-in-out infinite',
      }} />

      <div className="relative max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-4" style={{ animation: 'eventScaleIn 0.7s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
          <p className="text-emerald-400 text-2xl sm:text-3xl font-bold mb-1" style={{ textShadow: '0 0 18px rgba(74,222,128,0.7)' }}>
            👁️ THỊ KIẾN CỦA ORACLE
          </p>
          <p className="text-emerald-300/80 text-sm italic">
            "Bí mật vũ trụ mở ra trước mắt ngươi. Hãy nhìn rõ — và nhớ kỹ."
          </p>
        </div>

        {/* All Cards */}
        <div className="mb-4 p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20"
          style={{ animation: 'eventFadeIn 0.8s ease-out 0.3s both' }}>
          <h3 className="text-emerald-400 font-semibold text-sm mb-3 flex items-center gap-1.5">
            🃏 Bài hiện tại của tất cả người chơi
          </h3>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
            {players.map(p => {
              const changed = p.originalRole !== p.currentRole;
              return (
                <div key={p.id} className="flex flex-col items-center p-2 rounded-lg bg-black/30 border border-white/5">
                  <span className="text-emerald-400/60 text-[10px] font-mono mb-1">#{p.seat} {p.name}</span>
                  <RoleIcon roleId={p.currentRole} size={50} circular />
                  <span className="text-white/90 text-xs font-semibold mt-1 truncate max-w-full">
                    {ROLE_NAMES[p.currentRole] || p.currentRole}
                  </span>
                  {changed && (
                    <span className="text-yellow-400/70 text-[9px] italic mt-0.5">
                      (gốc: {ROLE_NAMES[p.originalRole] || p.originalRole})
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Center cards */}
          <h3 className="text-emerald-400 font-semibold text-sm mt-4 mb-2 flex items-center gap-1.5">
            🎴 Bài ở giữa
          </h3>
          <div className="flex gap-3 justify-center">
            {['center0', 'center1', 'center2'].map((slot, i) => (
              <div key={slot} className="flex flex-col items-center p-2 rounded-lg bg-black/30 border border-white/5">
                <span className="text-emerald-400/60 text-[10px] font-mono mb-1">Giữa {i + 1}</span>
                <RoleIcon roleId={centerCards[slot]} size={50} circular />
                <span className="text-white/90 text-xs font-semibold mt-1">
                  {ROLE_NAMES[centerCards[slot]] || centerCards[slot]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Night Log */}
        <div className="mb-4 p-4 rounded-2xl bg-purple-500/5 border border-purple-500/20"
          style={{ animation: 'eventFadeIn 0.8s ease-out 0.5s both' }}>
          <h3 className="text-purple-400 font-semibold text-sm mb-3 flex items-center gap-1.5">
            🌙 Diễn biến đêm qua
          </h3>
          {nightLog.length === 0 ? (
            <p className="text-white/40 text-sm italic">Không có hành động nào</p>
          ) : (
            <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
              {nightLog.map((entry, i) => {
                const iconRoleId = PHASE_TO_ICON[entry.role] || entry.role;
                const roleName = ROLE_NAMES[entry.role] || entry.role;
                return (
                  <div key={i} className="flex items-start gap-2 px-2 py-1.5 rounded-lg bg-black/30">
                    <RoleIcon roleId={iconRoleId} size={22} circular className="flex-shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <span className="text-white/80 text-xs font-medium">{entry.playerName}</span>
                      <span className="text-white/40 text-xs"> ({roleName})</span>
                      <p className="text-purple-300/70 text-[11px] leading-tight">{describeAction(entry)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Close button */}
        <div className="text-center" style={{ animation: 'eventFadeIn 0.8s ease-out 0.7s both' }}>
          <p className="text-emerald-300/60 text-xs italic mb-2">
            💡 Bạn có thể mở lại bằng nút 👁️ trên thanh công cụ bất cứ lúc nào.
          </p>
          <button
            className="btn-primary text-sm px-8 py-3"
            onClick={onClose}
          >
            Đã ghi nhớ
          </button>
        </div>
      </div>
    </div>
  );
}
