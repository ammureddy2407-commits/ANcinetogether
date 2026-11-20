import React, { useState } from 'react';
import { ArrowRight, Film, Mail } from 'lucide-react';
import { UserProfile } from '../types';
import { apiUrl } from '../utils/config';

interface AuthPageProps {
  onSuccess: (user: UserProfile) => void;
  pendingRoom?: string | null;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onSuccess, pendingRoom }) => {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const continueWithEmail = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const response = await fetch(apiUrl('/api/auth/continue'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const body = await response.text();
      let data: any;
      try { data = body ? JSON.parse(body) : {}; } catch {
        throw new Error('The account server returned an invalid response. Restart it from this project folder.');
      }
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('This server does not have the updated email sign-in route. Restart the local server from this project, or redeploy the backend and point the site to it.');
        }
        throw new Error(data.error || `Could not continue (HTTP ${response.status}).`);
      }
      setNotice('Your email is ready. Continue to choose the name you’ll use in this room.');
      onSuccess(data.user as UserProfile);
    } catch (err) {
      setError(err instanceof TypeError && /fetch/i.test(err.message)
        ? 'Could not connect to the account server. Restart it from this project folder and check that port 3000 is available.'
        : err instanceof Error ? err.message : 'Could not continue with this email.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-[#080808]">
      <div className="relative w-full max-w-5xl min-h-[520px] overflow-hidden rounded-3xl border border-white/10 bg-[#111113] shadow-2xl grid md:grid-cols-[1.05fr_0.95fr]">
        <div className="relative hidden md:flex flex-col justify-end p-10 overflow-hidden">
          <img src="https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=85" alt="Cinema seats" className="absolute inset-0 w-full h-full object-cover opacity-60" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/10" />
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-500/15 border border-rose-300/20 text-xs text-rose-100 mb-4"><Film className="w-3.5 h-3.5" /> CineTogether</div>
            <h1 className="text-4xl font-extrabold leading-tight">Make movie night<br />feel closer.</h1>
            <p className="mt-3 max-w-sm text-sm text-zinc-300">Continue with your email, choose a room name, then invite whoever you want to watch with.</p>
          </div>
        </div>
        <div className="flex flex-col justify-center p-6 sm:p-10 md:p-12">
          <div className="flex items-center gap-3 mb-7">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-rose-600 to-rose-400 flex items-center justify-center"><Film className="w-5 h-5" /></div>
            <div><p className="text-[11px] uppercase tracking-[0.18em] text-rose-300 font-semibold">CineTogether account</p><p className="text-xs text-zinc-500">Email sign-in</p></div>
          </div>
          <h2 className="text-2xl font-bold text-white">Continue with your email</h2>
          <p className="mt-2 mb-6 text-sm text-zinc-400">{pendingRoom ? `Continue to join room ${pendingRoom}. You’ll choose your room name next.` : 'Enter your email to create an account or continue to an existing one.'}</p>
          {error && <div role="alert" className="mb-4 rounded-xl border border-rose-500/25 bg-rose-950/40 p-3 text-xs text-rose-200">{error}</div>}
          {notice && <div role="status" className="mb-4 rounded-xl border border-emerald-500/25 bg-emerald-950/40 p-3 text-xs text-emerald-200">{notice}</div>}
          <form onSubmit={continueWithEmail} className="space-y-4">
            <label className="block text-xs font-medium text-zinc-300">Email address<div className="relative mt-1.5"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" /><input required type="email" autoComplete="email" autoFocus value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" className="w-full rounded-xl border border-white/10 bg-zinc-900 py-3 pl-9 pr-3 text-sm text-white placeholder-zinc-500 outline-none focus:border-rose-500" /></div></label>
            <button disabled={busy} type="submit" className="w-full rounded-xl bg-rose-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-rose-950 transition-colors hover:bg-rose-500 disabled:cursor-wait disabled:opacity-60">{busy ? 'Continuing…' : 'Continue with this email'} <ArrowRight className="ml-1 inline h-4 w-4" /></button>
          </form>
          <p className="mt-6 text-center text-[10px] leading-relaxed text-zinc-500">No verification code is required. Your email and account details are stored in the project database.</p>
        </div>
      </div>
    </div>
  );
};
