import { useEffect, useState } from 'react';
import { ChevronLeft, LogOut, Save, Mail, Phone, User, ShieldCheck, Package } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from '@/context/RouterContext';
import { useAuth } from '@/context/AuthContext';
import type { Profile, Listing } from '@/lib/types';
import { formatPrice, timeAgo, CONDITION_COLORS } from '@/lib/constants';
import CategoryIcon from '@/components/CategoryIcon';

interface Props {
  userId?: string;
}

export default function ProfilePage({ userId }: Props) {
  const { navigate } = useRouter();
  const { user, profile, signOut, refreshProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [saving, setSaving] = useState(false);
  const [viewProfile, setViewProfile] = useState<Profile | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  const isOwnProfile = !userId || userId === user?.id;
  const targetId = userId || user?.id || '';

  useEffect(() => {
    if (!targetId) return;
    async function load() {
      if (isOwnProfile && profile) {
        setViewProfile(profile);
        setFullName(profile.full_name || '');
        setPhone(profile.phone || '');
        setBio(profile.bio || '');
      } else {
        const { data } = await supabase.from('profiles').select('*').eq('id', targetId).maybeSingle();
        setViewProfile(data as Profile | null);
      }

      const { data: l } = await supabase
        .from('listings')
        .select('*, seller:seller_id(*)')
        .eq('seller_id', targetId)
        .eq('status', 'active')
        .order('created_at', { ascending: false });
      setListings((l || []) as Listing[]);
      setLoading(false);
    }
    load();
  }, [targetId, profile, isOwnProfile]);

  async function handleSave() {
    if (!user) return;
    setSaving(true);
    await supabase.from('profiles').update({
      full_name: fullName.trim(),
      phone: phone.trim() || null,
      bio: bio.trim() || null,
    }).eq('id', user.id);
    await refreshProfile();
    setViewProfile((prev) => prev ? { ...prev, full_name: fullName.trim(), phone: phone.trim() || null, bio: bio.trim() || null } : prev);
    setSaving(false);
    setEditing(false);
  }

  async function handleSignOut() {
    await signOut();
    navigate('/');
  }

  if (!viewProfile && !loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <User className="w-12 h-12 text-gray-300 mb-3" />
        <p className="text-gray-500 font-medium">Profile not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-100 px-4 py-3 flex items-center gap-3">
        {!isOwnProfile && (
          <button onClick={() => window.history.back()} className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition">
            <ChevronLeft className="w-5 h-5 text-gray-700" />
          </button>
        )}
        <h1 className="text-base font-bold text-gray-900 flex-1">
          {isOwnProfile ? 'My Profile' : 'Seller Profile'}
        </h1>
        {isOwnProfile && !editing && (
          <button
            onClick={() => setEditing(true)}
            className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
          >
            Edit
          </button>
        )}
      </header>

      <div className="px-4 pt-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          {editing ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-2xl">
                  {(fullName || '?').charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-400">{user?.email}</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Phone (optional)</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 071 234 5678"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Bio (optional)</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell other students a bit about yourself..."
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setEditing(false)}
                  className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-semibold shadow-md flex items-center justify-center gap-1.5 disabled:opacity-60"
                >
                  <Save className="w-4 h-4" />
                  Save
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-2xl flex-shrink-0">
                  {(viewProfile?.full_name || '?').charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-bold text-gray-900 truncate">{viewProfile?.full_name || 'Unknown'}</h2>
                  <div className="flex items-center gap-1.5 mt-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-xs text-emerald-600 font-medium">Verified UL Student</span>
                  </div>
                  {isOwnProfile && (
                    <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      {user?.email}
                    </p>
                  )}
                </div>
              </div>

              {viewProfile?.phone && (
                <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="w-4 h-4 text-gray-400" />
                  {viewProfile.phone}
                </div>
              )}

              {viewProfile?.bio && (
                <p className="mt-3 text-sm text-gray-600 leading-relaxed">{viewProfile.bio}</p>
              )}

              {isOwnProfile && (
                <button
                  onClick={handleSignOut}
                  className="mt-5 w-full py-2.5 rounded-xl bg-rose-50 text-rose-600 text-sm font-medium hover:bg-rose-100 transition flex items-center justify-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              )}
            </>
          )}
        </div>
      </div>

      <div className="px-4 pt-5">
        <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-1.5">
          <Package className="w-4 h-4 text-gray-400" />
          {isOwnProfile ? 'My Active Listings' : 'Active Listings'}
          <span className="text-gray-400 font-normal">({listings.length})</span>
        </h3>

        {loading ? (
          <div className="text-center py-8 text-gray-400 text-sm">Loading...</div>
        ) : listings.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-gray-400">No active listings</p>
          </div>
        ) : (
          <div className="space-y-2">
            {listings.map((listing) => (
              <div
                key={listing.id}
                onClick={() => navigate(`/listing/${listing.id}`)}
                className="bg-white rounded-2xl border border-gray-100 p-3 flex gap-3 shadow-sm hover:shadow-md transition cursor-pointer"
              >
                <div className="w-16 h-16 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0">
                  {listing.image_urls?.[0] ? (
                    <img src={listing.image_urls[0]} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <CategoryIcon category={listing.category} className="w-7 h-7" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-gray-900 line-clamp-1">{listing.title}</h4>
                  <p className="text-base font-bold text-emerald-600">{formatPrice(listing.price)}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${CONDITION_COLORS[listing.condition]}`}>
                      {listing.condition}
                    </span>
                    <span className="text-[10px] text-gray-400">{timeAgo(listing.created_at)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
