import React from "react";

import { HighlightGroup } from "../useHighlightManager";

interface SyntaxSmartHighlightProps {
  highlightId: string;
  groups: HighlightGroup[];
  activeHighlightId: string | null;
  onToggle: (highlightId: string, groups: HighlightGroup[]) => void;
  buttonLabel?: string;
  activeButtonLabel?: string;
}

const SyntaxSmartHighlight: React.FC<SyntaxSmartHighlightProps> = ({
  highlightId,
  groups,
  activeHighlightId,
  onToggle,
  buttonLabel = "Smart Highlight",
  activeButtonLabel = "Clear highlight",
}) => {
  const isActive = activeHighlightId === highlightId;
  const disabled = groups.length === 0;
  const handleClick = () => {
    if (disabled) {
      return;
    }
    onToggle(highlightId, groups);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2.5 rounded-full px-8 py-4 text-center font-medium transition lg:px-8 xl:px-10 ${
        disabled
          ? "cursor-not-allowed bg-slate-200 text-slate-500"
          : isActive
            ? "bg-slate-300 text-slate-800 hover:bg-slate-200"
            : "bg-primary text-white hover:bg-opacity-90"
      }`}
      aria-pressed={isActive}
    >
      {isActive ? activeButtonLabel : buttonLabel}
    </button>
  );
};

export default SyntaxSmartHighlight;
