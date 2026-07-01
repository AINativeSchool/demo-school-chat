import { useEffect } from 'react';

/** Polls on an interval while the tab is visible. */
export function usePolling(onPoll: () => void, intervalMs = 4000, enabled = true): void {
  useEffect(() => {
    if (!enabled) return;

    const poll = () => {
      if (document.hidden) return;
      onPoll();
    };

    poll();
    const timer = window.setInterval(poll, intervalMs);
    return () => window.clearInterval(timer);
  }, [onPoll, intervalMs, enabled]);
}

/** Polls messages for an open conversation thread. */
export function useMessagePolling(
  conversationId: string | undefined,
  onPoll: () => void,
  intervalMs = 4000,
): void {
  usePolling(onPoll, intervalMs, Boolean(conversationId));
}
