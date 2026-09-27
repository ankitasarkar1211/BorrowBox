import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Plus, Package } from 'lucide-react';
import { getItems } from '../../api/items.api';
import { useAuthStore } from '../../store/authStore';
import ItemCard from '../../components/items/ItemCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';

// Note: the backend's item list endpoint is community-scoped only (no
// owner filter param exists), so "my items" is derived client-side
// from the community listing. Fetches the max page size to keep this
// accurate for a typical community's catalog size.
export default function MyItemsPage() {
  const user = useAuthStore((s) => s.user);

  const { data, isLoading } = useQuery({
    queryKey: ['items', 'mine-source'],
    queryFn: () => getItems({ limit: 50, sort: '-createdAt' }),
  });

  const myItems = (data?.data?.items || []).filter((item) => item.owner?.id === user?.id);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-[#3A2118]">My items</h1>
          <p className="text-sm text-[#795548]/75 mt-0.5">Everything you've listed for your community to borrow.</p>
        </div>
        <Link
          to="/items/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#542F20] hover:bg-[#3A2118] text-white text-sm font-medium transition"
        >
          <Plus className="w-4 h-4" /> List an item
        </Link>
      </div>

      {isLoading ? (
        <LoadingSpinner text="Loading your items..." />
      ) : myItems.length === 0 ? (
        <EmptyState
          icon={Package}
          title="You haven't listed anything yet"
          description="List your first item so your community can start borrowing it."
          action={
            <Link to="/items/new" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#542F20] hover:bg-[#3A2118] text-white text-sm font-medium transition">
              <Plus className="w-4 h-4" /> List an item
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {myItems.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
