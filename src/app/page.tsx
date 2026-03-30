import Link from "next/link";
import { currentUser } from "@clerk/nextjs";

export default async function Home() {
  const user = await currentUser();

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-16">
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-8 text-center">
        <h1 className="text-4xl font-bold text-slate-900">Sela Bible Poetry</h1>
        <p className="text-lg text-slate-700">
          Start analyzing Psalm 1 instantly with Notes, Motif, and Syntax tools — no login required.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/try/psalm-1"
            className="rounded-md bg-primary px-6 py-3 font-semibold text-black shadow hover:opacity-90"
          >
            Try Psalm 1
          </Link>

          {user ? (
            <Link
              href="/dashboard/home"
              className="rounded-md border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-800 hover:bg-slate-100"
            >
              Go to My Studies
            </Link>
          ) : (
            <>
              <Link
                href="/sign-in"
                className="rounded-md border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-800 hover:bg-slate-100"
              >
                Log in
              </Link>
              <Link
                href="/sign-up"
                className="rounded-md border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-800 hover:bg-slate-100"
              >
                Create account
              </Link>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
