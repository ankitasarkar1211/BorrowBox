import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar } from 'lucide-react';
import StatusBadge from '../common/StatusBadge';
import { formatDate } from '../../lib/utils';

export default function LoanCard({ loan, perspective }) {
  const otherParty = perspective === 'borrower' ? loan.owner : loan.borrower;

  return (
    <Link
      to={`/loans/${loan.id}`}
      className="block bg-white/60 border border-[#E8DCCB] rounded-xl p-4 hover:border-[#D4C2AB] hover:shadow-card transition"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {loan.item?.images?.[0] ? (
            <img src={loan.item.images[0]} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
          ) : (
            <div className="w-12 h-12 rounded-lg bg-[#F5EFE6] flex-shrink-0" />
          )}
          <div>
            <p className="font-serif font-semibold text-[#3A2118] text-sm leading-snug">{loan.item?.title}</p>
            <p className="text-xs text-[#795548]/70 mt-0.5">
              {perspective === 'borrower' ? 'From' : 'To'}{' '}
              <span className="font-medium text-[#542F20]">{otherParty?.name}</span>
            </p>
          </div>
        </div>
        <StatusBadge status={loan.effectiveStatus} />
      </div>

      <div className="mt-3 flex items-center gap-1 text-xs text-[#795548]/70">
        <Calendar className="w-3.5 h-3.5" />
        {formatDate(loan.startDate)} – {formatDate(loan.endDate)}
        {loan.actualReturnDate && <span className="ml-2 text-[#795548]/50">Returned {formatDate(loan.actualReturnDate)}</span>}
      </div>
    </Link>
  );
}
