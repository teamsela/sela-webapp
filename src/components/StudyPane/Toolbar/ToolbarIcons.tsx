import React from "react";

/*
  Toolbar icons drawn in the same style as Lucide (react-icons/lu): 24px
  grid, 2px round strokes. Lucide has no icons for lines, strophes and
  stanzas, so those are drawn here as one family:

    Line     a row of word boxes        New = +   Merge prev = up   Merge next = down
    Strophe  a box of lines             New = +   Merge prev = up   Merge next = down
    Stanza   two columns side by side   New = +   Merge prev = toward the previous
                                                  stanza (left, or right in Hebrew)

  Strophes stack top to bottom and stanzas sit side by side in the single
  language view, so the arrows point the way the text actually moves.
*/

type IconProps = { size?: string | number; className?: string; style?: React.CSSProperties };

const Svg = ({ size = "1.5em", className, style, children }: IconProps & { children: React.ReactNode }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
    className={className}
    style={style}
  >
    {children}
  </svg>
);

export const BorderColorIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3" y="4" width="18" height="14" rx="3" strokeWidth={2.6} />
  </Svg>
);

export const WordBoxesIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="2" y="7" width="9" height="10" rx="2" />
    <rect x="13" y="7" width="9" height="10" rx="2" />
  </Svg>
);

export const UniformWidthIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="2" y="11" width="9" height="8" rx="2" />
    <rect x="13" y="11" width="9" height="8" rx="2" />
    <path d="M2 6h9M13 6h9M2 4v4M11 4v4M13 4v4M22 4v4" strokeWidth={1.6} />
  </Svg>
);

export type StructureLevel = "line" | "strophe" | "stanza";
export type StructureAction = "new" | "prev" | "next";

const LevelShape = ({ level }: { level: StructureLevel }) => {
  if (level === "line") {
    return (
      <>
        <rect x="2" y="4" width="5" height="6" rx="1.5" />
        <rect x="9.5" y="4" width="5" height="6" rx="1.5" />
        <rect x="17" y="4" width="5" height="6" rx="1.5" />
      </>
    );
  }
  if (level === "strophe") {
    return (
      <>
        <rect x="2" y="2" width="15" height="12" rx="2.5" />
        <path d="M5.5 6h8M5.5 10h5" strokeWidth={1.8} />
      </>
    );
  }
  return (
    <>
      <rect x="2" y="2" width="7" height="11" rx="1.8" />
      <rect x="11" y="2" width="7" height="11" rx="1.8" />
    </>
  );
};

const Marker = ({ level, action, rtl }: { level: StructureLevel; action: StructureAction; rtl: boolean }) => {
  const cx = level === "line" ? 17 : 18;
  if (action === "new") return <path d={`M${cx} 14v8M${cx - 4} 18h8`} strokeWidth={2.2} />;
  if (level !== "stanza") {
    return action === "prev"
      ? <path d={`M${cx} 22v-8M${cx - 3.5} 17.5 ${cx} 14l3.5 3.5`} strokeWidth={2.2} />
      : <path d={`M${cx} 14v8M${cx - 3.5} 18.5 ${cx} 22l3.5-3.5`} strokeWidth={2.2} />;
  }
  // Stanzas: previous is to the left in English, to the right in Hebrew.
  const towardLeft = (action === "prev") !== rtl;
  return towardLeft
    ? <path d="M22 18h-8M17.5 14.5 14 18l3.5 3.5" strokeWidth={2.2} />
    : <path d="M14 18h8M18.5 14.5 22 18l-3.5 3.5" strokeWidth={2.2} />;
};

export const StructureIcon = ({ level, action, rtl = false, ...p }: IconProps & { level: StructureLevel; action: StructureAction; rtl?: boolean }) => (
  <Svg {...p}>
    <LevelShape level={level} />
    <Marker level={level} action={action} rtl={rtl} />
  </Svg>
);
