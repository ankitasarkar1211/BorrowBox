import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Star } from 'lucide-react';
import { getMyReviews } from '../../api/reviews.api';
import ReviewList from '../../components/reviews/ReviewList';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Pagination from '../../components/common/Pagination';

export default function MyReviewsPage() {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['reviews', 'my', page],
    queryFn: () => getMyReviews({ page, limit: 10, sort: '-createdAt' }),
    keepPreviousData: true,
  });

  const reviews = data?.data?.reviews || [];
  const pagination = data?.data?.pagination;

  return (
    <div>
      <h1 className="font-serif text-2xl font-semibold text-[#3A2118] mb-1 flex items-center gap-2">
        <Star className="w-5 h-5 text-[#A47551]" /> My reviews
      </h1>
      <p className="text-sm text-[#795548]/75 mb-6">Reviews you've written after returning or receiving items.</p>

      {isLoading ? (
        <LoadingSpinner text="Loading reviews..." />
      ) : (
        <>
          <ReviewList reviews={reviews} />
          {pagination && pagination.total > 0 && (
            <div className="mt-4">
              <Pagination page={pagination.page} totalPages={pagination.totalPages} onPageChange={setPage} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
