import { useState, useEffect, useRef, useCallback } from 'react';
import Icon from './Icon';
import socket from '../socket';

export default function ChatPanel({ roomCode, myId, players }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const listRef = useRef(null);
  const inputRef = useRef(null);
  const isOpenRef = useRef(isOpen);
  isOpenRef.current = isOpen;

  useEffect(() => {
    const handler = ({ id, name, text, time, type }) => {
      setMessages(prev => [...prev.slice(-99), { id, name, text, time, type }]);
      if (!isOpenRef.current) {
        setUnread(u => u + 1);
      }
    };
    socket.on('chat_message', handler);
    return () => socket.off('chat_message', handler);
  }, []);

  // Auto-scroll on new messages
  useEffect(() => {
    if (listRef.current && isOpen) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  // Clear unread when opening
  const toggleOpen = useCallback(() => {
    setIsOpen(prev => {
      if (!prev) {
        setUnread(0);
        setTimeout(() => inputRef.current?.focus(), 100);
      }
      return !prev;
    });
  }, []);

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

  // Build name map
  const nameMap = {};
  players?.forEach(p => { nameMap[p.id] = p.name; });

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
                <Icon name="chat" size={14} /> Chat
              </span>
              <button
                onClick={toggleOpen}
                className="text-white/40 hover:text-white/70 text-xs"
              >
                Thu gon
              </button>
            </div>

            {/* Messages */}
            <div
              ref={listRef}
              className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5 bg-night-900/95 backdrop-blur-md border-x border-white/10"
              style={{ overscrollBehavior: 'contain' }}
            >
              {messages.length === 0 && (
                <p className="text-white/20 text-xs text-center py-8">Chua co tin nhan nao</p>
              )}
              {messages.map((msg, i) => {
                const isMe = msg.id === myId;
                const isSystem = msg.type === 'system';

                if (isSystem) {
                  return (
                    <div key={i} className="text-center">
                      <span className="text-white/30 text-[10px] italic">{msg.text}</span>
                    </div>
                  );
                }

                return (
                  <div key={i} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    {!isMe && (
                      <span className="text-moon-400/60 text-[10px] font-medium mb-0.5 ml-1">{msg.name}</span>
                    )}
                    <div className={`px-3 py-1.5 rounded-2xl max-w-[80%] break-words ${
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
                placeholder="Nhap tin nhan..."
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
