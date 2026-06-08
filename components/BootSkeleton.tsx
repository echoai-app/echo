'use client';

import { Orb } from './ui';

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
            <Orb size={36} />
            <span className="sk-brandword">ech<span style={{ color: 'var(--peach-deep)' }}>o</span></span>
          </div>
          <div className="sk sk-pillrow" />
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div className="sk sk-chip" />
            <div className="sk sk-avatar" />
          </div>
        </div>

        <div className="screen-scroll">
          <div className="screen-pad" style={{ maxWidth: 1180, margin: '0 auto' }}>
            {/* greeting hero */}
            <div className="card card-lg sk-hero">
              <div className="sk-hero-l">
                <div className="sk sk-circle" />
                <div className="sk-lines">
                  <div className="sk" style={{ width: 130, height: 13, borderRadius: 7 }} />
                  <div className="sk" style={{ width: 'min(58vw,340px)', height: 32, borderRadius: 10 }} />
                  <div className="sk" style={{ width: 'min(46vw,250px)', height: 14, borderRadius: 7 }} />
                </div>
              </div>
              <div className="sk sk-stat" />
            </div>

            {/* section label */}
            <div className="sk-seclabel">
              <div className="sk" style={{ width: 210, height: 13, borderRadius: 7 }} />
              <span className="sk-rule" />
              <div className="sk" style={{ width: 130, height: 13, borderRadius: 7 }} />
            </div>

            {/* mode grid */}
            <div className="r-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="mode-card sk-card">
                  <div className="sk sk-modeic" />
                  <div className="sk" style={{ width: '68%', height: 21, borderRadius: 8, marginTop: 16 }} />
                  <div className="sk" style={{ width: '92%', height: 13, borderRadius: 7, marginTop: 9 }} />
                  <div className="sk-cardfoot">
                    <div className="sk" style={{ width: 72, height: 26, borderRadius: 99 }} />
                    <div className="sk" style={{ width: 84, height: 26, borderRadius: 99 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
