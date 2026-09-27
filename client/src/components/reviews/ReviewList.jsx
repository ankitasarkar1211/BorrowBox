import React from 'react';
import { getInitials, formatDate } from '../../lib/utils';
import StarRating from './StarRating';
import EmptyState from '../common/EmptyState';
import { MessageSquare } from 'lucide-react';

export default function ReviewList({ reviews = [] }) {
  if (reviews.length === 0) {
    return <EmptyState icon={MessageSquare} title="No reviews yet" description="Nothing has been reviewed here yet." />;
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <div key={review.id} className="bg-white/60 border border-[#E8DCCB] rounded-xl p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#A47551] text-white flex items-center justify-center text-xs font-semibold flex-shrink-0">
                {getInitials(review.reviewer?.name)}
              </div>
              <div>
                <p className="text-sm font-semibold text-[#3A2118]">{review.reviewer?.name || 'A community member'}</p>
                <p className="text-xs text-[#795548]/60">{formatDate(review.createdAt)}</p>
              </div>
            </div>
            <StarRating value={review.rating} readOnly size="small" />
          </div>
          {review.comment && <p className="mt-3 text-sm text-[#542F20]/85 leading-relaxed">{review.comment}</p>}
          {review.item?.title && (
            <p className="mt-2 text-xs text-[#795548]/60">Regarding: {review.item.title}</p>
          )}
        </div>
      ))}
    </div>
  );
}
