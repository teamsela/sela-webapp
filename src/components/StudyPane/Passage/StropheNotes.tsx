import { useCallback, useContext, useEffect, useRef, useState } from "react"
import { FormatContext } from ".."

// type StropheNotes = { title: string, text: string}
// type StudyNotes = {
//   main: string;
//   strophes: StropheNotes[]
// }

// export const StropheNotes = ({stropheId}: {stropheId: number}) => {
//   const { ctxStudyId, ctxStudyNotes, ctxSetStudyNotes, ctxPassageProps } = useContext(FormatContext)
  

//   const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
//   const pendingPayloadRef = useRef<string | null>(null);   // what we intend to save next
//   const lastSavedPayloadRef = useRef<string | null>(null); // what backend already has

//   const [text, setText] = useState(() => {
//     try{
//       return ctxStudyNotes ? (JSON.parse(ctxStudyNotes).strophes[stropheId].text ?? "") : "";
//     } catch {
//       return "";
//     }
//   });
//   const [title, setTitle] = useState(() => {
//     try{
//       return ctxStudyNotes ? (JSON.parse(ctxStudyNotes).strophes[stropheId].title ?? "") : "";
//     } catch {
//       return "";
//     }
//   })
//   useEffect(() => {
//     if (!ctxStudyNotes) {
//       const array = Array.from({ length: ctxPassageProps.stropheCount}, () => ({title: "", text: ""}))
//       ctxSetStudyNotes(JSON.stringify({ main: "", strophes: array }))
//     }
//   }, [])

//   useEffect(() => {
//     if (!ctxStudyNotes) return;
//     const currentJSON: StudyNotes = JSON.parse(ctxStudyNotes);
//     currentJSON.strophes[stropheId] = {title: title, text: text};
//     const updatedJSON: StudyNotes = currentJSON
//     const payload = JSON.stringify(updatedJSON);
//     ctxSetStudyNotes(payload);
//   }, [text, title, ctxSetStudyNotes])

//   const saveNow = useCallback(async (payload: string, { keepalive = false} = {}) => {
//     if (!ctxStudyId) return;

//     if (lastSavedPayloadRef.current === payload) return;

//     try {
//       const res = await fetch("/api/noteSync", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ studyId: ctxStudyId, text: payload }),
//         keepalive,
//       });

//       if (!res.ok) throw new Error("Save failed");
//       lastSavedPayloadRef.current = payload;
//       console.log("saved:", JSON.parse(payload).strophes[stropheId])
//     } catch (err) {
//       if (keepalive && typeof navigator !== "undefined" && "sendBeacon" in navigator) {
//         try {
//           const blob = new Blob(
//             [JSON.stringify({ studyId: ctxStudyId, text: payload })],
//             { type: "application/json" }
//           );
//           const ok = navigator.sendBeacon("/api/noteSync", blob);
//           if (ok) lastSavedPayloadRef.current = payload;
//           else console.error("Beacon failed");
//         } catch (e) {
//           console.error("Beacon error:", e);
//         }
//       } else {
//         console.error("Save error:", err)
//       }
//     }
//   }, [ctxStudyId])

//   useEffect(() => {
//      if (!ctxStudyNotes) return;
//     if (timeoutRef.current) clearTimeout(timeoutRef.current);
//     const currentJSON: StudyNotes= JSON.parse(ctxStudyNotes);
//     currentJSON.strophes[stropheId] = {title: title, text: text};
//     const updatedJSON: StudyNotes = currentJSON
//     const payload = JSON.stringify(updatedJSON);
//     pendingPayloadRef.current = payload;

//     timeoutRef.current = setTimeout(() => {
//       saveNow(payload, { keepalive: false });
//     }, 2000);

//     return () => {
//       if (timeoutRef.current) clearTimeout(timeoutRef.current);
//     };
//   }, [title, text, saveNow]);

//   useEffect(() => {
//      if (!ctxStudyNotes) return;
//     const flush = () => {
//       const payload = pendingPayloadRef.current;
//       if (!payload) return;
//       void saveNow(payload, { keepalive: true });
//     };

//     const onVisibility = () => {
//       if (document.visibilityState === "hidden") flush();
//     };
//     const onPageHide = () => flush();

//     document.addEventListener("visibilitychange", onVisibility);
//     document.addEventListener("pagehide", onPageHide);

