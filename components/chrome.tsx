'use client';

import React, { useEffect, useState } from 'react';
import { useDisconnectWallet } from '@mysten/dapp-kit';
import { Ic, EchoLogo, PoweredBy, LogoMark, Avatar } from './ui';
import { useIdentity } from './identity';
import { useEcho, displayName, type ScreenId } from '@/lib/store';

/* ---------------- session-progress stepper ---------------- */
const SESSION_STEPS = [
  { k: 'setup', label: 'Setup' }, { k: 'reflect', label: 'Reflect' },
  { k: 'memory', label: 'Memory' }, { k: 'debrief', label: 'Debrief' },
];
export function SessionProgress({ step = 0 }: { step?: number }) {
  return (
    <div className="progress-strip">
      {SESSION_STEPS.map((s, i) => (
        <React.Fragment key={s.k}>
          {i > 0 && <span className={'pconn' + (i <= step ? ' filled' : '')} />}
          <span className={'pstep ' + (i < step ? 'done' : i === step ? 'on' : '')}>
            <span className="dot">{i < step ? <Ic name="check" size={13} sw={3} /> : i + 1}</span>
            <span className="plabel">{s.label}</span>
          </span>
        </React.Fragment>
      ))}
    </div>
  );
}

/* ---------------- profile dropdown ---------------- */
function uniqueDays(isos: string[]): number {
  return new Set(isos.map(s => s.slice(0, 10))).size;
}

function PmToggle({ on, set, ic, label, sub }: { on: boolean; set: () => void; ic: string; label: string; sub: string }) {
  return (
    <div className="pm-row toggle">
      <span className="pic" style={{ background: on ? 'var(--mint)' : 'var(--cream-2)' }}><Ic name={ic} size={18} /></span>
      <div style={{ flex: 1 }}>{label}<div className="sub">{sub}</div></div>
      <div className={'switch' + (on ? ' on' : '')} role="switch" aria-checked={on} tabIndex={0}
        onClick={set} onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && set()} />
    </div>
  );
}

