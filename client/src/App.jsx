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
      if (role === 'werewolf') sfxWolfHowl();
    });

    socket.on('night_action_request', ({ role, ...actionData }) => {
      setNightState(prev => ({ ...prev, isMyTurn: true, actionData }));

      // Auto-populate knowledge for werewolf/minion
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

    socket.on('night_action_result', ({ role, result }) => {
      setNightState(prev => ({ ...prev, isMyTurn: false, result }));

      // Accumulate knowledge
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

    socket.on('vote_update', ({ votes, players }) => {
      setDayState(prev => ({ ...prev, votes, players }));
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
  }, []);

  // Track swap actions from client side for visual
  const handleNightAction = useCallback((role, action) => {
    socket.emit('night_action', { role, action });

    // Track swaps for visual feedback
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
  }, []);

  const isHost = socket.id === hostId;

  if (screen === 'home') {
    return <HomeScreen onJoin={handleJoinRoom} setError={setError} error={error} />;
  }
  if (screen === 'lobby') {
    return (
      <LobbyScreen
        roomCode={roomCode}
        players={players}
        hostId={hostId}
        isHost={isHost}
        settings={settings}
        onSettingsChange={sel => socket.emit('update_settings', { selectedRoles: sel })}
        onStartGame={cb => socket.emit('start_game', {}, cb)}
      />
    );
  }
  if (screen === 'role_reveal') {
    return <RoleRevealScreen myRole={myRole} />;
  }
  if (screen === 'night') {
    return (
      <NightScreen
        myRole={myRole}
        myId={socket.id}
        nightState={nightState}
        players={players}
        onAction={handleNightAction}
        nightKnowledge={nightKnowledge}
      />
    );
  }
  if (screen === 'day') {
    return (
      <DayScreen
        dayState={dayState}
        myId={socket.id}
        isHost={isHost}
        onVote={targetId => socket.emit('vote', { targetId })}
        onEndDay={() => socket.emit('end_day')}
        nightKnowledge={nightKnowledge}
        myRole={myRole}
      />
    );
  }
  if (screen === 'results') {
    return (
      <ResultsScreen
        results={results}
        myId={socket.id}
        isHost={isHost}
        onNewGame={() => socket.emit('new_game')}
      />
    );
  }
  return null;
}
