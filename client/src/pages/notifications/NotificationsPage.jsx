import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, CheckCheck, BellRing, Loader2 } from 'lucide-react';
import {
  getNotifications, markNotificationAsRead, markAllNotificationsAsRead, runReminders,
} from '../../api/notifications.api';
import { useAuthStore } from '../../store/authStore';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import Pagination from '../../components/common/Pagination';
import StatusTabs from '../../components/common/StatusTabs';
import { formatDateTime } from '../../lib/utils';

const NOTIFICATION_LABELS = {
  borrow_request_received: 'New borrow request',
  borrow_request_approved: 'Request approved',
  borrow_request_rejected: 'Request rejected',
  borrow_request_cancelled: 'Request cancelled',
  loan_due_soon: 'Return due soon',
  loan_overdue: 'Loan overdue',
  item_returned: 'Item returned',
  review_received: 'New review',
  credit_received: 'Credits earned',
  credit_spent: 'Credits spent',
};

const TABS = [
  { value: '', label: 'All Notifications' },
  { value: 'false', label: 'Unread Only' },
  { value: 'true', label: 'Archived / Read' },
];

export default function NotificationsPage() {
  const [isRead, setIsRead] = useState('');
  const [page, setPage] = useState(1);
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['notifications', 'page', isRead, page],
    queryFn: () => getNotifications({ isRead: isRead || undefined, page, limit: 12 }),
    keepPreviousData: true,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  };

  const markReadMutation = useMutation({
    mutationFn: markNotificationAsRead,
    onSuccess: () => {
      invalidate();
    },
  });

  const markAllMutation = useMutation({
    mutationFn: markAllNotificationsAsRead,
    onSuccess: (res) => {
      toast.success(`Marked ${res.data?.updatedCount ?? 0} notifications as read.`);
      invalidate();
    },
  });

  const reminderMutation = useMutation({
    mutationFn: runReminders,
    onSuccess: (res) => {
      toast.success(
        `Scanned loans: ${res.data.dueSoonCreated} reminder(s), ${res.data.overdueCreated} overdue notice(s) generated.`
      );
      invalidate();
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to run scan.');
    },
  });

  const notifications = data?.data?.notifications || [];
  const pagination = data?.data?.pagination;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-[#E8DCCB]/60">
        <div>
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-[#A47551]" />
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#3A2118]">Notifications</h1>
          </div>
          <p className="text-sm text-[#795548]/80 mt-1">
            Real-time updates regarding requests, active loan returns, reviews, and credits.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start">
          {user?.role === 'admin' && (
            <button
              onClick={() => reminderMutation.mutate()}
              disabled={reminderMutation.isPending}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#F5EFE6] border border-[#E8DCCB] hover:bg-[#E8DCCB] text-xs font-semibold text-[#542F20] transition disabled:opacity-60"
            >
              {reminderMutation.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <BellRing className="w-3.5 h-3.5 text-[#A47551]" />
              )}
              Scan Due Dates
            </button>
          )}

          <button
            onClick={() => markAllMutation.mutate()}
            disabled={markAllMutation.isPending}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#542F20] to-[#3A2118] text-white text-xs font-semibold shadow-2xs hover:shadow transition disabled:opacity-60"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            Mark all as read
          </button>
        </div>
      </div>

      <StatusTabs
        options={TABS}
        value={isRead}
        onChange={(v) => {
          setIsRead(v);
          setPage(1);
        }}
      />

      {isLoading ? (
        <LoadingSpinner text="Fetching notifications..." className="py-12" />
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="All caught up!"
          description="You don't have any notifications in this section."
        />
      ) : (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white/70 backdrop-blur-xs border border-[#E8DCCB] rounded-2xl divide-y divide-[#E8DCCB]/60 overflow-hidden shadow-xs"
          >
            {notifications.map((n, idx) => (
              <motion.button
                key={n.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                onClick={() => !n.isRead && markReadMutation.mutate(n.id)}
                className={`w-full text-left px-5 py-4 flex items-start gap-3.5 hover:bg-[#F5EFE6]/60 transition ${
                  !n.isRead ? 'bg-[#F5EFE6]/40' : ''
                }`}
              >
                <div className="mt-1 flex-shrink-0">
                  {!n.isRead ? (
                    <span className="w-2.5 h-2.5 rounded-full bg-[#A65D43] block shadow-xs" />
                  ) : (
                    <span className="w-2.5 h-2.5 rounded-full bg-transparent block" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-bold text-[#542F20] tracking-wide uppercase">
                      {NOTIFICATION_LABELS[n.type] || n.type}
                    </p>
                    <span className="text-[11px] text-[#795548]/60 flex-shrink-0">
                      {formatDateTime(n.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-[#3A2118] mt-1 font-medium leading-relaxed">{n.message}</p>
                </div>
              </motion.button>
            ))}
          </motion.div>

          {pagination && pagination.totalPages > 1 && (
            <div className="pt-2">
              <Pagination page={pagination.page} totalPages={pagination.totalPages} onPageChange={setPage} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
