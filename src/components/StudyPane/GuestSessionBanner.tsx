'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { SignInButton, useUser } from '@clerk/nextjs';

import { createStudyFromGuestSession } from '@/lib/actions';

const SESSION_KEY = 'guest-psalm-1';

export default function GuestSessionBanner() {
  const { isSignedIn } = useUser();
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const migrateSession = async () => {
      if (!isSignedIn) return;
      const raw = window.sessionStorage.getItem(SESSION_KEY);
      if (!raw) return;

      const parsed = JSON.parse(raw);
      if (parsed.migratedStudyId) return;

      setIsSaving(true);
      const response = await createStudyFromGuestSession({
        name: 'Psalm 1 Study',
        book: 'psalms',
        passage: '1',
        metadata: parsed.metadata || { words: {} },
        notes: parsed.notes || '',
      });

      if (response?.id) {
        window.sessionStorage.setItem(
          SESSION_KEY,
          JSON.stringify({ ...parsed, migratedStudyId: response.id }),
        );
        router.replace(`/study/${response.id.replace(/^rec_/, '')}/edit`);
      }

      setIsSaving(false);
    };

    migrateSession();
  }, [isSignedIn, router]);

  if (isSignedIn) {
    return (
      <div className="fixed right-4 top-4 z-[60] rounded-md bg-primary px-4 py-2 text-sm font-medium text-white shadow-lg">
        {isSaving ? 'Saving your guest session…' : 'Signed in — preparing your study session…'}
      </div>
    );
  }

  return (
    <div className="fixed right-4 top-4 z-[60] flex items-center gap-3 rounded-md bg-white px-4 py-2 text-sm font-medium text-slate-900 shadow-lg dark:bg-boxdark dark:text-white">
      <span>Save your progress</span>
      <SignInButton mode="modal" redirectUrl="/try" afterSignInUrl="/try" afterSignUpUrl="/try">
        <button className="rounded-md bg-primary px-3 py-1.5 text-white hover:opacity-90">
          Sign In
        </button>
      </SignInButton>
      <Link href="/sign-up?redirect_url=/try" className="text-primary underline">
        Create account
      </Link>
    </div>
  );
}
