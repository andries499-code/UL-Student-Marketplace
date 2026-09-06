import { useEffect, useState, useRef } from 'react';
import { ChevronLeft, X, ImagePlus, Loader2, Check, Tag } from 'lucide-react';
import { supabase, LISTING_COLUMNS } from '@/lib/supabase';
import { useRouter } from '@/context/RouterContext';
import { useAuth } from '@/context/AuthContext';
import type { Category, Condition, MeetupLocation, Listing } from '@/lib/types';
import {
  CATEGORIES, CONDITIONS, MEETUP_LOCATIONS, POWER_TYPES, FACULTIES,
} from '@/lib/constants';
import CategoryIcon from '@/components/CategoryIcon';

interface Props {
  editId?: string;
}

export default function SellPage({ editId }: Props) {
  const { navigate } = useRouter();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Category>('Textbooks');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [condition, setCondition] = useState<Condition>('Good / Working');
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [meetupLocation, setMeetupLocation] = useState<MeetupLocation>('Turfloop Campus Main');
  const [preciseSpot, setPreciseSpot] = useState('');
  const [author, setAuthor] = useState('');
  const [edition, setEdition] = useState('');
  const [moduleCode, setModuleCode] = useState('');
  const [faculty, setFaculty] = useState('');
  const [powerType, setPowerType] = useState('');

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(!!editId);

  useEffect(() => {
    if (!editId) return;
    async function loadListing() {
      const { data } = await supabase.from('listings').select(LISTING_COLUMNS).eq('id', editId).maybeSingle();
      if (data) {
        const l = data as Listing;
        setTitle(l.title);
        setCategory(l.category);
        setPrice(String(l.price));
        setDescription(l.description);
        setCondition(l.condition);
        setImageUrls(l.image_urls || []);
        setMeetupLocation(l.meetup_location);
        setAuthor(l.author || '');
        setEdition(l.edition || '');
        setModuleCode(l.module_code || '');
        setFaculty(l.faculty || '');
        setPowerType(l.power_type || '');

        // precise_spot is restricted at the DB level and not returned by
        // the general select above — fetch it via RPC (the owner is
        // always authorized to see their own listing's precise spot).
        const { data: spot } = await supabase.rpc('get_precise_spot', { p_listing_id: editId });
        setPreciseSpot(spot ?? '');
      }
      setLoading(false);
    }
    loadListing();
  }, [editId]);

  async function handleUpload(files: FileList | null) {
    if (!files || !user) return;
    setUploading(true);
    const urls: string[] = [];
    for (const file of Array.from(files)) {
      const ext = file.name.split('.').pop();
      const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: upErr } = await supabase.storage.from('listing-images').upload(path, file);
      if (!upErr) {
        const { data: pub } = supabase.storage.from('listing-images').getPublicUrl(path);
        urls.push(pub.publicUrl);
      }
    }
    setImageUrls((prev) => [...prev, ...urls]);
    setUploading(false);
  }

  function removeImage(idx: number) {
    setImageUrls((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setError(null);

    if (title.trim().length < 3) {
      setError('Please enter a title (at least 3 characters).');
      return;
    }
    if (!price || parseFloat(price) < 0) {
      setError('Please enter a valid price.');
      return;
    }
    if (description.trim().length < 5) {
      setError('Please add a description.');
      return;
    }
    if (!preciseSpot.trim()) {
      setError('Please specify a precise meetup spot.');
      return;
    }

    setSaving(true);
    const payload: Record<string, unknown> = {
      seller_id: user.id,
      title: title.trim(),
      category,
      price: parseFloat(price),
      description: description.trim(),
      condition,
      image_urls: imageUrls,
      meetup_location: meetupLocation,
      precise_spot: preciseSpot.trim(),
      status: 'active',
    };

    if (category === 'Textbooks') {
      payload.author = author.trim() || null;
      payload.edition = edition.trim() || null;
      payload.module_code = moduleCode.trim().toUpperCase() || null;
      payload.faculty = faculty || null;
    }
    if (category === 'Appliances') {
      payload.power_type = powerType || null;
    }

    let result;
    if (editId) {
      result = await supabase.from('listings').update(payload).eq('id', editId);
    } else {
      result = await supabase.from('listings').insert(payload);
    }

    setSaving(false);
    if (result.error) {
      setError(result.error.message);
      return;
    }
    navigate(editId ? `/listing/${editId}` : '/dashboard');
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-100 px-4 py-3 flex items-center gap-3">
        <button onClick={() => window.history.back()} className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition">
          <ChevronLeft className="w-5 h-5 text-gray-700" />
        </button>
        <h1 className="text-base font-bold text-gray-900">{editId ? 'Edit Listing' : 'Sell an Item'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="px-4 pt-4 space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Photos</label>
          <div className="grid grid-cols-3 gap-2">
            {imageUrls.map((url, idx) => (
              <div key={idx} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 group">
                <img src={url} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            {imageUrls.length < 6 && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="aspect-square rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-1 text-gray-400 hover:border-emerald-400 hover:text-emerald-500 transition disabled:opacity-50"
              >
                {uploading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <>
                    <ImagePlus className="w-6 h-6" />
                    <span className="text-xs">Add Photo</span>
                  </>
                )}
              </button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => handleUpload(e.target.files)}
            className="hidden"
          />
          <p className="text-xs text-gray-400 mt-1.5">Up to 6 photos. First photo is the cover.</p>
        </div>

        <Field label="Title">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Introduction to Statistics Textbook"
            className={inputClass}
          />
        </Field>

        <Field label="Category">
          <div className="grid grid-cols-3 gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 text-xs font-medium transition ${
                  category === cat
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                    : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                }`}
              >
                <CategoryIcon category={cat} className="w-5 h-5" />
                <span className="text-center leading-tight">{cat}</span>
              </button>
            ))}
          </div>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Price (R)">
            <input
              type="number"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0.00"
              className={inputClass}
            />
          </Field>
          <Field label="Condition">
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value as Condition)}
              className={inputClass}
            >
              {CONDITIONS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Description">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the item's condition, age, any defects, what's included..."
            rows={4}
            className={`${inputClass} resize-none`}
          />
        </Field>

        {category === 'Textbooks' && (
          <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 space-y-3">
            <h3 className="text-sm font-semibold text-blue-700 flex items-center gap-1.5">
              <Tag className="w-4 h-4" />
              Textbook Details
            </h3>
            <Field label="Author">
              <input type="text" value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="e.g. John E. Freund" className={inputClass} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Edition">
                <input type="text" value={edition} onChange={(e) => setEdition(e.target.value)} placeholder="e.g. 9th" className={inputClass} />
              </Field>
              <Field label="Module Code">
                <input type="text" value={moduleCode} onChange={(e) => setModuleCode(e.target.value)} placeholder="e.g. SSTA081" className={inputClass} />
              </Field>
            </div>
            <Field label="Faculty">
              <select value={faculty} onChange={(e) => setFaculty(e.target.value)} className={inputClass}>
                <option value="">Select faculty...</option>
                {FACULTIES.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </Field>
          </div>
        )}

        {category === 'Appliances' && (
          <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-4 space-y-3">
            <h3 className="text-sm font-semibold text-amber-700 flex items-center gap-1.5">
              <Tag className="w-4 h-4" />
              Appliance Details
            </h3>
            <Field label="Power Type">
              <select value={powerType} onChange={(e) => setPowerType(e.target.value)} className={inputClass}>
                <option value="">Select power type...</option>
                {POWER_TYPES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </Field>
          </div>
        )}

        <Field label="Meetup Area">
          <select
            value={meetupLocation}
            onChange={(e) => setMeetupLocation(e.target.value as MeetupLocation)}
            className={inputClass}
          >
            {MEETUP_LOCATIONS.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </Field>

        <Field label="Precise Spot">
          <input
            type="text"
            value={preciseSpot}
            onChange={(e) => setPreciseSpot(e.target.value)}
            placeholder="e.g. UL Library Ground Floor"
            className={inputClass}
          />
        </Field>

        {error && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold shadow-lg shadow-emerald-200 hover:shadow-emerald-300 transition flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {saving ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <Check className="w-5 h-5" />
              {editId ? 'Update Listing' : 'Publish Listing'}
            </>
          )}
        </button>
      </form>
    </div>
  );
}

const inputClass =
  'w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
      {children}
    </div>
  );
}
