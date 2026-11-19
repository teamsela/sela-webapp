"use client";

import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { IconRoute } from "@tabler/icons-react";

import { FormatContext } from "@/components/StudyPane";
import { InfoPaneActionType } from "@/lib/types";
import NewStudyModal from "@/components/Modals/NewStudy";
import {
  buildTourSnapshot,
  isActionStep,
  isStepDone,
  resolveBody,
  resolveResult,
  resolveTarget,
  type TourDefinition,
  type TourSnapshot,
  type TourStep,
} from "@/lib/tutorials/tour";
import type { PracticeControls, PracticeState } from "@/lib/tutorials/practiceState";
import TourOverlay, { tourPrimaryButton, tourSecondaryButton } from "./TourOverlay";

/*
  Runs a tutorial's guided tour (see lib/tutorials/tours.ts) while a tutorial study is in practice mode.

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

const storageKey = (tourId: string, studyId: string) => `sela.tour.${tourId}.${studyId}`;

const readProgress = (key: string, stepCount: number): TourProgress => {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) ?? "null");
    if (parsed && typeof parsed.step === "number" && typeof parsed.open === "boolean") {
      return {
        step: Math.min(Math.max(parsed.step, 0), stepCount - 1),
        open: parsed.open,
      };
    }
  } catch {
    // fall through to a fresh start
  }
  return { step: 0, open: true };
};

const writeProgress = (key: string, progress: TourProgress) => {
  try {
    window.localStorage.setItem(key, JSON.stringify(progress));
  } catch {
    // progress just won't survive a reload
  }
};

type Checkpoints = Record<string, PracticeState>;

const checkpointKey = (key: string) => `${key}.checkpoints`;

const readCheckpoints = (key: string): Checkpoints => {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(checkpointKey(key)) ?? "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
};

const writeCheckpoints = (key: string, checkpoints: Checkpoints) => {
  try {
    window.localStorage.setItem(checkpointKey(key), JSON.stringify(checkpoints));
  } catch {
    // too big or storage blocked: Back/reload just won't restore
  }
};

/** Keep checkpoints up to and including `step`; later ones are out of date. */
const keepUpTo = (checkpoints: Checkpoints, step: number): Checkpoints =>
  Object.fromEntries(Object.entries(checkpoints).filter(([k]) => Number(k) <= step));

/** Run a step's start-up tidying (see TourStep.onStart). */
const tidyFor = (steps: TourStep[], index: number, practice: PracticeControls) => {
  const onStart = steps[index]?.onStart;
  if (onStart?.clearSelection) practice.clearSelection();
  if (onStart?.closeInfoPane) practice.closeInfoPane();
};

