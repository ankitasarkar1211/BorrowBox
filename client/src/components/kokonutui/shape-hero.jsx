"use client";

/**
 * @author: @dorianbaffier
 * @description: Shape Hero
 * @version: 1.0.0
 * @date: 2025-06-26
 * @license: MIT
 * @website: https://kokonutui.com
 * @github: https://github.com/kokonut-labs/kokonutui
 */

import { motion } from "motion/react";
import { cn } from "@/lib/utils";


function ElegantShape({
  className,
  delay = 0,
  width = 400,
  height = 100,
  rotate = 0,
  gradient = "from-white/[0.08]",
  borderRadius = 16
}) {
  return (
    <motion.div
      animate={{
        opacity: 1,
        y: 0,
        rotate,
      }}
      className={cn("absolute", className)}
      initial={{
        opacity: 0,
        y: -150,
        rotate: rotate - 15,
      }}
      transition={{
        duration: 2.4,
        delay,
        ease: [0.23, 0.86, 0.39, 0.96],
        opacity: { duration: 1.2 },
      }}
    >
      <motion.div
        animate={{
          y: [0, 15, 0],
        }}
        className="relative"
        style={{
          width,
          height,
        }}
        transition={{
          duration: 12,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
      >
        <div
          className={cn(
            "absolute inset-0",
            "bg-gradient-to-r to-transparent",
            gradient,
            "backdrop-blur-[1px]",
            "ring-1 ring-white/[0.03] dark:ring-white/[0.02]",
            "shadow-[0_2px_16px_-2px_rgba(255,255,255,0.04)]",
            "after:absolute after:inset-0",
            "after:bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.12),transparent_70%)]",
            "after:rounded-[inherit]"
          )}
          style={{ borderRadius }}
        />
      </motion.div>
    </motion.div>
  );
}

export default function ShapeHero({
  logo,
  badge = "Community Sharing Platform · SDG 12",
  title1 = "Share what you have.",
  title2 = "Borrow what you need.",
  subtitle = "Turn things sitting idle in your community into a shared circle of trust — access over ownership, powered by credits.",
  children,
  className,
}) {
  const fadeUpVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        delay: 0.2 + i * 0.12,
        ease: [0.25, 0.4, 0.25, 1],
      },
    }),
  };

  return (
    <div className={cn("relative flex w-full items-center justify-center overflow-hidden py-16 lg:py-24 bg-[#FBF8F3]", className)}>
      <div className="absolute inset-0 bg-gradient-to-br from-[#A47551]/[0.08] via-transparent to-[#542F20]/[0.06] blur-3xl pointer-events-none" />

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Tall rectangle - top left */}
        <ElegantShape
          borderRadius={24}
          className="top-[-8%] left-[-10%]"
          delay={0.2}
          gradient="from-[#795548]/[0.18]"
          height={380}
          rotate={-8}
          width={280}
        />

        {/* Wide rectangle - bottom right */}
        <ElegantShape
          borderRadius={20}
          className="right-[-12%] bottom-[-5%]"
          delay={0.4}
          gradient="from-[#A47551]/[0.18]"
          height={180}
          rotate={14}
          width={520}
        />

        {/* Square - middle left */}
        <ElegantShape
          borderRadius={32}
          className="top-[35%] left-[-4%]"
          delay={0.3}
          gradient="from-[#A65D43]/[0.16]"
          height={240}
          rotate={22}
          width={240}
        />

        {/* Small rectangle - top right */}
        <ElegantShape
          borderRadius={14}
          className="top-[8%] right-[8%]"
          delay={0.5}
          gradient="from-[#D4C2AB]/[0.35]"
          height={90}
          rotate={-18}
          width={220}
        />

        {/* Medium rectangle - center right */}
        <ElegantShape
          borderRadius={18}
          className="top-[50%] right-[-6%]"
          delay={0.6}
          gradient="from-[#795548]/[0.16]"
          height={130}
          rotate={32}
          width={340}
        />

        {/* Small square - bottom left */}
        <ElegantShape
          borderRadius={26}
          className="bottom-[8%] left-[16%]"
          delay={0.25}
          gradient="from-[#542F20]/[0.14]"
          height={160}
          rotate={-22}
          width={160}
        />
      </div>

      <div className="container relative z-10 mx-auto px-4 md:px-6">
        <div className="mx-auto max-w-4xl text-center">
          {logo && (
            <motion.div
              animate="visible"
              custom={0}
              initial="hidden"
              variants={fadeUpVariants}
              className="flex justify-center mb-6"
            >
              <div className="relative group">
                <div className="absolute -inset-2 rounded-3xl bg-gradient-to-r from-[#A47551]/20 via-[#A65D43]/20 to-[#795548]/20 blur-xl opacity-75 group-hover:opacity-100 transition duration-500" />
                <img
                  src={logo}
                  alt="BorrowBox Logo"
                  className="relative w-28 h-28 sm:w-32 sm:h-32 object-contain drop-shadow-md hover:scale-105 transition-transform duration-300"
                />
              </div>
            </motion.div>
          )}

          {badge && (
            <motion.div
              animate="visible"
              custom={logo ? 1 : 0}
              initial="hidden"
              variants={fadeUpVariants}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F5EFE6] border border-[#E8DCCB] text-[#795548] text-xs font-semibold tracking-wide uppercase mb-6 shadow-sm"
            >
              <span className="w-2 h-2 rounded-full bg-[#A65D43] animate-pulse" />
              {badge}
            </motion.div>
          )}

          <motion.div
            animate="visible"
            custom={1}
            initial="hidden"
            variants={fadeUpVariants}
          >
            <h1 className="mb-6 font-serif font-bold text-4xl tracking-tight sm:text-5xl md:text-6xl text-[#3A2118] leading-[1.12]">
              <span>{title1}</span>
              <br />
              <span className="bg-gradient-to-r from-[#795548] via-[#A65D43] to-[#A47551] bg-clip-text text-transparent italic font-serif">
                {title2}
              </span>
            </h1>
          </motion.div>

          {subtitle && (
            <motion.div
              animate="visible"
              custom={2}
              initial="hidden"
              variants={fadeUpVariants}
            >
              <p className="mx-auto mb-8 max-w-2xl px-4 text-base sm:text-lg text-[#542F20]/80 leading-relaxed font-sans">
                {subtitle}
              </p>
            </motion.div>
          )}

          {children && (
            <motion.div
              animate="visible"
              custom={3}
              initial="hidden"
              variants={fadeUpVariants}
            >
              {children}
            </motion.div>
          )}
        </div>
      </div>

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#FBF8F3] via-transparent to-[#FBF8F3]/60" />
    </div>
  );
}

