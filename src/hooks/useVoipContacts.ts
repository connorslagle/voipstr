import { useQuery } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import { useAuthor } from './useAuthor';

interface VoipContact {
  pubkey: string;
  name?: string;
  picture?: string;
  status: 'online' | 'offline' | 'busy' | 'in-call';
  lastSeen?: Date;
}

export function useVoipContacts() {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['voip-contacts'],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(1500)]);
      
      // Get user's follows (kind 3)
      const followsEvents = await nostr.query([{ kinds: [3] }], { signal });
      
      if (followsEvents.length === 0) {
        return [];
      }

      const followsEvent = followsEvents[0];
      const followedPubkeys = followsEvent.tags
        .filter(tag => tag[0] === 'p')
        .map(tag => tag[1]);

      // Get recent status updates from followed users
      const statusEvents = await nostr.query([
        {
          kinds: [30315], // User Status kind
          authors: followedPubkeys,
          limit: followedPubkeys.length * 2,
        }
      ], { signal });

      // Get current call activity
      const callEvents = await nostr.query([
        {
          kinds: [39000], // VOIP signaling kind
          authors: followedPubkeys,
          limit: 50,
        }
      ], { signal });

      // Process contacts with their status
      const contacts: VoipContact[] = followedPubkeys.map(pubkey => {
        const statusEvent = statusEvents.find(e => e.pubkey === pubkey);
        const recentCallEvent = callEvents.find(e => e.pubkey === pubkey && 
          Date.now() - e.created_at * 1000 < 5 * 60 * 1000); // Active in last 5 minutes

        let status: VoipContact['status'] = 'offline';
        let lastSeen: Date | undefined;

        if (statusEvent) {
          const statusData = JSON.parse(statusEvent.content);
          status = statusData.status || 'offline';
          lastSeen = new Date(statusEvent.created_at * 1000);
        }

        // Override status if in active call
        if (recentCallEvent) {
          try {
            const callData = JSON.parse(recentCallEvent.content);
            if (callData.type === 'offer' || callData.type === 'answer') {
              status = 'in-call';
            }
          } catch {
            // Ignore parse errors
          }
        }

        return {
          pubkey,
          status,
          lastSeen,
        };
      });

      return contacts;
    },
  });
}

export function useVoipContact(pubkey: string) {
  const { data: contacts } = useVoipContacts();
  const author = useAuthor(pubkey);

  const contact = contacts?.find(c => c.pubkey === pubkey);
  const metadata = author.data?.metadata;

  return {
    ...contact,
    name: metadata?.name,
    picture: metadata?.picture,
    metadata,
  };
}