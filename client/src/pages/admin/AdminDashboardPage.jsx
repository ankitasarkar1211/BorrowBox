import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { motion } from 'motion/react';
import {
  Users, UserCheck, UserX, Package, ClipboardList, Handshake,
  PackageCheck, Star, Coins, BellRing, ShieldCheck, ArrowRight, Loader2,
} from 'lucide-react';
import { getAdminStats } from '../../api/admin.api';
import { runReminders } from '../../api/notifications.api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AnimatedCounter from '../../components/common/AnimatedCounter';

const STAT_CARDS = [
  { key: 'totalUsers', label: 'Registered Users', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
  { key: 'activeUsers', label: 'Active Members', icon: UserCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { key: 'inactiveUsers', label: 'Deactivated Accounts', icon: UserX, color: 'text-amber-600', bg: 'bg-amber-50' },
  { key: 'totalItems', label: 'Catalog Items', icon: Package, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  { key: 'totalBorrowRequests', label: 'Total Borrow Requests', icon: ClipboardList, color: 'text-purple-600', bg: 'bg-purple-50' },
  { key: 'activeLoans', label: 'Ongoing Active Loans', icon: Handshake, color: 'text-amber-700', bg: 'bg-amber-50' },
  { key: 'returnedLoans', label: 'Completed Returns', icon: PackageCheck, color: 'text-emerald-700', bg: 'bg-emerald-50' },
  { key: 'totalReviews', label: 'Community Reviews', icon: Star, color: 'text-yellow-600', bg: 'bg-yellow-50' },
  { key: 'totalCreditsInCirculation', label: 'Circulating Credits', icon: Coins, color: 'text-[#A47551]', bg: 'bg-[#F5EFE6]' },
];

export default function AdminDashboardPage() {
  const { data, isLoading } = useQuery({ queryKey: ['admin', 'stats'], queryFn: getAdminStats });
  const stats = data?.data;

  const [reminderResult, setReminderResult] = useState(null);

  const reminderMutation = useMutation({
    mutationFn: runReminders,
    onSuccess: (res) => {
      const { dueSoonCreated, overdueCreated } = res.data;
      setReminderResult({ dueSoonCreated, overdueCreated });
      toast.success(
        `Reminder scan finished: ${dueSoonCreated} due-soon notice(s), ${overdueCreated} overdue alert(s) sent.`
      );
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to execute reminder scan.');
    },
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-[#E8DCCB]/60">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-[#A47551]" />
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#3A2118]">Admin Operations</h1>
          </div>
          <p className="text-sm text-[#795548]/80 mt-1">
            Community-wide metrics, audit controls, and automated reminder management.
          </p>
        </div>

        {/* Action button to trigger backend due date reminder scan */}
        <button
          onClick={() => reminderMutation.mutate()}
          disabled={reminderMutation.isPending}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#542F20] to-[#3A2118] hover:from-[#3A2118] hover:to-[#2B211C] text-white text-sm font-semibold shadow-xs hover:shadow transition disabled:opacity-60 self-start"
        >
          {reminderMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <BellRing className="w-4 h-4 text-amber-300" />
          )}
          Trigger Due Date Reminder Scan
        </button>
      </div>

      {reminderResult && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-[#EBF3E8] border border-[#CFE2CA] flex items-center justify-between text-xs text-[#2E5A27]"
        >
          <span>
            Scan Completed: <b>{reminderResult.dueSoonCreated}</b> upcoming reminders created,{' '}
            <b>{reminderResult.overdueCreated}</b> overdue notifications created.
          </span>
          <button
            onClick={() => setReminderResult(null)}
            className="text-[11px] underline font-semibold hover:text-black"
          >
            Dismiss
          </button>
        </motion.div>
      )}

      {/* Navigation Quick Links */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Link
          to="/admin/users"
          className="group p-5 rounded-2xl bg-white/70 border border-[#E8DCCB] hover:border-[#D4C2AB] hover:shadow-card transition flex items-center justify-between"
        >
          <div>
            <h3 className="font-serif text-base font-bold text-[#3A2118] group-hover:text-[#542F20] transition">
              Manage Community Users
            </h3>
            <p className="text-xs text-[#795548]/80 mt-1">
              Review member accounts, activate/deactivate status, and view individual audit details.
            </p>
          </div>
          <ArrowRight className="w-5 h-5 text-[#795548] group-hover:translate-x-1 transition-transform flex-shrink-0 ml-4" />
        </Link>

        <Link
          to="/admin/items"
          className="group p-5 rounded-2xl bg-white/70 border border-[#E8DCCB] hover:border-[#D4C2AB] hover:shadow-card transition flex items-center justify-between"
        >
          <div>
            <h3 className="font-serif text-base font-bold text-[#3A2118] group-hover:text-[#542F20] transition">
              Moderate Catalog Items
            </h3>
            <p className="text-xs text-[#795548]/80 mt-1">
              Browse listings across your community and remove prohibited or broken items.
            </p>
          </div>
          <ArrowRight className="w-5 h-5 text-[#795548] group-hover:translate-x-1 transition-transform flex-shrink-0 ml-4" />
        </Link>
      </div>

      {/* Metrics Grid with Anime.js AnimatedCounter */}
      <div>
        <h2 className="font-serif text-lg font-bold text-[#3A2118] mb-4">Platform Overview</h2>

        {isLoading ? (
          <LoadingSpinner text="Computing system metrics..." className="py-12" />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-4 sm:gap-5">
            {STAT_CARDS.map((card, idx) => (
              <motion.div
                key={card.key}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
                className="bg-white/70 backdrop-blur-xs border border-[#E8DCCB] rounded-2xl p-4 sm:p-5 shadow-xs hover:border-[#D4C2AB] transition"
              >
                <div className={`w-8 h-8 rounded-xl ${card.bg} ${card.color} flex items-center justify-center mb-3`}>
                  <card.icon className="w-4 h-4" />
                </div>
                <p className="font-serif text-3xl font-bold text-[#3A2118]">
                  {stats?.[card.key] !== undefined ? (
                    <AnimatedCounter value={stats[card.key]} duration={700} />
                  ) : (
                    '—'
                  )}
                </p>
                <p className="text-xs font-medium text-[#795548]/80 mt-1">{card.label}</p>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
