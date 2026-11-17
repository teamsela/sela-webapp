import { SignIn } from '@clerk/nextjs';

import Nav from '@/components/Landing/Nav';
import Hero from '@/components/Landing/Hero';

export default function SignInPage() {
  return (
    <main className="flex min-h-screen flex-col bg-white">
      <Nav />
      <Hero fullHeight signInSlot={<SignIn />} />
    </main>
  );
}