function ProfileMenu({ onClose }: { onClose: () => void }) {
  const { go, resetTo, prefs, setPref, setOnboarded, name, pfp, journey, setJourney } = useEcho();
  const id = useIdentity();
  const { mutate: disconnect } = useDisconnectWallet();
  const navTo = (s: ScreenId) => () => { onClose(); go(s); };

  // Load real stats when the menu opens (if we haven't already).
  useEffect(() => {
    if (journey || !id.ready || !id.userId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/journey?user_id=${encodeURIComponent(id.userId!)}&workspace_id=${encodeURIComponent(id.workspaceId!)}`);
        const data = await res.json();
        if (!cancelled) setJourney(data);
      } catch { /* ignore */ }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id.ready, id.userId]);

  const reflections = journey?.sessions.length ?? 0;
  const onWalrus = journey?.total_on_walrus ?? 0;
  const streak = journey ? uniqueDays(journey.sessions.map(s => s.when)) : 0;

  const logout = () => {
    onClose();
    if (id.mode === 'wallet') { try { disconnect(); } catch { /* noop */ } }
    setOnboarded(false);    // show the intro again after logging out
    resetTo('welcome');     // clear history so "back" can't re-enter the app
  };

  return (
    <React.Fragment>
      <div className="profile-scrim" onClick={onClose} />
      <div className="profile-menu" role="menu">
        <button className="pm-head" onClick={navTo('profile')} style={{ width: '100%', border: 'none', cursor: 'pointer', textAlign: 'left' }} title="View profile">
          <Avatar name={name} pfp={pfp} size={52} bg="var(--paper)" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="display" style={{ fontSize: 21 }}>{displayName(name)}</div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: 13, marginTop: 2 }}>
              {id.mode === 'wallet'
                ? <React.Fragment><LogoMark brand="sui" size={15} /> {id.shortAddress}</React.Fragment>
                : <React.Fragment><Ic name="ghost" size={14} /> Guest session</React.Fragment>}
            </div>
          </div>
          <Ic name="arrowR" size={16} stroke="var(--ink)" />
        </button>

        <div className="pm-stats">
          <div className="pm-stat"><b>{reflections}</b><span>reflections</span></div>
          <div className="pm-stat"><b>{streak}</b><span>day streak</span></div>
          <div className="pm-stat"><b>{onWalrus}</b><span>on Walrus</span></div>
        </div>

        <div className="pm-sec">
          <div className="pm-sec-t">Preferences</div>
          <PmToggle on={prefs.voiceReplies} set={() => setPref('voiceReplies', !prefs.voiceReplies)} ic="ear" label="Voice replies" sub="Echo speaks responses aloud" />
          <PmToggle on={prefs.saveToWalrus} set={() => setPref('saveToWalrus', !prefs.saveToWalrus)} ic="anchor" label="Save memories to Walrus" sub="Review before anything is kept" />
          <PmToggle on={prefs.reducedMotion} set={() => setPref('reducedMotion', !prefs.reducedMotion)} ic="moon" label="Reduced motion" sub="Calmer, simpler animations" />
        </div>

        <hr className="pm-divide" />

        <div className="pm-sec">
          <button className="pm-row" onClick={navTo('profile')}>
            <span className="pic" style={{ background: 'var(--mint)' }}><Ic name="heart" size={18} /></span>
            <span style={{ flex: 1 }}>My profile</span><Ic name="arrowR" size={16} stroke="var(--ink-faint)" />
          </button>
          <button className="pm-row" onClick={navTo('account')}>
            <span className="pic" style={{ background: 'var(--sky)' }}><Ic name="gear" size={18} /></span>
            <span style={{ flex: 1 }}>Account &amp; identity</span><Ic name="arrowR" size={16} stroke="var(--ink-faint)" />
          </button>
          <button className="pm-row" onClick={navTo('privacy')}>
            <span className="pic" style={{ background: 'var(--lav)' }}><Ic name="lock" size={18} /></span>
            <span style={{ flex: 1 }}>Privacy &amp; memory</span><Ic name="arrowR" size={16} stroke="var(--ink-faint)" />
          </button>
          <button className="pm-row" onClick={navTo('help')}>
            <span className="pic" style={{ background: 'var(--sun)' }}><Ic name="help" size={18} /></span>
            <span style={{ flex: 1 }}>Help &amp; support</span><Ic name="arrowR" size={16} stroke="var(--ink-faint)" />
          </button>
        </div>

        <button className="pm-logout" onClick={logout}>
          <Ic name="logout" size={18} /> Log out
        </button>

        <div className="pm-foot"><PoweredBy variant="named" size={17} /></div>
      </div>
    </React.Fragment>
  );
}

/* ---------------- top app bar ---------------- */
// Screens you navigate INTO and should be able to step back from. Home (modes)
// is the root, and the linear session flow (setup→room→memory→debrief) has its
// own forward/explicit nav, so they don't get a generic Back.
const BACKABLE = new Set<ScreenId>(['recall', 'timeline', 'profile', 'account', 'privacy', 'help']);

export function AppBar({ active = 'home' }: { active?: 'home' | 'journey' | 'session' }) {
  const { go, back, screen, history, name, pfp } = useEcho();
  const [pOpen, setPOpen] = useState(false);
  const nav = (id: ScreenId) => () => go(id);
  const showBack = history.length > 0 && BACKABLE.has(screen);
  return (
    <div className="appbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: '0 0 auto' }}>
        {showBack && (
          <button className="icon-btn" onClick={back} title="Back" aria-label="Back">
            <Ic name="arrowL" size={18} sw={2.8} />
          </button>
        )}
        <div className="brand" style={{ cursor: 'pointer' }} onClick={nav('modes')} title="Home">
          <EchoLogo size={40} />
          <span style={{ letterSpacing: '-.01em' }}>ech<span style={{ color: 'var(--peach-deep)' }}>o</span></span>
        </div>
      </div>

      <div className="navpills">
        <button className={'navpill' + (active === 'home' ? ' on' : '')} onClick={nav('modes')}>
          <Ic name="home" size={17} /><span>Home</span>
        </button>
        <button className={'navpill' + (active === 'journey' ? ' on' : '')} onClick={nav('timeline')}>
          <Ic name="map" size={17} /><span>My Journey</span>
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: '0 0 auto' }}>
        <PoweredBy variant="bare" size={19} />
        <span style={{ width: 2, height: 24, background: 'var(--cream-3)', borderRadius: 9 }} />
        <div className="profile-wrap">
          <button className="profile-trigger" onClick={() => setPOpen(o => !o)} aria-haspopup="menu" aria-expanded={pOpen}>
            <Avatar name={name} pfp={pfp} size={34} />
            <span className="pname">{displayName(name)}</span>
            <Ic name={pOpen ? 'x' : 'arrowR'} size={14} stroke="var(--ink-soft)" sw={2.6} />
          </button>
          {pOpen && <ProfileMenu onClose={() => setPOpen(false)} />}
        </div>
      </div>
    </div>
  );
}
