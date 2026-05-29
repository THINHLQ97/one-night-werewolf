import { useState, useEffect, useRef, useCallback } from 'react';
import Icon from './Icon';
import socket from '../socket';

export default function ChatPanel({ roomCode, myId, players, messages = [] }) {
  const [input, setInput] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [lastSeenCount, setLastSeenCount] = useState(0);
  const listRef = useRef(null);
  const inputRef = useRef(null);

  const unread = isOpen ? 0 : Math.max(0, messages.length - lastSeenCount);

  // Auto-scroll on new messages when open
  useEffect(() => {
    if (listRef.current && isOpen) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  // Mark as read when opening
  const toggleOpen = useCallback(() => {
    setIsOpen(prev => {
      if (!prev) {
        setLastSeenCount(messages.length);
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
  }, [input, roomCode]);

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

      {/* Chat panel overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-40" onClick={toggleOpen}>
          <div
            className="absolute bottom-0 left-0 right-0 max-w-xl mx-auto flex flex-col"
            style={{ height: '50vh', maxHeight: 400 }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 bg-night-800 border-t border-x border-white/10 rounded-t-2xl">
              <span className="text-white/60 text-xs font-semibold flex items-center gap-1.5">
                <Icon name="chat" size={14} /> Trò chuyện
              </span>
              <button
                onClick={toggleOpen}
                className="text-white/40 hover:text-white/70 text-xs"
              >
                Thu gọn
              </button>
            </div>

            {/* Messages */}
            <div
              ref={listRef}
              className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5 bg-night-900/95 backdrop-blur-md border-x border-white/10"
              style={{ overscrollBehavior: 'contain' }}
            >
              {messages.length === 0 && (
                <p className="text-white/20 text-xs text-center py-8">Chưa có tin nhắn nào</p>
              )}
              {messages.map((msg, i) => {
                const isMe = msg.id === myId;

                // Phase divider
                if (msg.type === 'phase') {
                  return (
                    <div key={i} className="flex items-center gap-2 py-1.5 my-1">
                      <div className="flex-1 h-px bg-white/10" />
                      <span className="text-white/40 text-[10px] font-semibold whitespace-nowrap">{msg.text}</span>
                      <div className="flex-1 h-px bg-white/10" />
                    </div>
                  );
                }

                // System message
                if (msg.type === 'system') {
                  return (
                    <div key={i} className="text-center">
                      <span className="text-white/30 text-[10px] italic">{msg.text}</span>
                    </div>
                  );
                }

                // User message
                const player = playerMap[msg.id];
                const avatarLetter = (msg.name || '?')[0].toUpperCase();
                const avatarUrl = player?.avatarUrl;

                return (
                  <div key={i} className={`flex gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                    {/* Avatar */}
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

                    <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[75%]`}>
                      {!isMe && (
                        <span className="text-moon-400/60 text-[10px] font-medium mb-0.5 ml-1">{msg.name}</span>
                      )}
                      <div className={`px-3 py-1.5 rounded-2xl break-words ${
                        isMe
                          ? 'bg-moon-400/20 text-moon-200 rounded-br-md'
                          : 'bg-white/10 text-white/80 rounded-bl-md'
                      }`}>
                        <span className="text-sm leading-relaxed">{msg.text}</span>
                      </div>
                      <span className="text-white/20 text-[9px] mt-0.5 mx-1">
                        {new Date(msg.time).toLocaleTimeString('vi', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Input */}
            <div className="flex items-center gap-2 px-3 py-2 bg-night-800 border border-white/10 rounded-b-2xl">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Nhập tin nhắn..."
                maxLength={200}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-moon-400/50"
                style={{ userSelect: 'text' }}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim()}
                className="w-9 h-9 rounded-full bg-moon-400/20 text-moon-400 flex items-center justify-center disabled:opacity-30 hover:bg-moon-400/30 transition-colors"
              >
                <Icon name="send" size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
