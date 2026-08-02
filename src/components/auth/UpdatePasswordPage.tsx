// ─────────────────────────────────────────────────────────────────────────────
// Page atteinte via le lien "Reset your password" reçu par email
// (redirectTo configuré dans AuthContext.resetPassword). Supabase ouvre une
// session temporaire de type "recovery" ; on demande le nouveau mot de passe
// puis on redirige vers l'app.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Loader2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { FormField } from '@/components/ui/FormField';

export function UpdatePasswordPage() {
  const { updatePassword } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }
    if (password !== confirmation) {
      setError('Les deux mots de passe ne correspondent pas.');
      return;
    }

    setPending(true);
    const { error: err } = await updatePassword(password);
    setPending(false);

    if (err) {
      setError(err);
      return;
    }
    setDone(true);
    setTimeout(() => navigate('/', { replace: true }), 1500);
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
          <p className="text-white/40 text-xs mt-1 font-medium tracking-wide uppercase">Nouveau mot de passe</p>
        </div>

        <div
          className="rounded-2xl p-6"
          style={{ background: 'rgba(13,27,46,.85)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          {done ? (
            <div className="flex flex-col items-center gap-2 py-4 text-center">
              <CheckCircle2 size={28} className="text-[#00e676]" aria-hidden="true" />
              <p className="text-white text-sm">Mot de passe mis à jour. Redirection…</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <FormField label="Nouveau mot de passe" required>
                <input
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="form-input"
                  placeholder="Au moins 6 caractères"
                />
              </FormField>

              <FormField label="Confirmer le mot de passe" required>
                <input
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmation}
                  onChange={e => setConfirmation(e.target.value)}
                  className="form-input"
                  placeholder="••••••••"
                />
              </FormField>

              {error && <p className="form-error" role="alert">{error}</p>}

              <button type="submit" disabled={pending} className="btn-primary w-full flex items-center justify-center gap-2">
                {pending && <Loader2 size={14} className="animate-spin" aria-hidden="true" />}
                {pending ? 'Enregistrement…' : 'Définir le mot de passe'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
