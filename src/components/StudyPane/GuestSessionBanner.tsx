'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';

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
      <div className="fixed top-0 z-[60] w-full bg-primary px-4 py-2 text-center text-sm font-medium text-white">
        {isSaving ? 'Saving your guest session…' : 'Signed in — preparing your study session…'}
      </div>
    );
  }

  return (
    <div className="fixed top-0 z-[60] w-full bg-primary px-4 py-2 text-center text-sm font-medium text-white">
      You are in guest mode.{' '}
      <Link href="/sign-in?redirect_url=/try" className="underline">
        Sign in
      </Link>{' '}
      or{' '}
      <Link href="/sign-up?redirect_url=/try" className="underline">
        create an account
      </Link>{' '}
      to save your progress.
    </div>
  );
}
