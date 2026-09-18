'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const supabase = createClient();
      if (mode === 'signup') {
        const { error: err } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (err) throw err;
        setMessage('Check your email to confirm, or sign in if confirmations are disabled.');
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
        window.location.href = '/create';
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Auth failed');
    } finally {
      setLoading(false);
    }
  }

  async function magicLink() {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const supabase = createClient();
      const { error: err } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (err) throw err;
      setMessage('Magic link sent — check your inbox.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send link');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="container" style={{ maxWidth: 440 }}>
      <div className="card">
        <h1 style={{ marginTop: 0 }}>Sign in to Companion</h1>
        <p className="muted">Your companions and memories live on your account.</p>
        <form onSubmit={submit}>
          <label>
            Email
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </label>
          <label>
            Password
            <input
              type="password"
              required={mode !== 'signin' || true}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              minLength={6}
            />
          </label>
          {error && <p className="error">{error}</p>}
          {message && <p className="success">{message}</p>}
          <div className="row" style={{ marginTop: 8 }}>
            <button type="submit" disabled={loading}>
              {mode === 'signin' ? 'Sign in' : 'Sign up'}
            </button>
            <button
              type="button"
              className="ghost"
              disabled={loading}
              onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
            >
              {mode === 'signin' ? 'Need an account?' : 'Have an account?'}
            </button>
          </div>
        </form>
        <button
          type="button"
          className="secondary"
          style={{ marginTop: 14, width: '100%' }}
          disabled={loading || !email}
          onClick={magicLink}
        >
          Email me a magic link
        </button>
      </div>
    </main>
  );
}
