import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isDevPlaceholderSupabase } from '../lib/supabase.js';
import { apiClient } from '../lib/apiClient.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isDevPlaceholderSupabase) {
      // In local demo mode, check local storage for demo user
      const stored = localStorage.getItem('wandershot_demo_user');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setUser(parsed);
          setSession({ access_token: `demo-user-${parsed.id}` });
          setProfile({ display_name: parsed.user_metadata?.display_name || 'Traveler', default_currency: 'INR' });
        } catch {
          // ignore
        }
      }
      setLoading(false);
      return;
    }

    // Live Supabase Auth
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(userId) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (!error && data) setProfile(data);
    } catch {
      // Profile table may not exist yet or failed
    }
  }

  async function login(email, password) {
    if (isDevPlaceholderSupabase) {
      const mockUser = {
        id: '00000000-0000-0000-0000-000000000001',
        email,
        user_metadata: { display_name: email.split('@')[0] },
      };
      localStorage.setItem('wandershot_demo_user', JSON.stringify(mockUser));
      localStorage.setItem('wandershot_demo_token', `demo-user-${mockUser.id}`);
      setUser(mockUser);
      setSession({ access_token: `demo-user-${mockUser.id}` });
      setProfile({ display_name: email.split('@')[0], default_currency: 'INR' });
      return { user: mockUser, error: null };
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      if (error.message?.toLowerCase().includes('invalid login credentials')) {
        throw new Error('Invalid email or password. Please check your credentials or create a new account.');
      }
      if (error.message?.toLowerCase().includes('email not confirmed')) {
        throw new Error('Email not yet confirmed. We have enabled instant signup; please sign up again or continue as guest.');
      }
      throw error;
    }
    setUser(data.user);
    setSession(data.session);
    await fetchProfile(data.user.id);
    return data;
  }

  async function signup(email, password, displayName) {
    if (isDevPlaceholderSupabase) {
      const mockUser = {
        id: '00000000-0000-0000-0000-000000000001',
        email,
        user_metadata: { display_name: displayName },
      };
      localStorage.setItem('wandershot_demo_user', JSON.stringify(mockUser));
      localStorage.setItem('wandershot_demo_token', `demo-user-${mockUser.id}`);
      setUser(mockUser);
      setSession({ access_token: `demo-user-${mockUser.id}` });
      setProfile({ display_name: displayName, default_currency: 'INR' });
      return { user: mockUser, error: null };
    }

    // Step 1: Call backend admin signup to create user with email_confirm: true
    // This completely prevents Supabase's email rate limit (3/hr on free tier)
    try {
      await apiClient.post('/auth/signup', {
        email,
        password,
        display_name: displayName,
      });
    } catch (apiErr) {
      if (
        apiErr.message?.toLowerCase().includes('already exists') ||
        apiErr.message?.toLowerCase().includes('already registered')
      ) {
        throw new Error('An account with this email already exists. Please log in.');
      }
      // If error is not a network failure, propagate it
      if (!apiErr.message?.includes('Failed to fetch') && !apiErr.message?.includes('NetworkError')) {
        throw apiErr;
      }
    }

    // Step 2: Automatically sign in with password to generate user session
    const { data: signinData, error: signinError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signinError) {
      // Fallback: try direct Supabase signUp if signInWithPassword failed
      const { data: supData, error: supErr } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: displayName },
        },
      });
      if (supErr) {
        if (supErr.message?.toLowerCase().includes('rate limit')) {
          throw new Error('Supabase email rate limit reached. Use "Explore as Guest" for instant access!');
        }
        throw supErr;
      }
      return supData;
    }

    setUser(signinData.user);
    setSession(signinData.session);
    await fetchProfile(signinData.user.id);
    return signinData;
  }

  async function loginAsGuest() {
    const guestUser = {
      id: '00000000-0000-0000-0000-000000000001',
      email: 'guest@wandershot.app',
      user_metadata: { display_name: 'Guest Explorer' },
    };
    localStorage.setItem('wandershot_demo_user', JSON.stringify(guestUser));
    localStorage.setItem('wandershot_demo_token', `demo-user-${guestUser.id}`);
    setUser(guestUser);
    setSession({ access_token: `demo-user-${guestUser.id}` });
    setProfile({ display_name: 'Guest Explorer', default_currency: 'INR' });
    return { user: guestUser };
  }

  async function logout() {
    localStorage.removeItem('wandershot_demo_user');
    localStorage.removeItem('wandershot_demo_token');

    if (!isDevPlaceholderSupabase) {
      try {
        await supabase.auth.signOut();
      } catch {
        // ignore
      }
    }

    setUser(null);
    setSession(null);
    setProfile(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        login,
        signup,
        loginAsGuest,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
export default AuthContext;
