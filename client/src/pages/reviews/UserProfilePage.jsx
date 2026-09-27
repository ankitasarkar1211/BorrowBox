import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Star, Package, Handshake } from 'lucide-react';
import { getUserReviews } from '../../api/reviews.api';
import ReviewList from '../../components/reviews/ReviewList';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import Pagination from '../../components/common/Pagination';
import { getInitials } from '../../lib/utils';

export default function UserProfilePage() {
  const { id } = useParams();
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['reviews', 'user', id, page],
    queryFn: () => getUserReviews(id, { page, limit: 10, sort: '-createdAt' }),
    keepPreviousData: true,
  });

  if (isLoading) return <LoadingSpinner text="Loading profile..." />;
  if (isError) return <EmptyState title="User not found" description="This user isn't in your community." />;

  const { reputation, reviews, pagination } = data.data;
  const displayName = reviews[0]?.reviewee?.name;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white/60 border border-[#E8DCCB] rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[#A47551] text-white flex items-center justify-center text-xl font-semibold">
            {getInitials(displayName)}
          </div>
          <div>
            <h1 className="font-serif text-xl font-semibold text-[#3A2118]">{displayName || 'Community member'}</h1>
            <div className="flex items-center gap-1.5 mt-1">
              <Star className="w-4 h-4 fill-[#A47551] text-[#A47551]" />
              <span className="text-sm font-semibold text-[#3A2118]">
                {reputation.averageRating != null ? reputation.averageRating.toFixed(1) : 'No ratings yet'}
              </span>
              <span className="text-xs text-[#795548]/60">({reputation.totalReviews} review{reputation.totalReviews !== 1 ? 's' : ''})</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-5">
          <div className="bg-[#F5EFE6] rounded-lg p-3 text-center">
            <Package className="w-4 h-4 text-[#795548] mx-auto mb-1" />
            <p className="text-lg font-semibold text-[#3A2118]">{reputation.completedBorrowings}</p>
            <p className="text-xs text-[#795548]/60">Completed borrows</p>
          </div>
          <div className="bg-[#F5EFE6] rounded-lg p-3 text-center">
            <Handshake className="w-4 h-4 text-[#795548] mx-auto mb-1" />
            <p className="text-lg font-semibold text-[#3A2118]">{reputation.completedLendings}</p>
            <p className="text-xs text-[#795548]/60">Completed loans given</p>
          </div>
        </div>
      </div>

      <h2 className="font-serif text-lg font-semibold text-[#3A2118] mb-3">Reviews</h2>
      <ReviewList reviews={reviews} />
      {pagination && pagination.total > 0 && (
        <div className="mt-4">
          <Pagination page={pagination.page} totalPages={pagination.totalPages} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
}
