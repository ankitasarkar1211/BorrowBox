import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import Navbar from './Navbar';

export default function AppLayout() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-[#FBF8F3] flex flex-col text-[#2B211C]">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
      <footer className="border-t border-[#E8DCCB] py-6 text-center text-xs text-[#795548]/70 bg-white/30">
        BorrowBox — Share what you have. Borrow what you need. Responsible consumption (SDG 12).
      </footer>
    </div>
  );
}
