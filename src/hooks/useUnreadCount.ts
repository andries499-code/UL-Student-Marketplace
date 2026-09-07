import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

/**
 * Total unread message count across all of the current user's conversations.
 * RLS on `messages` already scopes visibility to conversations the user is
 * a participant in, so no extra join/filter on conversation membership is
 * needed here — just "not mine" and "unread".
 */
export function useUnreadCount(): number {
  const { user } = useAuth();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!user) {
      setCount(0);
      return;
    }

    let cancelled = false;

    async function refresh() {
      const { count: c } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .neq('sender_id', user!.id)
        .is('read_at', null);
      if (!cancelled) setCount(c || 0);
    }

    refresh();

    const channel = supabase
      .channel('unread-count')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
        refresh();
      })
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [user]);

  return count;
}
