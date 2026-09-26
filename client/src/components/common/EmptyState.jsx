import React from 'react';
import { PackageOpen } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function EmptyState({
  icon: Icon = PackageOpen,
  title = 'No items found',
  description = 'There are no records matching your current criteria.',
  action,
  className,
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-12 text-center bg-[#F5EFE6]/60 rounded-xl border border-[#E8DCCB] my-4',
        className
      )}
    >
      <div className="w-14 h-14 rounded-full bg-[#E8DCCB]/60 flex items-center justify-center mb-4 text-[#542F20]">
        <Icon className="w-7 h-7" />
      </div>
      <h3 className="font-serif text-lg font-semibold text-[#3A2118]">{title}</h3>
      <p className="mt-1 text-sm text-[#542F20]/70 max-w-sm">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
