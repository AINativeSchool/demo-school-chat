import { useCallback, useEffect, useState } from 'react';
import type { ConversationSummary } from '@school-chat/shared';
import { chatService } from '../services/chatService';
import { usePolling } from './usePolling';

/** Loads conversation list and refreshes on a polling interval. */
export function useConversations() {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const next = await chatService.listConversations();
      setConversations(next);
    } catch {
      setConversations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  usePolling(refresh, 4000);

  return { conversations, loading, refresh };
}
