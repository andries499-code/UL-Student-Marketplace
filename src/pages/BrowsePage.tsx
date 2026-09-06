import { useEffect, useState, useMemo, useCallback } from 'react';
import { Search, SlidersHorizontal, X, GraduationCap } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Listing, Category, Condition, MeetupLocation } from '@/lib/types';
import {
  CATEGORIES, CONDITIONS, MEETUP_LOCATIONS,
} from '@/lib/constants';
import { useAuth } from '@/context/AuthContext';
import ListingCard from '@/components/ListingCard';
import CategoryIcon from '@/components/CategoryIcon';

export default function BrowsePage() {
  const { user } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<Category | 'All'>('All');
  const [showFilters, setShowFilters] = useState(false);
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [conditionFilter, setConditionFilter] = useState<Condition | 'All'>('All');
  const [locationFilter, setLocationFilter] = useState<MeetupLocation | 'All'>('All');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const loadListings = useCallback(async () => {
    setLoading(true);
    const query = supabase
      .from('listings')
      .select('*, seller:seller_id(*)')
      .order('created_at', { ascending: false });

    const { data, error } = await query;
    if (error) {
      console.error(error);
    } else {
      setListings((data || []) as Listing[]);
    }
    setLoading(false);
  }, []);

  const loadFavorites = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from('favorites').select('listing_id').eq('user_id', user.id);
    if (data) setFavorites(new Set(data.map((f) => f.listing_id)));
  }, [user]);

  useEffect(() => {
    loadListings();
    loadFavorites();
  }, [loadListings, loadFavorites]);

  async function toggleFavorite(listingId: string) {
    if (!user) return;
    if (favorites.has(listingId)) {
      await supabase.from('favorites').delete().eq('user_id', user.id).eq('listing_id', listingId);
      setFavorites((prev) => {
        const next = new Set(prev);
        next.delete(listingId);
        return next;
      });
    } else {
      await supabase.from('favorites').insert({ user_id: user.id, listing_id: listingId });
      setFavorites((prev) => new Set(prev).add(listingId));
    }
  }

  const filtered = useMemo(() => {
    return listings.filter((l) => {
      if (activeCategory !== 'All' && l.category !== activeCategory) return false;
      if (conditionFilter !== 'All' && l.condition !== conditionFilter) return false;
      if (locationFilter !== 'All' && l.meetup_location !== locationFilter) return false;
      if (priceMin && l.price < parseFloat(priceMin)) return false;
      if (priceMax && l.price > parseFloat(priceMax)) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const haystack = [
          l.title, l.description, l.author, l.module_code, l.faculty, l.category,
        ].filter(Boolean).join(' ').toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [listings, activeCategory, conditionFilter, locationFilter, priceMin, priceMax, search]);

  const hasActiveFilters = conditionFilter !== 'All' || locationFilter !== 'All' || !!priceMin || !!priceMax;

  function clearFilters() {
    setConditionFilter('All');
    setLocationFilter('All');
    setPriceMin('');
    setPriceMax('');
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-100">
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 leading-none">UL Market</h1>
              <p className="text-[10px] text-gray-400 mt-0.5">University of Limpopo</p>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, brand, or module code..."
              className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-gray-100 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:bg-white transition"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto px-4 pb-3 scrollbar-hide">
          <button
            onClick={() => setActiveCategory('All')}
            className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-sm font-medium transition-all ${
              activeCategory === 'All'
                ? 'bg-emerald-500 text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-1.5 ${
                activeCategory === cat
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <CategoryIcon category={cat} className="w-3.5 h-3.5" />
              {cat}
            </button>
          ))}
        </div>
      </header>

      <div className="px-4 pt-3 pb-2 flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {loading ? 'Loading...' : `${filtered.length} item${filtered.length !== 1 ? 's' : ''}`}
        </p>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
            hasActiveFilters
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-white text-gray-600 border border-gray-200'
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Filters
          {hasActiveFilters && (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          )}
        </button>
      </div>

      {showFilters && (
        <div className="px-4 pb-3">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Price Range (R)</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={priceMin}
                  onChange={(e) => setPriceMin(e.target.value)}
                  placeholder="Min"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
                <span className="text-gray-400">—</span>
                <input
                  type="number"
                  value={priceMax}
                  onChange={(e) => setPriceMax(e.target.value)}
                  placeholder="Max"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Condition</label>
              <div className="flex flex-wrap gap-2">
                <FilterChip active={conditionFilter === 'All'} onClick={() => setConditionFilter('All')}>All</FilterChip>
                {CONDITIONS.map((c) => (
                  <FilterChip key={c} active={conditionFilter === c} onClick={() => setConditionFilter(c)}>
                    {c}
                  </FilterChip>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Meetup Location</label>
              <div className="flex flex-wrap gap-2">
                <FilterChip active={locationFilter === 'All'} onClick={() => setLocationFilter('All')}>All</FilterChip>
                {MEETUP_LOCATIONS.map((l) => (
                  <FilterChip key={l} active={locationFilter === l} onClick={() => setLocationFilter(l)}>
                    {l}
                  </FilterChip>
                ))}
              </div>
            </div>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-sm text-rose-500 font-medium hover:text-rose-600"
              >
                Clear all filters
              </button>
            )}
          </div>
        </div>
      )}

      <div className="px-4 pt-1">
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="aspect-square bg-gray-100 animate-pulse" />
                <div className="p-3 space-y-2">
                  <div className="h-3 bg-gray-100 rounded animate-pulse" />
                  <div className="h-4 bg-gray-100 rounded w-2/3 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
              <Search className="w-7 h-7 text-gray-300" />
            </div>
            <p className="text-gray-500 font-medium">No items found</p>
            <p className="text-sm text-gray-400 mt-1">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                favorited={favorites.has(listing.id)}
                onToggleFavorite={toggleFavorite}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
        active
          ? 'bg-emerald-500 text-white'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
    >
      {children}
    </button>
  );
}
