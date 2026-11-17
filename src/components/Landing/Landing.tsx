import Image from "next/image";

import Nav from "./Nav";
import Hero from "./Hero";
import FooterBar from "./FooterBar";

const majorFeatures = [
  {
    title: "Engage an English Text in Hebrew Word Order",
    body: "Preserving Hebrew word order and word count makes poetic parallelism, emphasis, and line correspondence visible even when working in English.",
    image: "/images/landing/features/1-word-order.webp",
    alt: "Rows of colored text boxes with parts of biblical verses from Psalm 1, including words like 'Blessed is,' 'does not,' 'stands,' and 'sits,' laid out on a light green background.",
  },
  {
    title: "Divide the Text into Literary Units",
    body: "Organizing the passage into lines, strophes, and stanzas allows units to be compared side by side, clarifying structure and poetic development.",
    image: "/images/landing/features/2-literary-units.webp",
    alt: "A digital screenshot of a written poem divided into three columns, labeled 'Stanza One,' 'Stanza Two,' and 'Stanza Three.'",
  },
  {
    title: "Track Layered Observations with Color Layers",
    body: "Layered color markings expose poetic patterns, enabling multiple literary, structural, and lexical observations to be visually compared, even in translation.",
    image: "/images/landing/features/3-color-layers.webp",
    alt: "A color palette with a checkmark over a purple hue, overlaid on a colorful educational chart with text in Hebrew and English about singing and playing music.",
  },
  {
    title: "Instantly Find Repeated Words and Ideas",
    body: "Tracing true lexical repetition in Hebrew, regardless of English translation, highlights repeated themes and key poetic structural markers within the text.",
    image: "/images/landing/features/4-repeated-words.webp",
    alt: "Screenshot of a digital text editing tool displaying verses from Genesis 1 with highlighted phrases.",
  },
  {
    title: "Explore Patterns in the Hebrew Syntax",
    body: "Using Hebrew grammatical data, the tool reveals recurring syntactical patterns, highlighting textual parallels and progression across poetic lines.",
    image: "/images/landing/features/5-hebrew-syntax.webp",
    alt: "Screenshot of a digital text analysis highlighting parts of speech from a biblical passage.",
  },
  {
    title: "Access Word Parsing and Lexical Information",
    body: "Immediate access to morphology and lexicon while reading and working in the text supports precise grammatical and semantic analysis without interruption.",
    image: "/images/landing/features/6-word-analysis.webp",
    alt: "Excerpt from the Bible, Psalm of David, with highlighted words and a word analysis panel on the right.",
  },
  {
    title: "Annotate Observations and Label Literary Units",
    body: "Add titles and concise notes to strophes and literary units to organize observations, summarize sections, and preserve interpretive reasoning over time.",
    image: "/images/landing/features/7-annotate.webp",
    alt: "Highlighted Bible verses with annotations and color highlights.",
  },
  {
    title: "See the Poem as a Unified Whole",
    body: "Step back to observe the poem's big-picture design, structural architecture, flow of ideas, and recurring literary features that run through the work from beginning to end.",
    image: "/images/landing/features/8-unified-whole.webp",
    alt: "A digital scripture with highlighted verses from the Book of Psalms.",
  },
];

export default function Landing({ signInSlot }: { signInSlot?: React.ReactNode }) {
  return (
    <div className="bg-white text-black-2 font-quicksand">
      <Nav />

      <Hero signInSlot={signInSlot} />

      {/* Major Features */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <h2 className="text-center text-3xl font-bold sm:text-4xl">Major Features</h2>
        <div className="mt-12 grid gap-12 md:grid-cols-2">
          {majorFeatures.map((f) => (
            <div key={f.title} className="flex flex-col gap-4">
              <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-stroke">
                <Image src={f.image} alt={f.alt} fill className="object-cover" sizes="(min-width: 768px) 50vw, 100vw" />
              </div>
              <h3 className="text-xl font-semibold">{f.title}</h3>
              <p className="text-base text-body">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <FooterBar />
    </div>
  );
}
