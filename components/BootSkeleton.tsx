'use client';

import { EchoLogo } from './ui';

// Shown for the brief moment between first paint and store-hydration, in place
// of the old bare orb. It mirrors the Home (modes) layout — appbar, greeting
// hero, mode grid — with a sweeping shimmer, so the app "draws itself in" the
// way big apps (YouTube/Facebook) do, instead of flashing an empty screen.
export default function BootSkeleton() {
  return (
    <div className="stage" aria-busy="true" aria-label="Loading Echo">
      <div className="screen is-active bg-cream">
        {/* appbar — keep the live orb wordmark, skeleton the rest */}
        <div className="appbar">
          <div className="brand">
            <EchoLogo size={38} />
            <span className="sk-brandword">ech<span style={{ color: 'var(--peach-deep)' }}>o</span></span>
          </div>
          <div className="sk sk-pillrow" />
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div className="sk sk-chip" />
            <div className="sk sk-avatar" />
          </div>
        </div>

        {/* mirrors the simple home: a centered logo, greeting, one big Start
            button, an optional focus line, and two quiet links */}
        <div className="screen-scroll">
          <div className="home2" style={{ alignItems: 'center' }}>
            <div className="sk" style={{ width: 96, height: 96, borderRadius: '50%' }} />
            <div className="sk" style={{ width: 'min(72vw,360px)', height: 36, borderRadius: 11, marginTop: 6 }} />
            <div className="sk" style={{ width: 'min(58vw,300px)', height: 16, borderRadius: 8 }} />
            <div className="sk" style={{ width: 'min(92vw,520px)', height: 92, borderRadius: 26, marginTop: 8 }} />
            <div className="sk" style={{ width: 190, height: 16, borderRadius: 8, marginTop: 6 }} />
            <div style={{ display: 'flex', gap: 18, marginTop: 2 }}>
              <div className="sk" style={{ width: 150, height: 16, borderRadius: 8 }} />
              <div className="sk" style={{ width: 110, height: 16, borderRadius: 8 }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
