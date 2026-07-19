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
              <div className={clsx(
                'absolute left-5 top-12 w-0.5 h-6 transition-colors duration-300',
                isCompleted ? 'bg-safety-500' : 'bg-white/20'
              )} />
            )}

            <button
              onClick={() => isClickable && onStepClick(step.id)}
              disabled={!isClickable && !isActive}
              className={clsx(
                'w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all duration-200',
                isActive    && 'bg-white/15 ring-1 ring-white/30',
                isCompleted && 'opacity-90 hover:bg-white/10 cursor-pointer',
                !isActive && !isCompleted && 'opacity-40 cursor-default'
              )}
            >
              {/* Icône étape */}
              <div className={clsx(
                'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300',
                isCompleted && 'bg-safety-500 text-white',
                isActive    && 'bg-white text-navy-600 shadow-md',
                !isActive && !isCompleted && 'bg-white/20 text-white'
              )}>
                {isCompleted ? <Check size={16} strokeWidth={2.5} /> : step.icon}
              </div>

              {/* Texte */}
              <div className="min-w-0">
                <div className={clsx(
                  'text-xs font-bold uppercase tracking-wide transition-colors',
                  isActive ? 'text-white' : 'text-white/70'
                )}>
                  Étape {step.id}
                </div>
                <div className={clsx(
                  'text-sm font-semibold leading-tight',
                  isActive ? 'text-white' : 'text-white/80'
                )}>
                  {step.label}
                </div>
                <div className={clsx(
                  'text-xs mt-0.5 leading-tight',
                  isActive ? 'text-white/70' : 'text-white/50'
                )}>
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
