import React, { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';

import { readLocalResumeTarget } from '../src/services/saves';

export default function Index() {
  const [target, setTarget] = useState<'/game' | '/daily'>('/game');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void (async () => {
      const resume = await readLocalResumeTarget();
      if (resume?.mode === 'daily') setTarget('/daily');
      else setTarget('/game');
      setReady(true);
    })();
  }, []);

  if (!ready) return null;
  return <Redirect href={target} />;
}


