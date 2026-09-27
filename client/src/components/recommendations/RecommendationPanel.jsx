import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Sparkles, Coins, ShoppingBag, CalendarClock, Loader2 } from 'lucide-react';
import { getRecommendation } from '../../api/recommendations.api';

const RECOMMENDATION_STYLES = {
  BORROW: { bg: 'bg-[#EBF3E8]', text: 'text-[#2E5A27]', border: 'border-[#CFE2CA]', icon: CalendarClock },
  RENT: { bg: 'bg-[#FFF8E7]', text: 'text-[#946200]', border: 'border-[#FFE9B8]', icon: Coins },
  BUY: { bg: 'bg-[#FBEBE8]', text: 'text-[#A65D43]', border: 'border-[#F2D0C8]', icon: ShoppingBag },
};

export default function RecommendationPanel({ itemId }) {
  const [expectedDaysOfUse, setExpectedDaysOfUse] = useState(3);
  const [expectedUsesPerMonth, setExpectedUsesPerMonth] = useState(1);

  const mutation = useMutation({
    mutationFn: () => getRecommendation({ itemId, expectedDaysOfUse: Number(expectedDaysOfUse), expectedUsesPerMonth: Number(expectedUsesPerMonth) }),
  });

  const result = mutation.data?.data;
  const style = result ? RECOMMENDATION_STYLES[result.recommendation] || RECOMMENDATION_STYLES.BORROW : null;
  const Icon = style?.icon;

  return (
    <div className="bg-white/60 border border-[#E8DCCB] rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-4 h-4 text-[#A47551]" />
        <h3 className="font-serif text-base font-semibold text-[#3A2118]">Should you borrow, rent, or buy?</h3>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label className="block text-xs font-medium text-[#542F20] mb-1">Days per use</label>
          <input
            type="number"
            min={1}
            value={expectedDaysOfUse}
            onChange={(e) => setExpectedDaysOfUse(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-[#E8DCCB] bg-[#FBF8F3] text-sm text-[#2B211C]"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#542F20] mb-1">Uses per month</label>
          <input
            type="number"
            min={0}
            value={expectedUsesPerMonth}
            onChange={(e) => setExpectedUsesPerMonth(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-[#E8DCCB] bg-[#FBF8F3] text-sm text-[#2B211C]"
          />
        </div>
      </div>

      <button
        onClick={() => mutation.mutate()}
        disabled={mutation.isPending}
        className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-[#F5EFE6] hover:bg-[#E8DCCB] text-[#542F20] text-sm font-medium transition disabled:opacity-60"
      >
        {mutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
        Get a recommendation
      </button>

      {mutation.isError && (
        <p className="mt-3 text-xs text-[#A65D43]">
          {mutation.error?.response?.data?.message || 'Could not generate a recommendation.'}
        </p>
      )}

      {result && (
        <div className={`mt-4 rounded-lg border p-4 ${style.bg} ${style.border}`}>
          <div className="flex items-center gap-2 mb-1.5">
            {Icon && <Icon className={`w-4 h-4 ${style.text}`} />}
            <span className={`text-sm font-bold tracking-wide ${style.text}`}>{result.recommendation}</span>
            {!result.available && (
              <span className="text-[10px] uppercase font-semibold text-[#795548]/60 ml-auto">Currently unavailable</span>
            )}
          </div>
          <p className="text-sm text-[#3A2118]/90 leading-relaxed">{result.reason}</p>

          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            <div className="bg-white/60 rounded-lg py-2">
              <p className="text-[10px] uppercase text-[#795548]/60 font-medium">Borrow</p>
              <p className="text-sm font-semibold text-[#3A2118]">{result.costComparison.borrowCost} cr</p>
            </div>
            <div className="bg-white/60 rounded-lg py-2">
              <p className="text-[10px] uppercase text-[#795548]/60 font-medium">Rent</p>
              <p className="text-sm font-semibold text-[#3A2118]">
                {result.costComparison.rentalCostPerUse != null ? `₹${result.costComparison.rentalCostPerUse}` : '—'}
              </p>
            </div>
            <div className="bg-white/60 rounded-lg py-2">
              <p className="text-[10px] uppercase text-[#795548]/60 font-medium">Buy</p>
              <p className="text-sm font-semibold text-[#3A2118]">
                {result.costComparison.purchaseCost != null ? `₹${result.costComparison.purchaseCost}` : '—'}
              </p>
            </div>
          </div>

          {result.factors?.length > 0 && (
            <details className="mt-3">
              <summary className="text-xs font-medium text-[#795548] cursor-pointer">Why this recommendation?</summary>
              <ul className="mt-2 space-y-1 text-xs text-[#542F20]/80 list-disc list-inside">
                {result.factors.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}
    </div>
  );
}
