'use client';

import { useEffect, useState } from 'react';
import { Sound } from '@/lib/sound';
import { vars } from '@/styles/theme.css';

export function SoundToggle() {
  const [on, setOn] = useState(false);
  useEffect(() => {
    setOn(Sound.isEnabled());
    return Sound.subscribe(setOn);
  }, []);
  return (
    <button
      onClick={() => Sound.toggle()}
      title={on ? 'Sound on' : 'Sound off'}
      aria-label={on ? 'Mute' : 'Unmute'}
      style={{
        width: 34,
        height: 34,
        borderRadius: 9,
        border: `1px solid ${vars.color.line}`,
        background: vars.color.surface2,
        color: on ? vars.color.goldSoft : vars.color.textFaint,
        cursor: 'pointer',
        fontSize: 15,
      }}
    >
      {on ? '🔊' : '🔇'}
    </button>
  );
}
