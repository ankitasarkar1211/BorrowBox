import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'motion/react';
import {
  Coins, ArrowUpRight, ArrowDownRight, Gift, RotateCcw,
  Settings, Sparkles, TrendingUp, HelpCircle,
} from 'lucide-react';
import { getCreditBalance, getCreditTransactions } from '../../api/credits.api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import Pagination from '../../components/common/Pagination';
import AnimatedCounter from '../../components/common/AnimatedCounter';
import CardFlip from '../../components/kokonutui/card-flip';
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

  const { data: balanceData, isLoading: isBalanceLoading } = useQuery({
    queryKey: ['credits', 'balance'],
    queryFn: getCreditBalance,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['credits', 'transactions', type, page],
    queryFn: () => getCreditTransactions({ type: type || undefined, page, limit: 12, sort: '-createdAt' }),
    keepPreviousData: true,
  });

  const balance = balanceData?.data?.creditsBalance ?? 0;
  const transactions = data?.data?.transactions || [];
  const pagination = data?.data?.pagination;

  // Compute lifetime earnings and spends from current transactions for snapshot
  const earnedTotal = transactions
    .filter((t) => t.amount > 0)
    .reduce((acc, t) => acc + t.amount, 0);
  const spentTotal = transactions
    .filter((t) => t.amount < 0)
    .reduce((acc, t) => acc + Math.abs(t.amount), 0);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#3A2118]">Borrow Credits</h1>
        <p className="text-sm text-[#795548]/80 mt-1">
          The non-monetary currency powering reciprocal sharing. Lend to earn, spend to borrow.
        </p>
      </div>

      {/* Hero Stats Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Balance Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 bg-gradient-to-br from-[#542F20] via-[#3A2118] to-[#2B211C] rounded-2xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden flex flex-col justify-between"
        >
          <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-60 h-60 rounded-full bg-white/5 pointer-events-none" />
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold text-[#E8DCCB] backdrop-blur-sm">
                <Coins className="w-3.5 h-3.5 text-amber-300" /> Current Available Balance
              </span>
              <span className="text-xs text-white/50">Zero cash value</span>
            </div>

            <p className="font-serif text-5xl sm:text-6xl font-bold tracking-tight text-white mt-1">
              {isBalanceLoading ? (
                '—'
              ) : (
                <AnimatedCounter value={balance} duration={900} />
              )}
              <span className="text-2xl font-light text-[#E8DCCB] ml-2">credits</span>
            </p>
          </div>

          <div className="mt-8 pt-5 border-t border-white/10 grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <p className="text-white/60">New Signup Bonus</p>
              <p className="text-sm font-semibold text-emerald-300 mt-0.5">+5 Credits</p>
            </div>
            <div>
              <p className="text-white/60">Recent Earnings</p>
              <p className="text-sm font-semibold text-emerald-300 mt-0.5">+{earnedTotal} Credits</p>
            </div>
            <div>
              <p className="text-white/60">Recent Spent</p>
              <p className="text-sm font-semibold text-rose-300 mt-0.5">-{spentTotal} Credits</p>
            </div>
          </div>
        </motion.div>

        {/* KokonutUI CardFlip Explainer */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex justify-center"
        >
          <CardFlip
            title="How to Earn More"
            subtitle="Reciprocal Economy"
            description="BorrowBox rewards members who contribute to their community."
            features={[
              'List items in good condition',
              'Approve borrow requests',
              'Earn credits per day lent',
              'Keep items well maintained',
            ]}
            actionLabel="List an item now"
            className="h-full min-h-[280px]"
          />
        </motion.div>
      </div>

      {/* Transactions Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="font-serif text-xl font-bold text-[#3A2118]">Activity Ledger</h2>
            <p className="text-xs text-[#795548]/75">Every credit earned, spent, or rewarded is immutably logged.</p>
          </div>

          <select
            value={type}
            onChange={(e) => {
              setType(e.target.value);
              setPage(1);
            }}
            className="px-3.5 py-2 rounded-xl border border-[#E8DCCB] bg-[#FBF8F3] text-sm text-[#2B211C] hover:border-[#D4C2AB] transition self-start"
          >
            {CREDIT_TRANSACTION_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        {isLoading ? (
          <LoadingSpinner text="Fetching ledger records..." className="py-12" />
        ) : transactions.length === 0 ? (
          <EmptyState
            icon={Coins}
            title="No transactions found"
            description="Activity will appear here once you lend or borrow items in your circle."
          />
        ) : (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white/70 backdrop-blur-xs border border-[#E8DCCB] rounded-2xl divide-y divide-[#E8DCCB]/60 overflow-hidden shadow-xs"
            >
              {transactions.map((tx, idx) => {
                const Icon = TYPE_ICONS[tx.type] || Settings;
                const isPositive = tx.amount > 0;
                return (
                  <motion.div
                    key={tx.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className="flex items-center gap-3.5 px-4.5 py-3.5 hover:bg-[#F5EFE6]/60 transition"
                  >
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-2xs ${
                        isPositive ? 'bg-[#EBF3E8] text-[#2E5A27]' : 'bg-[#FBEBE8] text-[#A65D43]'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#3A2118] truncate">
                        {tx.description || tx.type.replace(/_/g, ' ')}
                      </p>
                      <p className="text-xs text-[#795548]/70 mt-0.5">{formatDateTime(tx.createdAt)}</p>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <p className={`text-base font-bold ${isPositive ? 'text-[#2E5A27]' : 'text-[#A65D43]'}`}>
                        {isPositive ? '+' : ''}
                        {tx.amount}
                      </p>
                      <p className="text-[11px] text-[#795548]/60">Balance: {tx.balanceAfter}</p>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>

            {pagination && pagination.totalPages > 1 && (
              <div className="pt-2">
                <Pagination page={pagination.page} totalPages={pagination.totalPages} onPageChange={setPage} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
