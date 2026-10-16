import { useEffect, useState } from 'react';

import { api } from './api';

// Choice lists (moods, emotions, countries...) come from Django so the
// app and website always match. Fallback keeps forms usable offline.
const FALLBACK = {
  moods: [
    { value: 1, label: 'Very low', emoji: '😞' },
    { value: 2, label: 'Low', emoji: '😕' },
    { value: 3, label: 'Neutral', emoji: '😐' },
    { value: 4, label: 'Good', emoji: '🙂' },
    { value: 5, label: 'Great', emoji: '😄' },
  ],
  emotions: [
    'anxious', 'calm', 'stressed', 'sad', 'happy', 'tired', 'angry', 'hopeful', 'overwhelmed', 'grateful',
  ].map((v) => ({ value: v, label: v[0].toUpperCase() + v.slice(1) })),
  focus_choices: [
    { value: 'anxiety_stress', label: 'Managing anxiety or stress' },
    { value: 'mood_tracking', label: 'Tracking my mood' },
    { value: 'habits', label: 'Building healthy habits' },
    { value: 'emotions', label: 'Processing difficult emotions' },
    { value: 'therapy_support', label: 'Support between therapy sessions' },
    { value: 'general_wellness', label: 'General mental wellness' },
    { value: 'prefer_not_to_say', label: 'Prefer not to say' },
    { value: 'other', label: 'Other' },
  ],
  countries: [
    { value: 'ZA', label: 'South Africa' },
    { value: 'US', label: 'United States' },
    { value: 'GB', label: 'United Kingdom' },
    { value: 'CA', label: 'Canada' },
    { value: 'AU', label: 'Australia' },
    { value: 'IN', label: 'India' },
    { value: 'OTHER', label: 'Other / not listed' },
  ],
  insight_periods: [7, 14, 30],
  min_age: 16,
};

let cache = null;

export function useMeta() {
  const [meta, setMeta] = useState(cache || FALLBACK);
  useEffect(() => {
    if (cache) return;
    api('/meta/', { auth: false })
      .then((m) => {
        cache = m;
        setMeta(m);
      })
      .catch(() => {});
  }, []);
  return meta;
}
