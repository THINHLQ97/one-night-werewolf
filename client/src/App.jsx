import { useState, useEffect, useCallback, useRef } from 'react';
import socket, { playerToken } from './socket';
import { initAudio, resumeAudio, startNightBGM, startDayBGM, stopBGM, sfxWolfHowl, sfxWin, sfxLose } from './audio';
import { useAuth } from './contexts/AuthContext';
import voiceChat from './voiceChat';
import Icon from './components/Icon';
import RankUpPopup, { DemotedPopup } from './components/RankUpPopup';
import SceneBackground from './components/SceneBackground';
import OracleSpecialEvent from './components/OracleSpecialEvent';
import OracleVision from './components/OracleVision';
import HomeScreen from './screens/HomeScreen';
import LobbyScreen from './screens/LobbyScreen';
import RoleRevealScreen from './screens/RoleRevealScreen';
import NightScreen from './screens/NightScreen';
import DayScreen from './screens/DayScreen';
import ResultsScreen from './screens/ResultsScreen';

export default function App() {
  const { user, authToken, refreshUser } = useAuth();
  const [screen, setScreen] = useState('home');
  const [roomCode, setRoomCode] = useState('');
  const [players, setPlayers] = useState([]);
  const [hostId, setHostId] = useState('');
  const [settings, setSettings] = useState({ selectedRoles: [] });
  const [myRole, setMyRole] = useState(null);
  const [nightState, setNightState] = useState({ currentRole: null, isMyTurn: false, actionData: null, result: null });
  const [dayState, setDayState] = useState({ timerEnd: null, votes: {}, players: [] });
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [hasAlphaWolf, setHasAlphaWolf] = useState(false);
  const [hunterPhase, setHunterPhase] = useState(null);
  const [tokenClaims, setTokenClaims] = useState(null);
  const [rankUpData, setRankUpData] = useState(null);
  const [demotedData, setDemotedData] = useState(null);
  const [isSimulation, setIsSimulation] = useState(false);
  const [preferredHostRole, setPreferredHostRole] = useState(null);
  const [gameMode, setGameMode] = useState('werewolf');

  // Persistent knowledge accumulated during the night
  const [nightKnowledge, setNightKnowledge] = useState({
    revealedPlayers: {},
    revealedCenter: {},
    knownWerewolves: [],
    swappedPairs: [],
    myCurrentRole: null,
    shieldedPlayer: null,
    doppelgangerCopiedRole: null,
    auraTouched: [],
    auraSeen: false,
  });

  const [connectionLost, setConnectionLost] = useState(false);
  const [voiceSpeaking, setVoiceSpeaking] = useState({});
  const [chatMessages, setChatMessages] = useState([]);
  const [appAnnouncements, setAppAnnouncements] = useState([]);
  const [oracleEvent, setOracleEvent] = useState(null); // { active, isOracle, oracleName, result }
  const [oracleVision, setOracleVision] = useState(null); // persistent vision data { allCards, centerCards, nightLog }
  const [oracleVisionOpen, setOracleVisionOpen] = useState(false); // overlay visibility (can close + reopen)

  const screenRef = useRef(screen);
  const roomCodeRef = useRef(roomCode);
  const playersRef = useRef(players);
  const nightKnowledgeRef = useRef(nightKnowledge);
  const gameModeRef = useRef(gameMode);
  const settingsRef = useRef(settings);
  screenRef.current = screen;
  roomCodeRef.current = roomCode;
  playersRef.current = players;
  nightKnowledgeRef.current = nightKnowledge;
  gameModeRef.current = gameMode;
  settingsRef.current = settings;

  const audioInitialized = useRef(false);

  // Init audio on first user interaction
  const ensureAudio = useCallback(() => {
    if (!audioInitialized.current) {
      initAudio();
      audioInitialized.current = true;
    }
    resumeAudio();
  }, []);

  useEffect(() => {
    const handler = () => ensureAudio();
    window.addEventListener('click', handler, { once: true });
    window.addEventListener('touchstart', handler, { once: true });
    return () => {
      window.removeEventListener('click', handler);
      window.removeEventListener('touchstart', handler);
    };
  }, [ensureAudio]);

  // Initialize voice chat manager
  useEffect(() => {
    voiceChat.init(socket);
    voiceChat.onSpeakingChange = (states) => setVoiceSpeaking(states);
    return () => {
      voiceChat.destroy();
    };
  }, []);

  useEffect(() => {
    socket.connect();

    socket.on('disconnect', () => {
      if (screenRef.current !== 'home') setConnectionLost(true);
    });

    socket.on('connect', () => {
      const savedName = localStorage.getItem('onw_name');
      const savedRoom = localStorage.getItem('onw_room');
      const code = roomCodeRef.current || savedRoom;

      if (screenRef.current !== 'home' && code && savedName) {
        const tryRejoin = (attempt) => {
          socket.emit('rejoin_room', { code, name: savedName, token: playerToken }, (res) => {
            if (res?.ok) {
              setConnectionLost(false);
              setRoomCode(res.code);
              setPlayers(res.players);
              setHostId(res.hostId);
              setSettings(res.settings);
              setIsSimulation(!!res.isSimulation);
              setPreferredHostRole(res.preferredHostRole || null);
              setHasAlphaWolf(res.hasAlphaWolf || false);
              if (res.roleId) {
                setMyRole({ roleId: res.roleId, ...res.role });
              }
              if (res.state === 'day') {
                setDayState({ timerEnd: res.timerEnd, votes: res.votes, players: res.players, paused: res.timerPaused || false, pausedRemaining: res.timerPausedRemaining || null, votingPhase: res.votingPhase || false, votingTimerEnd: res.votingTimerEnd || null });
                if (res.tokenClaims) setTokenClaims(res.tokenClaims);
                setScreen('day');
              } else if (res.state === 'night' || res.state === 'role_reveal') {
                setScreen(res.state === 'role_reveal' ? 'role_reveal' : 'night');
              } else if (res.state === 'waiting') {
                setScreen('lobby');
              }
            } else if (attempt < 3) {
              setTimeout(() => tryRejoin(attempt + 1), 1000);
            } else {
              setConnectionLost(false);
              setScreen('home');
              setError('Mất kết nối. Vui lòng vào lại phòng.');
            }
          });
        };
        setTimeout(() => tryRejoin(1), 500);
      }
    });

    socket.on('player_list', ({ players, hostId }) => {
      playersRef.current = players;
      setPlayers(players);
      setHostId(hostId);
    });

    socket.on('settings_updated', ({ settings }) => {
      setSettings(settings);
    });

    socket.on('preferred_role_updated', ({ roleId }) => {
      setPreferredHostRole(roleId);
    });

    socket.on('game_started', (data) => {
      setScreen('role_reveal');
      setHasAlphaWolf(data?.hasAlphaWolf || false);
      setTokenClaims(null);
      setNightKnowledge({ revealedPlayers: {}, revealedCenter: {}, knownWerewolves: [], knownMasons: [], swappedPairs: [], myCurrentRole: null, shieldedPlayer: null, doppelgangerCopiedRole: null, auraTouched: [], auraSeen: false });
    });

    socket.on('role_assigned', ({ roleId, role }) => {
      setMyRole({ roleId, ...role });
    });

    // ── Chat messages (persisted across screens) ──
    socket.on('chat_message', (msg) => {
      setChatMessages(prev => [...prev.slice(-99), msg]);
    });

    socket.on('night_start', () => {
      setScreen('night');
      setNightState({ currentRole: null, isMyTurn: false, actionData: null, result: null });
      setAppAnnouncements([]);
      setOracleEvent(null);
      setOracleVision(null);
      setOracleVisionOpen(false);
      setChatMessages(prev => [...prev, { type: 'phase', text: '🌙 Ban đêm bắt đầu', time: Date.now() }]);
      ensureAudio();
      startNightBGM(settingsRef.current?.gameMode || gameModeRef.current);
    });

    socket.on('night_role_called', ({ role, roleName, instruction, appAnnounce }) => {
      setNightState(prev => ({ ...prev, currentRole: role, isMyTurn: false, actionData: null, result: null }));
      if (appAnnounce) {
        // Avoid only IMMEDIATE consecutive duplicates (anti-spam)
        setAppAnnouncements(prev => {
          const last = prev[prev.length - 1];
          if (last && last.text === appAnnounce && Date.now() - last.time < 1000) return prev;
          return [...prev, { text: appAnnounce, role, time: Date.now() }];
        });
      }
      if (role === 'werewolf' || role === 'alphawolf' || role === 'mysticwolf') sfxWolfHowl();
    });

    socket.on('oracle_vision', (data) => {
      setOracleVision(data);
      setOracleVisionOpen(true); // auto-open when first received
    });

    socket.on('oracle_identity_revealed', ({ oracleId, oracleName, oracleSeat }) => {
      setNightKnowledge(prev => ({
        ...prev,
        oracleRevealed: { id: oracleId, name: oracleName, seat: oracleSeat },
      }));
      setAppAnnouncements(prev => [
        ...prev,
        { text: `👁️ Oracle đã đạt thấu thị! Oracle là ${oracleName} (ghế #${oracleSeat}) — mở mắt suốt đêm.`, time: Date.now() },
      ]);
    });

    socket.on('oracle_special_event', (data) => {
      if (data.stage === 'start') {
        setOracleEvent({
          active: true,
          isOracle: !!data.isOracle,
          // oracleName is null for spectators — identity stays hidden until correct guess
          oracleName: data.oracleName || null,
          result: null,
        });
      } else if (data.stage === 'result') {
        setOracleEvent(prev => prev ? {
          ...prev,
          // If oracleName provided here (correct guess), reveal it to spectators now
          oracleName: data.oracleName || prev.oracleName,
          result: { correct: data.correct, secretNumber: data.secretNumber, answer: data.answer },
        } : prev);
      }
    });

    socket.on('alien_app_announce', ({ message }) => {
      setAppAnnouncements(prev => {
        const last = prev[prev.length - 1];
        if (last && last.text === message && Date.now() - last.time < 1000) return prev;
        return [...prev, { text: message, time: Date.now() }];
      });
    });

    socket.on('night_action_request', ({ role, ...actionData }) => {
      setNightState(prev => ({ ...prev, isMyTurn: true, actionData, result: null }));

      // For doppelganger step 2+, use copiedRole for knowledge updates
      const reqEffective = (role === 'doppelganger' && actionData.copiedRole) ? actionData.copiedRole : role;

      if (reqEffective === 'werewolf' && actionData.werewolves) {
        setNightKnowledge(prev => ({
          ...prev,
          knownWerewolves: actionData.werewolves.map(w => w.id),
        }));
      }
      if (reqEffective === 'minion' && actionData.werewolves) {
        setNightKnowledge(prev => ({
          ...prev,
          knownWerewolves: actionData.werewolves.map(w => w.id),
        }));
      }
      if (reqEffective === 'mason' && actionData.masons) {
        setNightKnowledge(prev => ({
          ...prev,
          knownMasons: actionData.masons.map(m => m.id),
        }));
      }
      // Alien mode: store known alien teammates
      if (reqEffective === 'aliens' && actionData.aliens) {
        setNightKnowledge(prev => ({
          ...prev,
          knownAliens: actionData.aliens.map(a => a.id),
          knownCow: actionData.cowPlayerId || null,
        }));
      }
      if (reqEffective === 'groob_zerb' && actionData.partners) {
        setNightKnowledge(prev => ({
          ...prev,
          knownGroobZerb: actionData.partners.map(p => p.id),
        }));
      }
      if (reqEffective === 'leader' && actionData.alienPlayers) {
        // Leader phân biệt từng vai (Alien/Groob/Zerb/Synthetic) — lưu mapping id→role
        const roleMap = {};
        actionData.alienPlayers.forEach(a => { roleMap[a.id] = a.role; });
        setNightKnowledge(prev => ({
          ...prev,
          knownAliens: actionData.alienPlayers.map(a => a.id),
          knownAlienRoles: roleMap,
        }));
      }
      if (reqEffective === 'auraseer' && Array.isArray(actionData.touched)) {
        setNightKnowledge(prev => ({
          ...prev,
          auraTouched: actionData.touched,
          auraSeen: true,
        }));
      }
      // Capture sentinel shield from actionData (sent to roles after sentinel)
      if (actionData.shieldedPlayer) {
        setNightKnowledge(prev => ({
          ...prev,
          shieldedPlayer: actionData.shieldedPlayer,
        }));
      }
      // Blob: store members for day phase knowledge
      if (reqEffective === 'blob' && actionData.members) {
        setNightKnowledge(prev => ({
          ...prev,
          blobMembers: actionData.members,
        }));
      }
    });

    socket.on('night_public_reveal', ({ playerId, role }) => {
      setNightKnowledge(prev => ({
        ...prev,
        revealedPlayers: { ...prev.revealedPlayers, [playerId]: role },
      }));
    });

    socket.on('night_action_result', ({ role, result }) => {
      setNightState(prev => ({ ...prev, result }));

      // For doppelganger, use the copiedRole to process knowledge
      const effectiveRole = (role === 'doppelganger' && result.copiedRole) ? result.copiedRole : role;

      setNightKnowledge(prev => {
        const next = { ...prev };

        // Track doppelganger's copied role
        if (role === 'doppelganger' && result.copiedRole && !prev.doppelgangerCopiedRole) {
          next.doppelgangerCopiedRole = result.copiedRole;
        }

        if (effectiveRole === 'seer' && result.seen) {
          if (result.seen.type === 'player') {
            next.revealedPlayers = { ...prev.revealedPlayers, [result.seen.id]: result.seen.role };
          } else if (result.seen.type === 'center') {
            const rc = { ...prev.revealedCenter };
            result.seen.slots.forEach(s => { rc[s.slot] = s.role; });
            next.revealedCenter = rc;
          }
        }

        if (effectiveRole === 'werewolf' && result.peeked) {
          next.revealedCenter = { ...prev.revealedCenter, [result.peeked.slot]: result.peeked.role };
        }

        if (effectiveRole === 'robber' && result.newRole) {
          next.myCurrentRole = result.newRole;
        }

        if (effectiveRole === 'insomniac' && result.currentRole) {
          next.myCurrentRole = result.currentRole;
        }

        if (effectiveRole === 'mysticwolf' && result.seen) {
          next.revealedPlayers = { ...prev.revealedPlayers, [result.seen.id]: result.seen.role };
        }

        if (effectiveRole === 'apprenticeseer' && result.seen) {
          const rc = { ...prev.revealedCenter };
          result.seen.slots.forEach(s => { rc[s.slot] = s.role; });
          next.revealedCenter = rc;
        }

        if (effectiveRole === 'paranormalinvestigator' && result.seen) {
          next.revealedPlayers = { ...prev.revealedPlayers, [result.seen.id]: result.seen.role };
        }

        if (effectiveRole === 'witch' && result.seen) {
          next.revealedCenter = { ...prev.revealedCenter, [result.seen.slot]: result.seen.role };
        }

        if (effectiveRole === 'revealer' && result.revealed) {
          next.revealedPlayers = { ...prev.revealedPlayers, [result.targetPlayer]: result.role };
        }

        // ── Alien mode results ──
        // Alien rotate → new role
        if (effectiveRole === 'aliens' && result.rotated && result.newRole) {
          next.myCurrentRole = result.newRole;
        }
        // Alien individual/group view → saw a player or center card
        if (effectiveRole === 'aliens' && result.seen) {
          if (result.seen.id?.startsWith('center')) {
            next.revealedCenter = { ...prev.revealedCenter, [result.seen.id]: result.seen.role };
          } else {
            next.revealedPlayers = { ...prev.revealedPlayers, [result.seen.id]: result.seen.role };
          }
        }
        // Oracle center view
        if (effectiveRole === 'oracle' && Array.isArray(result.seen)) {
          const rc = { ...prev.revealedCenter };
          result.seen.forEach(s => { rc[s.slot] = s.role; });
          next.revealedCenter = rc;
        }
        // Oracle player number view
        if (effectiveRole === 'oracle' && result.seen && !Array.isArray(result.seen) && result.seen.id) {
          next.revealedPlayers = { ...prev.revealedPlayers, [result.seen.id]: result.seen.role };
        }
        // Psychic view
        if (effectiveRole === 'psychic' && result.seen) {
          if (Array.isArray(result.seen)) {
            result.seen.forEach(s => {
              if (s.id) next.revealedPlayers = { ...next.revealedPlayers, [s.id]: s.role };
            });
          } else if (result.seen.id) {
            next.revealedPlayers = { ...prev.revealedPlayers, [result.seen.id]: result.seen.role };
          }
        }
        // Mortician view
        if (effectiveRole === 'mortician' && result.seen) {
          if (result.seen.id) {
            next.revealedPlayers = { ...prev.revealedPlayers, [result.seen.id]: result.seen.role };
          }
        }
        // Exposer exposed center cards
        if (effectiveRole === 'exposer' && Array.isArray(result.exposed)) {
          const rc = { ...prev.revealedCenter };
          result.exposed.forEach(e => { rc[e.slot] = e.role; });
          next.revealedCenter = rc;
        }
        // Rascal robber → new role
        if (effectiveRole === 'rascal' && result.newRole) {
          next.myCurrentRole = result.newRole;
        }

        return next;
      });
    });

    socket.on('night_role_done', ({ role }) => {
      setNightState(prev => ({ ...prev, isMyTurn: false, actionData: null }));
    });

    socket.on('day_start', ({ timerEnd, players: dayPlayers, tokenPool, shieldedPlayer, exposedCenter }) => {
      setScreen('day');
      const merged = dayPlayers.map(dp => {
        const existing = playersRef.current.find(p => p.id === dp.id);
        return existing ? { ...existing, ...dp } : dp;
      });
      setDayState({ timerEnd, votes: {}, players: merged, paused: false, shieldedPlayer: shieldedPlayer || null, votingPhase: false, votingTimerEnd: null, exposedCenter: exposedCenter || {} });
      // Persist exposed center cards into night knowledge so GameTable shows them face-up
      if (exposedCenter && Object.keys(exposedCenter).length > 0) {
        setNightKnowledge(prev => ({
          ...prev,
          revealedCenter: { ...prev.revealedCenter, ...exposedCenter },
        }));
      }
      setTokenClaims(tokenPool ? { pool: tokenPool, deductions: {}, conflicts: [] } : null);
      setChatMessages(prev => [...prev, { type: 'phase', text: '☀️ Ban ngày — Thảo luận', time: Date.now() }]);
      stopBGM();
      setTimeout(() => startDayBGM(settingsRef.current?.gameMode || gameModeRef.current), 500);
    });

    socket.on('voting_phase_start', ({ votingTimerEnd }) => {
      setDayState(prev => ({ ...prev, votingPhase: true, votingTimerEnd, paused: false, pausedRemaining: null }));
      setChatMessages(prev => [...prev, { type: 'phase', text: '🗳️ Bỏ phiếu bắt đầu', time: Date.now() }]);
    });

    socket.on('vote_update', ({ votes, bodyguardProtect, players: votePlayers }) => {
      setDayState(prev => {
        const merged = votePlayers.map(vp => {
          const existing = prev.players.find(p => p.id === vp.id);
          return existing ? { ...existing, ...vp } : vp;
        });
        return { ...prev, votes, bodyguardProtect: bodyguardProtect || null, players: merged };
      });
    });

    socket.on('timer_update', ({ paused, timerEnd: newTimerEnd, remaining }) => {
      setDayState(prev => ({
        ...prev,
        paused,
        timerEnd: paused ? prev.timerEnd : newTimerEnd,
        pausedRemaining: paused ? remaining : null,
      }));
    });

    socket.on('token_claims_update', (data) => {
      setTokenClaims(data);
    });

    socket.on('hunter_phase_start', ({ hunters }) => {
      setHunterPhase({ hunters, isMyTurn: false, otherPlayers: [] });
    });

    socket.on('hunter_shoot_request', ({ otherPlayers }) => {
      setHunterPhase(prev => ({ ...prev, isMyTurn: true, otherPlayers }));
    });

    socket.on('hunter_shoot_update', ({ hunterId, hunterName }) => {
      setHunterPhase(prev => prev ? { ...prev, shotFired: hunterName } : prev);
    });

    socket.on('game_over', ({ results, players: goPlayers, nightLog, rankUpdates }) => {
      setHunterPhase(null);
      const mergedPlayers = goPlayers.map(gp => {
        const existing = playersRef.current.find(p => p.id === gp.id);
        return existing ? { ...existing, ...gp } : gp;
      });
      setResults({ ...results, players: mergedPlayers, nightLog: nightLog || [], rankUpdates: rankUpdates || {} });
      stopBGM();

      const isWinner = results.winners?.includes(socket.id);
      setScreen('results');
      // Play SFX after short delay for result sign entrance
      setTimeout(() => { if (isWinner) sfxWin(); else sfxLose(); }, 600);

      const myRankUpdate = rankUpdates?.[socket.id];
      if (myRankUpdate?.rankUp) {
        setTimeout(() => setRankUpData(myRankUpdate.rankUp), 1500);
        refreshUser();
      } else if (myRankUpdate?.demoted) {
        setTimeout(() => setDemotedData(myRankUpdate.demoted), 1500);
        refreshUser();
      } else if (myRankUpdate) {
        refreshUser();
      }
    });

    socket.on('back_to_lobby', ({ players, settings, hostId }) => {
      setPlayers(players);
      setSettings(settings);
      setHostId(hostId);
      setMyRole(null);
      setResults(null);
      setTokenClaims(null);
      setNightKnowledge({ revealedPlayers: {}, revealedCenter: {}, knownWerewolves: [], knownMasons: [], swappedPairs: [], myCurrentRole: null, shieldedPlayer: null, doppelgangerCopiedRole: null, auraTouched: [], auraSeen: false });
      setChatMessages([]);
      setScreen('lobby');
      stopBGM();
    });

    return () => socket.disconnect();
  }, [ensureAudio]);

  const handleJoinRoom = useCallback((code, ps, cfg, host, state, extraData) => {
    setRoomCode(code);
    playersRef.current = ps;
    setPlayers(ps);
    setSettings(cfg);
    setHostId(host);
    setError('');
    setIsSimulation(!!extraData?.isSimulation);
    setPreferredHostRole(extraData?.preferredHostRole || null);
    const me = ps.find(p => p.id === socket.id);
    if (me) localStorage.setItem('onw_name', me.name);
    localStorage.setItem('onw_room', code);

    if (extraData?.hasAlphaWolf) setHasAlphaWolf(true);

    if (state === 'day' && extraData) {
      setDayState({ timerEnd: extraData.timerEnd, votes: extraData.votes || {}, players: ps });
      if (extraData.roleId) setMyRole({ roleId: extraData.roleId, ...extraData.role });
      setScreen('day');
    } else if (state === 'night' || state === 'role_reveal') {
      if (extraData?.roleId) setMyRole({ roleId: extraData.roleId, ...extraData.role });
      setScreen(state === 'role_reveal' ? 'role_reveal' : 'night');
    } else {
      setScreen('lobby');
    }
  }, []);

  // Track swap actions from client side for visual
  const handleNightAction = useCallback((role, action) => {
    socket.emit('night_action', { role, action });

    // For doppelganger step 2+, use the copied role to determine what action was taken
    const effectiveRole = (role === 'doppelganger' && action.step >= 2)
      ? nightKnowledgeRef.current?.doppelgangerCopiedRole
      : role;

    if (effectiveRole === 'troublemaker' && action.target1 && action.target2) {
      setNightKnowledge(prev => ({
        ...prev,
        swappedPairs: [...prev.swappedPairs, [action.target1, action.target2]],
      }));
    }
    if (effectiveRole === 'robber' && action.targetPlayer) {
      setNightKnowledge(prev => ({
        ...prev,
        swappedPairs: [...prev.swappedPairs, [socket.id, action.targetPlayer]],
      }));
    }
    if (effectiveRole === 'drunk' && action.centerSlot) {
      setNightKnowledge(prev => ({
        ...prev,
        swappedPairs: [...prev.swappedPairs, [socket.id, action.centerSlot]],
      }));
    }
    if (effectiveRole === 'sentinel' && action.targetPlayer) {
      setNightKnowledge(prev => ({
        ...prev,
        shieldedPlayer: action.targetPlayer,
      }));
    }
    if (effectiveRole === 'alphawolf' && action.targetPlayer) {
      setNightKnowledge(prev => ({
        ...prev,
        swappedPairs: [...prev.swappedPairs, ['center', action.targetPlayer]],
      }));
    }
    if (effectiveRole === 'witch' && action.swap && action.targetPlayer) {
      setNightKnowledge(prev => ({
        ...prev,
        swappedPairs: [...prev.swappedPairs, ['center', action.targetPlayer]],
      }));
    }
    // ── Rascal (alien mode) swap actions ──
    if (effectiveRole === 'rascal' && action.target1 && action.target2) {
      // Troublemaker action
      setNightKnowledge(prev => ({
        ...prev,
        swappedPairs: [...prev.swappedPairs, [action.target1, action.target2]],
      }));
    }
    if (effectiveRole === 'rascal' && action.targetPlayer && !action.target1) {
      // Robber action
      setNightKnowledge(prev => ({
        ...prev,
        swappedPairs: [...prev.swappedPairs, [socket.id, action.targetPlayer]],
      }));
    }
    if (effectiveRole === 'rascal' && action.centerSlot && !action.skip) {
      // Drunk action
      setNightKnowledge(prev => ({
        ...prev,
        swappedPairs: [...prev.swappedPairs, [socket.id, action.centerSlot]],
      }));
    }
  }, []);

  const isHost = socket.id === hostId;

  // Determine scene for day/night background
  const currentScene = (screen === 'role_reveal' || screen === 'night') ? 'night'
    : screen === 'day' ? 'day'
    : null;

  const connectionOverlay = connectionLost ? (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
      <div className="text-center p-6">
        <div className="mb-3 animate-pulse text-moon-400"><Icon name="wifi" size={40} /></div>
        <p className="text-moon-300 font-semibold mb-1">Đang kết nối lại...</p>
        <p className="text-white/40 text-sm">Đừng tắt app, đợi vài giây</p>
      </div>
    </div>
  ) : null;

  if (screen === 'home') {
    return <HomeScreen onJoin={handleJoinRoom} setError={setError} error={error} gameMode={gameMode} onGameModeChange={setGameMode} />;
  }
  if (screen === 'lobby') {
    return (<>{connectionOverlay}
      <LobbyScreen
        roomCode={roomCode}
        players={players}
        hostId={hostId}
        isHost={isHost}
        settings={settings}
        isSimulation={isSimulation}
        preferredHostRole={preferredHostRole}
        gameMode={settings.gameMode || gameMode}
        onPreferredRoleChange={roleId => socket.emit('set_preferred_role', { roleId })}
        onSettingsChange={sel => socket.emit('update_settings', { selectedRoles: sel })}
        onModeChange={mode => socket.emit('update_settings', { gameMode: mode })}
        onStartGame={cb => socket.emit('start_game', {}, cb)}
        onLeave={() => {
          voiceChat.leave();
          socket.emit('leave_room', {}, () => {
            setScreen('home');
            setRoomCode('');
            setPlayers([]);
            setHostId('');
            setSettings({ selectedRoles: [] });
            setIsSimulation(false);
            setPreferredHostRole(null);
            localStorage.removeItem('onw_room');
          });
        }}
        voiceSpeaking={voiceSpeaking}
        chatMessages={chatMessages}
      />
    </>);
  }
  if (screen === 'role_reveal') {
    return <><SceneBackground scene={currentScene} gameMode={settings.gameMode || gameMode} />{connectionOverlay}<RoleRevealScreen myRole={myRole} roomCode={roomCode} isHost={isHost} players={players} voiceSpeaking={voiceSpeaking} chatMessages={chatMessages} /></>;
  }
  if (screen === 'night') {
    return (<><SceneBackground scene={currentScene} gameMode={settings.gameMode || gameMode} />{connectionOverlay}
      <NightScreen
        myRole={myRole}
        myId={socket.id}
        nightState={nightState}
        players={players}
        onAction={handleNightAction}
        nightKnowledge={nightKnowledge}
        hasAlphaWolf={hasAlphaWolf}
        roomCode={roomCode}
        isHost={isHost}
        voiceSpeaking={voiceSpeaking}
        chatMessages={chatMessages}
        appAnnouncements={appAnnouncements}
        gameMode={settings.gameMode || gameMode}
        hasOracleVision={!!oracleVision}
        onReopenVision={() => setOracleVisionOpen(true)}
      />
      {oracleEvent?.active && (
        <OracleSpecialEvent
          isOracle={oracleEvent.isOracle}
          oracleName={oracleEvent.oracleName}
          result={oracleEvent.result}
          onPick={(num) => {
            socket.emit('night_action', { role: 'oracle', action: { answer: String(num) } });
          }}
          onClose={() => setOracleEvent(null)}
        />
      )}
      {oracleVisionOpen && oracleVision && (
        <OracleVision vision={oracleVision} onClose={() => setOracleVisionOpen(false)} />
      )}
    </>);
  }
  if (screen === 'day') {
    return (<><SceneBackground scene={currentScene} gameMode={settings.gameMode || gameMode} />{connectionOverlay}
      <DayScreen
        dayState={dayState}
        myId={socket.id}
        isHost={isHost}
        onVote={targetId => socket.emit('vote', { targetId })}
        onBodyguardProtect={targetId => socket.emit('bodyguard_protect', { targetId })}
        onEndDay={() => socket.emit('end_day')}
        onTimerPause={() => socket.emit('timer_pause')}
        onTimerResume={() => socket.emit('timer_resume')}
        onTimerAdjust={seconds => socket.emit('timer_adjust', { seconds })}
        nightKnowledge={nightKnowledge}
        myRole={myRole}
        hasAlphaWolf={hasAlphaWolf}
        hunterPhase={hunterPhase}
        onHunterShoot={targetId => socket.emit('hunter_shoot', { targetId })}
        tokenClaims={tokenClaims}
        onDeductionSet={(position, roleId) => socket.emit('deduction_set', { position, roleId })}
        onDeductionClear={position => socket.emit('deduction_clear', { position })}
        roomCode={roomCode}
        voiceSpeaking={voiceSpeaking}
        chatMessages={chatMessages}
        appAnnouncements={appAnnouncements}
        gameMode={settings.gameMode || gameMode}
        hasOracleVision={!!oracleVision}
        onReopenVision={() => setOracleVisionOpen(true)}
      />
      {oracleVisionOpen && oracleVision && (
        <OracleVision vision={oracleVision} onClose={() => setOracleVisionOpen(false)} />
      )}
    </>);
  }
  if (screen === 'results') {
    return (<>{connectionOverlay}
      <ResultsScreen
        results={results}
        myId={socket.id}
        isHost={isHost}
        onNewGame={() => socket.emit('new_game')}
      />
      <RankUpPopup rankUp={rankUpData} onClose={() => setRankUpData(null)} />
      <DemotedPopup newRank={demotedData} onClose={() => setDemotedData(null)} />
    </>);
  }
  return null;
}
