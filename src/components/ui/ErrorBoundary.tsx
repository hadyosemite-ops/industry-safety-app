// ─────────────────────────────────────────────────────────────────────────────
// ErrorBoundary — capture les erreurs de rendu React et affiche un fallback
// cohérent avec le thème au lieu d'un écran blanc.
// ─────────────────────────────────────────────────────────────────────────────

import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Libellé du module affiché dans le message d'erreur (optionnel) */
  moduleLabel?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error('[ErrorBoundary]', this.props.moduleLabel ?? '', error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[60vh] flex items-center justify-center px-6">
          <div className="card p-8 max-w-md w-full text-center flex flex-col items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[rgba(255,68,68,0.10)] border border-[rgba(255,68,68,0.3)] flex items-center justify-center">
              <AlertTriangle size={26} className="text-[color:var(--badge-danger-text)]" strokeWidth={1.75} />
            </div>
            <div>
              <p className="text-base font-bold text-[color:var(--text-primary)]">
                {this.props.moduleLabel ? `Erreur dans ${this.props.moduleLabel}` : 'Une erreur est survenue'}
              </p>
              <p className="text-sm text-[color:var(--text-muted)] mt-1.5">
                Cette section n'a pas pu s'afficher correctement. Vous pouvez réessayer ou revenir à l'accueil.
              </p>
            </div>
            <button
              type="button"
              onClick={this.handleReset}
              className="btn btn-primary mt-1"
            >
              <RefreshCw size={14} />
              Réessayer
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
