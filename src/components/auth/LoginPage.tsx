// ─────────────────────────────────────────────────────────────────────────────
// Page de connexion — écran public unique, esthétique cockpit alignée sur
// la sidebar (fond dégradé sombre, accent cyan #00d4ff).
// ─────────────────────────────────────────────────────────────────────────────

import { useState, type FormEvent } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Shield, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { FormField } from '@/components/ui/FormField';

export function LoginPage() {
  const { session, signIn } = useAuth();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  if (session) {
    const from = (location.state as { from?: string } | null)?.from ?? '/';
    return <Navigate to={from} replace />;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const { error: err } = await signIn(email, password);
    setPending(false);
    if (err) setError(err);
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'linear-gradient(180deg, #050e1f 0%, #020817 100%)' }}
    >
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: 'linear-gradient(135deg, #00d4ff, #0077aa)', boxShadow: '0 0 30px rgba(0,212,255,0.35)' }}
          >
            <Shield size={26} className="text-[#02101f]" strokeWidth={2.5} />
          </div>
          <p className="text-white font-bold text-lg tracking-tight">HSE 365</p>
          <p className="text-white/40 text-xs mt-1 font-medium tracking-wide uppercase">Industriel</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl p-6 space-y-4"
          style={{ background: 'rgba(13,27,46,.85)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <FormField label="Email" required>
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="form-input"
              placeholder="prenom.nom@entreprise.com"
            />
          </FormField>

          <FormField label="Mot de passe" required>
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="form-input"
              placeholder="••••••••"
            />
          </FormField>

          {error && (
            <p className="form-error" role="alert">{error}</p>
          )}

          <button type="submit" disabled={pending} className="btn-primary w-full flex items-center justify-center gap-2">
            {pending && <Loader2 size={14} className="animate-spin" aria-hidden="true" />}
            {pending ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>

        <p className="text-center text-white/30 text-xs mt-6">
          Accès réservé aux comptes invités par votre responsable HSE.
        </p>
      </div>
    </div>
  );
}
