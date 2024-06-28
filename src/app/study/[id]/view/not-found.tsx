import Link from 'next/link';
import Image from 'next/image';

export default function NotFound() {
  return (
    <main className="flex h-full flex-col items-center justify-center gap-2">
      <Image src={"/images/not-found.svg"} width={400} height={400} alt="not-found" />
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