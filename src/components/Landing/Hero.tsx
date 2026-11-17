import Link from "next/link";

const heroImage = "/images/landing/hero.webp";

// Mirrors the first section of https://www.biblepoetry.org/ (heading, intro
// copy, call-to-action), with an optional slot for the Clerk sign-in card that
// sits to the right of the "Sela" heading on wide screens.
export default function Hero({
  signInSlot,
  fullHeight = false,
}: {
  signInSlot?: React.ReactNode;
  fullHeight?: boolean;
}) {
  return (
    <section
      className={`relative flex bg-black bg-cover bg-center bg-no-repeat font-quicksand text-white ${fullHeight ? "flex-1" : ""}`}
      style={{ backgroundImage: `url(${heroImage})` }}
    >
      <div className="absolute inset-0 bg-black/40" aria-hidden="true" />

      <div className="relative mx-auto w-full max-w-[1300px] self-center px-[6vw] py-16 lg:px-[4vw] lg:py-24">
        <div className="grid grid-cols-1 gap-x-14 gap-y-10 lg:grid-cols-[minmax(0,1fr)_auto]">
          <div>
            <h1 className="text-[2.75rem] leading-[1.232] lg:text-[4rem]">
              <strong className="font-bold">Sela</strong>{" "}
              <strong className="hbFont font-bold text-[#FFC400]">סלע</strong>
            </h1>
            <h3 className="mt-8 text-2xl font-bold leading-[1.333] lg:text-[2.2rem]">
              A Web-Based Exegetical Tool for <br className="hidden sm:inline" />
              Close Reading of the Hebrew Bible
            </h3>
          </div>

          {signInSlot && (
            <div className="flex justify-center lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:justify-end">
              {signInSlot}
            </div>
          )}

          <div className="lg:col-start-1 lg:max-w-[746px]">
            <p className="text-lg leading-[1.8] lg:text-2xl lg:leading-[1.8]">
              Sela helps readers explore meaning that emerges through Hebrew syntax, word repetition, and literary structure. Readers can work in Hebrew, English, or both, while the display retains the original Hebrew word order and word count.
            </p>
            <p className="mt-8 text-lg leading-[1.8] lg:text-2xl lg:leading-[1.8]">
              To support careful literary analysis, the platform makes it easy to divide texts into literary units, compare parallel lines, trace repetition, explore syntactic patterns, and record observations directly in the text. It is especially well suited for biblical Hebrew poetry, where structure and parallelism are central, but it also functions as a general tool for text-centered Hebrew exegesis.
            </p>
            <div className="mt-12 flex justify-center sm:justify-end">
              <Link
                href="/playground"
                className="inline-block w-full rounded-[0.4rem] bg-[#FFC400] px-6 py-[1.2rem] text-center text-[1.4rem] leading-none tracking-[0.02em] text-black transition-opacity hover:opacity-80 sm:w-[292px]"
              >
                Try with Psalm 1
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
