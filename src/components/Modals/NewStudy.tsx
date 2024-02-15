import { Fragment, useRef, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'

interface NewStudyModalProps {
    open: boolean;
    setOpen: (arg: boolean) => void;
}
export default function NewStudyModal({ open, setOpen }: NewStudyModalProps) {
    const cancelButtonRef = useRef(null)
    const [studyName, setStudyName] = useState("");
    const [passage, setPassage] = useState("");

    const onCancel = () =>{
        setStudyName("");
        setPassage("");
        setOpen(false);
    }

    const onSubmit= () =>{
        console.log(studyName);
        console.log(passage);
    }

    return (
        <Transition.Root show={open} as={Fragment}>
            <Dialog as="div" className="relative z-10" initialFocus={cancelButtonRef} onClose={setOpen}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
                </Transition.Child>

                <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
                    <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                            enterTo="opacity-100 translate-y-0 sm:scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                        >
                            <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
                                <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                                    <div className="sm:flex sm:items-start">
                                        <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                                            <Dialog.Title as="h3" className="text-base font-semibold leading-6 text-gray-900">
                                                Create New Study
                                            </Dialog.Title>
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
                                                                    value = {studyName}
                                                                    onChange = {e => {setStudyName(e.target.value)}}
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
                                                                    value = {passage}
                                                                    onChange = {e => {setPassage(e.target.value)}}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                                                        <button
                                                            type="button"
                                                            className="inline-flex w-full justify-center rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:ml-3 sm:w-auto"
                                                            onClick={() => {onSubmit()}}
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
                                </div>

                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    )
}