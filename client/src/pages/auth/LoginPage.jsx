import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Package, Loader2, Eye, EyeOff } from 'lucide-react';
import { loginUser } from '../../api/auth.api';
import { useAuthStore } from '../../store/authStore';

const schema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (values) => {
    setIsSubmitting(true);
    try {
      const res = await loginUser(values);
      setAuth(res.data.user, res.data.token);
      toast.success(`Welcome back, ${res.data.user.name.split(' ')[0]}!`);
      navigate(location.state?.from?.pathname || '/marketplace', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FBF8F3] px-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-[#542F20] flex items-center justify-center mb-3">
            <Package className="w-6 h-6 text-[#F5EFE6]" strokeWidth={2.2} />
          </div>
          <h1 className="font-serif text-2xl font-semibold text-[#3A2118]">Welcome back</h1>
          <p className="text-sm text-[#795548]/80 mt-1">Log in to your BorrowBox community</p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-white/60 border border-[#E8DCCB] rounded-2xl shadow-card p-6 sm:p-8 space-y-5"
        >
          <div>
            <label className="block text-sm font-medium text-[#542F20] mb-1.5">Email</label>
            <input
              type="email"
              autoComplete="email"
              {...register('email')}
              className="w-full px-3.5 py-2.5 rounded-lg border border-[#E8DCCB] bg-[#FBF8F3] text-[#2B211C] placeholder:text-[#795548]/40 text-sm"
              placeholder="you@example.com"
            />
            {errors.email && <p className="mt-1 text-xs text-[#A65D43]">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-[#542F20] mb-1.5">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                {...register('password')}
                className="w-full px-3.5 py-2.5 pr-10 rounded-lg border border-[#E8DCCB] bg-[#FBF8F3] text-[#2B211C] placeholder:text-[#795548]/40 text-sm"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#795548]/60 hover:text-[#542F20]"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && <p className="mt-1 text-xs text-[#A65D43]">{errors.password.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[#542F20] hover:bg-[#3A2118] text-white text-sm font-medium transition disabled:opacity-60"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {isSubmitting ? 'Logging in...' : 'Log in'}
          </button>
        </form>

        <p className="text-center text-sm text-[#795548]/80 mt-6">
          New to BorrowBox?{' '}
          <Link to="/register" className="font-medium text-[#542F20] hover:text-[#3A2118] underline underline-offset-2">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
