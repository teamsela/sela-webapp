import Link from 'next/link';
import { IconMoodSad } from '@tabler/icons-react';
 
export default function NotFound() {
  /* TODO: add a beautiful artwork for not found page */
  return (
    <main className="flex h-full flex-col items-center justify-center gap-2">
      <IconMoodSad className="w-10 text-gray-400" />
      <h2 className="text-xl font-semibold">404 Not Found</h2>
      <p>Could not find the requested study.</p>
      <Link
        href="/dashboard/home"
        className="mt-4 rounded-md px-4 py-2 text-md underline hover:font-semibold"
      >
        Go Back
      </Link>
    </main>
  );
}