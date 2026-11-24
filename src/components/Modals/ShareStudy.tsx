'use client';

import { useEffect, useRef, useState } from 'react';
import { IconShare } from '@tabler/icons-react';

import { fetchStudySharing, updateStudySharing } from '@/lib/classroomActions';
import { ShareTarget, StudyData } from '@/lib/data';

type Flags = { public: boolean; model: boolean; scriptura: boolean };

const ShareStudyModal = ({ studyItem }: { studyItem: StudyData }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [targets, setTargets] = useState<ShareTarget[] | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [flags, setFlags] = useState<Flags>({ public: false, model: false, scriptura: false });
  const [isSysAdmin, setIsSysAdmin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const modal = useRef<HTMLDivElement>(null);

  const open = async () => {
    setModalOpen(true);
    setTargets(null);
    setError(null);
    try {
      const result = await fetchStudySharing(studyItem.id);
      if (!result) {
        setTargets([]);
        setError('You can only share your own studies.');
        return;
      }
      setIsSysAdmin(result.isSysAdmin);
      setFlags({ public: result.public, model: result.model, scriptura: result.scriptura });
      setTargets(result.classrooms);
      setSelected(new Set(result.classrooms.filter((t) => t.shared).map((t) => t.id)));
    } catch (e) {
      setTargets([]);
      setError('Failed to load sharing settings.');
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
      const result = await updateStudySharing(studyItem.id, {
        public: flags.public,
        ...(isSysAdmin ? { model: flags.model, scriptura: flags.scriptura } : {}),
        classroomIds: Array.from(selected),
      });
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
      <button className="hover:text-primary" title="Share" onClick={open}>
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

            <div className="mb-6 rounded-sm border border-stroke text-left dark:border-strokedark">
              <div className="bg-gray-2 py-4 px-4 font-medium text-black dark:bg-meta-4 dark:text-white">Share as</div>
              {targets === null ? (
                <div className="py-5 px-4 text-center">Loading…</div>
              ) : (
                <>
                  <FlagRow
                    label="Public"
                    hint="Anyone with the link can view this study."
                    checked={flags.public}
                    onChange={(v) => setFlags((f) => ({ ...f, public: v }))}
                  />
                  {isSysAdmin && (
                    <>
                      <FlagRow
                        label="Pre-Marked Study"
                        hint="Listed on the Pre-Marked Studies page."
                        checked={flags.model}
                        onChange={(v) => setFlags((f) => ({ ...f, model: v }))}
                      />
                      <FlagRow
                        label="Scriptura Study"
                        hint="Listed on the Scriptura Studies page."
                        checked={flags.scriptura}
                        onChange={(v) => setFlags((f) => ({ ...f, scriptura: v }))}
                      />
                    </>
                  )}
                </>
              )}
            </div>

            <div className="max-h-[40vh] overflow-y-auto rounded-sm border border-stroke text-left dark:border-strokedark">
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
                  disabled={saving || !targets}
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

const FlagRow = ({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) => (
  <label className="flex cursor-pointer items-center gap-4 border-t border-[#eee] py-4 px-4 hover:bg-gray-2 dark:border-strokedark dark:hover:bg-meta-4">
    <input
      type="checkbox"
      aria-label={`Share as ${label}`}
      className="h-4 w-4 cursor-pointer accent-primary"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
    />
    <span>
      <span className="block font-medium text-black dark:text-white">{label}</span>
      <span className="block text-sm">{hint}</span>
    </span>
  </label>
);

export default ShareStudyModal;
