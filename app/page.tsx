'use client';

import { useEffect, useState } from 'react';
import { useEcho, type ScreenId } from '@/lib/store';
import { CalmCorner } from '@/components/CalmCorner';
import BootSkeleton from '@/components/BootSkeleton';

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
import { Profile, Account, Privacy, Help } from '@/components/screens/Settings';

const SCREENS: Record<ScreenId, React.ComponentType> = {
  welcome: Welcome,
  onboard: Onboarding,
  consent: Consent,
  modes: Modes,
  setup: Setup,
  room: Room,
  memory: MemoryReview,
  debrief: Debrief,
  recall: Recall,
  timeline: Timeline,
  profile: Profile,
  account: Account,
  privacy: Privacy,
  help: Help,
};

// Friendly URLs ↔ screens: a reload keeps you where you were (stable pages
// restore exactly; mid-session pages fall back to /home — we never resume a
// half-finished conversation with no transcript).
const SCREEN_PATH: Partial<Record<ScreenId, string>> = {
  modes: '/home', profile: '/profile', account: '/account', privacy: '/privacy',
  help: '/help', timeline: '/journey', recall: '/recall',
  setup: '/session', room: '/session', memory: '/session', debrief: '/session',
};
const PATH_SCREEN: Record<string, ScreenId> = {
  '/home': 'modes', '/profile': 'profile', '/account': 'account', '/privacy': 'privacy',
  '/help': 'help', '/journey': 'timeline', '/recall': 'recall', '/session': 'modes',
};

export default function EchoApp() {
  const { screen, prefs } = useEcho();
  const [booted, setBooted] = useState(false);

  // On first load, a returning user skips the welcome/onboarding intro and lands
  // straight in the app — on the screen their URL names. We must read the store
  // via getState() AFTER localStorage rehydration finishes — the first-render
  // closure still holds the pre-hydration defaults (onboarded=false), which is
  // exactly why reloads used to dump returning users back through the intro.
  useEffect(() => {
    const decide = () => {
      const st = useEcho.getState();
      const returning = st.onboarded || st.name.trim() !== '';
      if (returning && st.screen === 'welcome') {
        st.resetTo(PATH_SCREEN[window.location.pathname] ?? 'modes');
      }
      setBooted(true);
    };
    if (useEcho.persist.hasHydrated()) decide();
    else return useEcho.persist.onFinishHydration(decide);
  }, []);

  // Keep the address bar in sync with the active screen…
  useEffect(() => {
    if (!booted) return;
    const path = SCREEN_PATH[screen] ?? '/';
    if (window.location.pathname !== path) window.history.pushState({ echo: screen }, '', path);
  }, [screen, booted]);

  // …and make the browser back/forward buttons navigate screens.
  useEffect(() => {
    const onPop = () => {
      const st = useEcho.getState();
      if (!(st.onboarded || st.name.trim() !== '')) return;
      const scr = PATH_SCREEN[window.location.pathname];
      if (scr && scr !== st.screen) st.resetTo(scr);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const Active = SCREENS[screen] ?? Welcome;

  if (!booted) return <BootSkeleton />;

  return (
    <div className={'stage' + (prefs.reducedMotion ? ' calm' : '')}>
      <div className="screen is-active" key={screen}>
        <Active />
      </div>
      <CalmCorner />
    </div>
  );
}
