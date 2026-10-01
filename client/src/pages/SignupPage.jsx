import React from 'react';
import { AuthLayout } from '../components/auth/AuthLayout.jsx';
import { SignupForm } from '../components/auth/SignupForm.jsx';

export function SignupPage() {
  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start turning visual travel inspiration into reality in minutes."
    >
      <SignupForm />
    </AuthLayout>
  );
}

export default SignupPage;
