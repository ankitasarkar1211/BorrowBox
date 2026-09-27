import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-[#FBF8F3] flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
      <footer className="border-t border-[#E8DCCB] py-6 text-center text-xs text-[#795548]/60">
        BorrowBox — Share what you have. Borrow what you need.
      </footer>
    </div>
  );
}
