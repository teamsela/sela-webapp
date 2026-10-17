'use client';

import { FormEvent, useEffect, useRef } from 'react'

const DeleteLayerModal = ({
  open,
  setOpen,
  layerName,
  onConfirm,
}: {
  open: boolean;
  setOpen: (arg: boolean) => void;
  layerName: string;
  onConfirm: () => void;
}) => {

  const modal = useRef<any>(null);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      onConfirm();
    } catch (e) {
      console.error(e);
    } finally {
      setOpen(false);
    }
  }

  // close if the esc key is pressed
  useEffect(() => {
    const keyHandler = ({ keyCode }: KeyboardEvent) => {
      if (!open || keyCode !== 27) return;
      setOpen(false);
    };
    document.addEventListener("keydown", keyHandler);
    return () => document.removeEventListener("keydown", keyHandler);
  });

  return (
    <div
      className={`fixed left-0 top-0 z-999999 flex h-full min-h-screen w-full items-center justify-center bg-black/90 px-4 py-5 ${
        open ? "block" : "hidden"
      }`}
    >
      <div
        ref={modal}
        className="w-full max-w-142.5 rounded-lg bg-white px-8 py-12 text-center dark:bg-boxdark md:px-17.5 md:py-15"
      >
        <span className="mx-auto inline-block">
          <svg
            width="60"
            height="60"
            viewBox="0 0 60 60"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect
              opacity="0.1"
              width="60"
              height="60"
              rx="30"
              fill="#DC2626"
            />
            <path
              d="M30 27.2498V29.9998V27.2498ZM30 35.4999H30.0134H30ZM20.6914 41H39.3086C41.3778 41 42.6704 38.7078 41.6358 36.8749L32.3272 20.3747C31.2926 18.5418 28.7074 18.5418 27.6728 20.3747L18.3642 36.8749C17.3296 38.7078 18.6222 41 20.6914 41Z"
              stroke="#DC2626"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <h3 className="mt-5.5 pb-2 text-xl font-bold text-black dark:text-white sm:text-2xl">
          &ldquo;{layerName}&rdquo;
        </h3>
        <p className="mb-10">
          Are you sure you want to delete this layer?
        </p>
        <form onSubmit={onSubmit}>
          <div className="-mx-3 flex flex-wrap gap-y-4">
            <div className="w-full px-3 2xsm:w-1/2">
              <button
                onClick={() => setOpen(false)}
                type="button"
                className="block w-full rounded border border-stroke bg-gray p-3 text-center font-medium text-black transition hover:border-meta-1 hover:bg-meta-1 hover:text-white dark:border-strokedark dark:bg-meta-4 dark:text-white dark:hover:border-meta-1 dark:hover:bg-meta-1"
              >
                Cancel
              </button>
            </div>
            <div className="w-full px-3 2xsm:w-1/2">
              <button type="submit"
                className="block w-full rounded border border-primary bg-primary p-3 text-center font-medium text-white transition hover:bg-opacity-90"
              >
                Delete
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DeleteLayerModal;
