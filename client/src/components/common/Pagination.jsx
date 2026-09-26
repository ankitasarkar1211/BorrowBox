import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ page, totalPages, onPageChange, className = '' }) {
  if (!totalPages || totalPages <= 1) return null;

  return (
    <div className={`flex items-center justify-between px-4 py-3 bg-[#FBF8F3] border-t border-[#E8DCCB] sm:px-6 ${className}`}>
      <div className="text-sm text-[#542F20]/80">
        Page <span className="font-semibold text-[#3A2118]">{page}</span> of{' '}
        <span className="font-semibold text-[#3A2118]">{totalPages}</span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg text-[#542F20] bg-[#F5EFE6] hover:bg-[#E8DCCB] disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </button>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg text-[#542F20] bg-[#F5EFE6] hover:bg-[#E8DCCB] disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          Next
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
