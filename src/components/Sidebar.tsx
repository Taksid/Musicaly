import React, { useState } from 'react';
import {
  Sparkles,
  Mic,
  Radio,
  Layers,
  Folder,
  Disc,
  ArrowUpRight,
  LogOut,
  Globe,
  Settings,
  CreditCard,
  User as UserIcon,
  ChevronDown,
  X,
  Menu,
} from 'lucide-react';
import { AppView, User, SupportedInterfaceLanguage } from '../types';
import { TranslationDict, INTERFACE_LANGUAGES } from '../i18n/translations';

interface SidebarProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  currentUser: User | null;
  onOpenAuth: (mode?: 'login' | 'signup') => void;
  onLogOut: () => void;
  onOpenPricing: () => void;
  currentInterfaceLang: SupportedInterfaceLanguage;
  onSelectInterfaceLang: (lang: SupportedInterfaceLanguage) => void;
  t: TranslationDict;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  currentUser,
  onOpenAuth,
  onLogOut,
  onOpenPricing,
  currentInterfaceLang,
  onSelectInterfaceLang,
  t,
}) => {
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  const freeUses = currentUser?.plan === 'premium' ? 'Unlimited' : currentUser?.freeUsesRemaining ?? 5;
  const maxUses = 5;
  const usesLeft = typeof freeUses === 'number' ? freeUses : 5;
  const progressPercent = Math.min(100, Math.max(0, (usesLeft / maxUses) * 100));

  const navItems = [
    {
      id: 'generator' as AppView,
      label: 'Create Song',
      icon: Sparkles,
      description: 'AI Song Generator',
    },
    {
      id: 'song_studio' as AppView,
      label: 'Song Studio',
      icon: Mic,
      description: 'Vocal booth & stem separation',
    },
    {
      id: 'voice_cloner' as AppView,
      label: 'Voice Cloner',
      icon: Radio,
      description: 'Consent-verified vocal models',
    },
    {
      id: 'universe_remix' as AppView,
      label: 'Universe',
      icon: Layers,
      description: 'Multi-song mashup & video',
    },
    {
      id: 'upload' as AppView,
      label: 'Upload Song',
      icon: Disc,
      description: 'Upload and transcribe',
    },
    {
      id: 'dashboard' as AppView,
      label: 'My Projects',
      icon: Folder,
      description: 'Saved songs & stems',
    },
  ];

  return (
    <>
      {/* Mobile Top Header */}
      <div className="md:hidden sticky top-0 z-40 flex items-center justify-between px-4 py-3 bg-[#121316] border-b border-[#24262e]">
        <button
          type="button"
          onClick={() => onNavigate('landing')}
          className="flex items-center gap-2 cursor-pointer"
        >
          <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-pink-400">
            <Disc className="w-4 h-4 text-pink-400" />
          </div>
          <span className="font-semibold text-sm tracking-tight text-zinc-100">Musicfy</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenPricing}
            className="px-2.5 py-1 text-xs font-medium rounded-md bg-pink-500/10 text-pink-400 border border-pink-500/30"
          >
            {usesLeft} uses left
          </button>
          <button
            type="button"
            onClick={() => setIsMobileDrawerOpen(!isMobileDrawerOpen)}
            className="p-2 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Toggle navigation menu"
          >
            {isMobileDrawerOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Backdrop & Menu */}
      {isMobileDrawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex flex-col">
          <div className="bg-[#141519] border-b border-[#262832] p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-pink-400">
                <Disc className="w-4 h-4 text-pink-400" />
              </div>
              <span className="font-semibold text-sm text-zinc-100">Musicfy</span>
            </div>
            <button
              type="button"
              onClick={() => setIsMobileDrawerOpen(false)}
              className="p-2 text-zinc-400 hover:text-zinc-100 min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-1 bg-[#121316]">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onNavigate(item.id);
                    setIsMobileDrawerOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left text-sm transition-colors min-h-[48px] cursor-pointer ${
                    isActive
                      ? 'bg-zinc-800 text-zinc-100 font-medium'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                  }`}
                >
                  <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-pink-400' : 'text-zinc-400'}`} />
                  <div>
                    <div className="font-medium text-zinc-100">{item.label}</div>
                    <div className="text-xs text-zinc-400">{item.description}</div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="p-4 bg-[#141519] border-t border-[#262832] space-y-3">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span>Remaining Uses</span>
              <span className="font-medium text-zinc-200">{usesLeft} / {maxUses} free</span>
            </div>
            <button
              type="button"
              onClick={() => {
                onOpenPricing();
                setIsMobileDrawerOpen(false);
              }}
              className="w-full py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-100 flex items-center justify-center gap-1.5"
            >
              <span>Upgrade to Pro</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => {
                onNavigate('landing');
                setIsMobileDrawerOpen(false);
              }}
              className="w-full py-2 text-center text-xs text-zinc-400 hover:text-zinc-200"
            >
              Back to Overview
            </button>
          </div>
        </div>
      )}

      {/* Desktop Compact Sidebar */}
      <aside className="hidden md:flex flex-col w-56 shrink-0 bg-[#121316] border-r border-[#24262e] select-none h-screen sticky top-0">
        {/* Brand Header */}
        <div className="p-4 border-b border-[#20222a] flex items-center justify-between">
          <button
            type="button"
            onClick={() => onNavigate('landing')}
            className="flex items-center gap-2.5 text-left group cursor-pointer"
            title="Return to public overview"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 via-pink-500 to-violet-600 p-0.5 shadow-md shadow-orange-500/20 flex items-center justify-center transition-transform group-hover:scale-105">
              <div className="w-full h-full bg-[#121316] rounded-md flex items-center justify-center text-pink-400">
                <Disc className="w-4 h-4 text-pink-400" />
              </div>
            </div>
            <div>
              <div className="text-sm font-semibold tracking-tight text-white flex items-center gap-1">
                <span className="bg-gradient-to-r from-orange-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">Musicfy</span>
              </div>
              <div className="text-[11px] text-zinc-400 leading-none">Studio Suite</div>
            </div>
          </button>
        </div>

        {/* Primary Navigation */}
        <nav className="flex-1 px-2.5 py-4 space-y-1 overflow-y-auto">
          <div className="px-2.5 pb-2 text-[11px] font-medium uppercase tracking-wider text-zinc-500">
            Creative Tools
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all text-left cursor-pointer group ${
                  isActive
                    ? 'bg-zinc-800 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive ? 'text-pink-400' : 'text-zinc-400 group-hover:text-zinc-300'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Bottom Section: Remaining Uses & Account Settings */}
        <div className="p-3 border-t border-[#20222a] space-y-3 bg-[#111215]">
          {/* Quota indicator */}
          <div className="p-2.5 rounded-lg bg-[#18191f] border border-[#262832] space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-zinc-400 font-medium">Free creations</span>
              <span className="text-zinc-200 font-semibold">{usesLeft} of {maxUses}</span>
            </div>
            <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-pink-500 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <button
              type="button"
              onClick={onOpenPricing}
              className="w-full py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-750 text-[11px] font-medium text-zinc-200 hover:text-white transition-colors flex items-center justify-center gap-1 cursor-pointer"
            >
              <span>Upgrade</span>
              <ArrowUpRight className="w-3 h-3 text-zinc-400" />
            </button>
          </div>

          {/* Account Profile Row */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
              className="w-full flex items-center justify-between p-1.5 rounded-lg hover:bg-zinc-800/60 transition-colors text-left cursor-pointer"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-semibold text-zinc-200 shrink-0">
                  {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'C'}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-medium text-zinc-200 truncate">
                    {currentUser?.name || 'Creator'}
                  </div>
                  <div className="text-[10px] text-zinc-400 truncate">
                    {currentUser?.email || 'Free tier'}
                  </div>
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            </button>

            {/* Account dropdown */}
            {isAccountMenuOpen && (
              <div className="absolute bottom-full left-0 right-0 mb-1.5 p-1.5 rounded-xl bg-[#1a1b20] border border-[#2b2d38] shadow-xl text-xs space-y-1 z-50">
                <button
                  type="button"
                  onClick={() => {
                    onOpenPricing();
                    setIsAccountMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-800/80 cursor-pointer"
                >
                  <CreditCard className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Plans & Pricing</span>
                </button>

                <div className="px-2.5 py-1.5 border-t border-zinc-800/80">
                  <div className="text-[10px] text-zinc-400 mb-1">Interface Language</div>
                  <div className="grid grid-cols-4 gap-1">
                    {INTERFACE_LANGUAGES.map((lang) => (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => {
                          onSelectInterfaceLang(lang.code);
                          setIsAccountMenuOpen(false);
                        }}
                        className={`py-1 rounded text-[10px] font-medium text-center ${
                          currentInterfaceLang === lang.code
                            ? 'bg-pink-500/20 text-pink-400 font-bold'
                            : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                        }`}
                      >
                        {lang.code.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-1 border-t border-zinc-800/80">
                  <button
                    type="button"
                    onClick={() => {
                      onNavigate('landing');
                      setIsAccountMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-800/80 cursor-pointer"
                  >
                    <span>Overview Page</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onLogOut();
                      setIsAccountMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
