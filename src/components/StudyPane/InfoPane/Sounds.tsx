"use client";

import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

import { FormatContext } from "..";
import AccordionToggleIcon from "./common/AccordionToggleIcon";

enum SoundsSection {
  readAloud = "read-aloud",
  wordplays = "wordplays",
}

type ReadAloudButtonState = "ready" | "disabled" | "playing";

const sectionButtonClassName =
  "ClickBlock flex w-full items-center gap-2 px-2 py-4 text-left text-sm font-medium md:text-base";

const sectionLabelClassName = (isOpen: boolean) =>
  isOpen ? "text-primary" : "text-black dark:text-white";

type SpeedPopoverPosition = {
  top: number;
  left: number;
};

type SpeechChunk = {
  wordIds: number[];
  text: string;
};

type SpeechWord = {
  wordId: number;
  text: string;
};

type AzureWordBoundary = {
  audioOffsetMs: number;
  text: string;
  textOffset: number;
  wordLength: number;
};

type TtsEngine = "azure" | "browser";

const TTS_ADONAI_TEXT = "אֲדֹנָי";

const getTtsWordText = (word: { gloss?: string; wlcWord: string }) => {
  const gloss = word.gloss?.trim().toLowerCase();
  if (gloss && /\byahweh\b|\byaweh\b/.test(gloss)) {
    return TTS_ADONAI_TEXT;
  }

  return word.wlcWord.trim();
};

const ReadAloudButtonIcon = ({ state }: { state: ReadAloudButtonState }) => {
  if (state === "playing") {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 192 192"
        className="h-[3.67rem] w-[3.67rem] sm:h-16 sm:w-16"
      >
        <circle cx="96" cy="96" r="96" fill="#F9C62B" />
        <circle cx="96" cy="96" r="58" fill="#FFFFFF" />
        <circle
          cx="96"
          cy="96"
          r="70"
          fill="none"
          stroke="#5E5E5E"
          strokeWidth="22"
        />
        <rect x="68" y="68" width="56" height="56" fill="#5E5E5E" />
      </svg>
    );
  }

  const outerFill = state === "ready" ? "#F9C62B" : "#D9D9D9";
  const ringStroke = state === "ready" ? "#5E5E5E" : "#BCBCBC";
  const iconFill = state === "ready" ? "#5E5E5E" : "#BCBCBC";

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 192 192"
      className="h-[3.67rem] w-[3.67rem] sm:h-16 sm:w-16"
    >
      <circle cx="96" cy="96" r="96" fill={outerFill} />
      <circle cx="96" cy="96" r="58" fill="#FFFFFF" />
      <circle
        cx="96"
        cy="96"
        r="70"
        fill="none"
        stroke={ringStroke}
        strokeWidth="22"
      />
      <path
        d="M73 61.5C73 57.6129 77.2944 55.2465 80.5923 57.3254L127.258 86.8254C130.318 88.7592 130.318 93.2408 127.258 95.1746L80.5923 124.675C77.2944 126.753 73 124.387 73 120.5V61.5Z"
        fill={iconFill}
      />
    </svg>
  );
};

const ReadAloudButton = ({
  state,
  disabled,
  onClick,
}: {
  state: ReadAloudButtonState;
  disabled: boolean;
  onClick: () => void;
}) => {
  const label =
    state === "disabled"
      ? "Read aloud unavailable"
      : state === "playing"
        ? "Stop read aloud"
        : "Start read aloud";

  return (
    <button
      type="button"
      disabled={disabled}
      aria-label={label}
      className="flex items-center justify-center transition disabled:cursor-not-allowed"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onClick();
      }}
    >
      <ReadAloudButtonIcon state={state} />
    </button>
  );
};

