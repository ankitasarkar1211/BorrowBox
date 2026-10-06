import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, PackageSearch, Sparkles } from 'lucide-react';
import { getItems } from '../../api/items.api';
import ItemCard from '../../components/items/ItemCard';
import ItemFilters from '../../components/items/ItemFilters';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import Pagination from '../../components/common/Pagination';
import AnimatedCounter from '../../components/common/AnimatedCounter';

const DEFAULT_FILTERS = { search: '', category: '', condition: '', sort: '-createdAt' };

export default function MarketplacePage() {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(filters.search), 350);
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
    <div className="space-y-6">
      {/* Header section with total counter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-[#E8DCCB]/60">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#3A2118]">Community Marketplace</h1>
            {pagination?.totalItems !== undefined && (
              <span className="px-2.5 py-0.5 rounded-full bg-[#F5EFE6] border border-[#E8DCCB] text-xs font-semibold text-[#795548]">
                <AnimatedCounter value={pagination.totalItems} suffix=" available" duration={600} />
              </span>
            )}
          </div>
          <p className="text-sm text-[#795548]/80 mt-1">
            Browse and borrow shared equipment, textbooks, tools, and electronics in your circle.
          </p>
        </div>

        <Link
          to="/items/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#542F20] to-[#3A2118] hover:from-[#3A2118] hover:to-[#2B211C] text-white text-sm font-semibold shadow-xs hover:shadow transition-all self-start"
        >
          <Plus className="w-4 h-4" /> List an item
        </Link>
      </div>

      {/* Filter Component */}
      <ItemFilters filters={filters} onChange={setFilters} onReset={() => setFilters(DEFAULT_FILTERS)} />

      {/* Content Area */}
      {isLoading ? (
        <LoadingSpinner text="Searching marketplace items..." className="py-16" />
      ) : isError ? (
        <EmptyState
          icon={PackageSearch}
          title="Could not connect to marketplace"
          description="Check your network connection and community membership status."
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon={PackageSearch}
          title="No items found"
          description="Try broadening your search term or clearing active filters to see all available listings."
          action={
            <button
              onClick={() => setFilters(DEFAULT_FILTERS)}
              className="mt-3 px-4 py-2 rounded-xl bg-[#F5EFE6] border border-[#E8DCCB] text-xs font-semibold text-[#542F20] hover:bg-[#E8DCCB] transition"
            >
              Clear filters
            </button>
          }
        />
      ) : (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
          >
            {items.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04, duration: 0.3 }}
              >
                <ItemCard item={item} />
              </motion.div>
            ))}
          </motion.div>

          {pagination && pagination.totalPages > 1 && (
            <div className="pt-6">
              <Pagination page={pagination.page} totalPages={pagination.totalPages} onPageChange={setPage} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
