import { useMemo } from 'react';
import { chatService } from '../services/chatService';
import { useLocalStorageSync } from './useLocalStorage';

/** Loads conversation list and refreshes on storage changes. */
export function useConversations() {
  const { version, bump } = useLocalStorageSync();

  const conversations = useMemo(() => chatService.listConversations(), [version]);

  return { conversations, refresh: bump };
}
