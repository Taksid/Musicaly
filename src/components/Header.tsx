import React, { useState } from 'react';
import {
  Sparkles,
  Play,
  Pause,
  Film,
  Disc,
  Volume2,
  ArrowRightLeft,
  AlertTriangle,
  Globe,
  User as UserIcon,
  LogOut,
  LayoutDashboard,
  Upload,
  Zap,
  Mic,
  Radio,
  Music,
  Layers,
} from 'lucide-react';
import { SongVersion, User, SupportedInterfaceLanguage, AppView } from '../types';
import { audioEngine } from '../services/audioEngine';
import { TranslationDict, INTERFACE_LANGUAGES } from '../i18n/translations';

interface HeaderProps {
  t: TranslationDict;
  currentInterfaceLang: SupportedInterfaceLanguage;
  onSelectInterfaceLang: (lang: SupportedInterfaceLanguage) => void;
  currentUser: User | null;
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  onOpenAuth: (mode?: 'login' | 'signup') => void;
  onLogOut: () => void;
  onOpenPricing: () => void;

  // Studio props (when in studio view)
  activeVersion?: SongVersion;
  isPlaying?: boolean;
  currentTime?: number;
  onPlayPause?: () => void;
  onSeek?: (seconds: number) => void;
  onOpenRegenerate?: () => void;
  onOpenVideoStudio?: () => void;
  onOpenCompare?: () => void;
  versionsCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  t,
  currentInterfaceLang,
  onSelectInterfaceLang,
  currentUser,
  currentView,
  onNavigate,
  onOpenAuth,
  onLogOut,
  onOpenPricing,
  activeVersion,
  isPlaying = false,
  currentTime = 0,
  onPlayPause,
  onSeek,
  onOpenRegenerate,
  onOpenVideoStudio,
  onOpenCompare,
  versionsCount = 1,
}) => {
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const duration = audioEngine.getDuration();
  const progressPercent = Math.min(100, (currentTime / (duration || 28)) * 100);
  const isDefective = activeVersion?.qualityReport?.status === 'quality_needs_improvement';

  return (
    <header className="sticky top-0 z-30 bg-zinc-950/95 backdrop-blur-md border-b border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Left: Brand & Navigation */}
          <div className="flex items-center gap-5">
            <button
              type="button"
              onClick={() => onNavigate('landing')}
              className="flex items-center gap-2.5 cursor-pointer text-left"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 flex items-center justify-center text-zinc-950 font-black shadow-lg shadow-amber-500/10">
                <Disc className="w-5 h-5 text-white animate-spin-slow" />
              </div>
              <div>
                <h1 className="text-sm font-black tracking-tight text-white flex items-center gap-1">
                  MUSICFY <span className="text-amber-400">AI</span>
                </h1>
                <p className="text-[10px] text-zinc-400 leading-none">AI Music Creation & Studio</p>
              </div>
            </button>

            {/* Platform Navigation Links */}
            <nav className="hidden lg:flex items-center gap-1 bg-zinc-900/60 p-1 rounded-xl border border-zinc-800/80 text-xs">
              <button
                type="button"
                onClick={() => onNavigate('generator')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                  currentView === 'generator' ? 'bg-amber-500 text-zinc-950 font-bold' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Song Generator</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('song_studio')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                  currentView === 'song_studio' ? 'bg-rose-500 text-white font-bold' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Mic className="w-3.5 h-3.5" />
                <span>Song Studio</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('voice_cloner')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                  currentView === 'voice_cloner' ? 'bg-zinc-800 text-white font-bold' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Radio className="w-3.5 h-3.5 text-amber-400" />
                <span>Voice Cloner</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('universe_remix')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                  currentView === 'universe_remix'
                    ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-zinc-950 font-black'
                    : 'text-amber-400 hover:text-amber-300 font-semibold'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Universe Model</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('dashboard')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                  currentView === 'dashboard' ? 'bg-zinc-800 text-white font-bold' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Dashboard</span>
              </button>
            </nav>
          </div>

          {/* Right: Controls, Language, Account */}
          <div className="flex items-center gap-2.5">
            {/* Interface Language Dropdown */}
            <div className="relative">
              <button
                type="button"
                id="header-lang-btn"
                onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-xs text-zinc-300 transition-colors cursor-pointer"
                title="Select Interface Language"
              >
                <Globe className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline font-medium">
                  {INTERFACE_LANGUAGES.find((l) => l.code === currentInterfaceLang)?.name}
                </span>
                <span className="sm:hidden font-mono uppercase font-bold text-[10px]">
                  {currentInterfaceLang}
                </span>
              </button>

              {isLangDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-zinc-900 border border-zinc-800 rounded-2xl p-1.5 shadow-2xl z-50 animate-in fade-in">
                  <div className="px-2.5 py-1 text-[10px] uppercase font-bold tracking-wider text-zinc-500 border-b border-zinc-800 mb-1">
                    Interface Language
                  </div>
                  {INTERFACE_LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => {
                        onSelectInterfaceLang(lang.code);
                        setIsLangDropdownOpen(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between cursor-pointer transition-colors ${
                        currentInterfaceLang === lang.code
                          ? 'bg-amber-500/15 text-amber-300 font-bold'
                          : 'text-zinc-300 hover:bg-zinc-800'
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        <span>{lang.name}</span>
                        <span className="text-zinc-500 text-[10px]">({lang.nativeName})</span>
                      </span>
                      {currentInterfaceLang === lang.code && (
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* User Account / Quota Pill */}
            {currentUser ? (
              <div className="relative">
                <button
                  id="header-user-menu-btn"
                  type="button"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-xs transition-colors cursor-pointer"
                >
                  <div className="w-5 h-5 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-[10px] font-bold text-amber-300">
                    {currentUser.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden sm:inline text-zinc-300 font-medium truncate max-w-[100px]">
                    {currentUser.name}
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-amber-400 font-bold">
                    {currentUser.plan === 'premium' ? 'PRO' : `${currentUser.freeUsesRemaining} free`}
                  </span>
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-zinc-900 border border-zinc-800 rounded-2xl p-2 shadow-2xl z-50 animate-in fade-in">
                    <div className="px-3 py-2 border-b border-zinc-800">
                      <p className="text-xs font-bold text-white truncate">{currentUser.name}</p>
                      <p className="text-[10px] text-zinc-400 truncate">{currentUser.email}</p>
                      <div className="mt-2 flex items-center justify-between text-[11px]">
                        <span className="text-zinc-400">Plan:</span>
                        <span className="font-bold text-amber-400 uppercase">
                          {currentUser.plan === 'premium' ? 'Premium (Unlimited)' : 'Free Account'}
                        </span>
                      </div>
                      {currentUser.plan === 'free' && (
                        <div className="mt-1 flex items-center justify-between text-[11px]">
                          <span className="text-zinc-400">Free Uses:</span>
                          <span className="font-mono text-zinc-200">
                            {currentUser.freeUsesRemaining} of 5 remaining
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="p-1 space-y-1">
                      {currentUser.plan === 'free' && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            onOpenPricing();
                          }}
                          className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 flex items-center gap-2 transition-colors cursor-pointer"
                        >
                          <Zap className="w-3.5 h-3.5 text-amber-400" />
                          <span>Upgrade to Unlimited</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onNavigate('generator');
                        }}
                        className="w-full text-left px-3 py-2 rounded-lg text-xs text-zinc-300 hover:bg-zinc-800 flex items-center gap-2 transition-colors cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <span>AI Song Generator</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onNavigate('song_studio');
                        }}
                        className="w-full text-left px-3 py-2 rounded-lg text-xs text-zinc-300 hover:bg-zinc-800 flex items-center gap-2 transition-colors cursor-pointer"
                      >
                        <Mic className="w-3.5 h-3.5 text-rose-400" />
                        <span>AI Song Studio</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onNavigate('voice_cloner');
                        }}
                        className="w-full text-left px-3 py-2 rounded-lg text-xs text-zinc-300 hover:bg-zinc-800 flex items-center gap-2 transition-colors cursor-pointer"
                      >
                        <Radio className="w-3.5 h-3.5 text-amber-400" />
                        <span>AI Voice Cloner</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onNavigate('dashboard');
                        }}
                        className="w-full text-left px-3 py-2 rounded-lg text-xs text-zinc-300 hover:bg-zinc-800 flex items-center gap-2 transition-colors cursor-pointer"
                      >
                        <LayoutDashboard className="w-3.5 h-3.5 text-zinc-400" />
                        <span>My Dashboard</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onLogOut();
                        }}
                        className="w-full text-left px-3 py-2 rounded-lg text-xs text-rose-400 hover:bg-zinc-800 flex items-center gap-2 transition-colors cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>{t.logOut}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onOpenAuth('login')}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-zinc-300 hover:text-white hover:bg-zinc-900 border border-zinc-800 transition-colors cursor-pointer"
                >
                  {t.logIn}
                </button>
                <button
                  type="button"
                  onClick={() => onOpenAuth('signup')}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-orange-500 via-pink-500 to-violet-600 text-white transition-colors cursor-pointer shadow-md shadow-pink-500/20"
                >
                  {t.signUp}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile secondary navigation bar */}
        <div className="lg:hidden flex items-center justify-around gap-1 pt-2 border-t border-zinc-900 mt-2 text-xs">
          <button
            type="button"
            onClick={() => onNavigate('generator')}
            className={`py-1 px-2 rounded-lg transition-colors cursor-pointer ${
              currentView === 'generator' ? 'text-amber-400 font-bold' : 'text-zinc-400'
            }`}
          >
            Generator
          </button>
          <button
            type="button"
            onClick={() => onNavigate('song_studio')}
            className={`py-1 px-2 rounded-lg transition-colors cursor-pointer ${
              currentView === 'song_studio' ? 'text-rose-400 font-bold' : 'text-zinc-400'
            }`}
          >
            Studio
          </button>
          <button
            type="button"
            onClick={() => onNavigate('voice_cloner')}
            className={`py-1 px-2 rounded-lg transition-colors cursor-pointer ${
              currentView === 'voice_cloner' ? 'text-amber-400 font-bold' : 'text-zinc-400'
            }`}
          >
            Voice Cloner
          </button>
          <button
            type="button"
            onClick={() => onNavigate('universe_remix')}
            className={`py-1 px-2 rounded-lg transition-colors cursor-pointer ${
              currentView === 'universe_remix' ? 'text-amber-400 font-black' : 'text-amber-300/80'
            }`}
          >
            Universe
          </button>
          <button
            type="button"
            onClick={() => onNavigate('dashboard')}
            className={`py-1 px-2 rounded-lg transition-colors cursor-pointer ${
              currentView === 'dashboard' ? 'text-white font-bold' : 'text-zinc-400'
            }`}
          >
            Dashboard
          </button>
        </div>
      </div>
    </header>
  );
};
