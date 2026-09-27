import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ClipboardList } from 'lucide-react';
import { getMyBorrowRequests } from '../../api/borrowRequests.api';
import RequestCard from '../../components/borrowing/RequestCard';
import StatusTabs from '../../components/common/StatusTabs';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import Pagination from '../../components/common/Pagination';

const TABS = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'cancelled', label: 'Cancelled' },
];

export default function MyRequestsPage() {
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['borrow-requests', 'my', status, page],
    queryFn: () => getMyBorrowRequests({ status: status || undefined, page, limit: 10, sort: '-createdAt' }),
    keepPreviousData: true,
  });

  const requests = data?.data?.borrowRequests || [];
  const pagination = data?.data?.pagination;

  return (
    <div>
      <h1 className="font-serif text-2xl font-semibold text-[#3A2118] mb-1">My requests</h1>
      <p className="text-sm text-[#795548]/75 mb-5">Borrow requests you've submitted to other members.</p>

      <StatusTabs options={TABS} value={status} onChange={(v) => { setStatus(v); setPage(1); }} />

      {isLoading ? (
        <LoadingSpinner text="Loading requests..." />
      ) : requests.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No requests here" description="You haven't submitted any borrow requests in this status yet." />
      ) : (
        <>
          <div className="space-y-3">
            {requests.map((r) => (
              <RequestCard key={r.id} request={r} perspective="borrower" />
            ))}
          </div>
          {pagination && (
            <div className="mt-4">
              <Pagination page={pagination.page} totalPages={pagination.totalPages} onPageChange={setPage} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
