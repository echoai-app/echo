'use client';

import { useState } from 'react';
import { useEcho, type ScreenId } from '@/lib/store';
import { Ic } from '@/components/ui';

import Welcome from '@/components/screens/Welcome';
import Onboarding from '@/components/screens/Onboarding';
import Consent from '@/components/screens/Consent';
import Modes from '@/components/screens/Modes';
import Setup from '@/components/screens/Setup';
import Room from '@/components/screens/Room';
import MemoryReview from '@/components/screens/MemoryReview';
import Debrief from '@/components/screens/Debrief';
import Recall from '@/components/screens/Recall';
import Timeline from '@/components/screens/Timeline';

const SCREENS: { id: ScreenId; label: string; sec: string; C: React.ComponentType }[] = [
  { id: 'welcome', label: 'Welcome', sec: 'First visit', C: Welcome },
  { id: 'onboard', label: 'Onboarding', sec: 'First visit', C: Onboarding },
  { id: 'consent', label: 'Consent & account', sec: 'First visit', C: Consent },
  { id: 'modes', label: 'Choose a mode', sec: 'Reflect', C: Modes },
  { id: 'setup', label: 'Session setup', sec: 'Reflect', C: Setup },
  { id: 'room', label: 'Reflection room', sec: 'Reflect', C: Room },
  { id: 'memory', label: 'Memory review', sec: 'Reflect', C: MemoryReview },
  { id: 'debrief', label: 'Debrief + Walrus', sec: 'Reflect', C: Debrief },
  { id: 'recall', label: 'Return & recall', sec: 'Come back later', C: Recall },
  { id: 'timeline', label: 'Memory journey', sec: 'Come back later', C: Timeline },
];

export default function EchoApp() {
  const { screen, go, prefs } = useEcho();
  const [menu, setMenu] = useState(false);
  const Active = SCREENS.find(s => s.id === screen)?.C ?? Welcome;
  const secs = [...new Set(SCREENS.map(s => s.sec))];

  return (
    <div className={'stage' + (prefs.reducedMotion ? ' calm' : '')}>
      <div className="screen is-active" key={screen}>
        <Active />
      </div>

      {/* demo jump menu — handy for walking the flow during a demo */}
      <button className="jump-btn" onClick={() => setMenu(m => !m)} title="Jump to screen" aria-label="Jump to screen">
        <Ic name={menu ? 'x' : 'map'} size={24} />
      </button>
      {menu && (
        <div className="flow-jump">
          <div className="jump-sec" style={{ paddingTop: 4 }}>Echo · demo map</div>
          {secs.map(sec => (
            <div key={sec}>
              <div className="jump-sec">{sec}</div>
              {SCREENS.filter(s => s.sec === sec).map(s => (
                <div key={s.id} className={'jump-item ' + (screen === s.id ? 'on' : '')} onClick={() => { go(s.id); setMenu(false); }}>
                  <span className="n">{SCREENS.findIndex(x => x.id === s.id) + 1}</span>{s.label}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
