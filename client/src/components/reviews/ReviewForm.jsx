import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { createReview } from '../../api/reviews.api';
import StarRating from './StarRating';

export default function ReviewForm({ loanId, revieweeName, onDone }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => createReview({ loanId, rating, comment: comment || undefined }),
    onSuccess: () => {
      toast.success('Review submitted. Thank you!');
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      queryClient.invalidateQueries({ queryKey: ['loan', loanId] });
      onDone?.();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Could not submit your review.'),
  });

  return (
    <div className="bg-white/60 border border-[#E8DCCB] rounded-xl p-4 space-y-3">
      <p className="text-sm font-medium text-[#542F20]">Rate your experience with {revieweeName}</p>
      <StarRating value={rating} onChange={setRating} size="large" />
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={2}
        maxLength={1000}
        placeholder="Optional comment..."
        className="w-full px-3 py-2 rounded-lg border border-[#E8DCCB] bg-[#FBF8F3] text-sm text-[#2B211C] resize-none"
      />
      <button
        onClick={() => mutation.mutate()}
        disabled={rating === 0 || mutation.isPending}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#542F20] hover:bg-[#3A2118] text-white text-sm font-medium transition disabled:opacity-50"
      >
        {mutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
        Submit review
      </button>
    </div>
  );
}
