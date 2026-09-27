import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Search, Package2, Trash2 } from 'lucide-react';
import { getAdminItems, deleteAdminItem } from '../../api/admin.api';
import { CATEGORIES } from '../../lib/constants';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Pagination from '../../components/common/Pagination';
import StatusBadge from '../../components/common/StatusBadge';

export default function AdminItemsPage() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [category, setCategory] = useState('');
  const [communityId, setCommunityId] = useState('');
  const [page, setPage] = useState(1);
  const [pendingDelete, setPendingDelete] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'items', debouncedSearch, category, communityId, page],
    queryFn: () => getAdminItems({
      search: debouncedSearch || undefined,
      category: category || undefined,
      communityId: communityId || undefined,
      page, limit: 15, sort: '-createdAt',
    }),
    keepPreviousData: true,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteAdminItem(id),
    onSuccess: () => {
      toast.success('Item removed.');
      queryClient.invalidateQueries({ queryKey: ['admin', 'items'] });
      setPendingDelete(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Could not remove this item.');
      setPendingDelete(null);
    },
  });

  const items = data?.data?.items || [];
  const pagination = data?.data?.pagination;

  return (
    <div>
      <h1 className="font-serif text-2xl font-semibold text-[#3A2118] mb-1">Moderate items</h1>
      <p className="text-sm text-[#795548]/75 mb-5">Across every community. Items with an active loan or pending request can't be removed.</p>

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#795548]/50" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search items..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-[#E8DCCB] bg-[#FBF8F3] text-sm text-[#2B211C]"
          />
        </div>
        <select
          value={category}
          onChange={(e) => { setCategory(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-lg border border-[#E8DCCB] bg-[#FBF8F3] text-sm text-[#2B211C]"
        >
          <option value="">All categories</option>
          {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        <input
          value={communityId}
          onChange={(e) => { setCommunityId(e.target.value); setPage(1); }}
          placeholder="Community ID"
          className="px-3 py-2 rounded-lg border border-[#E8DCCB] bg-[#FBF8F3] text-sm text-[#2B211C] w-40"
        />
      </div>

      {isLoading ? (
        <LoadingSpinner text="Loading items..." />
      ) : items.length === 0 ? (
        <EmptyState icon={Package2} title="No items found" description="Try a different search or filter." />
      ) : (
        <>
          <div className="bg-white/60 border border-[#E8DCCB] rounded-xl divide-y divide-[#E8DCCB]/70 overflow-hidden">
            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                <Link to={`/items/${item.id}`} className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#3A2118] truncate">{item.title}</p>
                  <p className="text-xs text-[#795548]/60 truncate">
                    {item.owner?.name} · {item.communityId} · {item.category}
                  </p>
                </Link>
                <StatusBadge status={item.availabilityStatus} className="flex-shrink-0" />
                <button
                  onClick={() => setPendingDelete(item)}
                  className="p-2 text-[#795548] hover:text-[#A65D43] transition flex-shrink-0"
                  aria-label="Remove item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
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

      <ConfirmDialog
        isOpen={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        onConfirm={() => deleteMutation.mutate(pendingDelete.id)}
        title={`Remove "${pendingDelete?.title}"?`}
        description="This can't be undone. Items with an active loan or pending request can't be removed."
        confirmText="Remove item"
        isDestructive
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
