import { Metadata } from "next";
import { redirect } from "next/navigation"

export const metadata: Metadata = {
  title: "Sela | Bible Poetry App",
  description: "Digging for Gems in Bible Poetry",
  // other metadata
};

export default function Home() {
  return redirect("/dashboard/home");
}
