import { useEffect, type ReactNode } from 'react';
import { dismissBootSplash } from '../bootSplash';

/** Hides the static HTML splash after the app mounts without crashing. */
export function BootGate({ children }: { children: ReactNode }) {
  useEffect(() => {
    dismissBootSplash();
  }, []);

  return children;
}
