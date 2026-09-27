import React from 'react';
import { Link } from 'react-router-dom';
import { Coins, MapPin } from 'lucide-react';
import StatusBadge from '../common/StatusBadge';
import { CATEGORIES, ITEM_CONDITIONS } from '../../lib/constants';

export default function ItemCard({ item }) {
  const categoryLabel = CATEGORIES.find((c) => c.value === item.category)?.label || item.category;
  const conditionLabel = ITEM_CONDITIONS.find((c) => c.value === item.condition)?.label || item.condition;
  const image = item.images?.[0];

  return (
    <Link
      to={`/items/${item.id}`}
      className="group flex flex-col bg-white/60 border border-[#E8DCCB] rounded-xl overflow-hidden hover:shadow-card hover:border-[#D4C2AB] transition"
    >
      <div className="aspect-[4/3] bg-[#F5EFE6] overflow-hidden flex items-center justify-center">
        {image ? (
          <img
            src={image}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-[1.03] transition duration-300"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        ) : (
          <span className="text-xs text-[#795548]/50 font-medium">No image</span>
        )}
      </div>
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-serif text-base font-semibold text-[#3A2118] leading-snug line-clamp-2">
            {item.title}
          </h3>
          <StatusBadge status={item.availabilityStatus} className="flex-shrink-0" />
        </div>
        <p className="mt-1 text-xs text-[#795548]/70">
          {categoryLabel} · {conditionLabel}
        </p>
        {item.owner?.name && (
          <p className="mt-2 flex items-center gap-1 text-xs text-[#795548]/60">
            <MapPin className="w-3 h-3" /> Listed by {item.owner.name}
          </p>
        )}
        <div className="mt-auto pt-3 flex items-center gap-1.5 text-sm font-semibold text-[#542F20]">
          <Coins className="w-4 h-4 text-[#A47551]" />
          {item.creditCost} {item.creditCost === 1 ? 'credit' : 'credits'}/day
        </div>
      </div>
    </Link>
  );
}
