import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, CheckCheck } from 'lucide-react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { getNotifications, getUnreadNotificationCount, markNotificationAsRead, markAllNotificationsAsRead } from '../../api/notifications.api';
import { formatDateTime } from '../../lib/utils';
import LoadingSpinner from '../common/LoadingSpinner';

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

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: unreadData } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: getUnreadNotificationCount,
    refetchInterval: 20000,
  });
  const unreadCount = unreadData?.data?.count || 0;

  const { data: listData, isLoading } = useQuery({
    queryKey: ['notifications', 'preview'],
    queryFn: () => getNotifications({ limit: 6 }),
    enabled: isOpen,
  });
  const notifications = listData?.data?.notifications || [];

  const markReadMutation = useMutation({
    mutationFn: markNotificationAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllMutation = useMutation({
    mutationFn: markAllNotificationsAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const handleNotificationClick = (n) => {
    if (!n.isRead) {
      markReadMutation.mutate(n.id);
    }
    setIsOpen(false);
    if (n.relatedEntityType === 'BorrowRequest' && n.relatedEntityId) {
      navigate(`/requests/${n.relatedEntityId}`);
    } else if (n.relatedEntityType === 'Loan' && n.relatedEntityId) {
      navigate(`/loans/${n.relatedEntityId}`);
    } else if (n.relatedEntityType === 'Item' && n.relatedEntityId) {
      navigate(`/items/${n.relatedEntityId}`);
    } else if (n.relatedEntityType === 'Review') {
      navigate('/reviews/my');
    } else if (n.type?.includes('credit')) {
      navigate('/credits');
    } else {
      navigate('/notifications');
    }
  };

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setIsOpen((o) => !o)}
        className="relative p-2 rounded-lg text-[#542F20] hover:bg-[#F5EFE6] transition"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-[#A65D43] text-white text-[10px] font-semibold leading-none">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 max-w-[90vw] bg-[#FBF8F3] border border-[#E8DCCB] rounded-xl shadow-modal z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#E8DCCB]">
            <h3 className="font-serif font-semibold text-[#3A2118] text-sm">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllMutation.mutate()}
                className="text-xs font-medium text-[#795548] hover:text-[#3A2118] inline-flex items-center gap-1"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <LoadingSpinner size="small" text="" className="p-6" />
            ) : notifications.length === 0 ? (
              <p className="text-sm text-[#795548]/70 text-center py-8 px-4">No notifications yet.</p>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`w-full text-left px-4 py-3 border-b border-[#E8DCCB]/60 last:border-0 hover:bg-[#F5EFE6] transition ${
                    !n.isRead ? 'bg-[#F5EFE6]/50' : ''
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {!n.isRead && <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#A65D43] flex-shrink-0" />}
                    <div className={n.isRead ? 'pl-3.5' : ''}>
                      <p className="text-xs font-semibold text-[#542F20] uppercase tracking-wide">
                        {NOTIFICATION_LABELS[n.type] || n.type}
                      </p>
                      <p className="text-sm text-[#3A2118] mt-0.5 leading-snug">{n.message}</p>
                      <p className="text-xs text-[#795548]/60 mt-1">{formatDateTime(n.createdAt)}</p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          <Link
            to="/notifications"
            onClick={() => setIsOpen(false)}
            className="block text-center py-2.5 text-sm font-medium text-[#795548] hover:text-[#3A2118] hover:bg-[#F5EFE6] border-t border-[#E8DCCB] transition"
          >
            View all notifications
          </Link>
        </div>
      )}
    </div>
  );
}
