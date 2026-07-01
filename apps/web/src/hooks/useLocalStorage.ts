import { useCallback, useEffect, useState } from 'react';

/** Re-render when localStorage changes in another tab. */
export function useStorageSync(key: string): number {
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const handler = (event: StorageEvent) => {
      if (event.key === key || event.key === null) {
        setVersion((v) => v + 1);
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, [key]);

  const bump = useCallback(() => setVersion((v) => v + 1), []);

  return version;
}

/** Hook that exposes a bump function to trigger re-reads after local writes. */
export function useLocalStorageSync(): { version: number; bump: () => void } {
  const [version, setVersion] = useState(0);
  const bump = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    const handler = () => setVersion((v) => v + 1);
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  return { version, bump };
}
