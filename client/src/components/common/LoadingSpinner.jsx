import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function LoadingSpinner({ className, text = 'Loading...', size = 'default' }) {
  const sizeClasses = {
    small: 'w-4 h-4',
    default: 'w-6 h-6',
    large: 'w-10 h-10',
  };

  return (
    <div className={cn('flex flex-col items-center justify-center p-8 text-[#795548]', className)}>
      <Loader2 className={cn('animate-spin text-[#795548]', sizeClasses[size] || sizeClasses.default)} />
      {text && <p className="mt-3 text-sm font-medium text-[#542F20]/75">{text}</p>}
    </div>
  );
}
