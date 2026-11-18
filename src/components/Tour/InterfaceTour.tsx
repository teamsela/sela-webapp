"use client";

import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { IconRoute } from "@tabler/icons-react";

import { FormatContext } from "@/components/StudyPane";
import { InfoPaneActionType } from "@/lib/types";
import {
  INTERFACE_TOUR_ID,
  INTERFACE_TOUR_STEPS,
  buildTourSnapshot,
  isActionStep,
  isStepDone,
  resolveBody,
  resolveResult,
  resolveTarget,
  type TourSnapshot,
} from "@/lib/tutorials/interfaceTour";
import type { PracticeControls, PracticeState } from "@/lib/tutorials/practiceState";
import TourOverlay, { tourPrimaryButton, tourSecondaryButton } from "./TourOverlay";

/*
  Runs the Interface Tutorial tour while a tutorial study is in practice mode.

  Progress (current step, closed or not) is kept per browser, so leaving and
  coming back resumes the tour. A step the user has to do is checked a few
  times a second against what the study screen shows; once it is done the
  bubble confirms it and the button becomes Continue, and the tour waits for
  the user. Steps can compare against a snapshot taken when they began (for
  "make two more strophes" or "merge two stanzas"). A small pill above the
  footer says this is a practice copy and reopens the tour.

  Checkpoints: practice changes are never saved to the database, so the study
  state is saved here (per browser) at the start of every step. Back puts the
  previous step's starting state back, and a reload puts the current step's
  starting state back, so the passage always matches the step being shown.
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

type Checkpoints = Record<string, PracticeState>;

const checkpointKey = (studyId: string) => `${storageKey(studyId)}.checkpoints`;

const readCheckpoints = (studyId: string): Checkpoints => {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(checkpointKey(studyId)) ?? "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
};

const writeCheckpoints = (studyId: string, checkpoints: Checkpoints) => {
  try {
    window.localStorage.setItem(checkpointKey(studyId), JSON.stringify(checkpoints));
  } catch {
    // too big or storage blocked: Back/reload just won't restore
  }
};

/** Keep checkpoints up to and including `step`; later ones are out of date. */
const keepUpTo = (checkpoints: Checkpoints, step: number): Checkpoints =>
  Object.fromEntries(Object.entries(checkpoints).filter(([k]) => Number(k) <= step));

const ACTION_STEP_IDS = INTERFACE_TOUR_STEPS.filter(isActionStep).map((s) => s.id);

