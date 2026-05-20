import { useState } from 'react';
import RoleIcon from '../components/RoleIcon';
import Icon from '../components/Icon';
import RoleLibrary, { RoleLibraryButton } from '../components/RoleLibrary';

const ROLE_NAMES = {
  werewolf: 'Werewolf', minion: 'Minion', seer: 'Seer',
  robber: 'Robber', troublemaker: 'Troublemaker', drunk: 'Drunk',
  insomniac: 'Insomniac', villager: 'Villager', hunter: 'Hunter', tanner: 'Tanner',
  mason: 'Mason',
  sentinel: 'Sentinel', alphawolf: 'Alpha Wolf', mysticwolf: 'Mystic Wolf',
  dreamwolf: 'Dream Wolf', apprenticeseer: 'Apprentice Seer',
  paranormalinvestigator: 'P.I.', witch: 'Witch', villageidiot: 'Village Idiot',
  revealer: 'Revealer', bodyguard: 'Bodyguard',
};

const TEAM_OF = {
  werewolf: 'werewolf', minion: 'werewolf', alphawolf: 'werewolf', mysticwolf: 'werewolf', dreamwolf: 'werewolf',
  seer: 'village', robber: 'village', troublemaker: 'village',
  drunk: 'village', insomniac: 'village', villager: 'village', hunter: 'village', mason: 'village',
  sentinel: 'village', apprenticeseer: 'village', paranormalinvestigator: 'village',
  witch: 'village', villageidiot: 'village', revealer: 'village', bodyguard: 'village',
  tanner: 'tanner',
};