//     return () => {
//       flush();
//       document.removeEventListener("visiblitychange", onVisibility);
//       document.removeEventListener("pagehide", onPageHide);
//     };
//   }, [saveNow]);

//   // useEffect(() => {
//     // const container = containerRef.current;
//     // const titlearea = titleRef.current;
//     // const textarea = textareaRef.current;
//     // if (!container || !titlearea || !textarea) return;
//     // // titlearea.style.lineHeight = "1.5"
//     // textarea.style.lineHeight = "1.5";
//     // const computeRows = () => {
//     // const containerComputedStyle = window.getComputedStyle(container);
//     // const titleComputedStyle = window.getComputedStyle(titlearea);
//     // const textComputedStyle = window.getComputedStyle(textarea);

//   //   }
//   // })
  
//   return (
//     <>
//     <div>
//       <textarea
//         // ref={titleareaRef}
//         rows={1}
//         // style={{width}}
//         value={title}
//         onChange={(e) => setTitle(e.target.value)}
//         placeholder="Your title here..."
//         className="resize-none w-full rounded border border-stroke bg-transparent px-5 py-1 font-bold text-lg text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
//       ></textarea>
//       <textarea
//         // ref={textareaRef}
//         // rows={stropheProps.lines.length * 1.458}
//         // rows={rows}
//         // style={{width}}
//         value={text}
//         onChange={(e) => setText(e.target.value)}
//         placeholder="Your notes here..."
//         className="resize-none w-full rounded border border-stroke bg-transparent px-5 py-4 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
//       ></textarea>
//     </div>
//     </>
//   )
// }

type StropheNote = { title: string; text: string };
type StudyNotes = { main: string; strophes: StropheNote[] };

