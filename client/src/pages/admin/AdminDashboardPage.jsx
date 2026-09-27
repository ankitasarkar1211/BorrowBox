import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Users, UserCheck, UserX, Package, ClipboardList, Handshake, PackageCheck, Star, Coins } from 'lucide-react';
import { getAdminStats } from '../../api/admin.api';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const STAT_CARDS = [
  { key: 'totalUsers', label: 'Total users', icon: Users },
  { key: 'activeUsers', label: 'Active users', icon: UserCheck },
  { key: 'inactiveUsers', label: 'Inactive users', icon: UserX },
  { key: 'totalItems', label: 'Total items', icon: Package },
  { key: 'totalBorrowRequests', label: 'Borrow requests', icon: ClipboardList },
  { key: 'activeLoans', label: 'Active loans', icon: Handshake },
  { key: 'returnedLoans', label: 'Returned loans', icon: PackageCheck },
  { key: 'totalReviews', label: 'Reviews', icon: Star },
  { key: 'totalCreditsInCirculation', label: 'Credits in circulation', icon: Coins },
];

export default function AdminDashboardPage() {
  const { data, isLoading } = useQuery({ queryKey: ['admin', 'stats'], queryFn: getAdminStats });
  const stats = data?.data;

  return (
    <div>
      <h1 className="font-serif text-2xl font-semibold text-[#3A2118] mb-1">Admin dashboard</h1>
      <p className="text-sm text-[#795548]/75 mb-6">Platform-wide statistics and moderation tools.</p>

      <div className="flex gap-3 mb-6">
        <Link to="/admin/users" className="px-4 py-2 rounded-lg border border-[#D4C2AB] hover:bg-[#F5EFE6] text-sm font-medium text-[#3A2118] transition">
          Manage users
        </Link>
        <Link to="/admin/items" className="px-4 py-2 rounded-lg border border-[#D4C2AB] hover:bg-[#F5EFE6] text-sm font-medium text-[#3A2118] transition">
          Moderate items
        </Link>
      </div>

      {isLoading ? (
        <LoadingSpinner text="Loading stats..." />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {STAT_CARDS.map((card) => (
            <div key={card.key} className="bg-white/60 border border-[#E8DCCB] rounded-xl p-4">
              <card.icon className="w-4 h-4 text-[#A47551] mb-2" />
              <p className="font-serif text-2xl font-semibold text-[#3A2118]">{stats?.[card.key] ?? '—'}</p>
              <p className="text-xs text-[#795548]/70 mt-0.5">{card.label}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
