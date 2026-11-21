"use client";

import { SignUp } from '@clerk/nextjs';
import AuthLayout from '@/components/Auth/AuthLayout';

export default function Page() {
  return (
    <AuthLayout>
      <SignUp />
    </AuthLayout>
  );
}