const InterfaceTour = ({
  studyId,
  infoPaneAction,
  setCloneStudyOpen,
  practice,
}: {
  studyId: string;
  infoPaneAction: InfoPaneActionType;
  setCloneStudyOpen: (open: boolean) => void;
  practice: PracticeControls;
}) => {
  const practiceRef = useRef(practice);
  practiceRef.current = practice;
  const ctx = useContext(FormatContext);

  const [progress, setProgress] = useState<TourProgress | null>(null);
  const [snapshot, setSnapshot] = useState<TourSnapshot | null>(null);
  const [start, setStart] = useState<TourSnapshot | null>(null);

  // Latest screen state for the polling check (metadata is sometimes mutated
  // in place, so it is read fresh on every tick rather than via React deps).
  const live = useRef({ ctx, infoPaneAction });
  live.current = { ctx, infoPaneAction };

  const takeSnapshot = useCallback((): TourSnapshot => {
    const { ctx: c, infoPaneAction: pane } = live.current;
    return buildTourSnapshot({
      languageMode: c.ctxLanguageMode,
      nonEnglishDisplayMode: c.ctxNonEnglishDisplayMode,
      passageProps: c.ctxPassageProps,
      selectedWords: c.ctxSelectedWords,
      studyMetadata: c.ctxStudyMetadata,
      boxStyle: c.ctxBoxDisplayConfig?.style,
      notesOn: !!c.ctxStropheNoteBtnOn,
      studyNotes: c.ctxStudyNotes,
      layers: c.ctxLayers,
      activeLayerId: c.ctxActiveLayerId,
      selectedStropheIds: (c.ctxSelectedStrophes ?? []).map((sp: { stropheId: number }) => sp.stropheId),
      infoPaneAction: pane,
      esvOpen: !!document.querySelector('[data-tour="esv-popover"][data-open="true"]'),
      wordInfoOpen:
        document.querySelector('[data-tour="word-info"]')?.getAttribute("aria-expanded") === "true",
    });
  }, []);

  // Start (or resume) the tour, putting back the passage as it was when the
  // current step began.
  useEffect(() => {
    const saved = readProgress(studyId);
    let checkpoints = readCheckpoints(studyId);
    if (!checkpoints["0"]) {
      checkpoints = { "0": practiceRef.current.capture() };
      writeCheckpoints(studyId, checkpoints);
    }
    const resumeAt = checkpoints[String(saved.step)] ? saved.step : 0;
    if (resumeAt > 0) practiceRef.current.restore(checkpoints[String(resumeAt)]);
    const next = { step: resumeAt, open: saved.open };
    setProgress(next);
    writeProgress(studyId, next);
  }, [studyId]);

  const update = useCallback(
    (next: TourProgress) => {
      setProgress(next);
      writeProgress(studyId, next);
    },
    [studyId]
  );

  const step = progress ? INTERFACE_TOUR_STEPS[progress.step] : undefined;
  const isLast = !!progress && progress.step === INTERFACE_TOUR_STEPS.length - 1;

  // A fresh "start" snapshot whenever a step begins (or the tour reopens).
  // Taken a moment later, so a just-restored passage has finished laying out.
  useEffect(() => {
    if (!progress?.open) return;
    const id = window.setTimeout(() => {
      const now = takeSnapshot();
      setStart(now);
      setSnapshot(now);
    }, 150);
    return () => window.clearTimeout(id);
  }, [progress?.step, progress?.open, takeSnapshot]);

  // Watch the screen a few times a second while an action step is showing.
  useEffect(() => {
    if (!progress?.open || !step || !isActionStep(step)) return;
    const id = window.setInterval(() => setSnapshot(takeSnapshot()), 300);
    return () => window.clearInterval(id);
  }, [progress?.open, step, takeSnapshot]);

  const goTo = useCallback(
    (index: number) => {
      const current = progress?.step ?? 0;
      let checkpoints = readCheckpoints(studyId);
      if (index > current) {
        // Moving on: remember how the passage looks as the new step begins.
        checkpoints = { ...keepUpTo(checkpoints, current), [String(index)]: practiceRef.current.capture() };
      } else if (index < current) {
        // Going back: put the passage back as it was when that step began.
        const saved = checkpoints[String(index)];
        if (saved) practiceRef.current.restore(saved);
        checkpoints = keepUpTo(checkpoints, index);
      }
      writeCheckpoints(studyId, checkpoints);
      update({ step: index, open: true });
    },
    [progress?.step, studyId, update]
  );

  // Once done, stay done for this step even if the user keeps experimenting.
  const [doneStepId, setDoneStepId] = useState<string | null>(null);
  useEffect(() => {
    if (step && snapshot && start && isActionStep(step) && isStepDone(step, snapshot, start)) {
      setDoneStepId(step.id);
    }
  }, [step, snapshot, start]);

  if (!progress || !step) return null;

  const done = doneStepId === step.id;
  const resultTarget = done ? resolveResult(step, snapshot, start) : undefined;
  const showResult = !!resultTarget;
  const close = () => update({ ...progress, open: false });
  const restart = () => goTo(0);
  const actionIndex = ACTION_STEP_IDS.indexOf(step.id);

  const checklist =
    step.checks && snapshot && start
      ? step.checks.map((c) => ({ label: c.label, done: done || c.isDone(snapshot, start) }))
      : undefined;

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
        {progress.step === 0 ? "Start" : !isActionStep(step) ? "Next" : done ? "Continue" : "Skip"}
      </button>
    </>
  );

  const progressLabel =
    actionIndex >= 0
      ? `${step.section} · Task ${actionIndex + 1} of ${ACTION_STEP_IDS.length}`
      : progress.step > 0 && !isLast
        ? step.section
        : undefined;

  return (
    <>
      {progress.open && (
        <TourOverlay
          target={resolveTarget(step, snapshot, start)}
          highlight={showResult ? resultTarget : undefined}
          tone={showResult ? "result" : "target"}
          allow={step.allow}
          title={step.title}
          body={resolveBody(step, snapshot, start)}
          checklist={checklist}
          progress={progressLabel}
          done={done}
          clearance={step.clearance}
          dim={step.dim}
          placement={step.placement}
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
            {isLast ? "Restart tutorial" : "Resume tutorial"}
          </button>
        </div>
      )}
    </>
  );
};

export default InterfaceTour;
