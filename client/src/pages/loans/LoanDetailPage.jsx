import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, Calendar, PackageCheck } from 'lucide-react';
import { getLoanById, returnLoan } from '../../api/loans.api';
import { getLoanReviews } from '../../api/reviews.api';
import { useAuthStore } from '../../store/authStore';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import ReviewForm from '../../components/reviews/ReviewForm';
import ReviewList from '../../components/reviews/ReviewList';
import { formatDate, getDurationDays } from '../../lib/utils';

export default function LoanDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['loan', id],
    queryFn: () => getLoanById(id),
  });

  const reviewsQuery = useQuery({
    queryKey: ['reviews', 'loan', id],
    queryFn: () => getLoanReviews(id),
    enabled: Boolean(data?.data?.loan && data.data.loan.status === 'returned'),
  });

  const returnMutation = useMutation({
    mutationFn: () => returnLoan(id),
    onSuccess: () => {
      toast.success('Marked as returned!');
      queryClient.invalidateQueries({ queryKey: ['loan', id] });
      queryClient.invalidateQueries({ queryKey: ['loans'] });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Could not mark this loan as returned.'),
  });

  if (isLoading) return <LoadingSpinner text="Loading loan..." />;
  if (isError) return <EmptyState title="Loan not found" description="This loan doesn't exist or you don't have access to it." />;

  const loan = data.data.loan;
  const isBorrower = loan.borrower?.id === user?.id;
  const isOwner = loan.owner?.id === user?.id;
  const days = getDurationDays(loan.startDate, loan.endDate);
  const reviews = reviewsQuery.data?.data?.reviews || [];
  const myReview = reviews.find((r) => r.reviewer?.id === user?.id);
  const reviewee = isBorrower ? loan.owner : loan.borrower;

  return (
    <div className="max-w-2xl mx-auto">
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1.5 text-sm text-[#795548] hover:text-[#3A2118] mb-5">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="bg-white/60 border border-[#E8DCCB] rounded-2xl p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {loan.item?.images?.[0] ? (
              <img src={loan.item.images[0]} alt="" className="w-16 h-16 rounded-lg object-cover" />
            ) : (
              <div className="w-16 h-16 rounded-lg bg-[#F5EFE6]" />
            )}
            <div>
              <Link to={`/items/${loan.item?.id}`} className="font-serif text-lg font-semibold text-[#3A2118] hover:underline">
                {loan.item?.title}
              </Link>
              <p className="text-sm text-[#795548]/70 mt-0.5">
                {isBorrower ? 'Borrowed from' : 'Lent to'}{' '}
                <span className="font-medium text-[#542F20]">{isBorrower ? loan.owner?.name : loan.borrower?.name}</span>
              </p>
            </div>
          </div>
          <StatusBadge status={loan.effectiveStatus} />
        </div>

        <div className="mt-5 flex items-center gap-1 text-sm text-[#3A2118] bg-[#F5EFE6] rounded-lg p-3">
          <Calendar className="w-4 h-4 text-[#795548]" />
          {formatDate(loan.startDate)} – {formatDate(loan.endDate)}
          <span className="text-[#795548]/60">({days} day{days !== 1 ? 's' : ''})</span>
        </div>

        {loan.actualReturnDate && (
          <p className="mt-3 text-sm text-[#795548]/70">Returned on {formatDate(loan.actualReturnDate)}</p>
        )}

        {loan.status === 'active' && (isBorrower || isOwner) && (
          <div className="mt-6 pt-5 border-t border-[#E8DCCB]">
            <button
              onClick={() => returnMutation.mutate()}
              disabled={returnMutation.isPending}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#542F20] hover:bg-[#3A2118] text-white text-sm font-medium transition disabled:opacity-60"
            >
              <PackageCheck className="w-4 h-4" /> Mark as returned
            </button>
          </div>
        )}
      </div>

      {loan.status === 'returned' && (
        <div className="mt-6">
          <h2 className="font-serif text-lg font-semibold text-[#3A2118] mb-3">Reviews</h2>
          {!myReview && reviewee && (
            <div className="mb-4">
              <ReviewForm loanId={id} revieweeName={reviewee.name} onDone={() => reviewsQuery.refetch()} />
            </div>
          )}
          {reviewsQuery.isLoading ? <LoadingSpinner size="small" text="" /> : <ReviewList reviews={reviews} />}
        </div>
      )}
    </div>
  );
}
