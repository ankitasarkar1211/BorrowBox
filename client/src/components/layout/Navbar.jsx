import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Package, Menu, X, LayoutGrid, ClipboardList, Handshake, Coins,
  Star, ShieldCheck, LogOut, ChevronDown, Search,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { getInitials } from '../../lib/utils';
import NotificationBell from '../notifications/NotificationBell';
import AnimatedCounter from '../common/AnimatedCounter';
import CommandButton from '../kokonutui/command-button';

const NAV_LINKS = [
  { to: '/marketplace', label: 'Marketplace', icon: LayoutGrid },
  { to: '/requests/my', label: 'Requests', icon: ClipboardList },
  { to: '/loans/my', label: 'Loans', icon: Handshake },
  { to: '/credits', label: 'Credits', icon: Coins },
];

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const linkClass = ({ isActive }) =>
    `inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
      isActive
        ? 'bg-[#F5EFE6] text-[#3A2118] shadow-xs font-semibold'
        : 'text-[#542F20]/80 hover:text-[#3A2118] hover:bg-[#F5EFE6]/60'
    }`;

  return (
    <header className="sticky top-0 z-40 bg-[#FBF8F3]/95 backdrop-blur-md border-b border-[#E8DCCB]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link to="/marketplace" className="flex items-center gap-2.5 flex-shrink-0 group">
              <img
                src="/logo.png"
                alt="BorrowBox"
                className="w-8 h-8 sm:w-9 sm:h-9 object-contain rounded-lg group-hover:scale-105 transition-transform duration-200 drop-shadow-2xs"
              />
              <span className="font-serif text-lg font-bold text-[#3A2118]">BorrowBox</span>
            </Link>

            <nav className="hidden lg:flex items-center gap-1">
              {NAV_LINKS.map((link) => (
                <NavLink key={link.to} to={link.to} className={linkClass}>
                  <link.icon className="w-4 h-4" />
                  {link.label}
                </NavLink>
              ))}
              {user?.role === 'admin' && (
                <NavLink to="/admin" className={linkClass}>
                  <ShieldCheck className="w-4 h-4 text-[#A47551]" />
                  Admin
                </NavLink>
              )}
            </nav>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Quick search shortcut button using KokonutUI CommandButton */}
            <div className="hidden md:block">
              <CommandButton
                onClick={() => navigate('/marketplace')}
                className="h-9 py-1 px-2.5 bg-[#F5EFE6] border-[#E8DCCB] hover:border-[#D4C2AB] text-xs"
              >
                Find items
              </CommandButton>
            </div>

            {/* Credit Balance with Anime.js AnimatedCounter */}
            <Link
              to="/credits"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F5EFE6] border border-[#E8DCCB] text-[#542F20] text-sm font-semibold hover:bg-[#E8DCCB]/60 transition shadow-xs"
            >
              <Coins className="w-3.5 h-3.5 text-[#A47551]" />
              <AnimatedCounter value={user?.creditsBalance ?? 0} duration={800} />
            </Link>

            <NotificationBell />

            {/* User Dropdown */}
            <div className="relative hidden lg:block">
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-[#F5EFE6] transition"
              >
                <div className="w-8 h-8 rounded-full bg-[#A47551] text-white flex items-center justify-center text-xs font-semibold shadow-xs">
                  {getInitials(user?.name)}
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-[#795548]" />
              </button>

              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.98 }}
                    transition={{ duration: 0.16 }}
                    className="absolute right-0 mt-2 w-56 bg-[#FBF8F3] border border-[#E8DCCB] rounded-2xl shadow-modal overflow-hidden z-50"
                    onMouseLeave={() => setMenuOpen(false)}
                  >
                    <div className="px-4 py-3 border-b border-[#E8DCCB] bg-[#F5EFE6]/40">
                      <p className="text-sm font-semibold text-[#3A2118] truncate">{user?.name}</p>
                      <p className="text-xs text-[#795548]/80 truncate">{user?.email}</p>
                    </div>
                    <Link
                      to={`/users/${user?.id}`}
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-[#542F20] hover:bg-[#F5EFE6] transition"
                    >
                      <Star className="w-4 h-4 text-[#A47551]" /> My reputation
                    </Link>
                    <Link
                      to="/my-items"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-[#542F20] hover:bg-[#F5EFE6] transition"
                    >
                      <Package className="w-4 h-4 text-[#795548]" /> My items
                    </Link>
                    <Link
                      to="/requests/received"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-[#542F20] hover:bg-[#F5EFE6] transition"
                    >
                      <ClipboardList className="w-4 h-4 text-[#795548]" /> Received requests
                    </Link>
                    <Link
                      to="/loans/lending"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-[#542F20] hover:bg-[#F5EFE6] transition"
                    >
                      <Handshake className="w-4 h-4 text-[#795548]" /> Lending
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-[#A65D43] hover:bg-[#FBEBE8] transition border-t border-[#E8DCCB]"
                    >
                      <LogOut className="w-4 h-4" /> Log out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Mobile burger toggle */}
            <button
              onClick={() => setMobileOpen((o) => !o)}
              className="lg:hidden p-2 rounded-lg text-[#542F20] hover:bg-[#F5EFE6] transition"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden border-t border-[#E8DCCB] bg-[#FBF8F3] px-4 pt-3 pb-5 space-y-1 overflow-hidden"
          >
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-[#542F20] hover:bg-[#F5EFE6]"
              >
                <link.icon className="w-4 h-4" />
                {link.label}
              </NavLink>
            ))}
            {user?.role === 'admin' && (
              <NavLink
                to="/admin"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-[#542F20] hover:bg-[#F5EFE6]"
              >
                <ShieldCheck className="w-4 h-4 text-[#A47551]" />
                Admin
              </NavLink>
            )}
            <div className="pt-2 border-t border-[#E8DCCB]">
              <Link
                to={`/users/${user?.id}`}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-[#542F20] hover:bg-[#F5EFE6]"
              >
                <Star className="w-4 h-4" /> My reputation
              </Link>
              <Link
                to="/my-items"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-[#542F20] hover:bg-[#F5EFE6]"
              >
                <Package className="w-4 h-4" /> My items
              </Link>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#A65D43] hover:bg-[#FBEBE8]"
              >
                <LogOut className="w-4 h-4" /> Log out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
