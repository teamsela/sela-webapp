"use client";

import type React from "react";
import { LuPaintBucket, LuBaseline, LuRemoveFormatting, LuEraser, LuTextCursorInput, LuIndentIncrease, LuIndentDecrease } from "react-icons/lu";
import { BorderColorIcon, StructureIcon, UniformWidthIcon, WordBoxesIcon, type StructureAction, type StructureLevel } from "@/components/StudyPane/Toolbar/ToolbarIcons";
import { BsInfoCircle } from "react-icons/bs";
import { IconInfoCircle, IconX } from "@tabler/icons-react";

import { createPortal } from "react-dom";

import {
  useEffect,
  useMemo,
  useState,
  useId,
  type MouseEvent as ReactMouseEvent,
} from "react";

export type InfoModalSection = "Format" | "Word" | "Line" | "Strophe" | "Stanza";

type ButtonInfoModalProps = {
  section: InfoModalSection;
  activeSection: InfoModalSection | null;
  setActiveSection: (section: InfoModalSection | null) => void;
};

type InfoIcon = React.ComponentType<{ style?: React.CSSProperties }>;

type InfoItem = {
  icon: InfoIcon;
  iconStyle?: React.CSSProperties | {};
  title: string;
  description: string;
  /** When the button can be used. */
  needs?: string;
};

const structureIcon = (level: StructureLevel, action: StructureAction): InfoIcon => {
  const Icon = () => <StructureIcon level={level} action={action} size="1.1em" />;
  Icon.displayName = `StructureIcon_${level}_${action}`;
  return Icon;
};
const BorderIcon: InfoIcon = () => <BorderColorIcon size="1.1em" />;
const BoxesIcon: InfoIcon = () => <WordBoxesIcon size="1.1em" />;
const UniformIcon: InfoIcon = () => <UniformWidthIcon size="1.1em" />;

type InfoSection = {
  title: InfoModalSection;
  description?: string[];
  items: InfoItem[];
};

const INFO_SECTIONS: Record<InfoModalSection, InfoSection> = {
  Format: {
    title: "Format",
    items: [
      {
        icon: LuPaintBucket,
        title: "Fill Color",
        description: "Add a background color to selected words or strophes.",
        needs: "Words or a strophe selected.",
      },
      {
        icon: BorderIcon,
        title: "Border Color",
        description: "Add a border color to selected words or strophes.",
        needs: "Words or a strophe selected.",
      },
      {
        icon: LuBaseline,
        title: "Font Color",
        description: "Change the color of selected text.",
        needs: "Words selected. Text color does not apply to a whole strophe.",
      },
      {
        icon: LuRemoveFormatting,
        title: "Clear Format",
        description: "Remove fill, border, and font colors from the selection.",
        needs: "Words or a strophe selected.",
      },
      {
        icon: LuEraser,
        title: "Clear All Format",
        description: "Remove all fill, border, and font colors from the entire text.",
        needs: "Some color somewhere in the passage.",
      },
    ],
  },
  Word: {
    title: "Word",
    items: [
      {
        icon: BoxesIcon,
        title: "Enable Boxes",
        description:
          "Show word boxes that map one English word to one Hebrew word, preserving Hebrew word order and count.",
      },
      {
        icon: UniformIcon,
        title: "Enable Uniform Width",
        description:
          "Make all word boxes the same width to compare word counts and see how parallel lines correspond.",
      },
      {
        icon: LuIndentIncrease,
        title: "Add Indent",
        description:
          "With uniform width enabled, shift a word forward one space to align ideas in parallel lines.",
        needs: "Uniform width on, and exactly one word selected. Up to 3 indents.",
      },
      {
        icon: LuIndentDecrease,
        title: "Remove Indent",
        description: "Remove the indent from the selected word.",
        needs: "Uniform width on, and one indented word selected.",
      },
      {
        icon: LuTextCursorInput,
        title: "Edit English Gloss",
        description:
          "Edit the word by word English translation (gloss) for this document only. Hebrew text cannot be changed. Advanced users only.",
        needs: "Exactly one word selected, in the English view (A).",
      },
    ],
  },
  Line: {
    title: "Line",
    items: [
      {
        icon: structureIcon("line", "new"),
        title: "New Line",
        description:
          "Move selected words to a new line. If one word is selected, all following words on that line move with it.",
        needs: "Words next to each other in one strophe, not starting at the beginning of a line.",
      },
      {
        icon: structureIcon("line", "prev"),
        title: "Merge with Previous Line",
        description:
          "Merge selected words with the line above. If one word is selected, all preceding words on that line merge upward.",
        needs: "A word that is not on the first line of its strophe.",
      },
      {
        icon: structureIcon("line", "next"),
        title: "Merge with Next Line",
        description:
          "Merge selected words with the line below. If one word is selected, all following words on that line merge downward.",
        needs: "A word that is not on the last line of its strophe.",
      },
    ],
  },
  Strophe: {
    title: "Strophe",
    description: [
      "A strophe is a coherent poetic unit made up of one or more parallel lines. A strophe may contain multiple bicola or tricola and is marked by shared syntax, sustained parallelism, and a unified poetic thought. A strophe ends where there is a clear break in grammar, imagery, speaker, or rhetorical function. Multiple strophes together form a stanza, the larger poetic unit of the poem.",
      "By default, your entire passage starts as one strophe (white box), contained within a stanza (grey box). Each strophe includes a strophe selector, notes editor, and collapse button.",
    ],
    items: [
      {
        icon: structureIcon("strophe", "new"),
        title: "New Strophe",
        description:
          "Start a new strophe at the selected word. All following words move into the new strophe. Selecting a consecutive group moves only that group into its own strophe.",
        needs: "A word, or words next to each other.",
      },
      {
        icon: structureIcon("strophe", "prev"),
        title: "Merge with Previous Strophe",
        description:
          "Merge the selected word and all preceding words into the strophe above. You can also merge an entire strophe using the strophe selector.",
        needs: "A word, or one strophe, that is not the first in its stanza. Strophes only merge within a stanza.",
      },
      {
        icon: structureIcon("strophe", "next"),
        title: "Merge with Next Strophe",
        description:
          "Merge the selected word and all following words into the strophe below. You can also merge an entire strophe using the strophe selector.",
        needs: "A word, or one strophe, that is not the last in its stanza. Strophes only merge within a stanza.",
      },
    ],
  },
  Stanza: {
    title: "Stanza",
    description: [
      "A stanza is a larger poetic unit made up of one or more strophes. It groups related strophes into a coherent section of the poem and is marked by shifts in theme, imagery, speaker, or rhetorical movement. Stanzas help organize the poem’s structure and guide interpretation at a macro level.",
      "By default, your entire passage starts as one strophe (white box), contained within a stanza (grey box). Each stanza includes a collapse button.",
    ],
    items: [
      {
        icon: structureIcon("stanza", "new"),
        title: "New Stanza",
        description:
          "Move the selected strophe into a new stanza. In single language view, stanzas appear side by side. In parallel view, new stanzas appear below.",
        needs: "A strophe (its select icon) or a word in it. The passage needs at least two strophes.",
      },
      {
        icon: structureIcon("stanza", "prev"),
        title: "Merge with Previous Stanza",
        description:
          "Merge the selected strophe and all preceding strophes into the previous stanza. Multiple strophes can be merged at once.",
        needs: "A strophe or a word in it, not in the first stanza.",
      },
      {
        icon: structureIcon("stanza", "next"),
        title: "Merge with Next Stanza",
        description:
          "Merge the selected strophe and all following strophes into the next stanza. Multiple strophes can be merged at once.",
        needs: "A strophe or a word in it, not in the last stanza.",
      },
    ],
  },
};

