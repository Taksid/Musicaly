import React, { useState } from 'react';
import { X, Mail, Lock, User as UserIcon, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';
import { authService } from '../services/authService';
import { User } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  initialMode?: 'login' | 'signup';
  onClose: () => void;
  onSuccess: (user: User) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialMode = 'signup',
  onClose,
  onSuccess,
}) => {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !email.includes('@')) {
      setError('Please provide a valid email address.');
      return;
    }

    if (mode === 'signup' && !name.trim()) {
      setError('Please enter your creator name.');
      return;
    }

    try {
      let user: User | null = null;
      if (mode === 'signup') {
        user = await authService.signUp(name, email);
      } else {
        user = await authService.logIn(email);
      }

      if (user) {
        onSuccess(user);
        onClose();
      } else {
        setError('Unable to authenticate. Please check credentials.');
      }
    } catch (err) {
      setError('An unexpected authentication error occurred.');
    }
  };

  const handleDemoLogin = () => {
    const user = authService.switchDemoAccount();
    onSuccess(user);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-md">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6 sm:p-8 shadow-2xl relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 via-pink-500 to-violet-600 p-0.5 flex items-center justify-center">
            <div className="w-full h-full bg-zinc-900 rounded-md flex items-center justify-center text-pink-400">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <span className="text-xs uppercase font-bold tracking-wider bg-gradient-to-r from-orange-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">Musicfy</span>
        </div>

        <h3 className="text-xl font-bold text-white mb-1">
          {mode === 'signup' ? 'Create Creator Account' : 'Welcome Back'}
        </h3>
        <p className="text-xs text-zinc-400 mb-6">
          {mode === 'signup'
            ? 'Get 5 free full song generations and studio sessions.'
            : 'Access your songs, voice models, and studio masters.'}
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Creator / Artist Name</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Jordan River"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-pink-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-pink-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-pink-500"
              />
            </div>
          </div>

          <button
            id="auth-submit-btn"
            type="submit"
            className="w-full py-3 rounded-xl text-xs font-bold bg-gradient-to-r from-orange-500 via-pink-500 to-violet-600 text-white hover:opacity-95 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2 shadow-md shadow-pink-500/20"
          >
            <span>{mode === 'signup' ? 'Claim 5 Free Uses' : 'Log In to Studio'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-4 pt-4 border-t border-zinc-800 flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={() => {
              setMode(mode === 'signup' ? 'login' : 'signup');
              setError(null);
            }}
            className="text-pink-400 hover:underline cursor-pointer"
          >
            {mode === 'signup' ? 'Already have an account? Log In' : "Don't have an account? Sign Up"}
          </button>

          <button
            id="auth-quick-demo-btn"
            type="button"
            onClick={handleDemoLogin}
            className="text-zinc-400 hover:text-zinc-200 underline cursor-pointer"
          >
            1-Click Demo Login
          </button>
        </div>
      </div>
    </div>
  );
};
