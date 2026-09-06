import { useEffect, useState } from 'react';
import {
  ChevronLeft, Heart, MapPin, MessageCircle, Edit3, Trash2,
  BookOpen, Zap, Package, Loader2,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from '@/context/RouterContext';
import { useAuth } from '@/context/AuthContext';
import type { Listing } from '@/lib/types';
import { formatPrice, timeAgo, CATEGORY_COLORS, CONDITION_COLORS } from '@/lib/constants';
import ImageGallery from '@/components/ImageGallery';
import CategoryIcon from '@/components/CategoryIcon';

interface Props {
  id: string;
}

export default function ListingDetailPage({ id }: Props) {
  const { navigate } = useRouter();
  const { user } = useAuth();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [favorited, setFavorited] = useState(false);
  const [startingChat, setStartingChat] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data, error } = await supabase
        .from('listings')
        .select('*, seller:seller_id(*)')
        .eq('id', id)
        .maybeSingle();

      if (error || !data) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setListing(data as Listing);

      if (user) {
        const { data: fav } = await supabase
          .from('favorites')
          .select('id')
          .eq('user_id', user.id)
          .eq('listing_id', id)
          .maybeSingle();
        setFavorited(!!fav);
      }
      setLoading(false);
    }
    load();
  }, [id, user]);

  async function toggleFavorite() {
    if (!user || !listing) return;
    if (favorited) {
      await supabase.from('favorites').delete().eq('user_id', user.id).eq('listing_id', listing.id);
      setFavorited(false);
    } else {
      await supabase.from('favorites').insert({ user_id: user.id, listing_id: listing.id });
      setFavorited(true);
    }
  }

  async function handleDelete() {
    if (!listing) return;
    if (!confirm('Delete this listing permanently?')) return;
    await supabase.from('listings').delete().eq('id', listing.id);
    navigate('/dashboard');
  }

  async function handleMessageSeller() {
    if (!user || !listing) return;
    setStartingChat(true);

    const { data: existing } = await supabase
      .from('conversations')
      .select('id')
      .eq('listing_id', listing.id)
      .eq('buyer_id', user.id)
      .maybeSingle();

    if (existing) {
      navigate(`/chat/${existing.id}`);
      return;
    }

    const { data: created, error } = await supabase
      .from('conversations')
      .insert({
        listing_id: listing.id,
        buyer_id: user.id,
        seller_id: listing.seller_id,
      })
      .select('id')
      .single();

    setStartingChat(false);
    if (!error && created) {
      navigate(`/chat/${created.id}`);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
      </div>
    );
  }

  if (notFound || !listing) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6">
        <Package className="w-12 h-12 text-gray-300 mb-3" />
        <p className="text-gray-500 font-medium">Listing not found</p>
        <button onClick={() => navigate('/')} className="mt-4 text-emerald-600 font-medium text-sm">
          Back to browse
        </button>
      </div>
    );
  }

  const isOwner = user?.id === listing.seller_id;
  const isSold = listing.status === 'sold';

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Top bar */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-100 px-4 py-3 flex items-center gap-3">
        <button onClick={() => window.history.back()} className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition">
          <ChevronLeft className="w-5 h-5 text-gray-700" />
        </button>
        <h1 className="text-base font-bold text-gray-900 flex-1 truncate">{listing.title}</h1>
        {!isOwner && user && (
          <button
            onClick={toggleFavorite}
            className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition"
          >
            <Heart className={`w-4.5 h-4.5 ${favorited ? 'fill-rose-500 text-rose-500' : 'text-gray-500'}`} />
          </button>
        )}
        {isOwner && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => navigate(`/sell/${listing.id}`)}
              className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition"
            >
              <Edit3 className="w-4 h-4 text-gray-600" />
            </button>
            <button
              onClick={handleDelete}
              className="w-9 h-9 rounded-full bg-rose-50 flex items-center justify-center hover:bg-rose-100 transition"
            >
              <Trash2 className="w-4 h-4 text-rose-600" />
            </button>
          </div>
        )}
      </div>

      <div className="px-4 pt-4">
        {/* Gallery / placeholder */}
        {listing.image_urls && listing.image_urls.length > 0 ? (
          <ImageGallery images={listing.image_urls} title={listing.title} />
        ) : (
          <div className="w-full aspect-square bg-gray-100 rounded-2xl flex items-center justify-center text-gray-300">
            <CategoryIcon category={listing.category} className="w-16 h-16" />
          </div>
        )}

        {/* Status badge */}
        {isSold && (
          <div className="mt-3 bg-gray-900 text-white text-xs font-semibold px-3 py-1.5 rounded-lg inline-block">
            SOLD
          </div>
        )}
        {listing.status === 'reserved' && (
          <div className="mt-3 bg-amber-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg inline-block">
            RESERVED
          </div>
        )}

        {/* Title / price / category */}
        <div className="mt-3">
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${CATEGORY_COLORS[listing.category]}`}>
            {listing.category}
          </span>
          <h2 className="text-xl font-bold text-gray-900 mt-2">{listing.title}</h2>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{formatPrice(listing.price)}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${CONDITION_COLORS[listing.condition]}`}>
              {listing.condition}
            </span>
            <span className="text-xs text-gray-400">Listed {timeAgo(listing.created_at)}</span>
          </div>
        </div>

        {/* Description */}
        <div className="mt-5">
          <h3 className="text-sm font-bold text-gray-900 mb-1.5">Description</h3>
          <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{listing.description}</p>
        </div>

        {/* Category-specific details */}
        {listing.category === 'Textbooks' && (listing.author || listing.edition || listing.module_code || listing.faculty) && (
          <div className="mt-5 bg-blue-50/50 border border-blue-100 rounded-2xl p-4">
            <h3 className="text-sm font-semibold text-blue-700 flex items-center gap-1.5 mb-3">
              <BookOpen className="w-4 h-4" />
              Textbook Details
            </h3>
            <div className="grid grid-cols-2 gap-y-2 text-sm">
              {listing.author && <DetailRow label="Author" value={listing.author} />}
              {listing.edition && <DetailRow label="Edition" value={listing.edition} />}
              {listing.module_code && <DetailRow label="Module Code" value={listing.module_code} />}
              {listing.faculty && <DetailRow label="Faculty" value={listing.faculty} />}
            </div>
          </div>
        )}

        {listing.category === 'Appliances' && listing.power_type && (
          <div className="mt-5 bg-amber-50/50 border border-amber-100 rounded-2xl p-4">
            <h3 className="text-sm font-semibold text-amber-700 flex items-center gap-1.5 mb-3">
              <Zap className="w-4 h-4" />
              Appliance Details
            </h3>
            <DetailRow label="Power Type" value={listing.power_type} />
          </div>
        )}

        {/* Meetup */}
        <div className="mt-5 bg-white border border-gray-100 rounded-2xl p-4">
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5 mb-2">
            <MapPin className="w-4 h-4 text-gray-400" />
            Meetup Info
          </h3>
          <p className="text-sm text-gray-600">{listing.meetup_location}</p>
          <p className="text-sm text-gray-500 mt-0.5">{listing.precise_spot}</p>
        </div>

        {/* Seller card */}
        {listing.seller && (
          <div
            onClick={() => navigate(`/profile/${listing.seller_id}`)}
            className="mt-5 bg-white border border-gray-100 rounded-2xl p-4 flex items-center gap-3 cursor-pointer hover:shadow-sm transition"
          >
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
              {listing.seller.full_name?.charAt(0).toUpperCase() || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{listing.seller.full_name || 'Unknown'}</p>
              <p className="text-xs text-gray-400">Verified UL Student • View profile</p>
            </div>
          </div>
        )}
      </div>

      {/* Sticky message button */}
      {!isOwner && user && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 px-4 py-3 safe-area-pb">
          <button
            onClick={handleMessageSeller}
            disabled={startingChat || isSold}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold shadow-lg shadow-emerald-200 hover:shadow-emerald-300 transition flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {startingChat ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <MessageCircle className="w-5 h-5" />
                {isSold ? 'Item Sold' : 'Message Seller'}
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">{label}</p>
      <p className="text-gray-800 font-medium">{value}</p>
    </div>
  );
}
