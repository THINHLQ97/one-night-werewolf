// ─── WebRTC Voice Chat Manager ──────────────────────────────────────────────
// Mesh topology: each peer connects to every other peer
// Uses Socket.IO for signaling, Google STUN for NAT traversal

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

class VoiceChatManager {
  constructor() {
    this.socket = null;
    this.localStream = null;
    this.peers = {};          // peerId -> RTCPeerConnection
    this.remoteStreams = {};   // peerId -> MediaStream
    this.analysers = {};      // peerId -> { analyser, dataArray }
    this.localAnalyser = null;
    this.audioContext = null;
    this.isMuted = false;
    this.speakingStates = {}; // peerId -> boolean
    this.onSpeakingChange = null; // callback(speakingMap)
    this.onPeersChange = null;    // callback(peerIds[])
    this._speakingInterval = null;
    this._joined = false;
    this.roomCode = null;
  }

  init(socket) {
    this.socket = socket;
    this._setupSignaling();
  }

  _setupSignaling() {
    const s = this.socket;
    if (!s) return;

    s.on('voice_peer_joined', ({ peerId }) => {
      if (this._joined && !this.peers[peerId]) {
        this._createPeer(peerId, true);
      }
    });

    s.on('voice_peer_left', ({ peerId }) => {
      this._removePeer(peerId);
    });

    s.on('voice_peers', ({ peers }) => {
      // Received list of existing voice peers when joining
      peers.forEach(peerId => {
        if (peerId !== this.socket.id && !this.peers[peerId]) {
          this._createPeer(peerId, true);
        }
      });
    });

    s.on('webrtc_signal', async ({ from, signal }) => {
      if (!this._joined) return;

      if (signal.type === 'offer') {
        // Incoming offer — create peer if not exists, set remote, answer
        if (!this.peers[from]) {
          this._createPeer(from, false);
        }
        const pc = this.peers[from];
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(signal));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          this.socket.emit('webrtc_signal', { to: from, signal: answer });
        } catch (e) {
          console.warn('Voice: Error handling offer from', from, e);
        }
      } else if (signal.type === 'answer') {
        const pc = this.peers[from];
        if (pc) {
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(signal));
          } catch (e) {
            console.warn('Voice: Error handling answer from', from, e);
          }
        }
      } else if (signal.candidate) {
        const pc = this.peers[from];
        if (pc) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(signal));
          } catch (e) {
            console.warn('Voice: Error adding ICE candidate from', from, e);
          }
        }
      }
    });

    s.on('voice_muted', ({ peerId, muted }) => {
      // A peer changed their mute state
      if (muted) {
        this.speakingStates[peerId] = false;
        this._notifySpeaking();
      }
    });
  }

  async join(roomCode) {
    if (this._joined) return;
    this.roomCode = roomCode;

    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    } catch (err) {
      console.error('Voice: Failed to get microphone:', err);
      throw err;
    }

    // Create audio context for speaking detection
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const source = this.audioContext.createMediaStreamSource(this.localStream);
    const analyser = this.audioContext.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.5;
    source.connect(analyser);
    this.localAnalyser = { analyser, dataArray: new Uint8Array(analyser.frequencyBinCount) };

    this._joined = true;

    // Tell server we're joining voice
    this.socket.emit('voice_join', { roomCode });

    // Start speaking detection loop
    this._startSpeakingDetection();
  }

  leave() {
    if (!this._joined) return;
    this._joined = false;

    // Tell server
    this.socket?.emit('voice_leave', { roomCode: this.roomCode });

    // Stop all peer connections
    Object.keys(this.peers).forEach(pid => this._removePeer(pid));

    // Stop local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach(t => t.stop());
      this.localStream = null;
    }

    // Clean up audio context
    if (this.audioContext) {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }
    this.localAnalyser = null;

    // Stop detection loop
    if (this._speakingInterval) {
      clearInterval(this._speakingInterval);
      this._speakingInterval = null;
    }

    this.speakingStates = {};
    this._notifySpeaking();
    this._notifyPeers();
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(t => {
        t.enabled = !this.isMuted;
      });
    }
    // Notify peers via server
    this.socket?.emit('voice_mute_change', { roomCode: this.roomCode, muted: this.isMuted });
    if (this.isMuted) {
      this.speakingStates[this.socket.id] = false;
      this._notifySpeaking();
    }
    return this.isMuted;
  }

  setMuted(muted) {
    this.isMuted = muted;
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(t => {
        t.enabled = !this.isMuted;
      });
    }
    this.socket?.emit('voice_mute_change', { roomCode: this.roomCode, muted: this.isMuted });
    if (this.isMuted) {
      this.speakingStates[this.socket.id] = false;
      this._notifySpeaking();
    }
  }

  // Host remotely mutes a player
  hostMutePlayer(peerId) {
    this.socket?.emit('voice_host_mute', { roomCode: this.roomCode, targetId: peerId });
  }

  _createPeer(peerId, initiator) {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    this.peers[peerId] = pc;

    // Add local tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        pc.addTrack(track, this.localStream);
      });
    }

    // Handle ICE candidates
    pc.onicecandidate = (e) => {
      if (e.candidate) {
        this.socket.emit('webrtc_signal', { to: peerId, signal: e.candidate.toJSON() });
      }
    };

    // Handle remote stream
    pc.ontrack = (e) => {
      const stream = e.streams[0];
      if (stream) {
        this.remoteStreams[peerId] = stream;

        // Play audio via <audio> element FIRST — this is the primary playback method
        this._playRemoteAudio(peerId, stream);

        // Create a SEPARATE analyser for speaking detection only
        // Do NOT connect to audioContext.destination — let <audio> element handle playback
        this._setupRemoteAnalyser(peerId, stream);

        this._notifyPeers();
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
        this._removePeer(peerId);
      }
    };

    // If initiator, create and send offer
    if (initiator) {
      pc.createOffer()
        .then(offer => pc.setLocalDescription(offer))
        .then(() => {
          this.socket.emit('webrtc_signal', { to: peerId, signal: pc.localDescription });
        })
        .catch(err => console.warn('Voice: Error creating offer for', peerId, err));
    }

    this._notifyPeers();
  }

  _playRemoteAudio(peerId, stream) {
    // Remove any existing audio element first
    const existing = document.getElementById(`voice-audio-${peerId}`);
    if (existing) {
      existing.srcObject = null;
      existing.remove();
    }

    // Create a fresh hidden audio element to play remote audio
    const audio = document.createElement('audio');
    audio.id = `voice-audio-${peerId}`;
    audio.autoplay = true;
    audio.playsInline = true;
    audio.volume = 1.0;
    document.body.appendChild(audio);

    // Set stream and play
    audio.srcObject = stream;
    const playPromise = audio.play();
    if (playPromise) {
      playPromise.catch(err => {
        console.warn('Voice: autoplay blocked for peer', peerId, '- retrying on user gesture');
        // Retry on next user interaction
        const retry = () => {
          audio.play().catch(() => {});
          document.removeEventListener('click', retry);
          document.removeEventListener('touchstart', retry);
        };
        document.addEventListener('click', retry, { once: true });
        document.addEventListener('touchstart', retry, { once: true });
      });
    }
  }

  _setupRemoteAnalyser(peerId, stream) {
    // Use a separate AudioContext analyser ONLY for speaking detection
    // This does NOT interfere with the <audio> element playback
    if (!this.audioContext) return;

    try {
      const source = this.audioContext.createMediaStreamSource(stream);
      const analyser = this.audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.5;
      // Connect source -> analyser ONLY (no destination — that would interfere with <audio>)
      source.connect(analyser);
      this.analysers[peerId] = { analyser, dataArray: new Uint8Array(analyser.frequencyBinCount), source };
    } catch (e) {
      console.warn('Voice: Failed to setup analyser for peer', peerId, e);
    }
  }

  _removePeer(peerId) {
    const pc = this.peers[peerId];
    if (pc) {
      pc.close();
      delete this.peers[peerId];
    }
    delete this.remoteStreams[peerId];
    // Disconnect analyser source node
    if (this.analysers[peerId]?.source) {
      try { this.analysers[peerId].source.disconnect(); } catch {}
    }
    delete this.analysers[peerId];
    delete this.speakingStates[peerId];

    // Remove audio element
    const audio = document.getElementById(`voice-audio-${peerId}`);
    if (audio) {
      audio.srcObject = null;
      audio.remove();
    }

    this._notifySpeaking();
    this._notifyPeers();
  }

  _startSpeakingDetection() {
    if (this._speakingInterval) clearInterval(this._speakingInterval);

    this._speakingInterval = setInterval(() => {
      if (!this._joined) return;

      let changed = false;

      // Check local speaking
      if (this.localAnalyser && !this.isMuted) {
        const { analyser, dataArray } = this.localAnalyser;
        analyser.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((s, v) => s + v, 0) / dataArray.length;
        const speaking = avg > 15;
        if (this.speakingStates[this.socket.id] !== speaking) {
          this.speakingStates[this.socket.id] = speaking;
          changed = true;
        }
      }

      // Check each remote peer
      Object.entries(this.analysers).forEach(([peerId, { analyser, dataArray }]) => {
        analyser.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((s, v) => s + v, 0) / dataArray.length;
        const speaking = avg > 15;
        if (this.speakingStates[peerId] !== speaking) {
          this.speakingStates[peerId] = speaking;
          changed = true;
        }
      });

      if (changed) {
        this._notifySpeaking();
      }
    }, 100);
  }

  _notifySpeaking() {
    this.onSpeakingChange?.({ ...this.speakingStates });
  }

  _notifyPeers() {
    this.onPeersChange?.(Object.keys(this.peers));
  }

  get isJoined() {
    return this._joined;
  }

  destroy() {
    this.leave();
    // Remove signaling listeners
    if (this.socket) {
      this.socket.off('voice_peer_joined');
      this.socket.off('voice_peer_left');
      this.socket.off('voice_peers');
      this.socket.off('webrtc_signal');
      this.socket.off('voice_muted');
    }
  }
}

// Singleton
const voiceChat = new VoiceChatManager();
export default voiceChat;
