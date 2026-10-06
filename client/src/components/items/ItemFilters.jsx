import React, { useEffect, useRef } from 'react';
import { Search, X, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { CATEGORIES, ITEM_CONDITIONS, SORT_OPTIONS } from '../../lib/constants';

export default function ItemFilters({ filters, onChange, onReset }) {
  const searchInputRef = useRef(null);
  const hasActiveFilters = filters.search || filters.category || filters.condition;

  // Keyboard shortcut Ctrl+K / Cmd+K to focus search
  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="space-y-3">
      {/* Category Pills with smooth active selection */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => onChange({ ...filters, category: '' })}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
            !filters.category
              ? 'bg-[#542F20] text-white shadow-xs'
              : 'bg-white/70 text-[#795548] border border-[#E8DCCB] hover:bg-[#F5EFE6]'
          }`}
        >
          All Items
        </button>
        {CATEGORIES.map((c) => {
          const isSelected = filters.category === c.value;
          return (
            <button
              key={c.value}
              onClick={() => onChange({ ...filters, category: isSelected ? '' : c.value })}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                isSelected
                  ? 'bg-[#542F20] text-white shadow-xs'
                  : 'bg-white/70 text-[#795548] border border-[#E8DCCB] hover:bg-[#F5EFE6]'
              }`}
            >
              {c.label}
            </button>
          );
        })}
      </div>

      {/* Main Filter Bar */}
      <div className="bg-white/70 backdrop-blur-xs border border-[#E8DCCB] rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-3 shadow-xs">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#795548]/50" />
          <input
            ref={searchInputRef}
            value={filters.search}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            placeholder="Search items by title or keywords..."
            className="w-full pl-9 pr-14 py-2 rounded-xl border border-[#E8DCCB] bg-[#FBF8F3] text-sm text-[#2B211C] placeholder:text-[#795548]/40 focus:border-[#795548] transition"
          />
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-[#E8DCCB]/60 text-[10px] font-semibold text-[#795548]">
            <kbd>⌘</kbd>K
          </div>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
          <select
            value={filters.condition}
            onChange={(e) => onChange({ ...filters, condition: e.target.value })}
            className="px-3 py-2 rounded-xl border border-[#E8DCCB] bg-[#FBF8F3] text-sm text-[#2B211C] hover:border-[#D4C2AB] transition"
          >
            <option value="">Any Condition</option>
            {ITEM_CONDITIONS.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>

          <select
            value={filters.sort}
            onChange={(e) => onChange({ ...filters, sort: e.target.value })}
            className="px-3 py-2 rounded-xl border border-[#E8DCCB] bg-[#FBF8F3] text-sm text-[#2B211C] hover:border-[#D4C2AB] transition"
          >
            {SORT_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>

          {hasActiveFilters && (
            <button
              onClick={onReset}
              className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-[#A65D43] hover:text-[#3A2118] hover:bg-[#FBEBE8] rounded-xl transition"
            >
              <X className="w-3.5 h-3.5" /> Clear
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
