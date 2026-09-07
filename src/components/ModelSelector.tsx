import React, { useState } from 'react';
import { ChevronDown, Check, X } from 'lucide-react';
import { MusicfyModelId, MusicfyModel, User } from '../types';
import { MUSICFY_MODELS, getModelById } from '../config/models';

interface ModelSelectorProps {
  selectedModelId: MusicfyModelId;
  onSelectModel: (modelId: MusicfyModelId) => void;
  currentUser?: User | null;
  onOpenPricing?: () => void;
  label?: string;
  className?: string;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  selectedModelId,
  onSelectModel,
  currentUser,
  onOpenPricing,
  label = 'Model',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [pendingModel, setPendingModel] = useState<MusicfyModel | null>(null);

  const activeModel = getModelById(selectedModelId);
  const isUserPro = currentUser?.plan === 'premium';

  const models: MusicfyModel[] = [
    MUSICFY_MODELS.mars,
    MUSICFY_MODELS.earth,
    MUSICFY_MODELS.light_speed,
    MUSICFY_MODELS.light_speed_power,
  ];

  const handleSelect = (model: MusicfyModel) => {
    setIsOpen(false);
    if (model.tier === 'pro' && !isUserPro) {
      setPendingModel(model);
      setShowUpgradeModal(true);
      return;
    }
    onSelectModel(model.id);
  };

  return (
    <div className={`relative space-y-1 ${className}`}>
      {label && <div className="text-xs font-medium text-zinc-400">{label}</div>}

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 rounded-xl bg-[#18191f] border border-[#272933] hover:border-pink-500/50 text-xs text-zinc-200 flex items-center justify-between transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-gradient-to-r from-orange-400 to-pink-500 shadow-[0_0_8px_rgba(236,72,153,0.5)]" />
          <span className="font-medium text-zinc-100">{activeModel.name}</span>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 right-0 mt-1 z-30 rounded-xl bg-[#18191f] border border-[#2b2d38] shadow-xl overflow-hidden py-1">
            {models.map((model) => {
              const isSelected = selectedModelId === model.id;
              return (
                <button
                  key={model.id}
                  type="button"
                  onClick={() => handleSelect(model)}
                  className={`w-full px-3 py-2 text-xs flex items-center justify-between transition-colors cursor-pointer ${
                    isSelected ? 'bg-zinc-800 text-zinc-100 font-medium' : 'text-zinc-300 hover:bg-zinc-850 hover:text-white'
                  }`}
                >
                  <span>{model.name}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-pink-400" />}
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* Upgrade Notice Modal */}
      {showUpgradeModal && pendingModel && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#18191f] border border-pink-500/30 rounded-2xl p-5 shadow-2xl shadow-pink-500/10 space-y-4">
            <div className="flex items-center justify-between border-b border-[#2b2d38] pb-3">
              <h4 className="text-sm font-semibold text-zinc-100">Pro Model Access</h4>
              <button
                type="button"
                onClick={() => setShowUpgradeModal(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              <strong>{pendingModel.name}</strong> is available on the Pro plan. You can view plan differences and upgrade options on the Plans page.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowUpgradeModal(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowUpgradeModal(false);
                  if (onOpenPricing) onOpenPricing();
                }}
                className="px-4 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-orange-500 via-pink-500 to-violet-600 text-white hover:opacity-95 transition-colors shadow-md shadow-pink-500/20"
              >
                View Plans
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
