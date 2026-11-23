'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import ClassroomManager from "@/components/Classroom/ClassroomManager";
import { createClassroom, fetchAllClassrooms, fetchClassroomDetails } from '@/lib/classroomActions';
import { ClassroomDetails, ClassroomOverview } from '@/lib/data';
import { eventBus } from '@/lib/eventBus';

const inputClass =
  "w-full rounded border-[1.5px] border-stroke bg-transparent px-4 py-2.5 text-black outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white";
const cell = "border-b border-[#eee] py-4 px-4 dark:border-strokedark";

// System admin console: every classroom, with create and full management.
export default function AdminClassrooms({ selectedId }: { selectedId: string | null }) {
  const router = useRouter();
  const [rooms, setRooms] = useState<ClassroomOverview[] | null>(null);
  const [filter, setFilter] = useState('');
  const [details, setDetails] = useState<ClassroomDetails | null>(null);

  const [newName, setNewName] = useState('');
  const [addSelf, setAddSelf] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const loadRooms = useCallback(() => {
    fetchAllClassrooms()
      .then((r) => setRooms(r ?? []))
      .catch((e) => { console.error('Failed to fetch classrooms:', e); setRooms([]); });
  }, []);

  const loadDetails = useCallback(() => {
    if (!selectedId) { setDetails(null); return; }
    fetchClassroomDetails(selectedId)
      .then(setDetails)
      .catch((e) => { console.error('Failed to fetch classroom:', e); setDetails(null); });
  }, [selectedId]);

  useEffect(() => { loadRooms(); }, [loadRooms]);
  useEffect(() => { loadDetails(); }, [loadDetails]);

  const refresh = () => { loadRooms(); loadDetails(); };

  const onCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return setCreateError('Classroom name cannot be empty.');
    setCreating(true);
    setCreateError(null);
    try {
      const result = await createClassroom(newName, addSelf);
      if (result.message || !result.id) return setCreateError(result.message ?? 'Failed to create classroom.');
      setNewName('');
      eventBus.emit('classroomsChanged', undefined);
      loadRooms();
      router.replace('/admin?classroom=' + result.id);
    } catch (err) {
      setCreateError((err as Error).message);
    } finally {
      setCreating(false);
    }
  };

  const visible = (rooms ?? []).filter((r) => r.name.toLowerCase().includes(filter.trim().toLowerCase()));

  return (
    <>
      <Breadcrumb pageName="System Admin" />

      <div className="flex flex-col gap-10">
        {/* Create */}
        <div className="rounded-sm border border-stroke bg-white px-5 py-6 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5">
          <h3 className="mb-4 text-lg font-semibold text-black dark:text-white">New Classroom</h3>
          <form onSubmit={onCreate} className="flex flex-col gap-3 md:flex-row md:items-center">
            <input className={inputClass + " md:max-w-md"} placeholder="Classroom name" maxLength={80}
              value={newName} onChange={(e) => setNewName(e.target.value)} />
            <label className="flex cursor-pointer items-center gap-2 whitespace-nowrap">
              <input type="checkbox" className="h-4 w-4 accent-primary" checked={addSelf} onChange={(e) => setAddSelf(e.target.checked)} />
              Make me an admin of it
            </label>
            <button type="submit" disabled={creating}
              className="rounded bg-primary px-5 py-2.5 font-medium text-white hover:bg-opacity-90 disabled:opacity-60">
              {creating ? 'Creating…' : 'Create'}
            </button>
          </form>
          {createError && <p className="mt-3 text-red-600">{createError}</p>}
        </div>

        {/* All classrooms */}
        <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-lg font-semibold text-black dark:text-white">All Classrooms ({rooms?.length ?? 0})</h3>
            <input className={inputClass + " sm:max-w-xs"} placeholder="Filter by name…" value={filter} onChange={(e) => setFilter(e.target.value)} />
          </div>
          <div className="max-w-full overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="bg-gray-2 text-left dark:bg-meta-4">
                  <th className="min-w-[200px] py-4 px-4 font-medium text-black dark:text-white">Name</th>
                  <th className="min-w-[220px] py-4 px-4 font-medium text-black dark:text-white">Admins</th>
                  <th className="py-4 px-4 font-medium text-black dark:text-white">Members</th>
                  <th className="py-4 px-4 font-medium text-black dark:text-white">Studies</th>
                  <th className="min-w-[120px] py-4 px-4 font-medium text-black dark:text-white">Created</th>
                  <th className="py-4 px-4"></th>
                </tr>
              </thead>
              <tbody>
                {rooms === null && <tr><td colSpan={6} className="py-5 text-center">Loading…</td></tr>}
                {rooms !== null && visible.length === 0 && (
                  <tr><td colSpan={6} className="py-5 text-center">{rooms.length ? 'No classroom matches.' : 'No classrooms yet.'}</td></tr>
                )}
                {visible.map((r) => (
                  <tr key={r.id}
                    onClick={() => router.replace('/admin?classroom=' + r.id)}
                    className={`cursor-pointer hover:bg-gray-2 dark:hover:bg-meta-4 ${r.id === selectedId ? 'bg-gray-2 dark:bg-meta-4' : ''}`}>
                    <td className={cell}><h5 className="font-medium text-black dark:text-white">{r.name}</h5></td>
                    <td className={cell}>
                      {r.admins.length ? r.admins.join(', ') : <span className="italic">none</span>}
                    </td>
                    <td className={cell}>{r.memberCount}</td>
                    <td className={cell}>{r.studyCount}</td>
                    <td className={cell}>{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : ''}</td>
                    <td className={cell + " text-right"}>
                      <Link href={'/dashboard/classroom/' + r.id} onClick={(e) => e.stopPropagation()}
                        className="text-sm font-medium text-primary hover:underline">
                        Open
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="py-3 text-sm">Select a classroom to manage its name, admins and members.</p>
        </div>

        {/* Selected */}
        {details && details.id === selectedId && (
          <ClassroomManager details={details} onChanged={refresh} afterDeleteHref="/admin" />
        )}
      </div>
    </>
  );
}