export default function ResultsScreen({ results, myId, isHost, onNewGame }) {
  const [libraryOpen, setLibraryOpen] = useState(false);

  if (!results) return null;

  const { eliminated, initialEliminated, winners, players, finalCards, originalCards, tally, nightLog = [] } = results;
  const hunterKills = eliminated.filter(id => !initialEliminated?.includes(id));

  const isWinner = winners.includes(myId);
  const playerMap = {};
  players.forEach(p => { playerMap[p.id] = p.name; });

  const winningTeams = new Set(winners.map(id => TEAM_OF[finalCards[id]]));

  let teamLabel, teamColor, teamIcon;
  if (winners.length === 0) {
    teamLabel = 'Không ai thắng';
    teamColor = 'text-white/60';
    teamIcon = null;
  } else if (winningTeams.has('tanner') && winningTeams.size === 1) {
    teamLabel = 'Tanner Wins!';
    teamColor = 'text-purple-400';
    teamIcon = <Icon name="skull" size={28} className="text-purple-400" />;
  } else if (winningTeams.has('village')) {
    teamLabel = winningTeams.has('tanner') ? 'Village & Tanner Win!' : 'Village Wins!';
    teamColor = 'text-village-400';
    teamIcon = <Icon name="shield" size={28} className="text-village-400" />;
  } else {
    teamLabel = 'Werewolves Win!';
    teamColor = 'text-wolf-400';
    teamIcon = null;
  }

  return (
    <div className="min-h-screen min-h-[100dvh] px-3 py-4 sm:p-4 max-w-lg mx-auto fade-in">
      {/* Win banner */}
      <div className="text-center pt-6 sm:pt-8 pb-4 sm:pb-6 relative">
        <RoleLibraryButton onClick={() => setLibraryOpen(true)} className="absolute top-6 right-0" />
        <div className="mb-3">
          {isWinner
            ? <Icon name="trophy" size={52} className="text-yellow-400 mx-auto" />
            : <Icon name="skull" size={52} className="text-white/30 mx-auto" />
          }
        </div>
        <h2 className={`text-3xl font-bold flex items-center justify-center gap-2 ${teamColor}`}>
          {teamIcon} {teamLabel}
        </h2>
        <p className="text-white/50 mt-2">
          {isWinner ? 'Bạn nằm trong phe thắng!' : 'Bạn thua lần này...'}
        </p>
      </div>

      {/* Eliminated */}
      <div className="card mb-4">
        <h3 className="text-moon-400 font-semibold mb-3 flex items-center gap-1.5">
          <Icon name="swords" size={16} /> Bị loại
        </h3>
        {eliminated.length === 0 ? (
          <p className="text-white/40 text-sm">Không ai bị loại</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {eliminated.map(id => (
              <span key={id} className={`px-3 py-1.5 border rounded-xl text-sm flex items-center gap-1.5 ${
                hunterKills.includes(id)
                  ? 'bg-yellow-500/20 border-yellow-500/40'
                  : 'bg-wolf-500/20 border-wolf-500/40'
              }`}>
                {hunterKills.includes(id)
                  ? <Icon name="crosshair" size={14} />
                  : <Icon name="skull" size={14} />
                }
                {playerMap[id]} ({ROLE_NAMES[finalCards[id]]})
                {hunterKills.includes(id) && <span className="text-white/40 ml-1">(bị Thợ Săn kéo theo)</span>}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* All cards revealed */}
      <div className="card mb-4">
        <h3 className="text-moon-400 font-semibold mb-3 flex items-center gap-1.5">
          <Icon name="cards" size={16} /> Bài của mọi người
        </h3>
        <div className="space-y-2">
          {players.map(p => {
            const orig = originalCards[p.id];
            const final = finalCards[p.id];
            const changed = orig !== final;
            const isWin = winners.includes(p.id);

            return (
              <div key={p.id} className={`flex items-center justify-between px-3 py-2 rounded-xl ${isWin ? 'bg-village-500/10' : 'bg-white/5'}`}>
                <div className="flex items-center gap-2">
                  {isWin && <Icon name="trophy" size={16} className="text-yellow-400" />}
                  <span className="font-medium text-sm">{p.name}</span>
                  {eliminated.includes(p.id) && <Icon name="skull" size={14} className="text-wolf-400" />}
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right text-sm">
                    <span className="text-moon-300 font-semibold">{ROLE_NAMES[final]}</span>
                    {changed && (
                      <div className="text-white/30 text-xs">Ban đầu: {ROLE_NAMES[orig]}</div>
                    )}
                  </div>
                  <RoleIcon roleId={final} size={32} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Center cards */}
        <div className="mt-3 pt-3 border-t border-white/10">
          <p className="text-white/40 text-xs mb-2">Bài ở giữa:</p>
          <div className="flex gap-2 flex-wrap">
            {['center0', 'center1', 'center2'].map((slot, i) => (
              <span key={slot} className="text-xs px-2 py-1 bg-white/5 rounded-lg text-white/50">
                Giữa {i + 1}: {ROLE_NAMES[finalCards[slot]]}
              </span>
            ))}
            {finalCards['centerWolf'] && (
              <span className="text-xs px-2 py-1 bg-wolf-500/20 rounded-lg text-wolf-300 border border-wolf-500/30">
                Alpha: {ROLE_NAMES[finalCards['centerWolf']]}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Night History */}
      {nightLog.length > 0 && (
        <div className="card mb-4">
          <h3 className="text-moon-400 font-semibold mb-3 flex items-center gap-1.5">
            <Icon name="moon" size={16} /> Diễn biến trong đêm
          </h3>
          <div className="space-y-1.5">
            {nightLog.map((entry, i) => (
              <NightLogEntry key={i} entry={entry} playerMap={playerMap} />
            ))}
          </div>
        </div>
      )}

      {/* Vote tally */}
      <div className="card mb-6">
        <h3 className="text-moon-400 font-semibold mb-3 flex items-center gap-1.5">
          <Icon name="vote" size={16} /> Kết quả vote
        </h3>
        <div className="space-y-2">
          {players
            .sort((a, b) => (tally[b.id] || 0) - (tally[a.id] || 0))
            .map(p => (
              <div key={p.id} className="flex items-center gap-3">
                <span className="text-sm text-white/70 w-24 truncate">{p.name}</span>
                <div className="flex-1 bg-white/10 rounded-full h-2">
                  <div
                    className="bg-wolf-400 h-2 rounded-full transition-all"
                    style={{ width: `${Math.min(100, ((tally[p.id] || 0) / players.length) * 100)}%` }}
                  />
                </div>
                <span className="text-sm font-bold text-wolf-400 w-6 text-right">{tally[p.id] || 0}</span>
              </div>
            ))}
        </div>
      </div>

      {isHost ? (
        <button className="btn-primary w-full text-lg py-4 flex items-center justify-center gap-2" onClick={onNewGame}>
          <Icon name="refresh" size={22} /> Chơi lại
        </button>
      ) : (
        <p className="text-center text-white/40 text-sm py-4">Chờ host bắt đầu game mới...</p>
      )}

      <RoleLibrary isOpen={libraryOpen} onClose={() => setLibraryOpen(false)} />
    </div>
  );
}

const CENTER_LABEL = { center0: 'Center 1', center1: 'Center 2', center2: 'Center 3', centerWolf: 'Alpha' };

function NightLogEntry({ entry, playerMap }) {
  const { role, playerName, action, result, targetName, target1Name, target2Name } = entry;
  const roleName = ROLE_NAMES[role] || role;

  function describeAction() {
    switch (role) {
      case 'werewolf':
        if (result.peeked) return `peeked at ${CENTER_LABEL[result.peeked.slot] || result.peeked.slot} → ${ROLE_NAMES[result.peeked.role] || '?'}`;
        if (result.werewolves) return `saw fellow wolves`;
        return 'woke up';

      case 'minion':
        return 'saw the werewolves';

      case 'mason':
        return 'saw fellow masons';

      case 'seer':
        if (result.seen?.type === 'player') return `saw ${playerMap[result.seen.id] || targetName || '?'} → ${ROLE_NAMES[result.seen.role] || '?'}`;
        if (result.seen?.type === 'center') {
          const slots = result.seen.slots || [];
          return `saw center: ${slots.map(s => `${CENTER_LABEL[s.slot] || s.slot}=${ROLE_NAMES[s.role] || '?'}`).join(', ')}`;
        }
        return 'looked';

      case 'apprenticeseer':
        if (result.seen?.slots) {
          return `saw center: ${result.seen.slots.map(s => `${CENTER_LABEL[s.slot] || s.slot}=${ROLE_NAMES[s.role] || '?'}`).join(', ')}`;
        }
        return 'looked at center';

      case 'robber':
        if (targetName || action.targetPlayer) {
          const name = targetName || playerMap[action.targetPlayer] || '?';
          return `robbed ${name}` + (result.newRole ? ` → became ${ROLE_NAMES[result.newRole] || '?'}` : '');
        }
        return 'did nothing';

      case 'troublemaker':
        if (target1Name || target2Name || action.target1 || action.target2) {
          const n1 = target1Name || playerMap[action.target1] || '?';
          const n2 = target2Name || playerMap[action.target2] || '?';
          return `swapped ${n1} ↔ ${n2}`;
        }
        return 'did nothing';

      case 'drunk':
        if (action.centerSlot) return `swapped with ${CENTER_LABEL[action.centerSlot] || action.centerSlot}`;
        return 'did nothing';

      case 'insomniac':
        if (result.currentRole) return `woke up as ${ROLE_NAMES[result.currentRole] || '?'}`;
        return 'checked role';

      case 'sentinel':
        if (action.targetPlayer) return `shielded ${targetName || playerMap[action.targetPlayer] || '?'}`;
        return 'did nothing';

      case 'alphawolf':
        if (action.targetPlayer) {
          const name = targetName || playerMap[action.targetPlayer] || '?';
          return result.blocked ? `tried to turn ${name} (blocked by shield)` : `turned ${name} into a werewolf`;
        }
        return 'did nothing';

      case 'mysticwolf':
        if (result.seen) return `saw ${playerMap[result.seen.id] || targetName || '?'} → ${ROLE_NAMES[result.seen.role] || '?'}`;
        return 'looked';

      case 'paranormalinvestigator':
        if (result.seen) return `investigated ${playerMap[result.seen.id] || targetName || '?'} → ${ROLE_NAMES[result.seen.role] || '?'}`;
        return 'investigated';

      case 'witch':
        if (result.seen && action.swap && action.targetPlayer) {
          const name = targetName || playerMap[action.targetPlayer] || '?';
          return `saw ${CENTER_LABEL[action.centerSlot] || '?'}=${ROLE_NAMES[result.seen.role] || '?'}, swapped it with ${name}`;
        }
        if (result.seen) return `saw ${CENTER_LABEL[action.centerSlot] || '?'} → ${ROLE_NAMES[result.seen.role] || '?'} (no swap)`;
        return 'looked at center';

      case 'revealer':
        if (result.revealed && result.targetPlayer) {
          return `revealed ${targetName || playerMap[result.targetPlayer] || '?'} → ${ROLE_NAMES[result.role] || '?'}`;
        }
        if (result.blocked) return `tried to reveal ${targetName || '?'} (wolf/tanner — hidden)`;
        return 'did nothing';

      case 'villageidiot':
        return 'shifted all cards left';

      case 'bodyguard':
        return 'woke up';

      case 'dreamwolf':
        return 'stayed asleep';

      default:
        return 'woke up';
    }
  }

  return (
    <div className="flex items-start gap-2 px-2 py-1.5 rounded-lg bg-white/[0.03]">
      <RoleIcon roleId={role} size={18} className="flex-shrink-0 mt-0.5" />
      <div className="min-w-0">
        <span className="text-white/70 text-xs font-medium">{playerName}</span>
        <span className="text-white/30 text-xs"> ({roleName})</span>
        <p className="text-white/50 text-[11px] leading-tight">{describeAction()}</p>
      </div>
    </div>
  );
}
