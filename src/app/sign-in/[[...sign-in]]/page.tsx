'use client';

import { SignIn } from '@clerk/nextjs';
import AuthLayout from '@/components/Auth/AuthLayout';

export default function SignInPage() {
  return (
    <AuthLayout demo>
      <SignIn />
    </AuthLayout>
  );
}
