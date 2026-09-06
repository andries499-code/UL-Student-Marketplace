import { useState } from 'react';
import { X, Flag, Check, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { LISTING_REPORT_REASONS, USER_REPORT_REASONS } from '@/lib/constants';
import type { ReportTargetType } from '@/lib/types';

interface Props {
  targetType: ReportTargetType;
  targetId: string;
  onClose: () => void;
}

export default function ReportModal({ targetType, targetId, onClose }: Props) {
  const reasons = targetType === 'listing' ? LISTING_REPORT_REASONS : USER_REPORT_REASONS;
  const [reason, setReason] = useState<string>('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!reason) {
      setError('Please choose a reason.');
      return;
    }
    setSubmitting(true);
    setError(null);
    const { error: err } = await supabase.from('reports').insert({
      target_type: targetType,
      target_id: targetId,
      reason,
      description: description.trim() || null,
    });
    setSubmitting(false);
    if (err) {
      setError('Something went wrong submitting your report. Please try again.');
      return;
    }
    setSubmitted(true);
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center">
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-5 max-h-[85vh] overflow-y-auto">
        {submitted ? (
          <div className="flex flex-col items-center text-center py-6">
            <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
              <Check className="w-7 h-7 text-emerald-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1.5">Report submitted</h3>
            <p className="text-sm text-gray-500 mb-6">
              Thanks for letting us know. We'll take a look.
            </p>
            <button
              onClick={onClose}
              className="w-full bg-gray-900 text-white font-semibold py-3 rounded-xl"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Flag className="w-5 h-5 text-rose-500" />
                <h3 className="text-lg font-bold text-gray-900">
                  Report {targetType === 'listing' ? 'listing' : 'user'}
                </h3>
              </div>
              <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <label className="block text-sm font-medium text-gray-700 mb-2">Reason</label>
            <div className="flex flex-col gap-2 mb-4">
              {reasons.map((r) => (
                <button
                  key={r}
                  onClick={() => setReason(r)}
                  className={`text-left px-4 py-2.5 rounded-xl border text-sm transition ${
                    reason === r
                      ? 'border-rose-400 bg-rose-50 text-rose-700 font-medium'
                      : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Additional details (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Anything else that would help us understand what happened."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-400/30 focus:border-rose-400 transition mb-4"
            />

            {error && <p className="text-sm text-rose-600 mb-3">{error}</p>}

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full bg-rose-600 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Submit report
            </button>
          </>
        )}
      </div>
    </div>
  );
}
