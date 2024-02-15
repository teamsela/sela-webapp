import { Fragment, useRef, useState } from 'react'
import { IconPlus } from '@tabler/icons-react';

interface NewStudyModalProps {
    open: boolean;
    setOpen: (arg: boolean) => void;
}
export default function NewStudyModal({ open, setOpen }: NewStudyModalProps) {
    const cancelButtonRef = useRef(null)
    const [studyName, setStudyName] = useState("");
    const [passage, setPassage] = useState("");
    const modal = useRef<any>(null);


    const onCancel = () => {
        setStudyName("");
        setPassage("");
        setOpen(false);
    }

    const onSubmit = () => {
        console.log(studyName);
        console.log(passage);
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
                <h3 className="text-base font-semibold leading-6 text-gray-900">
                    Create New Study
                </h3>
                <div className="mt-2">
                    <form>
                        <div className="sm:col-span-4">
                            <label htmlFor="newstudy" className="block text-sm font-medium leading-6 text-gray-900">
                                Study Name
                            </label>
                            <div className="mt-2">
                                <div className="flex rounded-md shadow-sm ring-1 ring-inset ring-gray-300 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-600 sm:max-w-md">
                                    <input
                                        type="text"
                                        name="newstudy"
                                        id="newstudy"
                                        autoComplete="newstudy"
                                        className="block flex-1 border-0 bg-transparent py-1.5 pl-1 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm sm:leading-6"
                                        placeholder="New Study"
                                        value={studyName}
                                        onChange={e => { setStudyName(e.target.value) }}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="sm:col-span-4">
                            <label htmlFor="passage" className="block text-sm font-medium leading-6 text-gray-900">
                                Passage
                            </label>
                            <div className="mt-2">
                                <div className="flex rounded-md shadow-sm ring-1 ring-inset ring-gray-300 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-600 sm:max-w-md">
                                    <input
                                        type="text"
                                        name="passage"
                                        id="passage"
                                        className="block flex-1 border-0 bg-transparent py-1.5 pl-1 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm sm:leading-6"
                                        placeholder="John 3:16-20"
                                        value={passage}
                                        onChange={e => { setPassage(e.target.value) }}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                            <button
                                type="button"
                                className="inline-flex w-full justify-center rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:ml-3 sm:w-auto"
                                onClick={() => { onSubmit() }}
                            >
                                Create New Study
                            </button>
                            <button
                                type="button"
                                className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                                onClick={() => onCancel()}
                                ref={cancelButtonRef}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>

    )
}