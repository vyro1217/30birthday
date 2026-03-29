import type { CSSProperties, ReactNode } from 'react';
import { cn } from '../lib/utils';

interface StageFrameProps {
  children: ReactNode;
  availableHeight: number;
  anchor?: 'center' | 'bottom';
  className?: string;
  contentClassName?: string;
}

export function StageFrame({
  children,
  availableHeight,
  anchor = 'center',
  className,
  contentClassName,
}: StageFrameProps) {
  const contentStyle: CSSProperties = {
    maxHeight: `${Math.max(availableHeight, 0)}px`,
    ['--stage-max-height' as string]: `${Math.max(availableHeight, 0)}px`,
  };

  return (
    <div
      className={cn(
        'flex h-full w-full overflow-visible',
        anchor === 'bottom' ? 'items-end justify-center' : 'items-center justify-center',
        className,
      )}
    >
      <div className={cn('w-full max-h-full min-h-0', contentClassName)} style={contentStyle}>
        {children}
      </div>
    </div>
  );
}
