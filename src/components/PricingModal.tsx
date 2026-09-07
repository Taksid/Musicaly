import React from 'react';
import { X, Check, Sparkles } from 'lucide-react';
import { authService } from '../services/authService';
import { User } from '../types';

interface PricingModalProps {
  isOpen: boolean;
  currentUser: User | null;
  onClose: () => void;
  onUpgraded: (user: User) => void;
}

export const PricingModal: React.FC<PricingModalProps> = ({
  isOpen,
  currentUser,
  onClose,
  onUpgraded,
}) => {
  if (!isOpen) return null;

  const handleUpgrade = async () => {
    const updated = await authService.upgradeToPremium();
    if (updated) {
      onUpgraded(updated);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-md">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-2xl p-6 sm:p-8 shadow-2xl relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center max-w-md mx-auto mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/30 text-pink-400 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Pro Creator Tier</span>
          </div>
          <h3 className="text-2xl font-black text-white">Musicfy Pro & Billing</h3>
          <p className="text-xs text-zinc-400 mt-1">
            Pro features and billing integration are coming soon. You can continue using your 5 free creations or preview pro capabilities below.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Current Free Plan */}
          <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">Free Tier</span>
              <h4 className="text-lg font-bold text-white mt-1">Starter</h4>
              <p className="text-xs text-zinc-400 mt-1">5 Successful Jobs Included</p>

              <div className="mt-4 pt-4 border-t border-zinc-800/80 space-y-2 text-xs text-zinc-400">
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-amber-400" />
                  <span>5 successful jobs included</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-amber-400" />
                  <span>Auto language detection</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-amber-400" />
                  <span>8-step mastering analyzer</span>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <span className="block text-center text-xs text-zinc-500 py-2">
                {currentUser?.plan === 'free' ? 'Currently Active' : 'Basic Tier'}
              </span>
            </div>
          </div>

          {/* Premium Plan - Coming Soon */}
          <div className="p-5 rounded-2xl bg-[#18191f] border border-pink-500/30 flex flex-col justify-between relative shadow-lg shadow-pink-500/10">
            <div className="absolute -top-3 right-4 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-zinc-900 text-pink-400 border border-pink-500/50">
              Coming Soon
            </div>

            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider bg-gradient-to-r from-orange-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">Pro Tier</span>
              <h4 className="text-lg font-bold text-white mt-1">Premium Creator</h4>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-black text-pink-400">$19</span>
                <span className="text-xs text-zinc-400">/ month (Pending Billing Setup)</span>
              </div>

              <div className="mt-4 pt-4 border-t border-zinc-800/80 space-y-2 text-xs text-zinc-300">
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-pink-400" />
                  <span>Unlimited song production</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-pink-400" />
                  <span>Lossless WAV & 4K video exports</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-pink-400" />
                  <span>Priority AI vocal and stem engines</span>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <button
                id="pricing-upgrade-confirm-btn"
                type="button"
                onClick={handleUpgrade}
                className="w-full py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-orange-500 via-pink-500 to-violet-600 text-white hover:opacity-95 transition-all cursor-pointer shadow-md shadow-pink-500/20"
              >
                {currentUser?.plan === 'premium' ? 'Pro Simulated Active' : 'Billing Integration Pending'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
