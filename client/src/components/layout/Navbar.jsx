import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  Package, Menu, X, LayoutGrid, ClipboardList, Handshake, Coins,
  Star, ShieldCheck, LogOut, ChevronDown,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { getInitials, formatCredits } from '../../lib/utils';
import NotificationBell from '../notifications/NotificationBell';

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
    `inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition ${
      isActive ? 'bg-[#F5EFE6] text-[#3A2118]' : 'text-[#542F20]/80 hover:text-[#3A2118] hover:bg-[#F5EFE6]/60'
    }`;

  return (
    <header className="sticky top-0 z-40 bg-[#FBF8F3]/95 backdrop-blur-sm border-b border-[#E8DCCB]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link to="/marketplace" className="flex items-center gap-2 flex-shrink-0">
              <div className="w-8 h-8 rounded-lg bg-[#542F20] flex items-center justify-center">
                <Package className="w-4.5 h-4.5 text-[#F5EFE6]" strokeWidth={2.2} />
              </div>
              <span className="font-serif text-lg font-semibold text-[#3A2118]">BorrowBox</span>
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
                  <ShieldCheck className="w-4 h-4" />
                  Admin
                </NavLink>
              )}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F5EFE6] text-[#542F20] text-sm font-medium">
              <Coins className="w-3.5 h-3.5 text-[#A47551]" />
              {user?.creditsBalance ?? 0}
            </div>

            <NotificationBell />

            <div className="relative hidden lg:block">
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-[#F5EFE6] transition"
              >
                <div className="w-8 h-8 rounded-full bg-[#A47551] text-white flex items-center justify-center text-xs font-semibold">
                  {getInitials(user?.name)}
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-[#795548]" />
              </button>
              {menuOpen && (
                <div
                  className="absolute right-0 mt-2 w-56 bg-[#FBF8F3] border border-[#E8DCCB] rounded-xl shadow-modal overflow-hidden"
                  onMouseLeave={() => setMenuOpen(false)}
                >
                  <div className="px-4 py-3 border-b border-[#E8DCCB]">
                    <p className="text-sm font-semibold text-[#3A2118] truncate">{user?.name}</p>
                    <p className="text-xs text-[#795548]/70 truncate">{user?.email}</p>
                  </div>
                  <Link
                    to={`/users/${user?.id}`}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-[#542F20] hover:bg-[#F5EFE6] transition"
                  >
                    <Star className="w-4 h-4" /> My reputation
                  </Link>
                  <Link
                    to="/my-items"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-[#542F20] hover:bg-[#F5EFE6] transition"
                  >
                    <Package className="w-4 h-4" /> My items
                  </Link>
                  <Link
                    to="/requests/received"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-[#542F20] hover:bg-[#F5EFE6] transition"
                  >
                    <ClipboardList className="w-4 h-4" /> Received requests
                  </Link>
                  <Link
                    to="/loans/lending"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-[#542F20] hover:bg-[#F5EFE6] transition"
                  >
                    <Handshake className="w-4 h-4" /> Lending
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-[#A65D43] hover:bg-[#FBEBE8] transition border-t border-[#E8DCCB]"
                  >
                    <LogOut className="w-4 h-4" /> Log out
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={() => setMobileOpen((o) => !o)}
              className="lg:hidden p-2 rounded-lg text-[#542F20] hover:bg-[#F5EFE6] transition"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="lg:hidden border-t border-[#E8DCCB] bg-[#FBF8F3] px-4 py-3 space-y-1">
          {[...NAV_LINKS,
            { to: '/my-items', label: 'My Items', icon: Package },
            { to: '/requests/received', label: 'Received Requests', icon: ClipboardList },
            { to: '/loans/lending', label: 'Lending', icon: Handshake },
            { to: '/reviews/my', label: 'My Reviews', icon: Star },
            ...(user?.role === 'admin' ? [{ to: '/admin', label: 'Admin', icon: ShieldCheck }] : []),
          ].map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={() => setMobileOpen(false)}
              className={linkClass}
            >
              <link.icon className="w-4 h-4" />
              {link.label}
            </NavLink>
          ))}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-[#A65D43] hover:bg-[#FBEBE8] transition"
          >
            <LogOut className="w-4 h-4" /> Log out
          </button>
        </div>
      )}
    </header>
  );
}
