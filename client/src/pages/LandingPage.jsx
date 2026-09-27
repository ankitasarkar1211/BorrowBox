import React from 'react';
import { Navigate, Link } from 'react-router-dom';
import { Package, ArrowRight, Recycle, Users, Coins } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import heroImage from '../assets/hero.png';

const FEATURES = [
  {
    icon: Recycle,
    title: 'Reuse over replacement',
    description: 'Borrow the drill, the tent, the textbook — instead of buying something you\'ll use twice.',
  },
  {
    icon: Users,
    title: 'Closed, trusted communities',
    description: 'BorrowBox is scoped to your own campus or building — you only ever share with people you know.',
  },
  {
    icon: Coins,
    title: 'Reciprocal Borrow Credits',
    description: 'Lend an item, earn credits. Borrow one, spend a few. No cash changes hands.',
  },
];

export default function LandingPage() {
  const { user, isInitialized } = useAuthStore();

  if (isInitialized && user) {
    return <Navigate to="/marketplace" replace />;
  }

  return (
    <div className="min-h-screen bg-[#FBF8F3]">
      <header className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-[#542F20] flex items-center justify-center">
            <Package className="w-5 h-5 text-[#F5EFE6]" strokeWidth={2.2} />
          </div>
          <span className="font-serif text-xl font-semibold text-[#3A2118]">BorrowBox</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="text-sm font-medium text-[#542F20] hover:text-[#3A2118] px-3 py-2">
            Log in
          </Link>
          <Link
            to="/register"
            className="text-sm font-medium text-white bg-[#542F20] hover:bg-[#3A2118] px-4 py-2 rounded-lg transition"
          >
            Get started
          </Link>
        </div>
      </header>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16 grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <p className="text-xs font-semibold tracking-widest uppercase text-[#A47551] mb-3">
            Responsible consumption, SDG 12
          </p>
          <h1 className="font-serif text-4xl sm:text-5xl font-semibold text-[#3A2118] leading-tight">
            Share what you have.
            <br />
            Borrow what you need.
          </h1>
          <p className="mt-5 text-base text-[#542F20]/85 leading-relaxed max-w-lg">
            BorrowBox turns the things sitting unused in your community into a shared resource —
            drills, tents, textbooks, cameras — access over ownership, for the things you only need
            once in a while.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#542F20] hover:bg-[#3A2118] text-white text-sm font-medium transition"
            >
              Create your account
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-[#D4C2AB] hover:bg-[#F5EFE6] text-[#3A2118] text-sm font-medium transition"
            >
              I already have an account
            </Link>
          </div>
        </div>

        <div className="relative">
          <div className="rounded-2xl overflow-hidden border border-[#E8DCCB] shadow-card bg-[#F5EFE6]">
            <img src={heroImage} alt="Community members sharing items" className="w-full h-auto object-cover" />
          </div>
        </div>
      </section>

      <section className="border-t border-[#E8DCCB] bg-white/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 grid sm:grid-cols-3 gap-8">
          {FEATURES.map((f) => (
            <div key={f.title}>
              <div className="w-11 h-11 rounded-full bg-[#E8DCCB]/70 flex items-center justify-center text-[#542F20] mb-4">
                <f.icon className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-lg font-semibold text-[#3A2118]">{f.title}</h3>
              <p className="mt-2 text-sm text-[#542F20]/75 leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="py-8 text-center text-xs text-[#795548]/60">
        BorrowBox — a community sharing platform for smarter consumption.
      </footer>
    </div>
  );
}
