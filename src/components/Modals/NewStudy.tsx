import { FormEvent, useEffect, useRef, useState } from 'react'
import { State, createStudy } from '@/lib/actions';


interface NewStudyModalProps {
    open: boolean;
    setOpen: (arg: boolean) => void;
}

export default function NewStudyModal({ open, setOpen }: NewStudyModalProps) {

    const [passage, setPassage] = useState('');
    const modal = useRef<any>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [error, setError] = useState<string | null>(null)

    const onCancel = () => {
        setPassage("");
        setOpen(false);
        setError(null);
    }

    // close if the esc key is pressed
    useEffect(() => {
      const keyHandler = ({ key }: KeyboardEvent) => {
        if (!open || key !== "Escape") return;
        setOpen(false);
      };
      document.addEventListener("keydown", keyHandler);
      return () => document.removeEventListener("keydown", keyHandler);
    });

    async function onSubmit(event: FormEvent<HTMLFormElement>) {

        event.preventDefault();
        setIsLoading(true);
        setError(null); // Clear previous errors when a new request starts
        const extracted = validate(passage);
        if (extracted instanceof Error) {
            setError(extracted.message);
            setIsLoading(false);
            return;
        } else {
            setOpen(false);
            setPassage('');
        }
        try {
            createStudy(passage);
        } catch (e) {
            // Capture the error message to display to the user
            setError((e as Error).message);
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    }

    function validate(verse: string): { /*book: string,*/ chapterStart: string, verseStart: string, chapterEnd?: string, verseEnd?: string } | Error {
        // Regular expression to match the pattern of a valid Bible verse
        const verseRegex = /^(?:(\d+)\s)?(\d+)(?::(\d+))?(?:-(\d+)(?::(\d+))?)?$/;

        const match = verse.match(verseRegex);
        if (!match) {
            return Error("Please enter Chapter:Verse[-Verse]. E.g., 23:1-4");
        }

        const [, , book, chapterStart, verseStart, chapterEnd, verseEnd] = match;

        if (parseInt(chapterStart) <= 0 || parseInt(verseStart) <= 0 || (verseEnd && parseInt(verseEnd) <= parseInt(verseStart))) {
            return Error("Invalid chapter or verse numbers.");

        }

        if (chapterEnd && parseInt(chapterEnd) < parseInt(chapterStart)) {
            return Error("Ending chapter number must be greater than or equal to starting chapter number.");
        }

        console.log(`Valid verse: ${book} ${chapterStart}:${verseStart}${verseEnd ? `-${chapterEnd}:${verseEnd}` : ''}`);
        return {
            /*book,*/
            chapterStart,
            verseStart,
            chapterEnd: chapterEnd || undefined,
            verseEnd: verseEnd || undefined
        };
    }



    return (
        <div
            className={`fixed left-0 top-0 z-999999 flex h-full min-h-screen w-full items-center justify-center bg-black/90 px-4 py-5 ${open ? "block" : "hidden"
                }`}
        >
            <div
                ref={modal}
                onFocus={() => setOpen(true)}
                className="w-full max-w-142.5 rounded-lg bg-white px-8 py-12 text-center dark:bg-boxdark md:px-17.5 md:py-15"
            >
                <h3 className="pb-2 text-xl font-bold text-black dark:text-white sm:text-2xl">
                    Start a study in Psalm...
                </h3>
                <span className="mx-auto mb-6 inline-block h-1 w-22.5 rounded bg-primary"></span>
                <form onSubmit={onSubmit}>
                    <input
                        type="text"
                        min={2}
                        max={50}
                        value={passage}
                        onChange={e => { setPassage(e.target.value) }}
                        name="passage"
                        id="passage"
                        placeholder="23:1-5"
                        className="w-full rounded-lg border-[2px] border-primary bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:bg-form-input dark:text-white"
                    />

                    <div className="-mx-3 my-10 flex flex-wrap gap-y-4">
                        <div className="w-full px-3 2xsm:w-1/2">
                            <button type="reset"
                                onClick={() => {
                                    onCancel();
                                }}
                                className="block w-full rounded border border-stroke bg-gray p-3 text-center font-medium text-black transition hover:border-meta-1 hover:bg-meta-1 hover:text-white dark:border-strokedark dark:bg-meta-4 dark:text-white dark:hover:border-meta-1 dark:hover:bg-meta-1"
                            >
                                Cancel
                            </button>
                        </div>
                        <div className="w-full px-3 2xsm:w-1/2">
                            <button type="submit"
                                className="block w-full rounded border border-primary bg-primary p-3 text-center font-medium text-white transition hover:bg-opacity-90"
                            >
                                {isLoading ? 'Loading...' : 'OK'}
                            </button>
                        </div>
                    </div>
                </form>
                {error ?
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative">
                        <span className="block sm:inline">{error}</span>
                        <span className="absolute top-0 bottom-0 right-0 px-4 py-3">
                            <button onClick={()=>{setError(null)}}>
                                <svg className="fill-current h-6 w-6 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><title>Close</title><path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z" /></svg>
                            </button>
                        </span>
                    </div> : <div></div>
                }
            </div>
     </div>

    )
}

