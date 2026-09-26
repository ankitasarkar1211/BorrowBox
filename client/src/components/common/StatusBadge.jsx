import React from 'react';
import { cn } from '../../lib/utils';

export default function StatusBadge({ status, type = 'loan', className }) {
  if (!status) return null;

  const normalized = status.toLowerCase();

  const styles = {
    // Loan effective statuses
    upcoming: 'bg-[#E8DCCB] text-[#542F20] border-[#D4C2AB]',
    active: 'bg-[#EBF3E8] text-[#2E5A27] border-[#CFE2CA]',
    overdue: 'bg-[#FBEBE8] text-[#A65D43] border-[#F2D0C8]',
    returned: 'bg-[#F5EFE6] text-[#795548] border-[#E8DCCB]',
    cancelled: 'bg-[#F5EFE6] text-[#795548]/70 border-[#E8DCCB]',

    // Borrow request statuses
    pending: 'bg-[#FFF8E7] text-[#946200] border-[#FFE9B8]',
    approved: 'bg-[#EBF3E8] text-[#2E5A27] border-[#CFE2CA]',
    rejected: 'bg-[#FBEBE8] text-[#A65D43] border-[#F2D0C8]',

    // Item availability status
    available: 'bg-[#EBF3E8] text-[#2E5A27] border-[#CFE2CA]',
    unavailable: 'bg-[#FBEBE8] text-[#A65D43] border-[#F2D0C8]',
    requested: 'bg-[#FFF8E7] text-[#946200] border-[#FFE9B8]',
    borrowed: 'bg-[#F5EFE6] text-[#795548] border-[#E8DCCB]',
  };

  const labelMap = {
    upcoming: 'Upcoming',
    active: 'Active',
    overdue: 'Overdue',
    returned: 'Returned',
    cancelled: 'Cancelled',
    pending: 'Pending Review',
    approved: 'Approved',
    rejected: 'Rejected',
    available: 'Available',
    unavailable: 'Unavailable',
    requested: 'Requested',
    borrowed: 'Out on Loan',
  };

  const badgeStyle = styles[normalized] || 'bg-[#F5EFE6] text-[#542F20] border-[#E8DCCB]';
  const label = labelMap[normalized] || status;

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border tracking-wide uppercase',
        badgeStyle,
        className
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-70" />
      {label}
    </span>
  );
}
