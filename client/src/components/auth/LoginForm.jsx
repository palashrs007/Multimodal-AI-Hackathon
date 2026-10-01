import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { loginSchema } from '../../schemas/trip.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../hooks/useToast.jsx';
import { Mail, Lock, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';
import { Spinner } from '../shared/Spinner.jsx';

export function LoginForm() {
  const { login, loginAsGuest } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const toast = useToast();
  const [serverError, setServerError] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (values) => {
    try {
      setServerError(null);
      await login(values.email, values.password);
      toast.success('Welcome back!');
      const redirect = searchParams.get('redirect') || '/dashboard';
      navigate(redirect);
    } catch (err) {
      setServerError(err.message || 'Invalid email or password');
    }
  };

  const handleGuestLogin = async () => {
    await loginAsGuest();
    toast.success('Welcome! Exploring as Guest Traveler.');
    const redirect = searchParams.get('redirect') || '/dashboard';
    navigate(redirect);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {serverError && (
        <div className="flex items-center space-x-2 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{serverError}</span>
        </div>
      )}

      <div>
        <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
          Email address
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
            <Mail className="w-4 h-4" />
          </div>
          <input
            type="email"
            {...register('email')}
            placeholder="you@example.com"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 bg-white text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-coral-500/50 focus:border-coral-500 transition-colors"
          />
        </div>
        {errors.email && (
          <p className="text-xs text-rose-600 mt-1 font-medium">{errors.email.message}</p>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
            Password
          </label>
        </div>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
            <Lock className="w-4 h-4" />
          </div>
          <input
            type="password"
            {...register('password')}
            placeholder="••••••••"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 bg-white text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-coral-500/50 focus:border-coral-500 transition-colors"
          />
        </div>
        {errors.password && (
          <p className="text-xs text-rose-600 mt-1 font-medium">{errors.password.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-coral-500 to-brand-600 hover:from-coral-600 hover:to-brand-700 shadow-md shadow-coral-500/25 transition active:scale-[0.99] disabled:opacity-50"
      >
        {isSubmitting ? (
          <>
            <Spinner size="sm" />
            <span>Signing in...</span>
          </>
        ) : (
          <>
            <span>Sign in to WanderShot</span>
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>

      <div className="relative my-3">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-stone-200" />
        </div>
        <div className="relative flex justify-center text-[10px] uppercase">
          <span className="bg-white px-2 text-stone-400 font-bold">Or Instant Access</span>
        </div>
      </div>

      <button
        type="button"
        onClick={handleGuestLogin}
        className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl text-xs font-bold text-stone-700 bg-stone-100 hover:bg-stone-200 border border-stone-200 transition shadow-sm"
      >
        <Sparkles className="w-3.5 h-3.5 text-coral-500" />
        <span>Continue as Guest Traveler (1-Click)</span>
      </button>

      <p className="text-center text-xs text-stone-500 pt-2">
        Don&apos;t have an account?{' '}
        <Link to="/signup" className="font-semibold text-coral-600 hover:text-coral-700">
          Create one free
        </Link>
      </p>
    </form>
  );
}

export default LoginForm;
