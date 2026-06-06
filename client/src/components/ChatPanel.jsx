import { useState, useEffect, useRef, useCallback } from 'react';
import Icon from './Icon';
import socket from '../socket';

// Available sticker IDs (some numbers missing from asset set)
const STICKER_IDS = [1,2,3,4,5,9,11,12,13,14,15,16,17,18,19,20,21,22,23,24];
function stickerUrl(id) { return `/images/icon/icon${id}.png`; }

// Clamp position within viewport
function clampPos(x, y, w, h) {
  return {
    x: Math.max(0, Math.min(x, window.innerWidth - w)),
    y: Math.max(0, Math.min(y, window.innerHeight - h)),
  };
}

export default function ChatPanel({ roomCode, myId, players, messages = [], isSilenced = false }) {
  const [input, setInput] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [stickerOpen, setStickerOpen] = useState(false);
  const [lastSeenCount, setLastSeenCount] = useState(0);
  const [minimized, setMinimized] = useState(false);

  // Drag state
  const [pos, setPos] = useState({ x: -1, y: -1 }); // -1 = not initialized
  const [dragging, setDragging] = useState(false);
  const dragOffset = useRef({ dx: 0, dy: 0 });
  const panelRef = useRef(null);
  const listRef = useRef(null);
  const inputRef = useRef(null);

  const PANEL_W = 340;
  const PANEL_H_NORMAL = 380;
  const PANEL_H_STICKER = 480;
  const PANEL_H_MIN = 44;

  const panelH = minimized ? PANEL_H_MIN : stickerOpen ? PANEL_H_STICKER : PANEL_H_NORMAL;

  const unread = isOpen ? 0 : Math.max(0, messages.length - lastSeenCount);

  // Initialize position to bottom-right on first open
  useEffect(() => {
    if (isOpen && pos.x === -1) {
      setPos({
        x: Math.max(0, window.innerWidth - PANEL_W - 16),
        y: Math.max(0, window.innerHeight - PANEL_H_NORMAL - 16),
      });
    }
  }, [isOpen]);

  // Auto-scroll on new messages when open
  useEffect(() => {
    if (listRef.current && isOpen && !minimized) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, isOpen, minimized]);

  // ── Drag handlers (mouse + touch) ──
  const onDragStart = useCallback((clientX, clientY) => {
    setDragging(true);
    dragOffset.current = { dx: clientX - pos.x, dy: clientY - pos.y };
  }, [pos]);

  const onDragMove = useCallback((clientX, clientY) => {
    if (!dragging) return;
    const clamped = clampPos(
      clientX - dragOffset.current.dx,
      clientY - dragOffset.current.dy,
      PANEL_W, panelH
    );
    setPos(clamped);
  }, [dragging, panelH]);

  const onDragEnd = useCallback(() => setDragging(false), []);

  // Mouse events
  const onMouseDown = useCallback((e) => {
    e.preventDefault();
    onDragStart(e.clientX, e.clientY);
  }, [onDragStart]);

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e) => onDragMove(e.clientX, e.clientY);
    const onUp = () => onDragEnd();
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [dragging, onDragMove, onDragEnd]);

  // Touch events
  const onTouchStart = useCallback((e) => {
    const t = e.touches[0];
    onDragStart(t.clientX, t.clientY);
  }, [onDragStart]);

  const onTouchMove = useCallback((e) => {
    if (!dragging) return;
    const t = e.touches[0];
    onDragMove(t.clientX, t.clientY);
  }, [dragging, onDragMove]);

  // Mark as read when opening
  const toggleOpen = useCallback(() => {
    setIsOpen(prev => {
      if (!prev) {
        setLastSeenCount(messages.length);
        setStickerOpen(false);
        setMinimized(false);
        setTimeout(() => inputRef.current?.focus(), 100);
      }
      return !prev;
    });
  }, [messages.length]);

  const sendMessage = useCallback(() => {
    const text = input.trim();
    if (!text || !roomCode) return;
    socket.emit('chat_send', { roomCode, text: text.slice(0, 200) });
    setInput('');
    setStickerOpen(false);
  }, [input, roomCode]);

  const sendSticker = useCallback((stickerId) => {
    if (!roomCode) return;
    socket.emit('chat_sticker', { roomCode, stickerId });
    setStickerOpen(false);
  }, [roomCode]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }, [sendMessage]);

  // Build player lookup
  const playerMap = {};
  players?.forEach(p => { playerMap[p.id] = p; });

  return (
    <>
      {/* Chat toggle button */}
      <button
        onClick={toggleOpen}
        className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors relative ${
          isOpen ? 'bg-moon-400/30 text-moon-300' : 'bg-white/10 text-white/50 hover:bg-white/20'
        }`}
        title="Chat"
      >
        <Icon name="chat" size={16} />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-wolf-500 text-white text-[9px] font-bold flex items-center justify-center leading-none">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Draggable chat panel */}
      {isOpen && (
        <div
          ref={panelRef}
          className="fixed z-40 flex flex-col rounded-2xl overflow-hidden shadow-2xl border border-white/10"
          style={{
            left: pos.x,
            top: pos.y,
            width: PANEL_W,
            height: panelH,
            maxWidth: '95vw',
            transition: dragging ? 'none' : 'height 0.2s ease',
            background: 'rgba(15, 15, 30, 0.97)',
            backdropFilter: 'blur(12px)',
          }}
        >
          {/* ── Drag handle / Header ── */}
          <div
            className="flex items-center justify-between px-3 py-2 select-none flex-shrink-0"
            style={{ cursor: dragging ? 'grabbing' : 'grab', touchAction: 'none' }}
            onMouseDown={onMouseDown}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onDragEnd}
          >
            <div className="flex items-center gap-2">
              {/* Drag indicator */}
              <span className="text-white/20 text-[10px] leading-none select-none">⠿</span>
              <span className="text-white/60 text-xs font-semibold flex items-center gap-1.5">
                <Icon name="chat" size={14} /> Trò chuyện
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => { e.stopPropagation(); setMinimized(m => !m); setStickerOpen(false); }}
                onMouseDown={e => e.stopPropagation()}
                className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-white/40 hover:bg-white/20 text-[10px]"
                title={minimized ? 'Mở rộng' : 'Thu nhỏ'}
              >
                {minimized ? '▢' : '—'}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); toggleOpen(); }}
                onMouseDown={e => e.stopPropagation()}
                className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-white/40 hover:bg-white/20 text-[10px]"
                title="Đóng"
              >
                ✕
              </button>
            </div>
          </div>

          {/* ── Content (hidden when minimized) ── */}
          {!minimized && (
            <>
              {/* Messages */}
              <div
                ref={listRef}
                className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5 border-t border-white/5"
                style={{ overscrollBehavior: 'contain' }}
              >
                {messages.length === 0 && (
                  <p className="text-white/20 text-xs text-center py-8">Chưa có tin nhắn nào</p>
                )}
                {messages.map((msg, i) => {
                  const isMe = msg.id === myId;

                  if (msg.type === 'phase') {
                    return (
                      <div key={i} className="flex items-center gap-2 py-1.5 my-1">
                        <div className="flex-1 h-px bg-white/10" />
                        <span className="text-white/40 text-[10px] font-semibold whitespace-nowrap">{msg.text}</span>
                        <div className="flex-1 h-px bg-white/10" />
                      </div>
                    );
                  }

                  if (msg.type === 'system') {
                    return (
                      <div key={i} className="text-center">
                        <span className="text-white/30 text-[10px] italic">{msg.text}</span>
                      </div>
                    );
                  }

                  const player = playerMap[msg.id];
                  const avatarLetter = (msg.name || '?')[0].toUpperCase();
                  const avatarUrl = player?.avatarUrl;
                  const isSticker = msg.type === 'sticker';

                  return (
                    <div key={i} className={`flex gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                      {!isMe && (
                        <div className="flex-shrink-0 mt-4">
                          {avatarUrl ? (
                            <img src={avatarUrl} alt="" className="w-7 h-7 rounded-full object-cover" />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-moon-400/20 flex items-center justify-center text-moon-400 text-[11px] font-bold">
                              {avatarLetter}
                            </div>
                          )}
                        </div>
                      )}

                      <div className={`flex flex-col max-w-[75%] min-w-0 ${isMe ? 'items-end' : 'items-start'}`}>
                        {!isMe && (
                          <span className="text-moon-400/60 text-[10px] font-medium mb-0.5 ml-1">{msg.name}</span>
                        )}

                        {isSticker ? (
                          <img
                            src={stickerUrl(msg.stickerId)}
                            alt="sticker"
                            className="w-24 h-24 object-contain drop-shadow-lg"
                          />
                        ) : (
                          <div className={`px-3 py-1.5 rounded-2xl break-words ${
                            isMe
                              ? 'bg-moon-400/20 text-moon-200 rounded-br-md'
                              : 'bg-white/10 text-white/80 rounded-bl-md'
                          }`}>
                            <span className="text-sm leading-relaxed">{msg.text}</span>
                          </div>
                        )}

                        <span className="text-white/20 text-[9px] mt-0.5 mx-1">
                          {new Date(msg.time).toLocaleTimeString('vi', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Sticker picker */}
              {stickerOpen && (
                <div className="border-t border-white/5 px-2 py-2 overflow-y-auto flex-shrink-0" style={{ maxHeight: 140 }}>
                  <div className="grid grid-cols-5 gap-1">
                    {STICKER_IDS.map(id => (
                      <button
                        key={id}
                        onClick={() => sendSticker(id)}
                        className="w-full aspect-square rounded-lg bg-white/5 hover:bg-white/15 active:scale-90 transition-all flex items-center justify-center p-1"
                      >
                        <img src={stickerUrl(id)} alt={`sticker ${id}`} className="w-full h-full object-contain" loading="lazy" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input */}
              <div className="flex items-center gap-1.5 px-3 py-2 border-t border-white/5 flex-shrink-0">
                <button
                  onClick={() => setStickerOpen(prev => !prev)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors flex-shrink-0 ${
                    stickerOpen ? 'bg-moon-400/30 text-moon-300' : 'bg-white/5 text-white/40 hover:bg-white/15'
                  }`}
                  title="Sticker"
                >
                  <span className="text-base">😀</span>
                </button>
                <input
                  ref={inputRef}
                  type="text"
                  value={isSilenced ? '' : input}
                  onChange={e => !isSilenced && setInput(e.target.value)}
                  onKeyDown={isSilenced ? undefined : handleKeyDown}
                  onFocus={() => setStickerOpen(false)}
                  placeholder={isSilenced ? '🤐 Bạn bị cấm nói!' : 'Nhập tin nhắn...'}
                  maxLength={200}
                  disabled={isSilenced}
                  className={`flex-1 rounded-xl px-3 py-1.5 text-sm focus:outline-none min-w-0 ${isSilenced ? 'bg-red-900/20 border border-red-500/30 text-red-300/50 cursor-not-allowed placeholder-red-400/50' : 'bg-white/5 border border-white/10 text-white placeholder-white/30 focus:border-moon-400/50'}`}
                  style={{ userSelect: 'text' }}
                />
                <button
                  onClick={sendMessage}
                  disabled={isSilenced || !input.trim()}
                  className="w-8 h-8 rounded-full bg-moon-400/20 text-moon-400 flex items-center justify-center disabled:opacity-30 hover:bg-moon-400/30 transition-colors flex-shrink-0"
                >
                  <Icon name="send" size={16} />
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
