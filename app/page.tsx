'use client';

import { useEffect, useState } from 'react';
import { useEcho, type ScreenId } from '@/lib/store';
import { CalmCorner } from '@/components/CalmCorner';
import { Orb } from '@/components/ui';

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
  const { screen, prefs, onboarded, go } = useEcho();
  const [booted, setBooted] = useState(false);

  // On first load, a returning (onboarded) user skips the welcome/onboarding
  // intro and lands straight in the app. SSR + first client render show the
  // splash, so there's no flash and no hydration mismatch.
  useEffect(() => {
    if (onboarded && screen === 'welcome') go('modes');
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBooted(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const Active = SCREENS[screen] ?? Welcome;

  if (!booted) {
    return (
      <div className="stage">
        <div className="screen is-active bg-cream" style={{ display: 'grid', placeItems: 'center' }}><Orb size={76} /></div>
      </div>
    );
  }

  return (
    <div className={'stage' + (prefs.reducedMotion ? ' calm' : '')}>
      <div className="screen is-active" key={screen}>
        <Active />
      </div>
      <CalmCorner />
    </div>
  );
}
