import StudyPane from "@/components/StudyPane";
import GuestSessionBanner from "@/components/StudyPane/GuestSessionBanner";
import { fetchGuestPsalmStudy } from "@/lib/actions";

export default async function TryPage() {
  const passageData = await fetchGuestPsalmStudy();

  return (
    <>
      <GuestSessionBanner />
      <StudyPane passageData={passageData} inViewMode={false} guestSessionKey="guest-psalm-1" />
    </>
  );
}
