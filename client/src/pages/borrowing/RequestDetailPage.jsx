import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, Calendar, MessageSquare, Check, X, Ban, Coins } from 'lucide-react';
import {
  getBorrowRequestById, approveBorrowRequest, rejectBorrowRequest, cancelBorrowRequest,
} from '../../api/borrowRequests.api';
import { useAuthStore } from '../../store/authStore';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { formatDate, getDurationDays, getInitials } from '../../lib/utils';

export default function RequestDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const [showReject, setShowReject] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['borrow-request', id],
    queryFn: () => getBorrowRequestById(id),
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['borrow-request', id] });
    queryClient.invalidateQueries({ queryKey: ['borrow-requests'] });
    queryClient.invalidateQueries({ queryKey: ['loans'] });
  };

  const approveMutation = useMutation({
    mutationFn: () => approveBorrowRequest(id),
    onSuccess: (res) => {
      toast.success(`Approved! ${res.data.creditsCharged} credits transferred.`);
      invalidateAll();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Could not approve this request.'),
  });

  const rejectMutation = useMutation({
    mutationFn: () => rejectBorrowRequest(id, { rejectionReason }),
    onSuccess: () => {
      toast.success('Request rejected.');
      setShowReject(false);
      invalidateAll();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Could not reject this request.'),
  });

  const cancelMutation = useMutation({
    mutationFn: () => cancelBorrowRequest(id),
    onSuccess: () => {
      toast.success('Request cancelled.');
      setShowCancelConfirm(false);
      invalidateAll();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Could not cancel this request.'),
  });

  if (isLoading) return <LoadingSpinner text="Loading request..." />;
  if (isError) {
    return <EmptyState title="Request not found" description="This request doesn't exist or you don't have access to it." />;
  }

  const request = data.data.borrowRequest;
  const isOwner = request.owner?.id === user?.id;
  const isBorrower = request.borrower?.id === user?.id;
  const days = getDurationDays(request.startDate, request.endDate);

  return (
    <div className="max-w-2xl mx-auto">
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1.5 text-sm text-[#795548] hover:text-[#3A2118] mb-5">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="bg-white/60 border border-[#E8DCCB] rounded-2xl p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {request.item?.images?.[0] ? (
              <img src={request.item.images[0]} alt="" className="w-16 h-16 rounded-lg object-cover" />
            ) : (
              <div className="w-16 h-16 rounded-lg bg-[#F5EFE6]" />
            )}
            <div>
              <Link to={`/items/${request.item?.id}`} className="font-serif text-lg font-semibold text-[#3A2118] hover:underline">
                {request.item?.title}
              </Link>
              <p className="text-sm text-[#795548]/70 mt-0.5">
                {isBorrower ? 'From' : 'Requested by'}{' '}
                <span className="font-medium text-[#542F20]">{isBorrower ? request.owner?.name : request.borrower?.name}</span>
              </p>
            </div>
          </div>
          <StatusBadge status={request.status} />
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
          <div className="bg-[#F5EFE6] rounded-lg p-3">
            <p className="text-xs text-[#795548]/60 flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Dates</p>
            <p className="mt-1 font-medium text-[#3A2118]">{formatDate(request.startDate)} – {formatDate(request.endDate)}</p>
            <p className="text-xs text-[#795548]/60 mt-0.5">{days} day{days !== 1 ? 's' : ''}</p>
          </div>
          <div className="bg-[#F5EFE6] rounded-lg p-3">
            <p className="text-xs text-[#795548]/60 flex items-center gap-1"><Coins className="w-3.5 h-3.5" /> Cost</p>
            <p className="mt-1 font-medium text-[#3A2118]">{days * (request.item?.creditCost || 0)} credits</p>
          </div>
        </div>

        {request.message && (
          <div className="mt-4">
            <p className="text-xs font-medium text-[#542F20] flex items-center gap-1 mb-1"><MessageSquare className="w-3.5 h-3.5" /> Message</p>
            <p className="text-sm text-[#3A2118]/90 bg-[#F5EFE6]/60 rounded-lg p-3">{request.message}</p>
          </div>
        )}

        {request.status === 'rejected' && request.rejectionReason && (
          <div className="mt-4">
            <p className="text-xs font-medium text-[#A65D43] mb-1">Rejection reason</p>
            <p className="text-sm text-[#3A2118]/90 bg-[#FBEBE8] rounded-lg p-3">{request.rejectionReason}</p>
          </div>
        )}

        {request.status === 'pending' && isOwner && (
          <div className="mt-6 pt-5 border-t border-[#E8DCCB] flex flex-wrap gap-3">
            <button
              onClick={() => approveMutation.mutate()}
              disabled={approveMutation.isPending}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#2E5A27] hover:bg-[#254a20] text-white text-sm font-medium transition disabled:opacity-60"
            >
              <Check className="w-4 h-4" /> Approve
            </button>
            <button
              onClick={() => setShowReject((s) => !s)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#F2D0C8] hover:bg-[#FBEBE8] text-[#A65D43] text-sm font-medium transition"
            >
              <X className="w-4 h-4" /> Reject
            </button>
          </div>
        )}

        {showReject && (
          <div className="mt-4 space-y-2">
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={2}
              maxLength={500}
              placeholder="Let them know why (required)..."
              className="w-full px-3 py-2 rounded-lg border border-[#E8DCCB] bg-[#FBF8F3] text-sm text-[#2B211C] resize-none"
            />
            <button
              onClick={() => rejectMutation.mutate()}
              disabled={!rejectionReason.trim() || rejectMutation.isPending}
              className="px-4 py-2 rounded-lg bg-[#A65D43] hover:bg-[#8D4E38] text-white text-sm font-medium transition disabled:opacity-50"
            >
              Confirm rejection
            </button>
          </div>
        )}

        {request.status === 'pending' && isBorrower && (
          <div className="mt-6 pt-5 border-t border-[#E8DCCB]">
            <button
              onClick={() => setShowCancelConfirm(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#D4C2AB] hover:bg-[#F5EFE6] text-[#3A2118] text-sm font-medium transition"
            >
              <Ban className="w-4 h-4" /> Cancel request
            </button>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={showCancelConfirm}
        onClose={() => setShowCancelConfirm(false)}
        onConfirm={() => cancelMutation.mutate()}
        title="Cancel this request?"
        description="The owner will be notified. This can't be undone."
        confirmText="Cancel request"
        isDestructive
        isLoading={cancelMutation.isPending}
      />
    </div>
  );
}
