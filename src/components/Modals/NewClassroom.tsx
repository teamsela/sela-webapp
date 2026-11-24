'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

import { createClassroom } from '@/lib/classroomActions';
import { eventBus } from '@/lib/eventBus';

const NewClassroomModal = ({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: (arg: boolean) => void;
}) => {
  const router = useRouter();
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const close = () => {
    setOpen(false);
    setName('');
    setError(null);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Classroom name cannot be empty.');
      return;
    }
    setSaving(true);
    try {
      const result = await createClassroom(name);
      if (result.message || !result.id) {
        setError(result.message ?? 'Failed to create classroom.');
        return;
      }
      eventBus.emit('classroomsChanged', undefined);
      close();
      router.push('/dashboard/classroom/' + result.id);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed left-0 top-0 z-999999 flex h-full min-h-screen w-full items-center justify-center bg-black/90 px-4 py-5"
      onKeyDown={(e) => e.key === 'Escape' && close()}
    >
      <div className="w-full max-w-142.5 rounded-lg bg-white px-8 py-12 text-center dark:bg-boxdark md:px-17.5 md:py-15">
        <h3 className="pb-2 text-xl font-bold text-black dark:text-white sm:text-2xl">
          New Classroom
        </h3>
        <span className="mx-auto mb-6 inline-block h-1 w-22.5 rounded bg-primary"></span>
        <form onSubmit={onSubmit}>
          <input
            type="text"
            autoFocus
            maxLength={80}
            placeholder="Classroom name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border-[2px] border-primary bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary dark:bg-form-input dark:text-white"
          />
          <div className="-mx-3 my-10 flex flex-wrap gap-y-4">
            <div className="w-full px-3 2xsm:w-1/2">
              <button
                type="button"
                onClick={close}
                className="block w-full rounded border border-stroke bg-gray p-3 text-center font-medium text-black transition hover:border-meta-1 hover:bg-meta-1 hover:text-white dark:border-strokedark dark:bg-meta-4 dark:text-white dark:hover:border-meta-1 dark:hover:bg-meta-1"
              >
                Cancel
              </button>
            </div>
            <div className="w-full px-3 2xsm:w-1/2">
              <button
                type="submit"
                disabled={saving}
                className="block w-full rounded border border-primary bg-primary p-3 text-center font-medium text-white transition hover:bg-opacity-90 disabled:opacity-60"
              >
                {saving ? 'Creating…' : 'Create'}
              </button>
            </div>
          </div>
        </form>
        {error && (
          <div className="rounded-lg border border-red-400 bg-red-100 px-4 py-3 text-red-700">{error}</div>
        )}
      </div>
    </div>
  );
};

export default NewClassroomModal;
