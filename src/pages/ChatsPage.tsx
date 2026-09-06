import { useEffect, useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from '@/context/RouterContext';
import { useAuth } from '@/context/AuthContext';
import type { Conversation, Message, Listing, Profile } from '@/lib/types';
import { formatPrice, timeAgo } from '@/lib/constants';

interface ConversationRow extends Conversation {
  listing: Listing | null;
  buyer: Profile | null;
  seller: Profile | null;
}

export default function ChatsPage() {
  const { navigate } = useRouter();
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ConversationRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    async function load() {
      const { data } = await supabase
        .from('conversations')
        .select('*, listing:listing_id(*), buyer:buyer_id(*), seller:seller_id(*)')
        .or(`buyer_id.eq.${user!.id},seller_id.eq.${user!.id}`)
        .order('updated_at', { ascending: false });

      const rows = (data || []) as ConversationRow[];

      const enriched = await Promise.all(
        rows.map(async (conv) => {
          const { data: lastMsg } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          const { count } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .neq('sender_id', user!.id)
            .is('read_at', null);

          return { ...conv, last_message: lastMsg as Message | null, unread_count: count || 0 };
        })
      );

      setConversations(enriched);
      setLoading(false);
    }

    load();

    const channel = supabase
      .channel('conversations')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
        load();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, () => {
        load();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  function getOtherParty(conv: ConversationRow): Profile | null {
    if (!user) return null;
    return user.id === conv.buyer_id ? conv.seller : conv.buyer;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-100 px-4 py-4">
        <h1 className="text-xl font-bold text-gray-900">Messages</h1>
        <p className="text-xs text-gray-400 mt-0.5">Chat with buyers and sellers</p>
      </header>

      <div className="px-4 pt-4 space-y-2">
        {loading ? (
          <div className="text-center py-12 text-gray-400 text-sm">Loading conversations...</div>
        ) : conversations.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
              <MessageSquare className="w-7 h-7 text-gray-300" />
            </div>
            <p className="text-gray-500 font-medium">No conversations yet</p>
            <p className="text-sm text-gray-400 mt-1">Message a seller from any listing to start chatting</p>
          </div>
        ) : (
          conversations.map((conv) => {
            const other = getOtherParty(conv);
            const listing = conv.listing;
            return (
              <div
                key={conv.id}
                onClick={() => navigate(`/chat/${conv.id}`)}
                className="bg-white rounded-2xl border border-gray-100 p-3 flex items-center gap-3 shadow-sm hover:shadow-md transition cursor-pointer active:scale-[0.98]"
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                  {other?.full_name?.charAt(0).toUpperCase() || '?'}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-gray-900 text-sm truncate">{other?.full_name || 'Unknown'}</p>
                    <span className="text-[10px] text-gray-400 flex-shrink-0">
                      {conv.last_message ? timeAgo(conv.last_message.created_at) : timeAgo(conv.created_at)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 truncate mt-0.5">
                    {listing ? `${listing.title} • ${formatPrice(listing.price)}` : 'Listing removed'}
                  </p>
                  <p className="text-sm text-gray-600 truncate mt-1">
                    {conv.last_message?.body || 'Start a conversation'}
                  </p>
                </div>

                {conv.unread_count && conv.unread_count > 0 ? (
                  <div className="w-6 h-6 rounded-full bg-emerald-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                    {conv.unread_count}
                  </div>
                ) : null}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
