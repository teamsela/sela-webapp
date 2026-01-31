"use client";

import { IconType } from "react-icons";

import { LuArrowUpToLine, LuArrowDownToLine, LuArrowUpNarrowWide, LuArrowDownWideNarrow } from "react-icons/lu";
import { MdOutlineModeEdit, MdOutlinePlaylistAdd } from "react-icons/md";
import { BiSolidColorFill, BiFont } from "react-icons/bi";
import { AiOutlineClear } from "react-icons/ai";
import { VscClearAll } from "react-icons/vsc";
import { TbArrowAutofitContent, TbEdit } from "react-icons/tb";
import { CgArrowsBreakeV, CgArrowsBreakeH, CgFormatIndentIncrease, CgFormatIndentDecrease } from "react-icons/cg";
import { TbBoxModel2 } from "react-icons/tb";
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

type InfoItem = {
  icon: IconType;
  iconStyle?: React.CSSProperties | {};
  title: string;
  description: string;
};

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
        icon: BiSolidColorFill,
        title: "Fill Color",
        description: "Add a background color to selected words or strophes.",
      },
      {
        icon: MdOutlineModeEdit,
        title: "Border Color",
        description: "Add a border color to selected words or strophes.",
      },
      {
        icon: BiFont,
        title: "Font Color",
        description: "Change the color of selected text.",
      },
      {
        icon: AiOutlineClear,
        title: "Clear Format",
        description: "Remove fill, border, and font colors from the selection.",
      },
      {
        icon: VscClearAll,
        title: "Clear All Format",
        description: "Remove all fill, border, and font colors from the entire text.",
      },
    ],
  },
  Word: {
    title: "Word",
    items: [
      {
        icon: TbBoxModel2,
        title: "Enable Boxes",
        description:
          "Show word boxes that map one English word to one Hebrew word, preserving Hebrew word order and count.",
      },
      {
        icon: TbArrowAutofitContent,
        title: "Enable Uniform Width",
        description:
          "Make all word boxes the same width to compare word counts and see how parallel lines correspond.",
      },
      {
        icon: CgFormatIndentIncrease,
        title: "Add Indent",
        description:
          "With uniform width enabled, shift a word forward one space to align ideas in parallel lines.",
      },
      {
        icon: CgFormatIndentDecrease,
        title: "Remove Indent",
        description: "Remove the indent from the selected word.",
      },
      {
        icon: TbEdit,
        title: "Edit English Gloss",
        description:
          "Edit the word by word English translation (gloss) for this document only. Hebrew text cannot be changed. Advanced users only.",
      },
    ],
  },
  Line: {
    title: "Line",
    items: [
      {
        icon: MdOutlinePlaylistAdd,
        title: "New Line",
        description:
          "Move selected words to a new line. If one word is selected, all following words on that line move with it.",
      },
      {
        icon: LuArrowUpToLine,
        title: "Merge with Previous Line",
        description:
          "Merge selected words with the line above. If one word is selected, all preceding words on that line merge upward.",
      },
      {
        icon: LuArrowDownToLine,
        title: "Merge with Next Line",
        description:
          "Merge selected words with the line below. If one word is selected, all following words on that line merge downward.",
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
        icon: CgArrowsBreakeV,
        title: "New Strophe",
        description:
          "Start a new strophe at the selected word. All following words move into the new strophe. Selecting a consecutive group moves only that group into its own strophe.",
      },
      {
        icon: LuArrowUpNarrowWide,
        title: "Merge with Previous Strophe",
        description:
          "Merge the selected word and all preceding words into the strophe above. You can also merge an entire strophe using the strophe selector.",
      },
      {
        icon: LuArrowDownWideNarrow,
        title: "Merge with Next Strophe",
        description:
          "Merge the selected word and all following words into the strophe below. You can also merge an entire strophe using the strophe selector.",
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
        icon: CgArrowsBreakeH,
        title: "New Stanza",
        description:
          "Move the selected strophe into a new stanza. In single language view, stanzas appear side by side. In parallel view, new stanzas appear below.",
      },
      {
        icon: LuArrowDownWideNarrow,
        iconStyle: { transform: 'rotate(90deg)' },
        title: "Merge with Previous Stanza",
        description:
          "Merge the selected strophe and all preceding strophes into the previous stanza. Multiple strophes can be merged at once.",
      },
      {
        icon: LuArrowUpNarrowWide,
        iconStyle: { transform: 'rotate(90deg)' },
        title: "Merge with Next Stanza",
        description:
          "Merge the selected strophe and all following strophes into the next stanza. Multiple strophes can be merged at once.",
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
