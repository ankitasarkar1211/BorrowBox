import React from 'react';
import { Star } from 'lucide-react';

export default function StarRating({ value = 0, onChange, size = 'default', readOnly = false }) {
  const sizeClass = size === 'small' ? 'w-3.5 h-3.5' : size === 'large' ? 'w-7 h-7' : 'w-5 h-5';

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readOnly}
          onClick={() => onChange?.(star)}
          className={readOnly ? 'cursor-default' : 'cursor-pointer'}
          aria-label={`${star} star${star !== 1 ? 's' : ''}`}
        >
          <Star
            className={`${sizeClass} transition ${
              star <= value ? 'fill-[#A47551] text-[#A47551]' : 'fill-transparent text-[#D4C2AB]'
            }`}
          />
        </button>
      ))}
    </div>
  );
}
