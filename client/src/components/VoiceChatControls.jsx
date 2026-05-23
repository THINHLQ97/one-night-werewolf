import { useState, useEffect, useCallback, useRef } from 'react';
import Icon from './Icon';
import voiceChat from '../voiceChat';
import { setBgmVolume, getBgmVolume } from '../audio';

export default function VoiceChatControls({ roomCode, isHost, players, myId }) {
  const [joined, setJoined] = useState(voiceChat.isJoined);
  const [muted, setMuted] = useState(voiceChat.isMuted);
  const [bgmVol, setBgmVol] = useState(getBgmVolume());
  const [showBgmSlider, setShowBgmSlider] = useState(false);
  const [micError, setMicError] = useState(false);
  const bgmRef = useRef(null);

  // Close BGM slider when clicking outside
  useEffect(() => {
    if (!showBgmSlider) return;
    const handler = (e) => {
      if (bgmRef.current && !bgmRef.current.contains(e.target)) {
        setShowBgmSlider(false);
      }
    };
    document.addEventListener('pointerdown', handler);
    return () => document.removeEventListener('pointerdown', handler);
  }, [showBgmSlider]);

  const handleJoin = useCallback(async () => {
    try {
      setMicError(false);
      await voiceChat.join(roomCode);
      setJoined(true);
      setMuted(false);
    } catch (e) {
      setMicError(true);
      console.error('Mic access denied:', e);
    }
  }, [roomCode]);

  const handleLeave = useCallback(() => {
    voiceChat.leave();
    setJoined(false);
    setMuted(false);
  }, []);

  const handleToggleMute = useCallback(() => {
    const newMuted = voiceChat.toggleMute();
    setMuted(newMuted);
  }, []);

  const handleBgmChange = useCallback((e) => {
    const v = parseFloat(e.target.value);
    setBgmVol(v);
    setBgmVolume(v);
  }, []);

  const handleHostMute = useCallback((peerId) => {
    voiceChat.hostMutePlayer(peerId);
  }, []);

  // Listen for host mute requests
  useEffect(() => {
    const handler = () => {
      voiceChat.setMuted(true);
      setMuted(true);
    };
    voiceChat.socket?.on('voice_host_mute_request', handler);
    return () => voiceChat.socket?.off('voice_host_mute_request', handler);
  }, []);

  const bgmIcon = bgmVol === 0 ? 'volumeOff' : bgmVol < 0.5 ? 'volumeLow' : 'volume';

  return (
    <div className="flex items-center gap-1.5">
      {/* BGM volume control */}
      <div ref={bgmRef} className="relative">
        <button
          onClick={() => setShowBgmSlider(s => !s)}
          className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
            bgmVol === 0 ? 'bg-wolf-500/20 text-wolf-400' : 'bg-white/10 text-white/50 hover:bg-white/20'
          }`}
          title="BGM"
        >
          <Icon name={bgmIcon} size={16} />
        </button>
        {showBgmSlider && (
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-night-800 border border-white/20 rounded-xl px-3 py-2.5 shadow-xl min-w-[140px] z-50">
            <p className="text-white/40 text-[10px] text-center mb-1.5 font-medium">BGM</p>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={bgmVol}
              onChange={handleBgmChange}
              className="w-full accent-moon-400 h-1"
            />
            <div className="flex justify-between text-white/30 text-[9px] mt-0.5">
              <span>0%</span>
              <span>{Math.round(bgmVol * 100)}%</span>
            </div>
          </div>
        )}
      </div>

      {/* Voice chat toggle */}
      {!joined ? (
        <button
          onClick={handleJoin}
          className={`h-8 px-2.5 rounded-full flex items-center gap-1.5 text-xs font-medium transition-all ${
            micError
              ? 'bg-wolf-500/20 text-wolf-400 border border-wolf-500/30'
              : 'bg-village-500/20 text-village-400 border border-village-500/30 hover:bg-village-500/30'
          }`}
          title={micError ? 'Microphone bị chặn' : 'Tham gia voice chat'}
        >
          <Icon name={micError ? 'micOff' : 'headphones'} size={14} />
          <span className="hidden sm:inline">{micError ? 'Mic lỗi' : 'Voice'}</span>
        </button>
      ) : (
        <div className="flex items-center gap-1">
          {/* Mute/unmute */}
          <button
            onClick={handleToggleMute}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
              muted
                ? 'bg-wolf-500/30 text-wolf-400'
                : 'bg-village-500/30 text-village-400'
            }`}
            title={muted ? 'Bật mic' : 'Tắt mic'}
          >
            <Icon name={muted ? 'micOff' : 'mic'} size={16} />
          </button>

          {/* Leave voice */}
          <button
            onClick={handleLeave}
            className="w-8 h-8 rounded-full bg-wolf-500/20 text-wolf-400 flex items-center justify-center hover:bg-wolf-500/30 transition-colors relative"
            title="Rời voice chat"
          >
            <Icon name="headphones" size={14} />
            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-wolf-500 text-white text-[7px] font-bold flex items-center justify-center leading-none">✕</span>
          </button>
        </div>
      )}
    </div>
  );
}

// Speaking indicator for GameTable player nodes
export function SpeakingIndicator({ speaking, size = 1 }) {
  if (!speaking) return null;

  return (
    <span
      className="absolute -top-0.5 -right-0.5 rounded-full"
      style={{
        width: 12 * size,
        height: 12 * size,
        background: 'radial-gradient(circle, #4ade80 30%, rgba(74,222,128,0.4))',
        boxShadow: '0 0 6px rgba(74,222,128,0.8)',
        animation: 'voicePulse 1s ease-in-out infinite',
      }}
    />
  );
}
