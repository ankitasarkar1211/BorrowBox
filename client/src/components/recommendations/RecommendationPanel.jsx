import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Coins, ShoppingBag, CalendarClock, ChevronRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { getRecommendation } from '../../api/recommendations.api';
import AITextLoading from '../kokonutui/ai-text-loading';

const RECOMMENDATION_STYLES = {
  BORROW: {
    bg: 'bg-[#EBF3E8]',
    text: 'text-[#2E5A27]',
    border: 'border-[#CFE2CA]',
    badgeBg: 'bg-[#2E5A27]/10',
    icon: CalendarClock,
    title: 'Borrowing Recommended',
  },
  RENT: {
    bg: 'bg-[#FFF8E7]',
    text: 'text-[#946200]',
    border: 'border-[#FFE9B8]',
    badgeBg: 'bg-[#946200]/10',
    icon: Coins,
    title: 'Renting Recommended',
  },
  BUY: {
    bg: 'bg-[#FBEBE8]',
    text: 'text-[#A65D43]',
    border: 'border-[#F2D0C8]',
    badgeBg: 'bg-[#A65D43]/10',
    icon: ShoppingBag,
    title: 'Buying Recommended',
  },
};

export default function RecommendationPanel({ itemId }) {
  const [expectedDaysOfUse, setExpectedDaysOfUse] = useState(3);
  const [expectedUsesPerMonth, setExpectedUsesPerMonth] = useState(1);

  const mutation = useMutation({
    mutationFn: () =>
      getRecommendation({
        itemId,
        expectedDaysOfUse: Number(expectedDaysOfUse),
        expectedUsesPerMonth: Number(expectedUsesPerMonth),
      }),
  });

  const result = mutation.data?.data;
  const style = result ? RECOMMENDATION_STYLES[result.recommendation] || RECOMMENDATION_STYLES.BORROW : null;
  const Icon = style?.icon;

  return (
    <div className="bg-white/70 backdrop-blur-xs border border-[#E8DCCB] rounded-2xl p-5 shadow-xs">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg bg-[#F5EFE6] flex items-center justify-center text-[#A47551]">
          <Sparkles className="w-4 h-4" />
        </div>
        <div>
          <h3 className="font-serif text-base font-bold text-[#3A2118]">Borrow, Rent, or Buy?</h3>
          <p className="text-xs text-[#795548]/75">Rule-based decision support analyzing your frequency & cost.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label className="block text-xs font-semibold text-[#542F20] mb-1">Days per usage</label>
          <input
            type="number"
            min={1}
            max={30}
            value={expectedDaysOfUse}
            onChange={(e) => setExpectedDaysOfUse(Math.max(1, Number(e.target.value)))}
            className="w-full px-3 py-2 rounded-xl border border-[#E8DCCB] bg-[#FBF8F3] text-sm text-[#2B211C] focus:border-[#795548] transition"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-[#542F20] mb-1">Uses per month</label>
          <input
            type="number"
            min={0}
            max={31}
            value={expectedUsesPerMonth}
            onChange={(e) => setExpectedUsesPerMonth(Math.max(0, Number(e.target.value)))}
            className="w-full px-3 py-2 rounded-xl border border-[#E8DCCB] bg-[#FBF8F3] text-sm text-[#2B211C] focus:border-[#795548] transition"
          />
        </div>
      </div>

      <button
        onClick={() => mutation.mutate()}
        disabled={mutation.isPending}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-[#542F20] to-[#3A2118] hover:from-[#3A2118] hover:to-[#2B211C] text-white text-sm font-semibold shadow-xs hover:shadow transition disabled:opacity-60"
      >
        <Sparkles className="w-4 h-4" /> Calculate recommendation
      </button>

      {/* KokonutUI AI text loading indicator when pending */}
      {mutation.isPending && (
        <div className="py-4">
          <AITextLoading
            texts={[
              "Evaluating credit cost...",
              "Analyzing usage frequency...",
              "Checking purchase break-even...",
              "Formulating recommendation...",
            ]}
            className="text-base font-medium text-[#795548]"
            interval={1100}
          />
        </div>
      )}

      {mutation.isError && (
        <div className="mt-3 p-3 rounded-xl bg-[#FBEBE8] border border-[#F2D0C8] flex items-center gap-2 text-xs text-[#A65D43]">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{mutation.error?.response?.data?.message || 'Could not calculate recommendation.'}</span>
        </div>
      )}

      <AnimatePresence>
        {result && !mutation.isPending && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className={`mt-4 rounded-xl border p-4.5 ${style.bg} ${style.border}`}
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                {Icon && <Icon className={`w-4.5 h-4.5 ${style.text}`} />}
                <span className={`text-sm font-bold tracking-wide ${style.text}`}>{style.title}</span>
              </div>
              {!result.available && (
                <span className="text-[10px] uppercase font-semibold text-[#A65D43] bg-white/70 px-2 py-0.5 rounded-full">
                  Item in use
                </span>
              )}
            </div>

            <p className="text-sm text-[#3A2118]/90 leading-relaxed font-sans">{result.reason}</p>

            <div className="mt-3.5 grid grid-cols-3 gap-2 text-center">
              <div className="bg-white/80 rounded-xl p-2.5 border border-black/5 shadow-2xs">
                <p className="text-[10px] uppercase tracking-wider text-[#795548]/70 font-semibold">Borrow</p>
                <p className="text-sm font-bold text-[#3A2118] mt-0.5">{result.costComparison.borrowCost} credits</p>
                <p className="text-[10px] text-emerald-700 font-medium">₹0 cash</p>
              </div>
              <div className="bg-white/80 rounded-xl p-2.5 border border-black/5 shadow-2xs">
                <p className="text-[10px] uppercase tracking-wider text-[#795548]/70 font-semibold">Rent</p>
                <p className="text-sm font-bold text-[#3A2118] mt-0.5">
                  {result.costComparison.rentalCostPerUse != null ? `₹${result.costComparison.rentalCostPerUse}` : '—'}
                </p>
                <p className="text-[10px] text-[#795548]/60">per use</p>
              </div>
              <div className="bg-white/80 rounded-xl p-2.5 border border-black/5 shadow-2xs">
                <p className="text-[10px] uppercase tracking-wider text-[#795548]/70 font-semibold">Buy</p>
                <p className="text-sm font-bold text-[#3A2118] mt-0.5">
                  {result.costComparison.purchaseCost != null ? `₹${result.costComparison.purchaseCost}` : '—'}
                </p>
                <p className="text-[10px] text-[#795548]/60">outright</p>
              </div>
            </div>

            {result.factors?.length > 0 && (
              <details className="mt-3 text-xs text-[#542F20]/80">
                <summary className="font-semibold cursor-pointer text-[#795548] hover:text-[#3A2118] transition">
                  Logic factors considered ({result.factors.length})
                </summary>
                <ul className="mt-2 space-y-1 pl-4 list-disc text-[11px] leading-relaxed">
                  {result.factors.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              </details>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
