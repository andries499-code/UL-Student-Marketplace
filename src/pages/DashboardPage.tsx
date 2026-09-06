import { useEffect, useState } from 'react';
import { Plus, Package, TrendingUp, Heart, MoreVertical, Edit3, Trash2, CheckCircle2, Circle, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from '@/context/RouterContext';
import { useAuth } from '@/context/AuthContext';
import type { Listing } from '@/lib/types';
import { formatPrice, timeAgo, CATEGORY_COLORS, CONDITION_COLORS } from '@/lib/constants';
import CategoryIcon from '@/components/CategoryIcon';

type Tab = 'active' | 'sold' | 'favorites';

export default function DashboardPage() {
  const { navigate } = useRouter();
  const { user } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [favorites, setFavorites] = useState<Listing[]>([]);
  const [tab, setTab] = useState<Tab>('active');
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    async function load() {
      const { data: myListings } = await supabase
        .from('listings')
        .select('*, seller:seller_id(*)')
        .eq('seller_id', user!.id)
        .order('created_at', { ascending: false });
      setListings((myListings || []) as Listing[]);

      const { data: favs } = await supabase
        .from('favorites')
        .select('listing:listing_id(*, seller:seller_id(*))')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      setFavorites((favs?.map((f) => f.listing).filter(Boolean) || []) as unknown as Listing[]);

      setLoading(false);
    }
    load();
  }, [user]);

  async function updateStatus(id: string, status: string) {
    await supabase.from('listings').update({ status }).eq('id', id);
    setListings((prev) => prev.map((l) => (l.id === id ? { ...l, status: status as Listing['status'] } : l)));
    setMenuOpen(null);
  }

  async function deleteListing(id: string) {
    if (!confirm('Delete this listing permanently?')) return;
    await supabase.from('listings').delete().eq('id', id);
    setListings((prev) => prev.filter((l) => l.id !== id));
    setMenuOpen(null);
  }

  const activeListings = listings.filter((l) => l.status === 'active');
  const soldListings = listings.filter((l) => l.status === 'sold');
  const displayList = tab === 'active' ? activeListings : tab === 'sold' ? soldListings : favorites;

  const stats = {
    total: listings.length,
    active: activeListings.length,
    sold: soldListings.length,
    revenue: soldListings.reduce((sum, l) => sum + l.price, 0),
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-100 px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">My Dashboard</h1>
            <p className="text-xs text-gray-400 mt-0.5">Manage your listings and favorites</p>
          </div>
          <button
            onClick={() => navigate('/sell')}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-semibold shadow-md shadow-emerald-200 hover:shadow-emerald-300 transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            New Listing
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <StatCard icon={Package} label="Active" value={stats.active} color="text-emerald-600 bg-emerald-50" />
          <StatCard icon={CheckCircle2} label="Sold" value={stats.sold} color="text-blue-600 bg-blue-50" />
          <StatCard icon={TrendingUp} label="Revenue" value={formatPrice(stats.revenue)} color="text-amber-600 bg-amber-50" small />
        </div>
      </header>

      <div className="px-4 pt-4">
        <div className="flex bg-gray-100 rounded-xl p-1">
          <TabButton active={tab === 'active'} onClick={() => setTab('active')} label="Active" count={stats.active} />
          <TabButton active={tab === 'sold'} onClick={() => setTab('sold')} label="Sold" count={stats.sold} />
          <TabButton active={tab === 'favorites'} onClick={() => setTab('favorites')} label="Favorites" count={favorites.length} />
        </div>
      </div>

      <div className="px-4 pt-4 space-y-3">
        {loading ? (
          <div className="text-center py-12 text-gray-400 text-sm">Loading...</div>
        ) : displayList.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
              {tab === 'favorites' ? <Heart className="w-7 h-7 text-gray-300" /> : <Package className="w-7 h-7 text-gray-300" />}
            </div>
            <p className="text-gray-500 font-medium">
              {tab === 'active' ? 'No active listings' : tab === 'sold' ? 'No sold items yet' : 'No favorites yet'}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              {tab === 'active' ? 'Tap "New Listing" to sell something' : tab === 'favorites' ? 'Heart items you like to save them here' : 'Mark items as sold from the menu'}
            </p>
          </div>
        ) : (
          displayList.map((listing) => (
            <div
              key={listing.id}
              onClick={() => navigate(`/listing/${listing.id}`)}
              className="bg-white rounded-2xl border border-gray-100 p-3 flex gap-3 shadow-sm hover:shadow-md transition cursor-pointer relative"
            >
              <div className="w-20 h-20 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0">
                {listing.image_urls?.[0] ? (
                  <img src={listing.image_urls[0]} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <CategoryIcon category={listing.category} className="w-8 h-8" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${CATEGORY_COLORS[listing.category]}`}>
                    {listing.category}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-gray-900 line-clamp-1">{listing.title}</h3>
                <p className="text-base font-bold text-emerald-600">{formatPrice(listing.price)}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${CONDITION_COLORS[listing.condition]}`}>
                    {listing.condition}
                  </span>
                  <span className="text-[10px] text-gray-400">{timeAgo(listing.created_at)}</span>
                </div>
              </div>

              {tab !== 'favorites' && listing.seller_id === user?.id && (
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpen(menuOpen === listing.id ? null : listing.id);
                    }}
                    className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                  {menuOpen === listing.id && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="absolute right-0 top-9 z-10 bg-white rounded-xl border border-gray-200 shadow-lg py-1 w-44"
                    >
                      <button
                        onClick={() => navigate(`/sell/${listing.id}`)}
                        className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                      >
                        <Edit3 className="w-4 h-4" /> Edit
                      </button>
                      {listing.status !== 'sold' && (
                        <button
                          onClick={() => updateStatus(listing.id, 'sold')}
                          className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                        >
                          <CheckCircle2 className="w-4 h-4" /> Mark as Sold
                        </button>
                      )}
                      {listing.status === 'sold' && (
                        <button
                          onClick={() => updateStatus(listing.id, 'active')}
                          className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                        >
                          <Circle className="w-4 h-4" /> Reactivate
                        </button>
                      )}
                      {listing.status !== 'reserved' && listing.status !== 'sold' && (
                        <button
                          onClick={() => updateStatus(listing.id, 'reserved')}
                          className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                        >
                          <Clock className="w-4 h-4" /> Reserve
                        </button>
                      )}
                      <button
                        onClick={() => deleteListing(listing.id)}
                        className="w-full px-4 py-2.5 text-left text-sm text-rose-600 hover:bg-rose-50 flex items-center gap-2 border-t border-gray-100"
                      >
                        <Trash2 className="w-4 h-4" /> Delete
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color, small }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string | number; color: string; small?: boolean }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-3 flex items-center gap-2.5">
      <div className={`w-9 h-9 rounded-lg ${color} flex items-center justify-center flex-shrink-0`}>
        <Icon className="w-4.5 h-4.5" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">{label}</p>
        <p className={`font-bold text-gray-900 ${small ? 'text-sm' : 'text-lg'}`}>{value}</p>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, label, count }: { active: boolean; onClick: () => void; label: string; count: number }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-2 text-sm font-semibold rounded-lg transition flex items-center justify-center gap-1.5 ${
        active ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-500'
      }`}
    >
      {label}
      <span className={`text-xs px-1.5 py-0.5 rounded-full ${active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-500'}`}>
        {count}
      </span>
    </button>
  );
}
