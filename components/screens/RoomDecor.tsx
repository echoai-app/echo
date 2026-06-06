'use client';

import React from 'react';

/* Doodle furniture for the reflection room — ported from the handoff. Purely
   decorative; pointer-events disabled via .furn. */
export function RoomDecor() {
  return (
    <React.Fragment>
      {/* pendant light */}
      <div className="furn" style={{ left: '50%', top: 0, transform: 'translateX(-50%)', width: 64, zIndex: 1 }}>
        <svg viewBox="0 0 80 84" width="100%">
          <line x1="40" y1="0" x2="40" y2="28" stroke="#352A1F" strokeWidth="3.5" />
          <ellipse cx="40" cy="62" rx="20" ry="5" fill="#F8E6B8" stroke="#352A1F" strokeWidth="3" />
          <path d="M22 54a18 16 0 0 1 36 0Z" fill="#F5CE74" stroke="#352A1F" strokeWidth="4" strokeLinejoin="round" />
        </svg>
      </div>
      {/* window with a sunset */}
      <div className="furn" style={{ left: '5%', top: '11%', width: 148 }}>
        <svg viewBox="0 0 140 162" width="100%">
          <defs>
            <linearGradient id="echoSky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#F7CBA4" /><stop offset="0.55" stopColor="#E7C0DE" /><stop offset="1" stopColor="#CBD8F0" />
            </linearGradient>
          </defs>
          <rect x="8" y="8" width="124" height="132" rx="16" fill="#F2DEBE" stroke="#352A1F" strokeWidth="5" />
          <rect x="20" y="20" width="100" height="108" rx="8" fill="url(#echoSky)" stroke="#352A1F" strokeWidth="3" />
          <circle cx="92" cy="46" r="12" fill="#F5CE74" stroke="#352A1F" strokeWidth="3" />
          <path d="M30 104c10-16 22-16 34-2 6-7 14-6 18 2Z" fill="#fff" opacity="0.85" stroke="#352A1F" strokeWidth="2.6" strokeLinejoin="round" />
          <line x1="70" y1="20" x2="70" y2="128" stroke="#352A1F" strokeWidth="3" />
          <line x1="20" y1="74" x2="120" y2="74" stroke="#352A1F" strokeWidth="3" />
          <rect x="2" y="138" width="136" height="13" rx="5" fill="#E3C397" stroke="#352A1F" strokeWidth="4" />
        </svg>
      </div>
      {/* shelf · frame · plant */}
      <div className="furn" style={{ right: '6%', top: '15%', width: 142 }}>
        <svg viewBox="0 0 150 102" width="100%">
          <rect x="14" y="6" width="64" height="50" rx="6" fill="#FFFDF8" stroke="#352A1F" strokeWidth="4" />
          <path d="M20 48l13-19 9 11 8-13 12 21Z" fill="#A9C9E9" stroke="#352A1F" strokeWidth="3" strokeLinejoin="round" />
          <circle cx="61" cy="20" r="5" fill="#F5CE74" stroke="#352A1F" strokeWidth="2.5" />
          <path d="M97 34h22l-4 22h-14Z" fill="#F4B89A" stroke="#352A1F" strokeWidth="3.4" strokeLinejoin="round" />
          <g fill="none" stroke="#7FC295" strokeWidth="3.4" strokeLinecap="round"><path d="M108 34c-6-8-7-15-7-19" /><path d="M108 34c6-8 9-13 12-16" /><path d="M108 34c0-10 0-17 0-21" /></g>
          <rect x="2" y="58" width="146" height="11" rx="4" fill="#E3C397" stroke="#352A1F" strokeWidth="4" />
        </svg>
      </div>
      {/* potted plant */}
      <div className="furn" style={{ left: '8%', bottom: '11%', width: 92 }}>
        <svg viewBox="0 0 100 122" width="100%">
          <g fill="#AEDAB9" stroke="#352A1F" strokeWidth="3.4" strokeLinejoin="round">
            <path d="M50 72C40 42 22 36 18 32 31 30 48 42 50 72Z" />
            <path d="M50 72C60 42 78 36 82 32 69 30 52 42 50 72Z" />
          </g>
          <path d="M50 74C48 40 50 24 50 18 52 28 54 46 50 74Z" fill="#7FC295" stroke="#352A1F" strokeWidth="3.4" strokeLinejoin="round" />
          <path d="M30 72h40l-6 38a6 6 0 0 1-6 5H42a6 6 0 0 1-6-5Z" fill="#F4B89A" stroke="#352A1F" strokeWidth="4" strokeLinejoin="round" />
          <rect x="26" y="66" width="48" height="12" rx="5" fill="#ED9C74" stroke="#352A1F" strokeWidth="4" />
        </svg>
      </div>
      {/* floor lamp */}
      <div className="furn" style={{ right: '8%', bottom: '11%', width: 76 }}>
        <svg viewBox="0 0 90 204" width="100%">
          <ellipse cx="45" cy="36" rx="42" ry="34" fill="#F5CE74" opacity="0.30" />
          <path d="M26 14h38l8 36H18Z" fill="#FBF1E0" stroke="#352A1F" strokeWidth="4" strokeLinejoin="round" />
          <rect x="43" y="50" width="4.5" height="124" fill="#352A1F" />
          <path d="M26 180h38l-7 12H33Z" fill="#CBBCEE" stroke="#352A1F" strokeWidth="4" strokeLinejoin="round" />
        </svg>
      </div>
      {/* pouffe */}
      <div className="furn" style={{ left: '50%', bottom: '12%', transform: 'translateX(-50%)', width: 176 }}>
        <svg viewBox="0 0 184 72" width="100%">
          <ellipse cx="92" cy="44" rx="80" ry="26" fill="#CBBCEE" stroke="#352A1F" strokeWidth="4" />
          <ellipse cx="92" cy="34" rx="80" ry="22" fill="#D8CCF2" stroke="#352A1F" strokeWidth="3.4" />
          <g stroke="#A98FE0" strokeWidth="2.6" fill="none" strokeLinecap="round"><path d="M92 12v20" /><path d="M50 18l8 15" /><path d="M134 18l-8 15" /></g>
        </svg>
      </div>
    </React.Fragment>
  );
}