const InterfaceTour = ({
  tour,
  studyId,
  infoPaneAction,
  setCloneStudyOpen,
  practice,
}: {
  tour: TourDefinition;
  studyId: string;
  infoPaneAction: InfoPaneActionType;
  setCloneStudyOpen: (open: boolean) => void;
  practice: PracticeControls;
}) => {
  const practiceRef = useRef(practice);
  practiceRef.current = practice;
  const ctx = useContext(FormatContext);
  const steps = tour.steps;
  const key = storageKey(tour.id, studyId);
  const actionStepIds = useMemo(() => steps.filter(isActionStep).map((s) => s.id), [steps]);
  const [newStudyOpen, setNewStudyOpen] = useState(false);

  const [progress, setProgress] = useState<TourProgress | null>(null);
  const [snapshot, setSnapshot] = useState<TourSnapshot | null>(null);
  const [start, setStart] = useState<TourSnapshot | null>(null);
  // Which step `start` (and so `snapshot`) belongs to. Until the new step's
  // start snapshot is in, the screen readings are the previous step's.
  const [startStepId, setStartStepId] = useState<string | null>(null);

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
      colorAction: c.ctxColorAction,
      infoPaneAction: pane,
      esvOpen: !!document.querySelector('[data-tour="esv-popover"][data-open="true"]'),
      wordInfoOpen:
        document.querySelector('[data-tour="word-info"]')?.getAttribute("aria-expanded") === "true",
      // Notes shown on screen (with the notes button on, every strophe's note is
      // rendered and the closed ones hidden with display: none).
      openNoteStropheIds: Array.from(document.querySelectorAll('[data-tour="strophe-note"]')).flatMap((el) => {
        if (el.getClientRects().length === 0) return [];
        const id = el.closest("[data-strophe-block]")?.getAttribute("data-strophe-block");
        return id == null ? [] : [Number(id)];
      }),
      openSyntaxSections: Array.from(
        document.querySelectorAll('[data-tour="syntax-section"][aria-expanded="true"]')
      ).map((el) => el.getAttribute("data-section-id") ?? ""),
      activeHighlights: { ...(c.ctxActiveHighlightIds ?? {}) },
    });
  }, []);

  // Start (or resume) the tour, putting back the passage as it was when the
  // current step began.
  useEffect(() => {
    const saved = readProgress(key, steps.length);
    let checkpoints = readCheckpoints(key);
    if (!checkpoints["0"]) {
      checkpoints = { "0": practiceRef.current.capture() };
      writeCheckpoints(key, checkpoints);
    }
    const resumeAt = checkpoints[String(saved.step)] ? saved.step : 0;
    if (resumeAt > 0) practiceRef.current.restore(checkpoints[String(resumeAt)]);
    tidyFor(steps, resumeAt, practiceRef.current);
    const next = { step: resumeAt, open: saved.open };
    setProgress(next);
    writeProgress(key, next);
  }, [key, steps]);

  const update = useCallback(
    (next: TourProgress) => {
      setProgress(next);
      writeProgress(key, next);
    },
    [key]
  );

  const step = progress ? steps[progress.step] : undefined;
  const isLast = !!progress && progress.step === steps.length - 1;

  // A fresh "start" snapshot whenever a step begins (or the tour reopens).
  // Taken a moment later, so a just-restored passage has finished laying out.
  useEffect(() => {
    if (!progress?.open) return;
    const stepId = steps[progress.step]?.id ?? null;
    setStartStepId(null);
    const id = window.setTimeout(() => {
      const now = takeSnapshot();
      setStart(now);
      setSnapshot(now);
      setStartStepId(stepId);
    }, 150);
    return () => window.clearTimeout(id);
  }, [progress?.step, progress?.open, steps, takeSnapshot]);

  // Watch the screen a few times a second while an action step is showing.
  useEffect(() => {
    if (!progress?.open || !step || !isActionStep(step)) return;
    const id = window.setInterval(() => setSnapshot(takeSnapshot()), 300);
    return () => window.clearInterval(id);
  }, [progress?.open, step, takeSnapshot]);

  const goTo = useCallback(
    (index: number) => {
      const current = progress?.step ?? 0;
      let checkpoints = readCheckpoints(key);
      if (index > current) {
        // Moving on: remember how the passage looks as the new step begins.
        checkpoints = { ...keepUpTo(checkpoints, current), [String(index)]: practiceRef.current.capture() };
      } else if (index < current) {
        // Going back: put the passage back as it was when that step began.
        const saved = checkpoints[String(index)];
        if (saved) practiceRef.current.restore(saved);
        checkpoints = keepUpTo(checkpoints, index);
      }
      writeCheckpoints(key, checkpoints);
      if (index !== current) tidyFor(steps, index, practiceRef.current);
      update({ step: index, open: true });
    },
    [progress?.step, key, steps, update]
  );

  // A step counts as done only once the user has done it: the screen must
  // first be seen not done (on this step's own readings), then done. So a
  // step never says "Nice, that's it" before anything was clicked. Once done,
  // it stays done even if the user keeps experimenting.
  const [armedStepId, setArmedStepId] = useState<string | null>(null);
  const [doneStepId, setDoneStepId] = useState<string | null>(null);
  const current = !!step && startStepId === step.id && !!snapshot && !!start;
  useEffect(() => {
    if (!current || !step || !snapshot || !start || !isActionStep(step)) return;
    if (!isStepDone(step, snapshot, start)) setArmedStepId(step.id);
    else if (armedStepId === step.id) setDoneStepId(step.id);
  }, [current, step, snapshot, start, armedStepId]);

  if (!progress || !step) return null;

  const done = doneStepId === step.id;
  const resultTarget = done ? resolveResult(step, snapshot, start) : undefined;
  const showResult = !!resultTarget;
  const close = () => update({ ...progress, open: false });
  const restart = () => goTo(0);
  const actionIndex = actionStepIds.indexOf(step.id);

  const checklist =
    step.checks && snapshot && start
      ? step.checks.map((c) => ({ label: c.label, done: done || (current && c.isDone(snapshot, start)) }))
      : undefined;

  const actions = isLast && tour.finish === "next" ? (
    <>
      <button type="button" className={tourSecondaryButton} onClick={restart}>
        Restart
      </button>
      <Link href="/dashboard/home" className={tourSecondaryButton}>
        More tutorials
      </Link>
      <button
        type="button"
        className={tourPrimaryButton}
        onClick={() => {
          close();
          setNewStudyOpen(true);
        }}
      >
        Start your own study
      </button>
    </>
  ) : isLast ? (
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
      ? `${step.section} · Task ${actionIndex + 1} of ${actionStepIds.length}`
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
          interactive={isActionStep(step)}
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
      {tour.finish === "next" && <NewStudyModal open={newStudyOpen} setOpen={setNewStudyOpen} />}
    </>
  );
};

export default InterfaceTour;
