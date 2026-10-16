import { useEffect, useState } from 'react';

import { api } from './api';

let cache = null;

export function useProMeta() {
  const [meta, setMeta] = useState(cache);
  useEffect(() => {
    if (cache) return;
    api('/pro/meta/', { auth: false })
      .then((m) => {
        cache = m;
        setMeta(m);
      })
      .catch(() => {});
  }, []);
  return meta;
}
