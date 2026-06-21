'use client';

/* YouTube thumbnail (1280×720). Open at /thumb, screenshot the .thumb-frame
   at exactly 1280×720, or just use the deployed page. ?v=dark for the dark cut. */

import { useEffect, useState } from 'react';
import { EchoLogo, Ic, LogoMark } from '@/components/ui';

export default function Thumb() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read the ?v=dark variant on the client
    setDark(new URLSearchParams(window.location.search).get('v') === 'dark');
  }, []);

  return (
    <div style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', background: '#222', padding: 20 }}>
      <div className={'thumb-frame' + (dark ? ' thumb-dark' : '')}>
        <div className="thumb-doodles" aria-hidden>
          {([['6%', '14%', 'spark', 'var(--sun)'], ['46%', '8%', 'star', 'var(--sun)'], ['8%', '82%', 'heart', 'var(--rose)'],
            ['52%', '88%', 'spark', 'var(--lav-deep)']] as [string, string, string, string][]).map(([x, y, ic, c], i) => (
            <span key={i} style={{ left: x, top: y }}><Ic name={ic} size={40} stroke={c} fill={c} sw={2.2} /></span>
          ))}
        </div>

        {/* left — the hook */}
        <div className="thumb-left">
          <div className="thumb-brand">
            <EchoLogo size={62} />
            <span className="thumb-word display">echo</span>
            <span className="thumb-pill"><LogoMark brand="walrus" size={17} /> Walrus Track</span>
          </div>

          <h1 className="display thumb-head">
            The AI that<br /><span className="thumb-em">remembers you</span>.
          </h1>

          <p className="thumb-sub">Voice-first reflection · a memory you <b>actually own</b>, on Walrus + Sui</p>
        </div>

        {/* right — the product shot */}
        <div className="thumb-right">
          <div className="thumb-screen">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/thumb-room.png" alt="" />
            <span className="thumb-tag"><Ic name="mic" size={18} /> talk to Echo</span>
          </div>
        </div>
      </div>
    </div>
  );
}
