import { Check } from 'lucide-react';
import { clsx } from 'clsx';
import type { ReactNode } from 'react';

export interface Step {
  id: number;
  label: string;
  description: string;
  icon: ReactNode;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number;
  onStepClick?: (step: number) => void;
}

export function StepIndicator({ steps, currentStep, onStepClick }: StepIndicatorProps) {
  return (
    <nav className="flex flex-col gap-1">
      {steps.map((step, idx) => {
        const isCompleted = step.id < currentStep;
        const isActive    = step.id === currentStep;
        const isClickable = isCompleted && onStepClick;

        return (
          <div key={step.id} className="relative">
            {/* Connecteur vertical */}
            {idx < steps.length - 1 && (
              <div
                className="absolute left-5 top-12 w-0.5 h-6 transition-colors duration-300"
                style={{ background: isCompleted ? 'var(--color-brand)' : 'var(--border)' }}
              />
            )}

            <button
              onClick={() => isClickable && onStepClick(step.id)}
              disabled={!isClickable && !isActive}
              className={clsx(
                'w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all duration-200',
                isCompleted && 'cursor-pointer',
                !isActive && !isCompleted && 'opacity-60 cursor-default',
              )}
              style={isActive
                ? { background: 'var(--bg-hover-strong)', boxShadow: 'inset 0 0 0 1px var(--border-strong)' }
                : undefined
              }
              onMouseEnter={e => { if (isCompleted && !isActive) e.currentTarget.style.background = 'var(--bg-hover)'; }}
              onMouseLeave={e => { if (isCompleted && !isActive) e.currentTarget.style.background = ''; }}
            >
              {/* Icône étape */}
              <div
                className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300"
                style={
                  isCompleted ? { background: 'var(--color-brand)', color: '#06101f' } :
                  isActive    ? { background: 'var(--color-accent)', color: '#06101f', boxShadow: '0 0 0 1px var(--border-strong)' } :
                                { background: 'var(--bg-hover-strong)', color: 'var(--text-muted)' }
                }
              >
                {isCompleted ? <Check size={16} strokeWidth={2.5} /> : step.icon}
              </div>

              {/* Texte */}
              <div className="min-w-0">
                <div
                  className="text-xs font-bold uppercase tracking-wide transition-colors"
                  style={{ color: isActive ? 'var(--text-primary)' : 'var(--text-muted)' }}
                >
                  Étape {step.id}
                </div>
                <div
                  className="text-sm font-semibold leading-tight"
                  style={{ color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)' }}
                >
                  {step.label}
                </div>
                <div
                  className="text-xs mt-0.5 leading-tight"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {step.description}
                </div>
              </div>
            </button>
          </div>
        );
      })}
    </nav>
  );
}
