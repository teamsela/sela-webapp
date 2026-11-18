"use client";

import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { IconRoute } from "@tabler/icons-react";

import { FormatContext } from "@/components/StudyPane";
import { InfoPaneActionType } from "@/lib/types";
import {
  INTERFACE_TOUR_ID,
  INTERFACE_TOUR_STEPS,
  type TourSnapshot,
} from "@/lib/tutorials/interfaceTour";
import TourOverlay, { tourPrimaryButton, tourSecondaryButton } from "./TourOverlay";

/*
  Runs the Interface Tutorial tour while a tutorial study is in practice mode.

  Progress (current step, closed or not) is kept per browser, so leaving and
  coming back resumes the tour. A step with `isDone` is checked a few times a
  second against what the study screen shows; once it is done the bubble
  confirms it and the button becomes Continue, and the tour waits for the
  user, so they can look at the result first. A small pill above the footer
  says this is a practice copy and reopens the tour.
*/

type TourProgress = { step: number; open: boolean };

const storageKey = (studyId: string) => `sela.tour.${INTERFACE_TOUR_ID}.${studyId}`;

const readProgress = (studyId: string): TourProgress => {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(storageKey(studyId)) ?? "null");
    if (parsed && typeof parsed.step === "number" && typeof parsed.open === "boolean") {
      return {
        step: Math.min(Math.max(parsed.step, 0), INTERFACE_TOUR_STEPS.length - 1),
        open: parsed.open,
      };
    }
  } catch {
    // fall through to a fresh start
  }
  return { step: 0, open: true };
};

const writeProgress = (studyId: string, progress: TourProgress) => {
  try {
    window.localStorage.setItem(storageKey(studyId), JSON.stringify(progress));
  } catch {
    // progress just won't survive a reload
  }
};

// Interactive steps (those with a target) are the ones counted in "Step n of m".
const INTERACTIVE_IDS = INTERFACE_TOUR_STEPS.filter((s) => s.target).map((s) => s.id);

const InterfaceTour = ({
  studyId,
  infoPaneAction,
  setCloneStudyOpen,
}: {
  studyId: string;
  infoPaneAction: InfoPaneActionType;
  setCloneStudyOpen: (open: boolean) => void;
}) => {
  const { ctxSelectedWords, ctxStudyMetadata } = useContext(FormatContext);

  const [progress, setProgress] = useState<TourProgress | null>(null);
  const [done, setDone] = useState(false);

  // Latest screen state for the polling check (metadata is sometimes mutated
  // in place, so it is read fresh on every tick rather than via React deps).
  const live = useRef({ ctxSelectedWords, ctxStudyMetadata, infoPaneAction });
  live.current = { ctxSelectedWords, ctxStudyMetadata, infoPaneAction };

  useEffect(() => {
    setProgress(readProgress(studyId));
  }, [studyId]);

  const update = useCallback(
    (next: TourProgress) => {
      setProgress(next);
      setDone(false);
      writeProgress(studyId, next);
    },
    [studyId]
  );

  const step = progress ? INTERFACE_TOUR_STEPS[progress.step] : undefined;
  const isLast = !!progress && progress.step === INTERFACE_TOUR_STEPS.length - 1;

  const goTo = useCallback(
    (index: number) => update({ step: index, open: true }),
    [update]
  );

  // Check the current step's goal a few times a second.
  useEffect(() => {
    if (!progress?.open || !step?.isDone || done) return;
    const check = () => {
      const { ctxSelectedWords: selected, ctxStudyMetadata: metadata, infoPaneAction: pane } = live.current;
      const words = metadata?.words ?? {};
      const snapshot: TourSnapshot = {
        selectedWordCount: selected?.length ?? 0,
        anyWordFilled: Object.values(words).some((w) => !!w?.color?.fill),
        wordInfoOpen:
          document.querySelector('[data-tour="word-info"]')?.getAttribute("aria-expanded") === "true",
        infoPaneAction: pane,
      };
      if (step.isDone?.(snapshot)) setDone(true);
    };
    check();
    const id = window.setInterval(check, 300);
    return () => window.clearInterval(id);
  }, [progress?.open, step, done]);

  if (!progress || !step) return null;

  const close = () => update({ ...progress, open: false });
  const restart = () => goTo(0);
  const interactiveIndex = INTERACTIVE_IDS.indexOf(step.id);

  const actions = isLast ? (
    <>
      <button type="button" className={tourSecondaryButton} onClick={restart}>
        Restart
      </button>
      <button type="button" className={tourSecondaryButton} onClick={close}>
        Keep exploring
      </button>
      <button
        type="button"
        className={tourPrimaryButton}
        onClick={() => {
          close();
          setCloneStudyOpen(true);
        }}
      >
        Copy to My Studies
      </button>
    </>
  ) : (
    <>
      {progress.step > 0 && (
        <button type="button" className={tourSecondaryButton} onClick={() => goTo(progress.step - 1)}>
          Back
        </button>
      )}
      <button type="button" className={tourPrimaryButton} onClick={() => goTo(progress.step + 1)}>
        {progress.step === 0 ? "Start" : !step.isDone ? "Next" : done ? "Continue" : "Skip"}
      </button>
    </>
  );

  return (
    <>
      {progress.open && (
        <TourOverlay
          target={step.target}
          title={step.title}
          body={step.body}
          progress={interactiveIndex >= 0 ? `Step ${interactiveIndex + 1} of ${INTERACTIVE_IDS.length}` : undefined}
          done={done}
          clearance={step.clearance}
          dim={step.dim}
          onClose={close}
          actions={actions}
        />
      )}

      {!progress.open && (
        <div className="fixed bottom-20 left-4 z-50 flex items-center gap-3 rounded-full border border-primary/40 bg-white py-1.5 pl-4 pr-1.5 text-sm text-slate-600 shadow-default dark:bg-boxdark dark:text-bodydark">
          <span>Practice copy: changes aren&rsquo;t saved</span>
          <button
            type="button"
            onClick={() => goTo(isLast ? 0 : progress.step)}
            className="flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 font-medium text-primary transition hover:bg-primary hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <IconRoute size={16} stroke={2.2} />
            {isLast ? "Restart tour" : "Resume tour"}
          </button>
        </div>
      )}
    </>
  );
};

export default InterfaceTour;
