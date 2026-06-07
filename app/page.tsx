'use client';

import { useEcho, type ScreenId } from '@/lib/store';
import { CalmCorner } from '@/components/CalmCorner';

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
  const Active = SCREENS[screen] ?? Welcome;

  return (
    <div className={'stage' + (prefs.reducedMotion ? ' calm' : '')}>
      <div className="screen is-active" key={screen}>
        <Active />
      </div>
      <CalmCorner />
    </div>
  );
}
