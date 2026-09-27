import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Coins, ArrowUpRight, ArrowDownRight, Gift, RotateCcw, Settings } from 'lucide-react';
import { getCreditBalance, getCreditTransactions } from '../../api/credits.api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import Pagination from '../../components/common/Pagination';
import { formatDateTime } from '../../lib/utils';
import { CREDIT_TRANSACTION_TYPES } from '../../lib/constants';

const TYPE_ICONS = {
  signup_bonus: Gift,
  borrow_spend: ArrowDownRight,
  lending_reward: ArrowUpRight,
  refund: RotateCcw,
  adjustment: Settings,
};

export default function CreditsPage() {
  const [type, setType] = useState('');
  const [page, setPage] = useState(1);

  const { data: balanceData } = useQuery({
    queryKey: ['credits', 'balance'],
    queryFn: getCreditBalance,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['credits', 'transactions', type, page],
    queryFn: () => getCreditTransactions({ type: type || undefined, page, limit: 15, sort: '-createdAt' }),
    keepPreviousData: true,
  });

  const transactions = data?.data?.transactions || [];
  const pagination = data?.data?.pagination;

  return (
    <div>
      <h1 className="font-serif text-2xl font-semibold text-[#3A2118] mb-1">Borrow Credits</h1>
      <p className="text-sm text-[#795548]/75 mb-6">Earned by lending, spent to borrow — never real money.</p>

      <div className="bg-gradient-to-br from-[#542F20] to-[#3A2118] rounded-2xl p-6 text-white mb-6">
        <p className="text-sm text-white/70 flex items-center gap-1.5"><Coins className="w-4 h-4" /> Current balance</p>
        <p className="font-serif text-4xl font-semibold mt-1">{balanceData?.data?.creditsBalance ?? '—'}</p>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <select
          value={type}
          onChange={(e) => { setType(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-lg border border-[#E8DCCB] bg-[#FBF8F3] text-sm text-[#2B211C]"
        >
          {CREDIT_TRANSACTION_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <LoadingSpinner text="Loading transactions..." />
      ) : transactions.length === 0 ? (
        <EmptyState icon={Coins} title="No transactions yet" description="Your credit activity will show up here." />
      ) : (
        <>
          <div className="bg-white/60 border border-[#E8DCCB] rounded-xl divide-y divide-[#E8DCCB]/70 overflow-hidden">
            {transactions.map((tx) => {
              const Icon = TYPE_ICONS[tx.type] || Settings;
              const isPositive = tx.amount > 0;
              return (
                <div key={tx.id} className="flex items-center gap-3 px-4 py-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${isPositive ? 'bg-[#EBF3E8] text-[#2E5A27]' : 'bg-[#FBEBE8] text-[#A65D43]'}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#3A2118] truncate">{tx.description || tx.type.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-[#795548]/60">{formatDateTime(tx.createdAt)}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`text-sm font-semibold ${isPositive ? 'text-[#2E5A27]' : 'text-[#A65D43]'}`}>
                      {isPositive ? '+' : ''}{tx.amount}
                    </p>
                    <p className="text-xs text-[#795548]/50">bal. {tx.balanceAfter}</p>
                  </div>
                </div>
              );
            })}
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
