"use client";

import React, { useEffect, useRef, useState } from "react";
import { Editor, EditorContent, useEditor } from "@tiptap/react";
import { Extension } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import { Highlight } from "@tiptap/extension-highlight";
import {
  FaBold,
  FaItalic,
  FaStrikethrough,
  FaListUl,
  FaListOl,
  FaHighlighter,
  FaPalette,
  FaFont,
} from "react-icons/fa";

import {
  FONT_SIZE_OPTIONS,
  HIGHLIGHT_PALETTE,
  RichDoc,
  TEXT_COLOR_PALETTE,
  toRichDoc,
} from "@/lib/richText";

// ---------------------------------------------------------------------------
// Custom font-size extension: registers a `fontSize` attribute on the built-in
// `textStyle` mark so it renders as an inline `font-size` style and parses back.
// Values are constrained by the toolbar (and re-validated server-side).
// ---------------------------------------------------------------------------
const FontSize = Extension.create<{ types: string[] }>({
  name: "fontSize",
  addOptions() {
    return { types: ["textStyle"] };
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (element: HTMLElement) => element.style.fontSize || null,
            renderHTML: (attributes: Record<string, any>) =>
              attributes.fontSize ? { style: `font-size: ${attributes.fontSize}` } : {},
          },
        },
      },
    ];
  },
});

const buildExtensions = () => [
  // Keep the schema minimal: only the marks/nodes the prototype supports, so
  // markdown-shortcut paste can't smuggle in headings/code blocks/etc.
  StarterKit.configure({
    heading: false,
    blockquote: false,
    codeBlock: false,
    horizontalRule: false,
  }),
  TextStyle,
  Color,
  Highlight.configure({ multicolor: true }),
  FontSize,
];

type ToolbarButtonProps = {
  onClick: () => void;
  active?: boolean;
  title: string;
  children: React.ReactNode;
};

const ToolbarButton = ({ onClick, active, title, children }: ToolbarButtonProps) => (
  <button
    type="button"
    title={title}
    aria-label={title}
    aria-pressed={active}
    // Use onMouseDown + preventDefault so the editor keeps its selection.
    onMouseDown={(e) => {
      e.preventDefault();
      onClick();
    }}
    className={`flex h-8 w-8 items-center justify-center rounded text-sm transition hover:bg-gray-2 dark:hover:bg-meta-4 ${
      active ? "bg-primary text-white hover:bg-primary" : "text-black dark:text-white"
    }`}
  >
    {children}
  </button>
);

type ColorMenuProps = {
  icon: React.ReactNode;
  title: string;
  palette: readonly string[];
  onSelect: (hex: string) => void;
  onClear: () => void;
};

const ColorMenu = ({ icon, title, palette, onSelect, onClear }: ColorMenuProps) => {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onDocMouseDown = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [open]);

  return (
    <div ref={menuRef} className="relative">
      <ToolbarButton onClick={() => setOpen((v) => !v)} active={open} title={title}>
        {icon}
      </ToolbarButton>
      {open && (
        <div className="absolute left-0 top-9 z-50 w-40 rounded border border-stroke bg-white p-2 shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="grid grid-cols-6 gap-1">
            {palette.map((hex) => (
              <button
                key={hex}
                type="button"
                title={hex}
                onMouseDown={(e) => {
                  e.preventDefault();
                  onSelect(hex);
                  setOpen(false);
                }}
                className="h-5 w-5 rounded border border-black/10"
                style={{ backgroundColor: hex }}
              />
            ))}
          </div>
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              onClear();
              setOpen(false);
            }}
            className="mt-2 w-full rounded border border-stroke py-1 text-xs text-black hover:bg-gray-2 dark:border-strokedark dark:text-white dark:hover:bg-meta-4"
          >
            None
          </button>
        </div>
      )}
    </div>
  );
};

const Divider = () => <span className="mx-1 h-5 w-px bg-stroke dark:bg-strokedark" />;

// The formatting controls, shared by the floating menu.
const FormatControls = ({ editor }: { editor: Editor }) => (
  <div className="flex flex-wrap items-center gap-1">
    <ToolbarButton
      onClick={() => editor.chain().focus().toggleBold().run()}
      active={editor.isActive("bold")}
      title="Bold"
    >
      <FaBold />
    </ToolbarButton>
    <ToolbarButton
      onClick={() => editor.chain().focus().toggleItalic().run()}
      active={editor.isActive("italic")}
      title="Italic"
    >
      <FaItalic />
    </ToolbarButton>
    <ToolbarButton
      onClick={() => editor.chain().focus().toggleStrike().run()}
      active={editor.isActive("strike")}
      title="Strikethrough"
    >
      <FaStrikethrough />
    </ToolbarButton>

    <Divider />

    <ToolbarButton
      onClick={() => editor.chain().focus().toggleBulletList().run()}
      active={editor.isActive("bulletList")}
      title="Bullet list"
    >
      <FaListUl />
    </ToolbarButton>
    <ToolbarButton
      onClick={() => editor.chain().focus().toggleOrderedList().run()}
      active={editor.isActive("orderedList")}
      title="Numbered list"
    >
      <FaListOl />
    </ToolbarButton>

    <Divider />

    <ColorMenu
      icon={<FaPalette />}
      title="Text color"
      palette={TEXT_COLOR_PALETTE}
      onSelect={(hex) => editor.chain().focus().setColor(hex).run()}
      onClear={() => editor.chain().focus().unsetColor().run()}
    />
    <ColorMenu
      icon={<FaHighlighter />}
      title="Highlight"
      palette={HIGHLIGHT_PALETTE}
      onSelect={(hex) => editor.chain().focus().setHighlight({ color: hex }).run()}
      onClear={() => editor.chain().focus().unsetHighlight().run()}
    />

    <Divider />

    <select
      title="Font size"
      aria-label="Font size"
      value={editor.getAttributes("textStyle").fontSize ?? "1rem"}
      onChange={(e) => editor.chain().focus().setMark("textStyle", { fontSize: e.target.value }).run()}
      className="h-8 rounded border border-stroke bg-transparent px-1 text-sm text-black dark:border-strokedark dark:text-white"
    >
      {FONT_SIZE_OPTIONS.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </div>
);

// Floating formatting menu — positioned at a viewport coordinate (fixed, so it is
// never clipped by the editor's own scroll container). Opened by the corner icon
// or by right-clicking inside the editor; closes on outside click / Escape / scroll.
const MENU_W = 248;
const MENU_H = 96;

const FloatingFormatMenu = ({
  editor,
  position,
  onClose,
}: {
  editor: Editor;
  position: { left: number; top: number };
  onClose: () => void;
}) => {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onClose, true);
    window.addEventListener("resize", onClose);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onClose, true);
      window.removeEventListener("resize", onClose);
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      role="menu"
      className="fixed z-[1000] rounded-md border border-stroke bg-white p-2 shadow-lg dark:border-strokedark dark:bg-boxdark"
      style={{ left: position.left, top: position.top, width: MENU_W }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <FormatControls editor={editor} />
    </div>
  );
};

