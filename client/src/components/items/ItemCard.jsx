import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Coins, MapPin, Tag, ShieldCheck } from 'lucide-react';
import StatusBadge from '../common/StatusBadge';
import { CATEGORIES, ITEM_CONDITIONS } from '../../lib/constants';

export default function ItemCard({ item }) {
  const categoryLabel = CATEGORIES.find((c) => c.value === item.category)?.label || item.category;
  const conditionLabel = ITEM_CONDITIONS.find((c) => c.value === item.condition)?.label || item.condition;
  const image = item.images?.[0];

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="h-full"
    >
      <Link
        to={`/items/${item.id}`}
        className="group flex flex-col h-full bg-white/70 backdrop-blur-xs border border-[#E8DCCB] rounded-2xl overflow-hidden hover:shadow-card hover:border-[#D4C2AB] transition-all duration-300"
      >
        <div className="relative aspect-[4/3] bg-[#F5EFE6] overflow-hidden flex items-center justify-center">
          {image ? (
            <img
              src={image}
              alt={item.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center gap-1 text-[#795548]/40">
              <span className="text-xs font-medium">No photo</span>
            </div>
          )}

          <div className="absolute top-2.5 right-2.5">
            <StatusBadge status={item.availabilityStatus} className="shadow-xs backdrop-blur-md" />
          </div>

          <div className="absolute bottom-2.5 left-2.5 px-2.5 py-1 rounded-full bg-[#3A2118]/80 backdrop-blur-md text-[#F5EFE6] text-xs font-semibold flex items-center gap-1 shadow-sm">
            <Coins className="w-3.5 h-3.5 text-amber-300" />
            {item.creditCost} {item.creditCost === 1 ? 'credit' : 'credits'}/day
          </div>
        </div>

        <div className="p-4 flex flex-col flex-1">
          <h3 className="font-serif text-base font-bold text-[#3A2118] leading-snug line-clamp-2 group-hover:text-[#542F20] transition-colors">
            {item.title}
          </h3>

          <div className="mt-1.5 flex items-center gap-2 text-xs text-[#795548]/80">
            <span className="font-medium text-[#542F20]">{categoryLabel}</span>
            <span>·</span>
            <span className="capitalize">{conditionLabel} condition</span>
          </div>

          {item.description && (
            <p className="mt-2 text-xs text-[#795548]/75 line-clamp-2 leading-relaxed">
              {item.description}
            </p>
          )}

          <div className="mt-auto pt-4 flex items-center justify-between border-t border-[#E8DCCB]/60 text-xs text-[#795548]/70">
            {item.owner?.name ? (
              <span className="flex items-center gap-1 truncate max-w-[150px]">
                <MapPin className="w-3 h-3 text-[#A47551]" /> {item.owner.name}
              </span>
            ) : (
              <span>Community member</span>
            )}

            {(item.rentalPricePerDay != null || item.purchasePrice != null) && (
              <span className="text-[11px] font-medium text-[#795548]/60 bg-[#F5EFE6] px-2 py-0.5 rounded-full">
                {item.rentalPricePerDay != null ? `Rent ₹${item.rentalPricePerDay}` : `Buy ₹${item.purchasePrice}`}
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