export const StropheNotes = ({ stropheId }: { stropheId: number }) => {
  const { ctxStudyId, ctxStudyNotes, ctxSetStudyNotes, ctxPassageProps } = useContext(FormatContext);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingPayloadRef = useRef<string | null>(null);
  const lastSavedPayloadRef = useRef<string | null>(null);

  // 1) Ensure ctxStudyNotes exists once on mount
  useEffect(() => {
    if (!ctxStudyNotes) {
      const stropheCount = ctxPassageProps.stropheCount ?? 0;
      const array: StropheNote[] = Array.from({ length: stropheCount }, () => ({ title: "", text: "" }));
      ctxSetStudyNotes(JSON.stringify({ main: "", strophes: array }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally run once

  // 2) Local UI state that syncs from ctxStudyNotes when it changes
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");

  const hydratedRef = useRef<number | null>(null);

  // useEffect(() => {
  //   if (!ctxStudyNotes) return;
  //   try {
  //     const parsed = JSON.parse(ctxStudyNotes) as Partial<StudyNotes>;
  //     const s = Array.isArray(parsed?.strophes) ? parsed!.strophes![stropheId] : undefined;
  //     // Only update local state if different to avoid loops
  //     if ((s?.title ?? "") !== title) setTitle(s?.title ?? "");
  //     if ((s?.text ?? "") !== text) setText(s?.text ?? "");
  //   } catch {
  //     /* ignore */
  //   }
  // }, [ctxStudyNotes, stropheId]); // note: not depending on title/text here

  useEffect(() => {
  if (!ctxStudyNotes) return;

  // Only hydrate if this strophe hasn't been hydrated yet
  if (hydratedRef.current === stropheId) return;

  try {
    const parsed = JSON.parse(ctxStudyNotes) as Partial<StudyNotes>;
    const s = Array.isArray(parsed?.strophes) ? parsed!.strophes![stropheId] : undefined;
    setTitle(s?.title ?? "");
    setText(s?.text ?? "");
    hydratedRef.current = stropheId; // mark hydrated
  } catch {
    // ignore parse errors
  }
}, [ctxStudyNotes, stropheId]);

  // 3) Single debounced writer that:
  //    - reads the latest ctxStudyNotes,
  //    - ensures strophes exists & is long enough,
  //    - immutably updates the one element,
  //    - writes back only if the JSON actually changed.
  // const buildPayload = useCallback(() => {
  //   let parsed: StudyNotes = { main: "", strophes: [] };

  //   try {
  //     if (ctxStudyNotes) parsed = JSON.parse(ctxStudyNotes);
  //   } catch {
  //     /* fall back to default */
  //   }

  //   const strophes = Array.isArray(parsed.strophes) ? [...parsed.strophes] : [];
  //   while (strophes.length <= stropheId) strophes.push({ title: "", text: "" });

  //   const next: StudyNotes = {
  //     ...parsed,
  //     strophes: strophes.map((s, i) => (i === stropheId ? { title, text } : s)),
  //   };

  //   return JSON.stringify(next);
  // }, [ctxStudyNotes, stropheId, title, text]);

    const saveNow = useCallback(
    async (payload: string, { keepalive = false } = {}) => {
      if (!ctxStudyId) return;
      if (lastSavedPayloadRef.current === payload) return;

      try {
        const res = await fetch("/api/noteSync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ studyId: ctxStudyId, text: payload }),
          keepalive,
        });
        if (!res.ok) throw new Error("Save failed");
        lastSavedPayloadRef.current = payload;
        // optional: console.log("saved:", JSON.parse(payload).strophes[stropheId]);
        console.log(ctxStudyId);
      } catch (err) {
        if (keepalive && typeof navigator !== "undefined" && "sendBeacon" in navigator) {
          const blob = new Blob([JSON.stringify({ studyId: ctxStudyId, text: payload })], {
            type: "application/json",
          });
          const ok = navigator.sendBeacon("/api/noteSync", blob);
          if (ok) lastSavedPayloadRef.current = payload;
          else console.error("Beacon failed");
        } else {
          console.error("Save error:", err);
        }
      }
    },
    [ctxStudyId]
  );

  const buildPayload = useCallback(() => {
  let parsed: StudyNotes = { main: "", strophes: [] };
  try {
    if (ctxStudyNotes) parsed = JSON.parse(ctxStudyNotes);
  } catch {/* fall back */}

  const strophes = Array.isArray(parsed.strophes) ? [...parsed.strophes] : [];
  while (strophes.length <= stropheId) {
    strophes.push({ title: "", text: "" });
  }
  strophes[stropheId] = { title, text };

  const next: StudyNotes = { ...parsed, strophes };
  return JSON.stringify(next);
}, [ctxStudyNotes, stropheId, title, text]);

useEffect(() => {
  if (!ctxStudyNotes) return;

  if (timeoutRef.current) clearTimeout(timeoutRef.current);
  const payload = buildPayload();
  pendingPayloadRef.current = payload;

  // (Optional) Update context so other components see changes.
  // Guard to avoid useless updates:
  if (payload !== ctxStudyNotes) ctxSetStudyNotes(payload);

  timeoutRef.current = setTimeout(() => {
    saveNow(payload, { keepalive: false });
  }, 2000);

  return () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };
}, [buildPayload, ctxStudyNotes, ctxSetStudyNotes, saveNow]);

  // 4) Debounced local/remote write
  // useEffect(() => {
  //   if (!ctxStudyNotes) return;

  //   if (timeoutRef.current) clearTimeout(timeoutRef.current);

  //   const payload = buildPayload();
  //   pendingPayloadRef.current = payload;

  //   // Update context immediately so other components see fresh notes
  //   if (payload !== ctxStudyNotes) ctxSetStudyNotes(payload);

  //   timeoutRef.current = setTimeout(() => {
  //     saveNow(payload, { keepalive: false });
  //   }, 2000);

  //   return () => {
  //     if (timeoutRef.current) clearTimeout(timeoutRef.current);
  //   };
  // }, [buildPayload, ctxStudyNotes, ctxSetStudyNotes, saveNow]);

  // 5) Flush on hide/unload
  useEffect(() => {
    const flush = () => {
      const payload = pendingPayloadRef.current;
      if (!payload) return;
      void saveNow(payload, { keepalive: true });
    };

    const onVisibility = () => {
      if (document.visibilityState === "hidden") flush();
    };
    const onPageHide = () => flush();

    document.addEventListener("visibilitychange", onVisibility);
    document.addEventListener("pagehide", onPageHide);
    return () => {
      flush();
      document.removeEventListener("visibilitychange", onVisibility); // fixed typo
      document.removeEventListener("pagehide", onPageHide);
    };
  }, [saveNow]);

  return (
    <div>
      <textarea
        rows={1}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Your title here..."
        className="resize-none w-full rounded border border-stroke bg-transparent px-5 py-1 font-bold text-lg text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
      />
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Your notes here..."
        className="resize-none w-full rounded border border-stroke bg-transparent px-5 py-4 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
      />
    </div>
  );
};
