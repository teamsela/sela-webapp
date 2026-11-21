import React, { useEffect, useId, useRef, useState } from "react";

import type { Availability } from "@/lib/toolbarAvailability";
import { useToolbarVariant } from "../Responsive/layout";

export const ToolTip = ({ text, reason, show = false, id }: { text: string; reason?: string; show?: boolean; id?: string }) => {
  return (
    <div
      data-tooltip
      id={id}
      className={`absolute left-1/2 top-full z-30 mt-3 -translate-x-1/2 rounded bg-black px-4.5 py-1.5 text-xs text-white pointer-events-none transition-opacity ${reason ? 'w-max max-w-[240px] whitespace-normal text-center' : 'whitespace-nowrap'} ${show ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
    >
      <span className="absolute left-1/2 top-[-3px] -z-10 h-2 w-2 -translate-x-1/2 rotate-45 rounded-sm bg-black"></span>
      <span className={reason ? 'font-semibold' : undefined}>{text}</span>
      {reason && <span className="mt-0.5 block text-white/80">{reason}</span>}
    </div>
  )
}

/*
  One toolbar button: icon (with a short label under it on screens 1800px
  and wider, or always in the tablet ribbon), a tooltip with its name, and,
  when it can't be used, the reason. A disabled button still takes clicks and
  taps so it can show that reason for a moment: touch screens have no hover.
  It is marked aria-disabled and points screen readers at the reason.

  In the phone's menus and sheets (variant "row", from ToolbarVariantContext)
  the same button draws as a full-width row with its name, and the reason
  written underneath when it can't be used.
*/
export const ToolbarButton = ({
  label,
  shortLabel,
  availability,
  pressed,
  onClick,
  children,
  dataTour,
  wrapperClassName = "px-1",
  tooltip = true,
  extra,
}: {
  label: string;
  shortLabel?: string;
  availability?: Availability;
  pressed?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  dataTour?: string;
  wrapperClassName?: string;
  tooltip?: boolean;
  extra?: React.ReactNode;
}) => {
  const { variant, onAction } = useToolbarVariant();
  const enabled = availability?.enabled ?? true;
  const reason = enabled ? undefined : availability?.reason || undefined;
  const [flash, setFlash] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  const tipId = useId();

  useEffect(() => () => window.clearTimeout(timer.current), []);
  useEffect(() => {
    if (enabled) setFlash(false);
  }, [enabled]);

  const handleClick = () => {
    if (enabled) {
      onClick();
      onAction?.();
      return;
    }
    setFlash(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setFlash(false), 2500);
  };

  if (variant === "row") {
    return (
      <div className="ClickBlock w-full" data-tour={dataTour}>
        <button
          type="button"
          aria-disabled={enabled ? undefined : true}
          aria-pressed={pressed}
          aria-describedby={reason ? tipId : undefined}
          className={`ClickBlock flex min-h-[52px] w-full items-center gap-3 rounded-xl px-3 py-2 text-left ${enabled ? 'active:bg-whiten' : 'cursor-not-allowed'} ${pressed ? 'bg-primary/10 text-primary' : ''}`}
          onClick={handleClick}
        >
          <span className="ClickBlock flex w-7 shrink-0 flex-col items-center" style={{ opacity: enabled ? 1 : 0.4 }}>
            {children}
          </span>
          <span className="ClickBlock flex min-w-0 flex-col">
            <span className={`ClickBlock text-[15px] font-semibold ${enabled ? '' : 'text-bodydark2'}`}>{label}</span>
            {reason && (
              <span id={tipId} className={`ClickBlock text-xs leading-4 ${flash ? 'text-primary' : 'text-body'}`}>
                {reason}
              </span>
            )}
          </span>
        </button>
        {extra}
      </div>
    );
  }

  const ribbon = variant === "ribbon";
  return (
    <div className={`ClickBlock flex flex-col group relative inline-block items-center justify-center xsm:flex-row ${wrapperClassName}`} data-tour={dataTour}>
      <button
        type="button"
        aria-label={label}
        aria-disabled={enabled ? undefined : true}
        aria-pressed={pressed}
        aria-describedby={reason ? tipId : undefined}
        className={`ClickBlock flex flex-col items-center rounded-md px-1 py-0.5 ${ribbon ? 'min-h-[44px] min-w-[44px] justify-center' : ''} ${enabled ? 'hover:text-primary' : 'cursor-not-allowed'} ${pressed ? 'bg-primary/10 text-primary' : ''}`}
        onClick={handleClick}
      >
        <span className="ClickBlock flex w-full flex-col items-center" style={{ opacity: enabled ? 1 : 0.4 }}>
          {children}
        </span>
        {shortLabel && (
          <span
            className={`ClickBlock mt-1 whitespace-nowrap leading-3 ${ribbon ? 'block text-[11px] text-body' : 'hidden text-[10px] text-body min-[1800px]:block'}`}
            style={ribbon ? { opacity: enabled ? 1 : 0.5 } : undefined}
          >
            {shortLabel}
          </span>
        )}
      </button>
      {tooltip && <ToolTip text={label} reason={reason} show={flash} id={tipId} />}
      {extra}
    </div>
  );
};
