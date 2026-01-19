import { useEffect, useState } from 'react';
import { useUserStore } from '@/store/user-store';

export function useHydration() {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    useUserStore.persist.rehydrate();
    setHydrated(true);
  }, []);

  return hydrated;
}
