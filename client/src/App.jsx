import { useState, useEffect, useCallback, useRef } from 'react';
import socket from './socket';
import { initAudio, resumeAudio, startNightBGM, startDayBGM, stopBGM, sfxWolfHowl, sfxGameOver } from './audio';
import HomeScreen from './screens/HomeScreen';
import LobbyScreen from './screens/LobbyScreen';
import RoleRevealScreen from './screens/RoleRevealScreen';
import NightScreen from './screens/NightScreen';
import DayScreen from './screens/DayScreen';
import ResultsScreen from './screens/ResultsScreen';

export default function App() {
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

  // Persistent knowledge accumulated during the night
  const [nightKnowledge, setNightKnowledge] = useState({
    revealedPlayers: {},
    revealedCenter: {},
    knownWerewolves: [],
    swappedPairs: [],
    myCurrentRole: null,
  });

  const [connectionLost, setConnectionLost] = useState(false);

  const screenRef = useRef(screen);
  const roomCodeRef = useRef(roomCode);
  screenRef.current = screen;
  roomCodeRef.current = roomCode;

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

  useEffect(() => {
    socket.connect();

    socket.on('disconnect', () => {
      if (screenRef.current !== 'home') setConnectionLost(true);
    });

    socket.on('connect', () => {
      const savedName = sessionStorage.getItem('onw_name');
      const savedRoom = sessionStorage.getItem('onw_room');
      const code = roomCodeRef.current || savedRoom;

      if (screenRef.current !== 'home' && code && savedName) {
        const tryRejoin = (attempt) => {
          socket.emit('rejoin_room', { code, name: savedName }, (res) => {
            if (res?.ok) {
              setConnectionLost(false);
              setRoomCode(res.code);
              setPlayers(res.players);
              setHostId(res.hostId);
              setSettings(res.settings);
              if (res.roleId) {
                setMyRole({ roleId: res.roleId, ...res.role });
              }
              if (res.state === 'day') {
                setDayState({ timerEnd: res.timerEnd, votes: res.votes, players: res.players });
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
      setPlayers(players);
      setHostId(hostId);
    });

    socket.on('settings_updated', ({ settings }) => {
      setSettings(settings);
    });

    socket.on('game_started', () => {
      setScreen('role_reveal');
      setNightKnowledge({ revealedPlayers: {}, revealedCenter: {}, knownWerewolves: [], knownMasons: [], swappedPairs: [], myCurrentRole: null });
    });

    socket.on('role_assigned', ({ roleId, role }) => {
      setMyRole({ roleId, ...role });
    });

    socket.on('night_start', () => {
      setScreen('night');
      setNightState({ currentRole: null, isMyTurn: false, actionData: null, result: null });
      ensureAudio();
      startNightBGM();
    });

    socket.on('night_role_called', ({ role, roleName, instruction }) => {
      setNightState(prev => ({ ...prev, currentRole: role, isMyTurn: false, actionData: null, result: null }));
      if (role === 'werewolf' || role === 'alphawolf' || role === 'mysticwolf') sfxWolfHowl();
    });

    socket.on('night_action_request', ({ role, ...actionData }) => {
      setNightState(prev => ({ ...prev, isMyTurn: true, actionData, result: null }));

      if (role === 'werewolf' && actionData.werewolves) {
        setNightKnowledge(prev => ({
          ...prev,
          knownWerewolves: actionData.werewolves.map(w => w.id),
        }));
      }
      if (role === 'minion' && actionData.werewolves) {
        setNightKnowledge(prev => ({
          ...prev,
          knownWerewolves: actionData.werewolves.map(w => w.id),
        }));
      }
      if (role === 'mason' && actionData.masons) {
        setNightKnowledge(prev => ({
          ...prev,
          knownMasons: actionData.masons.map(m => m.id),
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

      setNightKnowledge(prev => {
        const next = { ...prev };

        if (role === 'seer' && result.seen) {
          if (result.seen.type === 'player') {
            next.revealedPlayers = { ...prev.revealedPlayers, [result.seen.id]: result.seen.role };
          } else if (result.seen.type === 'center') {
            const rc = { ...prev.revealedCenter };
            result.seen.slots.forEach(s => { rc[s.slot] = s.role; });
            next.revealedCenter = rc;
          }
        }

        if (role === 'werewolf' && result.peeked) {
          next.revealedCenter = { ...prev.revealedCenter, [result.peeked.slot]: result.peeked.role };
        }

        if (role === 'robber' && result.newRole) {
          next.myCurrentRole = result.newRole;
        }

        if (role === 'insomniac' && result.currentRole) {
          next.myCurrentRole = result.currentRole;
        }

        if (role === 'mysticwolf' && result.seen) {
          next.revealedPlayers = { ...prev.revealedPlayers, [result.seen.id]: result.seen.role };
        }

        if (role === 'apprenticeseer' && result.seen) {
          next.revealedCenter = { ...prev.revealedCenter, [result.seen.slot]: result.seen.role };
        }

        if (role === 'paranormalinvestigator' && result.seen) {
          next.revealedPlayers = { ...prev.revealedPlayers, [result.seen.id]: result.seen.role };
        }

        if (role === 'witch' && result.seen) {
          next.revealedCenter = { ...prev.revealedCenter, [result.seen.slot]: result.seen.role };
        }

        if (role === 'revealer' && result.revealed) {
          next.revealedPlayers = { ...prev.revealedPlayers, [result.targetPlayer]: result.role };
        }

        return next;
      });
    });

    socket.on('night_role_done', ({ role }) => {
      setNightState(prev => ({ ...prev, isMyTurn: false, actionData: null }));
    });

    socket.on('day_start', ({ timerEnd, players }) => {
      setScreen('day');
      setDayState({ timerEnd, votes: {}, players });
      stopBGM();
      setTimeout(() => startDayBGM(), 500);
    });

    socket.on('vote_update', ({ votes, bodyguardProtect, players }) => {
      setDayState(prev => ({ ...prev, votes, bodyguardProtect: bodyguardProtect || null, players }));
    });

    socket.on('game_over', ({ results, players }) => {
      setResults({ ...results, players });
      setScreen('results');
      stopBGM();
      sfxGameOver();
    });

    socket.on('back_to_lobby', ({ players, settings, hostId }) => {
      setPlayers(players);
      setSettings(settings);
      setHostId(hostId);
      setMyRole(null);
      setResults(null);
      setNightKnowledge({ revealedPlayers: {}, revealedCenter: {}, knownWerewolves: [], knownMasons: [], swappedPairs: [], myCurrentRole: null });
      setScreen('lobby');
      stopBGM();
    });

    return () => socket.disconnect();
  }, [ensureAudio]);

  const handleJoinRoom = useCallback((code, ps, cfg, host) => {
    setRoomCode(code);
    setPlayers(ps);
    setSettings(cfg);
    setHostId(host);
    setScreen('lobby');
    setError('');
    const me = ps.find(p => p.id === socket.id);
    if (me) sessionStorage.setItem('onw_name', me.name);
    sessionStorage.setItem('onw_room', code);
  }, []);

  // Track swap actions from client side for visual
  const handleNightAction = useCallback((role, action) => {
    socket.emit('night_action', { role, action });

    if (role === 'troublemaker' && action.target1 && action.target2) {
      setNightKnowledge(prev => ({
        ...prev,
        swappedPairs: [...prev.swappedPairs, [action.target1, action.target2]],
      }));
    }
    if (role === 'robber' && action.targetPlayer) {
      setNightKnowledge(prev => ({
        ...prev,
        swappedPairs: [...prev.swappedPairs, [socket.id, action.targetPlayer]],
      }));
    }
    if (role === 'drunk' && action.centerSlot) {
      setNightKnowledge(prev => ({
        ...prev,
        swappedPairs: [...prev.swappedPairs, [socket.id, action.centerSlot]],
      }));
    }
    if (role === 'alphawolf' && action.targetPlayer) {
      setNightKnowledge(prev => ({
        ...prev,
        swappedPairs: [...prev.swappedPairs, ['center', action.targetPlayer]],
      }));
    }
    if (role === 'witch' && action.swap && action.targetPlayer) {
      setNightKnowledge(prev => ({
        ...prev,
        swappedPairs: [...prev.swappedPairs, ['center', action.targetPlayer]],
      }));
    }
  }, []);

  const isHost = socket.id === hostId;

  const connectionOverlay = connectionLost ? (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
      <div className="text-center p-6">
        <div className="text-4xl mb-3 animate-pulse">📡</div>
        <p className="text-moon-300 font-semibold mb-1">Đang kết nối lại...</p>
        <p className="text-white/40 text-sm">Đừng tắt app, đợi vài giây</p>
      </div>
    </div>
  ) : null;

  if (screen === 'home') {
    return <HomeScreen onJoin={handleJoinRoom} setError={setError} error={error} />;
  }
  if (screen === 'lobby') {
    return (<>{connectionOverlay}
      <LobbyScreen
        roomCode={roomCode}
        players={players}
        hostId={hostId}
        isHost={isHost}
        settings={settings}
        onSettingsChange={sel => socket.emit('update_settings', { selectedRoles: sel })}
        onModeChange={mode => socket.emit('update_settings', { gameMode: mode })}
        onStartGame={cb => socket.emit('start_game', {}, cb)}
      />
    </>);
  }
  if (screen === 'role_reveal') {
    return <>{connectionOverlay}<RoleRevealScreen myRole={myRole} /></>;
  }
  if (screen === 'night') {
    return (<>{connectionOverlay}
      <NightScreen
        myRole={myRole}
        myId={socket.id}
        nightState={nightState}
        players={players}
        onAction={handleNightAction}
        nightKnowledge={nightKnowledge}
      />
    </>);
  }
  if (screen === 'day') {
    return (<>{connectionOverlay}
      <DayScreen
        dayState={dayState}
        myId={socket.id}
        isHost={isHost}
        onVote={targetId => socket.emit('vote', { targetId })}
        onBodyguardProtect={targetId => socket.emit('bodyguard_protect', { targetId })}
        onEndDay={() => socket.emit('end_day')}
        nightKnowledge={nightKnowledge}
        myRole={myRole}
      />
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
    </>);
  }
  return null;
}
