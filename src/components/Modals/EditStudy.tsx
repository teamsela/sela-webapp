'use client';

import { useState, useEffect, useRef } from "react";
import { IconEdit } from "@tabler/icons-react";
import { useFormState, useFormStatus } from "react-dom";
import { State, updateStudyNameWithForm } from '@/lib/actions';

const EditStudyModal = ({
  studyId,
  studyName,
  setTriggerFetch
}: {
  studyId: string;
  studyName: string;
  setTriggerFetch: (arg: boolean) => void;
} ) => {

  const initialState = { message: null, errors: {} };
  const updateStudyNameWithId = updateStudyNameWithForm.bind(null, studyId);
  const [state, dispatch] = useFormState<State, FormData>(updateStudyNameWithId, initialState);

  const [modalOpen, setModalOpen] = useState(false);

  const trigger = useRef<any>(null);
  const modal = useRef<any>(null);

  return (
    <>
      <button 
        className="hover:text-primary"
        ref={trigger}
        onClick={() => {
            setModalOpen(true);
        }} >
        <IconEdit />
      </button>

      <div
        className={`fixed left-0 top-0 z-999999 flex h-full min-h-screen w-full items-center justify-center bg-black/90 px-4 py-5 ${
          modalOpen ? "block" : "hidden"
        }`}
      >
        <div
          ref={modal}
          onFocus={() => setModalOpen(true)}
          className="w-full max-w-142.5 rounded-lg bg-white px-8 py-12 text-center dark:bg-boxdark md:px-17.5 md:py-15"
        >
          <h3 className="pb-2 text-xl font-bold text-black dark:text-white sm:text-2xl">
            Rename to
          </h3>
          <span className="mx-auto mb-6 inline-block h-1 w-22.5 rounded bg-primary"></span>
            <form action={dispatch}>
              <input type="hidden" name="id" value={studyId} />  
              <input
                type="text"
                min={2}
                max={50}
                defaultValue={studyName}
                name="name"
                id="name"
                className="w-full rounded-lg border-[2px] border-primary bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:bg-form-input dark:text-white"
              />

              <div className="-mx-3 my-10 flex flex-wrap gap-y-4">
                <div className="w-full px-3 2xsm:w-1/2">
                  <button type="reset"
                    onClick={() => {
                      setModalOpen(false);
                    }}
                    className="block w-full rounded border border-stroke bg-gray p-3 text-center font-medium text-black transition hover:border-meta-1 hover:bg-meta-1 hover:text-white dark:border-strokedark dark:bg-meta-4 dark:text-white dark:hover:border-meta-1 dark:hover:bg-meta-1"
                  >
                  Cancel
                  </button>
                </div>
                <div className="w-full px-3 2xsm:w-1/2">
                  <button type="submit"
                    onClick={() => { setModalOpen(false); setTriggerFetch(true); }}
                    className="block w-full rounded border border-primary bg-primary p-3 text-center font-medium text-white transition hover:bg-opacity-90"
                  >
                  OK
                  </button>
                </div>
              </div>
            </form>
        </div>
      </div>
    </>
  );
};

export default EditStudyModal;