const ButtonInfoModal = ({
  section,
  activeSection,
  setActiveSection,
}: ButtonInfoModalProps) => {
  const [isMounted, setIsMounted] = useState(false);
  const open = activeSection === section;
  const modalTitleId = useId();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setActiveSection(null);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };

    
  }, [open, setActiveSection]);
 
  const modalMarkup = useMemo(() => {
    if (!open) {
      return null;
    }

    const handleOverlayClick = (event: ReactMouseEvent<HTMLDivElement>) => {
      if (event.target === event.currentTarget) {
        setActiveSection(null);
      }
    };

    const infoSection = INFO_SECTIONS[section];

    return (
      <div
        className="fixed inset-0 z-[1200] flex items-start justify-center bg-black/60 px-4 pb-8 pt-[200px]"
        role="dialog"
        aria-modal="true"
        aria-labelledby={modalTitleId}
        onClick={handleOverlayClick}
      >
        <div className="relative w-full max-w-xl rounded-2xl bg-white p-6 text-left text-sm text-gray-700 shadow-2xl dark:bg-gray-900 dark:text-gray-200">
          <button
            type="button"
            onClick={() => setActiveSection(null)}
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition hover:bg-gray-200 hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            aria-label="Close toolbar information"
          >
            <IconX size={18} stroke={2} />
          </button>

            <div className="flex items-center gap-2 text-primary">
            <BsInfoCircle size={22} />
            <h3 id="toolbar-info-title" className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {infoSection.title}
            </h3>
            </div>

            <div className="mt-2 space-y-2 text-sm text-gray-700 dark:text-gray-300">
            {infoSection.description && (
                <div className="space-y-2 rounded-lg bg-gray-50 p-4 leading-relaxed dark:bg-gray-800/60">
                {infoSection.description.map((paragraph) => (
                    <p key={paragraph} className="text-sm">{paragraph}</p>
                ))}
                </div>
            )}

            <div className="bg-white ">
                {infoSection.items.map((item) => (
                <div key={item.title} className="p-2 shadow-sm dark:border-gray-800 dark:bg-white/[0.03] sm:p-3">
                    <div className="flex items-center gap-1">
                        <item.icon style={item.iconStyle} />
                        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{item.title}</span>
                    </div>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{item.description}</p>
                    {item.needs && (
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        <span className="font-semibold text-gray-700 dark:text-gray-200">Needs: </span>
                        {item.needs}
                      </p>
                    )}
                </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    );
  }, [modalTitleId, open, section, setActiveSection]);

  if (section == null) {
    return;
  }
    
  return (
    <>
      <div className="relative w-full text-[0.7rem] text-gray-500 tracking-wide">

      <span className="flex items-center justify-center">{section}</span>

      <button
        type="button"
        onClick={() => setActiveSection(section)}
        className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-gray-600"
      >
        <BsInfoCircle aria-hidden="true" />
      </button>
      {isMounted && modalMarkup ? createPortal(modalMarkup, document.body) : null}
      </div>
    </>
  );
};

export default ButtonInfoModal;
