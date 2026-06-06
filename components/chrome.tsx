'use client';

import React, { useState } from 'react';
import { useDisconnectWallet } from '@mysten/dapp-kit';
import { Ic, Orb, PoweredBy, LogoMark } from './ui';
import { useIdentity } from './identity';
import { useEcho, type ScreenId } from '@/lib/store';

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

function ProfileMenu({ onClose }: { onClose: () => void }) {
  const { go, prefs, setPref, name, journey } = useEcho();
  const id = useIdentity();
  const { mutate: disconnect } = useDisconnectWallet();

  const reflections = journey?.sessions.length ?? 0;
  const onWalrus = journey?.total_on_walrus ?? 0;
  const streak = journey ? uniqueDays(journey.sessions.map(s => s.when)) : 0;

  const Toggle = ({ on, set, ic, label, sub }: { on: boolean; set: () => void; ic: string; label: string; sub: string }) => (
    <div className="pm-row toggle">
      <span className="pic" style={{ background: on ? 'var(--mint)' : 'var(--cream-2)' }}><Ic name={ic} size={18} /></span>
      <div style={{ flex: 1 }}>{label}<div className="sub">{sub}</div></div>
      <div className={'switch' + (on ? ' on' : '')} role="switch" aria-checked={on} tabIndex={0}
        onClick={set} onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && set()} />
    </div>
  );

  const logout = () => {
    onClose();
    if (id.mode === 'wallet') { try { disconnect(); } catch { /* noop */ } }
    go('welcome');
  };

  return (
    <React.Fragment>
      <div className="profile-scrim" onClick={onClose} />
      <div className="profile-menu" role="menu">
        <div className="pm-head">
          <div className="avatar">{name[0]?.toUpperCase()}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="display" style={{ fontSize: 21 }}>{name}</div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: 13, marginTop: 2 }}>
              {id.mode === 'wallet'
                ? <React.Fragment><LogoMark brand="sui" size={15} /> {id.shortAddress}</React.Fragment>
                : <React.Fragment><Ic name="ghost" size={14} /> Guest session</React.Fragment>}
            </div>
          </div>
        </div>

        <div className="pm-stats">
          <div className="pm-stat"><b>{reflections}</b><span>reflections</span></div>
          <div className="pm-stat"><b>{streak}</b><span>day streak</span></div>
          <div className="pm-stat"><b>{onWalrus}</b><span>on Walrus</span></div>
        </div>

        <div className="pm-sec">
          <div className="pm-sec-t">Preferences</div>
          <Toggle on={prefs.voiceReplies} set={() => setPref('voiceReplies', !prefs.voiceReplies)} ic="ear" label="Voice replies" sub="Echo speaks responses aloud" />
          <Toggle on={prefs.saveToWalrus} set={() => setPref('saveToWalrus', !prefs.saveToWalrus)} ic="anchor" label="Save memories to Walrus" sub="Review before anything is kept" />
          <Toggle on={prefs.reducedMotion} set={() => setPref('reducedMotion', !prefs.reducedMotion)} ic="moon" label="Reduced motion" sub="Calmer, simpler animations" />
        </div>

        <hr className="pm-divide" />

        <div className="pm-sec">
          <button className="pm-row" onClick={() => { onClose(); go('consent'); }}>
            <span className="pic" style={{ background: 'var(--sky)' }}><Ic name="gear" size={18} /></span>
            <span style={{ flex: 1 }}>Account &amp; identity</span><Ic name="arrowR" size={16} stroke="var(--ink-faint)" />
          </button>
          <button className="pm-row" onClick={() => { onClose(); go('timeline'); }}>
            <span className="pic" style={{ background: 'var(--lav)' }}><Ic name="lock" size={18} /></span>
            <span style={{ flex: 1 }}>Privacy &amp; memory</span><Ic name="arrowR" size={16} stroke="var(--ink-faint)" />
          </button>
          <button className="pm-row" onClick={onClose}>
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
export function AppBar({ active = 'home' }: { active?: 'home' | 'journey' | 'session' }) {
  const { go, name } = useEcho();
  const [pOpen, setPOpen] = useState(false);
  const nav = (id: ScreenId) => () => go(id);
  return (
    <div className="appbar">
      <div className="brand" style={{ cursor: 'pointer' }} onClick={nav('modes')} title="Home"><Orb size={32} /> echo</div>

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
            <div className="avatar">{name[0]?.toUpperCase()}</div>
            <span className="pname">{name}</span>
            <Ic name={pOpen ? 'x' : 'arrowR'} size={14} stroke="var(--ink-soft)" sw={2.6} />
          </button>
          {pOpen && <ProfileMenu onClose={() => setPOpen(false)} />}
        </div>
      </div>
    </div>
  );
}
