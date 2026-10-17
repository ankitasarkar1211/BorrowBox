import React, { useState } from "react";
import { ArrowRight, Repeat2, Sparkles, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function CardFlip({
  title = "Design Systems",
  subtitle = "Explore the fundamentals",
  description = "Dive deep into the world of modern UI/UX design.",
  features = ["Circular Sharing", "Verified Quality", "Local Trust", "Zero Waste"],
  icon: IconComponent = Repeat2,
  actionLabel = "Learn more",
  onAction,
  className = "",
}) {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div
      className={cn(
        "group relative h-[360px] w-full min-w-[280px] sm:min-w-[300px] max-w-[340px] cursor-pointer select-none",
        className
      )}
      style={{ perspective: "1400px" }}
      onMouseEnter={() => setIsFlipped(true)}
      onMouseLeave={() => setIsFlipped(false)}
      onClick={() => setIsFlipped((prev) => !prev)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setIsFlipped((prev) => !prev);
        }
      }}
      aria-label={`${title} - click to flip`}
    >
      <div
        className={cn(
          "relative h-full w-full rounded-2xl transition-transform duration-500 ease-out",
          isFlipped ? "[transform:rotateY(180deg)]" : "[transform:rotateY(0deg)]"
        )}
        style={{
          transformStyle: "preserve-3d",
          WebkitTransformStyle: "preserve-3d",
        }}
      >
        {/* FRONT FACE */}
        <div
          className={cn(
            "absolute inset-0 h-full w-full rounded-2xl p-6 flex flex-col justify-between",
            "bg-gradient-to-b from-white/90 via-[#FDFBF7] to-[#F5EFE6]/90",
            "border border-[#E8DCCB] shadow-card hover:border-[#D4C2AB] hover:shadow-modal transition-all duration-300",
            "overflow-hidden"
          )}
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(0deg)",
          }}
        >
          {/* Subtle decorative background glow */}
          <div className="absolute -top-16 -right-16 w-36 h-36 rounded-full bg-gradient-to-br from-[#A47551]/15 to-[#A65D43]/10 blur-2xl pointer-events-none" />

          {/* Top Row: Icon + Badge */}
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-xl bg-[#F5EFE6] border border-[#E8DCCB] flex items-center justify-center text-[#A47551] shadow-xs group-hover:scale-105 transition-transform duration-300">
              <IconComponent className="w-6 h-6" />
            </div>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#E8DCCB]/60 text-[#542F20] text-xs font-semibold tracking-wide">
              <Sparkles className="w-3 h-3 text-[#A47551]" />
              {subtitle}
            </span>
          </div>

          {/* Middle: Title & Description Preview */}
          <div className="my-auto py-4 space-y-2.5">
            <h3 className="font-serif text-2xl font-bold text-[#3A2118] leading-tight">
              {title}
            </h3>
            <p className="text-sm text-[#542F20]/80 leading-relaxed line-clamp-3">
              {description}
            </p>
          </div>

          {/* Bottom Prompt: Flip indicator */}
          <div className="pt-3 border-t border-[#E8DCCB]/80 flex items-center justify-between text-xs text-[#795548]/75">
            <span className="font-medium">Hover or tap to reveal</span>
            <span className="inline-flex items-center gap-1 font-semibold text-[#A47551] group-hover:translate-x-0.5 transition-transform">
              Flip <Repeat2 className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>

        {/* BACK FACE */}
        <div
          className={cn(
            "absolute inset-0 h-full w-full rounded-2xl p-6 flex flex-col justify-between",
            "bg-gradient-to-b from-[#FAF5EE] via-[#F8F2E8] to-[#F5EFE6]",
            "border border-[#D4C2AB] shadow-modal transition-all duration-300",
            "overflow-hidden"
          )}
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          {/* Header */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#A47551]">
                Key Highlights
              </span>
              <Repeat2 className="w-3.5 h-3.5 text-[#795548]/60" />
            </div>
            <h4 className="font-serif text-lg font-bold text-[#3A2118] leading-snug">
              {title}
            </h4>
            <p className="mt-1 text-xs text-[#542F20]/75 line-clamp-2">
              {description}
            </p>
          </div>

          {/* Features List */}
          <div className="space-y-2.5 my-auto py-2">
            {features.map((feature, i) => (
              <div
                key={feature}
                className="flex items-center gap-2.5 text-xs font-medium text-[#3A2118]"
                style={{
                  transitionDelay: `${i * 40}ms`,
                }}
              >
                <div className="w-4 h-4 rounded-full bg-[#EBF3E8] border border-[#CFE2CA] flex items-center justify-center flex-shrink-0 text-[#2E5A27]">
                  <CheckCircle2 className="w-3 h-3" />
                </div>
                <span className="leading-tight">{feature}</span>
              </div>
            ))}
          </div>

          {/* Action Button */}
          <div className="pt-3 border-t border-[#E8DCCB]">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (onAction) onAction();
              }}
              className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#542F20] to-[#3A2118] hover:from-[#3A2118] hover:to-[#2B211C] text-white text-xs font-semibold shadow-xs hover:shadow transition-all group/btn"
            >
              <span>{actionLabel}</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
