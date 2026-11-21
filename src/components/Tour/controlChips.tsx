import { Fragment, type ReactNode } from "react";
import {
  LuAlignLeft,
  LuAudioLines,
  LuBaseline,
  LuChevronDown,
  LuEllipsis,
  LuIndentDecrease,
  LuIndentIncrease,
  LuInfo,
  LuLayers,
  LuNetwork,
  LuNotebookPen,
  LuPaintBucket,
  LuShapes,
  LuTextCursorInput,
  LuType,
} from "react-icons/lu";

import {
  BorderColorIcon,
  StructureIcon,
  UniformWidthIcon,
  WordBoxesIcon,
  type StructureAction,
  type StructureLevel,
} from "@/components/StudyPane/Toolbar/ToolbarIcons";
import type { TourLayout } from "@/lib/tutorials/tour";

/*
  The tutorial's text names controls ("Tap New strophe", "open Motif").
  These draw each name the way the control looks on screen, with its own
  icon, so the words in the bubble match what to look for:

    toolbar / menu buttons   icon + label, as in the toolbar and phone menus
    tool tabs                outlined pill (desktop and tablet header), or
                             the bottom bar's icon + label (phones)
    Select repeats, Done,    as drawn in the phone's selection bar
    Smart Highlight
    A / א / Aא, Abc, ⋯       the language switch's letters, the menu button

  Matching is on exact, capitalised control names; ordinary words
  ("a strophe", "word boxes") are left alone.
*/

const ICON = 15;
const chip = "mx-[1px] inline-flex items-center gap-1 whitespace-nowrap rounded-md border px-1.5 py-px align-[-2px] text-[0.93em] font-semibold leading-5";
const neutral = `${chip} border-stroke bg-white text-black dark:border-strokedark dark:bg-boxdark dark:text-white`;

const Chip = ({ icon, label, className = neutral }: { icon?: ReactNode; label: string; className?: string }) => (
  <span className={className}>
    {icon}
    {label}
  </span>
);

const structure = (level: StructureLevel, action: StructureAction, label: string) => (
  <Chip icon={<StructureIcon level={level} action={action} size={ICON} />} label={label} />
);

type Rule = { re: RegExp; render: (match: string, layout: TourLayout) => ReactNode };

const TAB_ICONS: Record<string, ReactNode> = {
  Layer: <LuLayers size={ICON} />,
  Layers: <LuLayers size={ICON} />,
  Structure: <LuAlignLeft size={ICON} />,
  Motif: <LuShapes size={ICON} />,
  Syntax: <LuNetwork size={ICON} />,
  Sound: <LuAudioLines size={ICON} />,
  Sounds: <LuAudioLines size={ICON} />,
};
const tab = (name: string, layout: TourLayout) =>
  layout === "phone" ? (
    <Chip icon={TAB_ICONS[name]} label={name} />
  ) : (
    <Chip label={name} className={`${chip} rounded-full border-primary bg-white px-2.5 text-black`} />
  );

const BAR_ICONS: Record<string, ReactNode> = {
  Color: <LuPaintBucket size={ICON} />,
  Word: <LuType size={ICON} />,
  Line: <StructureIcon level="line" action="new" size={ICON} />,
  Strophe: <StructureIcon level="strophe" action="new" size={ICON} />,
  Stanza: <StructureIcon level="stanza" action="new" size={ICON} />,
  Info: <LuInfo size={ICON} />,
  Format: <LuPaintBucket size={ICON} />,
};

