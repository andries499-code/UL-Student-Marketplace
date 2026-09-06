import { Heart } from 'lucide-react';
import { useRouter } from '@/context/RouterContext';
import type { Listing } from '@/lib/types';
import { formatPrice, timeAgo, CATEGORY_COLORS, CONDITION_COLORS } from '@/lib/constants';
import CategoryIcon from './CategoryIcon';

interface Props {
  listing: Listing;
  favorited?: boolean;
  onToggleFavorite?: (id: string) => void;
}

export default function ListingCard({ listing, favorited, onToggleFavorite }: Props) {
  const { navigate } = useRouter();
  const hasImage = listing.image_urls && listing.image_urls.length > 0;
  const isSold = listing.status === 'sold';

  return (
    <div
      onClick={() => navigate(`/listing/${listing.id}`)}
      className="group bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer active:scale-[0.98]"
    >
      <div className="relative aspect-square bg-gray-100 overflow-hidden">
        {hasImage ? (
          <img
            src={listing.image_urls[0]}
            alt={listing.title}
            loading="lazy"
            className={`w-full h-full object-cover transition-transform group-hover:scale-105 ${isSold ? 'grayscale opacity-70' : ''}`}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <CategoryIcon category={listing.category} className="w-12 h-12" />
          </div>
        )}
        {isSold && (
          <div className="absolute top-2 left-2 bg-gray-900/80 text-white text-xs font-semibold px-2.5 py-1 rounded-lg backdrop-blur-sm">
            SOLD
          </div>
        )}
        {listing.status === 'reserved' && (
          <div className="absolute top-2 left-2 bg-amber-500/90 text-white text-xs font-semibold px-2.5 py-1 rounded-lg backdrop-blur-sm">
            RESERVED
          </div>
        )}
        {onToggleFavorite && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(listing.id);
            }}
            className="absolute top-2 right-2 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm hover:bg-white transition"
          >
            <Heart
              className={`w-4.5 h-4.5 ${favorited ? 'fill-rose-500 text-rose-500' : 'text-gray-400'}`}
              strokeWidth={2}
            />
          </button>
        )}
      </div>
      <div className="p-3">
        <div className="flex items-center gap-1.5 mb-1.5">
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${CATEGORY_COLORS[listing.category]}`}>
            {listing.category}
          </span>
        </div>
        <h3 className="text-sm font-semibold text-gray-900 line-clamp-1 leading-tight">
          {listing.title}
        </h3>
        <p className="text-lg font-bold text-emerald-600 mt-1">{formatPrice(listing.price)}</p>
        <div className="flex items-center justify-between mt-1.5">
          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${CONDITION_COLORS[listing.condition]}`}>
            {listing.condition}
          </span>
          <span className="text-[10px] text-gray-400">{timeAgo(listing.created_at)}</span>
        </div>
      </div>
    </div>
  );
}
