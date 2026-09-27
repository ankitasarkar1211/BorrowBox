import React from 'react';

export default function StatusTabs({ options, value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2 mb-5">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`px-3.5 py-1.5 rounded-full text-sm font-medium border transition ${
            value === opt.value
              ? 'bg-[#542F20] text-white border-[#542F20]'
              : 'bg-white/60 text-[#542F20]/80 border-[#E8DCCB] hover:bg-[#F5EFE6]'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