const Sounds = () => {
  const {
    ctxSelectedWords,
    ctxSelectedStrophes,
    ctxSetCurrentSpokenWordIds,
  } = useContext(FormatContext);
  const [openSection, setOpenSection] = useState<SoundsSection | null>(
    SoundsSection.readAloud,
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [speechRate, setSpeechRate] = useState(1);
  const [isSpeedSelectorOpen, setIsSpeedSelectorOpen] = useState(false);
  const [speedPopoverPosition, setSpeedPopoverPosition] =
    useState<SpeedPopoverPosition | null>(null);
  const [isSpeechSynthesisAvailable, setIsSpeechSynthesisAvailable] =
    useState(false);
  const [isAzureTtsAvailable, setIsAzureTtsAvailable] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>(
    [],
  );
  const [ttsError, setTtsError] = useState<string | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const fetchAbortControllerRef = useRef<AbortController | null>(null);
  const highlightFrameRef = useRef<number | null>(null);
  const speechChunksRef = useRef<SpeechChunk[]>([]);
  const speechWordsRef = useRef<SpeechWord[]>([]);
  const azureSpeechTextRef = useRef("");
  const currentWordIndexRef = useRef(0);
  const currentChunkIndexRef = useRef(0);
  const playbackSessionRef = useRef(0);
  const speedSelectorRef = useRef<HTMLDivElement | null>(null);
  const speedTriggerRef = useRef<HTMLButtonElement | null>(null);
  const playbackEngineRef = useRef<TtsEngine | null>(null);

  const hasReadAloudSelection =
    ctxSelectedWords.length > 0 || ctxSelectedStrophes.length > 0;

  const selectedSpeechChunks = useMemo<SpeechChunk[]>(() => {
    if (ctxSelectedStrophes.length > 0) {
      return [...ctxSelectedStrophes]
        .sort((a, b) => a.stropheId - b.stropheId)
        .flatMap((strophe) =>
          [...strophe.lines]
            .sort((a, b) => a.lineId - b.lineId)
            .map((line) => {
              const sortedWords = [...line.words].sort((a, b) => a.wordId - b.wordId);
              return {
                wordIds: sortedWords.map((word) => word.wordId),
                text: sortedWords.map(getTtsWordText).filter(Boolean).join(" "),
              };
            }),
        )
        .filter((chunk) => chunk.text);
    }

    const wordsByLine = new Map<string, SpeechChunk>();

    [...ctxSelectedWords]
      .sort((a, b) => a.wordId - b.wordId)
      .forEach((word) => {
        const lineKey = `${word.stropheId}:${word.lineId}`;
        const existingChunk = wordsByLine.get(lineKey);
        if (existingChunk) {
          existingChunk.wordIds.push(word.wordId);
          existingChunk.text = `${existingChunk.text} ${getTtsWordText(word)}`.trim();
          return;
        }

        wordsByLine.set(lineKey, {
          wordIds: [word.wordId],
          text: getTtsWordText(word),
        });
      });

    return Array.from(wordsByLine.values()).filter((chunk) => chunk.text);
  }, [ctxSelectedStrophes, ctxSelectedWords]);

  const selectedSpeechWords = useMemo<SpeechWord[]>(() => {
    if (ctxSelectedStrophes.length > 0) {
      return [...ctxSelectedStrophes]
        .sort((a, b) => a.stropheId - b.stropheId)
        .flatMap((strophe) =>
          [...strophe.lines]
            .sort((a, b) => a.lineId - b.lineId)
            .flatMap((line) =>
              [...line.words]
                .sort((a, b) => a.wordId - b.wordId)
                .map((word) => ({
                  wordId: word.wordId,
                  text: getTtsWordText(word),
                })),
            ),
        )
        .filter((word) => word.text);
    }

    return [...ctxSelectedWords]
      .sort((a, b) => a.wordId - b.wordId)
      .map((word) => ({
        wordId: word.wordId,
        text: getTtsWordText(word),
      }))
      .filter((word) => word.text);
  }, [ctxSelectedStrophes, ctxSelectedWords]);

  const selectedAzureSpeechText = useMemo(
    () => selectedSpeechChunks.map((chunk) => chunk.text).join("\n"),
    [selectedSpeechChunks],
  );

  const isReadAloudAvailable = isAzureTtsAvailable || isSpeechSynthesisAvailable;

  const readAloudState: ReadAloudButtonState = isPlaying
    ? "playing"
    : hasReadAloudSelection && isReadAloudAvailable
      ? "ready"
      : "disabled";

  const toggleSection = (section: SoundsSection) => {
    setOpenSection((prev) => (prev === section ? null : section));
  };

  const cleanupAudioPlayback = useCallback(() => {
    fetchAbortControllerRef.current?.abort();
    fetchAbortControllerRef.current = null;

    if (typeof window !== "undefined" && highlightFrameRef.current !== null) {
      window.cancelAnimationFrame(highlightFrameRef.current);
      highlightFrameRef.current = null;
    }

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }

    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
  }, []);

  const startAzureHighlight = useCallback((
    audio: HTMLAudioElement,
    words: SpeechWord[],
    wordBoundaries: AzureWordBoundary[],
    playbackSession: number,
  ) => {
    if (!words.length) {
      ctxSetCurrentSpokenWordIds([]);
      return;
    }

    const timedWords = words.map((word, index) => ({
      audioOffsetMs:
        wordBoundaries[index]?.audioOffsetMs ??
        ((audio.duration * 1000) / Math.max(words.length, 1)) * index,
      wordId: word.wordId,
    }));

    currentWordIndexRef.current = 0;
    ctxSetCurrentSpokenWordIds([timedWords[0].wordId]);

    const tick = () => {
      if (playbackSessionRef.current !== playbackSession || audioRef.current !== audio) {
        return;
      }

      const currentTimeMs = audio.currentTime * 1000;
      let nextWordIndex = currentWordIndexRef.current;
      while (
        nextWordIndex + 1 < timedWords.length &&
        currentTimeMs >= timedWords[nextWordIndex + 1].audioOffsetMs
      ) {
        nextWordIndex += 1;
      }

      if (nextWordIndex !== currentWordIndexRef.current) {
        currentWordIndexRef.current = nextWordIndex;
        ctxSetCurrentSpokenWordIds([timedWords[nextWordIndex].wordId]);
      }

      if (!audio.paused && !audio.ended) {
        highlightFrameRef.current = window.requestAnimationFrame(tick);
      }
    };

    if (typeof window !== "undefined") {
      highlightFrameRef.current = window.requestAnimationFrame(tick);
    }
  }, [ctxSetCurrentSpokenWordIds]);

  const stopPlayback = useCallback(() => {
    playbackSessionRef.current += 1;
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    cleanupAudioPlayback();
    utteranceRef.current = null;
    playbackEngineRef.current = null;
    ctxSetCurrentSpokenWordIds([]);
    currentChunkIndexRef.current = 0;
    setIsPlaying(false);
  }, [cleanupAudioPlayback, ctxSetCurrentSpokenWordIds]);

  const speakChunk = useCallback((
    chunkIndex: number,
    chunks: SpeechChunk[],
    rate: number,
    speechSynthesis: SpeechSynthesis,
    playbackSession: number,
  ) => {
    if (playbackSessionRef.current !== playbackSession) {
      return;
    }

    if (chunkIndex >= chunks.length) {
      utteranceRef.current = null;
      ctxSetCurrentSpokenWordIds([]);
      currentChunkIndexRef.current = 0;
      setIsPlaying(false);
      return;
    }

    currentChunkIndexRef.current = chunkIndex;
    ctxSetCurrentSpokenWordIds(chunks[chunkIndex].wordIds);

    const utterance = new SpeechSynthesisUtterance(chunks[chunkIndex].text);
    utterance.lang = "he-IL";
    utterance.rate = rate;
    const preferredVoice =
      availableVoices.find((voice) => voice.lang === "he-IL") ||
      availableVoices.find((voice) => voice.lang.toLowerCase().startsWith("he"));
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onend = () => {
      if (playbackSessionRef.current !== playbackSession) {
        return;
      }
      utteranceRef.current = null;
      speakChunk(chunkIndex + 1, chunks, rate, speechSynthesis, playbackSession);
    };
    utterance.onerror = () => {
      if (playbackSessionRef.current !== playbackSession) {
        return;
      }
      utteranceRef.current = null;
      ctxSetCurrentSpokenWordIds([]);
      currentChunkIndexRef.current = 0;
      setIsPlaying(false);
    };

    utteranceRef.current = utterance;
    speechSynthesis.speak(utterance);
  }, [availableVoices, ctxSetCurrentSpokenWordIds]);

  const handleReadAloudClick = () => {
    if (isPlaying) {
      stopPlayback();
      return;
    }

    if (
      !isReadAloudAvailable ||
      selectedSpeechChunks.length === 0
    ) {
      return;
    }

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    cleanupAudioPlayback();
    ctxSetCurrentSpokenWordIds([]);
    setTtsError(null);
    const chunks = selectedSpeechChunks;
    const words = selectedSpeechWords;

    speechChunksRef.current = chunks;
    speechWordsRef.current = words;
    azureSpeechTextRef.current = selectedAzureSpeechText;
    currentChunkIndexRef.current = 0;
    currentWordIndexRef.current = 0;
    playbackSessionRef.current += 1;
    const playbackSession = playbackSessionRef.current;
    setIsPlaying(true);
    playbackEngineRef.current = isAzureTtsAvailable ? "azure" : "browser";

    if (isAzureTtsAvailable) {
      void speakChunkWithAzure(
        selectedAzureSpeechText,
        words,
        speechRate,
        playbackSession,
      );
      return;
    }

    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setIsPlaying(false);
      return;
    }

    speakChunk(0, chunks, speechRate, window.speechSynthesis, playbackSession);
  };

  const speakChunkWithAzure = useCallback(async (
    text: string,
    words: SpeechWord[],
    rate: number,
    playbackSession: number,
  ) => {
    if (playbackSessionRef.current !== playbackSession) {
      return;
    }

    if (!text.trim() || !words.length) {
      cleanupAudioPlayback();
      playbackEngineRef.current = null;
      ctxSetCurrentSpokenWordIds([]);
      currentWordIndexRef.current = 0;
      setIsPlaying(false);
      return;
    }

    currentWordIndexRef.current = 0;
    ctxSetCurrentSpokenWordIds([words[0].wordId]);

    const controller = new AbortController();
    fetchAbortControllerRef.current = controller;

    try {
      const response = await fetch("/api/tts/azure", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          speakingRate: rate,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        let errorMessage = "Azure Speech could not synthesize this selection.";

        try {
          const errorPayload = (await response.json()) as { error?: string };
          if (errorPayload.error) {
            errorMessage = errorPayload.error;
          }
        } catch {
          // Ignore parse failures and keep the fallback message.
        }

        throw new Error(errorMessage);
      }

      const data = (await response.json()) as {
        audioContent?: string;
        contentType?: string;
        wordBoundaries?: AzureWordBoundary[];
      };

      if (!data.audioContent) {
        throw new Error("Azure Speech returned no audio content.");
      }

      if (playbackSessionRef.current !== playbackSession) {
        return;
      }

      cleanupAudioPlayback();
      const audioBytes = Uint8Array.from(atob(data.audioContent), (char) =>
        char.charCodeAt(0),
      );
      const blob = new Blob([audioBytes], {
        type: data.contentType || "audio/mpeg",
      });
      const audioUrl = URL.createObjectURL(blob);
      const audio = new Audio(audioUrl);
      audioUrlRef.current = audioUrl;
      audioRef.current = audio;
      fetchAbortControllerRef.current = null;

      let highlightStarted = false;
      const initializeHighlight = () => {
        if (highlightStarted) {
          return;
        }

        if (!Number.isFinite(audio.duration) || audio.duration <= 0) {
          return;
        }

        highlightStarted = true;
        startAzureHighlight(audio, words, data.wordBoundaries ?? [], playbackSession);
      };

      audio.onloadedmetadata = initializeHighlight;
      audio.ondurationchange = initializeHighlight;

      audio.onended = () => {
        if (playbackSessionRef.current !== playbackSession) {
          return;
        }

        audio.onended = null;
        audio.onerror = null;
        cleanupAudioPlayback();
        playbackEngineRef.current = null;
        ctxSetCurrentSpokenWordIds([]);
        currentWordIndexRef.current = 0;
        setTtsError(null);
        setIsPlaying(false);
      };

      audio.onerror = () => {
        if (playbackSessionRef.current !== playbackSession) {
          return;
        }

        const finishedNaturally =
          audio.ended ||
          (Number.isFinite(audio.duration) &&
            audio.duration > 0 &&
            audio.currentTime >= audio.duration - 0.05);

        if (finishedNaturally) {
          audio.onended = null;
          audio.onerror = null;
          cleanupAudioPlayback();
          playbackEngineRef.current = null;
          ctxSetCurrentSpokenWordIds([]);
          currentWordIndexRef.current = 0;
          setTtsError(null);
          setIsPlaying(false);
          return;
        }

        audio.onended = null;
        audio.onerror = null;
        cleanupAudioPlayback();
        playbackEngineRef.current = null;
        ctxSetCurrentSpokenWordIds([]);
        currentWordIndexRef.current = 0;
        setTtsError("Azure Speech playback failed.");
        setIsPlaying(false);
      };

      await audio.play();
      initializeHighlight();
    } catch (error) {
      if (controller.signal.aborted) {
        return;
      }

      cleanupAudioPlayback();
      playbackEngineRef.current = null;
      ctxSetCurrentSpokenWordIds([]);
      currentWordIndexRef.current = 0;
      setTtsError(
        error instanceof Error
          ? error.message
          : "Azure Speech playback failed unexpectedly.",
      );
      setIsPlaying(false);
    }
  }, [
    cleanupAudioPlayback,
    ctxSetCurrentSpokenWordIds,
    startAzureHighlight,
  ]);

  useEffect(() => {
    if (!hasReadAloudSelection && isPlaying) {
      stopPlayback();
    }
  }, [hasReadAloudSelection, isPlaying, stopPlayback]);

  useEffect(() => {
    if (!isPlaying) {
      return;
    }

    const chunks = speechChunksRef.current;
    if (!chunks.length) {
      return;
    }
    const restartIndex = currentChunkIndexRef.current;
    playbackSessionRef.current += 1;
    const playbackSession = playbackSessionRef.current;
    setTtsError(null);

    if (playbackEngineRef.current === "azure") {
      cleanupAudioPlayback();
      currentChunkIndexRef.current = 0;
      currentWordIndexRef.current = 0;
      void speakChunkWithAzure(
        azureSpeechTextRef.current,
        speechWordsRef.current,
        speechRate,
        playbackSession,
      );
      return;
    }

    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      return;
    }

    window.speechSynthesis.cancel();
    speakChunk(
      restartIndex,
      chunks,
      speechRate,
      window.speechSynthesis,
      playbackSession,
    );
  }, [
    cleanupAudioPlayback,
    isPlaying,
    speakChunk,
    speakChunkWithAzure,
    speechRate,
  ]);

  useEffect(() => {
    let isMounted = true;

    const loadAzureAvailability = async () => {
      try {
        const response = await fetch("/api/tts/azure", { cache: "no-store" });
        if (!response.ok) {
          throw new Error("Azure availability check failed.");
        }

        const data = (await response.json()) as {
          configured?: boolean;
        };
        if (isMounted) {
          setIsAzureTtsAvailable(Boolean(data.configured));
        }
      } catch {
        if (isMounted) {
          setIsAzureTtsAvailable(false);
        }
      }
    };

    void loadAzureAvailability();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setIsSpeechSynthesisAvailable(false);
      setAvailableVoices([]);
      return;
    }

    const speechSynthesis = window.speechSynthesis;
    const updateVoices = () => {
      const voices = speechSynthesis.getVoices();
      setAvailableVoices(voices);
      setIsSpeechSynthesisAvailable(true);
    };

    updateVoices();
    speechSynthesis.addEventListener("voiceschanged", updateVoices);

    return () => {
      speechSynthesis.removeEventListener("voiceschanged", updateVoices);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      cleanupAudioPlayback();
      ctxSetCurrentSpokenWordIds([]);
    };
  }, [cleanupAudioPlayback, ctxSetCurrentSpokenWordIds]);

  useEffect(() => {
    if (!isSpeedSelectorOpen) {
      return;
    }

    const updatePopoverPosition = () => {
      const trigger = speedTriggerRef.current;
      if (!trigger) {
        return;
      }

      const rect = trigger.getBoundingClientRect();
      setSpeedPopoverPosition({
        top: rect.bottom + 8,
        left: rect.left + rect.width / 2,
      });
    };

    const handlePointerDown = (event: MouseEvent) => {
      if (!speedSelectorRef.current?.contains(event.target as Node)) {
        setIsSpeedSelectorOpen(false);
      }
    };

    updatePopoverPosition();
    document.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("resize", updatePopoverPosition);
    window.addEventListener("scroll", updatePopoverPosition, true);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("resize", updatePopoverPosition);
      window.removeEventListener("scroll", updatePopoverPosition, true);
    };
  }, [isSpeedSelectorOpen]);

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <div className="accordion">
        <div className="mx-4 border-b border-stroke dark:border-strokedark">
          <button
            className={sectionButtonClassName}
            onClick={() => toggleSection(SoundsSection.readAloud)}
          >
            <AccordionToggleIcon
              isOpen={openSection === SoundsSection.readAloud}
            />
            <span
              className={sectionLabelClassName(
                openSection === SoundsSection.readAloud,
              )}
            >
              Read Aloud
            </span>
          </button>
          {openSection === SoundsSection.readAloud && (
            <div className="px-4 pb-6">
              <div className="rounded-sm border border-stroke bg-white p-6 dark:border-strokedark dark:bg-boxdark">
                <div className="flex flex-col gap-5">
                  <div className="flex flex-row items-center justify-center gap-5">
                    <div
                      ref={speedSelectorRef}
                      className="relative flex flex-col items-center gap-2"
                    >
                      <ReadAloudButton
                        state={readAloudState}
                        disabled={readAloudState === "disabled"}
                        onClick={handleReadAloudClick}
                      />
                      <button
                        ref={speedTriggerRef}
                        type="button"
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          setIsSpeedSelectorOpen((prev) => !prev);
                        }}
                        className="rounded-full border border-stroke px-3 py-1 text-xs font-medium text-black transition hover:border-primary hover:text-primary dark:border-strokedark dark:text-white dark:hover:border-primary dark:hover:text-primary"
                        aria-expanded={isSpeedSelectorOpen}
                        aria-label="Adjust speech speed"
                      >
                        {speechRate.toFixed(1)}x
                      </button>
                    </div>
                    <div className="max-w-sm">
                      <p className="text-sm leading-6 text-black dark:text-white">
                        {ttsError
                          ? ttsError
                          : !isReadAloudAvailable
                          ? "Read aloud is unavailable until Azure Speech is configured or a browser voice is available."
                          : isPlaying
                            ? "Read aloud is currently playing. Click the button again to stop."
                            : isAzureTtsAvailable
                              ? "Read aloud uses Azure Speech for Hebrew playback."
                            : hasReadAloudSelection
                              ? "Read aloud is available for the current selection."
                            : "Select a word, multiple words, or a strophe."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mx-4 border-b border-stroke dark:border-strokedark">
          <button
            className={sectionButtonClassName}
            onClick={() => toggleSection(SoundsSection.wordplays)}
          >
            <AccordionToggleIcon
              isOpen={openSection === SoundsSection.wordplays}
            />
            <span
              className={sectionLabelClassName(
                openSection === SoundsSection.wordplays,
              )}
            >
              Wordplays
            </span>
          </button>
          {openSection === SoundsSection.wordplays && (
            <div className="px-4 pb-6">
              <div className="rounded-sm border border-dashed border-stroke bg-white p-4 dark:border-strokedark dark:bg-boxdark">
                <p className="text-sm leading-6 text-black dark:text-white">
                  Wordplay-related audio tools will appear here.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
      {isSpeedSelectorOpen &&
        speedPopoverPosition &&
        createPortal(
          <div
            ref={speedSelectorRef}
            className="fixed z-[1000] w-56 -translate-x-1/2 rounded-lg border border-stroke bg-white p-4 shadow-lg dark:border-strokedark dark:bg-boxdark"
            style={{
              top: speedPopoverPosition.top,
              left: speedPopoverPosition.left,
            }}
          >
            <input
              type="range"
              min="0.5"
              max="1.5"
              step="0.1"
              value={speechRate}
              onChange={(event) => setSpeechRate(Number(event.target.value))}
              className="w-full accent-primary"
              aria-label="Speech speed"
            />
            <div className="mt-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>0.5x</span>
              <span>1.0x</span>
              <span>1.5x</span>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
};

export default Sounds;
