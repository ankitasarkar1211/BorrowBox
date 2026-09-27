import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Plus, PackageSearch } from 'lucide-react';
import { getItems } from '../../api/items.api';
import ItemCard from '../../components/items/ItemCard';
import ItemFilters from '../../components/items/ItemFilters';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import Pagination from '../../components/common/Pagination';

const DEFAULT_FILTERS = { search: '', category: '', condition: '', sort: '-createdAt' };

export default function MarketplacePage() {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(filters.search), 400);
    return () => clearTimeout(t);
  }, [filters.search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, filters.category, filters.condition, filters.sort]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['items', { ...filters, search: debouncedSearch, page }],
    queryFn: () =>
      getItems({
        search: debouncedSearch || undefined,
        category: filters.category || undefined,
        condition: filters.condition || undefined,
        sort: filters.sort,
        page,
        limit: 12,
      }),
    keepPreviousData: true,
  });

  const items = data?.data?.items || [];
  const pagination = data?.data?.pagination;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-[#3A2118]">Marketplace</h1>
          <p className="text-sm text-[#795548]/75 mt-0.5">Browse what your community is sharing right now.</p>
        </div>
        <Link
          to="/items/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#542F20] hover:bg-[#3A2118] text-white text-sm font-medium transition self-start"
        >
          <Plus className="w-4 h-4" /> List an item
        </Link>
      </div>

      <div className="mb-6">
        <ItemFilters filters={filters} onChange={setFilters} onReset={() => setFilters(DEFAULT_FILTERS)} />
      </div>

      {isLoading ? (
        <LoadingSpinner text="Loading items..." />
      ) : isError ? (
        <EmptyState
          icon={PackageSearch}
          title="Couldn't load items"
          description="Something went wrong reaching the marketplace. Please try again."
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon={PackageSearch}
          title="No items match your search"
          description="Try a different search term or clear your filters."
        />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {items.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
          {pagination && (
            <div className="mt-6">
              <Pagination page={pagination.page} totalPages={pagination.totalPages} onPageChange={setPage} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
