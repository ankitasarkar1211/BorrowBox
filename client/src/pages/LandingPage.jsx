import React from 'react';
import { Navigate, Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Package, ArrowRight, Recycle, Users, Coins, Sparkles,
  ShieldCheck, HeartHandshake, CheckCircle2,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import ShapeHero from '../components/kokonutui/shape-hero';
import CardFlip from '../components/kokonutui/card-flip';
import ShimmerText from '../components/kokonutui/shimmer-text';
import AnimatedCounter from '../components/common/AnimatedCounter';

const COMMUNITY_PILLARS = [
  {
    title: 'Circular Reuse',
    subtitle: 'SDG 12 in Action',
    icon: Recycle,
    description: 'Drills, cameras, camping tents, and textbooks — borrow instead of buying single-use clutter.',
    features: ['Zero landfill waste', 'Verified item condition', 'Community shared access', 'Save money & space'],
    actionLabel: 'Explore items',
  },
  {
    title: 'Reciprocal Credits',
    subtitle: 'No Cash Exchanged',
    icon: Coins,
    description: 'Earn credits when you lend your items. Spend credits to borrow what you need anytime.',
    features: ['+5 credits on signup', 'Daily credit rates', 'Automated escrow ledger', 'Lender reward bonus'],
    actionLabel: 'How credits work',
  },
  {
    title: 'Trusted Community',
    subtitle: 'Campus & Neighborhood',
    icon: Users,
    description: 'Strict community isolation ensures you only share with peers and colleagues you know.',
    features: ['Single community scope', 'Transparent peer reviews', 'Verified borrower profiles', 'Due-date reminders'],
    actionLabel: 'Join your group',
  },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const { user, isInitialized } = useAuthStore();

  if (isInitialized && user) {
    return <Navigate to="/marketplace" replace />;
  }

  return (
    <div className="min-h-screen bg-[#FBF8F3] text-[#2B211C] selection:bg-[#E8DCCB] selection:text-[#3A2118]">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 bg-[#FBF8F3]/90 backdrop-blur-md border-b border-[#E8DCCB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <img
              src="/logo.png"
              alt="BorrowBox"
              className="w-9 h-9 object-contain rounded-xl group-hover:scale-105 transition-transform duration-200 drop-shadow-2xs"
            />
            <span className="font-serif text-xl font-bold tracking-tight text-[#3A2118]">BorrowBox</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-sm font-medium text-[#542F20] hover:text-[#3A2118] px-3.5 py-2 rounded-lg hover:bg-[#F5EFE6] transition"
            >
              Log in
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-white bg-gradient-to-r from-[#542F20] to-[#3A2118] hover:from-[#3A2118] hover:to-[#2B211C] px-4 py-2 rounded-xl shadow-sm transition-all hover:shadow hover:scale-[1.02] active:scale-[0.98]"
            >
              Get started
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* KokonutUI Shape Hero */}
      <ShapeHero
        logo="/logo.png"
        badge="Community Sharing Platform · SDG 12 Responsible Consumption"
        title1="Share what you have."
        title2="Borrow what you need."
        subtitle="BorrowBox transforms idle items across your campus or housing community into an active pool of shared resources — access over ownership, powered by reciprocal credits."
      >
        <div className="flex flex-wrap items-center justify-center gap-3.5 pt-2">
          <Link
            to="/register"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-[#542F20] to-[#3A2118] text-white text-sm font-semibold shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            Create free account
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl border border-[#D4C2AB] bg-white/70 hover:bg-[#F5EFE6] text-[#3A2118] text-sm font-semibold shadow-xs hover:border-[#A47551] transition-all"
          >
            Sign in with existing account
          </Link>
        </div>
      </ShapeHero>

      {/* Live Animated Impact Counter */}
      <section className="border-y border-[#E8DCCB] bg-gradient-to-b from-[#F5EFE6]/70 to-[#FBF8F3]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="p-4 rounded-xl bg-white/50 border border-[#E8DCCB]/60">
            <p className="font-serif text-3xl sm:text-4xl font-bold text-[#3A2118]">
              <AnimatedCounter value={5} suffix=" Free" duration={900} />
            </p>
            <p className="text-xs uppercase tracking-wider font-medium text-[#795548] mt-1">Starting Credits</p>
          </div>
          <div className="p-4 rounded-xl bg-white/50 border border-[#E8DCCB]/60">
            <p className="font-serif text-3xl sm:text-4xl font-bold text-[#3A2118]">
              <AnimatedCounter value={100} suffix="%" duration={1100} />
            </p>
            <p className="text-xs uppercase tracking-wider font-medium text-[#795548] mt-1">Cashless Sharing</p>
          </div>
          <div className="p-4 rounded-xl bg-white/50 border border-[#E8DCCB]/60">
            <p className="font-serif text-3xl sm:text-4xl font-bold text-[#3A2118]">
              <AnimatedCounter value={30} suffix=" Days" duration={1000} />
            </p>
            <p className="text-xs uppercase tracking-wider font-medium text-[#795548] mt-1">Max Loan Term</p>
          </div>
          <div className="p-4 rounded-xl bg-white/50 border border-[#E8DCCB]/60">
            <p className="font-serif text-3xl sm:text-4xl font-bold text-[#3A2118]">
              <AnimatedCounter value={12} suffix=" SDG" duration={1200} />
            </p>
            <p className="text-xs uppercase tracking-wider font-medium text-[#795548] mt-1">Circular Goal</p>
          </div>
        </div>
      </section>

      {/* KokonutUI Interactive 3D CardFlip Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E8DCCB]/60 text-[#542F20] text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-[#A47551]" />
            Hover to flip cards
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#3A2118]">
            Designed for seamless community sharing
          </h2>
          <p className="mt-3 text-base text-[#542F20]/75">
            Everything you need to lend with confidence and borrow with ease. Flip through the core guarantees below.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 justify-items-center">
          {COMMUNITY_PILLARS.map((pillar, idx) => (
            <motion.div
              key={pillar.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.15, duration: 0.5 }}
              className="w-full max-w-[340px] flex justify-center"
            >
              <CardFlip
                title={pillar.title}
                subtitle={pillar.subtitle}
                icon={pillar.icon}
                description={pillar.description}
                features={pillar.features}
                actionLabel={pillar.actionLabel}
                onAction={() => navigate('/register')}
              />
            </motion.div>
          ))}
        </div>
      </section>

      {/* Smart Borrow vs Rent vs Buy Engine Showcase */}
      <section className="bg-gradient-to-br from-[#3A2118] via-[#542F20] to-[#2B211C] text-[#F5EFE6] py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/10 text-[#E8DCCB] text-xs font-semibold mb-4 backdrop-blur-sm">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              Intelligent Decision Support
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold leading-tight text-white">
              Not sure whether to borrow, rent, or buy?
            </h2>
            <p className="mt-4 text-[#E8DCCB]/85 text-base leading-relaxed">
              BorrowBox includes a built-in recommendation algorithm. Just tell us how many days you need the item and how often, and we calculate the break-even math comparing community credits against market costs.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-[#F5EFE6]/90">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>Zero real-cash expenditure when borrowing with credits</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>Automatic 3-month purchase break-even threshold analysis</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>Real-time availability status checks & alternative advice</span>
              </li>
            </ul>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
              <span className="text-xs uppercase tracking-wider text-[#E8DCCB] font-semibold">Live Algorithm Output</span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-medium">Recommended: BORROW</span>
            </div>
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
                <p className="text-xs text-[#E8DCCB]/70">Scenario</p>
                <p className="text-sm font-semibold text-white mt-0.5">Cordless Power Drill (3 days, 1 use/month)</p>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30">
                  <p className="text-[#E8DCCB]/70">Borrow</p>
                  <p className="text-base font-bold text-emerald-300 mt-1">6 Credits</p>
                  <p className="text-[10px] text-emerald-300/80 mt-0.5">(₹0 Money)</p>
                </div>
                <div className="p-2.5 rounded-lg bg-white/5 border border-white/10">
                  <p className="text-[#E8DCCB]/70">Rent</p>
                  <p className="text-base font-bold text-white mt-1">₹450</p>
                  <p className="text-[10px] text-[#E8DCCB]/60 mt-0.5">(₹150/day)</p>
                </div>
                <div className="p-2.5 rounded-lg bg-white/5 border border-white/10">
                  <p className="text-[#E8DCCB]/70">Buy</p>
                  <p className="text-base font-bold text-white mt-1">₹3,499</p>
                  <p className="text-[10px] text-[#E8DCCB]/60 mt-0.5">One-time</p>
                </div>
              </div>
              <p className="text-xs text-[#E8DCCB]/80 italic pt-2">
                "Borrowing saves money and prevents buying a tool you only need occasionally."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action & Footer */}
      <section className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h2 className="font-serif text-3xl font-semibold text-[#3A2118]">
          Ready to start sharing in your community?
        </h2>
        <p className="mt-3 text-sm text-[#795548] max-w-lg mx-auto">
          Sign up today to get 5 free starting credits. List an item to earn even more credits.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link
            to="/register"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#542F20] hover:bg-[#3A2118] text-white text-sm font-medium transition shadow-sm"
          >
            Join BorrowBox now
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-[#E8DCCB] py-8 text-center text-xs text-[#795548]/70 bg-white/30">
        <p>BorrowBox — Responsible consumption, SDG 12. Built for closed, trusted communities.</p>
      </footer>
    </div>
  );
}
