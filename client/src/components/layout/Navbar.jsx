import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { Compass, PlusCircle, User, LogOut, Settings, Menu, X, Sparkles } from 'lucide-react';

export function Navbar() {
  const { user, profile, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    setUserDropdownOpen(false);
    navigate('/');
  };

  const displayName = profile?.display_name || user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'Traveler';

  return (
    <nav className="sticky top-0 z-40 bg-white/85 backdrop-blur-md border-b border-stone-200/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center space-x-2.5 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 via-coral-500 to-amber-400 flex items-center justify-center text-white shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform duration-200">
              <Compass className="w-5 h-5 stroke-[2.25]" />
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight text-stone-900 group-hover:text-brand-600 transition-colors">
                Wander<span className="text-coral-500">Shot</span>
              </span>
              <span className="hidden sm:inline-block ml-2 text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-200/60">
                AI Vision
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {isAuthenticated ? (
              <>
                <Link
                  to="/dashboard"
                  className={`text-sm font-semibold transition-colors ${
                    location.pathname === '/dashboard' ? 'text-coral-600' : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  My Trips
                </Link>
                <Link
                  to="/trips/new"
                  className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-coral-500 to-brand-600 hover:from-coral-600 hover:to-brand-700 shadow-sm shadow-coral-500/20 hover:shadow-md transition-all active:scale-[0.98]"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>New Trip</span>
                </Link>

                {/* User menu dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center space-x-2 p-1.5 rounded-xl hover:bg-stone-100 transition-colors focus:outline-none focus:ring-2 focus:ring-coral-500/50"
                    aria-expanded={userDropdownOpen}
                  >
                    <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-800 font-bold flex items-center justify-center text-xs uppercase border border-brand-200">
                      {displayName.charAt(0)}
                    </div>
                    <span className="text-sm font-medium text-stone-700 max-w-[120px] truncate">
                      {displayName}
                    </span>
                  </button>

                  {userDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-stone-100 py-2 animate-slide-up z-50">
                      <div className="px-4 py-2 border-b border-stone-100">
                        <p className="text-xs text-stone-400">Signed in as</p>
                        <p className="text-sm font-semibold text-stone-800 truncate">{user?.email || displayName}</p>
                      </div>
                      <Link
                        to="/settings"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center space-x-2.5 px-4 py-2 text-sm text-stone-700 hover:bg-stone-50 transition"
                      >
                        <Settings className="w-4 h-4 text-stone-400" />
                        <span>Settings</span>
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center space-x-2.5 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 transition text-left"
                      >
                        <LogOut className="w-4 h-4 text-rose-500" />
                        <span>Sign out</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to="/login"
                  className="text-sm font-semibold text-stone-700 hover:text-stone-900 transition-colors"
                >
                  Log in
                </Link>
                <Link
                  to="/signup"
                  className="px-4 py-2 text-sm font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded-xl transition shadow-sm"
                >
                  Sign up free
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition focus:outline-none"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-stone-200/80 bg-white/95 px-4 pt-3 pb-6 space-y-3 animate-slide-up">
          {isAuthenticated ? (
            <>
              <div className="pb-3 border-b border-stone-100 flex items-center space-x-3">
                <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-800 font-bold flex items-center justify-center text-sm">
                  {displayName.charAt(0)}
                </div>
                <div>
                  <div className="text-sm font-bold text-stone-900">{displayName}</div>
                  <div className="text-xs text-stone-500 truncate">{user?.email}</div>
                </div>
              </div>
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-base font-medium text-stone-800 hover:text-coral-600"
              >
                My Trips
              </Link>
              <Link
                to="/trips/new"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center space-x-2 w-full py-2.5 rounded-xl font-semibold text-white bg-coral-500"
              >
                <PlusCircle className="w-4 h-4" />
                <span>New Trip</span>
              </Link>
              <Link
                to="/settings"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-base font-medium text-stone-600"
              >
                Account Settings
              </Link>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full text-left py-2 text-base font-medium text-rose-600"
              >
                Sign out
              </button>
            </>
          ) : (
            <div className="space-y-3 pt-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center py-2.5 rounded-xl font-semibold text-stone-800 bg-stone-100"
              >
                Log in
              </Link>
              <Link
                to="/signup"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center py-2.5 rounded-xl font-semibold text-white bg-stone-900"
              >
                Sign up free
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}

export default Navbar;
