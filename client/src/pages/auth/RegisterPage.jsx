import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Package, Loader2, Eye, EyeOff } from 'lucide-react';
import { registerUser } from '../../api/auth.api';
import { useAuthStore } from '../../store/authStore';

const schema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters'),
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  communityId: z.string().trim().min(1, 'Community is required'),
});

export default function RegisterPage() {
  const navigate = useNavigate();
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
      const res = await registerUser(values);
      setAuth(res.data.user, res.data.token);
      toast.success(`Welcome to BorrowBox, ${res.data.user.name.split(' ')[0]}!`);
      navigate('/marketplace', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FBF8F3] px-4 py-10">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-[#542F20] flex items-center justify-center mb-3">
            <Package className="w-6 h-6 text-[#F5EFE6]" strokeWidth={2.2} />
          </div>
          <h1 className="font-serif text-2xl font-semibold text-[#3A2118]">Join your community</h1>
          <p className="text-sm text-[#795548]/80 mt-1 text-center">
            Start sharing and borrowing — you'll receive a welcome bonus of Borrow Credits.
          </p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-white/60 border border-[#E8DCCB] rounded-2xl shadow-card p-6 sm:p-8 space-y-5"
        >
          <div>
            <label className="block text-sm font-medium text-[#542F20] mb-1.5">Full name</label>
            <input
              {...register('name')}
              className="w-full px-3.5 py-2.5 rounded-lg border border-[#E8DCCB] bg-[#FBF8F3] text-[#2B211C] placeholder:text-[#795548]/40 text-sm"
              placeholder="Ankita Sarkar"
            />
            {errors.name && <p className="mt-1 text-xs text-[#A65D43]">{errors.name.message}</p>}
          </div>

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
            <label className="block text-sm font-medium text-[#542F20] mb-1.5">
              Community ID
              <span className="font-normal text-[#795548]/60"> — e.g. your campus or building code</span>
            </label>
            <input
              {...register('communityId')}
              className="w-full px-3.5 py-2.5 rounded-lg border border-[#E8DCCB] bg-[#FBF8F3] text-[#2B211C] placeholder:text-[#795548]/40 text-sm"
              placeholder="IEM-KOLKATA"
            />
            {errors.communityId && <p className="mt-1 text-xs text-[#A65D43]">{errors.communityId.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-[#542F20] mb-1.5">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                {...register('password')}
                className="w-full px-3.5 py-2.5 pr-10 rounded-lg border border-[#E8DCCB] bg-[#FBF8F3] text-[#2B211C] placeholder:text-[#795548]/40 text-sm"
                placeholder="At least 8 characters"
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
            {isSubmitting ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="text-center text-sm text-[#795548]/80 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-[#542F20] hover:text-[#3A2118] underline underline-offset-2">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
