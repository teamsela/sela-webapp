import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 dark:bg-boxdark-2">
      <section className="mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center gap-6 px-6 text-center">
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white md:text-5xl">
          Study Psalm 1 instantly
        </h1>
        <p className="max-w-2xl text-lg text-slate-600 dark:text-slate-300">
          Start a guided analysis session right away. Use Notes, Motif, and Syntax tools without signing in,
          then save your progress to your account whenever you&apos;re ready.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/try"
            className="rounded-md bg-primary px-6 py-3 font-semibold text-white transition hover:opacity-90"
          >
            Start Psalm 1 now
          </Link>
          <Link
            href="/sign-in?redirect_url=/try"
            className="rounded-md border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-900 transition hover:bg-slate-100 dark:border-slate-600 dark:bg-boxdark dark:text-white dark:hover:bg-slate-800"
          >
            Sign in
          </Link>
          <Link
            href="/sign-up?redirect_url=/try"
            className="rounded-md border border-primary px-6 py-3 font-semibold text-primary transition hover:bg-primary/10"
          >
            Create account
          </Link>
        </div>
      </section>
    </main>
  );
}
