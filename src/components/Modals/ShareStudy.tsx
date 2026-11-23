'use client';

import { useEffect, useRef, useState } from 'react';
import { IconShare } from '@tabler/icons-react';

import { fetchShareTargets, updateStudyClassrooms } from '@/lib/classroomActions';
import { ShareTarget, StudyData } from '@/lib/data';

const ShareStudyModal = ({ studyItem }: { studyItem: StudyData }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [targets, setTargets] = useState<ShareTarget[] | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const modal = useRef<HTMLDivElement>(null);

  const open = async () => {
    setModalOpen(true);
    setTargets(null);
    setError(null);
    try {
      const result = await fetchShareTargets(studyItem.id);
      setTargets(result);
      setSelected(new Set(result.filter((t) => t.shared).map((t) => t.id)));
    } catch (e) {
      setTargets([]);
      setError('Failed to load classrooms.');
    }
  };

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const onConfirm = async () => {
    setSaving(true);
    try {
      const result = await updateStudyClassrooms(studyItem.id, Array.from(selected));
      if (result.message) {
        setError(result.message);
        return;
      }
      setModalOpen(false);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  // close if the esc key is pressed
  useEffect(() => {
    const keyHandler = (e: KeyboardEvent) => {
      if (modalOpen && e.key === 'Escape') setModalOpen(false);
    };
    document.addEventListener('keydown', keyHandler);
    return () => document.removeEventListener('keydown', keyHandler);
  }, [modalOpen]);

  const allSelected = !!targets && targets.length > 0 && targets.every((t) => selected.has(t.id));

  return (
    <>
      <button className="hover:text-primary" title="Share to classrooms" onClick={open}>
        <IconShare />
      </button>

      {modalOpen && (
        <div
          className="fixed left-0 top-0 z-999999 flex h-full min-h-screen w-full items-center justify-center bg-black/90 px-4 py-5"
          onClick={(e) => {
            if (modal.current && !modal.current.contains(e.target as Node)) setModalOpen(false);
          }}
        >
          <div
            ref={modal}
            className="w-full max-w-180 rounded-lg bg-white px-6 py-10 text-center dark:bg-boxdark md:px-12"
          >
            <h3 className="pb-2 text-xl font-bold text-black dark:text-white sm:text-2xl">
              Share &ldquo;{studyItem.name}&rdquo;
            </h3>
            <span className="mx-auto mb-6 inline-block h-1 w-22.5 rounded bg-primary"></span>

            <div className="max-h-[50vh] overflow-y-auto rounded-sm border border-stroke text-left dark:border-strokedark">
              <table className="w-full table-auto">
                <thead>
                  <tr className="bg-gray-2 text-left dark:bg-meta-4">
                    <th className="w-12 py-4 px-4">
                      <input
                        type="checkbox"
                        aria-label="Select all classrooms"
                        className="h-4 w-4 cursor-pointer accent-primary"
                        checked={allSelected}
                        disabled={!targets || targets.length === 0}
                        onChange={() =>
                          setSelected(allSelected ? new Set() : new Set((targets ?? []).map((t) => t.id)))
                        }
                      />
                    </th>
                    <th className="py-4 px-4 font-medium text-black dark:text-white">Classroom</th>
                  </tr>
                </thead>
                <tbody>
                  {targets === null && (
                    <tr><td colSpan={2} className="py-5 px-4 text-center">Loading…</td></tr>
                  )}
                  {targets?.length === 0 && (
                    <tr>
                      <td colSpan={2} className="py-5 px-4 text-center">
                        You are not a member of any classroom yet.
                      </td>
                    </tr>
                  )}
                  {targets?.map((t) => (
                    <tr key={t.id} className="cursor-pointer hover:bg-gray-2 dark:hover:bg-meta-4" onClick={() => toggle(t.id)}>
                      <td className="border-b border-[#eee] py-4 px-4 dark:border-strokedark">
                        <input
                          type="checkbox"
                          aria-label={`Share to ${t.name}`}
                          className="h-4 w-4 cursor-pointer accent-primary"
                          checked={selected.has(t.id)}
                          onChange={() => toggle(t.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </td>
                      <td className="border-b border-[#eee] py-4 px-4 dark:border-strokedark">
                        <h5 className="font-medium text-black dark:text-white">{t.name}</h5>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="-mx-3 mt-8 flex flex-wrap gap-y-4">
              <div className="w-full px-3 2xsm:w-1/2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="block w-full rounded border border-stroke bg-gray p-3 text-center font-medium text-black transition hover:border-meta-1 hover:bg-meta-1 hover:text-white dark:border-strokedark dark:bg-meta-4 dark:text-white dark:hover:border-meta-1 dark:hover:bg-meta-1"
                >
                  Cancel
                </button>
              </div>
              <div className="w-full px-3 2xsm:w-1/2">
                <button
                  type="button"
                  onClick={onConfirm}
                  disabled={saving || !targets || targets.length === 0}
                  className="block w-full rounded border border-primary bg-primary p-3 text-center font-medium text-white transition hover:bg-opacity-90 disabled:opacity-60"
                >
                  {saving ? 'Saving…' : 'Confirm'}
                </button>
              </div>
            </div>
            {error && (
              <div className="mt-6 rounded-lg border border-red-400 bg-red-100 px-4 py-3 text-red-700">{error}</div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default ShareStudyModal;
