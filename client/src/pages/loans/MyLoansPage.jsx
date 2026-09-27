import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Handshake } from 'lucide-react';
import { getMyLoans } from '../../api/loans.api';
import LoanCard from '../../components/borrowing/LoanCard';
import StatusTabs from '../../components/common/StatusTabs';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import Pagination from '../../components/common/Pagination';
import { LOAN_EFFECTIVE_STATUSES } from '../../lib/constants';

export default function MyLoansPage() {
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['loans', 'my', status, page],
    queryFn: () => getMyLoans({ status: status || undefined, page, limit: 10, sort: '-createdAt' }),
    keepPreviousData: true,
  });

  const loans = data?.data?.loans || [];
  const pagination = data?.data?.pagination;

  return (
    <div>
      <h1 className="font-serif text-2xl font-semibold text-[#3A2118] mb-1">My loans</h1>
      <p className="text-sm text-[#795548]/75 mb-5">Items you're currently borrowing or have borrowed before.</p>

      <StatusTabs options={LOAN_EFFECTIVE_STATUSES} value={status} onChange={(v) => { setStatus(v); setPage(1); }} />

      {isLoading ? (
        <LoadingSpinner text="Loading loans..." />
      ) : loans.length === 0 ? (
        <EmptyState icon={Handshake} title="No loans here" description="You don't have any loans in this status yet." />
      ) : (
        <>
          <div className="space-y-3">
            {loans.map((loan) => (
              <LoanCard key={loan.id} loan={loan} perspective="borrower" />
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
