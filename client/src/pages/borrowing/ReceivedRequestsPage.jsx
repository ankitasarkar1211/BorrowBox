import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ClipboardList } from 'lucide-react';
import { getReceivedBorrowRequests } from '../../api/borrowRequests.api';
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

export default function ReceivedRequestsPage() {
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['borrow-requests', 'received', status, page],
    queryFn: () => getReceivedBorrowRequests({ status: status || undefined, page, limit: 10, sort: '-createdAt' }),
    keepPreviousData: true,
  });

  const requests = data?.data?.borrowRequests || [];
  const pagination = data?.data?.pagination;

  return (
    <div>
      <h1 className="font-serif text-2xl font-semibold text-[#3A2118] mb-1">Received requests</h1>
      <p className="text-sm text-[#795548]/75 mb-5">Requests other members have sent you for your items.</p>

      <StatusTabs options={TABS} value={status} onChange={(v) => { setStatus(v); setPage(1); }} />

      {isLoading ? (
        <LoadingSpinner text="Loading requests..." />
      ) : requests.length === 0 ? (
        <EmptyState icon={ClipboardList} title="Nothing here" description="No one has requested your items in this status yet." />
      ) : (
        <>
          <div className="space-y-3">
            {requests.map((r) => (
              <RequestCard key={r.id} request={r} perspective="owner" />
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
