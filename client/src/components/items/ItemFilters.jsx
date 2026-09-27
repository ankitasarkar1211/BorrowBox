import React from 'react';
import { Search, X } from 'lucide-react';
import { CATEGORIES, ITEM_CONDITIONS, SORT_OPTIONS } from '../../lib/constants';

export default function ItemFilters({ filters, onChange, onReset }) {
  const hasActiveFilters = filters.search || filters.category || filters.condition;

  return (
    <div className="bg-white/60 border border-[#E8DCCB] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#795548]/50" />
        <input
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          placeholder="Search items..."
          className="w-full pl-9 pr-3 py-2 rounded-lg border border-[#E8DCCB] bg-[#FBF8F3] text-sm text-[#2B211C] placeholder:text-[#795548]/40"
        />
      </div>

      <select
        value={filters.category}
        onChange={(e) => onChange({ ...filters, category: e.target.value })}
        className="px-3 py-2 rounded-lg border border-[#E8DCCB] bg-[#FBF8F3] text-sm text-[#2B211C] min-w-[150px]"
      >
        <option value="">All Categories</option>
        {CATEGORIES.map((c) => (
          <option key={c.value} value={c.value}>{c.label}</option>
        ))}
      </select>

      <select
        value={filters.condition}
        onChange={(e) => onChange({ ...filters, condition: e.target.value })}
        className="px-3 py-2 rounded-lg border border-[#E8DCCB] bg-[#FBF8F3] text-sm text-[#2B211C] min-w-[130px]"
      >
        <option value="">Any Condition</option>
        {ITEM_CONDITIONS.map((c) => (
          <option key={c.value} value={c.value}>{c.label}</option>
        ))}
      </select>

      <select
        value={filters.sort}
        onChange={(e) => onChange({ ...filters, sort: e.target.value })}
        className="px-3 py-2 rounded-lg border border-[#E8DCCB] bg-[#FBF8F3] text-sm text-[#2B211C] min-w-[160px]"
      >
        {SORT_OPTIONS.map((s) => (
          <option key={s.value} value={s.value}>{s.label}</option>
        ))}
      </select>

      {hasActiveFilters && (
        <button
          onClick={onReset}
          className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-[#795548] hover:text-[#3A2118] transition"
        >
          <X className="w-3.5 h-3.5" /> Clear
        </button>
      )}
    </div>
  );
}