// Longest names first, so "Merge with previous strophe" wins over "Strophe".
const RULES: Rule[] = [
  ...(["line", "strophe", "stanza"] as StructureLevel[]).flatMap((level) => [
    { re: new RegExp(`Merge with previous ${level}`, "g"), render: (m: string) => structure(level, "prev", m) },
    { re: new RegExp(`Merge with next ${level}`, "g"), render: (m: string) => structure(level, "next", m) },
    { re: new RegExp(`New ${level}\\b`, "g"), render: (m: string) => structure(level, "new", m) },
  ]),
  { re: /Fill color/g, render: (m) => <Chip icon={<LuPaintBucket size={ICON} />} label={m} /> },
  { re: /Border color/g, render: (m) => <Chip icon={<BorderColorIcon size={ICON} />} label={m} /> },
  { re: /(Font|Text) color/g, render: (m) => <Chip icon={<LuBaseline size={ICON} />} label={m} /> },
  { re: /Enable uniform width|Uniform width/g, render: (m) => <Chip icon={<UniformWidthIcon size={ICON} />} label={m} /> },
  { re: /the box button/g, render: () => <>the <Chip icon={<WordBoxesIcon size={ICON} />} label="Boxes" /> button</> },
  { re: /Add indent/g, render: (m) => <Chip icon={<LuIndentIncrease size={ICON} />} label={m} /> },
  { re: /Remove indent/g, render: (m) => <Chip icon={<LuIndentDecrease size={ICON} />} label={m} /> },
  { re: /Edit English gloss/g, render: (m) => <Chip icon={<LuTextCursorInput size={ICON} />} label={m} /> },
  { re: /the notes button/g, render: () => <>the <Chip icon={<LuNotebookPen size={ICON} />} label="Notes" /> button</> },
  { re: /(this|the) pencil|the note button/g, render: (m) => <>{m.startsWith("this") ? "this " : "the "}<Chip icon={<LuNotebookPen size={ICON} />} label="Note" /> button</> },
  { re: /Word Information/g, render: (m) => <Chip icon={<LuInfo size={ICON} />} label={m} className={`${chip} rounded-full border-primary/40 bg-white text-body`} /> },
  { re: /Select repeats/g, render: (m) => <Chip label={m} className={`${chip} border-transparent bg-whiten text-primary`} /> },
  // Only where it's the button to press ("Tap Smart Highlight", "(now Clear Highlight)").
  { re: /(?<=\b(?:Click|Tap|click|tap|now) )(?:Smart|Clear) Highlight\b/g, render: (m) => <Chip label={m} className={`${chip} rounded-full border-primary bg-primary text-white`} /> },
  { re: /Verb Conjugations/g, render: (m) => <Chip icon={<LuChevronDown size={ICON} className="text-primary" />} label={m} /> },
  // The bottom bar's groups and the ribbon's (only as the thing to open or tap).
  {
    re: /(?<=\b(?:open|choose|Tap|tap|Click|click) )(Color|Word|Line|Strophe|Stanza|Info|Format)\b(?! (?:boxes|Information|information|gloss))/g,
    // Phones: the bottom bar's icon + label. Tablets: the ribbon's group tab (a word).
    render: (m, layout) =>
      layout === "phone" ? <Chip icon={BAR_ICONS[m]} label={m} /> : <Chip label={m} className={`${chip} border-transparent bg-whiten px-2 text-black`} />,
  },
  { re: /\b(Layers?|Structure|Motif|Syntax|Sounds?)\b(?= (?:tab|in the bar|panel|\(|and|,|\.|:)|[.,:])/g, render: (m, layout) => tab(m, layout) },
  { re: /Done(?= to| in the| \(|\.|,)/g, render: (m) => <Chip label={m} className={`${chip} rounded-full border-stroke bg-white px-2.5 text-black`} /> },
  { re: /Aא|(?<=(?:Tap|Click|tap|click) )א(?= )|(?<=(?:Tap|Click|tap|click) )A(?= )|\bAbc\b/g, render: (m) => <Chip label={m} className={`${chip} bg-white px-2 text-primary`} /> },
  { re: /⋯/g, render: () => <Chip icon={<LuEllipsis size={ICON} />} label="" className={`${chip} px-1`} /> },
];

/** The text with each control name drawn as that control. */
export const withControlChips = (text: string, layout: TourLayout): ReactNode => {
  let parts: ReactNode[] = [text];
  for (const rule of RULES) {
    parts = parts.flatMap((part) => {
      if (typeof part !== "string") return [part];
      const out: ReactNode[] = [];
      let last = 0;
      rule.re.lastIndex = 0;
      for (let m = rule.re.exec(part); m; m = rule.re.exec(part)) {
        if (m[0].length === 0) {
          rule.re.lastIndex++;
          continue;
        }
        if (m.index > last) out.push(part.slice(last, m.index));
        out.push(rule.render(m[0], layout));
        last = m.index + m[0].length;
      }
      if (last < part.length) out.push(part.slice(last));
      return out;
    });
  }
  return parts.map((p, i) => <Fragment key={i}>{p}</Fragment>);
};
