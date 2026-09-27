import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Search, Users, ShieldCheck } from 'lucide-react';
import { getAdminUsers, updateAdminUserStatus } from '../../api/admin.api';
import { useAuthStore } from '../../store/authStore';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import Pagination from '../../components/common/Pagination';
import { getInitials, formatDate } from '../../lib/utils';

export default function AdminUsersPage() {
  const currentUser = useAuthStore((s) => s.user);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isActive, setIsActive] = useState('');
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'users', debouncedSearch, isActive, page],
    queryFn: () => getAdminUsers({ search: debouncedSearch || undefined, isActive: isActive || undefined, page, limit: 15, sort: '-createdAt' }),
    keepPreviousData: true,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, active }) => updateAdminUserStatus(id, active),
    onSuccess: (res) => {
      toast.success(res.message || 'User status updated.');
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Could not update this user.'),
  });

  const users = data?.data?.users || [];
  const pagination = data?.data?.pagination;

  return (
    <div>
      <h1 className="font-serif text-2xl font-semibold text-[#3A2118] mb-1">Manage users</h1>
      <p className="text-sm text-[#795548]/75 mb-5">Search across all communities. Deactivating a user blocks their account immediately.</p>

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#795548]/50" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by name or email..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-[#E8DCCB] bg-[#FBF8F3] text-sm text-[#2B211C]"
          />
        </div>
        <select
          value={isActive}
          onChange={(e) => { setIsActive(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-lg border border-[#E8DCCB] bg-[#FBF8F3] text-sm text-[#2B211C]"
        >
          <option value="">All statuses</option>
          <option value="true">Active</option>
          <option value="false">Deactivated</option>
        </select>
      </div>

      {isLoading ? (
        <LoadingSpinner text="Loading users..." />
      ) : users.length === 0 ? (
        <EmptyState icon={Users} title="No users found" description="Try a different search term or filter." />
      ) : (
        <>
          <div className="bg-white/60 border border-[#E8DCCB] rounded-xl divide-y divide-[#E8DCCB]/70 overflow-hidden">
            {users.map((u) => (
              <div key={u.id} className="flex items-center gap-3 px-4 py-3">
                <Link to={`/admin/users/${u.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-[#A47551] text-white flex items-center justify-center text-xs font-semibold flex-shrink-0">
                    {getInitials(u.name)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#3A2118] truncate flex items-center gap-1.5">
                      {u.name}
                      {u.role === 'admin' && <ShieldCheck className="w-3.5 h-3.5 text-[#A47551]" />}
                    </p>
                    <p className="text-xs text-[#795548]/60 truncate">{u.email} · {u.communityId}</p>
                  </div>
                </Link>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ${u.isActive ? 'bg-[#EBF3E8] text-[#2E5A27]' : 'bg-[#FBEBE8] text-[#A65D43]'}`}>
                  {u.isActive ? 'Active' : 'Deactivated'}
                </span>
                {u.id !== currentUser?.id && (
                  <button
                    onClick={() => statusMutation.mutate({ id: u.id, active: !u.isActive })}
                    disabled={statusMutation.isPending}
                    className="text-xs font-medium text-[#795548] hover:text-[#3A2118] flex-shrink-0 px-2 py-1"
                  >
                    {u.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                )}
              </div>
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
