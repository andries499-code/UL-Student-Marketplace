import { useEffect, useState, useRef } from 'react';
import { ChevronLeft, Send, Package, ArrowLeft, MoreVertical, Flag, Ban, ShieldCheck } from 'lucide-react';
import { supabase, LISTING_COLUMNS } from '@/lib/supabase';
import { useRouter } from '@/context/RouterContext';
import { useAuth } from '@/context/AuthContext';
import type { Message, Conversation, Listing, Profile } from '@/lib/types';
import { formatPrice, timeAgo } from '@/lib/constants';
import ReportModal from '@/components/ReportModal';

interface ConvData extends Conversation {
  listing: Listing | null;
  buyer: Profile | null;
  seller: Profile | null;
}

export default function ChatPage({ conversationId }: { conversationId: string }) {
  const { navigate } = useRouter();
  const { user } = useAuth();
  const [conv, setConv] = useState<ConvData | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockChecked, setBlockChecked] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;

    async function load() {
      const { data: convData } = await supabase
        .from('conversations')
        .select(`*, listing:listing_id(${LISTING_COLUMNS}), buyer:buyer_id(*), seller:seller_id(*)`)
        .eq('id', conversationId)
        .maybeSingle();
      setConv(convData as ConvData | null);

      if (convData) {
        const otherId = convData.buyer_id === user.id ? convData.seller_id : convData.buyer_id;
        const { data: block } = await supabase
          .from('blocked_users')
          .select('id')
          .eq('blocker_id', user.id)
          .eq('blocked_id', otherId)
          .maybeSingle();
        setIsBlocked(!!block);
        setBlockChecked(true);
      }

      const { data: msgs } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });
      setMessages((msgs || []) as Message[]);

      if (msgs && user) {
        const unread = msgs.filter((m) => m.sender_id !== user.id && !m.read_at);
        for (const m of unread) {
          await supabase.from('messages').update({ read_at: new Date().toISOString() }).eq('id', m.id);
        }
      }

      setLoading(false);
    }

    load();

    const channel = supabase
      .channel(`chat-${conversationId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          const msg = payload.new as Message;
          setMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
          if (user && msg.sender_id !== user.id) {
            (async () => {
              await supabase.from('messages').update({ read_at: new Date().toISOString() }).eq('id', msg.id);
            })();
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [conversationId, user]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() || !user || sending || isBlocked) return;
    setSending(true);
    const body = newMessage.trim();
    setNewMessage('');

    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        body,
      })
      .select('*')
      .single();

    if (data) {
      setMessages((prev) => [...prev, data as Message]);
    } else if (error) {
      setSendError("This message couldn't be delivered.");
      setNewMessage(body);
    }
    setSending(false);
  }

  async function handleToggleBlock() {
    if (!user || !conv) return;
    const otherId = conv.buyer_id === user.id ? conv.seller_id : conv.buyer_id;
    setShowMenu(false);

    if (isBlocked) {
      await supabase.from('blocked_users').delete().eq('blocker_id', user.id).eq('blocked_id', otherId);
      setIsBlocked(false);
    } else {
      if (!confirm('Block this user? They will no longer be able to message you.')) return;
      await supabase.from('blocked_users').insert({ blocker_id: user.id, blocked_id: otherId });
      setIsBlocked(true);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-200 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!conv) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6">
        <Package className="w-12 h-12 text-gray-300 mb-3" />
        <p className="text-gray-500 font-medium">Conversation not found</p>
        <button onClick={() => navigate('/chats')} className="mt-4 text-emerald-600 font-medium text-sm">
          Back to chats
        </button>
      </div>
    );
  }

  const otherParty = user?.id === conv.buyer_id ? conv.seller : conv.buyer;
  const listing = conv.listing;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col" style={{ height: '100dvh' }}>
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-100 px-3 py-2.5 flex items-center gap-2 safe-area-top">
        <button onClick={() => navigate('/chats')} className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center transition">
          <ChevronLeft className="w-5 h-5 text-gray-700" />
        </button>
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
          {otherParty?.full_name?.charAt(0).toUpperCase() || '?'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 text-sm truncate">{otherParty?.full_name || 'Unknown'}</p>
          <p className="text-[10px] text-gray-400">Marketplace member</p>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowMenu((v) => !v)}
            className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center transition"
          >
            <MoreVertical className="w-5 h-5 text-gray-500" />
          </button>
          {showMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 top-11 z-50 bg-white rounded-xl shadow-lg border border-gray-100 py-1.5 w-48">
                <button
                  onClick={() => { setShowMenu(false); setShowReport(true); }}
                  className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <Flag className="w-4 h-4 text-gray-400" />
                  Report user
                </button>
                <button
                  onClick={handleToggleBlock}
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 flex items-center gap-2"
                >
                  {isBlocked ? (
                    <>
                      <ShieldCheck className="w-4 h-4 text-emerald-500" />
                      <span className="text-emerald-600">Unblock user</span>
                    </>
                  ) : (
                    <>
                      <Ban className="w-4 h-4 text-rose-500" />
                      <span className="text-rose-600">Block user</span>
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </header>

      {isBlocked && (
        <div className="bg-rose-50 border-b border-rose-100 px-4 py-2 text-center">
          <p className="text-xs text-rose-600">You've blocked this user. Unblock them to send messages.</p>
        </div>
      )}

      {listing && (
        <div
          onClick={() => navigate(`/listing/${listing.id}`)}
          className="bg-white border-b border-gray-100 px-3 py-2 flex items-center gap-2.5 cursor-pointer hover:bg-gray-50 transition"
        >
          <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
            {listing.image_urls?.[0] ? (
              <img src={listing.image_urls[0]} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300">
                <Package className="w-5 h-5" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{listing.title}</p>
            <p className="text-xs text-emerald-600 font-semibold">{formatPrice(listing.price)}</p>
          </div>
          <ArrowLeft className="w-4 h-4 text-gray-300 rotate-180" />
        </div>
      )}

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-2.5">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-gray-400">No messages yet. Say hello!</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMine = msg.sender_id === user?.id;
            const showTime = idx === 0 || new Date(messages[idx - 1].created_at).getTime() < new Date(msg.created_at).getTime() - 5 * 60 * 1000;
            return (
              <div key={msg.id}>
                {showTime && (
                  <p className="text-center text-[10px] text-gray-400 my-2">{timeAgo(msg.created_at)}</p>
                )}
                <div className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[75%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      isMine
                        ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-br-md'
                        : 'bg-white border border-gray-100 text-gray-900 rounded-bl-md'
                    }`}
                  >
                    {msg.body}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="bg-white border-t border-gray-200 px-3 py-2.5 safe-area-pb">
        {sendError && <p className="text-xs text-rose-500 mb-1.5 px-1">{sendError}</p>}
        <form onSubmit={sendMessage} className="flex items-center gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => { setNewMessage(e.target.value); setSendError(null); }}
            placeholder={isBlocked ? 'Unblock to send messages' : 'Type a message...'}
            disabled={isBlocked}
            className="flex-1 px-4 py-2.5 rounded-full bg-gray-100 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:bg-white transition disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending || isBlocked}
            className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md hover:shadow-lg transition disabled:opacity-40 flex-shrink-0"
          >
            <Send className="w-4.5 h-4.5" />
          </button>
        </form>
      </div>

      {showReport && otherParty && (
        <ReportModal
          targetType="user"
          targetId={otherParty.id}
          onClose={() => setShowReport(false)}
        />
      )}
    </div>
  );
}
