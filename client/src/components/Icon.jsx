const icons = {
  sparkle: (
    <path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z" fill="currentColor" />
  ),
  door: (
    <>
      <path d="M18 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2z" stroke="currentColor" strokeWidth="2" fill="none" />
      <path d="M14 3v18" stroke="currentColor" strokeWidth="2" />
      <circle cx="11" cy="12" r="1" fill="currentColor" />
    </>
  ),
  robot: (
    <>
      <rect x="5" y="9" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="2" fill="none" />
      <circle cx="9" cy="14" r="1.5" fill="currentColor" />
      <circle cx="15" cy="14" r="1.5" fill="currentColor" />
      <path d="M12 3v4M8 5h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M2 13h3M19 13h3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  moon: (
    <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2" fill="none" />
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  dice: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="2" fill="none" />
      <circle cx="8" cy="8" r="1.2" fill="currentColor" />
      <circle cx="16" cy="8" r="1.2" fill="currentColor" />
      <circle cx="12" cy="12" r="1.2" fill="currentColor" />
      <circle cx="8" cy="16" r="1.2" fill="currentColor" />
      <circle cx="16" cy="16" r="1.2" fill="currentColor" />
    </>
  ),
  book: (
    <>
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" stroke="currentColor" strokeWidth="2" fill="none" />
    </>
  ),
  eye: (
    <>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2" fill="none" />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" fill="none" />
    </>
  ),
  eyeOff: (
    <>
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M1 1l22 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M14.12 14.12a3 3 0 11-4.24-4.24" stroke="currentColor" strokeWidth="2" fill="none" />
    </>
  ),
  users: (
    <>
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
      <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" fill="none" />
      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
    </>
  ),
  cards: (
    <>
      <rect x="2" y="4" width="13" height="17" rx="2" stroke="currentColor" strokeWidth="2" fill="none" />
      <path d="M9 1h8a2 2 0 012 2v14" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
    </>
  ),
  trophy: (
    <>
      <path d="M6 9H3a1 1 0 01-1-1V5a1 1 0 011-1h3M18 9h3a1 1 0 001-1V5a1 1 0 00-1-1h-3" stroke="currentColor" strokeWidth="2" fill="none" />
      <path d="M18 4H6v8a6 6 0 0012 0V4z" stroke="currentColor" strokeWidth="2" fill="none" />
      <path d="M8 21h8M12 17v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  refresh: (
    <>
      <path d="M23 4v6h-6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M1 20v-6h6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
    </>
  ),
  notebook: (
    <>
      <path d="M4 4h16a1 1 0 011 1v14a1 1 0 01-1 1H4a1 1 0 01-1-1V5a1 1 0 011-1z" stroke="currentColor" strokeWidth="2" fill="none" />
      <path d="M7 4v16M11 8h5M11 12h5M11 16h3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  clipboard: (
    <>
      <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" stroke="currentColor" strokeWidth="2" fill="none" />
      <rect x="8" y="2" width="8" height="4" rx="1" stroke="currentColor" strokeWidth="2" fill="none" />
    </>
  ),
  pencil: (
    <>
      <path d="M17 3a2.83 2.83 0 114 4L7.5 20.5 2 22l1.5-5.5z" stroke="currentColor" strokeWidth="2" fill="none" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
      <circle cx="12" cy="12" r="6" stroke="currentColor" strokeWidth="2" fill="none" />
      <circle cx="12" cy="12" r="2" fill="currentColor" />
    </>
  ),
  skull: (
    <>
      <circle cx="12" cy="10" r="8" stroke="currentColor" strokeWidth="2" fill="none" />
      <circle cx="9" cy="9" r="1.5" fill="currentColor" />
      <circle cx="15" cy="9" r="1.5" fill="currentColor" />
      <path d="M9 18v4M12 18v4M15 18v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M10 14a2 2 0 014 0" stroke="currentColor" strokeWidth="2" fill="none" />
    </>
  ),
  lightning: (
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" strokeWidth="2" fill="none" strokeLinejoin="round" />
  ),
  pause: (
    <>
      <rect x="6" y="4" width="4" height="16" rx="1" fill="currentColor" />
      <rect x="14" y="4" width="4" height="16" rx="1" fill="currentColor" />
    </>
  ),
  play: (
    <path d="M5 3l14 9-14 9V3z" fill="currentColor" />
  ),
  wifi: (
    <>
      <path d="M5 12.55a11 11 0 0114.08 0M1.42 9a16 16 0 0121.16 0M8.53 16.11a6 6 0 016.95 0" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
      <circle cx="12" cy="20" r="1" fill="currentColor" />
    </>
  ),
  swords: (
    <>
      <path d="M14.5 17.5L3 6V3h3l11.5 11.5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M13 19l6 -6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M16 16l4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M9.5 17.5L21 6V3h-3L6.5 14.5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
    </>
  ),
  vote: (
    <>
      <path d="M5 3a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2H5z" stroke="currentColor" strokeWidth="2" fill="none" />
      <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  shield: (
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="2" fill="none" />
  ),
  crown: (
    <>
      <path d="M2 17l3-10 5 5 2-9 2 9 5-5 3 10z" stroke="currentColor" strokeWidth="2" fill="none" strokeLinejoin="round" />
      <path d="M2 17h20v3H2z" stroke="currentColor" strokeWidth="2" fill="none" />
    </>
  ),
  arrowLeft: (
    <>
      <path d="M19 12H5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  crosshair: (
    <>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
      <path d="M22 12h-4M6 12H2M12 6V2M12 22v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  timer: (
    <>
      <circle cx="12" cy="13" r="8" stroke="currentColor" strokeWidth="2" fill="none" />
      <path d="M12 9v4l2 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M9 2h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </>
  ),
};

export default function Icon({ name, size = 20, className = '' }) {
  const content = icons[name];
  if (!content) return null;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
    >
      {content}
    </svg>
  );
}
