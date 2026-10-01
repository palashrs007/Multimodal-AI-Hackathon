import React from 'react';
import { AuthLayout } from '../components/auth/AuthLayout.jsx';
import { LoginForm } from '../components/auth/LoginForm.jsx';

export function LoginPage() {
  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to view your trips, edit itineraries, and review saved screenshots."
    >
      <LoginForm />
    </AuthLayout>
  );
}

export default LoginPage;
