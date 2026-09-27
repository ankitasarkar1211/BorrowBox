import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck } from 'lucide-react';
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '../../api/notifications.api';
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
  { value: '', label: 'All' },
  { value: 'false', label: 'Unread' },
  { value: 'true', label: 'Read' },
];

export default function NotificationsPage() {
  const [isRead, setIsRead] = useState('');
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['notifications', 'page', isRead, page],
    queryFn: () => getNotifications({ isRead: isRead || undefined, page, limit: 15 }),
    keepPreviousData: true,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['notifications'] });

  const markReadMutation = useMutation({ mutationFn: markNotificationAsRead, onSuccess: invalidate });
  const markAllMutation = useMutation({ mutationFn: markAllNotificationsAsRead, onSuccess: invalidate });

  const notifications = data?.data?.notifications || [];
  const pagination = data?.data?.pagination;

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h1 className="font-serif text-2xl font-semibold text-[#3A2118] flex items-center gap-2">
          <Bell className="w-5 h-5 text-[#A47551]" /> Notifications
        </h1>
        <button
          onClick={() => markAllMutation.mutate()}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[#795548] hover:text-[#3A2118]"
        >
          <CheckCheck className="w-4 h-4" /> Mark all read
        </button>
      </div>
      <p className="text-sm text-[#795548]/75 mb-5">Everything happening across your requests, loans, and reviews.</p>

      <StatusTabs options={TABS} value={isRead} onChange={(v) => { setIsRead(v); setPage(1); }} />

      {isLoading ? (
        <LoadingSpinner text="Loading notifications..." />
      ) : notifications.length === 0 ? (
        <EmptyState icon={Bell} title="Nothing here" description="You're all caught up." />
      ) : (
        <>
          <div className="bg-white/60 border border-[#E8DCCB] rounded-xl divide-y divide-[#E8DCCB]/70 overflow-hidden">
            {notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => !n.isRead && markReadMutation.mutate(n.id)}
                className={`w-full text-left px-4 py-3.5 flex items-start gap-3 hover:bg-[#F5EFE6]/60 transition ${!n.isRead ? 'bg-[#F5EFE6]/40' : ''}`}
              >
                {!n.isRead ? (
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#A65D43] flex-shrink-0" />
                ) : (
                  <span className="mt-1.5 w-1.5 h-1.5 flex-shrink-0" />
                )}
                <div>
                  <p className="text-xs font-semibold text-[#542F20] uppercase tracking-wide">
                    {NOTIFICATION_LABELS[n.type] || n.type}
                  </p>
                  <p className="text-sm text-[#3A2118] mt-0.5">{n.message}</p>
                  <p className="text-xs text-[#795548]/60 mt-1">{formatDateTime(n.createdAt)}</p>
                </div>
              </button>
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
