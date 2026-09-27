import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';

import ProtectedRoute from './components/layout/ProtectedRoute';
import AdminRoute from './components/layout/AdminRoute';
import AppLayout from './components/layout/AppLayout';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import NotFoundPage from './pages/NotFoundPage';

import MarketplacePage from './pages/marketplace/MarketplacePage';
import ItemDetailPage from './pages/marketplace/ItemDetailPage';
import ItemFormPage from './pages/marketplace/ItemFormPage';
import MyItemsPage from './pages/marketplace/MyItemsPage';

import MyRequestsPage from './pages/borrowing/MyRequestsPage';
import ReceivedRequestsPage from './pages/borrowing/ReceivedRequestsPage';
import RequestDetailPage from './pages/borrowing/RequestDetailPage';

import MyLoansPage from './pages/loans/MyLoansPage';
import LendingLoansPage from './pages/loans/LendingLoansPage';
import LoanDetailPage from './pages/loans/LoanDetailPage';

import CreditsPage from './pages/credits/CreditsPage';

import MyReviewsPage from './pages/reviews/MyReviewsPage';
import UserProfilePage from './pages/reviews/UserProfilePage';

import NotificationsPage from './pages/notifications/NotificationsPage';

import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminUserDetailPage from './pages/admin/AdminUserDetailPage';
import AdminItemsPage from './pages/admin/AdminItemsPage';

export default function App() {
  const checkAuth = useAuthStore((s) => s.checkAuth);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Authenticated */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/marketplace" element={<MarketplacePage />} />
          <Route path="/items/new" element={<ItemFormPage />} />
          <Route path="/items/:id/edit" element={<ItemFormPage />} />
          <Route path="/items/:id" element={<ItemDetailPage />} />
          <Route path="/my-items" element={<MyItemsPage />} />

          <Route path="/requests/my" element={<MyRequestsPage />} />
          <Route path="/requests/received" element={<ReceivedRequestsPage />} />
          <Route path="/requests/:id" element={<RequestDetailPage />} />

          <Route path="/loans/my" element={<MyLoansPage />} />
          <Route path="/loans/lending" element={<LendingLoansPage />} />
          <Route path="/loans/:id" element={<LoanDetailPage />} />

          <Route path="/credits" element={<CreditsPage />} />

          <Route path="/reviews/my" element={<MyReviewsPage />} />
          <Route path="/users/:id" element={<UserProfilePage />} />

          <Route path="/notifications" element={<NotificationsPage />} />

          {/* Admin only */}
          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<AdminDashboardPage />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />
            <Route path="/admin/users/:id" element={<AdminUserDetailPage />} />
            <Route path="/admin/items" element={<AdminItemsPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="/404" element={<NotFoundPage />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  );
}
