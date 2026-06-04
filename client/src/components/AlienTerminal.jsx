import { useState, useEffect, useRef } from 'react';

// Press Start 2P doesn't support Vietnamese diacritics → use VT323 for body (pixel terminal feel + full Vietnamese)
const HEADER_FONT = "'Press Start 2P', 'VT323', monospace";  // ASCII only — use for header
const BODY_FONT = "'VT323', 'Courier New', monospace";       // supports Vietnamese

/**
 * AlienTerminal — retro 8-bit CRT terminal displaying alien app instructions.
 * Features: typing animation, scanlines, blinking cursor, green phosphor glow.
 */
export default function AlienTerminal({ messages = [], maxLines = 5, collapsed: initialCollapsed = false }) {
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  const [displayedMessages, setDisplayedMessages] = useState([]);
  const scrollRef = useRef(null);
  const prevLenRef = useRef(0);

  // On mount with existing messages (e.g. DayScreen recap), show all as already typed
  useEffect(() => {
    if (prevLenRef.current === 0 && messages.length > 0) {
      setDisplayedMessages(messages.map(msg => ({ ...msg, typed: msg.text, full: msg.text, done: true })));
      prevLenRef.current = messages.length;
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Detect NEW messages and start typing animation
  useEffect(() => {
    if (messages.length > prevLenRef.current) {
      const newMsgs = messages.slice(prevLenRef.current);
      newMsgs.forEach((msg, i) => {
        setTimeout(() => {
          setDisplayedMessages(prev => [...prev, { ...msg, typed: '', full: msg.text, done: false }]);
        }, i * 200);
      });
      prevLenRef.current = messages.length;
    }
  }, [messages]);

  // Typing animation
  useEffect(() => {
    const unfinished = displayedMessages.findIndex(m => !m.done);
    if (unfinished === -1) return;

    const msg = displayedMessages[unfinished];
    if (msg.typed.length >= msg.full.length) {
      setDisplayedMessages(prev => prev.map((m, i) => i === unfinished ? { ...m, done: true } : m));
      return;
    }

    // Slower typing (+40%) for mysterious effect
    const speed = 21 + Math.random() * 28;
    const timer = setTimeout(() => {
      setDisplayedMessages(prev => prev.map((m, i) =>
        i === unfinished ? { ...m, typed: m.full.slice(0, m.typed.length + 1) } : m
      ));
    }, speed);

    return () => clearTimeout(timer);
  }, [displayedMessages]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [displayedMessages]);

  if (messages.length === 0) return null;

  const visibleMessages = displayedMessages.slice(-(maxLines * 2));

  return (
    <div className="alien-terminal mb-3 relative">
      {/* Terminal header bar */}
      <div
        className="flex items-center justify-between px-3 py-2 cursor-pointer select-none"
        onClick={() => setCollapsed(c => !c)}
        style={{
          background: '#0a1a0a',
          borderRadius: collapsed ? '8px' : '8px 8px 0 0',
          border: '1px solid #1a3a1a',
          borderBottom: collapsed ? '1px solid #1a3a1a' : 'none',
        }}
      >
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500/60" />
            <span className="w-2 h-2 rounded-full bg-yellow-500/60" />
            <span className="w-2 h-2 rounded-full bg-green-500/80" />
          </div>
          <span
            className="text-green-400/90 uppercase tracking-wider"
            style={{ fontFamily: HEADER_FONT, fontSize: '8px' }}
          >
            ECHO FROM SPACE
          </span>
          {collapsed && (
            <span className="text-green-500/40" style={{ fontFamily: BODY_FONT, fontSize: '14px' }}>
              ({messages.length} logs)
            </span>
          )}
        </div>
        <span
          className="text-green-500/50"
          style={{ fontFamily: HEADER_FONT, fontSize: '8px' }}
        >
          {collapsed ? '[+]' : '[-]'}
        </span>
      </div>

      {/* Terminal body */}
      {!collapsed && (
        <div
          ref={scrollRef}
          className="relative overflow-hidden"
          style={{
            background: '#050f05',
            border: '1px solid #1a3a1a',
            borderTop: 'none',
            borderRadius: '0 0 8px 8px',
            maxHeight: '140px',
            overflowY: 'auto',
            padding: '10px 12px',
            boxShadow: 'inset 0 0 30px rgba(0, 255, 0, 0.03), 0 0 15px rgba(0, 255, 0, 0.05)',
          }}
        >
          {/* Scanlines */}
          <div
            className="pointer-events-none absolute inset-0 z-10"
            style={{
              background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.12) 2px, rgba(0,0,0,0.12) 4px)',
            }}
          />
          {/* CRT vignette */}
          <div
            className="pointer-events-none absolute inset-0 z-10"
            style={{
              background: 'radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.4) 100%)',
            }}
          />

          {/* Messages */}
          <div className="relative z-20 space-y-1.5">
            {visibleMessages.length === 0 && (
              <p
                className="text-green-500/40 italic"
                style={{ fontFamily: BODY_FONT, fontSize: '16px', lineHeight: '18px' }}
              >
                Awaiting signal...
              </p>
            )}
            {visibleMessages.map((msg, i) => (
              <div key={i} className="flex items-start gap-1.5">
                <span
                  className="text-green-600/50 flex-shrink-0 select-none"
                  style={{ fontFamily: BODY_FONT, fontSize: '16px', lineHeight: '18px' }}
                >
                  &gt;
                </span>
                <p
                  className="text-green-400/90"
                  style={{
                    fontFamily: BODY_FONT,
                    fontSize: '16px',
                    lineHeight: '18px',
                    textShadow: '0 0 6px rgba(0, 255, 0, 0.3)',
                    wordBreak: 'break-word',
                  }}
                >
                  {msg.done ? msg.full : msg.typed}
                  {!msg.done && <span className="alien-cursor">_</span>}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
