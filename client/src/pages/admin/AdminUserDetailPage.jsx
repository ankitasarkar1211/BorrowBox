import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, ShieldCheck, Coins, Calendar } from 'lucide-react';
import { getAdminUserById, updateAdminUserStatus } from '../../api/admin.api';
import { useAuthStore } from '../../store/authStore';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import { getInitials, formatDate } from '../../lib/utils';

export default function AdminUserDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const currentUser = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'user', id],
    queryFn: () => getAdminUserById(id),
  });

  const statusMutation = useMutation({
    mutationFn: (active) => updateAdminUserStatus(id, active),
    onSuccess: (res) => {
      toast.success(res.message || 'User status updated.');
      queryClient.invalidateQueries({ queryKey: ['admin', 'user', id] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Could not update this user.'),
  });

  if (isLoading) return <LoadingSpinner text="Loading user..." />;
  if (isError) return <EmptyState title="User not found" description="This account may have been removed." />;

  const user = data.data.user;
  const isSelf = user.id === currentUser?.id;

  return (
    <div className="max-w-xl mx-auto">
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1.5 text-sm text-[#795548] hover:text-[#3A2118] mb-5">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="bg-white/60 border border-[#E8DCCB] rounded-2xl p-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[#A47551] text-white flex items-center justify-center text-xl font-semibold">
            {getInitials(user.name)}
          </div>
          <div>
            <h1 className="font-serif text-xl font-semibold text-[#3A2118] flex items-center gap-1.5">
              {user.name}
              {user.role === 'admin' && <ShieldCheck className="w-4 h-4 text-[#A47551]" />}
            </h1>
            <p className="text-sm text-[#795548]/70">{user.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-5 text-sm">
          <div className="bg-[#F5EFE6] rounded-lg p-3">
            <p className="text-xs text-[#795548]/60">Community</p>
            <p className="font-medium text-[#3A2118] mt-0.5">{user.communityId}</p>
          </div>
          <div className="bg-[#F5EFE6] rounded-lg p-3">
            <p className="text-xs text-[#795548]/60 flex items-center gap-1"><Coins className="w-3.5 h-3.5" /> Credits</p>
            <p className="font-medium text-[#3A2118] mt-0.5">{user.creditsBalance}</p>
          </div>
          <div className="bg-[#F5EFE6] rounded-lg p-3">
            <p className="text-xs text-[#795548]/60">Role</p>
            <p className="font-medium text-[#3A2118] mt-0.5 capitalize">{user.role}</p>
          </div>
          <div className="bg-[#F5EFE6] rounded-lg p-3">
            <p className="text-xs text-[#795548]/60 flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Joined</p>
            <p className="font-medium text-[#3A2118] mt-0.5">{formatDate(user.createdAt)}</p>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between bg-[#F5EFE6] rounded-lg p-3">
          <span className={`text-sm font-medium ${user.isActive ? 'text-[#2E5A27]' : 'text-[#A65D43]'}`}>
            Account is currently {user.isActive ? 'active' : 'deactivated'}
          </span>
          {!isSelf ? (
            <button
              onClick={() => statusMutation.mutate(!user.isActive)}
              disabled={statusMutation.isPending}
              className={`text-sm font-medium px-3 py-1.5 rounded-lg transition ${
                user.isActive ? 'bg-[#FBEBE8] text-[#A65D43] hover:bg-[#F5DAD3]' : 'bg-[#EBF3E8] text-[#2E5A27] hover:bg-[#DCEBD7]'
              }`}
            >
              {user.isActive ? 'Deactivate' : 'Activate'}
            </button>
          ) : (
            <span className="text-xs text-[#795548]/50">This is you</span>
          )}
        </div>
      </div>
    </div>
  );
}
