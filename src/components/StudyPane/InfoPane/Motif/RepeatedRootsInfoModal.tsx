"use client";

import { createPortal } from "react-dom";
import { IconX } from "@tabler/icons-react";

const REPEATED_ROOTS_INFO_TITLE_ID = "repeated-roots-info-title";

// Reference popup describing what Repeated Roots finds and the ways to select or color
// the words. Portaled to document.body so it overlays the whole study view (same format as the
// Pausal Forms and Accent Levels info popups).
const RepeatedRootsInfoModal = ({ onClose }: { onClose: () => void }) =>
  createPortal(
    <div
      className="fixed inset-0 z-99999 flex items-center justify-center bg-black/60 px-4 py-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby={REPEATED_ROOTS_INFO_TITLE_ID}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative max-h-[85vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition hover:bg-gray-200 hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          aria-label="Close"
        >
          <IconX size={18} stroke={2} />
        </button>

        <h3
          id={REPEATED_ROOTS_INFO_TITLE_ID}
          className="pr-10 text-lg font-bold text-gray-900 dark:text-gray-100"
        >
          Repeated Roots
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-gray-700 dark:text-gray-300">
          Use this tool to find words in the passage that share a Hebrew <em>root</em>: a verb
          together with the nouns and other words built from it, such as{" "}
          <span dir="rtl" lang="he">יָשַׁב</span> &ldquo;sit&rdquo; and{" "}
          <span dir="rtl" lang="he">מוֹשָׁב</span> &ldquo;seat&rdquo;. Repeated roots often mark a
          motif or tie the lines of a poem together.
        </p>
        <p className="mt-4 text-sm leading-relaxed text-gray-700 dark:text-gray-300">
          Words are grouped by shared meaning. Words that only look alike stay separate, such as{" "}
          <span dir="rtl" lang="he">דָּבָר</span> &ldquo;word&rdquo; and{" "}
          <span dir="rtl" lang="he">דֶּבֶר</span> &ldquo;plague&rdquo;. Small words such as{" "}
          <span dir="rtl" lang="he">כִּי</span> and <span dir="rtl" lang="he">אֵת</span> are only
          matched with the same word.
        </p>
        <p className="mt-4 text-sm leading-relaxed text-gray-700 dark:text-gray-300">
          Proper names of people and places are left out, so{" "}
          <span dir="rtl" lang="he">עֲזַרְיָה</span> &ldquo;Azariah&rdquo; is not grouped with{" "}
          <span dir="rtl" lang="he">עֵזֶר</span> &ldquo;help&rdquo;. God&apos;s names are the
          exception: <span dir="rtl" lang="he">יהוה</span> and its short form{" "}
          <span dir="rtl" lang="he">יָהּ</span> count as one (Yahweh), and{" "}
          <span dir="rtl" lang="he">אֱלֹהִים</span> with <span dir="rtl" lang="he">אֵל</span> as
          another (God). A word written as two words, such as{" "}
          <span dir="rtl" lang="he">אַל־תַּשְׁחֵת</span>, counts once.
        </p>

        <h4 className="mt-5 text-base font-bold text-gray-900 dark:text-gray-100">
          Double-Click a Word
        </h4>
        <p className="mt-1 text-sm leading-relaxed text-gray-700 dark:text-gray-300">
          Double-click any word in the passage to select every word from the same root. Double-click
          it again to deselect them. You can then color the selection with the toolbar.
        </p>

        <h4 className="mt-5 text-base font-bold text-gray-900 dark:text-gray-100">
          Root Chips
        </h4>
        <p className="mt-1 text-sm leading-relaxed text-gray-700 dark:text-gray-300">
          Each chip is one root that appears more than once in the passage, with the number of
          times it appears. Click a chip to select all of its words. The chip shows the
          root&apos;s letters without vowels (<span dir="rtl" lang="he">ישׁב</span>), standing for
          the whole family of words built on it. Hover over a chip to see a typical word from the
          family and its meaning (<span dir="rtl" lang="he">יָשַׁב</span> &ldquo;sit&rdquo;). In English,
          when two different roots share a meaning in the same passage, a short note tells them
          apart: &ldquo;gather (assemble)&rdquo; and &ldquo;gather (glean)&rdquo;.
        </p>

        <h4 className="mt-5 text-base font-bold text-gray-900 dark:text-gray-100">
          Smart Highlight
        </h4>
        <p className="mt-1 text-sm leading-relaxed text-gray-700 dark:text-gray-300">
          Click Smart Highlight to color every repeated root at once, each root in its own color.
          Click it again to clear the highlight.
        </p>

        <p className="mt-5 border-t border-gray-200 pt-3 text-xs leading-relaxed text-gray-500 dark:border-gray-700 dark:text-gray-400">
          Source: root data derived from the{" "}
          <a
            href="https://github.com/openscriptures/HebrewLexicon"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-primary"
          >
            Open Scriptures Hebrew Lexicon
          </a>{" "}
          (Brown-Driver-Briggs lexical index and Strong&apos;s Hebrew Dictionary) and the{" "}
          <a
            href="https://hb.openscriptures.org"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-primary"
          >
            Open Scriptures Hebrew Bible
          </a>{" "}
          morphology, available under CC BY 4.0, with groupings adapted for this site.
        </p>
      </div>
    </div>,
    document.body,
  );

export default RepeatedRootsInfoModal;
