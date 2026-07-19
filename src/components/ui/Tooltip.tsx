import { useState } from 'react';
import { clsx } from 'clsx';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export function Tooltip({ content, children, position = 'top' }: TooltipProps) {
  const [visible, setVisible] = useState(false);

  const posClasses = {
    top:    '-top-9 left-1/2 -translate-x-1/2',
    bottom: 'top-full mt-1 left-1/2 -translate-x-1/2',
    left:   'right-full mr-2 top-1/2 -translate-y-1/2',
    right:  'left-full ml-2 top-1/2 -translate-y-1/2',
  };

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div className={clsx(
          'absolute z-50 px-2 py-1 text-xs text-white bg-[#0f2040] border border-[rgba(0,212,255,0.2)] rounded whitespace-nowrap pointer-events-none shadow-lg',
          posClasses[position]
        )}>
          {content}
        </div>
      )}
    </div>
  );
}
