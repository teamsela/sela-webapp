'use client';

import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-12">
      <SignIn />
    </main>
  );
}
