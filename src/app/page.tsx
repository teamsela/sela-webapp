import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs";

export default async function Home() {
  const user = await currentUser();

  if (user) {
    redirect("/dashboard/home");
  }

  redirect("/try");
}
