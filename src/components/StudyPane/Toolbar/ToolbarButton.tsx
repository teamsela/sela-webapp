import React, { useEffect, useId, useRef, useState } from "react";

import type { Availability } from "@/lib/toolbarAvailability";

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
  and wider), a tooltip with its name, and, when it can't be used, the reason.
  A disabled button still takes clicks and taps so it can show that reason
  for a moment: touch screens have no hover. It is marked aria-disabled and
  points screen readers at the reason.
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
      return;
    }
    setFlash(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setFlash(false), 2500);
  };

  return (
    <div className={`ClickBlock flex flex-col group relative inline-block items-center justify-center xsm:flex-row ${wrapperClassName}`} data-tour={dataTour}>
      <button
        type="button"
        aria-label={label}
        aria-disabled={enabled ? undefined : true}
        aria-pressed={pressed}
        aria-describedby={reason ? tipId : undefined}
        className={`ClickBlock flex flex-col items-center rounded-md px-1 py-0.5 ${enabled ? 'hover:text-primary' : 'cursor-not-allowed'} ${pressed ? 'bg-primary/10 text-primary' : ''}`}
        onClick={handleClick}
      >
        <span className="ClickBlock flex w-full flex-col items-center" style={{ opacity: enabled ? 1 : 0.4 }}>
          {children}
        </span>
        {shortLabel && (
          <span className="ClickBlock mt-1 hidden whitespace-nowrap text-[10px] leading-3 text-body min-[1800px]:block">{shortLabel}</span>
        )}
      </button>
      {tooltip && <ToolTip text={label} reason={reason} show={flash} id={tipId} />}
      {extra}
    </div>
  );
};