export type RichTextEditorProps = {
  value: RichDoc | string | undefined;
  onChange: (doc: RichDoc) => void;
  editable?: boolean;
  placeholder?: string;
  dir?: "ltr" | "rtl" | "auto";
  className?: string;
  // When true, the editor stretches to fill its parent's height and scrolls
  // internally (used where the note box should span the whole container).
  fill?: boolean;
};

const RichTextEditor = ({
  value,
  onChange,
  editable = true,
  placeholder = "Your notes here...",
  dir = "ltr",
  className = "",
  fill = false,
}: RichTextEditorProps) => {
  const editor = useEditor({
    extensions: buildExtensions(),
    content: toRichDoc(value),
    editable,
    // Avoid SSR/hydration mismatch in Next.js (editor is a client-only widget).
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: `tiptap-prose w-full px-5 py-3 outline-none ${fill ? "min-h-full" : "min-h-[8rem]"}`,
        dir,
      },
    },
    onUpdate: ({ editor: e }) => onChange(e.getJSON() as RichDoc),
  });

  const [menuPos, setMenuPos] = useState<{ left: number; top: number } | null>(null);
  const cornerRef = useRef<HTMLButtonElement | null>(null);

  const clampToViewport = (left: number, top: number) => ({
    left: Math.max(8, Math.min(left, window.innerWidth - MENU_W - 8)),
    top: Math.max(8, Math.min(top, window.innerHeight - MENU_H - 8)),
  });

  const openAtEvent = (e: React.MouseEvent) => {
    if (!editable) return;
    e.preventDefault();
    setMenuPos(clampToViewport(e.clientX, e.clientY));
  };

  const toggleFromCorner = () => {
    if (menuPos) {
      setMenuPos(null);
      return;
    }
    const rect = cornerRef.current?.getBoundingClientRect();
    if (rect) setMenuPos(clampToViewport(rect.right - MENU_W, rect.top - MENU_H));
    else setMenuPos(clampToViewport(window.innerWidth / 2, window.innerHeight / 2));
  };

  // Keep editability in sync if the surrounding view toggles view/edit mode.
  useEffect(() => {
    editor?.setEditable(editable);
  }, [editor, editable]);

  // Re-hydrate when the source doc is swapped externally (e.g. switching study),
  // but never while the user is actively editing this instance.
  const lastAppliedRef = useRef<string>("");
  useEffect(() => {
    if (!editor) return;
    const incoming = JSON.stringify(toRichDoc(value));
    if (incoming === lastAppliedRef.current) return;
    if (editor.isFocused) return;
    lastAppliedRef.current = incoming;
    editor.commands.setContent(toRichDoc(value), false);
  }, [editor, value]);

  if (!editor) return null;

  return (
    <div
      className={`relative rounded-lg border-[1.5px] border-stroke bg-transparent focus-within:border-primary dark:border-form-strokedark ${
        fill ? "flex h-full flex-col" : ""
      } ${className}`}
    >
      <div
        className={`relative ${fill ? "min-h-0 flex-1 overflow-y-auto" : ""}`}
        onContextMenu={openAtEvent}
      >
        {editable && editor.isEmpty && (
          <span className="pointer-events-none absolute left-5 top-3 text-black/40 dark:text-white/40">
            {placeholder}
          </span>
        )}
        <EditorContent editor={editor} />
      </div>

      {editable && (
        <button
          ref={cornerRef}
          type="button"
          title="Formatting options (or right-click)"
          aria-label="Formatting options"
          onMouseDown={(e) => {
            // Keep editor selection and don't trigger passage drag-select.
            e.preventDefault();
            e.stopPropagation();
          }}
          onClick={toggleFromCorner}
          className="absolute bottom-2 right-2 z-20 flex h-7 w-7 items-center justify-center rounded-md border border-stroke bg-white/80 text-black/60 opacity-60 shadow-sm backdrop-blur transition hover:opacity-100 dark:border-strokedark dark:bg-boxdark/80 dark:text-white/70"
        >
          <FaFont size={12} />
        </button>
      )}

      {editable && menuPos && (
        <FloatingFormatMenu editor={editor} position={menuPos} onClose={() => setMenuPos(null)} />
      )}
    </div>
  );
};

export default RichTextEditor;
