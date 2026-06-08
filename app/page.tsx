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

export default function EchoApp() {
  const { screen, prefs } = useEcho();
  const [booted, setBooted] = useState(false);

  // On first load, a returning user skips the welcome/onboarding intro and lands
  // straight in the app. "Returning" = completed onboarding (flag) OR has a saved
  // name (covers users from before the flag existed). We must read the store via
  // getState() AFTER localStorage rehydration finishes — the first-render closure
  // still holds the pre-hydration defaults (onboarded=false), which is exactly why
  // reloads used to dump returning users back through the whole intro. SSR + first
  // client render show the splash, so there's no flash and no hydration mismatch.
  useEffect(() => {
    const decide = () => {
      const st = useEcho.getState();
      const returning = st.onboarded || st.name.trim() !== '';
      if (returning && st.screen === 'welcome') st.resetTo('modes');
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setBooted(true);
    };
    if (useEcho.persist.hasHydrated()) decide();
    else return useEcho.persist.onFinishHydration(decide);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
