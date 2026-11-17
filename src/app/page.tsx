import { redirect } from "next/navigation";
import { SignIn } from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs/server";

import Landing from "@/components/Landing/Landing";

import { Metadata } from "next";
export const metadata: Metadata = {
  title: "Sela | Bible Poetry",
  description: "A Web-Based Exegetical Tool for Close Reading of the Hebrew Bible",
};

export default async function Home() {
  const user = await currentUser();
  if (user) {
    redirect("/dashboard/home");
  }

  return (
    <Landing
      signInSlot={
        <SignIn routing="hash" signUpUrl="/sign-up" afterSignInUrl="/dashboard/home" />
      }
    />
  );
}
